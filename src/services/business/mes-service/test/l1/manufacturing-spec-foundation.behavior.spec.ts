import { status } from '@grpc/grpc-js'
import {
  ManufacturingSpecManagementService
} from '../../src/application/services/manufacturing-spec-management.service'
import { ManufacturingSpecQueryService } from '../../src/application/services/manufacturing-spec-query.service'
import { ManufacturableItemLookupPort } from '../../src/application/ports/manufacturable-item-lookup.port'
import { MesMoldManagementService } from '../../src/application/services/mes-mold-management.service'
import { ManufacturingSpecStatus } from '../../src/domain/models/manufacturing-spec-records'
import {
  MoldDesignOutputKind,
  MoldFunctionRole,
  MoldOutputStructureType
} from '../../src/domain/models/mes-mold-records'
import { InMemoryManufacturingSpecRepository } from '../../src/infrastructure/repositories/in-memory/in-memory-manufacturing-spec.repository'
import { InMemoryMesMoldRepository } from '../../src/infrastructure/repositories/in-memory/in-memory-mes-mold.repository'
import { MesInMemoryStore } from '../../src/infrastructure/store/mes-in-memory-store'

const tenantId = 'tenant-1'
const orgId = 'org-1'

/** commandContext builds the shared MES command context required by ManufacturingSpec management calls. */
function commandContext(commandId: string, reason = 'manufacturing spec foundation test', targetOrgId = orgId) {
  return {
    tenantId,
    orgId: targetOrgId,
    operatorContext: {
      operatorId: 'operator-1',
      operatorType: 'HUMAN',
      orgId: targetOrgId
    },
    traceContext: {
      traceId: 'trace-1',
      requestId: `request-${commandId}`
    },
    auditContext: {
      auditId: `audit-${commandId}`,
      reason,
      source: 'jest'
    },
    commandId
  }
}

/** queryContext builds the shared MES query context required by ManufacturingSpec query calls. */
function queryContext(targetOrgId = orgId) {
  return {
    tenantId,
    orgId: targetOrgId,
    operatorContext: {
      operatorId: 'operator-1',
      operatorType: 'HUMAN',
      orgId: targetOrgId
    },
    traceContext: {
      traceId: 'trace-1',
      requestId: 'query-request-1'
    }
  }
}

/** StubManufacturableItemLookupPort lets L1 drive item-master eligibility outcomes without crossing service boundaries. */
class StubManufacturableItemLookupPort implements ManufacturableItemLookupPort {
  readonly items = new Map<string, { manufacturable: boolean; physical: boolean }>()

  async getManufacturableItem(tenantId: string, itemId: string) {
    const item = this.items.get(`${tenantId}:${itemId}`)
    if (!item) {
      return null
    }

    return {
      itemId,
      itemCode: `CODE-${itemId}`,
      itemName: `Item ${itemId}`,
      manufacturable: item.manufacturable,
      physical: item.physical
    }
  }
}

/** createHarness assembles ManufacturingSpec services against the in-memory repository and item lookup stub. */
function createHarness() {
  const store = new MesInMemoryStore()
  const repository = new InMemoryManufacturingSpecRepository(store)
  const itemLookup = new StubManufacturableItemLookupPort()
  itemLookup.items.set(`${tenantId}:item-1`, { manufacturable: true, physical: true })
  itemLookup.items.set(`${tenantId}:item-service`, { manufacturable: true, physical: false })
  itemLookup.items.set(`${tenantId}:item-buyout`, { manufacturable: false, physical: true })

  const management = new ManufacturingSpecManagementService(repository, itemLookup)
  const query = new ManufacturingSpecQueryService(repository)
  return { store, repository, itemLookup, management, query }
}

