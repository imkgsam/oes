import { createHash, randomUUID } from 'node:crypto'
import { Inject, Injectable } from '@nestjs/common'
import { TOKENS } from '../../common/constants/tokens'
import {
  AuditRefRecord,
  ExternalRefRecord,
  ItemRefRecord,
  ManufacturingMasterDataRefRecord,
  MasterMoldRecord,
  MesAuditEnvelopeRecord,
  MesCommandContext,
  MesLocationRecord,
  MesOutboxEventRecord,
  MoldDesignOutputKind,
  MoldDesignOutputRecord,
  MoldDesignRecord,
  MoldDesignStatus,
  MoldFunctionRole,
  MoldInstallationRecord,
  MoldInstallationStatus,
  MoldLifeAdjustmentType,
  MoldLifeCounterRecord,
  MoldMovementEventRecord,
  MoldOutputStructureType,
  MoldResourceType,
  MoldUsageEventRecord,
  MoldUsageMode,
  MoldWarningAcknowledgementAction,
  MoldWarningEventRecord,
  MoldWarningLevel,
  MoldWarningStatus,
  MoldWarningType,
  OperatorRefRecord,
  ProductionMoldInstanceRecord,
  ProductionMoldInstanceStatus,
  ProductionMoldInstanceView,
  PurchaseRefRecord,
  SupplierRefRecord
} from '../../domain/models/mes-mold-records'
import { MesMoldRepository } from '../../domain/repositories/mes-mold.repository'
import {
  assertAlreadyAbsent,
  assertExists,
  assertPermission,
  assertPositiveQuantity,
  assertPrecondition,
  assertRequiredString,
  assertStaleGuard,
  normalizeCode,
  normalizeOptionalString,
  assertNonNegativeQuantity,
  nowIso
} from '../support/mes-assertions'
import { MesMoldReadModel } from './mes-mold-read-model'

export interface RegisterMoldDesignInput extends MesCommandContext {
  moldDesignId?: string
  designCode: string
  name: string
  revisionCode?: string | null
  supersedesDesignId?: string | null
  productFamilyRef: ManufacturingMasterDataRefRecord
  manufacturingSpecRefs?: ManufacturingMasterDataRefRecord[]
  itemRef?: ItemRefRecord | null
  materialType: string
  functionRole: MoldFunctionRole
  productionMethodTags?: string[]
  outputStructureType: MoldOutputStructureType
  outputs: Array<{
    moldDesignOutputId?: string
    sequenceNo: number
    outputCode: string
    outputKind: MoldDesignOutputKind
    productFamilyRef?: ManufacturingMasterDataRefRecord | null
    manufacturingSpecRef?: ManufacturingMasterDataRefRecord | null
    quantityPerUse: string
    componentRole?: string | null
    assemblyHint?: string | null
    isPrimaryOutput: boolean
  }>
  defaultLifeLimit?: string | null
  defaultLifeUnit?: string | null
  reason: string
}

export interface RegisterMasterMoldInput extends MesCommandContext {
  masterMoldId?: string
  masterMoldCode: string
  moldDesignId: string
  supplierRef?: SupplierRefRecord | null
  purchaseRef?: PurchaseRefRecord | null
  receivedAt?: string | null
  initialMesLocationId?: string | null
  qualitySummary?: string | null
  notes?: string | null
  reason: string
}

export interface RegisterProductionMoldInstanceInput extends MesCommandContext {
  productionMoldInstanceId?: string
  moldInstanceCode: string
  moldDesignId: string
  masterMoldId?: string | null
  supplierRef?: SupplierRefRecord | null
  purchaseRef?: PurchaseRefRecord | null
  receivedAt?: string | null
  acceptedAt?: string | null
  initialStatus?: ProductionMoldInstanceStatus
  initialMesLocationId?: string | null
  lifeLimitValue?: string | null
  lifeUnit?: string | null
  warningThresholdValue?: string | null
  reason: string
}

export interface MoveMoldInput extends MesCommandContext {
  moldResourceType: MoldResourceType
  moldResourceId: string
  fromMesLocationId?: string | null
  toMesLocationId: string
  movementReason: string
  movedAt?: string | null
}

export interface InstallMoldInput extends MesCommandContext {
  productionMoldInstanceId: string
  workCenterId: string
  resourcePositionId: string
  installedAt?: string | null
  setupSnapshot?: string | null
  operationRef?: ExternalRefRecord | null
  routingRef?: ExternalRefRecord | null
  workOrderRef?: ExternalRefRecord | null
  operationTaskRef?: ExternalRefRecord | null
  reason: string
}

export interface UnmountMoldInput extends MesCommandContext {
  productionMoldInstanceId: string
  moldInstallationId?: string | null
  unmountedAt?: string | null
  nextStatus: ProductionMoldInstanceStatus
  toMesLocationId?: string | null
  reason: string
}

export interface RecordMoldUsageInput extends MesCommandContext {
  productionMoldInstanceId: string
  moldInstallationId?: string | null
  workCenterId: string
  resourcePositionId?: string | null
  usageMode: MoldUsageMode
  usedAt?: string | null
  usageQuantity: string
  lifeDelta: string
  lifeUnit: string
  productFamilyRef?: ManufacturingMasterDataRefRecord | null
  manufacturingSpecRef?: ManufacturingMasterDataRefRecord | null
  wipUnitRef?: ExternalRefRecord | null
  physicalTraceId?: string | null
  workOrderRef?: ExternalRefRecord | null
  operationTaskRef?: ExternalRefRecord | null
  captureSource: string
  reason?: string | null
}

export interface AdjustMoldLifeInput extends MesCommandContext {
  productionMoldInstanceId: string
  adjustmentType: MoldLifeAdjustmentType
  adjustmentValue: string
  lifeUnit: string
  authorizationRef?: ExternalRefRecord | null
  reason: string
}

export interface AcknowledgeMoldWarningInput extends MesCommandContext {
  moldWarningEventId: string
  acknowledgementAction: MoldWarningAcknowledgementAction
  comment?: string | null
  reason: string
}

export interface ScrapMoldInput extends MesCommandContext {
  moldResourceType: MoldResourceType
  moldResourceId: string
  scrapReason: string
  scrappedAt?: string | null
  closeCurrentInstallation?: boolean
  toMesLocationId?: string | null
}

/** MesMoldManagementService owns phase 1 mold command rules, local transactions, audit, and outbox recording. */
@Injectable()
export class MesMoldManagementService {
  private readonly readModel: MesMoldReadModel

  constructor(
    @Inject(TOKENS.MES_MOLD_REPOSITORY)
    private readonly repository: MesMoldRepository
  ) {
    this.readModel = new MesMoldReadModel(repository)
  }

