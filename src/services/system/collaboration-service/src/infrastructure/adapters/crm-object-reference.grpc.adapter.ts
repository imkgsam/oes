import { Inject, Injectable, OnModuleInit } from '@nestjs/common'
import { ClientGrpc } from '@nestjs/microservices'
import { GRPC_METADATA_PROPAGATION_FACTORY, GrpcMetadataPropagationFactory } from '@oes/common/authorization'
import {
  CRM_OBJECT_REFERENCE_SERVICE_NAME,
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

export const CRM_OBJECT_REFERENCE_GRPC_CLIENT = Symbol('CRM_OBJECT_REFERENCE_GRPC_CLIENT')

/** CrmObjectReferenceGrpcAdapter validates Annotation owner object refs through crm-service gRPC. */
@Injectable()
export class CrmObjectReferenceGrpcAdapter implements ObjectReferencePort, OnModuleInit {
  private crmObjectReferenceService!: CrmObjectReferenceServiceClient

  constructor(
    @Inject(CRM_OBJECT_REFERENCE_GRPC_CLIENT) private readonly client: ClientGrpc,
    @Inject(GRPC_METADATA_PROPAGATION_FACTORY)
    private readonly metadataFactory: GrpcMetadataPropagationFactory
  ) {}

  onModuleInit(): void {
    this.crmObjectReferenceService =
      this.client.getService<CrmObjectReferenceServiceClient>(CRM_OBJECT_REFERENCE_SERVICE_NAME)
  }

  async validate(input: Parameters<ObjectReferencePort['validate']>[0]): Promise<ObjectReferenceValidation> {
    const response = await safeGrpcCall<ValidateCrmObjectReferenceResponse>(
      this.crmObjectReferenceService.validateCrmObjectReference(
        {
          tenantId: input.tenantId,
          operatorContext: {
            operatorId: input.operatorAccountId,
            operatorType: 'TENANT_ACCOUNT'
          },
          traceContext: {
            traceId: input.traceId,
            requestId: input.traceId
          },
          objectType: input.objectRef.objectType,
          objectId: input.objectRef.objectId,
          requestedCapability: toProtoCapability(input.capability)
        },
        this.metadataFactory.createInternalCallMetadata({
          callerServiceName: 'collaboration-service'
        })
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

/** toProtoCapability maps Annotation object reference capabilities to CRM proto values. */
function toProtoCapability(value: ObjectReferenceCapability): CrmObjectReferenceCapability {
  const map = {
    [ObjectReferenceCapability.READ]: CrmObjectReferenceCapability.CRM_OBJECT_REFERENCE_CAPABILITY_READ,
    [ObjectReferenceCapability.CREATE_ANNOTATION]:
      CrmObjectReferenceCapability.CRM_OBJECT_REFERENCE_CAPABILITY_CREATE_ANNOTATION,
    [ObjectReferenceCapability.MUTATE_ANNOTATION]:
      CrmObjectReferenceCapability.CRM_OBJECT_REFERENCE_CAPABILITY_MUTATE_ANNOTATION
  } as const
  return map[value]
}

/** fromProtoLifecycle maps CRM proto lifecycle to Annotation application lifecycle labels. */
function fromProtoLifecycle(value?: CrmObjectLifecycle): ObjectReferenceValidation['lifecycle'] {
  if (value === CrmObjectLifecycle.CRM_OBJECT_LIFECYCLE_ARCHIVED) return 'ARCHIVED'
  if (value === CrmObjectLifecycle.CRM_OBJECT_LIFECYCLE_DELETED_OR_UNAVAILABLE) {
    return 'DELETED_OR_UNAVAILABLE'
  }
  return 'ACTIVE'
}