/** createSpec creates one draft spec with the standard ceramic attributes used by the foundation tests. */
async function createSpec(
  management: ManufacturingSpecManagementService,
  commandId = 'cmd-spec-create-1',
  manufacturingSpecId = 'spec-1',
  specCode = 'wb-a100-hp',
  itemId = 'item-1',
  targetOrgId = orgId
) {
  return management.createManufacturingSpec({
    ...commandContext(commandId, 'create manufacturing spec', targetOrgId),
    manufacturingSpecId,
    specCode,
    name: 'Wash Basin A100 High Pressure',
    revisionCode: 'R1',
    productFamilyRef: {
      refType: 'PRODUCT_FAMILY',
      refId: 'pf-1',
      refCodeSnapshot: 'WB',
      displayNameSnapshot: 'Wash Basin'
    },
    itemRef: {
      itemId,
      itemCodeSnapshot: 'WB-A100',
      itemNameSnapshot: 'Wash Basin A100'
    },
    manufacturingAttributes: [
      {
        attributeKey: 'formingMethod',
        attributeValue: 'HIGH_PRESSURE',
        displayNameSnapshot: 'Forming method',
        valueDisplaySnapshot: 'High pressure'
      }
    ],
    routeIntentRef: {
      routeRefId: 'route-intent-1',
      routeCodeSnapshot: 'ROUTE-HP',
      displayNameSnapshot: 'High pressure route'
    },
    effectiveFrom: '2026-05-05T00:00:00.000Z',
    reason: 'create manufacturing spec'
  })
}

