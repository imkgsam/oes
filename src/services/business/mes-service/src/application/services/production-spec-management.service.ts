import { createHash, randomUUID } from 'node:crypto'
import { Inject, Injectable } from '@nestjs/common'
import { TOKENS } from '../../common/constants/tokens'
import {
  ProductionSpecCommandContext,
  ProductionSpecRecord,
  ProductionSpecStatus
} from '../../domain/models/production-spec-records'
import { ItemRefRecord, MesAuditEnvelopeRecord, MesOutboxEventRecord } from '../../domain/models/mes-mold-records'
import { ProductionSpecRepository } from '../../domain/repositories/production-spec.repository'
import { ManufacturableItemLookupPort } from '../ports/manufacturable-item-lookup.port'
import {
  assertAlreadyAbsent,
  assertCommandContext,
  assertExists,
  assertPrecondition,
  assertRequiredString,
  assertStaleGuard,
  normalizeCode,
  normalizeOptionalString,
  nowIso,
  resolveContextOrgId
} from '../support/mes-assertions'

export interface CreateProductionSpecInput extends ProductionSpecCommandContext {
  productionSpecId?: string
  specCode: string
  name: string
  revisionCode?: string | null
  supersedesProductionSpecId?: string | null
  itemRef: ItemRefRecord
  effectiveFrom?: string | null
  effectiveTo?: string | null
}

export interface UpdateProductionSpecInput extends ProductionSpecCommandContext {
  productionSpecId: string
  expectedVersion: number
  name?: string | null
  itemRef?: ItemRefRecord | null
  effectiveFrom?: string | null
  effectiveTo?: string | null
}

export interface ActivateProductionSpecInput extends ProductionSpecCommandContext {
  productionSpecId: string
  expectedVersion: number
  activatedAt?: string | null
}

export interface RetireProductionSpecInput extends ProductionSpecCommandContext {
  productionSpecId: string
  expectedVersion: number
  retiredAt?: string | null
  replacementProductionSpecId?: string | null
}

/** ProductionSpecManagementService owns ProductionSpec command rules, audit, outbox, and idempotency. */
@Injectable()
export class ProductionSpecManagementService {
  constructor(
    @Inject(TOKENS.PRODUCTION_SPEC_REPOSITORY)
    private readonly repository: ProductionSpecRepository,
    @Inject(TOKENS.MANUFACTURABLE_ITEM_LOOKUP_PORT)
    private readonly itemLookup: ManufacturableItemLookupPort
  ) {}

  /** createProductionSpec creates one DRAFT spec after validating item-master eligibility. */
  async createProductionSpec(input: CreateProductionSpecInput): Promise<ProductionSpecRecord> {
    return this.executeIdempotent(input, 'CreateProductionSpec', async () => {
      assertCommandContext(input)
      const orgId = resolveContextOrgId(input)
      const specCode = normalizeCode(input.specCode, 'specCode')
      assertRequiredString(input.name, 'name')
      assertAlreadyAbsent(
        !(await this.repository.findProductionSpecByCode(input.tenantId, orgId, specCode)),
        'duplicate production spec code',
        { specCode }
      )
      const productionSpecId = normalizeOptionalString(input.productionSpecId) ?? randomUUID()
      assertAlreadyAbsent(
        !(await this.repository.findProductionSpecById(input.tenantId, productionSpecId)),
        'duplicate production spec id',
        { productionSpecId }
      )
      const itemRef = await this.normalizeAndValidateItemRef(input.tenantId, input.itemRef)
      const supersedesProductionSpecId = normalizeOptionalString(input.supersedesProductionSpecId) ?? null
      if (supersedesProductionSpecId) {
        assertVisibleProductionSpec(
          assertExists(
            await this.repository.findProductionSpecById(input.tenantId, supersedesProductionSpecId),
            'ProductionSpec',
            supersedesProductionSpecId
          ),
          orgId
        )
      }

      const timestamp = nowIso()
      const record: ProductionSpecRecord = {
        productionSpecId,
        tenantId: input.tenantId,
        orgId,
        specCode,
        name: input.name.trim(),
        revisionCode: normalizeOptionalString(input.revisionCode) ?? null,
        supersedesProductionSpecId,
        itemRef,
        status: ProductionSpecStatus.DRAFT,
        effectiveFrom: normalizeOptionalString(input.effectiveFrom) ?? null,
        effectiveTo: normalizeOptionalString(input.effectiveTo) ?? null,
        retiredAt: null,
        replacementProductionSpecId: null,
        createdAt: timestamp,
        updatedAt: timestamp,
        version: 1
      }
      assertDateWindow(record.effectiveFrom, record.effectiveTo)

      const saved = await this.repository.saveProductionSpec(record)
      const audit = await this.appendAudit(input, 'CreateProductionSpec', saved.productionSpecId, null, saved)
      await this.appendOutbox(input, 'ProductionSpecCreated', saved.productionSpecId, {
        productionSpecId: saved.productionSpecId,
        specCode: saved.specCode,
        status: saved.status,
        auditRef: audit.mesAuditEnvelopeId
      })
      return saved
    })
  }

