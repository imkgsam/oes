import { Controller, UseFilters } from '@nestjs/common'
import { ValidatingQueryBus } from '@oes/common/cqrs'
import { GrpcExceptionFilter } from '@oes/common/filters'
import {
  CrmObjectLifecycle,
  CrmObjectReferenceCapability,
  CrmObjectReferenceServiceController,
  CrmObjectReferenceServiceControllerMethods,
  ValidateCrmObjectReferenceRequest,
  ValidateCrmObjectReferenceResponse
} from '@oes/common/generated/crm_service'
import { ValidateCrmObjectReferenceQuery } from '../../application/queries/validate-object-reference.query'
import { ValidateCrmObjectReferenceResult } from '../../application/queries/validate-object-reference.handler'
import { CustomerRpcContextValidator } from './customer-rpc-context.validator'

/** CrmObjectReferenceGrpcController exposes CrmAccount reference validation for collaboration-service. */
@UseFilters(GrpcExceptionFilter)
@Controller()
@CrmObjectReferenceServiceControllerMethods()
export class CrmObjectReferenceGrpcController implements CrmObjectReferenceServiceController {
  constructor(private readonly queryBus: ValidatingQueryBus) {}

  async validateCrmObjectReference(
    request: ValidateCrmObjectReferenceRequest
  ): Promise<ValidateCrmObjectReferenceResponse> {
    const context = CustomerRpcContextValidator.assertQueryContext(request)
    const result = (await this.queryBus.execute(
      new ValidateCrmObjectReferenceQuery({
        tenantId: context.tenantId,
        operatorId: context.operatorContext.operatorId,
        objectType: request.objectType ?? '',
        objectId: request.objectId ?? '',
        requestedCapability: fromProtoCapability(request.requestedCapability)
      })
    )) as ValidateCrmObjectReferenceResult

    return {
      objectRef: result.objectRef,
      exists: result.exists,
      readable: result.readable,
      capabilityAllowed: result.capabilityAllowed,
      objectLifecycle: toProtoLifecycle(result.lifecycle),
      displaySnapshot: result.displaySnapshot,
      denyReason: result.denyReason
    }
  }
}

/** fromProtoCapability maps CRM object reference capability enum values to application labels. */
function fromProtoCapability(value?: CrmObjectReferenceCapability) {
  if (value === CrmObjectReferenceCapability.CRM_OBJECT_REFERENCE_CAPABILITY_READ) return 'READ'
  if (value === CrmObjectReferenceCapability.CRM_OBJECT_REFERENCE_CAPABILITY_CREATE_ANNOTATION) {
    return 'CREATE_ANNOTATION'
  }
  if (value === CrmObjectReferenceCapability.CRM_OBJECT_REFERENCE_CAPABILITY_MUTATE_ANNOTATION) {
    return 'MUTATE_ANNOTATION'
  }
  return 'READ'
}

/** toProtoLifecycle maps application lifecycle labels to CRM object reference proto enum values. */
function toProtoLifecycle(value: ValidateCrmObjectReferenceResult['lifecycle']): CrmObjectLifecycle {
  if (value === 'ARCHIVED') return CrmObjectLifecycle.CRM_OBJECT_LIFECYCLE_ARCHIVED
  if (value === 'DELETED_OR_UNAVAILABLE') {
    return CrmObjectLifecycle.CRM_OBJECT_LIFECYCLE_DELETED_OR_UNAVAILABLE
  }
  return CrmObjectLifecycle.CRM_OBJECT_LIFECYCLE_ACTIVE
}
