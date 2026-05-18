import { Metadata } from '@grpc/grpc-js'
import { ClientGrpc } from '@nestjs/microservices'
import { GrpcMetadataPropagationFactory } from '@oes/common/authorization'
import { TENANT_ORG_QUERY_SERVICE_NAME } from '@oes/common/generated/tenant_org_service'
import { of } from 'rxjs'
import { TenantOrgGrpcAdapter } from '../../src/infrastructure/adapters/tenant-org-grpc.adapter'

/** createMetadataFactoryMock captures the metadata branch used by the tenant-org adapter. */
function createMetadataFactoryMock(metadata: Metadata) {
  return {
    createInternalCallMetadata: jest.fn().mockReturnValue(metadata),
    createOperatorScopedMetadata: jest.fn().mockReturnValue(metadata)
  } as unknown as GrpcMetadataPropagationFactory & {
    createInternalCallMetadata: jest.Mock
    createOperatorScopedMetadata: jest.Mock
  }
}

describe('TenantOrgGrpcAdapter', () => {
  it('forwards operator-scoped internal metadata when validating HR org references', async () => {
    const metadata = new Metadata()
    const metadataFactory = createMetadataFactoryMock(metadata)
    const requestContextStore = {
      getContext: jest.fn().mockReturnValue({
        requestId: 'request-1',
        traceId: 'trace-1',
        operatorContext: {
          operator_id: 'operator-1',
          operator_type: 'HUMAN',
          tenant_id: 'tenant-1',
          org_id: 'org-root-1',
          operator_roles: ['hr.admin']
        }
      })
    }
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
    const adapter = new TenantOrgGrpcAdapter(client, metadataFactory, requestContextStore as any)

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
    expect(metadataFactory.createOperatorScopedMetadata).toHaveBeenCalledWith({
      callerServiceName: 'hr-service',
      requestId: 'request-1',
      traceId: 'trace-1',
      operatorContext: {
        operatorId: 'operator-1',
        operatorType: 'HUMAN',
        tenantId: 'tenant-1',
        orgId: 'org-root-1',
        operatorRoles: ['hr.admin']
      }
    })
    expect(metadataFactory.createInternalCallMetadata).not.toHaveBeenCalled()
  })
})