  /** registerMoldDesign creates a MES tooling design with at least one primary output and a local outbox event. */
  async registerMoldDesign(input: RegisterMoldDesignInput): Promise<MoldDesignRecord> {
    return this.executeIdempotent(input, 'RegisterMoldDesign', async () => {
      this.assertCommandContext(input)
      const designCode = normalizeCode(input.designCode, 'designCode')
      assertRequiredString(input.name, 'name')
      assertRequiredString(input.materialType, 'materialType')
      assertRequiredString(input.reason, 'reason')
      assertPrecondition(input.functionRole === MoldFunctionRole.PRODUCTION || input.functionRole === MoldFunctionRole.MASTER, 'invalid mold function role')
      assertPrecondition(
        Object.values(MoldOutputStructureType).includes(input.outputStructureType),
        'invalid output structure type'
      )
      assertPrecondition(input.outputs.some((output) => output.isPrimaryOutput), 'mold design requires primary output')
      assertAlreadyAbsent(
        !(await this.repository.findMoldDesignByCode(input.tenantId, input.orgId, designCode)),
        'duplicate design code',
        { designCode }
      )

      const timestamp = nowIso()
      const moldDesignId = normalizeOptionalString(input.moldDesignId) ?? randomUUID()
      const record: MoldDesignRecord = {
        moldDesignId,
        tenantId: input.tenantId,
        orgId: input.orgId ?? null,
        designCode,
        name: input.name.trim(),
        revisionCode: normalizeOptionalString(input.revisionCode) ?? null,
        supersedesDesignId: normalizeOptionalString(input.supersedesDesignId) ?? null,
        productFamilyRef: normalizeMasterDataRef(input.productFamilyRef, 'productFamilyRef', 'PRODUCT_FAMILY'),
        manufacturingSpecRefs: (input.manufacturingSpecRefs ?? []).map((ref, index) =>
          normalizeMasterDataRef(ref, `manufacturingSpecRefs.${index}`, 'MANUFACTURING_SPEC')
        ),
        itemRef: input.itemRef ? normalizeItemRef(input.itemRef) : null,
        materialType: input.materialType.trim().toUpperCase(),
        functionRole: input.functionRole,
        productionMethodTags: Array.from(
          new Set((input.productionMethodTags ?? []).map((value) => value.trim().toUpperCase()).filter(Boolean))
        ),
        outputStructureType: input.outputStructureType,
        outputs: input.outputs.map((output): MoldDesignOutputRecord => ({
          moldDesignOutputId: normalizeOptionalString(output.moldDesignOutputId) ?? randomUUID(),
          tenantId: input.tenantId,
          orgId: input.orgId ?? null,
          moldDesignId,
          sequenceNo: output.sequenceNo,
          outputCode: normalizeCode(output.outputCode, 'outputs.outputCode'),
          outputKind: output.outputKind,
          productFamilyRef: output.productFamilyRef
            ? normalizeMasterDataRef(output.productFamilyRef, 'outputs.productFamilyRef', 'PRODUCT_FAMILY')
            : null,
          manufacturingSpecRef: output.manufacturingSpecRef
            ? normalizeMasterDataRef(output.manufacturingSpecRef, 'outputs.manufacturingSpecRef', 'MANUFACTURING_SPEC')
            : null,
          quantityPerUse: assertPositiveQuantity(output.quantityPerUse, 'outputs.quantityPerUse'),
          componentRole: normalizeOptionalString(output.componentRole) ?? null,
          assemblyHint: normalizeOptionalString(output.assemblyHint) ?? null,
          isPrimaryOutput: output.isPrimaryOutput
        })),
        defaultLifeLimit: input.defaultLifeLimit
          ? assertPositiveQuantity(input.defaultLifeLimit, 'defaultLifeLimit')
          : null,
        defaultLifeUnit: normalizeOptionalString(input.defaultLifeUnit)?.toUpperCase() ?? null,
        status: MoldDesignStatus.ACTIVE,
        createdAt: timestamp,
        updatedAt: timestamp
      }

      const saved = await this.repository.saveMoldDesign(record)
      const audit = await this.appendAudit(input, 'RegisterMoldDesign', 'MOLD_DESIGN', saved.moldDesignId, null, saved)
      await this.appendOutbox(input, 'MoldRegistered', 'MOLD_DESIGN', saved.moldDesignId, {
        moldResourceType: 'MOLD_DESIGN',
        moldResourceId: saved.moldDesignId,
        moldDesignId: saved.moldDesignId,
        moldCode: saved.designCode,
        registeredAt: timestamp,
        auditRef: audit.mesAuditEnvelopeId
      })
      return saved
    })
  }

  /** registerMasterMold records a master mold asset without allowing it into production installation or usage. */
  async registerMasterMold(input: RegisterMasterMoldInput): Promise<MasterMoldRecord> {
    return this.executeIdempotent(input, 'RegisterMasterMold', async () => {
      this.assertCommandContext(input)
      const masterMoldCode = normalizeCode(input.masterMoldCode, 'masterMoldCode')
      assertRequiredString(input.moldDesignId, 'moldDesignId')
      assertRequiredString(input.reason, 'reason')
      assertExists(await this.repository.findMoldDesignById(input.tenantId, input.moldDesignId), 'MoldDesign', input.moldDesignId)
      assertAlreadyAbsent(
        !(await this.repository.findMasterMoldByCode(input.tenantId, input.orgId, masterMoldCode)),
        'duplicate master mold code',
        { masterMoldCode }
      )
      if (input.initialMesLocationId) {
        await this.assertActiveMesLocation(input.tenantId, input.initialMesLocationId)
      }

      const timestamp = nowIso()
      const record: MasterMoldRecord = {
        masterMoldId: normalizeOptionalString(input.masterMoldId) ?? randomUUID(),
        tenantId: input.tenantId,
        orgId: input.orgId ?? null,
        masterMoldCode,
        moldDesignId: input.moldDesignId,
        supplierRef: input.supplierRef ? normalizeSupplierRef(input.supplierRef) : null,
        purchaseRef: input.purchaseRef ? normalizePurchaseRef(input.purchaseRef) : null,
        receivedAt: normalizeOptionalString(input.receivedAt) ?? null,
        currentStatus: 'RECEIVED',
        currentMesLocationId: normalizeOptionalString(input.initialMesLocationId) ?? null,
        qualitySummary: normalizeOptionalString(input.qualitySummary) ?? null,
        notes: normalizeOptionalString(input.notes) ?? null,
        scrappedAt: null,
        createdAt: timestamp,
        updatedAt: timestamp
      }
      const saved = await this.repository.saveMasterMold(record)
      const audit = await this.appendAudit(input, 'RegisterMasterMold', 'MASTER_MOLD', saved.masterMoldId, null, saved)
      await this.appendOutbox(input, 'MoldRegistered', 'MASTER_MOLD', saved.masterMoldId, {
        moldResourceType: MoldResourceType.MASTER_MOLD,
        moldResourceId: saved.masterMoldId,
        moldDesignId: saved.moldDesignId,
        moldCode: saved.masterMoldCode,
        registeredAt: timestamp,
        auditRef: audit.mesAuditEnvelopeId
      })
      return saved
    })
  }

