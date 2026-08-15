import { Metadata } from '@grpc/grpc-js'
import { ClientGrpc } from '@nestjs/microservices'
import { TENANT_ORG_QUERY_SERVICE_NAME } from '@oes/common/generated/tenant_org_service'
import { of } from 'rxjs'
import { TenantOrgGrpcAdapter } from '../../src/infrastructure/adapters/tenant-org-grpc.adapter'

describe('TenantOrgGrpcAdapter', () => {
  it('forwards target-bound execution metadata when validating HR org references', async () => {
    const metadata = new Metadata()
    const validateOrgReference = jest.fn().mockReturnValue(
      of({
        result: {
          valid: true,
          rejectionReason: ''
        }
      })
    )
    const client = {
      getService: jest.fn().mockReturnValue({
        validateOrgReference
      })
    } as unknown as ClientGrpc
    const adapter = new TenantOrgGrpcAdapter(client)
    const forBusinessCall = jest.fn().mockResolvedValue(metadata)
    ;(adapter as any).trusted = { forBusinessCall }

    adapter.onModuleInit()

    await expect(
      adapter.validateOrgReference({
        tenantId: 'tenant-1',
        orgUnitId: 'org-1'
      })
    ).resolves.toEqual({
      valid: true,
      rejectionReason: undefined
    })

    expect((client.getService as jest.Mock).mock.calls[0][0]).toBe(TENANT_ORG_QUERY_SERVICE_NAME)
    expect(validateOrgReference).toHaveBeenCalledWith(
      {
        tenantId: 'tenant-1',
        orgUnitId: 'org-1'
      },
      metadata
    )
    expect(forBusinessCall).toHaveBeenCalledWith('tenant-org-service', [
      'tenant_org.org_unit.list_tree'
    ])
  })
})
