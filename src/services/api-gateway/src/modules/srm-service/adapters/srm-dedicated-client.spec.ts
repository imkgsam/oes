import { Metadata } from '@grpc/grpc-js'
import { of } from 'rxjs'
import { SupplierManagementGrpcAdapter } from './supplier-management-grpc.adapter'
import { SupplierQueryGrpcAdapter } from './supplier-query-grpc.adapter'

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

/** Verifies every Gateway SRM RPC uses the dedicated client and its exact BUSINESS Code. */
describe('Gateway SRM dedicated adapters', () => {
  it('binds all six query methods to the SRM audience and exact query Codes', async () => {
    const query = service([
      'getSupplier',
      'searchSuppliers',
      'listSupplierContacts',
      'listSupplierAddresses',
      'listSupplierOfferingsBySupplier',
      'listSupplierOfferingsByItem'
    ])
    const producer = metadataProducer()
    const adapter = new SupplierQueryGrpcAdapter({ query: () => query } as never, producer as never)
    adapter.onModuleInit()

    await adapter.getSupplier({ supplierId: 'supplier-1' }, source)
    await adapter.searchSuppliers({}, source)
    await adapter.listSupplierContacts({ supplierId: 'supplier-1' }, source)
    await adapter.listSupplierAddresses({ supplierId: 'supplier-1' }, source)
    await adapter.listSupplierOfferingsBySupplier({ supplierId: 'supplier-1' }, source)
    await adapter.listSupplierOfferingsByItem({ itemId: 'item-1' }, source)

    expect(metadataCodes(producer)).toEqual([
      'srm.supplier_profile.get_by_id',
      'srm.supplier_profile.list',
      'srm.supplier_profile.get_by_id',
      'srm.supplier_profile.get_by_id',
      'srm.supplier_offering.list_by_supplier',
      'srm.supplier_offering.list_by_item'
    ])
    expect(
      Object.values(query).every(
        (method) => (method as jest.Mock).mock.calls[0][0].tenantId === undefined
      )
    ).toBe(true)
  })

  it('binds all seven command methods to the SRM audience and exact command Codes', async () => {
    const management = service([
      'createSupplierProfile',
      'updateSupplierProfileBasics',
      'bindSupplierToTenantParty',
      'upsertSupplierContact',
      'upsertSupplierAddress',
      'upsertSupplierOffering',
      'changeSupplierStatus'
    ])
    const producer = metadataProducer()
    const adapter = new SupplierManagementGrpcAdapter(
      { management: () => management } as never,
      producer as never
    )
    adapter.onModuleInit()

    await adapter.createSupplierProfile({ displayName: 'Supplier' }, source)
    await adapter.updateSupplierProfileBasics({ supplierId: 'supplier-1' }, source)
    await adapter.bindSupplierToTenantParty(
      { supplierId: 'supplier-1', tenantPartyId: 'party-1' },
      source
    )
    await adapter.upsertSupplierContact(
      { supplierId: 'supplier-1', displayName: 'Contact' },
      source
    )
    await adapter.upsertSupplierAddress(
      {
        supplierId: 'supplier-1',
        label: 'Main',
        countryCode: 'CN',
        addressLine1: 'Address'
      },
      source
    )
    await adapter.upsertSupplierOffering(
      { supplierId: 'supplier-1', itemId: 'item-1', targetStatus: 1 },
      source
    )
    await adapter.changeSupplierStatus({ supplierId: 'supplier-1', targetStatus: 1 }, source)

    expect(metadataCodes(producer)).toEqual([
      'srm.supplier_profile.create',
      'srm.supplier_profile.update_basics',
      'srm.supplier_profile.bind_tenant_party',
      'srm.supplier_contact.upsert',
      'srm.supplier_address.upsert',
      'srm.supplier_offering.upsert',
      'srm.supplier_profile.change_status'
    ])
    expect(
      Object.values(management).every(
        (method) => (method as jest.Mock).mock.calls[0][0].tenantId === undefined
      )
    ).toBe(true)
  })
})

/** Creates one generated-client-shaped set of successful Observable methods. */
function service(methods: readonly string[]): Record<string, jest.Mock> {
  return Object.fromEntries(methods.map((method) => [method, jest.fn(() => of({}))]))
}

/** Creates one producer spy that returns real empty gRPC metadata. */
function metadataProducer() {
  return {
    forBusinessCall: jest.fn(
      async (_source: unknown, _audience: string, _codes: readonly string[]) => new Metadata()
    )
  }
}

/** Extracts exact permission Code arguments while asserting the target audience for every call. */
function metadataCodes(producer: ReturnType<typeof metadataProducer>): string[] {
  expect(
    producer.forBusinessCall.mock.calls.every((call) => call[1] === 'urn:oes:service:srm-service')
  ).toBe(true)
  return producer.forBusinessCall.mock.calls.map((call) => call[2][0] ?? '')
}