  /** registerProductionMoldInstance creates a production mold and its initial life counter in one transaction. */
  async registerProductionMoldInstance(input: RegisterProductionMoldInstanceInput): Promise<{
    productionMoldInstance: ProductionMoldInstanceView
    moldLifeCounter: MoldLifeCounterRecord
  }> {
    return this.executeIdempotent(input, 'RegisterProductionMoldInstance', async () => {
      this.assertCommandContext(input)
      const moldInstanceCode = normalizeCode(input.moldInstanceCode, 'moldInstanceCode')
      assertRequiredString(input.moldDesignId, 'moldDesignId')
      assertRequiredString(input.reason, 'reason')
      const design = assertExists(
        await this.repository.findMoldDesignById(input.tenantId, input.moldDesignId),
        'MoldDesign',
        input.moldDesignId
      )
      if (input.masterMoldId) {
        assertExists(await this.repository.findMasterMoldById(input.tenantId, input.masterMoldId), 'MasterMold', input.masterMoldId)
      }
      if (input.initialMesLocationId) {
        await this.assertActiveMesLocation(input.tenantId, input.initialMesLocationId)
      }
      assertAlreadyAbsent(
        !(await this.repository.findProductionMoldInstanceByCode(input.tenantId, input.orgId, moldInstanceCode)),
        'duplicate production mold code',
        { moldInstanceCode }
      )
      const initialStatus = input.initialStatus ?? ProductionMoldInstanceStatus.RECEIVED
      assertPrecondition(
        [
          ProductionMoldInstanceStatus.RECEIVED,
          ProductionMoldInstanceStatus.PENDING_DRYING,
          ProductionMoldInstanceStatus.PENDING_INSTALLATION
        ].includes(initialStatus),
        'invalid initial mold status',
        { initialStatus }
      )

      const timestamp = nowIso()
      const productionMoldInstanceId = normalizeOptionalString(input.productionMoldInstanceId) ?? randomUUID()
      const lifeLimitValue = input.lifeLimitValue
        ? assertPositiveQuantity(input.lifeLimitValue, 'lifeLimitValue')
        : design.defaultLifeLimit
          ? assertPositiveQuantity(design.defaultLifeLimit, 'defaultLifeLimit')
          : '0'
      const lifeUnit = normalizeOptionalString(input.lifeUnit)?.toUpperCase() ?? design.defaultLifeUnit ?? 'USE'
      const warningThresholdValue = input.warningThresholdValue
        ? assertNonNegativeQuantity(input.warningThresholdValue, 'warningThresholdValue')
        : lifeLimitValue === '0'
          ? '0'
          : (Number(lifeLimitValue) * 0.8).toString()
      const instance: ProductionMoldInstanceRecord = {
        productionMoldInstanceId,
        tenantId: input.tenantId,
        orgId: input.orgId ?? null,
        moldInstanceCode,
        moldDesignId: input.moldDesignId,
        masterMoldId: normalizeOptionalString(input.masterMoldId) ?? null,
        supplierRef: input.supplierRef ? normalizeSupplierRef(input.supplierRef) : null,
        purchaseRef: input.purchaseRef ? normalizePurchaseRef(input.purchaseRef) : null,
        receivedAt: normalizeOptionalString(input.receivedAt) ?? null,
        acceptedAt: normalizeOptionalString(input.acceptedAt) ?? null,
        currentStatus: initialStatus,
        currentMesLocationId: normalizeOptionalString(input.initialMesLocationId) ?? null,
        currentWorkCenterId: null,
        currentResourcePositionId: null,
        currentInstallationId: null,
        lifeUsedValue: '0',
        lifeLimitValue,
        lifeUnit,
        warningLevel: MoldWarningLevel.INFO,
        scrappedAt: null,
        createdAt: timestamp,
        updatedAt: timestamp
      }
      const lifeCounter: MoldLifeCounterRecord = {
        moldLifeCounterId: randomUUID(),
        tenantId: input.tenantId,
        orgId: input.orgId ?? null,
        productionMoldInstanceId,
        lifeUnit,
        usedValue: '0',
        limitValue: lifeLimitValue,
        warningThresholdValue,
        lastUsageEventId: null,
        lastAdjustedAt: null,
        lastAdjustedByRef: null,
        adjustmentReason: null,
        updatedAt: timestamp
      }
      await this.repository.saveProductionMoldInstance(instance)
      const savedCounter = await this.repository.saveMoldLifeCounter(lifeCounter)
      const audit = await this.appendAudit(
        input,
        'RegisterProductionMoldInstance',
        'PRODUCTION_MOLD_INSTANCE',
        productionMoldInstanceId,
        null,
        instance
      )
      await this.appendOutbox(input, 'MoldRegistered', 'PRODUCTION_MOLD_INSTANCE', productionMoldInstanceId, {
        moldResourceType: MoldResourceType.PRODUCTION_MOLD_INSTANCE,
        moldResourceId: productionMoldInstanceId,
        moldDesignId: instance.moldDesignId,
        moldCode: instance.moldInstanceCode,
        registeredAt: timestamp,
        auditRef: audit.mesAuditEnvelopeId
      })
      return {
        productionMoldInstance: await this.readModel.buildProductionMoldInstanceView(instance),
        moldLifeCounter: savedCounter
      }
    })
  }

  /** moveMold records one MES physical movement and updates the current location projection. */
  async moveMold(input: MoveMoldInput): Promise<{
    movementEvent: MoldMovementEventRecord
    moldCurrentLocation: Awaited<ReturnType<MesMoldReadModel['buildCurrentLocation']>>
  }> {
    return this.executeIdempotent(input, 'MoveMold', async () => {
      this.assertCommandContext(input)
      assertRequiredString(input.moldResourceId, 'moldResourceId')
      assertRequiredString(input.toMesLocationId, 'toMesLocationId')
      assertRequiredString(input.movementReason, 'movementReason')
      const toLocation = await this.assertActiveMesLocation(input.tenantId, input.toMesLocationId)
      const timestamp = normalizeOptionalString(input.movedAt) ?? nowIso()
      const auditRef = this.buildAuditRef(input)
      const operatorRef = this.buildOperatorRef(input)

      let fromMesLocationId: string | null = null
      if (input.moldResourceType === MoldResourceType.MASTER_MOLD) {
        const master = assertExists(
          await this.repository.findMasterMoldById(input.tenantId, input.moldResourceId),
          'MasterMold',
          input.moldResourceId
        )
        fromMesLocationId = master.currentMesLocationId ?? null
        assertStaleGuard(
          !input.fromMesLocationId || input.fromMesLocationId === fromMesLocationId,
          'stale mold location',
          { expected: fromMesLocationId, actual: input.fromMesLocationId }
        )
        assertPrecondition(
          master.currentStatus !== 'SCRAPPED' || isScrapLocation(toLocation),
          'scrapped mold can only move to scrap holding location'
        )
        await this.repository.saveMasterMold({
          ...master,
          currentMesLocationId: input.toMesLocationId,
          updatedAt: timestamp
        })
      } else {
        const instance = assertExists(
          await this.repository.findProductionMoldInstanceById(input.tenantId, input.moldResourceId),
          'ProductionMoldInstance',
          input.moldResourceId
        )
        fromMesLocationId = instance.currentMesLocationId ?? null
        assertStaleGuard(
          !input.fromMesLocationId || input.fromMesLocationId === fromMesLocationId,
          'stale mold location',
          { expected: fromMesLocationId, actual: input.fromMesLocationId }
        )
        assertPrecondition(instance.currentStatus !== ProductionMoldInstanceStatus.INSTALLED, 'installed mold cannot be moved directly')
        assertPrecondition(
          instance.currentStatus !== ProductionMoldInstanceStatus.SCRAPPED || isScrapLocation(toLocation),
          'scrapped mold can only move to scrap holding location'
        )
        await this.repository.saveProductionMoldInstance({
          ...instance,
          currentMesLocationId: input.toMesLocationId,
          currentStatus:
            instance.currentStatus === ProductionMoldInstanceStatus.PENDING_DRYING && isAvailableLocation(toLocation)
              ? ProductionMoldInstanceStatus.PENDING_INSTALLATION
              : instance.currentStatus,
          updatedAt: timestamp
        })
      }

      const movementEvent = await this.repository.appendMovementEvent({
        moldMovementEventId: randomUUID(),
        tenantId: input.tenantId,
        orgId: input.orgId ?? null,
        moldResourceType: input.moldResourceType,
        moldResourceId: input.moldResourceId,
        fromMesLocationId,
        toMesLocationId: input.toMesLocationId,
        movementReason: input.movementReason.trim(),
        movedAt: timestamp,
        operatorRef,
        sourceCommandId: input.commandId,
        auditRef
      })
      await this.appendAudit(input, 'MoveMold', input.moldResourceType, input.moldResourceId, { fromMesLocationId }, movementEvent)
      await this.appendOutbox(input, 'MoldMoved', input.moldResourceType, input.moldResourceId, {
        moldResourceType: input.moldResourceType,
        moldResourceId: input.moldResourceId,
        fromMesLocationId,
        toMesLocationId: input.toMesLocationId,
        movementReason: input.movementReason,
        movedAt: timestamp,
        operatorRef
      })
      return {
        movementEvent,
        moldCurrentLocation: await this.readModel.buildCurrentLocation(input)
      }
    })
  }

