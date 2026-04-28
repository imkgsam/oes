import { Reflector } from '@nestjs/core'
import { PERMISSION_CHECK_KEY } from '@oes/common/authorization'
import { ProcurementController } from './procurement.controller'

// Verifies the procurement gateway controller keeps permissions and phase 1 request forwarding aligned with the frozen procurement BFF surface.
describe('ProcurementController', () => {
  const procurementService = {
    applyPurchaseOrderChange: jest.fn(),
    cancelPurchaseOrder: jest.fn(),
    cancelPurchaseRequest: jest.fn(),
    confirmSupplierAcknowledgement: jest.fn(),
    convertPurchaseRequestToPurchaseOrder: jest.fn(),
    createPurchaseOrderDraft: jest.fn(),
    createPurchaseRequest: jest.fn(),
    createReceivingExpectation: jest.fn(),
    decidePurchaseRequest: jest.fn(),
    getPurchaseOrder: jest.fn(),
    getPurchaseRequest: jest.fn(),
    getReceivingExpectation: jest.fn(),
    issuePurchaseOrder: jest.fn(),
    listPurchaseOrderChanges: jest.fn(),
    recordReceivingDiscrepancyResolution: jest.fn(),
    searchPurchaseOrders: jest.fn(),
    searchPurchaseRequests: jest.fn(),
    searchReceivingExpectations: jest.fn(),
    submitPurchaseRequest: jest.fn(),
    updatePurchaseOrderDraft: jest.fn(),
    updatePurchaseRequestDraft: jest.fn()
  }

  const controller = new ProcurementController(procurementService as any)

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('declares the expected permissions on procurement endpoints', () => {
    const reflector = new Reflector()

    expect(
      reflector.get(PERMISSION_CHECK_KEY, ProcurementController.prototype.searchPurchaseRequests)
    ).toEqual({
      type: 'ALL',
      permissions: ['procurement.purchase_request.list']
    })
    expect(
      reflector.get(PERMISSION_CHECK_KEY, ProcurementController.prototype.getPurchaseRequest)
    ).toEqual({
      type: 'ALL',
      permissions: ['procurement.purchase_request.get_by_id']
    })
    expect(
      reflector.get(PERMISSION_CHECK_KEY, ProcurementController.prototype.createPurchaseRequest)
    ).toEqual({
      type: 'ALL',
      permissions: ['procurement.purchase_request.create']
    })
    expect(
      reflector.get(
        PERMISSION_CHECK_KEY,
        ProcurementController.prototype.updatePurchaseRequestDraft
      )
    ).toEqual({
      type: 'ALL',
      permissions: ['procurement.purchase_request.update_draft']
    })
    expect(
      reflector.get(PERMISSION_CHECK_KEY, ProcurementController.prototype.submitPurchaseRequest)
    ).toEqual({
      type: 'ALL',
      permissions: ['procurement.purchase_request.submit']
    })
    expect(
      reflector.get(PERMISSION_CHECK_KEY, ProcurementController.prototype.decidePurchaseRequest)
    ).toEqual({
      type: 'ALL',
      permissions: ['procurement.purchase_request.decide']
    })
    expect(
      reflector.get(PERMISSION_CHECK_KEY, ProcurementController.prototype.cancelPurchaseRequest)
    ).toEqual({
      type: 'ALL',
      permissions: ['procurement.purchase_request.cancel']
    })
    expect(
      reflector.get(
        PERMISSION_CHECK_KEY,
        ProcurementController.prototype.convertPurchaseRequestToPurchaseOrder
      )
    ).toEqual({
      type: 'ALL',
      permissions: ['procurement.purchase_request.convert_to_order']
    })
    expect(
      reflector.get(PERMISSION_CHECK_KEY, ProcurementController.prototype.searchPurchaseOrders)
    ).toEqual({
      type: 'ALL',
      permissions: ['procurement.purchase_order.list']
    })
    expect(
      reflector.get(PERMISSION_CHECK_KEY, ProcurementController.prototype.getPurchaseOrder)
    ).toEqual({
      type: 'ALL',
      permissions: ['procurement.purchase_order.get_by_id']
    })
    expect(
      reflector.get(PERMISSION_CHECK_KEY, ProcurementController.prototype.createPurchaseOrderDraft)
    ).toEqual({
      type: 'ALL',
      permissions: ['procurement.purchase_order.create_draft']
    })
    expect(
      reflector.get(PERMISSION_CHECK_KEY, ProcurementController.prototype.updatePurchaseOrderDraft)
    ).toEqual({
      type: 'ALL',
      permissions: ['procurement.purchase_order.update_draft']
    })
    expect(
      reflector.get(PERMISSION_CHECK_KEY, ProcurementController.prototype.issuePurchaseOrder)
    ).toEqual({
      type: 'ALL',
      permissions: ['procurement.purchase_order.issue']
    })
    expect(
      reflector.get(
        PERMISSION_CHECK_KEY,
        ProcurementController.prototype.confirmSupplierAcknowledgement
      )
    ).toEqual({
      type: 'ALL',
      permissions: ['procurement.purchase_order.confirm_acknowledgement']
    })
    expect(
      reflector.get(PERMISSION_CHECK_KEY, ProcurementController.prototype.applyPurchaseOrderChange)
    ).toEqual({
      type: 'ALL',
      permissions: ['procurement.purchase_order.apply_change']
    })
    expect(
      reflector.get(PERMISSION_CHECK_KEY, ProcurementController.prototype.cancelPurchaseOrder)
    ).toEqual({
      type: 'ALL',
      permissions: ['procurement.purchase_order.cancel']
    })
    expect(
      reflector.get(PERMISSION_CHECK_KEY, ProcurementController.prototype.listPurchaseOrderChanges)
    ).toEqual({
      type: 'ALL',
      permissions: ['procurement.purchase_order_change.list']
    })
    expect(
      reflector.get(
        PERMISSION_CHECK_KEY,
        ProcurementController.prototype.searchReceivingExpectations
      )
    ).toEqual({
      type: 'ALL',
      permissions: ['procurement.receiving_expectation.list']
    })
    expect(
      reflector.get(
        PERMISSION_CHECK_KEY,
        ProcurementController.prototype.getReceivingExpectation
      )
    ).toEqual({
      type: 'ALL',
      permissions: ['procurement.receiving_expectation.get_by_id']
    })
    expect(
      reflector.get(
        PERMISSION_CHECK_KEY,
        ProcurementController.prototype.createReceivingExpectation
      )
    ).toEqual({
      type: 'ALL',
      permissions: ['procurement.receiving_expectation.create']
    })
    expect(
      reflector.get(
        PERMISSION_CHECK_KEY,
        ProcurementController.prototype.recordReceivingDiscrepancyResolution
      )
    ).toEqual({
      type: 'ALL',
      permissions: ['procurement.receiving_discrepancy.record_resolution']
    })
  })

  it('forwards the minimum procurement phase 1 BFF surface to the proxy service', async () => {
    const source = { requestId: 'req-1', traceId: 'trace-1' }

    procurementService.searchPurchaseRequests.mockResolvedValue({
      purchaseRequests: [],
      total: 0,
      page: 1,
      pageSize: 20
    })
    procurementService.getPurchaseRequest.mockResolvedValue({ purchaseRequestId: 'pr-1' })
    procurementService.createPurchaseRequest.mockResolvedValue({ purchaseRequestId: 'pr-1' })
    procurementService.updatePurchaseRequestDraft.mockResolvedValue({ purchaseRequestId: 'pr-1' })
    procurementService.submitPurchaseRequest.mockResolvedValue({ purchaseRequestId: 'pr-1' })
    procurementService.decidePurchaseRequest.mockResolvedValue({ purchaseRequestId: 'pr-1' })
    procurementService.cancelPurchaseRequest.mockResolvedValue({ purchaseRequestId: 'pr-1' })
    procurementService.convertPurchaseRequestToPurchaseOrder.mockResolvedValue({
      purchaseOrderId: 'po-1'
    })
    procurementService.searchPurchaseOrders.mockResolvedValue({
      purchaseOrders: [],
      total: 0,
      page: 1,
      pageSize: 20
    })
    procurementService.getPurchaseOrder.mockResolvedValue({ purchaseOrderId: 'po-1' })
    procurementService.createPurchaseOrderDraft.mockResolvedValue({ purchaseOrderId: 'po-1' })
    procurementService.updatePurchaseOrderDraft.mockResolvedValue({ purchaseOrderId: 'po-1' })
    procurementService.issuePurchaseOrder.mockResolvedValue({ purchaseOrderId: 'po-1' })
    procurementService.confirmSupplierAcknowledgement.mockResolvedValue({
      purchaseOrderId: 'po-1'
    })
    procurementService.applyPurchaseOrderChange.mockResolvedValue({
      purchaseOrder: { purchaseOrderId: 'po-1' },
      change: { purchaseOrderChangeId: 'change-1' }
    })
    procurementService.cancelPurchaseOrder.mockResolvedValue({ purchaseOrderId: 'po-1' })
    procurementService.listPurchaseOrderChanges.mockResolvedValue({
      changes: [],
      total: 0,
      page: 1,
      pageSize: 20
    })
    procurementService.searchReceivingExpectations.mockResolvedValue({
      receivingExpectations: [],
      total: 0,
      page: 1,
      pageSize: 20
    })
    procurementService.getReceivingExpectation.mockResolvedValue({
      receivingExpectationId: 're-1'
    })
    procurementService.createReceivingExpectation.mockResolvedValue({
      receivingExpectationId: 're-1'
    })
    procurementService.recordReceivingDiscrepancyResolution.mockResolvedValue({
      receivingExpectation: { receivingExpectationId: 're-1' },
      receivingDiscrepancy: { receivingDiscrepancyId: 'rd-1' }
    })

    await controller.searchPurchaseRequests(
      'tenant-1',
      {
        itemId: 'item-1',
        keyword: 'starter',
        page: 2,
        pageSize: 10,
        requestType: 'DEPARTMENTAL',
        status: 'DRAFT'
      } as any,
      source as any
    )
    await controller.getPurchaseRequest('tenant-1', 'pr-1', source as any)
    await controller.createPurchaseRequest(
      'tenant-1',
      {
        lines: [],
        requestType: 'DEPARTMENTAL',
        title: 'Starter PR'
      } as any,
      source as any
    )
    await controller.updatePurchaseRequestDraft(
      'tenant-1',
      'pr-1',
      { lines: [], title: 'Starter PR Rev' } as any,
      source as any
    )
    await controller.submitPurchaseRequest(
      'tenant-1',
      'pr-1',
      { auditReason: 'submit from tenant-web', submissionComment: 'send it' } as any,
      source as any
    )
    await controller.decidePurchaseRequest(
      'tenant-1',
      'pr-1',
      { approvalReference: 'approval-1', auditReason: 'decide', decision: 'APPROVED' } as any,
      source as any
    )
    await controller.cancelPurchaseRequest(
      'tenant-1',
      'pr-1',
      { auditReason: 'cancel', cancelReason: 'no longer needed' } as any,
      source as any
    )
    await controller.convertPurchaseRequestToPurchaseOrder(
      'tenant-1',
      'pr-1',
      {
        auditReason: 'convert',
        currencyCode: 'USD',
        selectedLines: [],
        supplierId: 'supplier-1'
      } as any,
      source as any
    )
    await controller.searchPurchaseOrders(
      'tenant-1',
      { keyword: 'PO-001', page: 3, pageSize: 5, status: 'ISSUED' } as any,
      source as any
    )
    await controller.getPurchaseOrder('tenant-1', 'po-1', source as any)
    await controller.createPurchaseOrderDraft(
      'tenant-1',
      { currencyCode: 'USD', lines: [], supplierId: 'supplier-1' } as any,
      source as any
    )
    await controller.updatePurchaseOrderDraft(
      'tenant-1',
      'po-1',
      { currencyCode: 'USD', lines: [], supplierId: 'supplier-1' } as any,
      source as any
    )
    await controller.issuePurchaseOrder(
      'tenant-1',
      'po-1',
      { auditReason: 'issue', issueComment: 'email supplier' } as any,
      source as any
    )
    await controller.confirmSupplierAcknowledgement(
      'tenant-1',
      'po-1',
      { acknowledgedAt: '2026-04-28T09:00:00.000Z', auditReason: 'ack' } as any,
      source as any
    )
    await controller.applyPurchaseOrderChange(
      'tenant-1',
      'po-1',
      {
        auditReason: 'change',
        changeReason: 'qty increase',
        changeType: 'QUANTITY_UPDATE',
        targetState: { lines: [] }
      } as any,
      source as any
    )
    await controller.cancelPurchaseOrder(
      'tenant-1',
      'po-1',
      { auditReason: 'cancel', cancelReason: 'supplier unavailable' } as any,
      source as any
    )
    await controller.listPurchaseOrderChanges(
      'tenant-1',
      'po-1',
      { page: 2, pageSize: 50 } as any,
      source as any
    )
    await controller.searchReceivingExpectations(
      'tenant-1',
      { hasOpenDiscrepancy: true, page: 2, pageSize: 25 } as any,
      source as any
    )
    await controller.getReceivingExpectation('tenant-1', 're-1', source as any)
    await controller.createReceivingExpectation(
      'tenant-1',
      {
        expectedQuantity: '10',
        purchaseOrderId: 'po-1',
        purchaseOrderLineId: 'line-1'
      } as any,
      source as any
    )
    await controller.recordReceivingDiscrepancyResolution(
      'tenant-1',
      're-1',
      'rd-1',
      {
        auditReason: 'resolve',
        resolutionCode: 'WAIT_REDELIVERY',
        resolutionNote: 'supplier promised resend'
      } as any,
      source as any
    )

    expect(procurementService.searchPurchaseRequests).toHaveBeenCalled()
    expect(procurementService.getPurchaseRequest).toHaveBeenCalledWith('tenant-1', 'pr-1', source)
    expect(procurementService.getPurchaseOrder).toHaveBeenCalledWith('tenant-1', 'po-1', source)
    expect(procurementService.listPurchaseOrderChanges).toHaveBeenCalledWith(
      'tenant-1',
      'po-1',
      { page: 2, pageSize: 50 },
      source
    )
    expect(procurementService.recordReceivingDiscrepancyResolution).toHaveBeenCalledWith(
      'tenant-1',
      're-1',
      'rd-1',
      {
        auditReason: 'resolve',
        resolutionCode: 'WAIT_REDELIVERY',
        resolutionNote: 'supplier promised resend'
      },
      source
    )
  })
})
