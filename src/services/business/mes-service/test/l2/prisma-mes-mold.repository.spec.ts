import { status } from '@grpc/grpc-js'
import { MesMoldManagementService } from '../../src/application/services/mes-mold-management.service'
import { MesMoldQueryService } from '../../src/application/services/mes-mold-query.service'
import {
  MoldDesignOutputKind,
  MoldFunctionRole,
  MoldOutputStructureType,
  MoldLifeAdjustmentType,
  ProductionMoldStatus,
  ToolingType
} from '../../src/domain/models/mes-mold-records'
import { ProductionSpecStatus } from '../../src/domain/models/production-spec-records'
import { PrismaService } from '../../src/infrastructure/prisma/prisma.service'
import { PrismaProductionSpecRepository } from '../../src/infrastructure/repositories/prisma/prisma-production-spec.repository'
import { PrismaMesMoldRepository } from '../../src/infrastructure/repositories/prisma/prisma-mes-mold.repository'
import { cleanupByPrefix, createPrismaForIntegration, createTestPrefix } from '../helpers/integration-db'

/** commandContext builds the shared MES command context required by mold L2 calls. */
function commandContext(prefix: string, commandId: string) {
  return {
    tenantId: `${prefix}_tenant`,
    orgId: `${prefix}_org`,
    operatorContext: {
      operatorId: `${prefix}_operator`,
      operatorType: 'HUMAN',
      orgId: `${prefix}_org`
    },
    traceContext: {
      traceId: `${prefix}_trace`,
      requestId: `${prefix}_request_${commandId}`
    },
    auditContext: {
      auditId: `${prefix}_audit_${commandId}`,
      reason: 'L2 integration test',
      source: 'jest'
    },
    commandId
  }
}

/** queryContext builds the shared MES query context required by mold L2 calls. */
function queryContext(prefix: string) {
  return {
    tenantId: `${prefix}_tenant`,
    orgId: `${prefix}_org`,
    operatorContext: {
      operatorId: `${prefix}_operator`,
      operatorType: 'HUMAN',
      orgId: `${prefix}_org`
    },
    traceContext: {
      traceId: `${prefix}_trace`,
      requestId: `${prefix}_query`
    }
  }
}

