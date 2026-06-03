import { createHash, randomUUID } from 'node:crypto'
import { Inject, Injectable } from '@nestjs/common'
import { TOKENS } from '../../common/constants/tokens'
import {
  AuditRefRecord,
  CarrierResourceRefRecord,
  ItemModelRefRecord,
  MasterMoldRecord,
  MasterMoldStatus,
  MesAuditEnvelopeRecord,
  MesCommandContext,
  MesOutboxEventRecord,
  MoldDesignOutputKind,
  MoldDesignOutputRecord,
  MoldDesignRecord,
  MoldDesignStatus,
  MoldFunctionRole,
  MoldInstallationDetailRecord,
  MoldLifeAdjustmentType,
  MoldLifeCounterRecord,
  MoldMovementRecord,
  MoldOutputStructureType,
  MoldUsageRecord,
  OperatorRefRecord,
  ProductionMoldRecord,
  ProductionMoldStatus,
  ProductionSpecRefRecord,
  ProductionUnitRefRecord,
  PurchaseRefRecord,
  StorageResourceRefRecord,
  SupplierRefRecord,
  ToolingInstallationRecord,
  ToolingInstallationStatus,
  ToolingPlacementSummaryRecord,
  ToolingPlacementType,
  ToolingType,
  TraceSubjectRefRecord,
  WorkCenterRefRecord,
  WorkUnitRefRecord
} from '../../domain/models/mes-mold-records'
import { ProductionSpecStatus } from '../../domain/models/production-spec-records'
import { MesMoldRepository } from '../../domain/repositories/mes-mold.repository'
import { ProductionSpecRepository } from '../../domain/repositories/production-spec.repository'
import {
  assertAlreadyAbsent,
  assertCommandContext,
  assertExists,
  assertInvalidArgument,
  assertNonNegativeQuantity,
  assertPositiveQuantity,
  assertPrecondition,
  assertRequiredString,
  assertStaleGuard,
  normalizeCode,
  normalizeOptionalString,
  nowIso,
  resolveContextOrgId
} from '../support/mes-assertions'

export interface RegisterMoldDesignInput extends MesCommandContext {
  moldDesignId?: string
  designCode: string
  name: string
  revisionCode?: string | null
  supersedesMoldDesignId?: string | null
  primaryItemModelRef: ItemModelRefRecord
  productionSpecRefs?: ProductionSpecRefRecord[]
  materialType: string
  functionRole: MoldFunctionRole
  productionMethodTags?: string[]
  outputStructureType: MoldOutputStructureType
  outputs: Array<{
    moldDesignOutputId?: string
    sequenceNo: number
    outputCode: string
    outputKind: MoldDesignOutputKind
    productionSpecRef?: ProductionSpecRefRecord | null
    itemModelRef?: ItemModelRefRecord | null
    quantityPerUse: string
    componentRole?: string | null
    assemblyHint?: string | null
    isPrimaryOutput: boolean
    options?: Array<{
      moldDesignOutputOptionId?: string
      optionCode: string
      label: string
      productionSpecRef?: ProductionSpecRefRecord | null
      quantityPerUse?: string | null
      isDefault?: boolean
    }>
  }>
  defaultLifeLimit?: string | null
  defaultLifeUnit?: string | null
}

export interface RegisterMasterMoldInput extends MesCommandContext {
  masterMoldId?: string
  masterMoldCode: string
  moldDesignId: string
  supplierRef?: SupplierRefRecord | null
  purchaseRef?: PurchaseRefRecord | null
  receivedAt?: string | null
  initialStorageResourceRef?: StorageResourceRefRecord | null
  initialCarrierResourceRef?: CarrierResourceRefRecord | null
  qualitySummary?: string | null
  notes?: string | null
}

export interface RegisterProductionMoldInput extends MesCommandContext {
  productionMoldId?: string
  moldCode: string
  moldDesignId: string
  sourceMasterMoldId?: string | null
  supplierRef?: SupplierRefRecord | null
  purchaseRef?: PurchaseRefRecord | null
  receivedAt?: string | null
  initialStorageResourceRef?: StorageResourceRefRecord | null
  initialCarrierResourceRef?: CarrierResourceRefRecord | null
}

export interface AcceptProductionMoldInput extends MesCommandContext {
  productionMoldId: string
  acceptedAt?: string | null
}

export interface ConfirmProductionMoldArrivalInput extends MesCommandContext {
  productionMoldId: string
  arrivedAt?: string | null
}

export interface MoveToolingInput extends MesCommandContext {
  toolingType: ToolingType
  toolingId: string
  toStorageResourceRef?: StorageResourceRefRecord | null
  toCarrierResourceRef?: CarrierResourceRefRecord | null
  movementReason?: string | null
  movedAt?: string | null
}

export interface InstallToolingInput extends MesCommandContext {
  toolingType: ToolingType
  toolingId: string
  workCenterRef: WorkCenterRefRecord
  workUnitRef?: WorkUnitRefRecord | null
  installedAt?: string | null
  moldPositionIndex?: number | null
  cavityPosition?: string | null
  cavityMapping?: string | null
  setupParameters?: string | null
}

export interface UnmountToolingInput extends MesCommandContext {
  toolingInstallationId: string
  unmountedAt?: string | null
}

export interface ConfirmInstalledMoldReadyInput extends MesCommandContext {
  productionMoldId: string
  toolingInstallationId: string
  confirmedAt?: string | null
}

export interface MarkInstalledMoldMaintenanceInput extends MesCommandContext {
  productionMoldId: string
  toolingInstallationId: string
  markedAt?: string | null
}

export interface RecordMoldUsageInput extends MesCommandContext {
  productionMoldId: string
  toolingInstallationId: string
  workCenterRef: WorkCenterRefRecord
  workUnitRef?: WorkUnitRefRecord | null
  usedAt?: string | null
  usageQuantity: string
  lifeUnit: string
  productionSpecRef?: ProductionSpecRefRecord | null
  productionUnitRef?: ProductionUnitRefRecord | null
  traceSubjectRef?: TraceSubjectRefRecord | null
  captureSource?: string | null
  moldDesignOutputId?: string | null
  moldDesignOutputOptionId?: string | null
}

export interface RecordMoldUsageBatchInput extends MesCommandContext {
  workCenterRef: WorkCenterRefRecord
  workUnitRef?: WorkUnitRefRecord | null
  usedAt?: string | null
  lifeUnit?: string | null
  captureSource?: string | null
  lines: Array<{
    isSubmitted: boolean
    productionMoldId: string
    toolingInstallationId: string
    usageQuantity: string
    productionSpecRef?: ProductionSpecRefRecord | null
    productionUnitRef?: ProductionUnitRefRecord | null
    traceSubjectRef?: TraceSubjectRefRecord | null
    moldDesignOutputId?: string | null
    moldDesignOutputOptionId?: string | null
  }>
}

export interface AdjustMoldLifeCounterInput extends MesCommandContext {
  moldLifeCounterId: string
  adjustmentType: MoldLifeAdjustmentType
  value: string
}

export interface MarkProductionMoldForScrapInput extends MesCommandContext {
  productionMoldId: string
  markedAt?: string | null
}

/** MesMoldManagementService owns mold/tooling command rules, local transactions, audit, and outbox recording. */
@Injectable()
export class MesMoldManagementService {
  constructor(
    @Inject(TOKENS.MES_MOLD_REPOSITORY)
    private readonly repository: MesMoldRepository,
    @Inject(TOKENS.PRODUCTION_SPEC_REPOSITORY)
    private readonly productionSpecRepository: ProductionSpecRepository
  ) {}

