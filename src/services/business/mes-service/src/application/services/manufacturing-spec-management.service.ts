import { createHash, randomUUID } from 'node:crypto'
import { Inject, Injectable } from '@nestjs/common'
import { TOKENS } from '../../common/constants/tokens'
import { ManufacturableItemLookupPort } from '../ports/manufacturable-item-lookup.port'
import {
  ManufacturingAttributeRecord,
  ManufacturingSpecCommandContext,
  ManufacturingSpecRecord,
  ManufacturingSpecStatus,
  ManufacturingSpecSummaryRecord,
  RouteIntentRefRecord
} from '../../domain/models/manufacturing-spec-records'
import {
  ItemRefRecord,
  ManufacturingMasterDataRefRecord,
  MesAuditEnvelopeRecord,
  MesOutboxEventRecord
} from '../../domain/models/mes-mold-records'
import { ManufacturingSpecRepository } from '../../domain/repositories/manufacturing-spec.repository'
import {
  assertAlreadyAbsent,
  assertExists,
  assertPrecondition,
  assertRequiredString,
  assertStaleGuard,
  normalizeCode,
  normalizeOptionalString,
  nowIso
} from '../support/mes-assertions'

export interface CreateManufacturingSpecInput extends ManufacturingSpecCommandContext {
  manufacturingSpecId?: string
  specCode: string
  name: string
  revisionCode?: string | null
  supersedesSpecId?: string | null
  productFamilyRef: ManufacturingMasterDataRefRecord
  itemRef: ItemRefRecord
  manufacturingAttributes: ManufacturingAttributeRecord[]
  routeIntentRef?: RouteIntentRefRecord | null
  effectiveFrom?: string | null
  effectiveTo?: string | null
  reason: string
}

export interface UpdateManufacturingSpecInput extends ManufacturingSpecCommandContext {
  manufacturingSpecId: string
  expectedVersion?: number
  name?: string | null
  productFamilyRef?: ManufacturingMasterDataRefRecord | null
  itemRef?: ItemRefRecord | null
  manufacturingAttributes?: ManufacturingAttributeRecord[] | null
  routeIntentRef?: RouteIntentRefRecord | null
  effectiveFrom?: string | null
  effectiveTo?: string | null
  reason: string
}

export interface ActivateManufacturingSpecInput extends ManufacturingSpecCommandContext {
  manufacturingSpecId: string
  expectedVersion?: number
  activatedAt?: string | null
  reason: string
}

export interface RetireManufacturingSpecInput extends ManufacturingSpecCommandContext {
  manufacturingSpecId: string
  expectedVersion?: number
  retiredAt?: string | null
  replacementSpecId?: string | null
  reason: string
}

/** ManufacturingSpecManagementService owns MES manufacturing spec command rules, audit, outbox, and idempotency. */
@Injectable()
export class ManufacturingSpecManagementService {
  constructor(
    @Inject(TOKENS.MANUFACTURING_SPEC_REPOSITORY)
    private readonly repository: ManufacturingSpecRepository,
    @Inject(TOKENS.MANUFACTURABLE_ITEM_LOOKUP_PORT)
    private readonly itemLookup: ManufacturableItemLookupPort
  ) {}

