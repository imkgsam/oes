import { Inject, Injectable, OnModuleInit } from '@nestjs/common'
import { ClientGrpc } from '@nestjs/microservices'
import { GRPC_METADATA_PROPAGATION_FACTORY, GrpcMetadataPropagationFactory } from '@oes/common/authorization'
import {
  BindAccountToEmployeeResponse,
  IDENTITY_MANAGEMENT_SERVICE_NAME,
  IdentityManagementServiceClient
} from '@oes/common/generated/identity_service'
import { safeGrpcCall } from '@oes/common/transport'
import { IdentityEmployeeBindingPort } from '../../application/ports'

export const IDENTITY_GRPC_CLIENT = Symbol('HR_IDENTITY_GRPC_CLIENT')

/** IdentityEmployeeBindingGrpcAdapter binds accounts to employees through identity-service actual gRPC contracts. */
@Injectable()
export class IdentityEmployeeBindingGrpcAdapter
  implements IdentityEmployeeBindingPort, OnModuleInit
{
  private identityManagementService!: IdentityManagementServiceClient

  constructor(
    @Inject(IDENTITY_GRPC_CLIENT) private readonly client: ClientGrpc,
    @Inject(GRPC_METADATA_PROPAGATION_FACTORY)
    private readonly metadataFactory: GrpcMetadataPropagationFactory
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
          tenantId: input.tenantId,
          employeeId: input.employeeId,
          accountId: input.accountId
        },
        this.metadata(input)
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

  private metadata(input: {
    operatorContext?: {
      operatorId: string
      operatorType: string
      tenantId?: string
      orgId?: string
      operatorRoles?: string[]
    }
    requestId?: string
    traceId?: string
  }) {
    if (input.operatorContext) {
      return this.metadataFactory.createOperatorScopedMetadata({
        callerServiceName: 'hr-service',
        operatorContext: input.operatorContext,
        requestId: input.requestId,
        traceId: input.traceId
      })
    }

    return this.metadataFactory.createInternalCallMetadata({
      callerServiceName: 'hr-service',
      requestId: input.requestId,
      traceId: input.traceId
    })
  }
}
