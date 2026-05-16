import { ProductionSpecManagementService } from '../../src/application/services/production-spec-management.service'
import { ManufacturableItemLookupPort } from '../../src/application/ports/manufacturable-item-lookup.port'
import { ProductionSpecQueryService } from '../../src/application/services/production-spec-query.service'
import { ProductionSpecStatus } from '../../src/domain/models/production-spec-records'
import {
  MoldDesignOutputKind,
  MoldFunctionRole,
  MoldOutputStructureType,
  MoldDesignStatus
} from '../../src/domain/models/mes-mold-records'
import { PrismaService } from '../../src/infrastructure/prisma/prisma.service'
import { PrismaProductionSpecRepository } from '../../src/infrastructure/repositories/prisma/prisma-production-spec.repository'
import { cleanupByPrefix, createPrismaForIntegration, createTestPrefix } from '../helpers/integration-db'

/** StubManufacturableItemLookupPort lets Prisma L2 tests validate MES rules without calling item-master-service. */
class StubManufacturableItemLookupPort implements ManufacturableItemLookupPort {
  async getManufacturableItem(tenantId: string, itemId: string) {
    return {
      itemId,
      itemCode: `${tenantId}_${itemId}_CODE`,
      itemName: `${itemId} Name`,
      active: true,
      manufacturable: true,
      physical: true
    }
  }
}

/** commandContext builds the shared MES command context required by ProductionSpec L2 calls. */
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
      reason: 'L2 production spec test',
      source: 'jest'
    },
    commandId
  }
}

/** queryContext builds the shared MES query context required by ProductionSpec L2 calls. */
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

/** itemModelRef builds the required MoldDesign primary ItemModel snapshot for direct Prisma fixtures. */
function itemModelRef(prefix: string) {
  return {
    itemModelId: `${prefix}_item_model`,
    modelCodeSnapshot: `${prefix}_MODEL`,
    modelNameSnapshot: 'L2 Item Model'
  }
}

describe('Prisma ProductionSpec repository L2', () => {
  let prisma: PrismaService
  let repository: PrismaProductionSpecRepository
  let management: ProductionSpecManagementService
  let query: ProductionSpecQueryService
  let prefix: string

  beforeAll(async () => {
    prisma = await createPrismaForIntegration()
    repository = new PrismaProductionSpecRepository(prisma)
    management = new ProductionSpecManagementService(repository, new StubManufacturableItemLookupPort())
    query = new ProductionSpecQueryService(repository)
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

  it('service transaction / should persist lifecycle updates, audit, outbox, and query filters', async () => {
    const created = await management.createProductionSpec({
      ...commandContext(prefix, `${prefix}_cmd_spec_create`),
      specCode: `${prefix}_wb_a100_hp`,
      name: 'L2 Wash Basin A100 High Pressure',
      revisionCode: 'R1',
      itemRef: {
        itemId: `${prefix}_item`
      }
    })
    const activated = await management.activateProductionSpec({
      ...commandContext(prefix, `${prefix}_cmd_spec_activate`),
      productionSpecId: created.productionSpecId,
      expectedVersion: 1
    })

    const page = await query.listProductionSpecs({
      ...queryContext(prefix),
      keyword: `${prefix}_wb`,
      status: ProductionSpecStatus.ACTIVE,
      page: 1,
      pageSize: 20
    })

    expect(activated.status).toBe(ProductionSpecStatus.ACTIVE)
    expect(page.total).toBe(1)
    expect(page.productionSpecs[0]?.productionSpecId).toBe(created.productionSpecId)
    expect(await prisma.productionSpec.count({ where: { tenantId: `${prefix}_tenant` } })).toBe(1)
    expect(await prisma.mesAuditEnvelope.count({ where: { tenantId: `${prefix}_tenant` } })).toBe(2)
    expect(await prisma.mesOutboxEvent.count({ where: { tenantId: `${prefix}_tenant` } })).toBe(2)
  })

  it('resolve for mold / should return active specs and unavailable draft refs from persisted MoldDesign refs', async () => {
    const active = await management.createProductionSpec({
      ...commandContext(prefix, `${prefix}_cmd_spec_active_create`),
      specCode: `${prefix}_active`,
      name: 'Active spec',
      itemRef: {
        itemId: `${prefix}_item`
      }
    })
    await management.activateProductionSpec({
      ...commandContext(prefix, `${prefix}_cmd_spec_active_activate`),
      productionSpecId: active.productionSpecId,
      expectedVersion: 1
    })
    const draft = await management.createProductionSpec({
      ...commandContext(prefix, `${prefix}_cmd_spec_draft_create`),
      specCode: `${prefix}_draft`,
      name: 'Draft spec',
      itemRef: {
        itemId: `${prefix}_item`
      }
    })

    await prisma.moldDesign.create({
      data: {
        id: `${prefix}_design`,
        tenantId: `${prefix}_tenant`,
        orgId: `${prefix}_org`,
        orgScope: `${prefix}_org`,
        designCode: `${prefix}_DESIGN`,
        name: 'L2 Mold Design',
        revisionCode: 'R1',
        supersedesMoldDesignId: null,
        primaryItemModelRef: itemModelRef(prefix),
        productionSpecRefs: [
          {
            productionSpecId: active.productionSpecId
          },
          {
            productionSpecId: draft.productionSpecId
          }
        ],
        materialType: 'GYPSUM',
        functionRole: MoldFunctionRole.PRODUCTION,
        productionMethodTags: [],
        outputStructureType: MoldOutputStructureType.SINGLE,
        defaultLifeLimit: null,
        defaultLifeUnit: null,
        status: MoldDesignStatus.ACTIVE,
        createdAt: new Date('2026-05-05T00:00:00.000Z'),
        updatedAt: new Date('2026-05-05T00:00:00.000Z'),
        outputs: {
          create: [
            {
              id: `${prefix}_output`,
              tenantId: `${prefix}_tenant`,
              orgId: `${prefix}_org`,
              sequenceNo: 1,
              outputCode: `${prefix}_OUT`,
              outputKind: MoldDesignOutputKind.PRODUCTION_SPEC,
              productionSpecRef: {
                productionSpecId: active.productionSpecId
              },
              quantityPerUse: '1',
              componentRole: null,
              assemblyHint: null,
              isPrimaryOutput: true,
              options: []
            }
          ]
        }
      }
    })

    const resolved = await query.resolveProductionSpecsForMold({
      ...queryContext(prefix),
      moldDesignId: `${prefix}_design`
    })

    expect(resolved.resolvedSpecs.map((spec) => spec.productionSpecId)).toEqual([active.productionSpecId])
    expect(resolved.unavailableRefs).toEqual([
      expect.objectContaining({
        refId: draft.productionSpecId,
        reasonCode: 'NOT_ACTIVE'
      })
    ])
  })
})
