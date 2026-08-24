import { Metadata } from '@grpc/grpc-js'
import { of } from 'rxjs'
import { VerifiedTenantTarget } from '../../../common/tenant-target'
import { TenantOrgManagementGrpcAdapter } from './tenant-org-management-grpc.adapter'
import { TenantOrgQueryGrpcAdapter } from './tenant-org-query-grpc.adapter'

/** Tenant Org target serialization tests prove the private Gateway target stays the exact RPC selector. */
describe('Tenant Org verified target serialization', () => {
  const target = 'Tenant-A:01' as VerifiedTenantTarget
  const source = {
    requestId: 'request-1',
    traceparent: '00-11111111111111111111111111111111-2222222222222222-01',
    user: { aid: 'account-1', scopeLevel: 'SYSTEM' }
  }

  it('serializes the exact verified target into a dedicated Tenant Org query selector only', async () => {
    const metadata = new Metadata()
    const service = {
      getTenantById: jest.fn(() => of({ tenant: { id: target, name: 'Target Tenant' } }))
    }
    const trusted = { forBusinessCall: jest.fn(async () => metadata) }
    const adapter = new TenantOrgQueryGrpcAdapter(
      { getClient: () => ({ getService: () => service }) } as never,
      trusted as never
    )
    adapter.onModuleInit()

    await expect(adapter.getTenantById(target, source)).resolves.toMatchObject({
      tenant: { id: target, name: 'Target Tenant' }
    })
    expect(service.getTenantById).toHaveBeenCalledWith({ tenantId: target }, metadata)
    expect(trusted.forBusinessCall).toHaveBeenCalledWith(
      source,
      'urn:oes:service:tenant-org-service',
      ['tenant_org.tenant.get_by_id']
    )
  })

  it('serializes the exact verified target into a dedicated Tenant Org mutation selector only', async () => {
    const metadata = new Metadata()
    const service = {
      updateTenantProfile: jest.fn(() =>
        of({ tenant: { id: target, code: 'target-a', name: 'Target Tenant' } })
      )
    }
    const trusted = { forBusinessCall: jest.fn(async () => metadata) }
    const adapter = new TenantOrgManagementGrpcAdapter(
      { getClient: () => ({ getService: () => service }) } as never,
      trusted as never
    )
    adapter.onModuleInit()

    await expect(
      adapter.updateTenantProfile({ tenantId: target, name: 'Target Tenant' }, source)
    ).resolves.toMatchObject({ tenant: { id: target, name: 'Target Tenant' } })
    expect(service.updateTenantProfile).toHaveBeenCalledWith(
      { tenantId: target, name: 'Target Tenant' },
      metadata
    )
    expect(trusted.forBusinessCall).toHaveBeenCalledWith(
      source,
      'urn:oes:service:tenant-org-service',
      ['tenant_org.tenant.update_profile']
    )
  })
})