  /** updateProductionSpec updates mutable spec fields while rejecting retired records and stale versions. */
  async updateProductionSpec(input: UpdateProductionSpecInput): Promise<ProductionSpecRecord> {
    return this.executeIdempotent(input, 'UpdateProductionSpec', async () => {
      assertCommandContext(input)
      const orgId = resolveContextOrgId(input)
      assertRequiredString(input.productionSpecId, 'productionSpecId')
      const current = assertVisibleProductionSpec(
        assertExists(
          await this.repository.findProductionSpecById(input.tenantId, input.productionSpecId),
          'ProductionSpec',
          input.productionSpecId
        ),
        orgId
      )
      assertExpectedVersion(current, input.expectedVersion)
      assertPrecondition(current.status !== ProductionSpecStatus.RETIRED, 'retired production spec cannot be updated')

      const nextName = input.name === undefined || input.name === null ? current.name : input.name.trim()
      assertRequiredString(nextName, 'name')
      const next: ProductionSpecRecord = {
        ...current,
        name: nextName,
        itemRef:
          input.itemRef === undefined || input.itemRef === null
            ? current.itemRef
            : await this.normalizeAndValidateItemRef(input.tenantId, input.itemRef),
        effectiveFrom:
          input.effectiveFrom === undefined ? current.effectiveFrom : normalizeOptionalString(input.effectiveFrom) ?? null,
        effectiveTo: input.effectiveTo === undefined ? current.effectiveTo : normalizeOptionalString(input.effectiveTo) ?? null,
        updatedAt: nowIso(),
        version: current.version + 1
      }
      assertDateWindow(next.effectiveFrom, next.effectiveTo)

      const saved = await this.repository.saveProductionSpec(next)
      const audit = await this.appendAudit(input, 'UpdateProductionSpec', saved.productionSpecId, current, saved)
      await this.appendOutbox(input, 'ProductionSpecUpdated', saved.productionSpecId, {
        productionSpecId: saved.productionSpecId,
        specCode: saved.specCode,
        status: saved.status,
        auditRef: audit.mesAuditEnvelopeId
      })
      return saved
    })
  }