  /** installMold validates state, work-center position compatibility, and occupancy before creating an installation fact. */
  async installMold(input: InstallMoldInput): Promise<{
    moldInstallation: MoldInstallationRecord
    productionMoldInstance: ProductionMoldInstanceView
  }> {
    return this.executeIdempotent(input, 'InstallMold', async () => {
      this.assertCommandContext(input)
      assertRequiredString(input.productionMoldInstanceId, 'productionMoldInstanceId')
      assertRequiredString(input.workCenterId, 'workCenterId')
      assertRequiredString(input.resourcePositionId, 'resourcePositionId')
      assertRequiredString(input.reason, 'reason')
      const instance = assertExists(
        await this.repository.findProductionMoldInstanceById(input.tenantId, input.productionMoldInstanceId),
        'ProductionMoldInstance',
        input.productionMoldInstanceId
      )
      assertPrecondition(instance.currentStatus === ProductionMoldInstanceStatus.PENDING_INSTALLATION, 'mold status is not installable', {
        currentStatus: instance.currentStatus
      })
      const workCenter = assertExists(
        await this.repository.findWorkCenterById(input.tenantId, input.workCenterId),
        'WorkCenter',
        input.workCenterId
      )
      const position = assertExists(
        await this.repository.findResourcePositionById(input.tenantId, input.resourcePositionId),
        'ResourcePosition',
        input.resourcePositionId
      )
      assertPrecondition(workCenter.status === 'ACTIVE', 'work center is not active')
      assertPrecondition(position.status === 'ACTIVE', 'resource position is not active')
      assertPrecondition(position.workCenterId === workCenter.workCenterId, 'resource position does not belong to work center')
      assertPrecondition(
        position.compatibleMoldDesignRefs.length === 0 || position.compatibleMoldDesignRefs.includes(instance.moldDesignId),
        'resource position is not compatible with mold design'
      )
      assertAlreadyAbsent(
        !(await this.repository.findActiveInstallationByPosition(input.tenantId, position.resourcePositionId)),
        'resource position is occupied'
      )
      assertAlreadyAbsent(
        !(await this.repository.findActiveInstallationByMold(input.tenantId, instance.productionMoldInstanceId)),
        'mold already has an active installation'
      )

      const timestamp = normalizeOptionalString(input.installedAt) ?? nowIso()
      const installation: MoldInstallationRecord = {
        moldInstallationId: randomUUID(),
        tenantId: input.tenantId,
        orgId: input.orgId ?? null,
        productionMoldInstanceId: instance.productionMoldInstanceId,
        workCenterId: workCenter.workCenterId,
        resourcePositionId: position.resourcePositionId,
        installedAt: timestamp,
        unmountedAt: null,
        installedByRef: this.buildOperatorRef(input),
        unmountedByRef: null,
        installationStatus: MoldInstallationStatus.ACTIVE,
        setupSnapshot: normalizeOptionalString(input.setupSnapshot) ?? null,
        operationRef: input.operationRef ? normalizeExternalRef(input.operationRef, 'operationRef') : null,
        routingRef: input.routingRef ? normalizeExternalRef(input.routingRef, 'routingRef') : null,
        workOrderRef: input.workOrderRef ? normalizeExternalRef(input.workOrderRef, 'workOrderRef') : null,
        operationTaskRef: input.operationTaskRef ? normalizeExternalRef(input.operationTaskRef, 'operationTaskRef') : null,
        auditRef: this.buildAuditRef(input)
      }
      const savedInstallation = await this.repository.saveMoldInstallation(installation)
      const updatedInstance = await this.repository.saveProductionMoldInstance({
        ...instance,
        currentStatus: ProductionMoldInstanceStatus.INSTALLED,
        currentWorkCenterId: workCenter.workCenterId,
        currentResourcePositionId: position.resourcePositionId,
        currentInstallationId: installation.moldInstallationId,
        updatedAt: timestamp
      })
      await this.appendAudit(input, 'InstallMold', 'PRODUCTION_MOLD_INSTANCE', instance.productionMoldInstanceId, instance, updatedInstance)
      await this.appendOutbox(input, 'MoldInstalled', 'PRODUCTION_MOLD_INSTANCE', instance.productionMoldInstanceId, {
        productionMoldInstanceId: instance.productionMoldInstanceId,
        moldInstallationId: installation.moldInstallationId,
        workCenterId: workCenter.workCenterId,
        resourcePositionId: position.resourcePositionId,
        installedAt: timestamp,
        operatorRef: installation.installedByRef
      })
      return {
        moldInstallation: savedInstallation,
        productionMoldInstance: await this.readModel.buildProductionMoldInstanceView(updatedInstance)
      }
    })
  }

