import { Metadata } from '@grpc/grpc-js'
import { of } from 'rxjs'
import { WmsManagementGrpcAdapter } from './wms-management-grpc.adapter'
import { WmsQueryGrpcAdapter } from './wms-query-grpc.adapter'

const source = {
  requestId: 'request-1',
  traceparent: '00-11111111111111111111111111111111-2222222222222222-01',
  user: { holderId: 'human-1', tenantId: 'tenant-1', sid: 'session-1', terminal: 'WEB' }
} as never

/** Verifies all 15 Gateway WMS RPCs use the dedicated channel and five exact BUSINESS Codes. */
describe('Gateway WMS dedicated adapters', () => {
  it('binds all eleven query methods and sends no body authority', async () => {
    const warehouse = service(['getWarehouse', 'listWarehouses', 'getLocation', 'listLocations'])
    const receipt = service([
      'getReceipt',
      'searchReceipts',
      'getReceiptLine',
      'searchReceiptLines'
    ])
    const inventory = service([
      'searchStockLedgerEntries',
      'getInventoryBalance',
      'searchInventoryBalances'
    ])
    const producer = metadataProducer()
    const adapter = new WmsQueryGrpcAdapter(
      {
        warehouseQuery: () => warehouse,
        receiptQuery: () => receipt,
        inventoryQuery: () => inventory
      } as never,
      producer as never
    )
    adapter.onModuleInit()
    await adapter.getWarehouse(local({ warehouseId: 'w-1' }), source)
    await adapter.listWarehouses(local({}), source)
    await adapter.getLocation(local({ locationId: 'l-1' }), source)
    await adapter.listLocations(local({}), source)
    await adapter.getReceipt(local({ receiptId: 'r-1' }), source)
    await adapter.searchReceipts(local({}), source)
    await adapter.getReceiptLine(local({ receiptLineId: 'rl-1' }), source)
    await adapter.searchReceiptLines(local({}), source)
    await adapter.searchStockLedgerEntries(local({}), source)
    await adapter.getInventoryBalance(local({ warehouseId: 'w-1', itemId: 'i-1' }), source)
    await adapter.searchInventoryBalances(local({}), source)

    expect(metadataCodes(producer)).toEqual([
      'wms.warehouse.read',
      'wms.warehouse.read',
      'wms.location.read',
      'wms.location.read',
      'wms.receipt.read',
      'wms.receipt.read',
      'wms.receipt.read',
      'wms.receipt.read',
      'wms.inventory.read',
      'wms.inventory.read',
      'wms.inventory.read'
    ])
    assertAuthorityFree(wireRequests(warehouse, receipt, inventory))
  })

  it('binds all four commands to receipt.manage and strips every local authority carrier', async () => {
    const receipt = service([
      'createReceiptDraft',
      'addOrReplaceReceiptLines',
      'postReceipt',
      'cancelReceiptDraft'
    ])
    const producer = metadataProducer()
    const adapter = new WmsManagementGrpcAdapter(
      { receiptManagement: () => receipt } as never,
      producer as never
    )
    adapter.onModuleInit()
    const injected = local({
      tenantId: 'spoofed',
      orgId: 'spoofed',
      operatorContext: {},
      traceContext: {},
      auditContext: {},
      auditReason: 'caller hint'
    })
    await adapter.createReceiptDraft(injected, source)
    await adapter.addOrReplaceReceiptLines(injected, source)
    await adapter.postReceipt(injected, source)
    await adapter.cancelReceiptDraft(injected, source)
    expect(metadataCodes(producer)).toEqual(Array(4).fill('wms.receipt.manage'))
    assertAuthorityFree(wireRequests(receipt))
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

/** Builds a local request fixture that may include fields forbidden on the wire. */
function local<T extends object>(input: T): T & Record<string, unknown> {
  return { ...input, tenant_id: 'spoofed', audit_context: {} }
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

/** Proves retired camelCase and snake_case authority never crosses the dedicated boundary. */
function assertAuthorityFree(requests: object[]): void {
  for (const request of requests) {
    for (const field of [
      'tenantId',
      'tenant_id',
      'orgId',
      'org_id',
      'operatorContext',
      'operator_context',
      'traceContext',
      'trace_context',
      'auditContext',
      'audit_context',
      'auditReason'
    ])
      expect(request).not.toHaveProperty(field)
  }
}
