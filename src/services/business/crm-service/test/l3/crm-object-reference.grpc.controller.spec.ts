import { ValidateCrmObjectReferenceQuery } from '../../src/application/queries/validate-object-reference.query'
import { CrmObjectReferenceGrpcController } from '../../src/interfaces/grpc/crm-object-reference.grpc.controller'
import { CrmObjectLifecycle, CrmObjectReferenceCapability } from '@oes/common/generated/crm_service'
import { attachVerifiedExecution } from '@oes/common/authorization'

const queryContext = trustedContext()

/** Builds the request-private HUMAN_OBO context normally attached by CRM's internal guard. */
function trustedContext(): Record<string, unknown> {
  const body = {}
  const authenticated = attachVerifiedExecution(body, {
    verifiedExecutionToken: {
      subject: 'operator-1',
      principalType: 'HUMAN',
      tenantId: 'tenant-1',
      orgId: 'org-1',
      permissionCodes: ['crm.internal.object_reference.validate'],
      tokenId: 'token-1'
    } as never,
    verifiedWorkloadIdentity: {
      spiffeId: 'spiffe://oes/collaboration-service',
      certificateThumbprint: 'A'.repeat(43)
    }
  })
  Object.assign(authenticated as object, { requestId: 'request-1', traceId: 'trace-1' })
  return body
}

function createController(result: unknown) {
  const queryBus = {
    execute: jest.fn().mockResolvedValue(result)
  }
  return {
    controller: new CrmObjectReferenceGrpcController(queryBus as never),
    queryBus
  }
}

describe('CrmObjectReferenceGrpcController', () => {
  it('returns active CrmAccount reference as create-annotation capable', async () => {
    const harness = createController({
      objectRef: {
        objectOwnerService: 'crm-service',
        objectType: 'CrmAccount',
        objectId: 'crm-account-1'
      },
      exists: true,
      readable: true,
      capabilityAllowed: true,
      lifecycle: 'ACTIVE',
      displaySnapshot: {
        title: 'Northline Bathworks',
        subtitle: 'CRM-1001',
        status: 'ACTIVE'
      }
    })

    const response = await harness.controller.validateCrmObjectReference({
      ...queryContext,
      objectType: 'CrmAccount',
      objectId: 'crm-account-1',
      requestedCapability:
        CrmObjectReferenceCapability.CRM_OBJECT_REFERENCE_CAPABILITY_CREATE_ANNOTATION
    })

    expect(harness.queryBus.execute).toHaveBeenCalledWith(
      expect.any(ValidateCrmObjectReferenceQuery)
    )
    expect(harness.queryBus.execute.mock.calls[0][0]).toMatchObject({
      tenantId: 'tenant-1',
      objectType: 'CrmAccount',
      objectId: 'crm-account-1',
      requestedCapability: 'CREATE_ANNOTATION'
    })
    expect(response).toEqual(
      expect.objectContaining({
        exists: true,
        readable: true,
        capabilityAllowed: true,
        objectLifecycle: CrmObjectLifecycle.CRM_OBJECT_LIFECYCLE_ACTIVE
      })
    )
  })

  it('returns archived CrmAccount as readable but create denied', async () => {
    const harness = createController({
      objectRef: {
        objectOwnerService: 'crm-service',
        objectType: 'CrmAccount',
        objectId: 'crm-account-archived'
      },
      exists: true,
      readable: true,
      capabilityAllowed: false,
      lifecycle: 'ARCHIVED',
      displaySnapshot: {
        title: 'Archived Account',
        subtitle: 'CRM-1999',
        status: 'ARCHIVED'
      },
      denyReason: 'crm account is archived'
    })

    const response = await harness.controller.validateCrmObjectReference({
      ...queryContext,
      objectType: 'CrmAccount',
      objectId: 'crm-account-archived',
      requestedCapability:
        CrmObjectReferenceCapability.CRM_OBJECT_REFERENCE_CAPABILITY_CREATE_ANNOTATION
    })

    expect(response).toEqual(
      expect.objectContaining({
        exists: true,
        readable: true,
        capabilityAllowed: false,
        objectLifecycle: CrmObjectLifecycle.CRM_OBJECT_LIFECYCLE_ARCHIVED,
        denyReason: 'crm account is archived'
      })
    )
  })
})