  /** registerMoldDesign creates a tooling design with at least one primary output and active status. */
  async registerMoldDesign(input: RegisterMoldDesignInput): Promise<MoldDesignRecord> {
    return this.executeIdempotent(input, 'RegisterMoldDesign', async () => {
      assertCommandContext(input)
      const orgId = resolveContextOrgId(input)
      const designCode = normalizeCode(input.designCode, 'designCode')
      assertRequiredString(input.name, 'name')
      const primaryItemModelRef = normalizeItemModelRef(input.primaryItemModelRef)
      assertRequiredString(input.materialType, 'materialType')
      assertPrecondition(input.functionRole === MoldFunctionRole.MASTER || input.functionRole === MoldFunctionRole.PRODUCTION, 'invalid mold function role')
      assertPrecondition(Object.values(MoldOutputStructureType).includes(input.outputStructureType), 'invalid output structure type')
      assertInvalidArgument(Array.isArray(input.outputs) && input.outputs.length > 0, 'mold design outputs are required')
      assertPrecondition(input.outputs.some((output) => output.isPrimaryOutput), 'mold design requires primary output')
      assertAlreadyAbsent(
        !(await this.repository.findMoldDesignByCode(input.tenantId, orgId, designCode)),
        'duplicate design code',
        { designCode }
      )

      const timestamp = nowIso()
      const moldDesignId = normalizeOptionalString(input.moldDesignId) ?? randomUUID()
      assertAlreadyAbsent(
        !(await this.repository.findMoldDesignById(input.tenantId, moldDesignId)),
        'duplicate mold design id',
        { moldDesignId }
      )
      await this.assertProductionSpecRefsVisibleAndActive(input, orgId)
      const supersedesMoldDesignId = normalizeOptionalString(input.supersedesMoldDesignId) ?? null
      if (supersedesMoldDesignId) {
        assertVisibleByOrg(
          assertExists(await this.repository.findMoldDesignById(input.tenantId, supersedesMoldDesignId), 'MoldDesign', supersedesMoldDesignId),
          orgId,
          'MoldDesign',
          supersedesMoldDesignId
        )
      }
      const record: MoldDesignRecord = {
        moldDesignId,
        tenantId: input.tenantId,
        orgId,
        designCode,
        name: input.name.trim(),
        revisionCode: normalizeOptionalString(input.revisionCode) ?? null,
        supersedesMoldDesignId,
        primaryItemModelRef,
        productionSpecRefs: (input.productionSpecRefs ?? []).map(normalizeProductionSpecRef),
        materialType: input.materialType.trim().toUpperCase(),
        functionRole: input.functionRole,
        productionMethodTags: normalizeStringList(input.productionMethodTags ?? []),
        outputStructureType: input.outputStructureType,
        outputs: input.outputs.map((output) => normalizeOutput(input, orgId, moldDesignId, output)),
        defaultLifeLimit: input.defaultLifeLimit ? assertPositiveQuantity(input.defaultLifeLimit, 'defaultLifeLimit') : null,
        defaultLifeUnit: normalizeOptionalString(input.defaultLifeUnit)?.toUpperCase() ?? null,
        status: MoldDesignStatus.ACTIVE,
        createdAt: timestamp,
        updatedAt: timestamp
      }

      const saved = await this.repository.saveMoldDesign(record)
      const audit = await this.appendAudit(input, 'RegisterMoldDesign', 'MOLD_DESIGN', saved.moldDesignId, null, saved)
      await this.appendOutbox(input, 'MoldDesignRegistered', 'MOLD_DESIGN', saved.moldDesignId, {
        moldDesignId: saved.moldDesignId,
        designCode: saved.designCode,
        auditRef: audit.mesAuditEnvelopeId
      })
      return saved
    })
  }

  /** registerMasterMold creates a master mold record outside production usage lifecycle. */
  async registerMasterMold(input: RegisterMasterMoldInput): Promise<MasterMoldRecord> {
    return this.executeIdempotent(input, 'RegisterMasterMold', async () => {
      assertCommandContext(input)
      const orgId = resolveContextOrgId(input)
      const masterMoldCode = normalizeCode(input.masterMoldCode, 'masterMoldCode')
      assertRequiredString(input.moldDesignId, 'moldDesignId')
      assertStorageOrCarrier(input.initialStorageResourceRef, input.initialCarrierResourceRef)
      assertVisibleByOrg(
        assertExists(await this.repository.findMoldDesignById(input.tenantId, input.moldDesignId), 'MoldDesign', input.moldDesignId),
        orgId,
        'MoldDesign',
        input.moldDesignId
      )
      assertAlreadyAbsent(
        !(await this.repository.findMasterMoldByCode(input.tenantId, orgId, masterMoldCode)),
        'duplicate master mold code',
        { masterMoldCode }
      )

      const timestamp = nowIso()
      const masterMoldId = normalizeOptionalString(input.masterMoldId) ?? randomUUID()
      assertAlreadyAbsent(
        !(await this.repository.findMasterMoldById(input.tenantId, masterMoldId)),
        'duplicate master mold id',
        { masterMoldId }
      )
      const record: MasterMoldRecord = {
        masterMoldId,
        tenantId: input.tenantId,
        orgId,
        masterMoldCode,
        moldDesignId: input.moldDesignId,
        supplierRef: input.supplierRef ? normalizeSupplierRef(input.supplierRef) : null,
        purchaseRef: input.purchaseRef ? normalizePurchaseRef(input.purchaseRef) : null,
        receivedAt: normalizeOptionalString(input.receivedAt) ?? null,
        currentStatus: MasterMoldStatus.AVAILABLE,
        currentStorageResourceRef: input.initialStorageResourceRef ? normalizeStorageRef(input.initialStorageResourceRef) : null,
        currentCarrierResourceRef: input.initialCarrierResourceRef ? normalizeCarrierRef(input.initialCarrierResourceRef) : null,
        qualitySummary: normalizeOptionalString(input.qualitySummary) ?? null,
        notes: normalizeOptionalString(input.notes) ?? null,
        createdAt: timestamp,
        updatedAt: timestamp
      }
      const saved = await this.repository.saveMasterMold(record)
      const audit = await this.appendAudit(input, 'RegisterMasterMold', 'MASTER_MOLD', saved.masterMoldId, null, saved)
      await this.appendOutbox(input, 'MasterMoldRegistered', 'MASTER_MOLD', saved.masterMoldId, {
        masterMoldId: saved.masterMoldId,
        masterMoldCode: saved.masterMoldCode,
        auditRef: audit.mesAuditEnvelopeId
      })
      return saved
    })
  }

  /** registerProductionMold creates a production mold record and its first life counter in one command. */
  async registerProductionMold(input: RegisterProductionMoldInput): Promise<ProductionMoldRecord> {
    return this.executeIdempotent(input, 'RegisterProductionMold', async () => {
      assertCommandContext(input)
      const orgId = resolveContextOrgId(input)
      const moldCode = normalizeCode(input.moldCode, 'moldCode')
      assertRequiredString(input.moldDesignId, 'moldDesignId')
      assertStorageOrCarrier(input.initialStorageResourceRef, input.initialCarrierResourceRef)
      const design = assertVisibleByOrg(
        assertExists(await this.repository.findMoldDesignById(input.tenantId, input.moldDesignId), 'MoldDesign', input.moldDesignId),
        orgId,
        'MoldDesign',
        input.moldDesignId
      )
      assertPrecondition(design.status === MoldDesignStatus.ACTIVE, 'mold design is not active')
      if (input.sourceMasterMoldId) {
        const sourceMasterMold = assertVisibleByOrg(
          assertExists(await this.repository.findMasterMoldById(input.tenantId, input.sourceMasterMoldId), 'MasterMold', input.sourceMasterMoldId),
          orgId,
          'MasterMold',
          input.sourceMasterMoldId
        )
        assertPrecondition(sourceMasterMold.currentStatus === MasterMoldStatus.AVAILABLE, 'source master mold is not available')
        assertPrecondition(sourceMasterMold.moldDesignId === input.moldDesignId, 'source master mold does not match mold design')
      }
      assertAlreadyAbsent(
        !(await this.repository.findProductionMoldByCode(input.tenantId, orgId, moldCode)),
        'duplicate production mold code',
        { moldCode }
      )

      const timestamp = nowIso()
      const productionMoldId = normalizeOptionalString(input.productionMoldId) ?? randomUUID()
      assertAlreadyAbsent(
        !(await this.repository.findProductionMoldById(input.tenantId, productionMoldId)),
        'duplicate production mold id',
        { productionMoldId }
      )
      const lifeUnit = normalizeOptionalString(design.defaultLifeUnit)?.toUpperCase() ?? 'CASTING_CYCLE'
      const counter: MoldLifeCounterRecord = {
        moldLifeCounterId: randomUUID(),
        tenantId: input.tenantId,
        orgId,
        productionMoldId,
        lifeUnit,
        usedValue: '0',
        limitValue: design.defaultLifeLimit ?? null,
        warningThresholdValue: null,
        lastUsageRecordId: null,
        lastAdjustedAt: null,
        lastAdjustedByRef: null,
        adjustmentReason: null,
        updatedAt: timestamp
      }
      const record: ProductionMoldRecord = {
        productionMoldId,
        tenantId: input.tenantId,
        orgId,
        moldCode,
        moldDesignId: input.moldDesignId,
        sourceMasterMoldId: normalizeOptionalString(input.sourceMasterMoldId) ?? null,
        supplierRef: input.supplierRef ? normalizeSupplierRef(input.supplierRef) : null,
        purchaseRef: input.purchaseRef ? normalizePurchaseRef(input.purchaseRef) : null,
        receivedAt: normalizeOptionalString(input.receivedAt) ?? null,
        acceptedAt: null,
        currentStatus: ProductionMoldStatus.PRE_REGISTERED,
        currentStorageResourceRef: input.initialStorageResourceRef ? normalizeStorageRef(input.initialStorageResourceRef) : null,
        currentCarrierResourceRef: input.initialCarrierResourceRef ? normalizeCarrierRef(input.initialCarrierResourceRef) : null,
        currentInstallationSummary: null,
        lifeCounterSummary: {
          moldLifeCounterId: counter.moldLifeCounterId,
          lifeUnit: counter.lifeUnit,
          usedValue: counter.usedValue,
          limitValue: counter.limitValue,
          warningThresholdValue: counter.warningThresholdValue,
          lastUsageRecordId: null,
          lastAdjustedAt: null
        },
        scrappedAt: null,
        createdAt: timestamp,
        updatedAt: timestamp
      }
      await this.repository.saveProductionMold(record)
      await this.repository.saveMoldLifeCounter(counter)
      const saved = assertExists(await this.repository.findProductionMoldById(input.tenantId, productionMoldId), 'ProductionMold', productionMoldId)
      const audit = await this.appendAudit(input, 'RegisterProductionMold', 'PRODUCTION_MOLD', saved.productionMoldId, null, saved)
      await this.appendOutbox(input, 'ProductionMoldPreRegistered', 'PRODUCTION_MOLD', saved.productionMoldId, {
        productionMoldId: saved.productionMoldId,
        moldCode: saved.moldCode,
        auditRef: audit.mesAuditEnvelopeId
      })
      return saved
    })
  }