  /** unmountMold closes the active installation and clears current installation projections in one transaction. */
  async unmountMold(input: UnmountMoldInput): Promise<{
    moldInstallation: MoldInstallationRecord
    productionMoldInstance: ProductionMoldInstanceView
  }> {
    return this.executeIdempotent(input, 'UnmountMold', async () => {
      this.assertCommandContext(input)
      assertRequiredString(input.productionMoldInstanceId, 'productionMoldInstanceId')
      assertRequiredString(input.reason, 'reason')
      assertPrecondition(
        [
          ProductionMoldInstanceStatus.PENDING_INSTALLATION,
          ProductionMoldInstanceStatus.PENDING_REPAIR,
          ProductionMoldInstanceStatus.DISABLED
        ].includes(input.nextStatus),
        'invalid next status for unmount'
      )
      if (input.toMesLocationId) {
        await this.assertActiveMesLocation(input.tenantId, input.toMesLocationId)
      }
      const instance = assertExists(
        await this.repository.findProductionMoldInstanceById(input.tenantId, input.productionMoldInstanceId),
        'ProductionMoldInstance',
        input.productionMoldInstanceId
      )
      const activeInstallation = assertExists(
        await this.repository.findActiveInstallationByMold(input.tenantId, input.productionMoldInstanceId),
        'MoldInstallation',
        input.productionMoldInstanceId
      )
      assertStaleGuard(
        !input.moldInstallationId || input.moldInstallationId === activeInstallation.moldInstallationId,
        'stale mold installation',
        { expected: activeInstallation.moldInstallationId, actual: input.moldInstallationId }
      )

      const timestamp = normalizeOptionalString(input.unmountedAt) ?? nowIso()
      const closedInstallation = await this.repository.saveMoldInstallation({
        ...activeInstallation,
        unmountedAt: timestamp,
        unmountedByRef: this.buildOperatorRef(input),
        installationStatus: MoldInstallationStatus.UNMOUNTED
      })
      const updatedInstance = await this.repository.saveProductionMoldInstance({
        ...instance,
        currentStatus: input.nextStatus,
        currentWorkCenterId: null,
        currentResourcePositionId: null,
        currentInstallationId: null,
        currentMesLocationId: normalizeOptionalString(input.toMesLocationId) ?? instance.currentMesLocationId ?? null,
        updatedAt: timestamp
      })
      await this.appendAudit(input, 'UnmountMold', 'PRODUCTION_MOLD_INSTANCE', instance.productionMoldInstanceId, instance, updatedInstance)
      await this.appendOutbox(input, 'MoldUnmounted', 'PRODUCTION_MOLD_INSTANCE', instance.productionMoldInstanceId, {
        productionMoldInstanceId: instance.productionMoldInstanceId,
        moldInstallationId: activeInstallation.moldInstallationId,
        workCenterId: activeInstallation.workCenterId,
        resourcePositionId: activeInstallation.resourcePositionId,
        unmountedAt: timestamp,
        nextStatus: input.nextStatus,
        operatorRef: this.buildOperatorRef(input)
      })
      return {
        moldInstallation: closedInstallation,
        productionMoldInstance: await this.readModel.buildProductionMoldInstanceView(updatedInstance)
      }
    })
  }

  /** recordMoldUsage appends usage truth, updates the life counter, and raises at most one open warning per type. */
  async recordMoldUsage(input: RecordMoldUsageInput): Promise<{
    usageEvent: MoldUsageEventRecord
    moldLifeCounter: MoldLifeCounterRecord
    raisedWarning: MoldWarningEventRecord | null
    productionMoldInstance: ProductionMoldInstanceView
  }> {
    return this.executeIdempotent(input, 'RecordMoldUsage', async () => {
      this.assertCommandContext(input)
      assertRequiredString(input.productionMoldInstanceId, 'productionMoldInstanceId')
      assertRequiredString(input.workCenterId, 'workCenterId')
      assertRequiredString(input.lifeUnit, 'lifeUnit')
      assertRequiredString(input.captureSource, 'captureSource')
      const usageQuantity = assertPositiveQuantity(input.usageQuantity, 'usageQuantity')
      const lifeDelta = assertPositiveQuantity(input.lifeDelta, 'lifeDelta')
      const instance = assertExists(
        await this.repository.findProductionMoldInstanceById(input.tenantId, input.productionMoldInstanceId),
        'ProductionMoldInstance',
        input.productionMoldInstanceId
      )
      assertPrecondition(instance.currentStatus === ProductionMoldInstanceStatus.INSTALLED, 'mold must be installed before usage')
      assertPrecondition(instance.currentStatus !== ProductionMoldInstanceStatus.SCRAPPED, 'scrapped mold cannot be used')
      const activeInstallation = assertExists(
        await this.repository.findActiveInstallationByMold(input.tenantId, instance.productionMoldInstanceId),
        'MoldInstallation',
        instance.productionMoldInstanceId
      )
      assertStaleGuard(
        !input.moldInstallationId || input.moldInstallationId === activeInstallation.moldInstallationId,
        'stale mold installation',
        { expected: activeInstallation.moldInstallationId, actual: input.moldInstallationId }
      )
      assertPrecondition(activeInstallation.workCenterId === input.workCenterId, 'usage work center does not match active installation')
      assertPrecondition(
        !input.resourcePositionId || input.resourcePositionId === activeInstallation.resourcePositionId,
        'usage resource position does not match active installation'
      )
      const counter = assertExists(
        await this.repository.findMoldLifeCounterByInstanceId(input.tenantId, instance.productionMoldInstanceId),
        'MoldLifeCounter',
        instance.productionMoldInstanceId
      )
      assertPrecondition(counter.lifeUnit === input.lifeUnit.toUpperCase(), 'life unit does not match counter')

      const timestamp = normalizeOptionalString(input.usedAt) ?? nowIso()
      const usedValueAfter = (Number(counter.usedValue) + Number(lifeDelta)).toString()
      const usageEvent = await this.repository.appendUsageEvent({
        moldUsageEventId: randomUUID(),
        tenantId: input.tenantId,
        orgId: input.orgId ?? null,
        productionMoldInstanceId: instance.productionMoldInstanceId,
        moldInstallationId: activeInstallation.moldInstallationId,
        workCenterId: activeInstallation.workCenterId,
        resourcePositionId: activeInstallation.resourcePositionId,
        usageMode: input.usageMode,
        usedAt: timestamp,
        usageQuantity,
        lifeDelta,
        lifeUnit: counter.lifeUnit,
        lifeUsedValueAfter: usedValueAfter,
        productFamilyRef: input.productFamilyRef ? normalizeMasterDataRef(input.productFamilyRef, 'productFamilyRef') : null,
        manufacturingSpecRef: input.manufacturingSpecRef
          ? normalizeMasterDataRef(input.manufacturingSpecRef, 'manufacturingSpecRef')
          : null,
        wipUnitRef: input.wipUnitRef ? normalizeExternalRef(input.wipUnitRef, 'wipUnitRef') : null,
        physicalTraceId: normalizeOptionalString(input.physicalTraceId) ?? null,
        workOrderRef: input.workOrderRef ? normalizeExternalRef(input.workOrderRef, 'workOrderRef') : null,
        operationTaskRef: input.operationTaskRef ? normalizeExternalRef(input.operationTaskRef, 'operationTaskRef') : null,
        operatorRef: this.buildOperatorRef(input),
        captureSource: input.captureSource.trim(),
        auditRef: this.buildAuditRef(input)
      })
      const updatedCounter = await this.repository.saveMoldLifeCounter({
        ...counter,
        usedValue: usedValueAfter,
        lastUsageEventId: usageEvent.moldUsageEventId,
        updatedAt: timestamp
      })
      const warningLevel = inferWarningLevel(updatedCounter)
      const updatedInstance = await this.repository.saveProductionMoldInstance({
        ...instance,
        lifeUsedValue: updatedCounter.usedValue,
        lifeLimitValue: updatedCounter.limitValue,
        warningLevel,
        updatedAt: timestamp
      })
      const raisedWarning = await this.raiseWarningIfNeeded(input, updatedCounter, usageEvent.moldUsageEventId, timestamp)
      await this.appendAudit(input, 'RecordMoldUsage', 'PRODUCTION_MOLD_INSTANCE', instance.productionMoldInstanceId, counter, updatedCounter)
      await this.appendOutbox(input, 'MoldUsageRecorded', 'PRODUCTION_MOLD_INSTANCE', instance.productionMoldInstanceId, {
        productionMoldInstanceId: instance.productionMoldInstanceId,
        moldInstallationId: activeInstallation.moldInstallationId,
        workCenterId: activeInstallation.workCenterId,
        usageQuantity,
        lifeDelta,
        lifeUnit: counter.lifeUnit,
        productFamilyRef: usageEvent.productFamilyRef,
        manufacturingSpecRef: usageEvent.manufacturingSpecRef,
        wipUnitRef: usageEvent.wipUnitRef,
        physicalTraceId: usageEvent.physicalTraceId,
        usedAt: timestamp,
        operatorRef: usageEvent.operatorRef
      })
      if (raisedWarning) {
        await this.appendOutbox(input, 'MoldLifeWarningRaised', 'PRODUCTION_MOLD_INSTANCE', instance.productionMoldInstanceId, {
          productionMoldInstanceId: instance.productionMoldInstanceId,
          warningType: raisedWarning.warningType,
          warningLevel: raisedWarning.warningLevel,
          lifeUsedValue: raisedWarning.lifeUsedValue,
          lifeLimitValue: raisedWarning.lifeLimitValue,
          raisedAt: raisedWarning.raisedAt
        })
      }

      return {
        usageEvent,
        moldLifeCounter: updatedCounter,
        raisedWarning,
        productionMoldInstance: await this.readModel.buildProductionMoldInstanceView(updatedInstance)
      }
    })
  }

