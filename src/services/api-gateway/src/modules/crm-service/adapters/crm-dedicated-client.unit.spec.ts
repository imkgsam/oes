import { Metadata } from '@grpc/grpc-js'
import { of } from 'rxjs'
import { CustomerManagementGrpcAdapter } from './customer-management-grpc.adapter'
import { CustomerQueryGrpcAdapter } from './customer-query-grpc.adapter'

const source = {
  requestId: 'request-1',
  traceparent: '00-11111111111111111111111111111111-2222222222222222-01',
  user: {
    holderId: 'human-1',
    tenantId: 'tenant-1',
    sid: 'session-1',
    terminal: 'WEB',
    permissions: ['crm.account.manage']
  }
} as never

/** Verifies all 14 Gateway CRM RPCs use one dedicated channel and exact BUSINESS Codes. */
describe('Gateway CRM dedicated adapters', () => {
  it('binds all four queries to account.read and sends no body authority', async () => {
    const query = service([
      'listCrmAccounts',
      'getCrmAccount',
      'listSourceRecords',
      'checkLeadDuplicate'
    ])
    const producer = metadataProducer()
    const adapter = new CustomerQueryGrpcAdapter(
      { customerQuery: () => query } as never,
      producer as never
    )
    adapter.onModuleInit()
    await adapter.listCrmAccounts(local({}), source)
    await adapter.getCrmAccount(local({ crmAccountId: 'crm-1' }), source)
    await adapter.listSourceRecords(local({ crmAccountId: 'crm-1' }), source)
    await adapter.checkLeadDuplicate(local({ displayName: 'Serrano' }), source)

    expect(metadataCodes(producer)).toEqual(Array(4).fill('crm.account.read'))
    assertAuthorityFree(wireRequests(query))
  })

  it('binds all ten commands to the frozen Code map and strips authority decisions', async () => {
    const management = service([
      'createDraftLead',
      'updateDraftLead',
      'submitDraftLead',
      'deleteDraftLead',
      'createLead',
      'claimCrmAccount',
      'releaseCrmAccount',
      'archiveCrmAccount',
      'updateCrmAccountIdentifiers',
      'convertLeadToProspectCustomer'
    ])
    const producer = metadataProducer()
    const adapter = new CustomerManagementGrpcAdapter(
      { customerManagement: () => management } as never,
      producer as never
    )
    adapter.onModuleInit()
    const injected = local({
      tenantId: 'spoofed',
      operatorContext: {},
      traceContext: {},
      auditContext: {},
      ownerAccountId: 'attacker',
      claimForCurrentUser: true,
      allowOwnerlessConversion: true
    })
    await adapter.createDraftLead(injected, source)
    await adapter.updateDraftLead(injected, source)
    await adapter.submitDraftLead(injected, source)
    await adapter.deleteDraftLead(injected, source)
    await adapter.createLead(injected, source)
    await adapter.claimCrmAccount(injected, source)
    await adapter.releaseCrmAccount(injected, source)
    await adapter.archiveCrmAccount(injected, source)
    await adapter.updateCrmAccountIdentifiers(injected, source)
    await adapter.convertLeadToProspectCustomer(injected, source)

    expect(metadataCodes(producer)).toEqual([
      'crm.account.create',
      'crm.account.update',
      'crm.account.update',
      'crm.account.update',
      'crm.account.create',
      'crm.account.claim',
      'crm.account.release',
      'crm.account.manage',
      'crm.account.update',
      'crm.account.convert'
    ])
    expect(producer.forBusinessCall.mock.calls.at(-1)?.[2]).toEqual([
      'crm.account.convert',
      'crm.account.manage'
    ])
    const requests = wireRequests(management)
    assertAuthorityFree(requests)
    for (const request of requests) {
      expect(request).not.toHaveProperty('ownerAccountId')
      expect(request).not.toHaveProperty('owner_account_id')
    }
  })
})

/** Creates one generated-client-shaped set of successful Observable methods. */
function service(methods: readonly string[]): Record<string, jest.Mock> {
  return Object.fromEntries(methods.map((method) => [method, jest.fn(() => of({}))]))
}

/** Creates one metadata producer that records audience and requested Codes. */
function metadataProducer() {
  return { forBusinessCall: jest.fn().mockResolvedValue(new Metadata()) }
}

/** Builds a local request fixture that includes fields forbidden on the wire. */
function local<T extends object>(input: T): T & Record<string, unknown> {
  return { ...input, tenant_id: 'spoofed', audit_context: {}, auditReason: 'caller hint' }
}

/** Returns the first Code requested for each trusted call. */
function metadataCodes(producer: ReturnType<typeof metadataProducer>): string[] {
  return producer.forBusinessCall.mock.calls.map((call) => call[2][0])
}

/** Collects every serialized request passed to fake generated methods. */
function wireRequests(...services: Array<Record<string, jest.Mock>>): object[] {
  return services.flatMap((service) =>
    Object.values(service).flatMap((method) => method.mock.calls.map((call) => call[0]))
  )
}

/** Proves all retired authority carrier spellings are absent on the CRM wire. */
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
      'auditReason',
      'claimForCurrentUser',
      'claim_for_current_user',
      'allowOwnerlessConversion',
      'allow_ownerless_conversion'
    ]) {
      expect(request).not.toHaveProperty(field)
    }
  }
}