  /** confirmProductionMoldArrival confirms the pre-registered physical mold has arrived and can enter field use preparation. */
  async confirmProductionMoldArrival(input: ConfirmProductionMoldArrivalInput): Promise<{ productionMold: ProductionMoldRecord }> {
    return this.executeIdempotent(input, 'ConfirmProductionMoldArrival', async () => {
      assertCommandContext(input)
      const orgId = resolveContextOrgId(input)
      assertRequiredString(input.productionMoldId, 'productionMoldId')
      const mold = await this.loadVisibleProductionMold(input.tenantId, orgId, input.productionMoldId)
      assertPrecondition(mold.currentStatus === ProductionMoldStatus.PRE_REGISTERED, 'only pre-registered production molds can confirm arrival')
      const timestamp = normalizeOptionalString(input.arrivedAt) ?? nowIso()
      const saved = await this.repository.saveProductionMold({
        ...mold,
        receivedAt: timestamp,
        currentStatus: ProductionMoldStatus.AVAILABLE,
        updatedAt: timestamp
      })
      await this.appendAudit(input, 'ConfirmProductionMoldArrival', 'PRODUCTION_MOLD', saved.productionMoldId, mold, saved)
      await this.appendOutbox(input, 'ProductionMoldArrivalConfirmed', 'PRODUCTION_MOLD', saved.productionMoldId, {
        productionMoldId: saved.productionMoldId,
        arrivedAt: timestamp
      })
      return { productionMold: saved }
    })
  }

  /** acceptProductionMold promotes a received production mold into available state after audit. */
  async acceptProductionMold(input: AcceptProductionMoldInput): Promise<{ productionMold: ProductionMoldRecord }> {
    return this.executeIdempotent(input, 'AcceptProductionMold', async () => {
      assertCommandContext(input)
      const orgId = resolveContextOrgId(input)
      assertRequiredString(input.productionMoldId, 'productionMoldId')
      const mold = await this.loadVisibleProductionMold(input.tenantId, orgId, input.productionMoldId)
      assertPrecondition(mold.currentStatus === ProductionMoldStatus.RECEIVED, 'only received production molds can be accepted')
      const timestamp = normalizeOptionalString(input.acceptedAt) ?? nowIso()
      const saved = await this.repository.saveProductionMold({
        ...mold,
        acceptedAt: timestamp,
        currentStatus: ProductionMoldStatus.AVAILABLE,
        updatedAt: timestamp
      })
      await this.appendAudit(input, 'AcceptProductionMold', 'PRODUCTION_MOLD', saved.productionMoldId, mold, saved)
      await this.appendOutbox(input, 'ProductionMoldAccepted', 'PRODUCTION_MOLD', saved.productionMoldId, {
        productionMoldId: saved.productionMoldId,
        acceptedAt: timestamp
      })
      return { productionMold: saved }
    })
  }

  /** moveTooling records a storage or carrier placement fact and updates the current placement projection. */
  async moveTooling(input: MoveToolingInput): Promise<{ placement: ToolingPlacementSummaryRecord }> {
    return this.executeIdempotent(input, 'MoveTooling', async () => {
      assertCommandContext(input)
      assertPrecondition(input.toolingType === ToolingType.MOLD, 'unsupported tooling type')
      assertRequiredString(input.toolingId, 'toolingId')
      assertStorageOrCarrier(input.toStorageResourceRef, input.toCarrierResourceRef, true)
      const orgId = resolveContextOrgId(input)
      const tooling = await this.loadVisibleProductionMold(input.tenantId, orgId, input.toolingId)
      assertPrecondition(
        [ProductionMoldStatus.AVAILABLE, ProductionMoldStatus.MAINTENANCE, ProductionMoldStatus.DISABLED].includes(tooling.currentStatus),
        'production mold cannot move in current status'
      )
      const timestamp = normalizeOptionalString(input.movedAt) ?? nowIso()
      const movement = await this.repository.appendMoldMovement({
        moldMovementId: randomUUID(),
        tenantId: input.tenantId,
        orgId,
        toolingType: input.toolingType,
        toolingId: input.toolingId,
        fromStorageResourceRef: tooling.currentStorageResourceRef ?? null,
        fromCarrierResourceRef: tooling.currentCarrierResourceRef ?? null,
        toStorageResourceRef: input.toStorageResourceRef ? normalizeStorageRef(input.toStorageResourceRef) : null,
        toCarrierResourceRef: input.toCarrierResourceRef ? normalizeCarrierRef(input.toCarrierResourceRef) : null,
        movementReason: normalizeOptionalString(input.movementReason) ?? null,
        movedAt: timestamp,
        operatorRef: buildOperatorRef(input),
        auditRef: buildAuditRef(input)
      })
      const saved = await this.repository.saveProductionMold({
        ...tooling,
        currentStorageResourceRef: movement.toStorageResourceRef ?? null,
        currentCarrierResourceRef: movement.toCarrierResourceRef ?? null,
        updatedAt: timestamp
      })
      const placement = assertExists(
        await this.repository.getToolingCurrentPlacement(input.tenantId, input.toolingType, input.toolingId),
        'ToolingPlacement',
        input.toolingId
      )
      await this.appendAudit(input, 'MoveTooling', 'PRODUCTION_MOLD', saved.productionMoldId, tooling, saved)
      await this.appendOutbox(input, 'ToolingMoved', 'PRODUCTION_MOLD', saved.productionMoldId, {
        toolingId: saved.productionMoldId,
        movedAt: timestamp
      })
      return { placement }
    })
  }

