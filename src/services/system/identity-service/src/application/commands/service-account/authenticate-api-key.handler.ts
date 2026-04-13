import { Inject } from '@nestjs/common'
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { ExceptionFactory } from '@oes/common/exceptions'
import {
  API_KEY_STATUSES,
  IDENTITY_API_KEY_EXPIRED,
  IDENTITY_API_KEY_INVALID,
  IDENTITY_SERVICE_ACCOUNT_DISABLED,
  IDENTITY_SERVICE_ACCOUNT_NOT_FOUND,
  MACHINE_PRINCIPAL_STATUSES,
  SYMBOLS
} from '../../../common/constants'
import { ApiKeyEntity } from '../../../domain/entities/api-key.entity'
import { ServiceAccountEntity } from '../../../domain/entities/service-account.entity'
import { ApiKeyRepository } from '../../../domain/repositories/api-key.repository'
import { ServiceAccountRepository } from '../../../domain/repositories/service-account.repository'
import { hashApiKeySecret } from './api-key-support'
import { AuthenticateApiKeyCommand } from './authenticate-api-key.command'

export class AuthenticatedApiKeyResult {
  constructor(
    public readonly apiKey: ApiKeyEntity,
    public readonly serviceAccount: ServiceAccountEntity
  ) {}
}

@CommandHandler(AuthenticateApiKeyCommand)
export class AuthenticateApiKeyHandler
  implements ICommandHandler<AuthenticateApiKeyCommand, AuthenticatedApiKeyResult>
{
  constructor(
    @Inject(SYMBOLS.REPO.API_KEY)
    private readonly apiKeyRepository: ApiKeyRepository,
    @Inject(SYMBOLS.REPO.SERVICE_ACCOUNT)
    private readonly serviceAccountRepository: ServiceAccountRepository
  ) {}

  async execute(command: AuthenticateApiKeyCommand): Promise<AuthenticatedApiKeyResult> {
    const apiKey = await this.apiKeyRepository.findByHashedValue(hashApiKeySecret(command.secret))
    if (!apiKey || apiKey.status !== API_KEY_STATUSES.ACTIVE) {
      throw ExceptionFactory.domain(IDENTITY_API_KEY_INVALID)
    }

    if (apiKey.expiresAt && apiKey.expiresAt.getTime() <= Date.now()) {
      throw ExceptionFactory.domain(IDENTITY_API_KEY_EXPIRED, {
        apiKeyId: apiKey.id,
        expiresAt: apiKey.expiresAt.toISOString()
      })
    }

    const serviceAccount = await this.serviceAccountRepository.findById(apiKey.serviceAccountId)
    if (!serviceAccount) {
      throw ExceptionFactory.domain(IDENTITY_SERVICE_ACCOUNT_NOT_FOUND, {
        serviceAccountId: apiKey.serviceAccountId
      })
    }

    if (serviceAccount.status !== MACHINE_PRINCIPAL_STATUSES.ACTIVE) {
      throw ExceptionFactory.domain(IDENTITY_SERVICE_ACCOUNT_DISABLED, {
        serviceAccountId: serviceAccount.id,
        status: serviceAccount.status
      })
    }

    const touchedApiKey = await this.apiKeyRepository.touchLastUsed({
      apiKeyId: apiKey.id
    })

    return new AuthenticatedApiKeyResult(touchedApiKey, serviceAccount)
  }
}
