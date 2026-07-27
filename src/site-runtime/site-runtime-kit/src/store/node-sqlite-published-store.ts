import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { randomUUID } from 'node:crypto'
import type { DatabaseSync as DatabaseSyncType } from 'node:sqlite'

import type {
  CapabilityRegistrationClaim,
  CapabilityRegistrationClaimCompletion,
  CapabilityRegistrationClaimInput,
  CapabilityRegistrationClaimRelease,
  CapabilityRegistrationGenerationObservation,
  GetPublishedResourceBySlugQuery,
  GetPublishedResourceQuery,
  HistoricalAliasNamespace,
  HistoricalAliasResolution,
  ListPublishedResourcesQuery,
  LocalPublishedStore,
  PublicationCommit,
  PublishState,
  RemotePublishObservation,
  ResolveHistoricalAliasQuery,
  SiteExposurePublication,
  SnapshotReplacement,
  StoredCapabilityRegistrationState,
  StoredPublishedResource,
  SyncRunCompletion,
  SyncRunStart,
  StoredSyncRun
} from '../types'
import { normalizeDynamicSlug } from '../types'
import { requireCanonicalUint64Decimal } from '../client/internal-contract-codec'

export interface NodeSqlitePublishedStoreOptions {
  path: string
}

type Row = Record<string, unknown>

// NodeSqlitePublishedStore persists runtime metadata and public views in a local SQLite database.
export class NodeSqlitePublishedStore implements LocalPublishedStore {
  private database: DatabaseSyncType | null = null

  constructor(private readonly options: NodeSqlitePublishedStoreOptions) {}