  /** installTooling creates one active tooling installation and marks the production mold installed. */
  async installTooling(input: InstallToolingInput): Promise<{ toolingInstallation: ToolingInstallationRecord }> {
    return this.executeIdempotent(input, 'InstallTooling', async () => {
      assertCommandContext(input)
      assertPrecondition(input.toolingType === ToolingType.MOLD, 'unsupported tooling type')
      assertRequiredString(input.toolingId, 'toolingId')
      const workCenterRef = normalizeWorkCenterRef(input.workCenterRef)
      const workUnitRef = input.workUnitRef ? normalizeWorkUnitRef(input.workUnitRef) : null
      const orgId = resolveContextOrgId(input)
      const mold = await this.loadVisibleProductionMold(input.tenantId, orgId, input.toolingId)
      assertPrecondition(mold.currentStatus === ProductionMoldStatus.AVAILABLE, 'only available production molds can be installed')
      assertAlreadyAbsent(
        !(await this.repository.findActiveToolingInstallationByMold(input.tenantId, input.toolingId)),
        'production mold already has an active tooling installation'
      )
      const timestamp = normalizeOptionalString(input.installedAt) ?? nowIso()
      const toolingInstallationId = randomUUID()
      const activeInstallations = await this.repository.listActiveToolingInstallationsByWorkCenter({
        tenantId: input.tenantId,
        orgId,
        workCenterId: workCenterRef.workCenterId
      })
      const moldPositionIndex = resolveInstallPositionIndex(input.moldPositionIndex, activeInstallations)
      await this.shiftActiveInstallationsAtOrAfter(input, activeInstallations, moldPositionIndex, 1)
      const toolingInstallation: ToolingInstallationRecord = {
        toolingInstallationId,
        tenantId: input.tenantId,
        orgId,
        toolingType: input.toolingType,
        toolingId: input.toolingId,
        workCenterRef,
        workUnitRef,
        installedAt: timestamp,
        unmountedAt: null,
        installedByRef: buildOperatorRef(input),
        unmountedByRef: null,
        status: ToolingInstallationStatus.ACTIVE,
        moldDetail: normalizeMoldDetail(toolingInstallationId, input, moldPositionIndex),
        auditRef: buildAuditRef(input)
      }
      const savedInstallation = await this.repository.saveToolingInstallation(toolingInstallation)
      const savedMold = await this.repository.saveProductionMold({
        ...mold,
        currentStatus: ProductionMoldStatus.MAINTENANCE,
        currentStorageResourceRef: null,
        currentCarrierResourceRef: null,
        currentInstallationSummary: savedInstallation,
        updatedAt: timestamp
      })
      await this.appendAudit(input, 'InstallTooling', 'PRODUCTION_MOLD', savedMold.productionMoldId, mold, savedMold)
      await this.appendOutbox(input, 'ToolingInstalled', 'PRODUCTION_MOLD', savedMold.productionMoldId, {
        productionMoldId: savedMold.productionMoldId,
        toolingInstallationId: savedInstallation.toolingInstallationId,
        installedAt: timestamp
      })
      return { toolingInstallation: savedInstallation }
    })
  }

  /** unmountTooling closes an active tooling installation and returns the mold to available state. */
  async unmountTooling(input: UnmountToolingInput): Promise<{ toolingInstallation: ToolingInstallationRecord }> {
    return this.executeIdempotent(input, 'UnmountTooling', async () => {
      assertCommandContext(input)
      const orgId = resolveContextOrgId(input)
      assertRequiredString(input.toolingInstallationId, 'toolingInstallationId')
      const current = await this.loadVisibleToolingInstallation(input.tenantId, orgId, input.toolingInstallationId)
      assertPrecondition(current.status === ToolingInstallationStatus.ACTIVE, 'tooling installation is not active')
      const mold = await this.loadVisibleProductionMold(input.tenantId, orgId, current.toolingId)
      const timestamp = normalizeOptionalString(input.unmountedAt) ?? nowIso()
      const removedIndex = current.moldDetail?.moldPositionIndex
      const savedInstallation = await this.repository.saveToolingInstallation({
        ...current,
        unmountedAt: timestamp,
        unmountedByRef: buildOperatorRef(input),
        status: ToolingInstallationStatus.UNMOUNTED
      })
      if (removedIndex) {
        const activeInstallations = await this.repository.listActiveToolingInstallationsByWorkCenter({
          tenantId: input.tenantId,
          orgId,
          workCenterId: current.workCenterRef.workCenterId
        })
        await this.shiftActiveInstallationsAfter(input, activeInstallations, removedIndex, -1)
      }
      const nextStatus = mold.currentStatus === ProductionMoldStatus.SCRAP_PENDING ? ProductionMoldStatus.SCRAPPED : ProductionMoldStatus.AVAILABLE
      const savedMold = await this.repository.saveProductionMold({
        ...mold,
        currentStatus: nextStatus,
        currentInstallationSummary: null,
        scrappedAt: nextStatus === ProductionMoldStatus.SCRAPPED ? timestamp : mold.scrappedAt ?? null,
        updatedAt: timestamp
      })
      await this.appendAudit(input, 'UnmountTooling', 'PRODUCTION_MOLD', savedMold.productionMoldId, mold, savedMold)
      await this.appendOutbox(input, 'ToolingUnmounted', 'PRODUCTION_MOLD', savedMold.productionMoldId, {
        productionMoldId: savedMold.productionMoldId,
        toolingInstallationId: savedInstallation.toolingInstallationId,
        unmountedAt: timestamp
      })
      if (nextStatus === ProductionMoldStatus.SCRAPPED) {
        await this.appendOutbox(input, 'ProductionMoldScrapped', 'PRODUCTION_MOLD', savedMold.productionMoldId, {
          productionMoldId: savedMold.productionMoldId,
          scrappedAt: timestamp
        })
      }
      return { toolingInstallation: savedInstallation }
    })
  }

  /** confirmInstalledMoldReady marks an actively installed mold ready for casting usage. */
  async confirmInstalledMoldReady(input: ConfirmInstalledMoldReadyInput): Promise<{ productionMold: ProductionMoldRecord }> {
    return this.executeIdempotent(input, 'ConfirmInstalledMoldReady', async () => {
      assertCommandContext(input)
      const orgId = resolveContextOrgId(input)
      assertRequiredString(input.productionMoldId, 'productionMoldId')
      assertRequiredString(input.toolingInstallationId, 'toolingInstallationId')
      const mold = await this.loadVisibleProductionMold(input.tenantId, orgId, input.productionMoldId)
      assertPrecondition(mold.currentStatus === ProductionMoldStatus.MAINTENANCE, 'only maintenance production molds can be marked ready')
      const current = await this.loadVisibleToolingInstallation(input.tenantId, orgId, input.toolingInstallationId)
      assertPrecondition(current.status === ToolingInstallationStatus.ACTIVE, 'tooling installation is not active')
      assertPrecondition(current.toolingId === input.productionMoldId, 'tooling installation does not match production mold')
      const timestamp = normalizeOptionalString(input.confirmedAt) ?? nowIso()
      const saved = await this.repository.saveProductionMold({
        ...mold,
        currentStatus: ProductionMoldStatus.READY,
        currentInstallationSummary: current,
        updatedAt: timestamp
      })
      await this.appendAudit(input, 'ConfirmInstalledMoldReady', 'PRODUCTION_MOLD', saved.productionMoldId, mold, saved)
      await this.appendOutbox(input, 'InstalledMoldReadyConfirmed', 'PRODUCTION_MOLD', saved.productionMoldId, {
        productionMoldId: saved.productionMoldId,
        toolingInstallationId: current.toolingInstallationId,
        confirmedAt: timestamp
      })
      return { productionMold: saved }
    })
  }

  /** markInstalledMoldMaintenance returns a ready installed mold to maintenance with an audit reason. */
  async markInstalledMoldMaintenance(input: MarkInstalledMoldMaintenanceInput): Promise<{ productionMold: ProductionMoldRecord }> {
    return this.executeIdempotent(input, 'MarkInstalledMoldMaintenance', async () => {
      assertCommandContext(input)
      assertRequiredString(input.auditContext.reason, 'auditContext.reason')
      const orgId = resolveContextOrgId(input)
      assertRequiredString(input.productionMoldId, 'productionMoldId')
      assertRequiredString(input.toolingInstallationId, 'toolingInstallationId')
      const mold = await this.loadVisibleProductionMold(input.tenantId, orgId, input.productionMoldId)
      assertPrecondition(mold.currentStatus === ProductionMoldStatus.READY, 'only ready production molds can return to maintenance')
      const current = await this.loadVisibleToolingInstallation(input.tenantId, orgId, input.toolingInstallationId)
      assertPrecondition(current.status === ToolingInstallationStatus.ACTIVE, 'tooling installation is not active')
      assertPrecondition(current.toolingId === input.productionMoldId, 'tooling installation does not match production mold')
      const timestamp = normalizeOptionalString(input.markedAt) ?? nowIso()
      const saved = await this.repository.saveProductionMold({
        ...mold,
        currentStatus: ProductionMoldStatus.MAINTENANCE,
        currentInstallationSummary: current,
        updatedAt: timestamp
      })
      await this.appendAudit(input, 'MarkInstalledMoldMaintenance', 'PRODUCTION_MOLD', saved.productionMoldId, mold, saved)
      await this.appendOutbox(input, 'InstalledMoldMaintenanceMarked', 'PRODUCTION_MOLD', saved.productionMoldId, {
        productionMoldId: saved.productionMoldId,
        toolingInstallationId: current.toolingInstallationId,
        markedAt: timestamp
      })
      return { productionMold: saved }
    })
  }

