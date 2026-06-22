import { ValidateCrmObjectReferenceQuery } from '../../src/application/queries/validate-object-reference.query'
import { CrmObjectReferenceGrpcController } from '../../src/interfaces/grpc/crm-object-reference.grpc.controller'
import {
  CrmObjectLifecycle,
  CrmObjectReferenceCapability
} from '@oes/common/generated/crm_service'

const queryContext = {
  tenantId: 'tenant-1',
  operatorContext: {
    operatorId: 'operator-1',
    operatorType: 'HUMAN',
    orgId: 'org-1'
  },
  traceContext: {
    traceId: 'trace-1',
    requestId: 'request-1'
  }
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

    expect(harness.queryBus.execute).toHaveBeenCalledWith(expect.any(ValidateCrmObjectReferenceQuery))
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