  /** activateProductionSpec transitions DRAFT specs to ACTIVE after revalidating item eligibility. */
  async activateProductionSpec(input: ActivateProductionSpecInput): Promise<ProductionSpecRecord> {
    return this.executeIdempotent(input, 'ActivateProductionSpec', async () => {
      assertCommandContext(input)
      const orgId = resolveContextOrgId(input)
      assertRequiredString(input.productionSpecId, 'productionSpecId')
      const current = assertVisibleProductionSpec(
        assertExists(
          await this.repository.findProductionSpecById(input.tenantId, input.productionSpecId),
          'ProductionSpec',
          input.productionSpecId
        ),
        orgId
      )
      assertExpectedVersion(current, input.expectedVersion)
      assertPrecondition(current.status === ProductionSpecStatus.DRAFT, 'production spec is not activatable', {
        currentStatus: current.status
      })
      await this.normalizeAndValidateItemRef(input.tenantId, current.itemRef)
      const activatedAt = normalizeOptionalString(input.activatedAt) ?? nowIso()
      assertPrecondition(!current.effectiveTo || current.effectiveTo >= activatedAt, 'production spec is already expired')

      const next: ProductionSpecRecord = {
        ...current,
        status: ProductionSpecStatus.ACTIVE,
        updatedAt: activatedAt,
        version: current.version + 1
      }
      const saved = await this.repository.saveProductionSpec(next)
      const audit = await this.appendAudit(input, 'ActivateProductionSpec', saved.productionSpecId, current, saved)
      await this.appendOutbox(input, 'ProductionSpecActivated', saved.productionSpecId, {
        productionSpecId: saved.productionSpecId,
        specCode: saved.specCode,
        status: saved.status,
        auditRef: audit.mesAuditEnvelopeId
      })
      return saved
    })
  }

  /** retireProductionSpec transitions usable specs to RETIRED and optionally records an active replacement. */
  async retireProductionSpec(input: RetireProductionSpecInput): Promise<ProductionSpecRecord> {
    return this.executeIdempotent(input, 'RetireProductionSpec', async () => {
      assertCommandContext(input)
      const orgId = resolveContextOrgId(input)
      assertRequiredString(input.productionSpecId, 'productionSpecId')
      const current = assertVisibleProductionSpec(
        assertExists(
          await this.repository.findProductionSpecById(input.tenantId, input.productionSpecId),
          'ProductionSpec',
          input.productionSpecId
        ),
        orgId
      )
      assertExpectedVersion(current, input.expectedVersion)
      assertPrecondition(current.status !== ProductionSpecStatus.RETIRED, 'production spec is already retired')

      const replacementProductionSpecId = normalizeOptionalString(input.replacementProductionSpecId) ?? null
      if (replacementProductionSpecId) {
        const replacement = assertVisibleProductionSpec(
          assertExists(
            await this.repository.findProductionSpecById(input.tenantId, replacementProductionSpecId),
            'ProductionSpec',
            replacementProductionSpecId
          ),
          orgId
        )
        assertPrecondition(replacement.status === ProductionSpecStatus.ACTIVE, 'replacement production spec is not active')
      }
      const retiredAt = normalizeOptionalString(input.retiredAt) ?? nowIso()
      const next: ProductionSpecRecord = {
        ...current,
        status: ProductionSpecStatus.RETIRED,
        retiredAt,
        replacementProductionSpecId,
        updatedAt: retiredAt,
        version: current.version + 1
      }
      const saved = await this.repository.saveProductionSpec(next)
      const audit = await this.appendAudit(input, 'RetireProductionSpec', saved.productionSpecId, current, saved)
      await this.appendOutbox(input, 'ProductionSpecRetired', saved.productionSpecId, {
        productionSpecId: saved.productionSpecId,
        specCode: saved.specCode,
        status: saved.status,
        replacementProductionSpecId,
        auditRef: audit.mesAuditEnvelopeId
      })
      return saved
    })
  }