  /** recordMoldUsage appends usage truth and increments the independent life counter. */
  async recordMoldUsage(input: RecordMoldUsageInput): Promise<{
    moldUsageRecord: MoldUsageRecord
    moldLifeCounter: MoldLifeCounterRecord
  }> {
    return this.executeIdempotent(input, 'RecordMoldUsage', async () => {
      assertCommandContext(input)
      assertRequiredString(input.productionMoldId, 'productionMoldId')
      const usageQuantity = assertPositiveQuantity(input.usageQuantity, 'usageQuantity')
      const orgId = resolveContextOrgId(input)
      const mold = await this.loadVisibleProductionMold(input.tenantId, orgId, input.productionMoldId)
      assertPrecondition(mold.currentStatus === ProductionMoldStatus.READY, 'production mold must be ready before usage')
      const activeInstallation = assertVisibleByOrg(
        assertExists(
          await this.repository.findActiveToolingInstallationByMold(input.tenantId, input.productionMoldId),
          'ToolingInstallation',
          input.productionMoldId
        ),
        orgId,
        'ToolingInstallation',
        input.productionMoldId
      )
      assertStaleGuard(
        input.toolingInstallationId === activeInstallation.toolingInstallationId,
        'stale tooling installation',
        { expected: activeInstallation.toolingInstallationId, actual: input.toolingInstallationId }
      )
      const workCenterRef = normalizeWorkCenterRef(input.workCenterRef)
      assertPrecondition(workCenterRef.workCenterId === activeInstallation.workCenterRef.workCenterId, 'usage work center does not match active installation')
      const workUnitRef = input.workUnitRef ? normalizeWorkUnitRef(input.workUnitRef) : null
      assertPrecondition(
        !workUnitRef || workUnitRef.workUnitId === activeInstallation.workUnitRef?.workUnitId,
        'usage work unit does not match active installation'
      )
      const counter = assertExists(
        await this.repository.findMoldLifeCounterByProductionMold(input.tenantId, input.productionMoldId),
        'MoldLifeCounter',
        input.productionMoldId
      )
      assertVisibleByOrg(counter, orgId, 'MoldLifeCounter', counter.moldLifeCounterId)
      const lifeUnit = normalizeOptionalString(input.lifeUnit)?.toUpperCase() ?? counter.lifeUnit
      assertPrecondition(counter.lifeUnit === lifeUnit, 'life unit does not match counter')
      const timestamp = normalizeOptionalString(input.usedAt) ?? nowIso()
      const lifeDelta = usageQuantity
      const usageRecord: MoldUsageRecord = {
        moldUsageRecordId: randomUUID(),
        tenantId: input.tenantId,
        orgId: resolveContextOrgId(input),
        productionMoldId: input.productionMoldId,
        toolingInstallationId: activeInstallation.toolingInstallationId,
        workCenterRef,
        workUnitRef,
        usedAt: timestamp,
        usageQuantity,
        lifeDelta,
        lifeUnit,
        productionSpecRef: input.productionSpecRef ? normalizeProductionSpecRef(input.productionSpecRef) : null,
        productionUnitRef: input.productionUnitRef ? normalizeProductionUnitRef(input.productionUnitRef) : null,
        traceSubjectRef: input.traceSubjectRef ? normalizeTraceSubjectRef(input.traceSubjectRef) : null,
        operatorRef: buildOperatorRef(input),
        captureSource: normalizeOptionalString(input.captureSource) ?? null,
        auditRef: buildAuditRef(input),
        moldDesignOutputId: normalizeOptionalString(input.moldDesignOutputId) ?? null,
        moldDesignOutputOptionId: normalizeOptionalString(input.moldDesignOutputOptionId) ?? null
      }
      const savedUsage = await this.repository.appendMoldUsageRecord(usageRecord)
      const savedCounter = await this.repository.saveMoldLifeCounter({
        ...counter,
        usedValue: (Number(counter.usedValue) + Number(lifeDelta)).toString(),
        lastUsageRecordId: savedUsage.moldUsageRecordId,
        updatedAt: timestamp
      })
      await this.appendAudit(input, 'RecordMoldUsage', 'PRODUCTION_MOLD', mold.productionMoldId, counter, savedCounter)
      await this.appendOutbox(input, 'MoldUsageRecorded', 'PRODUCTION_MOLD', mold.productionMoldId, {
        productionMoldId: mold.productionMoldId,
        moldUsageRecordId: savedUsage.moldUsageRecordId,
        lifeDelta,
        lifeUnit
      })
      return {
        moldUsageRecord: savedUsage,
        moldLifeCounter: savedCounter
      }
    })
  }

  /** recordMoldUsageBatch records submitted WorkCenter mold usage rows as one transactional command. */
  async recordMoldUsageBatch(input: RecordMoldUsageBatchInput): Promise<{
    moldUsageRecords: MoldUsageRecord[]
    moldLifeCounters: MoldLifeCounterRecord[]
  }> {
    return this.executeIdempotent(input, 'RecordMoldUsageBatch', async () => {
      assertCommandContext(input)
      const workCenterRef = normalizeWorkCenterRef(input.workCenterRef)
      const workUnitRef = input.workUnitRef ? normalizeWorkUnitRef(input.workUnitRef) : null
      const submittedLines = input.lines.filter((line) => line.isSubmitted)
      assertInvalidArgument(submittedLines.length > 0, 'at least one submitted usage line is required')
      const timestamp = normalizeOptionalString(input.usedAt) ?? nowIso()
      const savedUsageRecords: MoldUsageRecord[] = []
      const savedCounters: MoldLifeCounterRecord[] = []
      for (const line of submittedLines) {
        const result = await this.recordMoldUsageLine({
          context: input,
          productionMoldId: line.productionMoldId,
          toolingInstallationId: line.toolingInstallationId,
          workCenterRef,
          workUnitRef,
          usedAt: timestamp,
          usageQuantity: line.usageQuantity,
          lifeUnit: normalizeOptionalString(input.lifeUnit)?.toUpperCase() ?? null,
          productionSpecRef: line.productionSpecRef,
          productionUnitRef: line.productionUnitRef,
          traceSubjectRef: line.traceSubjectRef,
          captureSource: normalizeOptionalString(input.captureSource) ?? null,
          moldDesignOutputId: line.moldDesignOutputId,
          moldDesignOutputOptionId: line.moldDesignOutputOptionId
        })
        savedUsageRecords.push(result.moldUsageRecord)
        savedCounters.push(result.moldLifeCounter)
      }
      await this.appendOutbox(input, 'MoldUsageBatchRecorded', 'WORK_CENTER', workCenterRef.workCenterId, {
        workCenterId: workCenterRef.workCenterId,
        usageRecordIds: savedUsageRecords.map((record) => record.moldUsageRecordId)
      })
      return {
        moldUsageRecords: savedUsageRecords,
        moldLifeCounters: savedCounters
      }
    })
  }

  /** adjustMoldLifeCounter performs an authorized life counter correction without deleting history. */
  async adjustMoldLifeCounter(input: AdjustMoldLifeCounterInput): Promise<{ moldLifeCounter: MoldLifeCounterRecord }> {
    return this.executeIdempotent(input, 'AdjustMoldLifeCounter', async () => {
      assertCommandContext(input)
      const orgId = resolveContextOrgId(input)
      assertRequiredString(input.moldLifeCounterId, 'moldLifeCounterId')
      const value = assertNonNegativeQuantity(input.value, 'value')
      const counter = assertVisibleByOrg(
        assertExists(await this.repository.findMoldLifeCounterById(input.tenantId, input.moldLifeCounterId), 'MoldLifeCounter', input.moldLifeCounterId),
        orgId,
        'MoldLifeCounter',
        input.moldLifeCounterId
      )
      const mold = await this.loadVisibleProductionMold(input.tenantId, orgId, counter.productionMoldId)
      assertPrecondition(mold.currentStatus !== ProductionMoldStatus.SCRAPPED, 'scrapped production mold life cannot be adjusted')
      const timestamp = nowIso()
      const next = applyLifeAdjustment(counter, input.adjustmentType, value)
      next.lastAdjustedAt = timestamp
      next.lastAdjustedByRef = buildOperatorRef(input)
      next.adjustmentReason = input.auditContext.reason
      next.updatedAt = timestamp
      const savedCounter = await this.repository.saveMoldLifeCounter(next)
      await this.appendAudit(input, 'AdjustMoldLifeCounter', 'PRODUCTION_MOLD', savedCounter.productionMoldId, counter, savedCounter)
      await this.appendOutbox(input, 'MoldLifeCounterAdjusted', 'PRODUCTION_MOLD', savedCounter.productionMoldId, {
        productionMoldId: savedCounter.productionMoldId,
        moldLifeCounterId: savedCounter.moldLifeCounterId,
        adjustmentType: input.adjustmentType
      })
      return { moldLifeCounter: savedCounter }
    })
  }

