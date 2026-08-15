import { Inject, Injectable, OnModuleInit } from '@nestjs/common'
import { ClientGrpc } from '@nestjs/microservices'
import {
  BindAccountToEmployeeResponse,
  IDENTITY_MANAGEMENT_SERVICE_NAME,
  IdentityManagementServiceClient
} from '@oes/common/generated/identity_service'
import { safeGrpcCall } from '@oes/common/transport'
import { IdentityEmployeeBindingPort } from '../../application/ports'
import { HrFoundationTrustedGrpcExecutionProducer } from './foundation-trusted-grpc.clients'

export const IDENTITY_GRPC_CLIENT = Symbol('HR_IDENTITY_GRPC_CLIENT')

/** IdentityEmployeeBindingGrpcAdapter binds accounts to employees through identity-service actual gRPC contracts. */
@Injectable()
export class IdentityEmployeeBindingGrpcAdapter
  implements IdentityEmployeeBindingPort, OnModuleInit
{
  private identityManagementService!: IdentityManagementServiceClient
  private readonly trusted = new HrFoundationTrustedGrpcExecutionProducer()

  constructor(
    @Inject(IDENTITY_GRPC_CLIENT) private readonly client: ClientGrpc
  ) {}

  onModuleInit() {
    this.identityManagementService =
      this.client.getService<IdentityManagementServiceClient>(IDENTITY_MANAGEMENT_SERVICE_NAME)
  }

  async bindAccountToEmployee(input: {
    tenantId: string
    employeeId: string
    accountId: string
    operatorContext?: {
      operatorId: string
      operatorType: string
      tenantId?: string
      orgId?: string
      operatorRoles?: string[]
    }
    requestId?: string
    traceId?: string
  }): Promise<{ accountId: string }> {
    const response = await safeGrpcCall<BindAccountToEmployeeResponse>(
      this.identityManagementService.bindAccountToEmployee(
        {
          employeeId: input.employeeId,
          accountId: input.accountId
        },
        await this.trusted.forBusinessCall('identity-service', ['identity.account.profile.update'])
      ),
      {
        caller: 'hr-service',
        method: 'IdentityManagementService.bindAccountToEmployee'
      }
    )

    return {
      accountId: response.binding?.accountId ?? input.accountId
    }
  }

}
