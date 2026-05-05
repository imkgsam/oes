/* @vitest-environment happy-dom */

import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const createWorkCenterApi = vi.fn()
const installProductionMoldInstanceApi = vi.fn()
const listCurrentMoldsByWorkCenterApi = vi.fn()
const listManagedItemsApi = vi.fn()
const listManufacturingSpecsApi = vi.fn()
const listMoldDesignsApi = vi.fn()
const listProductionMoldInstancesApi = vi.fn()
const listWorkCentersApi = vi.fn()
const recordDailyMoldUsageBatchApi = vi.fn()
const registerMoldDesignApi = vi.fn()
const registerProductionMoldInstanceApi = vi.fn()

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
  createWorkCenterApi,
  installProductionMoldInstanceApi,
  listCurrentMoldsByWorkCenterApi,
  listManagedItemsApi,
  listManufacturingSpecsApi,
  listMoldDesignsApi,
  listProductionMoldInstancesApi,
  listWorkCentersApi,
  recordDailyMoldUsageBatchApi,
  registerMoldDesignApi,
  registerProductionMoldInstanceApi
}))

vi.mock('#/store/auth-context', () => ({
  useAuthContextStore: () => authContextState
}))

vi.mock('@vben/common-ui', () => ({
  Page: {
    name: 'Page',
    template: '<div><slot /></div>'
  }
}))

