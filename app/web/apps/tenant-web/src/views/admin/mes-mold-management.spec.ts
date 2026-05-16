/* @vitest-environment happy-dom */

import { flushPromises, mount } from '@vue/test-utils'
import { Select } from 'ant-design-vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const installProductionMoldApi = vi.fn()
const acceptProductionMoldApi = vi.fn()
const listCurrentMoldsByWorkCenterApi = vi.fn()
const listManagedItemModelsApi = vi.fn()
const listMasterMoldsApi = vi.fn()
const listMoldDesignsApi = vi.fn()
const listProductionMoldsApi = vi.fn()
const listProductionSpecsApi = vi.fn()
const markProductionMoldForScrapApi = vi.fn()
const recordDailyMoldUsageBatchApi = vi.fn()
const registerMoldDesignApi = vi.fn()
const registerProductionMoldApi = vi.fn()
const unmountProductionMoldApi = vi.fn()
const push = vi.fn()

const authContextState: any = {
  actionCodes: [],
  sessionContext: {
    tenant: {
      name: 'Alpha Tenant',
      tenantId: 'tenant-1'
    }
  },
  tenantName: 'Alpha Tenant',
  visibleEntries: ['mes.mold-management']
}

vi.mock('#/api', () => ({
  acceptProductionMoldApi,
  installProductionMoldApi,
  listCurrentMoldsByWorkCenterApi,
  listManagedItemModelsApi,
  listMasterMoldsApi,
  listMoldDesignsApi,
  listProductionMoldsApi,
  listProductionSpecsApi,
  markProductionMoldForScrapApi,
  recordDailyMoldUsageBatchApi,
  registerMoldDesignApi,
  registerProductionMoldApi,
  unmountProductionMoldApi
}))

vi.mock('#/store/auth-context', () => ({
  useAuthContextStore: () => authContextState
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({
    push
  })
}))

vi.mock('@vben/common-ui', () => ({
  Page: {
    name: 'Page',
    template: '<div><slot /></div>'
  }
}))

vi.mock('ant-design-vue', async () => await import('./__tests__/ant-design-vue-mock'))

async function setAntSelectValue(wrapper: ReturnType<typeof mount>, testId: string, value: string) {
  const select = wrapper.findAllComponents(Select).find((candidate) => candidate.attributes('data-testid') === testId)
  if (!select) {
    throw new Error(`Ant Select not found: ${testId}`)
  }

  select.vm.$emit('update:value', value)
  select.vm.$emit('change', value)
  await flushPromises()
}

const productionSpec = {
  itemRef: {
    itemCodeSnapshot: 'WC-ONE-300',
    itemId: 'item-1',
    itemNameSnapshot: '连体马桶 300/400 坑距'
  },
  name: '连体马桶 300 坑距注浆规格',
  productionSpecId: 'spec-300',
  specCode: 'SPEC-LT-300',
  status: 'ACTIVE'
}

const moldDesign = {
  defaultLifeLimit: '1200',
  defaultLifeUnit: 'CASTING_CYCLE',
  designCode: 'MD-LT-HP-01',
  moldDesignId: 'design-1',
  name: '连体马桶高压模具方案',
  outputs: [
    {
      componentRole: '主体',
      isPrimaryOutput: true,
      moldDesignOutputId: 'output-body',
      options: [
        {
          isDefault: true,
          moldDesignOutputId: 'output-body',
          moldDesignOutputOptionId: 'option-300',
          optionCode: 'PIT-300',
          productionSpecRef: {
            productionSpecId: 'spec-300',
            specCodeSnapshot: 'SPEC-LT-300'
          },
          quantityPerUse: '1'
        }
      ],
      outputCode: 'BODY',
      outputKind: 'PRODUCT',
      quantityPerUse: '1',
      sequenceNo: 1
    }
  ]
}

const productionMold = {
  currentInstallationSummary: {
    moldDetail: {
      moldPosition: 'A01'
    },
    toolingInstallationId: 'install-1',
    workCenterRef: {
      displayNameSnapshot: '连体马桶上线一线',
      workCenterCodeSnapshot: 'LINE-LT-01',
      workCenterId: 'wc-1'
    }
  },
  currentStatus: 'INSTALLED',
  lifeCounterSummary: {
    lifeUnit: 'CASTING_CYCLE',
    limitValue: '1200',
    usedValue: '340'
  },
  moldCode: 'PM-LT-001',
  moldDesignId: 'design-1',
  moldDesignSummary: {
    designCode: 'MD-LT-HP-01',
    moldDesignId: 'design-1',
    name: '连体马桶高压模具方案'
  },
  productionMoldId: 'mold-1'
}