  /** adjustMoldLife performs authorized counter corrections with audit and optional warning creation. */
  async adjustMoldLife(input: AdjustMoldLifeInput): Promise<{
    moldLifeCounter: MoldLifeCounterRecord
    raisedWarning: MoldWarningEventRecord | null
  }> {
    return this.executeIdempotent(input, 'AdjustMoldLife', async () => {
      this.assertCommandContext(input)
      assertRequiredString(input.productionMoldInstanceId, 'productionMoldInstanceId')
      assertRequiredString(input.lifeUnit, 'lifeUnit')
      assertRequiredString(input.reason, 'reason')
      assertPermission(!!input.authorizationRef?.refId, 'life adjustment requires authorization reference')
      const adjustmentValue = assertNonNegativeQuantity(input.adjustmentValue, 'adjustmentValue')
      const instance = assertExists(
        await this.repository.findProductionMoldInstanceById(input.tenantId, input.productionMoldInstanceId),
        'ProductionMoldInstance',
        input.productionMoldInstanceId
      )
      const counter = assertExists(
        await this.repository.findMoldLifeCounterByInstanceId(input.tenantId, input.productionMoldInstanceId),
        'MoldLifeCounter',
        input.productionMoldInstanceId
      )
      assertPrecondition(counter.lifeUnit === input.lifeUnit.toUpperCase(), 'life unit does not match counter')

      const timestamp = nowIso()
      const nextCounter = applyLifeAdjustment(counter, input.adjustmentType, adjustmentValue)
      nextCounter.lastAdjustedAt = timestamp
      nextCounter.lastAdjustedByRef = this.buildOperatorRef(input)
      nextCounter.adjustmentReason = input.reason
      nextCounter.updatedAt = timestamp
      const savedCounter = await this.repository.saveMoldLifeCounter(nextCounter)
      await this.repository.saveProductionMoldInstance({
        ...instance,
        lifeUsedValue: savedCounter.usedValue,
        lifeLimitValue: savedCounter.limitValue,
        warningLevel: inferWarningLevel(savedCounter),
        updatedAt: timestamp
      })
      const raisedWarning = await this.raiseWarningIfNeeded(input, savedCounter, input.commandId, timestamp)
      await this.appendAudit(input, 'AdjustMoldLife', 'PRODUCTION_MOLD_INSTANCE', input.productionMoldInstanceId, counter, savedCounter)
      if (raisedWarning) {
        await this.appendOutbox(input, 'MoldLifeWarningRaised', 'PRODUCTION_MOLD_INSTANCE', input.productionMoldInstanceId, {
          productionMoldInstanceId: input.productionMoldInstanceId,
          warningType: raisedWarning.warningType,
          warningLevel: raisedWarning.warningLevel,
          lifeUsedValue: raisedWarning.lifeUsedValue,
          lifeLimitValue: raisedWarning.lifeLimitValue,
          raisedAt: raisedWarning.raisedAt
        })
      }
      return {
        moldLifeCounter: savedCounter,
        raisedWarning
      }
    })
  }

  /** acknowledgeMoldWarning records human acknowledgement and optional non-installed remediation state changes. */
  async acknowledgeMoldWarning(input: AcknowledgeMoldWarningInput): Promise<{
    moldWarningEvent: MoldWarningEventRecord
    productionMoldInstance: ProductionMoldInstanceView
  }> {
    return this.executeIdempotent(input, 'AcknowledgeMoldWarning', async () => {
      this.assertCommandContext(input)
      assertRequiredString(input.moldWarningEventId, 'moldWarningEventId')
      assertRequiredString(input.reason, 'reason')
      const warning = assertExists(
        await this.repository.findMoldWarningEventById(input.tenantId, input.moldWarningEventId),
        'MoldWarningEvent',
        input.moldWarningEventId
      )
      assertPrecondition(warning.status === MoldWarningStatus.OPEN, 'warning is not open')
      const instance = assertExists(
        await this.repository.findProductionMoldInstanceById(input.tenantId, warning.productionMoldInstanceId),
        'ProductionMoldInstance',
        warning.productionMoldInstanceId
      )
      const nextStatus = (() => {
        if (input.acknowledgementAction === MoldWarningAcknowledgementAction.ACKNOWLEDGE_AND_MARK_REPAIR) {
          return ProductionMoldInstanceStatus.PENDING_REPAIR
        }
        if (input.acknowledgementAction === MoldWarningAcknowledgementAction.ACKNOWLEDGE_AND_DISABLE) {
          return ProductionMoldInstanceStatus.DISABLED
        }
        return instance.currentStatus
      })()
      assertPrecondition(
        nextStatus === instance.currentStatus || instance.currentStatus !== ProductionMoldInstanceStatus.INSTALLED,
        'installed mold must be unmounted before warning remediation'
      )
      const timestamp = nowIso()
      const savedWarning = await this.repository.saveMoldWarningEvent({
        ...warning,
        status: MoldWarningStatus.ACKNOWLEDGED,
        acknowledgedAt: timestamp,
        acknowledgedByRef: this.buildOperatorRef(input)
      })
      const updatedInstance = await this.repository.saveProductionMoldInstance({
        ...instance,
        currentStatus: nextStatus,
        updatedAt: timestamp
      })
      await this.appendAudit(input, 'AcknowledgeMoldWarning', 'MOLD_WARNING_EVENT', warning.moldWarningEventId, warning, savedWarning)
      return {
        moldWarningEvent: savedWarning,
        productionMoldInstance: await this.readModel.buildProductionMoldInstanceView(updatedInstance)
      }
    })
  }

