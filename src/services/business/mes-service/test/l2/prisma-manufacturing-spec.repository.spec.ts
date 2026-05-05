import { ManufacturingSpecManagementService } from '../../src/application/services/manufacturing-spec-management.service'
import { ManufacturableItemLookupPort } from '../../src/application/ports/manufacturable-item-lookup.port'
import { ManufacturingSpecQueryService } from '../../src/application/services/manufacturing-spec-query.service'
import { ManufacturingSpecStatus } from '../../src/domain/models/manufacturing-spec-records'
import { PrismaService } from '../../src/infrastructure/prisma/prisma.service'
import { PrismaManufacturingSpecRepository } from '../../src/infrastructure/repositories/prisma/prisma-manufacturing-spec.repository'
import { cleanupByPrefix, createPrismaForIntegration, createTestPrefix } from '../helpers/integration-db'

/** StubManufacturableItemLookupPort lets Prisma L2 tests validate MES rules without calling item-master-service. */
class StubManufacturableItemLookupPort implements ManufacturableItemLookupPort {
  async getManufacturableItem(tenantId: string, itemId: string) {
    return {
      itemId,
      itemCode: `${tenantId}_${itemId}_CODE`,
      itemName: `${itemId} Name`,
      manufacturable: true,
      physical: true
    }
  }
}

/** commandContext builds the shared MES command context required by ManufacturingSpec L2 calls. */
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
      reason: 'L2 manufacturing spec test',
      source: 'jest'
    },
    commandId
  }
}

/** queryContext builds the shared MES query context required by ManufacturingSpec L2 calls. */
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

describe('Prisma ManufacturingSpec repository L2', () => {
  let prisma: PrismaService
  let repository: PrismaManufacturingSpecRepository
  let management: ManufacturingSpecManagementService
  let query: ManufacturingSpecQueryService
  let prefix: string

  beforeAll(async () => {
    prisma = await createPrismaForIntegration()
    repository = new PrismaManufacturingSpecRepository(prisma)
    management = new ManufacturingSpecManagementService(repository, new StubManufacturableItemLookupPort())
    query = new ManufacturingSpecQueryService(repository)
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
    const created = await management.createManufacturingSpec({
      ...commandContext(prefix, `${prefix}_cmd_spec_create`),
      specCode: `${prefix}_wb_a100_hp`,
      name: 'L2 Wash Basin A100 High Pressure',
      revisionCode: 'R1',
      productFamilyRef: {
        refType: 'PRODUCT_FAMILY',
        refId: `${prefix}_pf`
      },
      itemRef: {
        itemId: `${prefix}_item`
      },
      manufacturingAttributes: [
        {
          attributeKey: 'formingMethod',
          attributeValue: 'HIGH_PRESSURE'
        }
      ],
      reason: 'L2 create spec'
    })
    const activated = await management.activateManufacturingSpec({
      ...commandContext(prefix, `${prefix}_cmd_spec_activate`),
      manufacturingSpecId: created.manufacturingSpecId,
      expectedVersion: 1,
      reason: 'L2 activate spec'
    })

    const page = await query.listManufacturingSpecs({
      ...queryContext(prefix),
      keyword: `${prefix}_wb`,
      status: ManufacturingSpecStatus.ACTIVE,
      page: 1,
      pageSize: 20
    })

    expect(activated.status).toBe(ManufacturingSpecStatus.ACTIVE)
    expect(page.total).toBe(1)
    expect(page.items[0]?.manufacturingSpecId).toBe(created.manufacturingSpecId)
    expect(await prisma.manufacturingSpec.count({ where: { tenantId: `${prefix}_tenant` } })).toBe(1)
    expect(await prisma.mesAuditEnvelope.count({ where: { tenantId: `${prefix}_tenant` } })).toBe(2)
    expect(await prisma.mesOutboxEvent.count({ where: { tenantId: `${prefix}_tenant` } })).toBe(2)
  })

  it('resolve for mold / should return active specs and unavailable draft refs from persisted MoldDesign refs', async () => {
    const active = await management.createManufacturingSpec({
      ...commandContext(prefix, `${prefix}_cmd_spec_active_create`),
      specCode: `${prefix}_active`,
      name: 'Active spec',
      productFamilyRef: {
        refType: 'PRODUCT_FAMILY',
        refId: `${prefix}_pf`
      },
      itemRef: {
        itemId: `${prefix}_item`
      },
      manufacturingAttributes: [
        {
          attributeKey: 'formingMethod',
          attributeValue: 'HIGH_PRESSURE'
        }
      ],
      reason: 'L2 create active spec'
    })
    await management.activateManufacturingSpec({
      ...commandContext(prefix, `${prefix}_cmd_spec_active_activate`),
      manufacturingSpecId: active.manufacturingSpecId,
      expectedVersion: 1,
      reason: 'L2 activate active spec'
    })
    const draft = await management.createManufacturingSpec({
      ...commandContext(prefix, `${prefix}_cmd_spec_draft_create`),
      specCode: `${prefix}_draft`,
      name: 'Draft spec',
      productFamilyRef: {
        refType: 'PRODUCT_FAMILY',
        refId: `${prefix}_pf`
      },
      itemRef: {
        itemId: `${prefix}_item`
      },
      manufacturingAttributes: [
        {
          attributeKey: 'formingMethod',
          attributeValue: 'LOW_PRESSURE'
        }
      ],
      reason: 'L2 create draft spec'
    })

    await prisma.moldDesign.create({
      data: {
        id: `${prefix}_design`,
        tenantId: `${prefix}_tenant`,
        orgId: `${prefix}_org`,
        designCode: `${prefix}_DESIGN`,
        name: 'L2 Mold Design',
        revisionCode: 'R1',
        supersedesDesignId: null,
        productFamilyRef: {
          refType: 'PRODUCT_FAMILY',
          refId: `${prefix}_pf`
        },
        manufacturingSpecRefs: [
          {
            refType: 'MANUFACTURING_SPEC',
            refId: active.manufacturingSpecId
          },
          {
            refType: 'MANUFACTURING_SPEC',
            refId: draft.manufacturingSpecId
          }
        ],
        itemRef: null,
        materialType: 'GYPSUM',
        functionRole: 'PRODUCTION',
        productionMethodTags: [],
        outputStructureType: 'SINGLE',
        defaultLifeLimit: null,
        defaultLifeUnit: null,
        status: 'ACTIVE',
        createdAt: new Date('2026-05-05T00:00:00.000Z'),
        updatedAt: new Date('2026-05-05T00:00:00.000Z')
      }
    })

    const resolved = await query.resolveManufacturingSpecsForMold({
      ...queryContext(prefix),
      moldDesignId: `${prefix}_design`
    })

    expect(resolved.resolvedSpecs.map((spec) => spec.manufacturingSpecId)).toEqual([active.manufacturingSpecId])
    expect(resolved.unavailableRefs).toEqual([
      expect.objectContaining({
        refId: draft.manufacturingSpecId,
        reasonCode: 'NOT_ACTIVE'
      })
    ])
  })
})