describe('mes-service manufacturing spec foundation behavior L1', () => {
  it('management lifecycle / should create draft, enforce item eligibility, activate, protect active semantics, and retire', async () => {
    const { management, store } = createHarness()

    const created = await createSpec(management)
    expect(created).toMatchObject({
      manufacturingSpecId: 'spec-1',
      specCode: 'WB-A100-HP',
      status: ManufacturingSpecStatus.DRAFT,
      version: 1
    })
    expect(store.outboxEvents[0]?.eventType).toBe('ManufacturingSpecCreated')

    await expect(createSpec(management, 'cmd-spec-duplicate', 'spec-duplicate')).rejects.toMatchObject({
      definition: {
        rpcStatus: status.ALREADY_EXISTS
      }
    })
    await expect(createSpec(management, 'cmd-spec-missing-item', 'spec-missing-item', 'wb-a101-hp', 'item-missing')).rejects.toMatchObject({
      definition: {
        rpcStatus: status.NOT_FOUND
      }
    })
    await expect(createSpec(management, 'cmd-spec-non-physical', 'spec-non-physical', 'wb-a102-hp', 'item-service')).rejects.toMatchObject({
      definition: {
        rpcStatus: status.FAILED_PRECONDITION
      }
    })
    await expect(createSpec(management, 'cmd-spec-non-manufacturable', 'spec-non-manufacturable', 'wb-a103-hp', 'item-buyout')).rejects.toMatchObject({
      definition: {
        rpcStatus: status.FAILED_PRECONDITION
      }
    })

    const updatedDraft = await management.updateManufacturingSpec({
      ...commandContext('cmd-spec-update-draft', 'update draft manufacturing attributes'),
      manufacturingSpecId: 'spec-1',
      expectedVersion: 1,
      manufacturingAttributes: [
        {
          attributeKey: 'formingMethod',
          attributeValue: 'HIGH_PRESSURE'
        },
        {
          attributeKey: 'glazeFamily',
          attributeValue: 'WHITE'
        }
      ],
      reason: 'update draft manufacturing attributes'
    })
    expect(updatedDraft.manufacturingAttributes).toHaveLength(2)
    expect(updatedDraft.version).toBe(2)

    await expect(
      management.activateManufacturingSpec({
        ...commandContext('cmd-spec-activate-stale', 'activate with stale version'),
        manufacturingSpecId: 'spec-1',
        expectedVersion: 1,
        reason: 'activate with stale version'
      })
    ).rejects.toMatchObject({
      definition: {
        rpcStatus: status.ABORTED
      }
    })

    const activated = await management.activateManufacturingSpec({
      ...commandContext('cmd-spec-activate-1', 'activate manufacturing spec'),
      manufacturingSpecId: 'spec-1',
      expectedVersion: 2,
      activatedAt: '2026-05-05T08:00:00.000Z',
      reason: 'activate manufacturing spec'
    })
    expect(activated.status).toBe(ManufacturingSpecStatus.ACTIVE)
    expect(activated.version).toBe(3)

    const renamedActive = await management.updateManufacturingSpec({
      ...commandContext('cmd-spec-update-active-name', 'rename active spec'),
      manufacturingSpecId: 'spec-1',
      expectedVersion: 3,
      name: 'Wash Basin A100 High Pressure Rev A',
      routeIntentRef: {
        routeRefId: 'route-intent-2',
        routeCodeSnapshot: 'ROUTE-HP-A',
        displayNameSnapshot: 'High pressure route A'
      },
      reason: 'rename active spec'
    })
    expect(renamedActive.name).toBe('Wash Basin A100 High Pressure Rev A')
    expect(renamedActive.version).toBe(4)

    await expect(
      management.updateManufacturingSpec({
        ...commandContext('cmd-spec-update-active-attributes', 'mutate active manufacturing attributes'),
        manufacturingSpecId: 'spec-1',
        expectedVersion: 4,
        manufacturingAttributes: [
          {
            attributeKey: 'formingMethod',
            attributeValue: 'LOW_PRESSURE'
          }
        ],
        reason: 'mutate active manufacturing attributes'
      })
    ).rejects.toMatchObject({
      definition: {
        rpcStatus: status.FAILED_PRECONDITION
      }
    })

    const retired = await management.retireManufacturingSpec({
      ...commandContext('cmd-spec-retire-1', 'retire manufacturing spec'),
      manufacturingSpecId: 'spec-1',
      expectedVersion: 4,
      retiredAt: '2026-05-06T00:00:00.000Z',
      reason: 'retire manufacturing spec'
    })
    expect(retired.manufacturingSpec.status).toBe(ManufacturingSpecStatus.RETIRED)
    expect(retired.manufacturingSpec.version).toBe(5)
    expect(retired.replacementSpecSummary).toBeNull()

    await expect(
      management.activateManufacturingSpec({
        ...commandContext('cmd-spec-reactivate-retired', 'reactivate retired manufacturing spec'),
        manufacturingSpecId: 'spec-1',
        expectedVersion: 5,
        reason: 'reactivate retired manufacturing spec'
      })
    ).rejects.toMatchObject({
      definition: {
        rpcStatus: status.FAILED_PRECONDITION
      }
    })
  })

  it('org visibility / should hide ManufacturingSpec targets and replacement refs outside the caller org', async () => {
    const { management, query } = createHarness()
    const orgOneSpec = await createSpec(management, 'cmd-spec-create-org-1', 'spec-org-1', 'wb-org-1-hp')
    const orgTwoSpec = await createSpec(management, 'cmd-spec-create-org-2', 'spec-org-2', 'wb-org-2-hp', 'item-1', 'org-2')

    await expect(
      query.getManufacturingSpec({
        ...queryContext('org-2'),
        manufacturingSpecId: orgOneSpec.manufacturingSpecId
      })
    ).rejects.toMatchObject({
      definition: {
        rpcStatus: status.NOT_FOUND
      }
    })

    await expect(
      management.updateManufacturingSpec({
        ...commandContext('cmd-spec-update-cross-org', 'update cross-org spec', 'org-2'),
        manufacturingSpecId: orgOneSpec.manufacturingSpecId,
        expectedVersion: 1,
        name: 'Cross Org Rename',
        reason: 'update cross-org spec'
      })
    ).rejects.toMatchObject({
      definition: {
        rpcStatus: status.NOT_FOUND
      }
    })

    await expect(
      management.activateManufacturingSpec({
        ...commandContext('cmd-spec-activate-cross-org', 'activate cross-org spec', 'org-2'),
        manufacturingSpecId: orgOneSpec.manufacturingSpecId,
        expectedVersion: 1,
        reason: 'activate cross-org spec'
      })
    ).rejects.toMatchObject({
      definition: {
        rpcStatus: status.NOT_FOUND
      }
    })

    const activatedOrgOne = await management.activateManufacturingSpec({
      ...commandContext('cmd-spec-activate-org-1', 'activate org one spec'),
      manufacturingSpecId: orgOneSpec.manufacturingSpecId,
      expectedVersion: 1,
      reason: 'activate org one spec'
    })
    const activatedOrgTwo = await management.activateManufacturingSpec({
      ...commandContext('cmd-spec-activate-org-2', 'activate org two spec', 'org-2'),
      manufacturingSpecId: orgTwoSpec.manufacturingSpecId,
      expectedVersion: 1,
      reason: 'activate org two spec'
    })

    await expect(
      management.retireManufacturingSpec({
        ...commandContext('cmd-spec-retire-cross-org', 'retire cross-org spec', 'org-2'),
        manufacturingSpecId: activatedOrgOne.manufacturingSpecId,
        expectedVersion: activatedOrgOne.version,
        reason: 'retire cross-org spec'
      })
    ).rejects.toMatchObject({
      definition: {
        rpcStatus: status.NOT_FOUND
      }
    })

    await expect(
      management.retireManufacturingSpec({
        ...commandContext('cmd-spec-retire-cross-replacement', 'retire with cross-org replacement'),
        manufacturingSpecId: activatedOrgOne.manufacturingSpecId,
        expectedVersion: activatedOrgOne.version,
        replacementSpecId: activatedOrgTwo.manufacturingSpecId,
        reason: 'retire with cross-org replacement'
      })
    ).rejects.toMatchObject({
      definition: {
        rpcStatus: status.NOT_FOUND
      }
    })
  })

  it('org visibility / should reject superseded specs and mold design spec refs outside the caller org', async () => {
    const store = new MesInMemoryStore()
    const manufacturingSpecRepository = new InMemoryManufacturingSpecRepository(store)
    const itemLookup = new StubManufacturableItemLookupPort()
    itemLookup.items.set(`${tenantId}:item-1`, { manufacturable: true, physical: true })
    const specManagement = new ManufacturingSpecManagementService(manufacturingSpecRepository, itemLookup)
    const moldManagement = new MesMoldManagementService(
      new InMemoryMesMoldRepository(store),
      manufacturingSpecRepository
    )
    const orgTwoSpec = await createSpec(
      specManagement,
      'cmd-spec-create-org-2-active',
      'spec-org-2-active',
      'wb-org-2-active-hp',
      'item-1',
      'org-2'
    )
    const activatedOrgTwo = await specManagement.activateManufacturingSpec({
      ...commandContext('cmd-spec-activate-org-2-active', 'activate org two active spec', 'org-2'),
      manufacturingSpecId: orgTwoSpec.manufacturingSpecId,
      expectedVersion: 1,
      reason: 'activate org two active spec'
    })

    await expect(
      specManagement.createManufacturingSpec({
        ...commandContext('cmd-spec-create-cross-supersedes', 'create cross-org superseding spec'),
        manufacturingSpecId: 'spec-cross-supersedes',
        specCode: 'wb-cross-supersedes-hp',
        name: 'Cross Org Superseding Spec',
        revisionCode: 'R2',
        supersedesSpecId: activatedOrgTwo.manufacturingSpecId,
        productFamilyRef: {
          refType: 'PRODUCT_FAMILY',
          refId: 'pf-1'
        },
        itemRef: {
          itemId: 'item-1'
        },
        manufacturingAttributes: [
          {
            attributeKey: 'formingMethod',
            attributeValue: 'HIGH_PRESSURE'
          }
        ],
        reason: 'create cross-org superseding spec'
      })
    ).rejects.toMatchObject({
      definition: {
        rpcStatus: status.NOT_FOUND
      }
    })

    await expect(
      moldManagement.registerMoldDesign({
        ...commandContext('cmd-mold-design-cross-org-spec', 'register mold design with cross-org spec'),
        moldDesignId: 'design-cross-org-spec',
        designCode: 'cross-org-spec-design',
        name: 'Cross Org Spec Mold Design',
        revisionCode: 'R1',
        productFamilyRef: {
          refType: 'PRODUCT_FAMILY',
          refId: 'pf-1'
        },
        manufacturingSpecRefs: [
          {
            refType: 'MANUFACTURING_SPEC',
            refId: activatedOrgTwo.manufacturingSpecId,
            refCodeSnapshot: activatedOrgTwo.specCode
          }
        ],
        materialType: 'GYPSUM',
        functionRole: MoldFunctionRole.PRODUCTION,
        productionMethodTags: ['HIGH_PRESSURE'],
        outputStructureType: MoldOutputStructureType.SINGLE,
        outputs: [
          {
            sequenceNo: 1,
            outputCode: 'OUT-CROSS-ORG',
            outputKind: MoldDesignOutputKind.PRODUCT,
            manufacturingSpecRef: {
              refType: 'MANUFACTURING_SPEC',
              refId: activatedOrgTwo.manufacturingSpecId,
              refCodeSnapshot: activatedOrgTwo.specCode
            },
            quantityPerUse: '1',
            isPrimaryOutput: true
          }
        ],
        reason: 'register mold design with cross-org spec'
      })
    ).rejects.toMatchObject({
      definition: {
        rpcStatus: status.NOT_FOUND
      }
    })
  })

  it('queries / should page specs and resolve active manufacturing specs for mold references', async () => {
    const { management, query, store } = createHarness()
    await createSpec(management)
    await management.activateManufacturingSpec({
      ...commandContext('cmd-spec-activate-1', 'activate manufacturing spec'),
      manufacturingSpecId: 'spec-1',
      expectedVersion: 1,
      reason: 'activate manufacturing spec'
    })
    await createSpec(management, 'cmd-spec-create-draft', 'spec-draft', 'wb-a200-hp')

    store.moldDesigns.set('design-1', {
      moldDesignId: 'design-1',
      tenantId,
      orgId,
      designCode: 'DESIGN-1',
      name: 'Design 1',
      revisionCode: 'R1',
      supersedesDesignId: null,
      productFamilyRef: {
        refType: 'PRODUCT_FAMILY',
        refId: 'pf-1'
      },
      manufacturingSpecRefs: [
        {
          refType: 'MANUFACTURING_SPEC',
          refId: 'spec-1',
          refCodeSnapshot: 'WB-A100-HP'
        },
        {
          refType: 'MANUFACTURING_SPEC',
          refId: 'spec-draft',
          refCodeSnapshot: 'WB-A200-HP'
        },
        {
          refType: 'MANUFACTURING_SPEC',
          refId: 'spec-missing',
          refCodeSnapshot: 'MISSING'
        }
      ],
      itemRef: null,
      materialType: 'GYPSUM',
      functionRole: 'PRODUCTION',
      productionMethodTags: [],
      outputStructureType: 'SINGLE',
      outputs: [],
      defaultLifeLimit: null,
      defaultLifeUnit: null,
      status: 'ACTIVE',
      createdAt: '2026-05-05T00:00:00.000Z',
      updatedAt: '2026-05-05T00:00:00.000Z'
    })

    const page = await query.listManufacturingSpecs({
      ...queryContext(),
      keyword: 'WB',
      status: ManufacturingSpecStatus.ACTIVE,
      page: 1,
      pageSize: 20
    })
    expect(page.total).toBe(1)
    expect(page.items[0]?.specCode).toBe('WB-A100-HP')

    const resolved = await query.resolveManufacturingSpecsForMold({
      ...queryContext(),
      moldDesignId: 'design-1'
    })
    expect(resolved.resolvedSpecs).toHaveLength(1)
    expect(resolved.resolvedSpecs[0]?.manufacturingSpecId).toBe('spec-1')
    expect(resolved.unavailableRefs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          refType: 'MANUFACTURING_SPEC',
          refId: 'spec-draft',
          reasonCode: 'NOT_ACTIVE'
        }),
        expect.objectContaining({
          refType: 'MANUFACTURING_SPEC',
          refId: 'spec-missing',
          reasonCode: 'NOT_FOUND'
        })
      ])
    )

    await expect(
      query.resolveManufacturingSpecsForMold({
        ...queryContext()
      })
    ).rejects.toMatchObject({
      definition: {
        rpcStatus: status.INVALID_ARGUMENT
      }
    })
  })

  it('mold integration / should only allow active manufacturing specs on new mold designs', async () => {
    const store = new MesInMemoryStore()
    const manufacturingSpecRepository = new InMemoryManufacturingSpecRepository(store)
    const itemLookup = new StubManufacturableItemLookupPort()
    itemLookup.items.set(`${tenantId}:item-1`, { manufacturable: true, physical: true })
    const specManagement = new ManufacturingSpecManagementService(manufacturingSpecRepository, itemLookup)
    const moldManagement = new MesMoldManagementService(
      new InMemoryMesMoldRepository(store),
      manufacturingSpecRepository
    )

    const active = await createSpec(specManagement, 'cmd-spec-create-active', 'spec-active', 'wb-a300-hp')
    await specManagement.activateManufacturingSpec({
      ...commandContext('cmd-spec-activate-active', 'activate active spec'),
      manufacturingSpecId: active.manufacturingSpecId,
      expectedVersion: 1,
      reason: 'activate active spec'
    })
    const draft = await createSpec(specManagement, 'cmd-spec-create-draft-for-mold', 'spec-draft-for-mold', 'wb-a400-hp')

    await expect(
      moldManagement.registerMoldDesign({
        ...commandContext('cmd-mold-design-draft-spec', 'register mold design with draft spec'),
        moldDesignId: 'design-draft-spec',
        designCode: 'draft-spec-design',
        name: 'Draft Spec Mold Design',
        revisionCode: 'R1',
        productFamilyRef: {
          refType: 'PRODUCT_FAMILY',
          refId: 'pf-1'
        },
        manufacturingSpecRefs: [
          {
            refType: 'MANUFACTURING_SPEC',
            refId: draft.manufacturingSpecId,
            refCodeSnapshot: draft.specCode
          }
        ],
        materialType: 'GYPSUM',
        functionRole: MoldFunctionRole.PRODUCTION,
        productionMethodTags: ['HIGH_PRESSURE'],
        outputStructureType: MoldOutputStructureType.SINGLE,
        outputs: [
          {
            sequenceNo: 1,
            outputCode: 'OUT-DRAFT',
            outputKind: MoldDesignOutputKind.PRODUCT,
            manufacturingSpecRef: {
              refType: 'MANUFACTURING_SPEC',
              refId: draft.manufacturingSpecId,
              refCodeSnapshot: draft.specCode
            },
            quantityPerUse: '1',
            isPrimaryOutput: true
          }
        ],
        reason: 'register mold design with draft spec'
      })
    ).rejects.toMatchObject({
      definition: {
        rpcStatus: status.FAILED_PRECONDITION
      }
    })

    const registered = await moldManagement.registerMoldDesign({
      ...commandContext('cmd-mold-design-active-spec', 'register mold design with active spec'),
      moldDesignId: 'design-active-spec',
      designCode: 'active-spec-design',
      name: 'Active Spec Mold Design',
      revisionCode: 'R1',
      productFamilyRef: {
        refType: 'PRODUCT_FAMILY',
        refId: 'pf-1'
      },
      manufacturingSpecRefs: [
        {
          refType: 'MANUFACTURING_SPEC',
          refId: active.manufacturingSpecId,
          refCodeSnapshot: active.specCode
        }
      ],
      materialType: 'GYPSUM',
      functionRole: MoldFunctionRole.PRODUCTION,
      productionMethodTags: ['HIGH_PRESSURE'],
      outputStructureType: MoldOutputStructureType.SINGLE,
      outputs: [
        {
          sequenceNo: 1,
          outputCode: 'OUT-ACTIVE',
          outputKind: MoldDesignOutputKind.PRODUCT,
          manufacturingSpecRef: {
            refType: 'MANUFACTURING_SPEC',
            refId: active.manufacturingSpecId,
            refCodeSnapshot: active.specCode
          },
          quantityPerUse: '1',
          isPrimaryOutput: true
        }
      ],
      reason: 'register mold design with active spec'
    })

    expect(registered.manufacturingSpecRefs[0]?.refId).toBe(active.manufacturingSpecId)
  })
})