  // init opens SQLite and creates the P1 runtime schema if it does not exist.
  async init(): Promise<void> {
    if (this.database) {
      return
    }
    mkdirSync(dirname(this.options.path), { recursive: true })
    const { DatabaseSync } = require('node:sqlite') as typeof import('node:sqlite')
    this.database = new DatabaseSync(this.options.path)
    this.db.exec(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS publish_state (
        site_id TEXT PRIMARY KEY,
        local_publish_version INTEGER NOT NULL,
        latest_sync_id TEXT,
        last_successful_sync_at TEXT,
        last_known_remote_publish_version INTEGER,
        updated_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS sync_runs (
        run_id TEXT PRIMARY KEY,
        site_id TEXT NOT NULL,
        trigger TEXT NOT NULL,
        from_publish_version INTEGER NOT NULL,
        to_publish_version INTEGER,
        status TEXT NOT NULL,
        started_at TEXT NOT NULL,
        completed_at TEXT,
        local_publish_version INTEGER,
        error_code TEXT,
        error_message TEXT
      );
      CREATE TABLE IF NOT EXISTS webhook_events (
        site_id TEXT NOT NULL,
        event_id TEXT NOT NULL,
        nonce TEXT NOT NULL,
        received_at TEXT NOT NULL,
        PRIMARY KEY (site_id, event_id)
      );
      CREATE UNIQUE INDEX IF NOT EXISTS ux_webhook_events_nonce ON webhook_events(site_id, nonce);
      CREATE TABLE IF NOT EXISTS webhook_nonces (
        site_id TEXT NOT NULL,
        nonce TEXT NOT NULL,
        seen_at TEXT NOT NULL,
        PRIMARY KEY (site_id, nonce)
      );
      CREATE TABLE IF NOT EXISTS published_resources (
        site_id TEXT NOT NULL,
        resource_type TEXT NOT NULL,
        resource_id TEXT NOT NULL,
        slug TEXT NOT NULL,
        locale TEXT NOT NULL,
        status TEXT NOT NULL,
        publish_version INTEGER NOT NULL,
        payload_json TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        PRIMARY KEY (site_id, resource_type, resource_id, locale)
      );
      CREATE UNIQUE INDEX IF NOT EXISTS ux_published_resources_slug
        ON published_resources(site_id, resource_type, locale, slug);
      CREATE INDEX IF NOT EXISTS ix_published_resources_read
        ON published_resources(site_id, resource_type, locale, status, publish_version);
      CREATE TABLE IF NOT EXISTS historical_slug_aliases (
        site_id TEXT NOT NULL,
        namespace TEXT NOT NULL,
        locale TEXT NOT NULL,
        normalized_slug TEXT NOT NULL,
        resource_type TEXT NOT NULL,
        resource_id TEXT NOT NULL,
        PRIMARY KEY (site_id, namespace, locale, normalized_slug)
      );
      CREATE INDEX IF NOT EXISTS ix_historical_slug_aliases_resource
        ON historical_slug_aliases(site_id, resource_type, resource_id, locale);
      CREATE TABLE IF NOT EXISTS site_exposure_publications (
        site_id TEXT PRIMARY KEY,
        publish_version INTEGER NOT NULL,
        default_locale TEXT NOT NULL,
        active_locales_json TEXT NOT NULL,
        pages_json TEXT NOT NULL,
        published_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS capability_registration_state (
        site_id TEXT NOT NULL,
        client_id TEXT NOT NULL,
        manifest_hash TEXT NOT NULL,
        idempotency_key TEXT NOT NULL,
        response_json TEXT,
        claim_generation INTEGER NOT NULL DEFAULT 0,
        claim_token TEXT,
        claim_expires_at_ms INTEGER,
        remote_registration_generation TEXT NOT NULL DEFAULT '0',
        expected_registration_generation TEXT NOT NULL DEFAULT '0',
        idempotency_key_terminal INTEGER NOT NULL DEFAULT 0,
        updated_at TEXT NOT NULL,
        PRIMARY KEY (site_id, client_id)
      );
    `)
    this.ensureColumn(
      'capability_registration_state',
      'claim_generation',
      'INTEGER NOT NULL DEFAULT 0'
    )
    this.ensureColumn('capability_registration_state', 'claim_token', 'TEXT')
    this.ensureColumn('capability_registration_state', 'claim_expires_at_ms', 'INTEGER')
    this.ensureColumn(
      'capability_registration_state',
      'remote_registration_generation',
      "TEXT NOT NULL DEFAULT '0'"
    )
    this.ensureColumn(
      'capability_registration_state',
      'expected_registration_generation',
      "TEXT NOT NULL DEFAULT '0'"
    )
    this.ensureColumn(
      'capability_registration_state',
      'idempotency_key_terminal',
      'INTEGER NOT NULL DEFAULT 0'
    )
    this.migrateCapabilityRegistrationStateIdentity()
    this.rebuildHistoricalAliasIndex()
  }

  // close releases the SQLite connection used by the runtime store.
  async close(): Promise<void> {
    this.database?.close()
    this.database = null
  }

  // getPublishState returns a default version-zero state until the first successful sync.
  async getPublishState(siteId: string): Promise<PublishState> {
    const row = this.db
      .prepare(
        `SELECT site_id, local_publish_version, latest_sync_id, last_successful_sync_at,
                last_known_remote_publish_version
           FROM publish_state WHERE site_id = ?`
      )
      .get(siteId) as Row | undefined

    if (!row) {
      return {
        siteId,
        localPublishVersion: 0,
        latestSyncId: null,
        lastSuccessfulSyncAt: null,
        lastKnownRemotePublishVersion: null
      }
    }

    return {
      siteId: row.site_id as string,
      localPublishVersion: Number(row.local_publish_version),
      latestSyncId: (row.latest_sync_id as string | null) ?? null,
      lastSuccessfulSyncAt: (row.last_successful_sync_at as string | null) ?? null,
      lastKnownRemotePublishVersion:
        row.last_known_remote_publish_version === null
          ? null
          : Number(row.last_known_remote_publish_version)
    }
  }

  // updatePublishState atomically upserts the runtime's latest local publish version.
  async updatePublishState(state: PublishState): Promise<void> {
    this.db
      .prepare(
        `INSERT INTO publish_state (
           site_id, local_publish_version, latest_sync_id, last_successful_sync_at,
           last_known_remote_publish_version, updated_at
         ) VALUES (?, ?, ?, ?, ?, ?)
         ON CONFLICT(site_id) DO UPDATE SET
           local_publish_version = excluded.local_publish_version,
           latest_sync_id = excluded.latest_sync_id,
           last_successful_sync_at = excluded.last_successful_sync_at,
           last_known_remote_publish_version = excluded.last_known_remote_publish_version,
           updated_at = excluded.updated_at`
      )
      .run(
        state.siteId,
        state.localPublishVersion,
        state.latestSyncId,
        state.lastSuccessfulSyncAt,
        state.lastKnownRemotePublishVersion,
        new Date().toISOString()
      )
  }

  // observeRemotePublishVersion records remote state only when the local publication CAS fence still matches.
  async observeRemotePublishVersion(observation: RemotePublishObservation): Promise<boolean> {
    if (
      !Number.isSafeInteger(observation.expectedLocalPublishVersion) ||
      observation.expectedLocalPublishVersion < 0 ||
      !Number.isSafeInteger(observation.remotePublishVersion) ||
      observation.remotePublishVersion < 0
    ) {
      throw new Error('Invalid remote publish observation')
    }
    const observedAt = new Date().toISOString()
    const update = this.db
      .prepare(
        `UPDATE publish_state
            SET last_known_remote_publish_version = ?, updated_at = ?
          WHERE site_id = ? AND local_publish_version = ?`
      )
      .run(
        observation.remotePublishVersion,
        observedAt,
        observation.siteId,
        observation.expectedLocalPublishVersion
      )
    if (Number(update.changes) > 0) {
      return true
    }
    if (observation.expectedLocalPublishVersion !== 0) {
      return false
    }
    const insert = this.db
      .prepare(
        `INSERT OR IGNORE INTO publish_state (
           site_id, local_publish_version, latest_sync_id, last_successful_sync_at,
           last_known_remote_publish_version, updated_at
         ) VALUES (?, 0, NULL, NULL, ?, ?)`
      )
      .run(observation.siteId, observation.remotePublishVersion, observedAt)
    return Number(insert.changes) > 0
  }

  // beginSyncRun records the start of a sync attempt before remote data is applied.
  async beginSyncRun(input: SyncRunStart): Promise<string> {
    const runId = randomUUID()
    this.db
      .prepare(
        `INSERT INTO sync_runs (
           run_id, site_id, trigger, from_publish_version, to_publish_version, status, started_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        runId,
        input.siteId,
        input.trigger,
        input.fromPublishVersion,
        input.toPublishVersion,
        'running',
        new Date().toISOString()
      )
    return runId
  }

  // completeSyncRun records the final sync status and any sanitized failure summary.
  async completeSyncRun(runId: string, completion: SyncRunCompletion): Promise<void> {
    this.db
      .prepare(
        `UPDATE sync_runs
            SET status = ?, completed_at = ?, local_publish_version = ?, error_code = ?, error_message = ?
          WHERE run_id = ?`
      )
      .run(
        completion.status,
        new Date().toISOString(),
        completion.localPublishVersion,
        completion.errorCode ?? null,
        completion.errorMessage ?? null,
        runId
      )
  }

  // getSyncRun reads a recorded sync attempt for audit and test verification.
  async getSyncRun(runId: string): Promise<StoredSyncRun | null> {
    const row = this.db.prepare(`SELECT * FROM sync_runs WHERE run_id = ?`).get(runId) as
      | Row
      | undefined
    return row
      ? {
          runId: row.run_id as string,
          siteId: row.site_id as string,
          trigger: row.trigger as string,
          fromPublishVersion: Number(row.from_publish_version),
          toPublishVersion: row.to_publish_version === null ? null : Number(row.to_publish_version),
          status: row.status as string,
          startedAt: row.started_at as string,
          completedAt: (row.completed_at as string | null) ?? null,
          localPublishVersion:
            row.local_publish_version === null ? null : Number(row.local_publish_version),
          errorCode: (row.error_code as string | null) ?? null,
          errorMessage: (row.error_message as string | null) ?? null
        }
      : null
  }

  // rememberWebhookEvent inserts a webhook event id once and returns false for duplicate events.
  async rememberWebhookEvent(siteId: string, eventId: string, nonce: string): Promise<boolean> {
    const result = this.db
      .prepare(
        `INSERT OR IGNORE INTO webhook_events (site_id, event_id, nonce, received_at)
         VALUES (?, ?, ?, ?)`
      )
      .run(siteId, eventId, nonce, new Date().toISOString())
    return Number(result.changes) > 0
  }

  // hasWebhookEvent checks whether a webhook event id has already been accepted.
  async hasWebhookEvent(siteId: string, eventId: string): Promise<boolean> {
    const row = this.db
      .prepare(`SELECT 1 AS found FROM webhook_events WHERE site_id = ? AND event_id = ?`)
      .get(siteId, eventId)
    return Boolean(row)
  }

  // hasWebhookNonce checks whether a webhook nonce has been seen in the replay window table.
  async hasWebhookNonce(siteId: string, nonce: string): Promise<boolean> {
    const row = this.db
      .prepare(`SELECT 1 AS found FROM webhook_nonces WHERE site_id = ? AND nonce = ?`)
      .get(siteId, nonce)
    return Boolean(row)
  }

  // rememberWebhookNonce stores a webhook nonce for local replay protection.
  async rememberWebhookNonce(siteId: string, nonce: string): Promise<void> {
    this.db
      .prepare(
        `INSERT OR IGNORE INTO webhook_nonces (site_id, nonce, seen_at)
         VALUES (?, ?, ?)`
      )
      .run(siteId, nonce, new Date().toISOString())
  }

  // upsertPublishedResources writes public view rows without advancing publish_state.
  async upsertPublishedResources(resources: StoredPublishedResource[]): Promise<void> {
    const statement = this.db.prepare(
      `INSERT INTO published_resources (
         site_id, resource_type, resource_id, slug, locale, status, publish_version, payload_json, updated_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(site_id, resource_type, resource_id, locale) DO UPDATE SET
         slug = excluded.slug,
         status = excluded.status,
         publish_version = excluded.publish_version,
         payload_json = excluded.payload_json,
         updated_at = excluded.updated_at`
    )
    this.transaction(() => {
      for (const resource of resources) {
        validateResource(resource)
        this.deleteHistoricalAliasesForResource(resource.siteId, resource)
      }
      for (const resource of resources) {
        statement.run(
          resource.siteId,
          resource.resourceType,
          resource.resourceId,
          resource.slug,
          resource.locale,
          resource.status,
          resource.publishVersion,
          resource.payloadJson,
          resource.updatedAt
        )
      }
      for (const resource of resources) {
        this.indexHistoricalAliases(resource)
      }
    })
  }

  // replaceSnapshot atomically rebuilds a site's local resources and advances publish_state only after success.
  async replaceSnapshot(input: SnapshotReplacement): Promise<void> {
    this.transaction(() => {
      for (const resource of input.resources) {
        validateResource(resource)
      }
      this.db.prepare(`DELETE FROM published_resources WHERE site_id = ?`).run(input.siteId)
      this.db.prepare(`DELETE FROM historical_slug_aliases WHERE site_id = ?`).run(input.siteId)
      const insert = this.db.prepare(
        `INSERT INTO published_resources (
           site_id, resource_type, resource_id, slug, locale, status, publish_version, payload_json, updated_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      for (const resource of input.resources) {
        insert.run(
          resource.siteId,
          resource.resourceType,
          resource.resourceId,
          resource.slug,
          resource.locale,
          resource.status,
          resource.publishVersion,
          resource.payloadJson,
          resource.updatedAt
        )
      }
      for (const resource of input.resources) {
        this.indexHistoricalAliases(resource)
      }
      this.db
        .prepare(
          `INSERT INTO publish_state (
             site_id, local_publish_version, latest_sync_id, last_successful_sync_at,
             last_known_remote_publish_version, updated_at
           ) VALUES (?, ?, ?, ?, ?, ?)
           ON CONFLICT(site_id) DO UPDATE SET
             local_publish_version = excluded.local_publish_version,
             last_successful_sync_at = excluded.last_successful_sync_at,
             last_known_remote_publish_version = excluded.last_known_remote_publish_version,
             updated_at = excluded.updated_at`
        )
        .run(
          input.siteId,
          input.publishVersion,
          null,
          new Date().toISOString(),
          input.publishVersion,
          new Date().toISOString()
        )
    })
  }

  // commitPublication atomically switches exposure, resources, removals, and publish state at one target version.
  async commitPublication(input: PublicationCommit): Promise<void> {
    this.transaction(() => {
      validatePublicationCommit(input)
      const current = this.db
        .prepare(`SELECT local_publish_version FROM publish_state WHERE site_id = ?`)
        .get(input.siteId) as Row | undefined
      const currentVersion = current ? Number(current.local_publish_version) : 0
      if (currentVersion !== input.expectedLocalPublishVersion) {
        throw new Error(
          `PUBLISH_VERSION_CONFLICT: expected ${input.expectedLocalPublishVersion}, found ${currentVersion}`
        )
      }

      if (input.mode === 'snapshot' || input.mode === 'rebuild') {
        this.db.prepare(`DELETE FROM published_resources WHERE site_id = ?`).run(input.siteId)
        this.db.prepare(`DELETE FROM historical_slug_aliases WHERE site_id = ?`).run(input.siteId)
      }
      const remove = this.db.prepare(
        `DELETE FROM published_resources
          WHERE site_id = ? AND resource_type = ? AND resource_id = ? AND locale = ?`
      )
      for (const resource of input.missingResources) {
        remove.run(input.siteId, resource.resourceType, resource.resourceId, resource.locale)
        this.deleteHistoricalAliasesForResource(input.siteId, resource)
      }
      if (input.mode === 'delta') {
        for (const resource of input.resources) {
          remove.run(input.siteId, resource.resourceType, resource.resourceId, resource.locale)
          this.deleteHistoricalAliasesForResource(input.siteId, resource)
        }
      }
      const conflictingSlug = this.db.prepare(
        `SELECT 1 AS found FROM published_resources
          WHERE site_id = ? AND resource_type = ? AND locale = ? AND slug = ?
          LIMIT 1`
      )
      for (const resource of input.resources) {
        if (conflictingSlug.get(input.siteId, resource.resourceType, resource.locale, resource.slug)) {
          throw new Error('PUBLIC_SLUG_CONFLICT: final publication contains a duplicate slug')
        }
      }
      const insert = this.db.prepare(
        `INSERT INTO published_resources (
           site_id, resource_type, resource_id, slug, locale, status, publish_version, payload_json, updated_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      for (const resource of input.resources) {
        insert.run(
          resource.siteId,
          resource.resourceType,
          resource.resourceId,
          resource.slug,
          resource.locale,
          resource.status,
          resource.publishVersion,
          resource.payloadJson,
          resource.updatedAt
        )
      }
      for (const resource of input.resources) {
        this.indexHistoricalAliases(resource)
      }
      this.db
        .prepare(
          `INSERT INTO site_exposure_publications (
             site_id, publish_version, default_locale, active_locales_json, pages_json, published_at
           ) VALUES (?, ?, ?, ?, ?, ?)
           ON CONFLICT(site_id) DO UPDATE SET
             publish_version = excluded.publish_version,
             default_locale = excluded.default_locale,
             active_locales_json = excluded.active_locales_json,
             pages_json = excluded.pages_json,
             published_at = excluded.published_at`
        )
        .run(
          input.exposure.siteId,
          input.exposure.publishVersion,
          input.exposure.defaultLocale,
          JSON.stringify(input.exposure.activeLocales),
          JSON.stringify(input.exposure.pages),
          input.exposure.publishedAt
        )
      const committedAt = new Date().toISOString()
      this.db
        .prepare(
          `INSERT INTO publish_state (
             site_id, local_publish_version, latest_sync_id, last_successful_sync_at,
             last_known_remote_publish_version, updated_at
           ) VALUES (?, ?, ?, ?, ?, ?)
           ON CONFLICT(site_id) DO UPDATE SET
             local_publish_version = excluded.local_publish_version,
             latest_sync_id = excluded.latest_sync_id,
             last_successful_sync_at = excluded.last_successful_sync_at,
             last_known_remote_publish_version = excluded.last_known_remote_publish_version,
             updated_at = excluded.updated_at`
        )
        .run(
          input.siteId,
          input.publishVersion,
          input.latestSyncId,
          committedAt,
          input.lastKnownRemotePublishVersion,
          committedAt
        )
    })
  }

  // getCapabilityRegistrationState restores the current manifest attempt across Runtime restarts.
  async getCapabilityRegistrationState(
    siteId: string,
    clientId: string
  ): Promise<StoredCapabilityRegistrationState | null> {
    const row = this.db
      .prepare(
        `SELECT * FROM capability_registration_state
          WHERE site_id = ? AND client_id = ?`
      )
      .get(siteId, clientId) as Row | undefined
    return row ? mapCapabilityRegistrationRow(row) : null
  }

  // saveCapabilityRegistrationState persists one retry-stable key and its latest public-safe response.
  async saveCapabilityRegistrationState(state: StoredCapabilityRegistrationState): Promise<void> {
    if (
      state.siteId.trim().length === 0 ||
      state.clientId.trim().length === 0 ||
      state.manifestHash.trim().length === 0 ||
      state.idempotencyKey.trim().length === 0
    ) {
      throw new Error('Invalid capability registration state')
    }
    if (state.responseJson !== null) {
      JSON.parse(state.responseJson)
    }
    requireCanonicalUint64Decimal(
      state.remoteRegistrationGeneration,
      'stored remote registration generation'
    )
    requireCanonicalUint64Decimal(
      state.expectedRegistrationGeneration,
      'stored expected registration generation'
    )
    this.db
      .prepare(
        `INSERT INTO capability_registration_state (
           site_id, client_id, manifest_hash, idempotency_key, response_json,
           claim_generation, claim_token, claim_expires_at_ms,
           remote_registration_generation, expected_registration_generation,
           idempotency_key_terminal, updated_at
         ) VALUES (?, ?, ?, ?, ?, ?, NULL, NULL, ?, ?, ?, ?)
         ON CONFLICT(site_id, client_id) DO UPDATE SET
           manifest_hash = excluded.manifest_hash,
           idempotency_key = excluded.idempotency_key,
           response_json = excluded.response_json,
           claim_generation = capability_registration_state.claim_generation + 1,
           claim_token = NULL,
           claim_expires_at_ms = NULL,
           remote_registration_generation = excluded.remote_registration_generation,
           expected_registration_generation = excluded.expected_registration_generation,
           idempotency_key_terminal = excluded.idempotency_key_terminal,
           updated_at = excluded.updated_at`
      )
      .run(
        state.siteId,
        state.clientId,
        state.manifestHash,
        state.idempotencyKey,
        state.responseJson,
        state.generation,
        state.remoteRegistrationGeneration,
        state.expectedRegistrationGeneration,
        state.idempotencyKeyTerminal ? 1 : 0,
        state.updatedAt
      )
  }

  // claimCapabilityRegistration atomically installs one generation/token fence for the current manifest.
  async claimCapabilityRegistration(
    input: CapabilityRegistrationClaimInput
  ): Promise<CapabilityRegistrationClaim> {
    validateCapabilityClaimIdentity(input)
    let result: CapabilityRegistrationClaim | undefined
    this.transaction(() => {
      const current = this.db
        .prepare(
          `SELECT * FROM capability_registration_state
            WHERE site_id = ? AND client_id = ?`
        )
        .get(input.siteId, input.clientId) as Row | undefined
      const currentState = current ? mapCapabilityRegistrationRow(current) : null
      if (
        currentState?.manifestHash === input.manifestHash &&
        currentState.idempotencyKeyTerminal
      ) {
        result = { claimed: false, state: currentState }
        return
      }
      const currentClaimExpiresAtMs =
        currentState?.claimExpiresAtMs === null || currentState?.claimExpiresAtMs === undefined
          ? null
          : currentState.claimExpiresAtMs
      if (
        currentState &&
        currentState.claimToken !== null &&
        currentClaimExpiresAtMs !== null &&
        input.claimedAtMs < currentClaimExpiresAtMs
      ) {
        result = { claimed: false, state: currentState }
        return
      }
      const sameManifest = currentState?.manifestHash === input.manifestHash
      const reusableIdempotencyKey =
        sameManifest && currentState?.idempotencyKeyTerminal === false
      const generation = currentState ? currentState.generation + 1 : 1
      const remoteRegistrationGeneration = currentState?.remoteRegistrationGeneration ?? '0'
      const idempotencyKey = reusableIdempotencyKey
        ? currentState.idempotencyKey
        : input.proposedIdempotencyKey
      const expectedRegistrationGeneration = reusableIdempotencyKey
        ? currentState.expectedRegistrationGeneration
        : remoteRegistrationGeneration
      const responseJson = reusableIdempotencyKey
        ? currentState.responseJson
        : null
      const claimExpiresAtMs = input.claimedAtMs + input.leaseDurationMs
      this.db
        .prepare(
          `INSERT INTO capability_registration_state (
             site_id, client_id, manifest_hash, idempotency_key, response_json,
             claim_generation, claim_token, claim_expires_at_ms,
             remote_registration_generation, expected_registration_generation,
             idempotency_key_terminal, updated_at
           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(site_id, client_id) DO UPDATE SET
             manifest_hash = excluded.manifest_hash,
             idempotency_key = excluded.idempotency_key,
             response_json = excluded.response_json,
             claim_generation = excluded.claim_generation,
             claim_token = excluded.claim_token,
             claim_expires_at_ms = excluded.claim_expires_at_ms,
             remote_registration_generation = excluded.remote_registration_generation,
             expected_registration_generation = excluded.expected_registration_generation,
             idempotency_key_terminal = excluded.idempotency_key_terminal,
             updated_at = excluded.updated_at`
        )
        .run(
          input.siteId,
          input.clientId,
          input.manifestHash,
          idempotencyKey,
          responseJson,
          generation,
          input.claimToken,
          claimExpiresAtMs,
          remoteRegistrationGeneration,
          expectedRegistrationGeneration,
          0,
          input.updatedAt
        )
      result = {
        claimed: true,
        state: {
          siteId: input.siteId,
          clientId: input.clientId,
          manifestHash: input.manifestHash,
          idempotencyKey,
          responseJson,
          generation,
          claimToken: input.claimToken,
          claimExpiresAtMs,
          remoteRegistrationGeneration,
          expectedRegistrationGeneration,
          idempotencyKeyTerminal: false,
          updatedAt: input.updatedAt
        }
      }
    })
    return result!
  }

  // completeCapabilityRegistrationClaim saves a response only while generation and token still own the claim.
  async completeCapabilityRegistrationClaim(
    input: CapabilityRegistrationClaimCompletion
  ): Promise<boolean> {
    validateCapabilityClaimIdentity(input)
    JSON.parse(input.responseJson)
    const remoteRegistrationGeneration = requireCanonicalUint64Decimal(
      input.remoteRegistrationGeneration,
      'remote registration generation'
    )
    let completed = false
    this.transaction(() => {
      const current = this.db
        .prepare(
          `SELECT * FROM capability_registration_state
            WHERE site_id = ? AND client_id = ? AND manifest_hash = ?
              AND claim_generation = ? AND claim_token = ?`
        )
        .get(
          input.siteId,
          input.clientId,
          input.manifestHash,
          input.generation,
          input.claimToken
        ) as
        | Row
        | undefined
      if (!current) {
        return
      }
      const observedGeneration = maxUint64Decimal(
        String(current.remote_registration_generation ?? '0'),
        remoteRegistrationGeneration
      )
      const completion = this.db
        .prepare(
          `UPDATE capability_registration_state
              SET response_json = ?, remote_registration_generation = ?,
                  idempotency_key_terminal = ?, claim_token = NULL,
                  claim_expires_at_ms = NULL, updated_at = ?
            WHERE site_id = ? AND client_id = ? AND manifest_hash = ?
              AND claim_generation = ? AND claim_token = ?`
        )
        .run(
          input.responseJson,
          observedGeneration,
          input.idempotencyKeyTerminal ? 1 : 0,
          input.updatedAt,
          input.siteId,
          input.clientId,
          input.manifestHash,
          input.generation,
          input.claimToken
        )
      completed = Number(completion.changes) > 0
    })
    return completed
  }

  // releaseCapabilityRegistrationClaim clears only the matching failed claim without touching a newer manifest.
  async releaseCapabilityRegistrationClaim(
    input: CapabilityRegistrationClaimRelease
  ): Promise<boolean> {
    validateCapabilityClaimIdentity(input)
    const release = this.db
      .prepare(
        `UPDATE capability_registration_state
            SET claim_token = NULL, claim_expires_at_ms = NULL, updated_at = ?
          WHERE site_id = ? AND client_id = ? AND manifest_hash = ?
            AND claim_generation = ? AND claim_token = ?`
      )
      .run(
        input.updatedAt,
        input.siteId,
        input.clientId,
        input.manifestHash,
        input.generation,
        input.claimToken
      )
    return Number(release.changes) > 0
  }

  // observeCapabilityRegistrationGeneration monotonically records a fenced server generation observation.
  async observeCapabilityRegistrationGeneration(
    input: CapabilityRegistrationGenerationObservation
  ): Promise<boolean> {
    if (input.siteId.trim().length === 0 || input.clientId.trim().length === 0) {
      throw new Error('Invalid capability registration stream identity')
    }
    const remoteRegistrationGeneration = requireCanonicalUint64Decimal(
      input.remoteRegistrationGeneration,
      'remote registration generation observation'
    )
    let observed = false
    this.transaction(() => {
      const current = this.db
        .prepare(
          `SELECT * FROM capability_registration_state
            WHERE site_id = ? AND client_id = ?`
        )
        .get(input.siteId, input.clientId) as Row | undefined
      if (!current) {
        return
      }
      const currentGeneration = String(current.remote_registration_generation ?? '0')
      const nextGeneration = maxUint64Decimal(
        currentGeneration,
        remoteRegistrationGeneration
      )
      if (nextGeneration === currentGeneration) {
        observed = true
        return
      }
      const update = this.db
        .prepare(
          `UPDATE capability_registration_state
              SET remote_registration_generation = ?, updated_at = ?
            WHERE site_id = ? AND client_id = ?`
        )
        .run(nextGeneration, new Date().toISOString(), input.siteId, input.clientId)
      observed = Number(update.changes) > 0
    })
    return observed
  }

  // getSiteExposurePublication returns only the exposure state committed alongside local publish_state.
  async getSiteExposurePublication(siteId: string): Promise<SiteExposurePublication | null> {
    const row = this.db
      .prepare(`SELECT * FROM site_exposure_publications WHERE site_id = ?`)
      .get(siteId) as Row | undefined
    if (!row) {
      return null
    }
    return {
      siteId: row.site_id as string,
      publishVersion: Number(row.publish_version),
      defaultLocale: row.default_locale as string,
      activeLocales: JSON.parse(row.active_locales_json as string) as string[],
      pages: JSON.parse(row.pages_json as string) as SiteExposurePublication['pages'],
      publishedAt: row.published_at as string
    }
  }

  // getPublishedResource resolves one committed resource identity without applying locale fallback.
  async getPublishedResource(query: GetPublishedResourceQuery): Promise<StoredPublishedResource | null> {
    const row = this.db
      .prepare(
        `SELECT * FROM published_resources
          WHERE site_id = ? AND resource_type = ? AND resource_id = ? AND locale = ?
          LIMIT 1`
      )
      .get(query.siteId, query.resourceType, query.resourceId, query.locale) as Row | undefined
    return row ? mapResourceRow(row) : null
  }

  // listPublishedResources returns a stable ordered page of local public resources.
  async listPublishedResources(query: ListPublishedResourcesQuery): Promise<{
    items: StoredPublishedResource[]
    nextCursor: string | null
  }> {
    const clauses = ['site_id = ?', 'resource_type = ?']
    const params: Array<string | number> = [query.siteId, query.resourceType]
    if (query.locale) {
      clauses.push('locale = ?')
      params.push(query.locale)
    }
    if (query.status) {
      clauses.push('status = ?')
      params.push(query.status)
    }
    if (query.cursor) {
      clauses.push('slug > ?')
      params.push(query.cursor)
    }
    const limit = Math.min(Math.max(query.limit ?? 50, 1), 200)
    const rows = this.db
      .prepare(
        `SELECT * FROM published_resources
          WHERE ${clauses.join(' AND ')}
          ORDER BY slug ASC
          LIMIT ?`
      )
      .all(...params, limit + 1) as Row[]
    const pageRows = rows.slice(0, limit)
    return {
      items: pageRows.map(mapResourceRow),
      nextCursor: rows.length > limit ? String(pageRows[pageRows.length - 1]?.slug) : null
    }
  }

  // getPublishedResourceBySlug resolves a single local public resource by slug and locale.
  async getPublishedResourceBySlug(
    query: GetPublishedResourceBySlugQuery
  ): Promise<StoredPublishedResource | null> {
    const clauses = [
      'site_id = ?',
      'resource_type = ?',
      'slug = ?',
      'locale = ?'
    ]
    const params: Array<string | number> = [
      query.siteId,
      query.resourceType,
      query.slug,
      query.locale
    ]
    if (query.status) {
      clauses.push('status = ?')
      params.push(query.status)
    }
    const row = this.db
      .prepare(`SELECT * FROM published_resources WHERE ${clauses.join(' AND ')} LIMIT 1`)
      .get(...params) as Row | undefined
    return row ? mapResourceRow(row) : null
  }

  // resolveHistoricalAlias follows one indexed historical key to the resource's current published canonical slug.
  async resolveHistoricalAlias(
    query: ResolveHistoricalAliasQuery
  ): Promise<HistoricalAliasResolution | null> {
    const normalizedSlug = normalizeDynamicSlug(query.slug)
    const row = this.db
      .prepare(
        `SELECT aliases.resource_type, aliases.resource_id, aliases.locale,
                resources.slug AS canonical_slug, exposure.active_locales_json
           FROM historical_slug_aliases aliases
           JOIN published_resources resources
             ON resources.site_id = aliases.site_id
            AND resources.resource_type = aliases.resource_type
            AND resources.resource_id = aliases.resource_id
            AND resources.locale = aliases.locale
            AND resources.status = 'published'
           JOIN site_exposure_publications exposure
             ON exposure.site_id = aliases.site_id
          WHERE aliases.site_id = ? AND aliases.namespace = ?
            AND aliases.locale = ? AND aliases.normalized_slug = ?
          LIMIT 1`
      )
      .get(query.siteId, query.namespace, query.locale, normalizedSlug) as Row | undefined
    if (!row) {
      return null
    }
    const activeLocales = JSON.parse(row.active_locales_json as string) as unknown
    if (!Array.isArray(activeLocales) || !activeLocales.includes(query.locale)) {
      return null
    }
    const canonicalSlug = row.canonical_slug as string
    if (normalizeDynamicSlug(canonicalSlug) === normalizedSlug) {
      return null
    }
    return {
      resourceType: row.resource_type as HistoricalAliasNamespace,
      resourceId: row.resource_id as string,
      locale: row.locale as string,
      canonicalSlug
    }
  }

  private get db(): DatabaseSyncType {
    if (!this.database) {
      throw new Error('SQLite store is not initialized')
    }
    return this.database
  }

  // deleteHistoricalAliasesForResource removes every old key owned by one stable localized identity.
  private deleteHistoricalAliasesForResource(
    siteId: string,
    resource: { resourceType: string; resourceId: string; locale: string }
  ): void {
    this.db
      .prepare(
        `DELETE FROM historical_slug_aliases
          WHERE site_id = ? AND resource_type = ? AND resource_id = ? AND locale = ?`
      )
      .run(siteId, resource.resourceType, resource.resourceId, resource.locale)
  }

  // indexHistoricalAliases materializes one published dynamic resource's historical slugs as stable identity pointers.
  private indexHistoricalAliases(resource: StoredPublishedResource): void {
    if (!isHistoricalAliasNamespace(resource.resourceType) || resource.status !== 'published') {
      return
    }
    const canonicalSlug = normalizeDynamicSlug(resource.slug)
    const historicalSlugs = readHistoricalSlugs(resource.payloadJson)
    const insert = this.db.prepare(
      `INSERT INTO historical_slug_aliases (
         site_id, namespace, locale, normalized_slug, resource_type, resource_id
       ) VALUES (?, ?, ?, ?, ?, ?)`
    )
    const existing = this.db.prepare(
      `SELECT resource_type, resource_id FROM historical_slug_aliases
        WHERE site_id = ? AND namespace = ? AND locale = ? AND normalized_slug = ?`
    )
    const indexed = new Set<string>()
    for (const slug of historicalSlugs) {
      const normalizedSlug = normalizeDynamicSlug(slug)
      if (normalizedSlug === canonicalSlug || indexed.has(normalizedSlug)) {
        continue
      }
      indexed.add(normalizedSlug)
      const owner = existing.get(
        resource.siteId,
        resource.resourceType,
        resource.locale,
        normalizedSlug
      ) as Row | undefined
      if (owner) {
        throw new Error('SLUG_ALIAS_CONFLICT: final publication contains a duplicate historical alias')
      }
      insert.run(
        resource.siteId,
        resource.resourceType,
        resource.locale,
        normalizedSlug,
        resource.resourceType,
        resource.resourceId
      )
    }
  }

  // rebuildHistoricalAliasIndex backfills or repairs the derived index once during local store startup.
  private rebuildHistoricalAliasIndex(): void {
    this.transaction(() => {
      this.db.exec('DELETE FROM historical_slug_aliases')
      const resources = this.db.prepare('SELECT * FROM published_resources').all() as Row[]
      for (const resource of resources) {
        this.indexHistoricalAliases(mapResourceRow(resource))
      }
    })
  }

  // ensureColumn applies additive schema upgrades for existing local runtime databases.
  private ensureColumn(table: string, column: string, definition: string): void {
    const columns = this.db.prepare(`PRAGMA table_info(${table})`).all() as Row[]
    if (!columns.some((entry) => entry.name === column)) {
      this.db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`)
    }
  }

  // migrateCapabilityRegistrationStateIdentity moves legacy site-only rows into an isolated empty-client stream.
  private migrateCapabilityRegistrationStateIdentity(): void {
    const columns = this.db.prepare('PRAGMA table_info(capability_registration_state)').all() as Row[]
    const primaryKeyColumns = columns
      .filter((entry) => Number(entry.pk ?? 0) > 0)
      .sort((left, right) => Number(left.pk) - Number(right.pk))
      .map((entry) => String(entry.name))
    if (
      primaryKeyColumns.length === 2 &&
      primaryKeyColumns[0] === 'site_id' &&
      primaryKeyColumns[1] === 'client_id'
    ) {
      return
    }
    const hasClientId = columns.some((entry) => entry.name === 'client_id')
    const legacyClientIdExpression = hasClientId ? "COALESCE(client_id, '')" : "''"
    this.transaction(() => {
      this.db.exec(`
        DROP TABLE IF EXISTS capability_registration_state_stream_migration;
        CREATE TABLE capability_registration_state_stream_migration (
          site_id TEXT NOT NULL,
          client_id TEXT NOT NULL,
          manifest_hash TEXT NOT NULL,
          idempotency_key TEXT NOT NULL,
          response_json TEXT,
          claim_generation INTEGER NOT NULL DEFAULT 0,
          claim_token TEXT,
          claim_expires_at_ms INTEGER,
          remote_registration_generation TEXT NOT NULL DEFAULT '0',
          expected_registration_generation TEXT NOT NULL DEFAULT '0',
          idempotency_key_terminal INTEGER NOT NULL DEFAULT 0,
          updated_at TEXT NOT NULL,
          PRIMARY KEY (site_id, client_id)
        );
        INSERT INTO capability_registration_state_stream_migration (
          site_id, client_id, manifest_hash, idempotency_key, response_json,
          claim_generation, claim_token, claim_expires_at_ms,
          remote_registration_generation, expected_registration_generation,
          idempotency_key_terminal, updated_at
        )
        SELECT
          site_id, ${legacyClientIdExpression}, manifest_hash, idempotency_key, response_json,
          claim_generation, claim_token, claim_expires_at_ms,
          remote_registration_generation, expected_registration_generation,
          idempotency_key_terminal, updated_at
        FROM capability_registration_state;
        DROP TABLE capability_registration_state;
        ALTER TABLE capability_registration_state_stream_migration
          RENAME TO capability_registration_state;
      `)
    })
  }

  // transaction wraps SQLite mutations with rollback on the first thrown error.
  private transaction(work: () => void): void {
    this.db.exec('BEGIN')
    try {
      work()
      this.db.exec('COMMIT')
    } catch (error) {
      this.db.exec('ROLLBACK')
      throw error
    }
  }
}

// isHistoricalAliasNamespace limits the local index to the three namespaces frozen for P1.
function isHistoricalAliasNamespace(resourceType: string): resourceType is HistoricalAliasNamespace {
  return resourceType === 'blog' || resourceType === 'news' || resourceType === 'article-category'
}

// readHistoricalSlugs validates the optional public-view history field without accepting draft data shapes.
function readHistoricalSlugs(payloadJson: string): string[] {
  const payload = JSON.parse(payloadJson) as unknown
  if (payload === null || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new Error('Invalid historical slug payload: object is required')
  }
  const record = payload as Record<string, unknown>
  const hasSnake = Object.prototype.hasOwnProperty.call(record, 'historical_slugs')
  const hasCamel = Object.prototype.hasOwnProperty.call(record, 'historicalSlugs')
  if (hasSnake && hasCamel) {
    throw new Error('Invalid historical slug payload: duplicate field representation')
  }
  if (!hasSnake && !hasCamel) {
    return []
  }
  const values = record[hasSnake ? 'historical_slugs' : 'historicalSlugs']
  if (!Array.isArray(values) || values.some((value) => typeof value !== 'string')) {
    throw new Error('Invalid historical slug payload: string array is required')
  }
  return values as string[]
}

// validateResource protects store invariants before writing a published resource.
function validateResource(resource: StoredPublishedResource): void {
  if (!Number.isSafeInteger(resource.publishVersion) || resource.publishVersion < 0) {
    throw new Error('Invalid published resource: publishVersion must be a non-negative safe integer')
  }
  for (const [field, value] of Object.entries({
    siteId: resource.siteId,
    resourceType: resource.resourceType,
    resourceId: resource.resourceId,
    locale: resource.locale,
    status: resource.status,
    updatedAt: resource.updatedAt
  })) {
    if (typeof value !== 'string' || value.trim().length === 0) {
      throw new Error(`Invalid published resource: ${field} is required`)
    }
  }
  if (
    typeof resource.slug !== 'string' ||
    (resource.resourceType === 'faq' ? resource.slug !== '' : resource.slug.trim().length === 0)
  ) {
    throw new Error('Invalid published resource: slug is required unless resourceType is faq')
  }
  JSON.parse(resource.payloadJson)
}

// validatePublicationCommit rejects mixed-site, mixed-version, and ambiguous removal payloads before mutation.
function validatePublicationCommit(input: PublicationCommit): void {
  const validVersionTransition =
    input.mode === 'rebuild'
      ? input.publishVersion === input.expectedLocalPublishVersion
      : input.publishVersion > input.expectedLocalPublishVersion
  if (
    !Number.isSafeInteger(input.expectedLocalPublishVersion) ||
    input.expectedLocalPublishVersion < 0 ||
    !Number.isSafeInteger(input.publishVersion) ||
    !Number.isSafeInteger(input.lastKnownRemotePublishVersion) ||
    input.lastKnownRemotePublishVersion < 0 ||
    !validVersionTransition
  ) {
    throw new Error('Invalid publication commit: publishVersion transition does not match commit mode')
  }
  if (
    input.exposure.siteId !== input.siteId ||
    input.exposure.publishVersion !== input.publishVersion
  ) {
    throw new Error('Invalid publication commit: exposure identity/version mismatch')
  }
  if (
    input.exposure.defaultLocale.trim().length === 0 ||
    !input.exposure.activeLocales.includes(input.exposure.defaultLocale) ||
    new Set(input.exposure.activeLocales).size !== input.exposure.activeLocales.length
  ) {
    throw new Error('Invalid publication commit: exposure locales are inconsistent')
  }
  const pageKeys = new Set<string>()
  for (const page of input.exposure.pages) {
    if (
      page.pageKey.trim().length === 0 ||
      page.supportedLocales.length === 0 ||
      pageKeys.has(page.pageKey) ||
      new Set(page.supportedLocales).size !== page.supportedLocales.length
    ) {
      throw new Error('Invalid publication commit: exposure pages are inconsistent')
    }
    pageKeys.add(page.pageKey)
  }
  const resourceKeys = new Set<string>()
  const slugKeys = new Set<string>()
  for (const resource of input.resources) {
    validateResource(resource)
    const identityKey = resourceIdentityKey(resource)
    const slugKey = `${resource.siteId}\u0000${resource.resourceType}\u0000${resource.locale}\u0000${resource.slug}`
    if (
      resource.siteId !== input.siteId ||
      !Number.isSafeInteger(resource.publishVersion) ||
      resource.publishVersion > input.publishVersion ||
      resourceKeys.has(identityKey)
    ) {
      throw new Error('Invalid publication commit: public view identity/version mismatch')
    }
    if (slugKeys.has(slugKey)) {
      throw new Error('PUBLIC_SLUG_CONFLICT: final publication contains a duplicate slug')
    }
    resourceKeys.add(identityKey)
    slugKeys.add(slugKey)
  }
  const missingKeys = new Set<string>()
  for (const resource of input.missingResources) {
    const identityKey = resourceIdentityKey(resource)
    if (
      resource.resourceType.length === 0 ||
      resource.resourceId.trim().length === 0 ||
      resource.locale.trim().length === 0 ||
      resourceKeys.has(identityKey) ||
      missingKeys.has(identityKey)
    ) {
      throw new Error('Invalid publication commit: missing resource is ambiguous')
    }
    missingKeys.add(identityKey)
  }
}

// resourceIdentityKey builds the local primary-key identity used for overlap validation.
function resourceIdentityKey(resource: {
  resourceType: string
  resourceId: string
  locale: string
}): string {
  return `${resource.resourceType}\u0000${resource.resourceId}\u0000${resource.locale}`
}

// mapCapabilityRegistrationRow converts the persisted claim/fence columns into one immutable state snapshot.
function mapCapabilityRegistrationRow(row: Row): StoredCapabilityRegistrationState {
  const generation = Number(row.claim_generation ?? 0)
  if (!Number.isSafeInteger(generation) || generation < 0) {
    throw new Error('Invalid persisted local capability registration claim generation')
  }
  const claimExpiresAtMs =
    row.claim_expires_at_ms === null || row.claim_expires_at_ms === undefined
      ? null
      : Number(row.claim_expires_at_ms)
  if (
    claimExpiresAtMs !== null &&
    (!Number.isSafeInteger(claimExpiresAtMs) || claimExpiresAtMs < 0)
  ) {
    throw new Error('Invalid persisted capability registration claim expiry')
  }
  return {
    siteId: row.site_id as string,
    clientId: row.client_id as string,
    manifestHash: row.manifest_hash as string,
    idempotencyKey: row.idempotency_key as string,
    responseJson: (row.response_json as string | null) ?? null,
    generation,
    claimToken: (row.claim_token as string | null) ?? null,
    claimExpiresAtMs,
    remoteRegistrationGeneration: requireCanonicalUint64Decimal(
      row.remote_registration_generation ?? '0',
      'persisted remote registration generation'
    ),
    expectedRegistrationGeneration: requireCanonicalUint64Decimal(
      row.expected_registration_generation ?? '0',
      'persisted expected registration generation'
    ),
    idempotencyKeyTerminal: Number(row.idempotency_key_terminal ?? 0) === 1,
    updatedAt: row.updated_at as string
  }
}

// maxUint64Decimal returns the larger canonical uint64 decimal without numeric precision loss.
function maxUint64Decimal(left: string, right: string): string {
  const normalizedLeft = requireCanonicalUint64Decimal(left, 'left registration generation')
  const normalizedRight = requireCanonicalUint64Decimal(right, 'right registration generation')
  return BigInt(normalizedLeft) >= BigInt(normalizedRight) ? normalizedLeft : normalizedRight
}

// validateCapabilityClaimIdentity rejects incomplete claim/fence inputs before SQLite mutation.
function validateCapabilityClaimIdentity(input: {
  siteId: string
  clientId: string
  manifestHash: string
  claimToken: string
  generation?: number
  proposedIdempotencyKey?: string
  claimedAtMs?: number
  leaseDurationMs?: number
}): void {
  if (
    input.siteId.trim().length === 0 ||
    input.clientId.trim().length === 0 ||
    input.manifestHash.trim().length === 0 ||
    input.claimToken.trim().length === 0 ||
    (input.proposedIdempotencyKey !== undefined && input.proposedIdempotencyKey.trim().length === 0) ||
    (input.claimedAtMs !== undefined &&
      (!Number.isSafeInteger(input.claimedAtMs) || input.claimedAtMs < 0)) ||
    (input.leaseDurationMs !== undefined &&
      (!Number.isSafeInteger(input.leaseDurationMs) || input.leaseDurationMs < 1)) ||
    (input.claimedAtMs !== undefined &&
      input.leaseDurationMs !== undefined &&
      !Number.isSafeInteger(input.claimedAtMs + input.leaseDurationMs)) ||
    (input.generation !== undefined && (!Number.isSafeInteger(input.generation) || input.generation < 1))
  ) {
    throw new Error('Invalid capability registration claim')
  }
}

// mapResourceRow converts SQLite snake_case columns to package store records.
function mapResourceRow(row: Row): StoredPublishedResource {
  return {
    siteId: row.site_id as string,
    resourceType: row.resource_type as StoredPublishedResource['resourceType'],
    resourceId: row.resource_id as string,
    slug: row.slug as string,
    locale: row.locale as string,
    status: row.status as StoredPublishedResource['status'],
    publishVersion: Number(row.publish_version),
    payloadJson: row.payload_json as string,
    updatedAt: row.updated_at as string
  }
}