  /** markProductionMoldForScrap marks a production mold pending scrap without unmounting installed molds. */
  async markProductionMoldForScrap(input: MarkProductionMoldForScrapInput): Promise<{
    productionMold: ProductionMoldRecord
  }> {
    return this.executeIdempotent(input, 'MarkProductionMoldForScrap', async () => {
      assertCommandContext(input)
      const orgId = resolveContextOrgId(input)
      assertRequiredString(input.productionMoldId, 'productionMoldId')
      const mold = await this.loadVisibleProductionMold(input.tenantId, orgId, input.productionMoldId)
      assertPrecondition(
        mold.currentStatus !== ProductionMoldStatus.SCRAP_PENDING && mold.currentStatus !== ProductionMoldStatus.SCRAPPED,
        'production mold is already marked for scrap or scrapped'
      )
      const timestamp = normalizeOptionalString(input.markedAt) ?? nowIso()
      const activeInstallation = await this.repository.findActiveToolingInstallationByMold(input.tenantId, input.productionMoldId)
      if (activeInstallation) {
        assertVisibleByOrg(activeInstallation, orgId, 'ToolingInstallation', activeInstallation.toolingInstallationId)
      }
      const nextStatus = activeInstallation ? ProductionMoldStatus.SCRAP_PENDING : ProductionMoldStatus.SCRAPPED
      const saved = await this.repository.saveProductionMold({
        ...mold,
        currentStatus: nextStatus,
        currentStorageResourceRef: activeInstallation ? mold.currentStorageResourceRef ?? null : null,
        currentCarrierResourceRef: activeInstallation ? mold.currentCarrierResourceRef ?? null : null,
        currentInstallationSummary: activeInstallation ? activeInstallation : null,
        scrappedAt: nextStatus === ProductionMoldStatus.SCRAPPED ? timestamp : null,
        updatedAt: timestamp
      })
      await this.appendAudit(input, 'MarkProductionMoldForScrap', 'PRODUCTION_MOLD', saved.productionMoldId, mold, saved)
      await this.appendOutbox(input, nextStatus === ProductionMoldStatus.SCRAP_PENDING ? 'ProductionMoldMarkedForScrap' : 'ProductionMoldScrapped', 'PRODUCTION_MOLD', saved.productionMoldId, {
        productionMoldId: saved.productionMoldId,
        markedAt: timestamp,
        status: nextStatus
      })
      return {
        productionMold: saved
      }
    })
  }

  /** recordMoldUsageLine validates one submitted usage row and persists usage plus counter facts. */
  private async recordMoldUsageLine(input: {
    context: MesCommandContext
    productionMoldId: string
    toolingInstallationId: string
    workCenterRef: WorkCenterRefRecord
    workUnitRef: WorkUnitRefRecord | null
    usedAt: string
    usageQuantity: string
    lifeUnit?: string | null
    productionSpecRef?: ProductionSpecRefRecord | null
    productionUnitRef?: ProductionUnitRefRecord | null
    traceSubjectRef?: TraceSubjectRefRecord | null
    captureSource?: string | null
    moldDesignOutputId?: string | null
    moldDesignOutputOptionId?: string | null
  }): Promise<{ moldUsageRecord: MoldUsageRecord; moldLifeCounter: MoldLifeCounterRecord }> {
    const context = input.context
    assertRequiredString(input.productionMoldId, 'productionMoldId')
    assertRequiredString(input.toolingInstallationId, 'toolingInstallationId')
    const usageQuantity = assertPositiveQuantity(input.usageQuantity, 'usageQuantity')
    const orgId = resolveContextOrgId(context)
    const mold = await this.loadVisibleProductionMold(context.tenantId, orgId, input.productionMoldId)
    assertPrecondition(mold.currentStatus === ProductionMoldStatus.READY, 'production mold must be ready before usage')
    const activeInstallation = assertVisibleByOrg(
      assertExists(
        await this.repository.findActiveToolingInstallationByMold(context.tenantId, input.productionMoldId),
        'ToolingInstallation',
        input.productionMoldId
      ),
      orgId,
      'ToolingInstallation',
      input.productionMoldId
    )
    assertStaleGuard(input.toolingInstallationId === activeInstallation.toolingInstallationId, 'stale tooling installation', {
      expected: activeInstallation.toolingInstallationId,
      actual: input.toolingInstallationId
    })
    assertPrecondition(input.workCenterRef.workCenterId === activeInstallation.workCenterRef.workCenterId, 'usage work center does not match active installation')
    assertPrecondition(
      !input.workUnitRef || input.workUnitRef.workUnitId === activeInstallation.workUnitRef?.workUnitId,
      'usage work unit does not match active installation'
    )
    const counter = assertVisibleByOrg(
      assertExists(
        await this.repository.findMoldLifeCounterByProductionMold(context.tenantId, input.productionMoldId),
        'MoldLifeCounter',
        input.productionMoldId
      ),
      orgId,
      'MoldLifeCounter',
      input.productionMoldId
    )
    const lifeUnit = input.lifeUnit ?? counter.lifeUnit
    assertPrecondition(counter.lifeUnit === lifeUnit, 'life unit does not match counter')
    const usageRecord: MoldUsageRecord = {
      moldUsageRecordId: randomUUID(),
      tenantId: context.tenantId,
      orgId,
      productionMoldId: input.productionMoldId,
      toolingInstallationId: activeInstallation.toolingInstallationId,
      workCenterRef: input.workCenterRef,
      workUnitRef: input.workUnitRef,
      usedAt: input.usedAt,
      usageQuantity,
      lifeDelta: usageQuantity,
      lifeUnit,
      productionSpecRef: input.productionSpecRef ? normalizeProductionSpecRef(input.productionSpecRef) : null,
      productionUnitRef: input.productionUnitRef ? normalizeProductionUnitRef(input.productionUnitRef) : null,
      traceSubjectRef: input.traceSubjectRef ? normalizeTraceSubjectRef(input.traceSubjectRef) : null,
      operatorRef: buildOperatorRef(context),
      captureSource: input.captureSource ?? null,
      auditRef: buildAuditRef(context),
      moldDesignOutputId: normalizeOptionalString(input.moldDesignOutputId) ?? null,
      moldDesignOutputOptionId: normalizeOptionalString(input.moldDesignOutputOptionId) ?? null
    }
    const savedUsage = await this.repository.appendMoldUsageRecord(usageRecord)
    const savedCounter = await this.repository.saveMoldLifeCounter({
      ...counter,
      usedValue: (Number(counter.usedValue) + Number(usageQuantity)).toString(),
      lastUsageRecordId: savedUsage.moldUsageRecordId,
      updatedAt: input.usedAt
    })
    await this.appendAudit(context, 'RecordMoldUsage', 'PRODUCTION_MOLD', mold.productionMoldId, counter, savedCounter)
    return { moldUsageRecord: savedUsage, moldLifeCounter: savedCounter }
  }

  /** assertProductionSpecRefsVisibleAndActive rejects mold designs that reference unavailable production specs. */
  private async assertProductionSpecRefsVisibleAndActive(input: RegisterMoldDesignInput, orgId: string | null): Promise<void> {
    const productionSpecIds = Array.from(
      new Set(
        [
          ...(input.productionSpecRefs ?? []).map((ref) => ref.productionSpecId),
          ...input.outputs.flatMap((output) => [
            output.productionSpecRef?.productionSpecId,
            ...(output.options ?? []).map((option) => option.productionSpecRef?.productionSpecId)
          ])
        ]
          .filter((value): value is string => typeof value === 'string')
          .map((value) => value.trim())
          .filter(Boolean)
      )
    )
    if (productionSpecIds.length === 0) {
      return
    }
    const result = await this.productionSpecRepository.resolveProductionSpecsForMold({
      tenantId: input.tenantId,
      orgId,
      productionSpecIds
    })
    const resolvedIds = new Set(
      result.resolvedSpecs
        .filter((spec) => spec.status === ProductionSpecStatus.ACTIVE)
        .map((spec) => spec.productionSpecId)
    )
    const unavailableIds = new Set(result.unavailableRefs.map((ref) => ref.refId))
    const unavailableRefs = [
      ...result.unavailableRefs,
      ...productionSpecIds
        .filter((productionSpecId) => !resolvedIds.has(productionSpecId) && !unavailableIds.has(productionSpecId))
        .map((refId) => ({ refId, reasonCode: 'NOT_ACTIVE' }))
    ]
    assertPrecondition(unavailableRefs.length === 0, 'mold design production specs must be active and visible', {
      unavailableRefs
    })
  }