// Verifies the MES mold workspace loads the minimum loop and records daily output-option usage.
describe('MES mold management workspace page', () => {
  beforeEach(() => {
    createWorkCenterApi.mockReset()
    installProductionMoldInstanceApi.mockReset()
    listCurrentMoldsByWorkCenterApi.mockReset()
    listManagedItemsApi.mockReset()
    listManufacturingSpecsApi.mockReset()
    listMoldDesignsApi.mockReset()
    listProductionMoldInstancesApi.mockReset()
    listWorkCentersApi.mockReset()
    recordDailyMoldUsageBatchApi.mockReset()
    registerMoldDesignApi.mockReset()
    registerProductionMoldInstanceApi.mockReset()
    authContextState.actionCodes = [
      'mes.mold_design.read',
      'mes.mold_design.manage',
      'mes.production_mold_instance.read',
      'mes.production_mold_instance.manage',
      'mes.work_center_mold_status.read',
      'mes.mold_usage.record'
    ]

    listWorkCentersApi.mockResolvedValue({
      page: 1,
      pageSize: 20,
      total: 1,
      workCenters: [
        {
          name: '连体马桶上线一线',
          status: 'ACTIVE',
          workCenterCode: 'LINE-LT-01',
          workCenterId: 'wc-1',
          workCenterType: 'CASTING_LINE'
        }
      ]
    })
    listMoldDesignsApi.mockResolvedValue({
      moldDesigns: [
        {
          defaultLifeLimit: '1200',
          defaultLifeUnit: 'USE',
          designCode: 'MD-LT-HP-01',
          moldDesignId: 'design-1',
          name: '连体马桶高压模具方案',
          outputs: [
            {
              componentRole: '主体',
              moldDesignOutputId: 'output-body',
              options: [
                {
                  isDefault: true,
                  label: '300坑距',
                  manufacturingSpecRef: { refId: 'spec-300' },
                  moldDesignOutputOptionId: 'option-300',
                  optionCode: 'PIT-300'
                }
              ],
              outputCode: 'BODY',
              quantityPerUse: '1',
              sequenceNo: 1
            }
          ],
          revisionCode: 'R1'
        }
      ],
      page: 1,
      pageSize: 20,
      total: 1
    })
    listManagedItemsApi.mockResolvedValue({
      items: [
        {
          capabilities: {
            manufacturable: true,
            purchasable: false,
            sellable: true,
            stockable: true
          },
          itemCode: 'WC-ONE-300',
          itemId: 'item-1',
          itemName: '连体马桶 300/400 坑距',
          natureType: 'PHYSICAL',
          status: 'ACTIVE',
          structureType: 'SINGLE'
        }
      ],
      page: 1,
      pageSize: 100,
      total: 1
    })
    listManufacturingSpecsApi.mockResolvedValue({
      manufacturingSpecs: [
        {
          itemRef: {
            itemCodeSnapshot: 'WC-ONE-300',
            itemId: 'item-1',
            itemNameSnapshot: '连体马桶 300/400 坑距'
          },
          manufacturingSpecId: 'spec-300',
          name: '连体马桶 300 坑距注浆规格',
          productFamilyRef: {
            displayNameSnapshot: '连体马桶系列',
            refCodeSnapshot: 'LT',
            refId: 'pf-1',
            refType: 'PRODUCT_FAMILY'
          },
          revisionCode: 'R1',
          specCode: 'MS-LT-300',
          status: 'ACTIVE'
        }
      ],
      page: 1,
      pageSize: 50,
      total: 1
    })
    listProductionMoldInstancesApi.mockResolvedValue({
      instances: [
        {
          currentInstallationSummary: {
            moldInstallationId: 'install-1',
            resourcePositionId: 'pos-1',
            workCenterId: 'wc-1'
          },
          currentStatus: 'INSTALLED',
          lifeSummary: {
            lifeUnit: 'USE',
            limitValue: '1200',
            remainingValue: '860',
            usedValue: '340'
          },
          moldDesignSummary: {
            designCode: 'MD-LT-HP-01',
            moldDesignId: 'design-1',
            name: '连体马桶高压模具方案'
          },
          moldInstanceCode: 'PM-LT-001',
          productionMoldInstanceId: 'mold-1'
        }
      ],
      page: 1,
      pageSize: 20,
      total: 1
    })
    listCurrentMoldsByWorkCenterApi.mockResolvedValue({
      installedMolds: [
        {
          productionMoldInstance: {
            currentInstallationSummary: {
              moldInstallationId: 'install-1',
              resourcePositionId: 'pos-1',
              workCenterId: 'wc-1'
            },
            currentStatus: 'INSTALLED',
            moldDesignSummary: {
              designCode: 'MD-LT-HP-01',
              moldDesignId: 'design-1',
              name: '连体马桶高压模具方案'
            },
            moldInstanceCode: 'PM-LT-001',
            productionMoldInstanceId: 'mold-1'
          }
        }
      ],
      page: 1,
      pageSize: 100,
      total: 1,
      workCenterSummary: {
        name: '连体马桶上线一线',
        workCenterCode: 'LINE-LT-01',
        workCenterId: 'wc-1',
        workCenterType: 'CASTING_LINE'
      }
    })
    createWorkCenterApi.mockResolvedValue({ workCenterId: 'wc-new' })
    registerMoldDesignApi.mockResolvedValue({ moldDesignId: 'design-new' })
    registerProductionMoldInstanceApi.mockResolvedValue({ productionMoldInstanceId: 'mold-new' })
    installProductionMoldInstanceApi.mockResolvedValue({ productionMoldInstanceId: 'mold-1' })
    recordDailyMoldUsageBatchApi.mockResolvedValue({ acceptedItems: [{ productionMoldInstanceId: 'mold-1' }] })
  })

  it('loads directories and submits daily mold usage with the selected output option', async () => {
    const page = (await import('./mes-mold-management.vue')).default
    const wrapper = mount(page)

    await flushPromises()

    expect(listWorkCentersApi).toHaveBeenCalledWith('tenant-1', {
      page: 1,
      pageSize: 50,
      status: 'ACTIVE'
    })
    expect(listMoldDesignsApi).toHaveBeenCalledWith('tenant-1', {
      page: 1,
      pageSize: 50,
      status: 'ACTIVE'
    })
    expect(listProductionMoldInstancesApi).toHaveBeenCalledWith('tenant-1', {
      page: 1,
      pageSize: 50
    })
    expect(listCurrentMoldsByWorkCenterApi).toHaveBeenCalledWith('tenant-1', 'wc-1')
    expect(wrapper.text()).toContain('连体马桶上线一线')
    expect(wrapper.text()).toContain('MD-LT-HP-01')
    expect(wrapper.text()).toContain('PM-LT-001')

    await wrapper.get('[data-testid="mes-open-daily-usage"]').trigger('click')
    await wrapper.get('[data-testid="mes-submit-daily-usage"]').trigger('click')

    expect(recordDailyMoldUsageBatchApi).toHaveBeenCalledWith('tenant-1', expect.any(String), {
      batchCommandId: expect.stringContaining('wc-1'),
      items: [
        expect.objectContaining({
          checked: true,
          moldDesignOutputId: 'output-body',
          moldDesignOutputOptionId: 'option-300',
          moldInstallationId: 'install-1',
          productionMoldInstanceId: 'mold-1',
          resourcePositionId: 'pos-1',
          workCenterId: 'wc-1'
        })
      ],
      reason: 'web daily mold usage checklist',
      workCenterId: 'wc-1'
    })
  })

  it('opens create dialogs and forwards production unit, mold instance, and install commands', async () => {
    listProductionMoldInstancesApi.mockResolvedValue({
      instances: [
        {
          currentStatus: 'PENDING_INSTALLATION',
          lifeSummary: {
            lifeUnit: 'USE',
            limitValue: '1200',
            remainingValue: '1200',
            usedValue: '0'
          },
          moldDesignSummary: {
            designCode: 'MD-LT-HP-01',
            moldDesignId: 'design-1',
            name: '连体马桶高压模具方案'
          },
          moldInstanceCode: 'PM-LT-001',
          productionMoldInstanceId: 'mold-1'
        }
      ],
      page: 1,
      pageSize: 20,
      total: 1
    })
    const page = (await import('./mes-mold-management.vue')).default
    const wrapper = mount(page)

    await flushPromises()
    await wrapper.get('[data-testid="mes-open-create-work-center"]').trigger('click')
    await wrapper.get('[data-testid="mes-submit-create-work-center"]').trigger('click')
    await wrapper.get('[data-testid="mes-open-create-mold"]').trigger('click')
    await wrapper.get('[data-testid="mes-submit-create-mold"]').trigger('click')
    await wrapper.get('[data-testid="mes-open-install-mold-mold-1"]').trigger('click')
    await wrapper.get('[data-testid="mes-submit-install-mold"]').trigger('click')

    expect(createWorkCenterApi).toHaveBeenCalledWith('tenant-1', {
      name: '连体马桶上线二线',
      reason: 'web create work center',
      workCenterCode: expect.stringContaining('LINE-'),
      workCenterType: 'CASTING_LINE'
    })
    expect(registerProductionMoldInstanceApi).toHaveBeenCalledWith('tenant-1', {
      initialStatus: 'PENDING_INSTALLATION',
      lifeLimitValue: '1200',
      lifeUnit: 'USE',
      moldDesignId: 'design-1',
      moldInstanceCode: expect.stringContaining('PM-'),
      reason: 'web create production mold',
      warningThresholdValue: '960'
    })
    expect(installProductionMoldInstanceApi).toHaveBeenCalledWith('tenant-1', 'mold-1', {
      reason: 'web install mold',
      workCenterId: 'wc-1'
    })
  })

  it('opens the create MoldDesign side panel and registers output options against an active ManufacturingSpec', async () => {
    const page = (await import('./mes-mold-management.vue')).default
    const wrapper = mount(page)

    await flushPromises()
    await wrapper.get('[data-testid="mes-open-create-mold-design"]').trigger('click')
    await flushPromises()

    expect(listManagedItemsApi).toHaveBeenCalledWith('tenant-1', {
      capability: 'manufacturable',
      keyword: undefined,
      natureType: 'PHYSICAL',
      page: 1,
      pageSize: 100,
      status: 'ACTIVE',
      structureType: undefined
    })
    expect(listManufacturingSpecsApi).toHaveBeenCalledWith('tenant-1', {
      itemId: 'item-1',
      page: 1,
      pageSize: 50,
      status: 'ACTIVE'
    })
    expect(wrapper.text()).toContain('创建模具方案')
    expect(wrapper.text()).toContain('连体马桶 300/400 坑距')
    expect(wrapper.text()).toContain('连体马桶 300 坑距注浆规格')

    await wrapper.get('[data-testid="mes-mold-design-code"]').setValue('MD-LT-HP-02')
    await wrapper.get('[data-testid="mes-mold-design-name"]').setValue('连体马桶高压模具方案二版')
    await wrapper.get('[data-testid="mes-mold-design-material"]').setValue('RESIN')
    await wrapper.get('[data-testid="mes-mold-design-method"]').setValue('HIGH_PRESSURE')
    await wrapper.get('[data-testid="mes-mold-design-output-code"]').setValue('BODY')
    await wrapper.get('[data-testid="mes-mold-design-component-role"]').setValue('主体')
    await wrapper.get('[data-testid="mes-mold-design-option-code"]').setValue('PIT-300')
    await wrapper.get('[data-testid="mes-mold-design-option-label"]').setValue('300 坑距')
    await wrapper.get('[data-testid="mes-submit-create-mold-design"]').trigger('click')

    expect(registerMoldDesignApi).toHaveBeenCalledWith(
      'tenant-1',
      expect.objectContaining({
        defaultLifeLimit: '1200',
        defaultLifeUnit: 'USE',
        designCode: 'MD-LT-HP-02',
        functionRole: 'PRODUCTION',
        itemRef: {
          itemCodeSnapshot: 'WC-ONE-300',
          itemId: 'item-1',
          itemNameSnapshot: '连体马桶 300/400 坑距'
        },
        materialType: 'RESIN',
        name: '连体马桶高压模具方案二版',
        outputStructureType: 'SINGLE',
        productionMethodTags: ['HIGH_PRESSURE'],
        reason: 'web register mold design'
      })
    )
    const [, registerPayload] = registerMoldDesignApi.mock.calls[0]!
    expect(registerPayload.manufacturingSpecRefs).toEqual([
      {
        displayNameSnapshot: '连体马桶 300 坑距注浆规格',
        refCodeSnapshot: 'MS-LT-300',
        refId: 'spec-300',
        refType: 'MANUFACTURING_SPEC'
      }
    ])
    expect(registerPayload.outputs).toEqual([
      expect.objectContaining({
        componentRole: '主体',
        isPrimaryOutput: true,
        options: [
          expect.objectContaining({
            isDefault: true,
            label: '300 坑距',
            optionCode: 'PIT-300'
          })
        ],
        outputCode: 'BODY',
        outputKind: 'PRODUCT',
        quantityPerUse: '1',
        sequenceNo: 1
      })
    ])
  })
})
