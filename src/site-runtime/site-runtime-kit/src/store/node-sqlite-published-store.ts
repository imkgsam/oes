import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { randomUUID } from 'node:crypto'
import type { DatabaseSync as DatabaseSyncType } from 'node:sqlite'

import type {
  GetPublishedResourceBySlugQuery,
  ListPublishedResourcesQuery,
  LocalPublishedStore,
  PublishState,
  SnapshotReplacement,
  StoredPublishedResource,
  SyncRunCompletion,
  SyncRunStart,
  StoredSyncRun
} from '../types'

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
    `)
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
    })
  }

  // replaceSnapshot atomically rebuilds a site's local resources and advances publish_state only after success.
  async replaceSnapshot(input: SnapshotReplacement): Promise<void> {
    this.transaction(() => {
      for (const resource of input.resources) {
        validateResource(resource)
      }
      this.db.prepare(`DELETE FROM published_resources WHERE site_id = ?`).run(input.siteId)
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

  private get db(): DatabaseSyncType {
    if (!this.database) {
      throw new Error('SQLite store is not initialized')
    }
    return this.database
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

// validateResource protects store invariants before writing a published resource.
function validateResource(resource: StoredPublishedResource): void {
  for (const [field, value] of Object.entries({
    siteId: resource.siteId,
    resourceType: resource.resourceType,
    resourceId: resource.resourceId,
    slug: resource.slug,
    locale: resource.locale,
    status: resource.status,
    updatedAt: resource.updatedAt
  })) {
    if (typeof value !== 'string' || value.trim().length === 0) {
      throw new Error(`Invalid published resource: ${field} is required`)
    }
  }
  JSON.parse(resource.payloadJson)
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
