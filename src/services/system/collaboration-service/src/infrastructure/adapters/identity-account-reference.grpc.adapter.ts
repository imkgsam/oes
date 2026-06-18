import { Inject, Injectable, OnModuleInit } from '@nestjs/common'
import { ClientGrpc } from '@nestjs/microservices'
import { GRPC_METADATA_PROPAGATION_FACTORY, GrpcMetadataPropagationFactory } from '@oes/common/authorization'
import {
  GetAccountByIdResponse,
  IDENTITY_QUERY_SERVICE_NAME,
  IdentityQueryServiceClient
} from '@oes/common/generated/identity_service'
import { safeGrpcCall } from '@oes/common/transport'
import { AccountReferencePort } from '../../application/ports/account-reference.port'

export const IDENTITY_GRPC_CLIENT = Symbol('COLLABORATION_IDENTITY_GRPC_CLIENT')

/** IdentityAccountReferenceGrpcAdapter validates assignees against identity-service account truth. */
@Injectable()
export class IdentityAccountReferenceGrpcAdapter implements AccountReferencePort, OnModuleInit {
  private identityQueryService!: IdentityQueryServiceClient

  constructor(
    @Inject(IDENTITY_GRPC_CLIENT) private readonly client: ClientGrpc,
    @Inject(GRPC_METADATA_PROPAGATION_FACTORY)
    private readonly metadataFactory: GrpcMetadataPropagationFactory
  ) {}

  onModuleInit(): void {
    this.identityQueryService =
      this.client.getService<IdentityQueryServiceClient>(IDENTITY_QUERY_SERVICE_NAME)
  }

  async isActiveTenantAccount(input: { tenantId: string; accountId: string }): Promise<boolean> {
    const response = await safeGrpcCall<GetAccountByIdResponse>(
      this.identityQueryService.getAccountById(
        { accountId: input.accountId },
        this.metadataFactory.createInternalCallMetadata({
          callerServiceName: 'collaboration-service'
        })
      ),
      {
        caller: 'collaboration-service',
        method: 'IdentityQueryService.getAccountById'
      }
    )

    return Boolean(
      response.account?.id &&
        response.account.tenantId === input.tenantId &&
        response.account.isEnabled
    )
  }
}
