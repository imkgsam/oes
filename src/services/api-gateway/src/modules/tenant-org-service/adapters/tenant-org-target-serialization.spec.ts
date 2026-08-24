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
      getOrgTreeByTenantId: jest.fn(() => of({ roots: [] })),
      getOrgUnitById: jest.fn(() => of({ orgUnit: { id: 'org-1', tenantId: target } })),
      getTenantById: jest.fn(() => of({ tenant: { id: target, name: 'Target Tenant' } }))
    }
    const trusted = { forBusinessCall: jest.fn(async () => metadata) }
    const adapter = new TenantOrgQueryGrpcAdapter(
      { getClient: () => ({ getService: () => service }) } as never,
      trusted as never
    )
    adapter.onModuleInit()

    await expect(adapter.getTenantByVerifiedTarget(target, source)).resolves.toMatchObject({
      tenant: { id: target, name: 'Target Tenant' }
    })
    await expect(adapter.getOrgTreeByTenantId(target, source)).resolves.toEqual({ roots: [] })
    await expect(
      adapter.getOrgUnitByVerifiedTarget({ tenantId: target, orgUnitId: 'org-1' }, source)
    ).resolves.toMatchObject({ orgUnit: { id: 'org-1', tenantId: target } })
    expect(service.getTenantById).toHaveBeenCalledWith({ tenantId: target }, metadata)
    expect(service.getOrgTreeByTenantId).toHaveBeenCalledWith({ tenantId: target }, metadata)
    expect(service.getOrgUnitById).toHaveBeenCalledWith(
      { tenantId: target, orgUnitId: 'org-1' },
      metadata
    )
    expect(trusted.forBusinessCall.mock.calls).toEqual([
      [source, 'urn:oes:service:tenant-org-service', ['tenant_org.tenant.get_by_id']],
      [source, 'urn:oes:service:tenant-org-service', ['tenant_org.org_unit.list_tree']],
      [source, 'urn:oes:service:tenant-org-service', ['tenant_org.org_unit.get_by_id']]
    ])
  })

  it('serializes the exact verified target into a dedicated Tenant Org mutation selector only', async () => {
    const metadata = new Metadata()
    const service = {
      archiveOrgUnit: jest.fn(() => of({ orgUnit: { id: 'org-1', tenantId: target } })),
      createOrgUnit: jest.fn(() => of({ orgUnit: { id: 'org-1', tenantId: target } })),
      moveOrgUnit: jest.fn(() => of({ orgUnit: { id: 'org-1', tenantId: target } })),
      updateTenantProfile: jest.fn(() =>
        of({ tenant: { id: target, code: 'target-a', name: 'Target Tenant' } })
      ),
      updateOrgUnit: jest.fn(() => of({ orgUnit: { id: 'org-1', tenantId: target } }))
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
    await adapter.createOrgUnit(
      { tenantId: target, parentOrgId: 'root-1', name: 'Org', type: 'DEPARTMENT' },
      source
    )
    await adapter.updateOrgUnit(
      { tenantId: target, orgUnitId: 'org-1', name: 'Org Updated' },
      source
    )
    await adapter.moveOrgUnit(
      { tenantId: target, orgUnitId: 'org-1', newParentOrgId: 'root-2' },
      source
    )
    await adapter.archiveOrgUnit({ tenantId: target, orgUnitId: 'org-1' }, source)
    expect(service.updateTenantProfile).toHaveBeenCalledWith(
      { tenantId: target, name: 'Target Tenant' },
      metadata
    )
    expect(service.createOrgUnit).toHaveBeenCalledWith(
      { tenantId: target, parentOrgId: 'root-1', name: 'Org', type: 'DEPARTMENT' },
      metadata
    )
    expect(service.updateOrgUnit).toHaveBeenCalledWith(
      { tenantId: target, orgUnitId: 'org-1', name: 'Org Updated' },
      metadata
    )
    expect(service.moveOrgUnit).toHaveBeenCalledWith(
      { tenantId: target, orgUnitId: 'org-1', newParentOrgId: 'root-2' },
      metadata
    )
    expect(service.archiveOrgUnit).toHaveBeenCalledWith(
      { tenantId: target, orgUnitId: 'org-1' },
      metadata
    )
    expect(trusted.forBusinessCall.mock.calls).toEqual([
      [source, 'urn:oes:service:tenant-org-service', ['tenant_org.tenant.update_profile']],
      [source, 'urn:oes:service:tenant-org-service', ['tenant_org.org_unit.create']],
      [source, 'urn:oes:service:tenant-org-service', ['tenant_org.org_unit.update']],
      [source, 'urn:oes:service:tenant-org-service', ['tenant_org.org_unit.update']],
      [source, 'urn:oes:service:tenant-org-service', ['tenant_org.org_unit.archive']]
    ])
  })
})
