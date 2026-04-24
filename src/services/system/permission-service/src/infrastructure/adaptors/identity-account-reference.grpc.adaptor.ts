import { Inject, Injectable, OnModuleInit } from '@nestjs/common'
import { ClientGrpc } from '@nestjs/microservices'
import { resolveCommonProtoPath } from '@oes/common/contracts'
import {
  GetAccountByIdResponse,
  IDENTITY_QUERY_SERVICE_NAME,
  IdentityQueryServiceClient
} from '@oes/common/generated/identity_service'
import { safeGrpcCall } from '@oes/common/transport'
import {
  IDENTITY_ACCOUNT_REFERENCE_PORT,
  IdentityAccountReferencePort
} from '../../application/ports/identity-account-reference.port'

export const IDENTITY_GRPC_CLIENT = Symbol('IDENTITY_GRPC_CLIENT')

/** IdentityAccountReferenceGrpcAdaptor reads minimal account context facts from identity-service over gRPC. */
@Injectable()
export class IdentityAccountReferenceGrpcAdaptor
  implements IdentityAccountReferencePort, OnModuleInit
{
  private identityQueryService!: IdentityQueryServiceClient

  constructor(@Inject(IDENTITY_GRPC_CLIENT) private readonly client: ClientGrpc) {}

  onModuleInit() {
    this.identityQueryService =
      this.client.getService<IdentityQueryServiceClient>(IDENTITY_QUERY_SERVICE_NAME)
  }

  async getAccountById(accountId: string) {
    try {
      const response = await safeGrpcCall<GetAccountByIdResponse>(
        this.identityQueryService.getAccountById({
          accountId
        }),
        {
          caller: 'permission-service',
          method: 'IdentityQueryService.getAccountById'
        }
      )

      if (!response.account?.id) {
        return null
      }

      return {
        accountId: response.account.id,
        tenantId: normalizeOptional(response.account.tenantId) ?? null,
        scopeLevel:
          response.account.scopeLevel === 'SYSTEM'
            ? ('SYSTEM' as const)
            : ('TENANT' as const)
      }
    } catch {
      return null
    }
  }
}

export const IDENTITY_GRPC_CLIENT_OPTIONS = {
  package: 'identity_service',
  protoPath: [resolveCommonProtoPath('identity_service/identity_query.proto')],
  url: process.env.GRPC_SERVICE_IDENTITY_URL || '127.0.0.1:50052'
}

function normalizeOptional(value?: string): string | undefined {
  const normalized = value?.trim()
  return normalized ? normalized : undefined
}