describe('Prisma MES mold repository L2', () => {
  let prisma: PrismaService
  let repository: PrismaMesMoldRepository
  let productionSpecRepository: PrismaProductionSpecRepository
  let management: MesMoldManagementService
  let query: MesMoldQueryService
  let prefix: string

  beforeAll(async () => {
    prisma = await createPrismaForIntegration()
    repository = new PrismaMesMoldRepository(prisma)
    productionSpecRepository = new PrismaProductionSpecRepository(prisma)
    management = new MesMoldManagementService(repository, productionSpecRepository)
    query = new MesMoldQueryService(repository)
  })

  beforeEach(async () => {
    prefix = createTestPrefix()
    await cleanupByPrefix(prisma, prefix)
  })

  afterEach(async () => {
    await cleanupByPrefix(prisma, prefix)
  })

  afterAll(async () => {
    if (prisma) {
      await prisma.$disconnect()
    }
  })

  it('service transaction / should persist production mold, tooling installation, usage, life counter, audit, and outbox facts', async () => {
    const design = await management.registerMoldDesign({
      ...commandContext(prefix, `${prefix}_cmd_design`),
      moldDesignId: `${prefix}_design`,
      designCode: `${prefix}_design_code`,
      name: 'L2 Mold Design',
      materialType: 'GYPSUM',
      functionRole: MoldFunctionRole.PRODUCTION,
      outputStructureType: MoldOutputStructureType.SINGLE,
      outputs: [
        {
          sequenceNo: 1,
          outputCode: `${prefix}_OUT`,
          outputKind: MoldDesignOutputKind.PRODUCT,
          quantityPerUse: '1',
          isPrimaryOutput: true
        }
      ],
      defaultLifeLimit: '10',
      defaultLifeUnit: 'USE'
    })

    const productionMold = await management.registerProductionMold({
      ...commandContext(prefix, `${prefix}_cmd_mold`),
      productionMoldId: `${prefix}_mold`,
      moldCode: `${prefix}_PM_001`,
      moldDesignId: design.moldDesignId,
      initialStorageResourceRef: {
        storageResourceId: `${prefix}_storage_ready`,
        resourceCodeSnapshot: `${prefix}_READY`,
        displayNameSnapshot: 'Ready Rack'
      }
    })

    const installed = await management.installTooling({
      ...commandContext(prefix, `${prefix}_cmd_install`),
      toolingType: ToolingType.MOLD,
      toolingId: productionMold.productionMoldId,
      workCenterRef: {
        workCenterId: `${prefix}_wc`,
        workCenterCodeSnapshot: `${prefix}_WC`,
        displayNameSnapshot: 'Casting Line'
      },
      workUnitRef: {
        workUnitId: `${prefix}_wu_a`,
        workUnitCodeSnapshot: 'A',
        displayNameSnapshot: 'Position A'
      },
      moldPosition: 'A'
    })
    const usage = await management.recordMoldUsage({
      ...commandContext(prefix, `${prefix}_cmd_usage`),
      productionMoldId: productionMold.productionMoldId,
      toolingInstallationId: installed.toolingInstallation.toolingInstallationId,
      workCenterRef: {
        workCenterId: `${prefix}_wc`
      },
      workUnitRef: {
        workUnitId: `${prefix}_wu_a`
      },
      usageQuantity: '6',
      lifeDelta: '6',
      lifeUnit: 'USE',
      captureSource: 'CHECKLIST'
    })

    const persisted = await query.getProductionMold({
      ...queryContext(prefix),
      productionMoldId: productionMold.productionMoldId
    })

    expect(persisted.currentStatus).toBe(ProductionMoldStatus.INSTALLED)
    expect(usage.moldLifeCounter.usedValue).toBe('6')
    expect(await prisma.moldUsageRecord.count({ where: { tenantId: `${prefix}_tenant` } })).toBe(1)
    expect(await prisma.toolingInstallation.count({ where: { tenantId: `${prefix}_tenant` } })).toBe(1)
    expect(await prisma.moldLifeCounter.count({ where: { tenantId: `${prefix}_tenant` } })).toBe(1)
    expect(await prisma.mesAuditEnvelope.count({ where: { tenantId: `${prefix}_tenant` } })).toBeGreaterThanOrEqual(4)
    expect(
      await prisma.mesOutboxEvent.count({
        where: {
          tenantId: `${prefix}_tenant`,
          eventType: {
            in: ['MoldUsageRecorded', 'ToolingInstalled']
          }
        }
      })
    ).toBe(2)
  })

  it('command idempotency / should replay completed production mold registration and reject command id conflicts', async () => {
    const design = await management.registerMoldDesign({
      ...commandContext(prefix, `${prefix}_cmd_design_idem`),
      moldDesignId: `${prefix}_design`,
      designCode: `${prefix}_design_code`,
      name: 'L2 Mold Design',
      materialType: 'GYPSUM',
      functionRole: MoldFunctionRole.PRODUCTION,
      outputStructureType: MoldOutputStructureType.SINGLE,
      outputs: [
        {
          sequenceNo: 1,
          outputCode: `${prefix}_OUT`,
          outputKind: MoldDesignOutputKind.PRODUCT,
          quantityPerUse: '1',
          isPrimaryOutput: true
        }
      ],
      defaultLifeLimit: '10',
      defaultLifeUnit: 'USE'
    })

    const input = {
      ...commandContext(prefix, `${prefix}_cmd_mold_idem`),
      productionMoldId: `${prefix}_mold`,
      moldCode: `${prefix}_PM_001`,
      moldDesignId: design.moldDesignId,
      initialStorageResourceRef: {
        storageResourceId: `${prefix}_storage_ready`
      }
    }
    const registered = await management.registerProductionMold(input)
    const replayed = await management.registerProductionMold(input)

    expect(replayed).toEqual(registered)
    expect(await prisma.productionMold.count({ where: { tenantId: `${prefix}_tenant` } })).toBe(1)
    expect(await prisma.moldLifeCounter.count({ where: { tenantId: `${prefix}_tenant` } })).toBe(1)
    expect(
      await prisma.mesCommandIdempotency.count({
        where: { tenantId: `${prefix}_tenant`, commandId: `${prefix}_cmd_mold_idem` }
      })
    ).toBe(1)

    await expect(
      management.registerProductionMold({
        ...input,
        productionMoldId: `${prefix}_mold_other`,
        moldCode: `${prefix}_PM_002`
      })
    ).rejects.toMatchObject({
      definition: {
        rpcStatus: status.ALREADY_EXISTS
      }
    })
    expect(await prisma.productionMold.count({ where: { tenantId: `${prefix}_tenant` } })).toBe(1)
  })

  it('life counter / should adjust counters through direct id lookup instead of paginated scans', async () => {
    await prisma.productionSpec.create({
      data: {
        id: `${prefix}_spec`,
        tenantId: `${prefix}_tenant`,
        orgId: `${prefix}_org`,
        orgScope: `${prefix}_org`,
        specCode: `${prefix}_SPEC`,
        name: 'Spec',
        revisionCode: null,
        supersedesProductionSpecId: null,
        itemRef: {
          itemId: `${prefix}_item`
        },
        status: ProductionSpecStatus.ACTIVE,
        effectiveFrom: null,
        effectiveTo: null,
        retiredAt: null,
        replacementProductionSpecId: null,
        createdAt: new Date('2026-05-05T00:00:00.000Z'),
        updatedAt: new Date('2026-05-05T00:00:00.000Z'),
        version: 1
      }
    })
    const design = await management.registerMoldDesign({
      ...commandContext(prefix, `${prefix}_cmd_design_counter`),
      designCode: `${prefix}_design_counter`,
      name: 'L2 Counter Mold Design',
      productionSpecRefs: [{ productionSpecId: `${prefix}_spec` }],
      materialType: 'GYPSUM',
      functionRole: MoldFunctionRole.PRODUCTION,
      outputStructureType: MoldOutputStructureType.SINGLE,
      outputs: [
        {
          sequenceNo: 1,
          outputCode: `${prefix}_OUT`,
          outputKind: MoldDesignOutputKind.PRODUCTION_SPEC,
          productionSpecRef: { productionSpecId: `${prefix}_spec` },
          quantityPerUse: '1',
          isPrimaryOutput: true
        }
      ],
      defaultLifeLimit: '10',
      defaultLifeUnit: 'USE'
    })
    const productionMold = await management.registerProductionMold({
      ...commandContext(prefix, `${prefix}_cmd_mold_counter`),
      moldCode: `${prefix}_PM_COUNTER`,
      moldDesignId: design.moldDesignId,
      initialStorageResourceRef: {
        storageResourceId: `${prefix}_storage_counter`
      }
    })
    const counter = await repository.findMoldLifeCounterByProductionMold(`${prefix}_tenant`, productionMold.productionMoldId)

    const adjusted = await management.adjustMoldLifeCounter({
      ...commandContext(prefix, `${prefix}_cmd_adjust_counter`),
      moldLifeCounterId: counter!.moldLifeCounterId,
      adjustmentType: MoldLifeAdjustmentType.ADD_USED_VALUE,
      value: '2'
    })

    expect(adjusted.moldLifeCounter.usedValue).toBe('2')
    expect(adjusted.moldLifeCounter.moldLifeCounterId).toBe(counter!.moldLifeCounterId)
  })
})
