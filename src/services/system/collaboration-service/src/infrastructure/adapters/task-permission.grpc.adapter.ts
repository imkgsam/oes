import { Inject, Injectable, OnModuleInit } from '@nestjs/common'
import { ClientGrpc } from '@nestjs/microservices'
import { GRPC_METADATA_PROPAGATION_FACTORY, GrpcMetadataPropagationFactory } from '@oes/common/authorization'
import { COLLABORATION_TASK_PERMISSION_CODES } from '@oes/common/authorization'
import {
  AccountAccessSummaryResponse,
  PERMISSION_ACCESS_SUMMARY_SERVICE_NAME,
  PermissionAccessSummaryServiceClient
} from '@oes/common/generated/permission_service'
import { safeGrpcCall } from '@oes/common/transport'
import { TaskPermissionPort } from '../../application/ports/task-permission.port'

export const PERMISSION_GRPC_CLIENT = Symbol('COLLABORATION_PERMISSION_GRPC_CLIENT')

/** TaskPermissionGrpcAdapter checks Task P1 capability permissions through permission-service. */
@Injectable()
export class TaskPermissionGrpcAdapter implements TaskPermissionPort, OnModuleInit {
  private permissionAccessSummaryService!: PermissionAccessSummaryServiceClient

  constructor(
    @Inject(PERMISSION_GRPC_CLIENT) private readonly client: ClientGrpc,
    @Inject(GRPC_METADATA_PROPAGATION_FACTORY)
    private readonly metadataFactory: GrpcMetadataPropagationFactory
  ) {}

  onModuleInit(): void {
    this.permissionAccessSummaryService =
      this.client.getService<PermissionAccessSummaryServiceClient>(
        PERMISSION_ACCESS_SUMMARY_SERVICE_NAME
      )
  }

  async canAssignTask(input: { tenantId: string; operatorAccountId: string }): Promise<boolean> {
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

    return (response.actionCodes ?? []).includes(COLLABORATION_TASK_PERMISSION_CODES.ASSIGN)
  }
}