  /** createManufacturingSpec creates one DRAFT spec after validating item-master eligibility. */
  async createManufacturingSpec(input: CreateManufacturingSpecInput): Promise<ManufacturingSpecRecord> {
    return this.executeIdempotent(input, 'CreateManufacturingSpec', async () => {
      this.assertCommandContext(input)
      const specCode = normalizeCode(input.specCode, 'specCode')
      assertRequiredString(input.name, 'name')
      assertRequiredString(input.reason, 'reason')
      assertAlreadyAbsent(
        !(await this.repository.findManufacturingSpecByCode(input.tenantId, input.orgId, specCode)),
        'duplicate manufacturing spec code',
        { specCode }
      )
      const itemRef = await this.normalizeAndValidateItemRef(input.tenantId, input.itemRef)
      const supersedesSpecId = normalizeOptionalString(input.supersedesSpecId) ?? null
      if (supersedesSpecId) {
        const superseded = assertExists(
          await this.repository.findManufacturingSpecById(input.tenantId, supersedesSpecId),
          'ManufacturingSpec',
          supersedesSpecId
        )
        assertVisibleManufacturingSpec(superseded, input.orgId)
      }

      const timestamp = nowIso()
      const record: ManufacturingSpecRecord = {
        manufacturingSpecId: normalizeOptionalString(input.manufacturingSpecId) ?? randomUUID(),
        tenantId: input.tenantId,
        orgId: input.orgId ?? null,
        specCode,
        name: input.name.trim(),
        revisionCode: normalizeOptionalString(input.revisionCode) ?? null,
        supersedesSpecId,
        productFamilyRef: normalizeProductFamilyRef(input.productFamilyRef, 'productFamilyRef'),
        itemRef,
        manufacturingAttributes: normalizeManufacturingAttributes(input.manufacturingAttributes),
        routeIntentRef: normalizeRouteIntentRef(input.routeIntentRef),
        status: ManufacturingSpecStatus.DRAFT,
        effectiveFrom: normalizeOptionalString(input.effectiveFrom) ?? null,
        effectiveTo: normalizeOptionalString(input.effectiveTo) ?? null,
        retiredAt: null,
        replacementSpecId: null,
        createdAt: timestamp,
        updatedAt: timestamp,
        version: 1
      }
      assertDateWindow(record.effectiveFrom, record.effectiveTo)

      const saved = await this.repository.saveManufacturingSpec(record)
      const audit = await this.appendAudit(input, 'CreateManufacturingSpec', saved.manufacturingSpecId, null, saved)
      await this.appendOutbox(input, 'ManufacturingSpecCreated', saved.manufacturingSpecId, {
        manufacturingSpecId: saved.manufacturingSpecId,
        specCode: saved.specCode,
        status: saved.status,
        auditRef: audit.mesAuditEnvelopeId
      })
      return saved
    })
  }

  /** updateManufacturingSpec updates mutable fields while protecting ACTIVE and RETIRED semantic boundaries. */
  async updateManufacturingSpec(input: UpdateManufacturingSpecInput): Promise<ManufacturingSpecRecord> {
    return this.executeIdempotent(input, 'UpdateManufacturingSpec', async () => {
      this.assertCommandContext(input)
      assertRequiredString(input.manufacturingSpecId, 'manufacturingSpecId')
      assertRequiredString(input.reason, 'reason')
      const current = assertVisibleManufacturingSpec(
        assertExists(
          await this.repository.findManufacturingSpecById(input.tenantId, input.manufacturingSpecId),
          'ManufacturingSpec',
          input.manufacturingSpecId
        ),
        input.orgId
      )
      this.assertExpectedVersion(current, input.expectedVersion)
      assertPrecondition(current.status !== ManufacturingSpecStatus.RETIRED, 'retired manufacturing spec cannot be updated')

      const nextName = input.name === undefined || input.name === null ? current.name : input.name.trim()
      assertRequiredString(nextName, 'name')
      const wantsSemanticMutation =
        input.productFamilyRef !== undefined || input.itemRef !== undefined || input.manufacturingAttributes !== undefined
      assertPrecondition(
        current.status !== ManufacturingSpecStatus.ACTIVE || !wantsSemanticMutation,
        'active manufacturing spec semantic fields cannot be updated'
      )

      const next: ManufacturingSpecRecord = {
        ...current,
        name: nextName,
        productFamilyRef:
          input.productFamilyRef === undefined || input.productFamilyRef === null
            ? current.productFamilyRef
            : normalizeProductFamilyRef(input.productFamilyRef, 'productFamilyRef'),
        itemRef:
          input.itemRef === undefined || input.itemRef === null
            ? current.itemRef
            : await this.normalizeAndValidateItemRef(input.tenantId, input.itemRef),
        manufacturingAttributes:
          input.manufacturingAttributes === undefined || input.manufacturingAttributes === null
            ? current.manufacturingAttributes
            : normalizeManufacturingAttributes(input.manufacturingAttributes),
        routeIntentRef:
          input.routeIntentRef === undefined ? current.routeIntentRef : normalizeRouteIntentRef(input.routeIntentRef),
        effectiveFrom:
          input.effectiveFrom === undefined ? current.effectiveFrom : normalizeOptionalString(input.effectiveFrom) ?? null,
        effectiveTo:
          input.effectiveTo === undefined ? current.effectiveTo : normalizeOptionalString(input.effectiveTo) ?? null,
        updatedAt: nowIso(),
        version: current.version + 1
      }
      assertDateWindow(next.effectiveFrom, next.effectiveTo)

      const saved = await this.repository.saveManufacturingSpec(next)
      const audit = await this.appendAudit(input, 'UpdateManufacturingSpec', saved.manufacturingSpecId, current, saved)
      await this.appendOutbox(input, 'ManufacturingSpecUpdated', saved.manufacturingSpecId, {
        manufacturingSpecId: saved.manufacturingSpecId,
        specCode: saved.specCode,
        status: saved.status,
        auditRef: audit.mesAuditEnvelopeId
      })
      return saved
    })
  }

