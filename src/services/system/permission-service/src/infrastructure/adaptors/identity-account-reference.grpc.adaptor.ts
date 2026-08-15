import { Injectable, OnModuleInit } from '@nestjs/common'
import {
  GetAccountByIdResponse,
  GetServiceAccountByIdResponse,
  IDENTITY_QUERY_SERVICE_NAME,
  IdentityQueryServiceClient
} from '@oes/common/generated/identity_service'
import { safeGrpcCall } from '@oes/common/transport'
import {
  IDENTITY_ACCOUNT_REFERENCE_PORT,
  IdentityAccountReferencePort
} from '../../application/ports/identity-account-reference.port'
import { PermissionFoundationTrustedGrpcExecutionProducer, PermissionIdentityTrustedGrpcClient } from './foundation-trusted-grpc.clients'

/** IdentityAccountReferenceGrpcAdaptor reads minimal account context facts from identity-service over gRPC. */
@Injectable()
export class IdentityAccountReferenceGrpcAdaptor
  implements IdentityAccountReferencePort, OnModuleInit
{
  private identityQueryService!: IdentityQueryServiceClient
  private readonly trusted = new PermissionFoundationTrustedGrpcExecutionProducer()

  constructor(private readonly client: PermissionIdentityTrustedGrpcClient) {}

  onModuleInit() {
    this.identityQueryService = this.client.getClient().getService<IdentityQueryServiceClient>(
      IDENTITY_QUERY_SERVICE_NAME
    )
  }

  async getAccountById(accountId: string) {
    try {
      const response = await safeGrpcCall<GetAccountByIdResponse>(
        this.identityQueryService.getAccountById(
          { accountId },
          await this.trusted.forBusinessCall('identity-service', ['identity.account.list'])
        ),
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
          response.account.scopeLevel === 'SYSTEM' ? ('SYSTEM' as const) : ('TENANT' as const),
        isActive: response.account.isEnabled ?? false
      }
    } catch {
      return null
    }
  }

  /** getServiceAccountById reads the active MACHINE principal scope facts owned by identity-service. */
  async getServiceAccountById(serviceAccountId: string) {
    try {
      const response = await safeGrpcCall<GetServiceAccountByIdResponse>(
        this.identityQueryService.getServiceAccountById(
          { serviceAccountId },
          await this.trusted.forBusinessCall('identity-service', [
            'identity.machine.service_account.create'
          ])
        ),
        {
          caller: 'permission-service',
          method: 'IdentityQueryService.getServiceAccountById'
        }
      )

      if (!response.account?.id) {
        return null
      }

      return {
        principalId: response.account.id,
        tenantId: normalizeOptional(response.account.tenantId) ?? null,
        scopeLevel:
          response.account.scopeLevel === 'SYSTEM' ? ('SYSTEM' as const) : ('TENANT' as const),
        isActive: response.account.status === 'ACTIVE'
      }
    } catch {
      return null
    }
  }

}

function normalizeOptional(value?: string): string | undefined {
  const normalized = value?.trim()
  return normalized ? normalized : undefined
}