  /** loadVisibleProductionMold loads a production mold and applies the application org boundary. */
  private async loadVisibleProductionMold(tenantId: string, orgId: string | null, productionMoldId: string): Promise<ProductionMoldRecord> {
    return assertVisibleByOrg(
      assertExists(await this.repository.findProductionMoldById(tenantId, productionMoldId), 'ProductionMold', productionMoldId),
      orgId,
      'ProductionMold',
      productionMoldId
    )
  }

  /** loadVisibleToolingInstallation loads a tooling installation and applies the application org boundary. */
  private async loadVisibleToolingInstallation(tenantId: string, orgId: string | null, toolingInstallationId: string): Promise<ToolingInstallationRecord> {
    return assertVisibleByOrg(
      assertExists(await this.repository.findToolingInstallationById(tenantId, toolingInstallationId), 'ToolingInstallation', toolingInstallationId),
      orgId,
      'ToolingInstallation',
      toolingInstallationId
    )
  }

  /** shiftActiveInstallationsAtOrAfter keeps WorkCenter mold position indexes unique and continuous during insertion. */
  private async shiftActiveInstallationsAtOrAfter(
    context: MesCommandContext,
    activeInstallations: ToolingInstallationRecord[],
    targetIndex: number,
    delta: 1
  ): Promise<void> {
    const affected = activeInstallations
      .filter((installation) => (installation.moldDetail?.moldPositionIndex ?? 0) >= targetIndex)
      .sort((left, right) => (right.moldDetail?.moldPositionIndex ?? 0) - (left.moldDetail?.moldPositionIndex ?? 0))
    for (const installation of affected) {
      await this.repository.saveToolingInstallation({
        ...installation,
        moldDetail: {
          ...assertExists(installation.moldDetail, 'MoldInstallationDetail', installation.toolingInstallationId),
          moldPositionIndex: (installation.moldDetail?.moldPositionIndex ?? 0) + delta
        }
      })
    }
  }

  /** shiftActiveInstallationsAfter keeps WorkCenter mold position indexes continuous after removal. */
  private async shiftActiveInstallationsAfter(
    context: MesCommandContext,
    activeInstallations: ToolingInstallationRecord[],
    removedIndex: number,
    delta: -1
  ): Promise<void> {
    const affected = activeInstallations
      .filter((installation) => (installation.moldDetail?.moldPositionIndex ?? 0) > removedIndex)
      .sort((left, right) => (left.moldDetail?.moldPositionIndex ?? 0) - (right.moldDetail?.moldPositionIndex ?? 0))
    for (const installation of affected) {
      await this.repository.saveToolingInstallation({
        ...installation,
        moldDetail: {
          ...assertExists(installation.moldDetail, 'MoldInstallationDetail', installation.toolingInstallationId),
          moldPositionIndex: (installation.moldDetail?.moldPositionIndex ?? 0) + delta
        }
      })
    }
  }