  /** activateManufacturingSpec transitions DRAFT specs to ACTIVE after revalidating item eligibility. */
  async activateManufacturingSpec(input: ActivateManufacturingSpecInput): Promise<ManufacturingSpecRecord> {
    return this.executeIdempotent(input, 'ActivateManufacturingSpec', async () => {
      this.assertCommandContext(input)
      assertRequiredString(input.manufacturingSpecId, 'manufacturingSpecId')
      assertRequiredString(input.reason, 'reason')
      const current = assertVisibleManufacturingSpec(
        assertExists(
          await this.repository.findManufacturingSpecById(input.tenantId, input.manufacturingSpecId),
          'ManufacturingSpec',
          input.manufacturingSpecId
        ),
        input.orgId
      )
      this.assertExpectedVersion(current, input.expectedVersion)
      assertPrecondition(current.status === ManufacturingSpecStatus.DRAFT, 'manufacturing spec is not activatable', {
        currentStatus: current.status
      })
      await this.normalizeAndValidateItemRef(input.tenantId, current.itemRef)
      const activatedAt = normalizeOptionalString(input.activatedAt) ?? nowIso()
      assertPrecondition(!current.effectiveTo || current.effectiveTo >= activatedAt, 'manufacturing spec is already expired')

      const next: ManufacturingSpecRecord = {
        ...current,
        status: ManufacturingSpecStatus.ACTIVE,
        updatedAt: activatedAt,
        version: current.version + 1
      }
      const saved = await this.repository.saveManufacturingSpec(next)
      const audit = await this.appendAudit(input, 'ActivateManufacturingSpec', saved.manufacturingSpecId, current, saved)
      await this.appendOutbox(input, 'ManufacturingSpecActivated', saved.manufacturingSpecId, {
        manufacturingSpecId: saved.manufacturingSpecId,
        specCode: saved.specCode,
        status: saved.status,
        auditRef: audit.mesAuditEnvelopeId
      })
      return saved
    })
  }

  /** retireManufacturingSpec transitions DRAFT or ACTIVE specs to RETIRED and optionally records an active replacement. */
  async retireManufacturingSpec(input: RetireManufacturingSpecInput): Promise<{
    manufacturingSpec: ManufacturingSpecRecord
    replacementSpecSummary: ManufacturingSpecSummaryRecord | null
  }> {
    return this.executeIdempotent(input, 'RetireManufacturingSpec', async () => {
      this.assertCommandContext(input)
      assertRequiredString(input.manufacturingSpecId, 'manufacturingSpecId')
      assertRequiredString(input.reason, 'reason')
      const current = assertVisibleManufacturingSpec(
        assertExists(
          await this.repository.findManufacturingSpecById(input.tenantId, input.manufacturingSpecId),
          'ManufacturingSpec',
          input.manufacturingSpecId
        ),
        input.orgId
      )
      this.assertExpectedVersion(current, input.expectedVersion)
      assertPrecondition(current.status !== ManufacturingSpecStatus.RETIRED, 'manufacturing spec is already retired')

      const replacementSpecId = normalizeOptionalString(input.replacementSpecId) ?? null
      const replacement = replacementSpecId
        ? assertVisibleManufacturingSpec(
            assertExists(
              await this.repository.findManufacturingSpecById(input.tenantId, replacementSpecId),
              'ManufacturingSpec',
              replacementSpecId
            ),
            input.orgId
          )
        : null
      if (replacement) {
        assertPrecondition(replacement.status === ManufacturingSpecStatus.ACTIVE, 'replacement manufacturing spec is not active')
      }
      const retiredAt = normalizeOptionalString(input.retiredAt) ?? nowIso()
      const next: ManufacturingSpecRecord = {
        ...current,
        status: ManufacturingSpecStatus.RETIRED,
        retiredAt,
        replacementSpecId,
        updatedAt: retiredAt,
        version: current.version + 1
      }
      const saved = await this.repository.saveManufacturingSpec(next)
      const audit = await this.appendAudit(input, 'RetireManufacturingSpec', saved.manufacturingSpecId, current, saved)
      await this.appendOutbox(input, 'ManufacturingSpecRetired', saved.manufacturingSpecId, {
        manufacturingSpecId: saved.manufacturingSpecId,
        specCode: saved.specCode,
        status: saved.status,
        replacementSpecId,
        auditRef: audit.mesAuditEnvelopeId
      })
      return {
        manufacturingSpec: saved,
        replacementSpecSummary: replacement ? toSummary(replacement) : null
      }
    })
  }

