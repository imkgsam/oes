/* @vitest-environment happy-dom */

import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const cancelReceiptDraftApi = vi.fn()
const getReceiptByIdApi = vi.fn()
const postReceiptApi = vi.fn()
const replaceReceiptLinesApi = vi.fn()

const authContextState: any = {
  actionCodes: ['wms.receipt.read', 'wms.receipt.manage'],
  sessionContext: {
    tenant: {
      tenantId: 'tenant-1'
    }
  }
}

vi.mock('#/api', () => ({
  cancelReceiptDraftApi,
  getReceiptByIdApi,
  postReceiptApi,
  replaceReceiptLinesApi
}))

vi.mock('#/store/auth-context', () => ({
  useAuthContextStore: () => authContextState
}))

vi.mock('vue-router', () => ({
  useRoute: () => ({
    params: {
      receiptId: 'receipt-1'
    }
  })
}))

vi.mock('@vben/common-ui', () => ({
  Page: {
    name: 'Page',
    template: '<div><slot /></div>'
  }
}))

const RECEIPT_DETAIL = {
  attachmentRefs: [],
  createdAt: '2026-04-29T08:00:00.000Z',
  lineCount: 2,
  lines: [
    {
      confirmedQuantity: '8',
      inventoryStatus: 'AVAILABLE',
      itemCode: 'ITEM-001',
      itemId: 'item-1',
      itemName: 'Starter Item',
      lineNo: 1,
      physicalDiscrepancy: {
        discrepancyQuantity: '2',
        discrepancyType: 'SHORT_RECEIVED',
        note: 'supplier shipped fewer units'
      },
      receiptId: 'receipt-1',
      receiptLineId: 'receipt-line-1',
      targetLocationId: 'location-1',
      uom: 'PCS'
    },
    {
      confirmedQuantity: '2',
      inventoryStatus: 'RESTRICTED',
      itemCode: 'ITEM-001',
      itemId: 'item-1',
      itemName: 'Starter Item',
      lineNo: 2,
      physicalDiscrepancy: {
        discrepancyQuantity: '2',
        discrepancyType: 'DAMAGED',
        note: 'outer box collapsed'
      },
      receiptId: 'receipt-1',
      receiptLineId: 'receipt-line-2',
      restrictedReason: {
        reasonCode: 'DAMAGED',
        reasonNote: 'visual damage'
      },
      targetLocationId: 'location-2',
      uom: 'PCS'
    }
  ],
  note: 'dock A',
  postedAt: '',
  receiptDate: '2026-04-29',
  receiptId: 'receipt-1',
  receiptNo: 'RCPT-001',
  receiptSourceType: 'MANUAL',
  status: 'DRAFT',
  warehouseId: 'warehouse-1'
}

// Verifies the WMS receipt detail page shows physical discrepancy summaries and lets operators replace draft lines, post, or cancel drafts without adding inventory rules.
describe('wms receipt detail page', () => {
  beforeEach(() => {
    cancelReceiptDraftApi.mockReset()
    getReceiptByIdApi.mockReset()
    postReceiptApi.mockReset()
    replaceReceiptLinesApi.mockReset()

    getReceiptByIdApi.mockResolvedValue(RECEIPT_DETAIL)
    replaceReceiptLinesApi.mockResolvedValue(RECEIPT_DETAIL)
    postReceiptApi.mockResolvedValue({
      ...RECEIPT_DETAIL,
      postedAt: '2026-04-29T09:00:00.000Z',
      status: 'POSTED'
    })
    cancelReceiptDraftApi.mockResolvedValue({
      ...RECEIPT_DETAIL,
      status: 'CANCELLED'
    })
  })

  it('loads one receipt, displays discrepancy summary, and supports draft line update/post/cancel', async () => {
    const page = (await import('./wms-receipt-detail.vue')).default
    const wrapper = mount(page)

    await flushPromises()

    expect(getReceiptByIdApi).toHaveBeenCalledWith('tenant-1', 'receipt-1')
    expect(wrapper.text()).toContain('RCPT-001')
    expect(wrapper.text()).toContain('SHORT_RECEIVED')
    expect(wrapper.text()).toContain('DAMAGED')

    await wrapper.get('[data-testid="wms-receipt-line-0-item-id"]').setValue('item-1')
    await wrapper.get('[data-testid="wms-receipt-line-0-quantity"]').setValue('9')
    await wrapper.get('[data-testid="wms-receipt-line-1-restricted-reason"]').setValue('DAMAGED')
    await wrapper.get('[data-testid="wms-receipt-save-lines"]').trigger('click')
    await wrapper.get('[data-testid="wms-receipt-post"]').trigger('click')
    await wrapper.get('[data-testid="wms-receipt-cancel"]').trigger('click')

    expect(replaceReceiptLinesApi).toHaveBeenCalledWith('tenant-1', 'receipt-1', expect.objectContaining({
      auditReason: 'edit receipt draft lines from tenant-web',
      lines: expect.any(Array)
    }))
    expect(postReceiptApi).toHaveBeenCalledWith('tenant-1', 'receipt-1', {
      auditReason: 'post receipt from tenant-web',
      postComment: undefined
    })
    expect(cancelReceiptDraftApi).toHaveBeenCalledWith('tenant-1', 'receipt-1', {
      auditReason: 'cancel receipt draft from tenant-web',
      cancelReason: 'cancelled from tenant-web receipt detail'
    })
  })
})
