import { Inject, Injectable, OnModuleInit } from '@nestjs/common'
import { ClientGrpc } from '@nestjs/microservices'
import {
  GrantInitialAccessForEmployeeAccountResponse,
  PERMISSION_MANAGEMENT_SERVICE_NAME,
  PermissionManagementServiceClient
} from '@oes/common/generated/permission_service'
import { safeGrpcCall } from '@oes/common/transport'
import { PermissionOnboardingGrantPort } from '../../application/ports'
import { HrFoundationTrustedGrpcExecutionProducer } from './foundation-trusted-grpc.clients'

export const PERMISSION_GRPC_CLIENT = Symbol('HR_PERMISSION_GRPC_CLIENT')

/** PermissionOnboardingGrantGrpcAdapter requests initial onboarding grants through permission-service actual gRPC contracts. */
@Injectable()
export class PermissionOnboardingGrantGrpcAdapter
  implements PermissionOnboardingGrantPort, OnModuleInit
{
  private permissionManagementService!: PermissionManagementServiceClient
  private readonly trusted = new HrFoundationTrustedGrpcExecutionProducer()

  constructor(
    @Inject(PERMISSION_GRPC_CLIENT) private readonly client: ClientGrpc
  ) {}

  onModuleInit() {
    this.permissionManagementService =
      this.client.getService<PermissionManagementServiceClient>(PERMISSION_MANAGEMENT_SERVICE_NAME)
  }

  async grantInitialAccessForEmployeeAccount(input: {
    tenantId: string
    accountId: string
    roleIds: string[]
    idempotencyKey: string
    reason?: string
    operatorContext?: {
      operatorId: string
      operatorType: string
      tenantId?: string
      orgId?: string
      operatorRoles?: string[]
    }
    requestId?: string
    traceId?: string
  }): Promise<{ grantId?: string }> {
    const response = await safeGrpcCall<GrantInitialAccessForEmployeeAccountResponse>(
      this.permissionManagementService.grantInitialAccessForEmployeeAccount(
        {
          tenantId: input.tenantId,
          accountId: input.accountId,
          roleIds: input.roleIds,
          idempotencyKey: input.idempotencyKey,
          reason: input.reason
        },
        await this.trusted.forBusinessCall('permission-service', ['permission.account.assign_roles'])
      ),
      {
        caller: 'hr-service',
        method: 'PermissionManagementService.grantInitialAccessForEmployeeAccount'
      }
    )

    return {
      grantId: response.grant?.idempotencyKey || response.grant?.id || undefined
    }
  }

}