  /** executeIdempotent keeps ManufacturingSpec command replay, audit, and outbox in one repository transaction. */
  private async executeIdempotent<T>(
    context: ManufacturingSpecCommandContext,
    commandName: string,
    handler: () => Promise<T>
  ): Promise<T> {
    return this.repository.runInTransaction(async () => {
      this.assertCommandContext(context)
      const requestHash = hashCommandPayload(commandName, context)
      const existing = await this.repository.findCommandIdempotencyRecord(context.tenantId, context.commandId)
      if (existing) {
        assertAlreadyAbsent(
          existing.commandName === commandName && existing.requestHash === requestHash,
          'idempotency conflict',
          {
            commandId: context.commandId,
            commandName
          }
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
        orgId: context.orgId ?? context.operatorContext.orgId ?? null,
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
          {
            commandId: context.commandId,
            commandName
          }
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

  /** assertCommandContext keeps direct service calls aligned with the gRPC management context baseline. */
  private assertCommandContext(input: ManufacturingSpecCommandContext): void {
    assertRequiredString(input.tenantId, 'tenantId')
    assertRequiredString(input.commandId, 'commandId')
    assertRequiredString(input.operatorContext?.operatorId, 'operatorContext.operatorId')
    assertRequiredString(input.traceContext?.traceId, 'traceContext.traceId')
    assertRequiredString(input.auditContext?.auditId, 'auditContext.auditId')
  }

  /** assertExpectedVersion enforces stale-command protection when callers send a version guard. */
  private assertExpectedVersion(record: ManufacturingSpecRecord, expectedVersion?: number): void {
    assertStaleGuard(expectedVersion === undefined || expectedVersion === record.version, 'stale manufacturing spec version', {
      expectedVersion,
      actualVersion: record.version
    })
  }

  /** normalizeAndValidateItemRef resolves item-master truth and rejects non-manufacturable or non-physical items. */
  private async normalizeAndValidateItemRef(tenantId: string, ref: ItemRefRecord): Promise<ItemRefRecord> {
    const normalized = normalizeItemRef(ref)
    const item = assertExists(
      await this.itemLookup.getManufacturableItem(tenantId, normalized.itemId),
      'Item',
      normalized.itemId
    )
    assertPrecondition(item.physical, 'manufacturing spec item must be physical', { itemId: normalized.itemId })
    assertPrecondition(item.manufacturable, 'manufacturing spec item must be manufacturable', {
      itemId: normalized.itemId
    })
    return {
      itemId: normalized.itemId,
      itemCodeSnapshot: normalized.itemCodeSnapshot ?? item.itemCode,
      itemNameSnapshot: normalized.itemNameSnapshot ?? item.itemName
    }
  }

  /** appendAudit persists one ManufacturingSpec success audit envelope inside the command transaction. */
  private async appendAudit(
    context: ManufacturingSpecCommandContext,
    eventType: string,
    resourceId: string,
    beforeSnapshot: unknown,
    afterSnapshot: unknown
  ): Promise<MesAuditEnvelopeRecord> {
    const timestamp = nowIso()
    return this.repository.appendAuditEnvelope({
      mesAuditEnvelopeId: context.auditContext.auditId,
      tenantId: context.tenantId,
      orgId: context.orgId ?? context.operatorContext.orgId ?? null,
      service: 'mes-service',
      module: 'manufacturing-spec-management',
      eventType,
      occurredAt: timestamp,
      result: 'SUCCEEDED',
      operatorId: context.operatorContext.operatorId,
      operatorType: context.operatorContext.operatorType,
      traceId: context.traceContext.traceId,
      commandId: context.commandId,
      reason: context.auditContext.reason || '',
      resourceType: 'MANUFACTURING_SPEC',
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

  /** appendOutbox persists one ManufacturingSpec integration event inside the command transaction. */
  private async appendOutbox(
    context: ManufacturingSpecCommandContext,
    eventType: string,
    aggregateId: string,
    payload: Record<string, unknown>
  ): Promise<MesOutboxEventRecord> {
    const timestamp = nowIso()
    return this.repository.appendOutboxEvent({
      mesOutboxEventId: randomUUID(),
      tenantId: context.tenantId,
      orgId: context.orgId ?? null,
      eventType,
      aggregateType: 'MANUFACTURING_SPEC',
      aggregateId,
      payload: {
        eventId: randomUUID(),
        tenantId: context.tenantId,
        orgId: context.orgId ?? null,
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

/** normalizeProductFamilyRef validates the opaque product-family reference boundary. */
function normalizeProductFamilyRef(
  ref: ManufacturingMasterDataRefRecord,
  field: string
): ManufacturingMasterDataRefRecord {
  assertRequiredString(ref?.refId, `${field}.refId`)
  assertPrecondition(ref.refType === 'PRODUCT_FAMILY', `${field} has invalid ref type`, { refType: ref.refType })
  return {
    refType: 'PRODUCT_FAMILY',
    refId: ref.refId.trim(),
    refCodeSnapshot: normalizeOptionalString(ref.refCodeSnapshot) ?? null,
    displayNameSnapshot: normalizeOptionalString(ref.displayNameSnapshot) ?? null
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

/** normalizeManufacturingAttributes validates and normalizes the minimum key/value attribute set. */
function normalizeManufacturingAttributes(values: ManufacturingAttributeRecord[]): ManufacturingAttributeRecord[] {
  assertPrecondition(Array.isArray(values) && values.length > 0, 'manufacturing attributes are required')
  return values.map((value, index) => {
    assertRequiredString(value.attributeKey, `manufacturingAttributes.${index}.attributeKey`)
    assertRequiredString(value.attributeValue, `manufacturingAttributes.${index}.attributeValue`)
    return {
      attributeKey: value.attributeKey.trim(),
      attributeValue: value.attributeValue.trim(),
      displayNameSnapshot: normalizeOptionalString(value.displayNameSnapshot) ?? null,
      valueDisplaySnapshot: normalizeOptionalString(value.valueDisplaySnapshot) ?? null
    }
  })
}

/** normalizeRouteIntentRef normalizes optional future-route display snapshots without asserting route ownership. */
function normalizeRouteIntentRef(value?: RouteIntentRefRecord | null): RouteIntentRefRecord | null {
  if (!value) {
    return null
  }
  return {
    routeRefId: normalizeOptionalString(value.routeRefId) ?? null,
    routeCodeSnapshot: normalizeOptionalString(value.routeCodeSnapshot) ?? null,
    displayNameSnapshot: normalizeOptionalString(value.displayNameSnapshot) ?? null
  }
}

/** assertDateWindow rejects inverted effective windows while allowing open-ended specs. */
function assertDateWindow(effectiveFrom?: string | null, effectiveTo?: string | null): void {
  assertPrecondition(!effectiveFrom || !effectiveTo || effectiveFrom <= effectiveTo, 'manufacturing spec date window is invalid')
}

/** assertVisibleManufacturingSpec hides cross-org ManufacturingSpec records behind NOT_FOUND semantics. */
function assertVisibleManufacturingSpec(
  record: ManufacturingSpecRecord,
  orgId: string | null | undefined
): ManufacturingSpecRecord {
  return assertExists(
    (record.orgId ?? null) === (orgId ?? null) ? record : null,
    'ManufacturingSpec',
    record.manufacturingSpecId
  )
}

/** toSummary converts a full ManufacturingSpec record into its compact reference shape. */
function toSummary(record: ManufacturingSpecRecord): ManufacturingSpecSummaryRecord {
  return {
    manufacturingSpecId: record.manufacturingSpecId,
    specCode: record.specCode,
    name: record.name,
    revisionCode: record.revisionCode,
    productFamilyRef: record.productFamilyRef,
    itemRef: record.itemRef,
    status: record.status
  }
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
