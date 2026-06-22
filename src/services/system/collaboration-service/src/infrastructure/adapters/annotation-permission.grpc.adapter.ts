import { Inject, Injectable, OnModuleInit } from '@nestjs/common'
import { ClientGrpc } from '@nestjs/microservices'
import {
  COLLABORATION_ANNOTATION_PERMISSION_CODES,
  GRPC_METADATA_PROPAGATION_FACTORY,
  GrpcMetadataPropagationFactory
} from '@oes/common/authorization'
import {
  AccountAccessSummaryResponse,
  PERMISSION_ACCESS_SUMMARY_SERVICE_NAME,
  PermissionAccessSummaryServiceClient
} from '@oes/common/generated/permission_service'
import { safeGrpcCall } from '@oes/common/transport'
import { AnnotationPermissionPort } from '../../application/ports/annotation-permission.port'

export const ANNOTATION_PERMISSION_GRPC_CLIENT = Symbol('ANNOTATION_PERMISSION_GRPC_CLIENT')

/** AnnotationPermissionGrpcAdapter checks Annotation P1 permissions through permission-service. */
@Injectable()
export class AnnotationPermissionGrpcAdapter implements AnnotationPermissionPort, OnModuleInit {
  private permissionAccessSummaryService!: PermissionAccessSummaryServiceClient

  constructor(
    @Inject(ANNOTATION_PERMISSION_GRPC_CLIENT) private readonly client: ClientGrpc,
    @Inject(GRPC_METADATA_PROPAGATION_FACTORY)
    private readonly metadataFactory: GrpcMetadataPropagationFactory
  ) {}

  onModuleInit(): void {
    this.permissionAccessSummaryService =
      this.client.getService<PermissionAccessSummaryServiceClient>(
        PERMISSION_ACCESS_SUMMARY_SERVICE_NAME
      )
  }

  async canCreateAnnotation(input: { tenantId: string; operatorAccountId: string }): Promise<boolean> {
    return this.hasPermission(input, COLLABORATION_ANNOTATION_PERMISSION_CODES.CREATE)
  }

  async canManageAnnotation(input: { tenantId: string; operatorAccountId: string }): Promise<boolean> {
    return this.hasPermission(input, COLLABORATION_ANNOTATION_PERMISSION_CODES.MANAGE)
  }

  /** hasPermission resolves the operator access summary and checks one action code. */
  private async hasPermission(
    input: { tenantId: string; operatorAccountId: string },
    actionCode: string
  ): Promise<boolean> {
    const response = await safeGrpcCall<AccountAccessSummaryResponse>(
      this.permissionAccessSummaryService.getAccountAccessSummary(
        {
          accountId: input.operatorAccountId,
          tenantId: input.tenantId,
          scopeLevel: 'TENANT'
        },
        this.metadataFactory.createInternalCallMetadata({
          callerServiceName: 'collaboration-service'
        })
      ),
      {
        caller: 'collaboration-service',
        method: 'PermissionAccessSummaryService.getAccountAccessSummary'
      }
    )

    return (response.actionCodes ?? []).includes(actionCode)
  }
}
