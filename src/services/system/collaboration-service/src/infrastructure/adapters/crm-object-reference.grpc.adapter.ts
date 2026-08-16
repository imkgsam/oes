import { Injectable, OnModuleInit } from '@nestjs/common'
import { CRM_INTERNAL_PERMISSION_CODES } from '@oes/common/authorization'
import {
  CrmObjectLifecycle,
  CrmObjectReferenceCapability,
  CrmObjectReferenceServiceClient,
  ValidateCrmObjectReferenceResponse
} from '@oes/common/generated/crm_service'
import { safeGrpcCall } from '@oes/common/transport'
import {
  ObjectReferenceCapability,
  ObjectReferencePort,
  ObjectReferenceValidation
} from '../../application/ports/object-reference.port'
import { CollaborationCrmTrustedGrpcClient } from './collaboration-crm-trusted-grpc.client'
import { CollaborationFoundationTrustedGrpcExecutionProducer } from './foundation-trusted-grpc.clients'

/** Validates Annotation owner references through CRM's dedicated HUMAN_OBO path. */
@Injectable()
export class CrmObjectReferenceGrpcAdapter implements ObjectReferencePort, OnModuleInit {
  private crmObjectReferenceService!: CrmObjectReferenceServiceClient
  private readonly trusted = new CollaborationFoundationTrustedGrpcExecutionProducer()

  constructor(private readonly client: CollaborationCrmTrustedGrpcClient) {}

  onModuleInit(): void {
    this.crmObjectReferenceService = this.client.objectReference()
  }

  async validate(
    input: Parameters<ObjectReferencePort['validate']>[0]
  ): Promise<ObjectReferenceValidation> {
    const response = await safeGrpcCall<ValidateCrmObjectReferenceResponse>(
      this.crmObjectReferenceService.validateCrmObjectReference(
        {
          objectType: input.objectRef.objectType,
          objectId: input.objectRef.objectId,
          requestedCapability: toProtoCapability(input.capability)
        },
        await this.trusted.forInternalCall(
          'crm-service',
          CRM_INTERNAL_PERMISSION_CODES.VALIDATE_OBJECT_REFERENCE
        )
      ),
      {
        caller: 'collaboration-service',
        method: 'CrmObjectReferenceService.ValidateCrmObjectReference'
      }
    )
    return {
      objectRef: {
        objectOwnerService: response.objectRef?.objectOwnerService ?? 'crm-service',
        objectType: response.objectRef?.objectType ?? input.objectRef.objectType,
        objectId: response.objectRef?.objectId ?? input.objectRef.objectId
      },
      exists: Boolean(response.exists),
      readable: Boolean(response.readable),
      capabilityAllowed: Boolean(response.capabilityAllowed),
      lifecycle: fromProtoLifecycle(response.objectLifecycle),
      displaySnapshot: {
        title: response.displaySnapshot?.title,
        subtitle: response.displaySnapshot?.subtitle,
        status: response.displaySnapshot?.status
      },
      denyReason: response.denyReason
    }
  }
}

/** Maps Annotation object-reference capabilities to CRM proto values. */
function toProtoCapability(value: ObjectReferenceCapability): CrmObjectReferenceCapability {
  const map = {
    [ObjectReferenceCapability.READ]:
      CrmObjectReferenceCapability.CRM_OBJECT_REFERENCE_CAPABILITY_READ,
    [ObjectReferenceCapability.CREATE_ANNOTATION]:
      CrmObjectReferenceCapability.CRM_OBJECT_REFERENCE_CAPABILITY_CREATE_ANNOTATION,
    [ObjectReferenceCapability.MUTATE_ANNOTATION]:
      CrmObjectReferenceCapability.CRM_OBJECT_REFERENCE_CAPABILITY_MUTATE_ANNOTATION
  } as const
  return map[value]
}

/** Maps CRM proto lifecycle to Annotation application lifecycle labels. */
function fromProtoLifecycle(value?: CrmObjectLifecycle): ObjectReferenceValidation['lifecycle'] {
  if (value === CrmObjectLifecycle.CRM_OBJECT_LIFECYCLE_ARCHIVED) return 'ARCHIVED'
  if (value === CrmObjectLifecycle.CRM_OBJECT_LIFECYCLE_DELETED_OR_UNAVAILABLE) {
    return 'DELETED_OR_UNAVAILABLE'
  }
  return 'ACTIVE'
}