  /** executeIdempotent keeps command replay, audit, and outbox writes in one repository transaction. */
  private async executeIdempotent<T>(
    context: ProductionSpecCommandContext,
    commandName: string,
    handler: () => Promise<T>
  ): Promise<T> {
    return this.repository.runInTransaction(async () => {
      assertCommandContext(context)
      const requestHash = hashCommandPayload(commandName, stableCommandPayload(context))
      const existing = await this.repository.findCommandIdempotencyRecord(context.tenantId, context.commandId)
      if (existing) {
        assertAlreadyAbsent(
          existing.commandName === commandName && existing.requestHash === requestHash,
          'idempotency conflict',
          { commandId: context.commandId, commandName }
        )
        assertStaleGuard(existing.status === 'SUCCEEDED' && !!existing.responseSnapshot, 'command is still in progress', {
          commandId: context.commandId,
          commandName
        })
        return cloneIdempotentResult<T>(existing.responseSnapshot)
      }

      const timestamp = nowIso()
      const idempotencyRecordId = randomUUID()
      const record = await this.repository.saveCommandIdempotencyRecord({
        mesCommandIdempotencyId: idempotencyRecordId,
        tenantId: context.tenantId,
        orgId: resolveContextOrgId(context),
        commandId: context.commandId,
        commandName,
        requestHash,
        status: 'IN_PROGRESS',
        responseSnapshot: null,
        createdAt: timestamp,
        updatedAt: timestamp
      })
      if (record.mesCommandIdempotencyId !== idempotencyRecordId) {
        assertAlreadyAbsent(
          record.commandName === commandName && record.requestHash === requestHash,
          'idempotency conflict',
          { commandId: context.commandId, commandName }
        )
        assertStaleGuard(record.status === 'SUCCEEDED' && !!record.responseSnapshot, 'command is still in progress', {
          commandId: context.commandId,
          commandName
        })
        return cloneIdempotentResult<T>(record.responseSnapshot)
      }
      const response = await handler()
      await this.repository.saveCommandIdempotencyRecord({
        ...record,
        status: 'SUCCEEDED',
        responseSnapshot: toSnapshot(response) ?? {},
        updatedAt: nowIso()
      })
      return response
    })
  }

  /** normalizeAndValidateItemRef resolves item-master truth and rejects non-eligible items. */
  private async normalizeAndValidateItemRef(tenantId: string, ref: ItemRefRecord): Promise<ItemRefRecord> {
    const normalized = normalizeItemRef(ref)
    const item = assertExists(await this.itemLookup.getManufacturableItem(tenantId, normalized.itemId), 'Item', normalized.itemId)
    assertPrecondition(item.active, 'production spec item must be active', { itemId: normalized.itemId })
    assertPrecondition(item.physical, 'production spec item must be physical', { itemId: normalized.itemId })
    assertPrecondition(item.manufacturable, 'production spec item must be manufacturable', { itemId: normalized.itemId })
    return {
      itemId: normalized.itemId,
      itemCodeSnapshot: normalized.itemCodeSnapshot ?? item.itemCode,
      itemNameSnapshot: normalized.itemNameSnapshot ?? item.itemName
    }
  }

  /** appendAudit persists one ProductionSpec success audit envelope inside the command transaction. */
  private async appendAudit(
    context: ProductionSpecCommandContext,
    eventType: string,
    resourceId: string,
    beforeSnapshot: unknown,
    afterSnapshot: unknown
  ): Promise<MesAuditEnvelopeRecord> {
    const timestamp = nowIso()
    return this.repository.appendAuditEnvelope({
      mesAuditEnvelopeId: context.auditContext.auditId,
      tenantId: context.tenantId,
      orgId: resolveContextOrgId(context),
      service: 'mes-service',
      module: 'production-spec-management',
      eventType,
      occurredAt: timestamp,
      result: 'SUCCEEDED',
      operatorId: context.operatorContext.operatorId,
      operatorType: context.operatorContext.operatorType,
      traceId: context.traceContext.traceId,
      commandId: context.commandId,
      reason: context.auditContext.reason,
      resourceType: 'PRODUCTION_SPEC',
      resourceId,
      beforeSnapshot: toSnapshot(beforeSnapshot),
      afterSnapshot: toSnapshot(afterSnapshot),
      details: {
        auditContext: context.auditContext,
        operatorContext: context.operatorContext,
        traceContext: context.traceContext
      },
      createdAt: timestamp
    })
  }