  /** executeIdempotent keeps command replay semantics, state changes, audit, and outbox in one local transaction. */
  private async executeIdempotent<T>(context: MesCommandContext, commandName: string, handler: () => Promise<T>): Promise<T> {
    return this.repository.runInTransaction(async () => {
      assertCommandContext(context)
      const requestHash = hashCommandPayload(commandName, stableCommandPayload(context))
      const existing = await this.repository.findCommandIdempotencyRecord(context.tenantId, context.commandId)
      if (existing) {
        assertAlreadyAbsent(existing.commandName === commandName && existing.requestHash === requestHash, 'idempotency conflict', {
          commandId: context.commandId,
          commandName
        })
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
        assertAlreadyAbsent(record.commandName === commandName && record.requestHash === requestHash, 'idempotency conflict', {
          commandId: context.commandId,
          commandName
        })
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

  /** appendAudit persists one local success audit envelope inside the command transaction. */
  private async appendAudit(
    context: MesCommandContext,
    eventType: string,
    resourceType: string,
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
      module: 'mold-management',
      eventType,
      occurredAt: timestamp,
      result: 'SUCCEEDED',
      operatorId: context.operatorContext.operatorId,
      operatorType: context.operatorContext.operatorType,
      traceId: context.traceContext.traceId,
      commandId: context.commandId,
      reason: context.auditContext.reason,
      resourceType,
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

  /** appendOutbox persists one pending integration event inside the command transaction. */
  private async appendOutbox(
    context: MesCommandContext,
    eventType: string,
    aggregateType: string,
    aggregateId: string,
    payload: Record<string, unknown>
  ): Promise<MesOutboxEventRecord> {
    const timestamp = nowIso()
    return this.repository.appendOutboxEvent({
      mesOutboxEventId: randomUUID(),
      tenantId: context.tenantId,
      orgId: resolveContextOrgId(context),
      eventType,
      aggregateType,
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

/** normalizeOutput validates and normalizes one theoretical mold output row. */
function normalizeOutput(
  input: RegisterMoldDesignInput,
  orgId: string | null,
  moldDesignId: string,
  output: RegisterMoldDesignInput['outputs'][number]
): MoldDesignOutputRecord {
  const moldDesignOutputId = normalizeOptionalString(output.moldDesignOutputId) ?? randomUUID()
  return {
    moldDesignOutputId,
    tenantId: input.tenantId,
    orgId,
    moldDesignId,
    sequenceNo: output.sequenceNo,
    outputCode: normalizeCode(output.outputCode, 'outputs.outputCode'),
    outputKind: output.outputKind,
    productionSpecRef: output.productionSpecRef ? normalizeProductionSpecRef(output.productionSpecRef) : null,
    itemModelRef: output.itemModelRef ? normalizeItemModelRef(output.itemModelRef) : null,
    quantityPerUse: assertPositiveQuantity(output.quantityPerUse, 'outputs.quantityPerUse'),
    componentRole: normalizeOptionalString(output.componentRole) ?? null,
    assemblyHint: normalizeOptionalString(output.assemblyHint) ?? null,
    isPrimaryOutput: output.isPrimaryOutput,
    options: (output.options ?? []).map((option) => ({
      moldDesignOutputOptionId: normalizeOptionalString(option.moldDesignOutputOptionId) ?? randomUUID(),
      tenantId: input.tenantId,
      orgId,
      moldDesignId,
      moldDesignOutputId,
      optionCode: normalizeCode(option.optionCode, 'outputs.options.optionCode'),
      label: normalizeRequiredValue(option.label, 'outputs.options.label'),
      productionSpecRef: option.productionSpecRef ? normalizeProductionSpecRef(option.productionSpecRef) : null,
      quantityPerUse: option.quantityPerUse ? assertPositiveQuantity(option.quantityPerUse, 'outputs.options.quantityPerUse') : null,
      isDefault: option.isDefault ?? false
    }))
  }
}

/** normalizeProductionSpecRef validates a ProductionSpec display reference. */
function normalizeProductionSpecRef(ref: ProductionSpecRefRecord): ProductionSpecRefRecord {
  assertRequiredString(ref?.productionSpecId, 'productionSpecRef.productionSpecId')
  return {
    productionSpecId: ref.productionSpecId.trim(),
    specCodeSnapshot: normalizeOptionalString(ref.specCodeSnapshot) ?? null,
    displayNameSnapshot: normalizeOptionalString(ref.displayNameSnapshot) ?? null
  }
}

/** normalizeStorageRef validates a fixed or semi-fixed storage resource reference. */
function normalizeStorageRef(ref: StorageResourceRefRecord): StorageResourceRefRecord {
  assertRequiredString(ref?.storageResourceId, 'storageResourceRef.storageResourceId')
  return {
    storageResourceId: ref.storageResourceId.trim(),
    resourceCodeSnapshot: normalizeOptionalString(ref.resourceCodeSnapshot) ?? null,
    displayNameSnapshot: normalizeOptionalString(ref.displayNameSnapshot) ?? null
  }
}

/** normalizeCarrierRef validates a movable carrier resource reference. */
function normalizeCarrierRef(ref: CarrierResourceRefRecord): CarrierResourceRefRecord {
  assertRequiredString(ref?.carrierResourceId, 'carrierResourceRef.carrierResourceId')
  return {
    carrierResourceId: ref.carrierResourceId.trim(),
    resourceCodeSnapshot: normalizeOptionalString(ref.resourceCodeSnapshot) ?? null,
    displayNameSnapshot: normalizeOptionalString(ref.displayNameSnapshot) ?? null
  }
}

/** normalizeWorkCenterRef validates an execution-unit reference. */
function normalizeWorkCenterRef(ref: WorkCenterRefRecord): WorkCenterRefRecord {
  assertRequiredString(ref?.workCenterId, 'workCenterRef.workCenterId')
  return {
    workCenterId: ref.workCenterId.trim(),
    workCenterCodeSnapshot: normalizeOptionalString(ref.workCenterCodeSnapshot) ?? null,
    displayNameSnapshot: normalizeOptionalString(ref.displayNameSnapshot) ?? null
  }
}

/** normalizeWorkUnitRef validates an optional work point reference. */
function normalizeWorkUnitRef(ref: WorkUnitRefRecord): WorkUnitRefRecord {
  assertRequiredString(ref?.workUnitId, 'workUnitRef.workUnitId')
  return {
    workUnitId: ref.workUnitId.trim(),
    workUnitCodeSnapshot: normalizeOptionalString(ref.workUnitCodeSnapshot) ?? null,
    displayNameSnapshot: normalizeOptionalString(ref.displayNameSnapshot) ?? null
  }
}

/** normalizeMoldDetail validates mold-specific fields nested under a tooling installation. */
function normalizeMoldDetail(toolingInstallationId: string, input: InstallToolingInput, moldPositionIndex: number): MoldInstallationDetailRecord {
  return {
    toolingInstallationId,
    moldPositionIndex,
    cavityPosition: normalizeOptionalString(input.cavityPosition) ?? null,
    cavityMapping: normalizeOptionalString(input.cavityMapping) ?? null,
    setupParameters: normalizeOptionalString(input.setupParameters) ?? null
  }
}

/** resolveInstallPositionIndex computes the inserted or appended production-line mold position. */
function resolveInstallPositionIndex(inputIndex: number | null | undefined, activeInstallations: ToolingInstallationRecord[]): number {
  const activeIndexes = activeInstallations
    .map((installation) => installation.moldDetail?.moldPositionIndex)
    .filter((index): index is number => typeof index === 'number')
  const maxIndex = activeIndexes.length > 0 ? Math.max(...activeIndexes) : 0
  if (inputIndex === null || inputIndex === undefined) {
    return maxIndex + 1
  }
  assertInvalidArgument(Number.isInteger(inputIndex) && inputIndex > 0, 'moldPositionIndex must be a positive integer')
  assertInvalidArgument(inputIndex <= maxIndex + 1, 'moldPositionIndex cannot skip positions')
  return inputIndex
}

/** normalizeItemModelRef validates an ItemModel display reference without copying external truth. */
function normalizeItemModelRef(ref: ItemModelRefRecord): ItemModelRefRecord {
  assertRequiredString(ref?.itemModelId, 'itemModelRef.itemModelId')
  return {
    itemModelId: ref.itemModelId.trim(),
    modelCodeSnapshot: normalizeOptionalString(ref.modelCodeSnapshot) ?? null,
    modelNameSnapshot: normalizeOptionalString(ref.modelNameSnapshot) ?? null
  }
}

/** normalizeSupplierRef validates a supplier display reference without copying external truth. */
function normalizeSupplierRef(ref: SupplierRefRecord): SupplierRefRecord {
  assertRequiredString(ref?.supplierId, 'supplierRef.supplierId')
  return {
    supplierId: ref.supplierId.trim(),
    supplierCodeSnapshot: normalizeOptionalString(ref.supplierCodeSnapshot) ?? null,
    supplierDisplayNameSnapshot: normalizeOptionalString(ref.supplierDisplayNameSnapshot) ?? null
  }
}

/** normalizePurchaseRef validates a procurement display reference without copying external truth. */
function normalizePurchaseRef(ref: PurchaseRefRecord): PurchaseRefRecord {
  return {
    purchaseSourceType: ref.purchaseSourceType,
    purchaseSourceId: normalizeOptionalString(ref.purchaseSourceId) ?? null,
    purchaseNoSnapshot: normalizeOptionalString(ref.purchaseNoSnapshot) ?? null
  }
}

/** normalizeProductionUnitRef validates an optional production unit reference for usage facts. */
function normalizeProductionUnitRef(ref: ProductionUnitRefRecord): ProductionUnitRefRecord {
  assertRequiredString(ref?.productionUnitId, 'productionUnitRef.productionUnitId')
  return {
    productionUnitId: ref.productionUnitId.trim(),
    unitCodeSnapshot: normalizeOptionalString(ref.unitCodeSnapshot) ?? null,
    displayNameSnapshot: normalizeOptionalString(ref.displayNameSnapshot) ?? null
  }
}

/** normalizeTraceSubjectRef validates an optional trace identity reference for usage facts. */
function normalizeTraceSubjectRef(ref: TraceSubjectRefRecord): TraceSubjectRefRecord {
  assertRequiredString(ref?.traceSubjectId, 'traceSubjectRef.traceSubjectId')
  return {
    traceSubjectId: ref.traceSubjectId.trim(),
    traceCodeSnapshot: normalizeOptionalString(ref.traceCodeSnapshot) ?? null,
    displayNameSnapshot: normalizeOptionalString(ref.displayNameSnapshot) ?? null
  }
}

/** normalizeRequiredValue returns a trimmed required string for nested object fields. */
function normalizeRequiredValue(value: string | null | undefined, field: string): string {
  assertRequiredString(value, field)
  return value.trim()
}

/** normalizeStringList canonicalizes optional string tags. */
function normalizeStringList(values: string[]): string[] {
  return Array.from(new Set(values.map((value) => value.trim().toUpperCase()).filter(Boolean)))
}

/** assertStorageOrCarrier enforces exactly one placement target when a target is required. */
function assertStorageOrCarrier(
  storageRef?: StorageResourceRefRecord | null,
  carrierRef?: CarrierResourceRefRecord | null,
  required = false
): void {
  const hasStorage = !!storageRef?.storageResourceId
  const hasCarrier = !!carrierRef?.carrierResourceId
  assertPrecondition(!(hasStorage && hasCarrier), 'storage and carrier placement cannot both be set')
  assertInvalidArgument(!required || hasStorage || hasCarrier, 'a storage or carrier placement is required')
}

/** assertVisibleByOrg hides cross-org records behind NOT_FOUND semantics. */
function assertVisibleByOrg<T extends { orgId?: string | null }>(
  record: T,
  orgId: string | null,
  resource: string,
  identifier: string
): T {
  return assertExists((record.orgId ?? null) === orgId ? record : null, resource, identifier)
}

/** isProductionMoldRecord distinguishes production mold lifecycle records from master mold records. */
function isProductionMoldRecord(record: ProductionMoldRecord | MasterMoldRecord): record is ProductionMoldRecord {
  return 'productionMoldId' in record
}

/** toStorageCarrierPlacement converts a storage or carrier projection into the current placement summary. */
function toStorageCarrierPlacement(
  storageResourceRef: StorageResourceRefRecord | null,
  carrierResourceRef: CarrierResourceRefRecord | null
): ToolingPlacementSummaryRecord {
  if (carrierResourceRef) {
    return {
      placementType: ToolingPlacementType.CARRIER_RESOURCE,
      carrierResourceRef
    }
  }
  return {
    placementType: ToolingPlacementType.STORAGE_RESOURCE,
    storageResourceRef
  }
}

/** applyLifeAdjustment applies one authorized counter correction to a cloned counter record. */
function applyLifeAdjustment(
  counter: MoldLifeCounterRecord,
  adjustmentType: MoldLifeAdjustmentType,
  value: string
): MoldLifeCounterRecord {
  const next = JSON.parse(JSON.stringify(counter)) as MoldLifeCounterRecord
  if (adjustmentType === MoldLifeAdjustmentType.SET_USED_VALUE) {
    next.usedValue = value
  } else if (adjustmentType === MoldLifeAdjustmentType.ADD_USED_VALUE) {
    next.usedValue = (Number(counter.usedValue) + Number(value)).toString()
  } else if (adjustmentType === MoldLifeAdjustmentType.SET_LIMIT_VALUE) {
    next.limitValue = value
  } else if (adjustmentType === MoldLifeAdjustmentType.SET_WARNING_THRESHOLD) {
    next.warningThresholdValue = value
  } else {
    assertInvalidArgument(false, 'unsupported life adjustment type')
  }
  return next
}

/** buildAuditRef creates a small fact-level pointer to the command audit envelope. */
function buildAuditRef(context: MesCommandContext): AuditRefRecord {
  return {
    auditId: context.auditContext.auditId,
    commandId: context.commandId,
    reason: context.auditContext.reason
  }
}

/** buildOperatorRef creates the append-only operator snapshot for mold facts. */
function buildOperatorRef(context: MesCommandContext): OperatorRefRecord {
  return {
    operatorId: context.operatorContext.operatorId,
    displayNameSnapshot: context.operatorContext.operatorId
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

/** stableCommandPayload excludes retry-local trace and audit envelopes from idempotency conflict checks. */
function stableCommandPayload(context: MesCommandContext): Record<string, unknown> {
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