// Verifies the MES mold workspace uses the current ProductionSpec / ProductionMold / ToolingInstallation BFF contract.
describe('MES mold management workspace page', () => {
  beforeEach(() => {
    installProductionMoldApi.mockReset()
    acceptProductionMoldApi.mockReset()
    listCurrentMoldsByWorkCenterApi.mockReset()
    listManagedItemModelsApi.mockReset()
    listMasterMoldsApi.mockReset()
    listMoldDesignsApi.mockReset()
    listProductionMoldsApi.mockReset()
    listProductionSpecsApi.mockReset()
    markProductionMoldForScrapApi.mockReset()
    recordDailyMoldUsageBatchApi.mockReset()
    registerMoldDesignApi.mockReset()
    registerProductionMoldApi.mockReset()
    unmountProductionMoldApi.mockReset()
    push.mockReset()
    authContextState.actionCodes = [
      'mes.mold_design.read',
      'mes.mold_design.manage',
      'mes.production_mold.read',
      'mes.production_mold.manage',
      'mes.tooling_installation.read',
      'mes.tooling_installation.manage',
      'mes.mold_usage.record'
    ]

    listMoldDesignsApi.mockResolvedValue({ moldDesigns: [moldDesign], page: 1, pageSize: 50, total: 1 })
    listMasterMoldsApi.mockResolvedValue({ masterMolds: [], page: 1, pageSize: 50, total: 0 })
    listProductionMoldsApi.mockResolvedValue({ productionMolds: [productionMold], page: 1, pageSize: 50, total: 1 })
    listCurrentMoldsByWorkCenterApi.mockResolvedValue({
      items: [
        {
          productionMold,
          toolingInstallation: productionMold.currentInstallationSummary
        }
      ]
    })
    listManagedItemModelsApi.mockResolvedValue({
      itemModels: [
        {
          itemModelId: 'item-model-1',
          modelCode: 'WC-ONE',
          modelName: '连体马桶 300/400 坑距',
          modelKind: 'PHYSICAL',
          modelType: 'PRODUCT',
          status: 'ACTIVE'
        }
      ]
    })
    listProductionSpecsApi.mockResolvedValue({ productionSpecs: [productionSpec], page: 1, pageSize: 50, total: 1 })
    registerMoldDesignApi.mockResolvedValue(moldDesign)
    registerProductionMoldApi.mockResolvedValue({ ...productionMold, productionMoldId: 'mold-new' })
    acceptProductionMoldApi.mockResolvedValue({ ...productionMold, currentStatus: 'AVAILABLE' })
    installProductionMoldApi.mockResolvedValue({ toolingInstallation: productionMold.currentInstallationSummary })
    unmountProductionMoldApi.mockResolvedValue({ toolingInstallation: productionMold.currentInstallationSummary })
    markProductionMoldForScrapApi.mockResolvedValue({ productionMold })
    recordDailyMoldUsageBatchApi.mockResolvedValue({ acceptedItems: [], skippedItems: [] })
  })

  it('loads MoldDesign and ProductionMold directories without querying old work-center APIs', async () => {
    const page = (await import('./mes-mold-management.vue')).default
    const wrapper = mount(page)

    await flushPromises()

    expect(listMoldDesignsApi).toHaveBeenCalledWith('tenant-1', { page: 1, pageSize: 50, status: 'ACTIVE' })
    expect(listMasterMoldsApi).toHaveBeenCalledWith('tenant-1', { page: 1, pageSize: 50, status: 'AVAILABLE' })
    expect(listProductionMoldsApi).toHaveBeenCalledWith('tenant-1', { page: 1, pageSize: 50 })
    expect(wrapper.text()).toContain('MD-LT-HP-01')
    expect(wrapper.find('[data-testid="mes-open-create-work-center"]').exists()).toBe(false)
  })

  it('loads current tooling installations by manual WorkCenterRef and records checked usage', async () => {
    const page = (await import('./mes-mold-management.vue')).default
    const wrapper = mount(page)

    await flushPromises()
    await wrapper.get('[data-testid="mes-current-work-center-id"]').setValue('wc-1')
    await wrapper.get('[data-testid="mes-current-work-center-code"]').setValue('LINE-LT-01')
    await wrapper.get('[data-testid="mes-current-work-center-name"]').setValue('连体马桶上线一线')
    await wrapper.get('[data-testid="mes-load-current-molds"]').trigger('click')
    await flushPromises()
    await wrapper.get('[data-testid="mes-open-daily-usage"]').trigger('click')
    await flushPromises()
    await wrapper.get('[data-testid="mes-submit-daily-usage"]').trigger('click')
    await flushPromises()

    expect(listCurrentMoldsByWorkCenterApi).toHaveBeenCalledWith('tenant-1', 'wc-1')
    const usagePayload = recordDailyMoldUsageBatchApi.mock.calls[0]?.[2]
    expect(usagePayload.items[0]).not.toHaveProperty('moldPosition')
    expect(recordDailyMoldUsageBatchApi).toHaveBeenCalledWith(
      'tenant-1',
      expect.any(String),
      expect.objectContaining({
        items: [
          expect.objectContaining({
            lifeUnit: 'CASTING_CYCLE',
            moldDesignOutputOptionId: 'option-300',
            productionMoldId: 'mold-1',
            toolingInstallationId: 'install-1',
            workCenterRef: expect.objectContaining({ workCenterId: 'wc-1' })
          })
        ],
        workCenterRef: expect.objectContaining({ workCenterId: 'wc-1' })
      })
    )
  })

  it('creates mold designs, production molds, and tooling installation commands with current names', async () => {
    listProductionMoldsApi.mockResolvedValue({
      productionMolds: [{ ...productionMold, currentInstallationSummary: undefined, currentStatus: 'AVAILABLE' }],
      page: 1,
      pageSize: 50,
      total: 1
    })
    const page = (await import('./mes-mold-management.vue')).default
    const wrapper = mount(page)

    await flushPromises()
    await wrapper.get('[data-testid="mes-open-create-mold-design"]').trigger('click')
    await flushPromises()
    await setAntSelectValue(wrapper, 'mes-mold-design-item', 'item-model-1')
    await flushPromises()
    await wrapper.get('[data-testid="mes-submit-create-mold-design"]').trigger('click')
    await flushPromises()

    expect(listManagedItemModelsApi).toHaveBeenCalledWith('tenant-1', expect.objectContaining({
      capabilities: ['manufacturable']
    }))
    expect(registerMoldDesignApi).toHaveBeenCalledWith(
      'tenant-1',
      expect.objectContaining({
        primaryItemModelRef: expect.objectContaining({
          itemModelId: 'item-model-1'
        }),
        productionSpecRefs: [
          expect.objectContaining({
            productionSpecId: 'spec-300',
            specCodeSnapshot: 'SPEC-LT-300'
          })
        ],
        defaultLifeUnit: 'CASTING_CYCLE'
      })
    )

    await wrapper.get('[data-testid="mes-open-create-mold"]').trigger('click')
    await flushPromises()
    await wrapper.get('[data-testid="mes-production-mold-initial-storage-id"]').setValue('storage-1')
    await wrapper.get('[data-testid="mes-submit-create-mold"]').trigger('click')
    await flushPromises()

    expect(registerProductionMoldApi).toHaveBeenCalledWith('tenant-1', expect.objectContaining({
      initialStorageResourceRef: expect.objectContaining({ storageResourceId: 'storage-1' }),
      moldCode: expect.stringContaining('PM-'),
      moldDesignId: 'design-1',
      reason: 'web create production mold'
    }))

    await wrapper.get('[data-testid="mes-current-work-center-id"]').setValue('wc-1')
    await wrapper.get('[data-testid="mes-open-install-mold-mold-1"]').trigger('click')
    await flushPromises()
    await wrapper.get('[data-testid="mes-install-work-unit-id"]').setValue('wu-1')
    await wrapper.get('[data-testid="mes-install-work-unit-code"]').setValue('WU-01')
    await wrapper.get('[data-testid="mes-install-work-unit-name"]').setValue('上模位 1')
    await wrapper.get('[data-testid="mes-install-cavity-position"]').setValue('LEFT')
    await wrapper.get('[data-testid="mes-install-setup-parameters"]').setValue('{"pressure":"normal"}')
    await wrapper.get('[data-testid="mes-submit-install-mold"]').trigger('click')
    await flushPromises()

    expect(installProductionMoldApi).toHaveBeenCalledWith(
      'tenant-1',
      'mold-1',
      expect.objectContaining({
        cavityPosition: 'LEFT',
        setupParameters: '{"pressure":"normal"}',
        workCenterRef: expect.objectContaining({ workCenterId: 'wc-1' }),
        workUnitRef: {
          displayNameSnapshot: '上模位 1',
          workUnitCodeSnapshot: 'WU-01',
          workUnitId: 'wu-1'
        }
      })
    )
  })
})
    markProductionMoldForScrapApi.mockReset()
