import { Metadata } from '@grpc/grpc-js'
import { of } from 'rxjs'
import { ProcurementManagementGrpcAdapter } from './procurement-management-grpc.adapter'
import { ProcurementQueryGrpcAdapter } from './procurement-query-grpc.adapter'

const source = {
  requestId: 'request-1',
  traceparent: '00-11111111111111111111111111111111-2222222222222222-01',
  user: {
    holderId: 'human-1',
    tenantId: 'tenant-1',
    sid: 'session-1',
    terminal: 'WEB'
  }
} as never

/** Verifies all 21 Gateway Procurement RPCs use the dedicated channel and exact BUSINESS Code. */
describe('Gateway Procurement dedicated adapters', () => {
  it('binds all seven query methods and sends no body authority', async () => {
    const requestQuery = service(['getPurchaseRequest', 'searchPurchaseRequests'])
    const orderQuery = service([
      'getPurchaseOrder',
      'searchPurchaseOrders',
      'listPurchaseOrderChanges'
    ])
    const receivingQuery = service(['getReceivingExpectation', 'searchReceivingExpectations'])
    const producer = metadataProducer()
    const adapter = new ProcurementQueryGrpcAdapter(
      {
        purchaseRequestQuery: () => requestQuery,
        purchaseOrderQuery: () => orderQuery,
        receivingExpectationQuery: () => receivingQuery
      } as never,
      producer as never
    )
    adapter.onModuleInit()

    await adapter.getPurchaseRequest(local({ purchaseRequestId: 'pr-1' }), source)
    await adapter.searchPurchaseRequests(local({}), source)
    await adapter.getPurchaseOrder(local({ purchaseOrderId: 'po-1' }), source)
    await adapter.searchPurchaseOrders(local({}), source)
    await adapter.listPurchaseOrderChanges(local({ purchaseOrderId: 'po-1' }), source)
    await adapter.getReceivingExpectation(local({ receivingExpectationId: 're-1' }), source)
    await adapter.searchReceivingExpectations(local({}), source)

    expect(metadataCodes(producer)).toEqual([
      'procurement.purchase_request.get_by_id',
      'procurement.purchase_request.list',
      'procurement.purchase_order.get_by_id',
      'procurement.purchase_order.list',
      'procurement.purchase_order_change.list',
      'procurement.receiving_expectation.get_by_id',
      'procurement.receiving_expectation.list'
    ])
    expect(wireRequests(requestQuery, orderQuery, receivingQuery)).not.toContainEqual(
      expect.objectContaining({ tenantId: expect.anything() })
    )
  })

  it('binds all 14 command methods and strips tenant/org/audit authority', async () => {
    const requestManagement = service([
      'createPurchaseRequest',
      'updatePurchaseRequestDraft',
      'submitPurchaseRequest',
      'decidePurchaseRequest',
      'cancelPurchaseRequest',
      'convertPurchaseRequestToPurchaseOrder'
    ])
    const orderManagement = service([
      'createPurchaseOrderDraft',
      'updatePurchaseOrderDraft',
      'issuePurchaseOrder',
      'confirmSupplierAcknowledgement',
      'applyPurchaseOrderChange',
      'cancelPurchaseOrder'
    ])
    const receivingManagement = service([
      'createReceivingExpectation',
      'recordReceivingDiscrepancyResolution'
    ])
    const producer = metadataProducer()
    const adapter = new ProcurementManagementGrpcAdapter(
      {
        purchaseRequestManagement: () => requestManagement,
        purchaseOrderManagement: () => orderManagement,
        receivingExpectationManagement: () => receivingManagement
      } as never,
      producer as never
    )
    adapter.onModuleInit()

    await adapter.createPurchaseRequest({ ...local({}), auditReason: 'local test hint' }, source)
    await adapter.updatePurchaseRequestDraft(local({}), source)
    await adapter.submitPurchaseRequest(local({}), source)
    await adapter.decidePurchaseRequest(local({}), source)
    await adapter.cancelPurchaseRequest(local({}), source)
    await adapter.convertPurchaseRequestToPurchaseOrder(local({}), source)
    await adapter.createPurchaseOrderDraft(local({}), source)
    await adapter.updatePurchaseOrderDraft(local({}), source)
    await adapter.issuePurchaseOrder(local({}), source)
    await adapter.confirmSupplierAcknowledgement(local({}), source)
    await adapter.applyPurchaseOrderChange(local({}), source)
    await adapter.cancelPurchaseOrder(local({}), source)
    await adapter.createReceivingExpectation(local({}), source)
    await adapter.recordReceivingDiscrepancyResolution(local({}), source)

    expect(metadataCodes(producer)).toEqual([
      'procurement.purchase_request.create',
      'procurement.purchase_request.update_draft',
      'procurement.purchase_request.submit',
      'procurement.purchase_request.decide',
      'procurement.purchase_request.cancel',
      'procurement.purchase_request.convert_to_order',
      'procurement.purchase_order.create_draft',
      'procurement.purchase_order.update_draft',
      'procurement.purchase_order.issue',
      'procurement.purchase_order.confirm_acknowledgement',
      'procurement.purchase_order.apply_change',
      'procurement.purchase_order.cancel',
      'procurement.receiving_expectation.create',
      'procurement.receiving_discrepancy.record_resolution'
    ])
    for (const request of wireRequests(requestManagement, orderManagement, receivingManagement)) {
      expect(request).not.toHaveProperty('tenantId')
      expect(request).not.toHaveProperty('orgId')
      expect(request).not.toHaveProperty('auditReason')
      expect(request).not.toHaveProperty('operatorContext')
      expect(request).not.toHaveProperty('traceContext')
      expect(request).not.toHaveProperty('auditContext')
    }
  })
})

/** Creates one generated-client-shaped set of successful Observable methods. */
function service(methods: readonly string[]): Record<string, jest.Mock> {
  return Object.fromEntries(methods.map((method) => [method, jest.fn(() => of({}))]))
}

/** Creates one metadata producer that records the audience and exact Code. */
function metadataProducer() {
  return { forBusinessCall: jest.fn().mockResolvedValue(new Metadata()) }
}

/** Builds one generated request fixture without any authority fields. */
function local<T extends object>(input: T): T {
  return { ...input }
}

/** Returns exact Code arguments recorded by the trusted producer. */
function metadataCodes(producer: ReturnType<typeof metadataProducer>): string[] {
  return producer.forBusinessCall.mock.calls.map((call) => call[2][0])
}

/** Collects the first serialized request argument from every fake service method. */
function wireRequests(...services: Array<Record<string, jest.Mock>>): object[] {
  return services.flatMap((service) =>
    Object.values(service).flatMap((method) => method.mock.calls.map((call) => call[0]))
  )
}