  /** appendOutbox persists one ProductionSpec integration event inside the command transaction. */
  private async appendOutbox(
    context: ProductionSpecCommandContext,
    eventType: string,
    aggregateId: string,
    payload: Record<string, unknown>
  ): Promise<MesOutboxEventRecord> {
    const timestamp = nowIso()
    return this.repository.appendOutboxEvent({
      mesOutboxEventId: randomUUID(),
      tenantId: context.tenantId,
      orgId: resolveContextOrgId(context),
      eventType,
      aggregateType: 'PRODUCTION_SPEC',
      aggregateId,
      payload: {
        eventId: randomUUID(),
        tenantId: context.tenantId,
        orgId: resolveContextOrgId(context),
        ...payload
      },
      traceId: context.traceContext.traceId,
      commandId: context.commandId,
      occurredAt: timestamp,
      publishedAt: null,
      status: 'PENDING',
      createdAt: timestamp
    })
  }
}

/** normalizeItemRef validates the opaque item reference shape without copying item-master truth. */
function normalizeItemRef(ref: ItemRefRecord): ItemRefRecord {
  assertRequiredString(ref?.itemId, 'itemRef.itemId')
  return {
    itemId: ref.itemId.trim(),
    itemCodeSnapshot: normalizeOptionalString(ref.itemCodeSnapshot) ?? null,
    itemNameSnapshot: normalizeOptionalString(ref.itemNameSnapshot) ?? null
  }
}

/** assertDateWindow rejects inverted effective windows while allowing open-ended specs. */
function assertDateWindow(effectiveFrom?: string | null, effectiveTo?: string | null): void {
  assertPrecondition(!effectiveFrom || !effectiveTo || effectiveFrom <= effectiveTo, 'production spec date window is invalid')
}

/** assertExpectedVersion enforces stale-command protection when callers send a version guard. */
function assertExpectedVersion(record: ProductionSpecRecord, expectedVersion: number): void {
  assertStaleGuard(expectedVersion === record.version, 'stale production spec version', {
    expectedVersion,
    actualVersion: record.version
  })
}

/** assertVisibleProductionSpec hides cross-org ProductionSpec records behind NOT_FOUND semantics. */
function assertVisibleProductionSpec(record: ProductionSpecRecord, orgId: string | null | undefined): ProductionSpecRecord {
  return assertExists(
    (record.orgId ?? null) === (orgId ?? null) ? record : null,
    'ProductionSpec',
    record.productionSpecId
  )
}

/** toSnapshot converts command results into JSON-safe idempotency and audit snapshots. */
function toSnapshot(value: unknown): Record<string, unknown> | null {
  if (value === null || value === undefined) {
    return null
  }
  return JSON.parse(JSON.stringify(value)) as Record<string, unknown>
}

/** cloneIdempotentResult restores a stored command response snapshot as the command return type. */
function cloneIdempotentResult<T>(value: unknown): T {
  return JSON.parse(JSON.stringify(value)) as T
}

/** hashCommandPayload creates a stable command hash for idempotency conflict detection. */
function hashCommandPayload(commandName: string, payload: unknown): string {
  return createHash('sha256')
    .update(stableStringify({ commandName, payload }))
    .digest('hex')
}

/** stableCommandPayload excludes retry-local trace and audit envelopes from idempotency conflict checks. */
function stableCommandPayload(context: ProductionSpecCommandContext): Record<string, unknown> {
  const { auditContext: _auditContext, traceContext: _traceContext, orgId: _orgId, ...businessPayload } = context
  return {
    ...businessPayload,
    orgId: resolveContextOrgId(context)
  }
}

/** stableStringify serializes objects with sorted keys so equivalent command payloads hash identically. */
function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value)
  }
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(',')}]`
  }
  const record = value as Record<string, unknown>
  return `{${Object.keys(record)
    .filter((key) => record[key] !== undefined)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`)
    .join(',')}}`
}
