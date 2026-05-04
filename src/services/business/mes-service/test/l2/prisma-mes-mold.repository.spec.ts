import { status } from '@grpc/grpc-js'
import { MesMoldManagementService } from '../../src/application/services/mes-mold-management.service'
import { MesMoldQueryService } from '../../src/application/services/mes-mold-query.service'
import {
  MesLocationStatus,
  MoldDesignOutputKind,
  MoldFunctionRole,
  MoldOutputStructureType,
  MoldUsageMode,
  ProductionMoldInstanceStatus
} from '../../src/domain/models/mes-mold-records'
import { PrismaService } from '../../src/infrastructure/prisma/prisma.service'
import { PrismaMesMoldRepository } from '../../src/infrastructure/repositories/prisma/prisma-mes-mold.repository'
import { cleanupByPrefix, createPrismaForIntegration, createTestPrefix } from '../helpers/integration-db'

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

describe('Prisma MES mold repository L2', () => {
  let prisma: PrismaService
  let repository: PrismaMesMoldRepository
  let management: MesMoldManagementService
  let query: MesMoldQueryService
  let prefix: string

  beforeAll(async () => {
    prisma = await createPrismaForIntegration()
    repository = new PrismaMesMoldRepository(prisma)
    management = new MesMoldManagementService(repository)
    query = new MesMoldQueryService(repository)
  })

  beforeEach(async () => {
    prefix = createTestPrefix()
    await cleanupByPrefix(prisma, prefix)
    await prisma.mesLocation.create({
      data: {
        id: `${prefix}_loc_ready`,
        tenantId: `${prefix}_tenant`,
        orgId: `${prefix}_org`,
        locationCode: `${prefix}_READY`,
        name: 'Ready Rack',
        locationType: 'AVAILABLE',
        parentLocationId: null,
        relatedWorkCenterId: null,
        capacityProfileId: null,
        status: MesLocationStatus.ACTIVE,
        createdAt: new Date('2026-05-04T09:00:00.000Z'),
        updatedAt: new Date('2026-05-04T09:00:00.000Z')
      }
    })
    await prisma.workCenter.create({
      data: {
        id: `${prefix}_wc`,
        tenantId: `${prefix}_tenant`,
        orgId: `${prefix}_org`,
        workCenterCode: `${prefix}_WC`,
        name: 'Casting Line',
        workCenterType: 'CASTING_LINE',
        parentWorkCenterId: null,
        relatedMesLocationId: `${prefix}_loc_ready`,
        capacityProfileId: null,
        status: 'ACTIVE',
        createdAt: new Date('2026-05-04T09:00:00.000Z'),
        updatedAt: new Date('2026-05-04T09:00:00.000Z')
      }
    })
    await prisma.resourcePosition.create({
      data: {
        id: `${prefix}_pos`,
        tenantId: `${prefix}_tenant`,
        orgId: `${prefix}_org`,
        workCenterId: `${prefix}_wc`,
        positionCode: 'A',
        name: 'Position A',
        positionType: 'MOLD_SLOT',
        compatibleMoldDesignRefs: [`${prefix}_design`],
        status: 'ACTIVE',
        createdAt: new Date('2026-05-04T09:00:00.000Z'),
        updatedAt: new Date('2026-05-04T09:00:00.000Z')
      }
    })
  })

  afterEach(async () => {
    await cleanupByPrefix(prisma, prefix)
  })

  afterAll(async () => {
    if (prisma) {
      await prisma.$disconnect()
    }
  })

  it('service transaction / should persist current projections plus append-only usage warning audit and outbox facts', async () => {
    const design = await management.registerMoldDesign({
      ...commandContext(prefix, `${prefix}_cmd_design`),
      moldDesignId: `${prefix}_design`,
      designCode: `${prefix}_design_code`,
      name: 'L2 Mold Design',
      productFamilyRef: {
        refType: 'PRODUCT_FAMILY',
        refId: `${prefix}_pf`
      },
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
      defaultLifeUnit: 'USE',
      reason: 'L2 design'
    })

    const registered = await management.registerProductionMoldInstance({
      ...commandContext(prefix, `${prefix}_cmd_instance`),
      productionMoldInstanceId: `${prefix}_mold`,
      moldInstanceCode: `${prefix}_PM_001`,
      moldDesignId: design.moldDesignId,
      initialStatus: ProductionMoldInstanceStatus.PENDING_INSTALLATION,
      initialMesLocationId: `${prefix}_loc_ready`,
      lifeLimitValue: '10',
      lifeUnit: 'USE',
      warningThresholdValue: '5',
      reason: 'L2 instance'
    })

    await management.installMold({
      ...commandContext(prefix, `${prefix}_cmd_install`),
      productionMoldInstanceId: registered.productionMoldInstance.productionMoldInstanceId,
      workCenterId: `${prefix}_wc`,
      resourcePositionId: `${prefix}_pos`,
      reason: 'L2 install'
    })
    const usage = await management.recordMoldUsage({
      ...commandContext(prefix, `${prefix}_cmd_usage`),
      productionMoldInstanceId: registered.productionMoldInstance.productionMoldInstanceId,
      workCenterId: `${prefix}_wc`,
      resourcePositionId: `${prefix}_pos`,
      usageMode: MoldUsageMode.MANUAL_CHECKLIST,
      usageQuantity: '6',
      lifeDelta: '6',
      lifeUnit: 'USE',
      captureSource: 'CHECKLIST',
      reason: 'L2 usage'
    })

    const instance = await query.getProductionMoldInstance({
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
      },
      productionMoldInstanceId: registered.productionMoldInstance.productionMoldInstanceId
    })

    expect(usage.raisedWarning?.warningLevel).toBe('WARNING')
    expect(instance.currentStatus).toBe(ProductionMoldInstanceStatus.INSTALLED)
    expect(instance.lifeSummary?.usedValue).toBe('6')
    expect(await prisma.moldUsageEvent.count({ where: { tenantId: `${prefix}_tenant` } })).toBe(1)
    expect(await prisma.moldWarningEvent.count({ where: { tenantId: `${prefix}_tenant` } })).toBe(1)
    expect(await prisma.mesAuditEnvelope.count({ where: { tenantId: `${prefix}_tenant` } })).toBeGreaterThanOrEqual(4)
    expect(
      await prisma.mesOutboxEvent.count({
        where: {
          tenantId: `${prefix}_tenant`,
          eventType: {
            in: ['MoldUsageRecorded', 'MoldLifeWarningRaised']
          }
        }
      })
    ).toBe(2)
  })

  it('command idempotency / should replay completed production registration and reject command id conflicts', async () => {
    const design = await management.registerMoldDesign({
      ...commandContext(prefix, `${prefix}_cmd_design_idem`),
      moldDesignId: `${prefix}_design`,
      designCode: `${prefix}_design_code`,
      name: 'L2 Mold Design',
      productFamilyRef: {
        refType: 'PRODUCT_FAMILY',
        refId: `${prefix}_pf`
      },
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
      defaultLifeUnit: 'USE',
      reason: 'L2 design'
    })

    const input = {
      ...commandContext(prefix, `${prefix}_cmd_instance_idem`),
      productionMoldInstanceId: `${prefix}_mold`,
      moldInstanceCode: `${prefix}_PM_001`,
      moldDesignId: design.moldDesignId,
      initialStatus: ProductionMoldInstanceStatus.PENDING_INSTALLATION,
      initialMesLocationId: `${prefix}_loc_ready`,
      lifeLimitValue: '10',
      lifeUnit: 'USE',
      warningThresholdValue: '5',
      reason: 'L2 instance'
    }
    const registered = await management.registerProductionMoldInstance(input)
    const replayed = await management.registerProductionMoldInstance(input)

    expect(replayed).toEqual(registered)
    expect(await prisma.productionMoldInstance.count({ where: { tenantId: `${prefix}_tenant` } })).toBe(1)
    expect(await prisma.moldLifeCounter.count({ where: { tenantId: `${prefix}_tenant` } })).toBe(1)
    expect(
      await prisma.mesAuditEnvelope.count({
        where: { tenantId: `${prefix}_tenant`, commandId: `${prefix}_cmd_instance_idem` }
      })
    ).toBe(1)
    expect(
      await prisma.mesOutboxEvent.count({
        where: { tenantId: `${prefix}_tenant`, commandId: `${prefix}_cmd_instance_idem` }
      })
    ).toBe(1)
    expect(
      await prisma.mesCommandIdempotency.count({
        where: { tenantId: `${prefix}_tenant`, commandId: `${prefix}_cmd_instance_idem` }
      })
    ).toBe(1)

    await expect(
      management.registerProductionMoldInstance({
        ...input,
        productionMoldInstanceId: `${prefix}_mold_other`,
        moldInstanceCode: `${prefix}_PM_002`
      })
    ).rejects.toMatchObject({
      definition: {
        rpcStatus: status.ALREADY_EXISTS
      }
    })
    expect(await prisma.productionMoldInstance.count({ where: { tenantId: `${prefix}_tenant` } })).toBe(1)
  })

  it('command idempotency / should allow concurrent same-payload production registration without duplicating facts or outbox', async () => {
    const design = await management.registerMoldDesign({
      ...commandContext(prefix, `${prefix}_cmd_design_concurrent`),
      moldDesignId: `${prefix}_design`,
      designCode: `${prefix}_design_code`,
      name: 'L2 Concurrent Mold Design',
      productFamilyRef: {
        refType: 'PRODUCT_FAMILY',
        refId: `${prefix}_pf`
      },
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
      defaultLifeUnit: 'USE',
      reason: 'L2 concurrent design'
    })

    const input = {
      ...commandContext(prefix, `${prefix}_cmd_instance_concurrent`),
      productionMoldInstanceId: `${prefix}_mold`,
      moldInstanceCode: `${prefix}_PM_001`,
      moldDesignId: design.moldDesignId,
      initialStatus: ProductionMoldInstanceStatus.PENDING_INSTALLATION,
      initialMesLocationId: `${prefix}_loc_ready`,
      lifeLimitValue: '10',
      lifeUnit: 'USE',
      warningThresholdValue: '5',
      reason: 'L2 concurrent instance'
    }

    const results = await Promise.allSettled([
      management.registerProductionMoldInstance(input),
      management.registerProductionMoldInstance(input)
    ])
    const fulfilled = results.filter(
      (result): result is PromiseFulfilledResult<Awaited<ReturnType<MesMoldManagementService['registerProductionMoldInstance']>>> =>
        result.status === 'fulfilled'
    )
    const rejected = results.filter((result): result is PromiseRejectedResult => result.status === 'rejected')

    expect(fulfilled.length).toBeGreaterThanOrEqual(1)
    if (fulfilled.length === 2) {
      expect(fulfilled[0]?.value).toEqual(fulfilled[1]?.value)
    }
    for (const result of rejected) {
      expect(result.reason).toMatchObject({
        definition: {
          rpcStatus: status.ABORTED
        }
      })
    }
    expect(await prisma.productionMoldInstance.count({ where: { tenantId: `${prefix}_tenant` } })).toBe(1)
    expect(await prisma.moldLifeCounter.count({ where: { tenantId: `${prefix}_tenant` } })).toBe(1)
    expect(
      await prisma.mesAuditEnvelope.count({
        where: { tenantId: `${prefix}_tenant`, commandId: `${prefix}_cmd_instance_concurrent` }
      })
    ).toBe(1)
    expect(
      await prisma.mesOutboxEvent.count({
        where: { tenantId: `${prefix}_tenant`, commandId: `${prefix}_cmd_instance_concurrent` }
      })
    ).toBe(1)
  })
})