  /** scrapMold marks master or production molds as terminal SCRAPPED and prevents future available use. */
  async scrapMold(input: ScrapMoldInput): Promise<{
    moldResource: {
      moldResourceType: MoldResourceType
      moldResourceId: string
      moldCode: string
      currentStatus: string
      scrappedAt?: string | null
    }
    closedInstallation?: MoldInstallationRecord | null
  }> {
    return this.executeIdempotent(input, 'ScrapMold', async () => {
      this.assertCommandContext(input)
      assertRequiredString(input.moldResourceId, 'moldResourceId')
      assertRequiredString(input.scrapReason, 'scrapReason')
      let scrapLocation: MesLocationRecord | null = null
      if (input.toMesLocationId) {
        scrapLocation = await this.assertActiveMesLocation(input.tenantId, input.toMesLocationId)
        assertPrecondition(isScrapLocation(scrapLocation), 'scrap location must be scrap holding type')
      }
      const timestamp = normalizeOptionalString(input.scrappedAt) ?? nowIso()

      if (input.moldResourceType === MoldResourceType.MASTER_MOLD) {
        const master = assertExists(
          await this.repository.findMasterMoldById(input.tenantId, input.moldResourceId),
          'MasterMold',
          input.moldResourceId
        )
        const updated = await this.repository.saveMasterMold({
          ...master,
          currentStatus: 'SCRAPPED',
          currentMesLocationId: input.toMesLocationId ?? master.currentMesLocationId ?? null,
          scrappedAt: timestamp,
          updatedAt: timestamp
        })
        await this.appendAudit(input, 'ScrapMold', 'MASTER_MOLD', master.masterMoldId, master, updated)
        await this.appendOutbox(input, 'MoldScrapped', 'MASTER_MOLD', master.masterMoldId, {
          moldResourceType: MoldResourceType.MASTER_MOLD,
          moldResourceId: master.masterMoldId,
          previousStatus: master.currentStatus,
          scrapReason: input.scrapReason,
          scrappedAt: timestamp,
          operatorRef: this.buildOperatorRef(input)
        })
        return {
          moldResource: {
            moldResourceType: MoldResourceType.MASTER_MOLD,
            moldResourceId: updated.masterMoldId,
            moldCode: updated.masterMoldCode,
            currentStatus: updated.currentStatus,
            scrappedAt: updated.scrappedAt
          },
          closedInstallation: null
        }
      }

      const instance = assertExists(
        await this.repository.findProductionMoldInstanceById(input.tenantId, input.moldResourceId),
        'ProductionMoldInstance',
        input.moldResourceId
      )
      const activeInstallation = await this.repository.findActiveInstallationByMold(input.tenantId, instance.productionMoldInstanceId)
      assertPrecondition(!activeInstallation || input.closeCurrentInstallation === true, 'installed mold must be unmounted or closed during scrap')
      let closedInstallation: MoldInstallationRecord | null = null
      if (activeInstallation) {
        closedInstallation = await this.repository.saveMoldInstallation({
          ...activeInstallation,
          unmountedAt: timestamp,
          unmountedByRef: this.buildOperatorRef(input),
          installationStatus: MoldInstallationStatus.CLOSED_BY_SCRAP
        })
        await this.appendOutbox(input, 'MoldUnmounted', 'PRODUCTION_MOLD_INSTANCE', instance.productionMoldInstanceId, {
          productionMoldInstanceId: instance.productionMoldInstanceId,
          moldInstallationId: activeInstallation.moldInstallationId,
          workCenterId: activeInstallation.workCenterId,
          resourcePositionId: activeInstallation.resourcePositionId,
          unmountedAt: timestamp,
          nextStatus: ProductionMoldInstanceStatus.SCRAPPED,
          operatorRef: this.buildOperatorRef(input)
        })
      }
      const updated = await this.repository.saveProductionMoldInstance({
        ...instance,
        currentStatus: ProductionMoldInstanceStatus.SCRAPPED,
        currentWorkCenterId: null,
        currentResourcePositionId: null,
        currentInstallationId: null,
        currentMesLocationId: input.toMesLocationId ?? instance.currentMesLocationId ?? null,
        scrappedAt: timestamp,
        updatedAt: timestamp
      })
      await this.appendAudit(input, 'ScrapMold', 'PRODUCTION_MOLD_INSTANCE', instance.productionMoldInstanceId, instance, updated)
      await this.appendOutbox(input, 'MoldScrapped', 'PRODUCTION_MOLD_INSTANCE', instance.productionMoldInstanceId, {
        moldResourceType: MoldResourceType.PRODUCTION_MOLD_INSTANCE,
        moldResourceId: instance.productionMoldInstanceId,
        previousStatus: instance.currentStatus,
        scrapReason: input.scrapReason,
        scrappedAt: timestamp,
        operatorRef: this.buildOperatorRef(input)
      })
      return {
        moldResource: {
          moldResourceType: MoldResourceType.PRODUCTION_MOLD_INSTANCE,
          moldResourceId: updated.productionMoldInstanceId,
          moldCode: updated.moldInstanceCode,
          currentStatus: updated.currentStatus,
          scrappedAt: updated.scrappedAt
        },
        closedInstallation
      }
    })
  }

  /** executeIdempotent keeps command replay semantics, command state changes, audit, and outbox in one local transaction. */
  private async executeIdempotent<T>(
    context: MesCommandContext,
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

  /** assertCommandContext keeps direct service calls aligned with the gRPC contract baseline. */
  private assertCommandContext(input: MesCommandContext): void {
    assertRequiredString(input.tenantId, 'tenantId')
    assertRequiredString(input.commandId, 'commandId')
    assertRequiredString(input.operatorContext?.operatorId, 'operatorContext.operatorId')
    assertRequiredString(input.traceContext?.traceId, 'traceContext.traceId')
    assertRequiredString(input.auditContext?.auditId, 'auditContext.auditId')
  }

  /** assertActiveMesLocation loads an active MES physical location and rejects missing or inactive references. */
  private async assertActiveMesLocation(tenantId: string, mesLocationId: string): Promise<MesLocationRecord> {
    const location = assertExists(
      await this.repository.findMesLocationById(tenantId, mesLocationId),
      'MesLocation',
      mesLocationId
    )
    assertPrecondition(location.status === 'ACTIVE', 'MES location is not active')
    return location
  }

  /** raiseWarningIfNeeded creates a warning fact only when the threshold or limit crosses without an open duplicate. */
  private async raiseWarningIfNeeded(
    context: MesCommandContext,
    counter: MoldLifeCounterRecord,
    triggeredByEventId: string,
    timestamp: string
  ): Promise<MoldWarningEventRecord | null> {
    const used = Number(counter.usedValue)
    const limit = Number(counter.limitValue)
    const threshold = Number(counter.warningThresholdValue)
    const warningType =
      limit > 0 && used >= limit
        ? MoldWarningType.LIFE_EXCEEDED
        : threshold > 0 && used >= threshold
          ? MoldWarningType.LIFE_THRESHOLD
          : null
    if (!warningType) {
      return null
    }
    const existing = await this.repository.findOpenWarningByMoldAndType(
      context.tenantId,
      counter.productionMoldInstanceId,
      warningType
    )
    if (existing) {
      return null
    }
    return this.repository.saveMoldWarningEvent({
      moldWarningEventId: randomUUID(),
      tenantId: context.tenantId,
      orgId: context.orgId ?? null,
      productionMoldInstanceId: counter.productionMoldInstanceId,
      warningType,
      warningLevel: warningType === MoldWarningType.LIFE_EXCEEDED ? MoldWarningLevel.CRITICAL : MoldWarningLevel.WARNING,
      triggeredByEventId,
      lifeUsedValue: counter.usedValue,
      lifeLimitValue: counter.limitValue,
      raisedAt: timestamp,
      acknowledgedAt: null,
      acknowledgedByRef: null,
      status: MoldWarningStatus.OPEN,
      auditRef: this.buildAuditRef(context)
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
    const record: MesAuditEnvelopeRecord = {
      mesAuditEnvelopeId: context.auditContext.auditId,
      tenantId: context.tenantId,
      orgId: context.orgId ?? context.operatorContext.orgId ?? null,
      service: 'mes-service',
      module: 'mold-management',
      eventType,
      occurredAt: timestamp,
      result: 'SUCCEEDED',
      operatorId: context.operatorContext.operatorId,
      operatorType: context.operatorContext.operatorType,
      traceId: context.traceContext.traceId,
      commandId: context.commandId,
      reason: context.auditContext.reason || context.auditContext.reason || '',
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
    }
    return this.repository.appendAuditEnvelope(record)
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
      orgId: context.orgId ?? null,
      eventType,
      aggregateType,
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

  /** buildAuditRef creates a small fact-level pointer to the command audit envelope. */
  private buildAuditRef(context: MesCommandContext): AuditRefRecord {
    return {
      auditId: context.auditContext.auditId,
      commandId: context.commandId,
      reason: context.auditContext.reason
    }
  }

  /** buildOperatorRef creates the append-only operator snapshot for mold facts. */
  private buildOperatorRef(context: MesCommandContext): OperatorRefRecord {
    return {
      operatorId: context.operatorContext.operatorId,
      displayNameSnapshot: context.operatorContext.operatorId
    }
  }
}

function normalizeMasterDataRef(
  ref: ManufacturingMasterDataRefRecord,
  field: string,
  expectedType?: ManufacturingMasterDataRefRecord['refType']
): ManufacturingMasterDataRefRecord {
  assertRequiredString(ref?.refId, `${field}.refId`)
  const refType = ref.refType
  assertPrecondition(!expectedType || refType === expectedType, `${field} has invalid ref type`, { refType, expectedType })
  return {
    refType,
    refId: ref.refId.trim(),
    refCodeSnapshot: normalizeOptionalString(ref.refCodeSnapshot) ?? null,
    displayNameSnapshot: normalizeOptionalString(ref.displayNameSnapshot) ?? null
  }
}

function normalizeItemRef(ref: ItemRefRecord): ItemRefRecord {
  assertRequiredString(ref.itemId, 'itemRef.itemId')
  return {
    itemId: ref.itemId.trim(),
    itemCodeSnapshot: normalizeOptionalString(ref.itemCodeSnapshot) ?? null,
    itemNameSnapshot: normalizeOptionalString(ref.itemNameSnapshot) ?? null
  }
}

function normalizeSupplierRef(ref: SupplierRefRecord): SupplierRefRecord {
  assertRequiredString(ref.supplierId, 'supplierRef.supplierId')
  return {
    supplierId: ref.supplierId.trim(),
    supplierCodeSnapshot: normalizeOptionalString(ref.supplierCodeSnapshot) ?? null,
    supplierDisplayNameSnapshot: normalizeOptionalString(ref.supplierDisplayNameSnapshot) ?? null
  }
}

function normalizePurchaseRef(ref: PurchaseRefRecord): PurchaseRefRecord {
  assertRequiredString(ref.purchaseSourceType, 'purchaseRef.purchaseSourceType')
  return {
    purchaseSourceType: ref.purchaseSourceType,
    purchaseSourceId: normalizeOptionalString(ref.purchaseSourceId) ?? null,
    purchaseNoSnapshot: normalizeOptionalString(ref.purchaseNoSnapshot) ?? null
  }
}

function normalizeExternalRef(ref: ExternalRefRecord, field: string): ExternalRefRecord {
  assertRequiredString(ref.refType, `${field}.refType`)
  assertRequiredString(ref.refId, `${field}.refId`)
  return {
    refType: ref.refType.trim(),
    refId: ref.refId.trim(),
    refCodeSnapshot: normalizeOptionalString(ref.refCodeSnapshot) ?? null,
    displayNameSnapshot: normalizeOptionalString(ref.displayNameSnapshot) ?? null
  }
}

function inferWarningLevel(counter: MoldLifeCounterRecord): MoldWarningLevel {
  if (Number(counter.limitValue) > 0 && Number(counter.usedValue) >= Number(counter.limitValue)) {
    return MoldWarningLevel.CRITICAL
  }
  if (Number(counter.warningThresholdValue) > 0 && Number(counter.usedValue) >= Number(counter.warningThresholdValue)) {
    return MoldWarningLevel.WARNING
  }
  return MoldWarningLevel.INFO
}

function applyLifeAdjustment(
  counter: MoldLifeCounterRecord,
  adjustmentType: MoldLifeAdjustmentType,
  adjustmentValue: string
): MoldLifeCounterRecord {
  switch (adjustmentType) {
    case MoldLifeAdjustmentType.SET_USED_VALUE:
      return {
        ...counter,
        usedValue: adjustmentValue
      }
    case MoldLifeAdjustmentType.ADD_USED_VALUE:
      return {
        ...counter,
        usedValue: (Number(counter.usedValue) + Number(adjustmentValue)).toString()
      }
    case MoldLifeAdjustmentType.SET_LIMIT_VALUE:
      return {
        ...counter,
        limitValue: adjustmentValue
      }
    case MoldLifeAdjustmentType.SET_WARNING_THRESHOLD:
      return {
        ...counter,
        warningThresholdValue: adjustmentValue
      }
    default:
      assertPrecondition(false, 'invalid life adjustment type')
      return counter
  }
}

function isScrapLocation(location: MesLocationRecord): boolean {
  return location.locationType.toUpperCase().includes('SCRAP')
}

function isAvailableLocation(location: MesLocationRecord): boolean {
  return ['AVAILABLE', 'READY', 'STAGING'].some((token) => location.locationType.toUpperCase().includes(token))
}

function toSnapshot(value: unknown): Record<string, unknown> | null {
  if (value === null || value === undefined) {
    return null
  }
  return JSON.parse(JSON.stringify(value)) as Record<string, unknown>
}

function cloneIdempotentResult<T>(value: unknown): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function hashCommandPayload(commandName: string, payload: unknown): string {
  return createHash('sha256')
    .update(stableStringify({ commandName, payload }))
    .digest('hex')
}

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
