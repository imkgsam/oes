import { Inject } from '@nestjs/common'
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { ExceptionFactory } from '@oes/common/exceptions'
import { CheckResourceService } from '../../authorization'
import {
  API_KEY_STATUSES,
  IDENTITY_API_KEY_ALREADY_REVOKED,
  IDENTITY_API_KEY_EXPIRES_AT_MUST_BE_FUTURE,
  IDENTITY_API_KEY_NOT_FOUND,
  IDENTITY_SERVICE_ACCOUNT_DISABLED,
  IDENTITY_SERVICE_ACCOUNT_NOT_FOUND,
  MACHINE_PRINCIPAL_STATUSES,
  SYMBOLS
} from '../../../common/constants'
import { ApiKeyRepository } from '../../../domain/repositories/api-key.repository'
import { ServiceAccountRepository } from '../../../domain/repositories/service-account.repository'
import { CreatedApiKeyResult } from './create-api-key.handler'
import { generateApiKeyMaterial } from './api-key-support'
import { RotateApiKeyCommand } from './rotate-api-key.command'

@CommandHandler(RotateApiKeyCommand)
export class RotateApiKeyHandler
  implements ICommandHandler<RotateApiKeyCommand, CreatedApiKeyResult>
{
  constructor(
    @Inject(SYMBOLS.REPO.API_KEY)
    private readonly apiKeyRepository: ApiKeyRepository,
    @Inject(SYMBOLS.REPO.SERVICE_ACCOUNT)
    private readonly serviceAccountRepository: ServiceAccountRepository,
    private readonly checkResourceService: CheckResourceService
  ) {}

  async execute(command: RotateApiKeyCommand): Promise<CreatedApiKeyResult> {
    const currentApiKey = await this.apiKeyRepository.findById(command.apiKeyId)
    if (!currentApiKey) {
      throw ExceptionFactory.domain(IDENTITY_API_KEY_NOT_FOUND, {
        apiKeyId: command.apiKeyId
      })
    }

    if (currentApiKey.status === API_KEY_STATUSES.REVOKED) {
      throw ExceptionFactory.domain(IDENTITY_API_KEY_ALREADY_REVOKED, {
        apiKeyId: command.apiKeyId
      })
    }

    const serviceAccount = await this.serviceAccountRepository.findById(currentApiKey.serviceAccountId)
    if (!serviceAccount) {
      throw ExceptionFactory.domain(IDENTITY_SERVICE_ACCOUNT_NOT_FOUND, {
        serviceAccountId: currentApiKey.serviceAccountId
      })
    }

    this.checkResourceService.checkApiKey(command.operatorScope, {
      resourceId: currentApiKey.id,
      tenantId: serviceAccount.tenantId
    })

    if (serviceAccount.status !== MACHINE_PRINCIPAL_STATUSES.ACTIVE) {
      throw ExceptionFactory.domain(IDENTITY_SERVICE_ACCOUNT_DISABLED, {
        serviceAccountId: serviceAccount.id,
        status: serviceAccount.status
      })
    }

    const expiresAt = command.expiresAt
      ? new Date(command.expiresAt)
      : currentApiKey.expiresAt ?? undefined
    if (expiresAt && expiresAt.getTime() <= Date.now()) {
      throw ExceptionFactory.domain(IDENTITY_API_KEY_EXPIRES_AT_MUST_BE_FUTURE, {
        expiresAt: expiresAt.toISOString()
      })
    }

    await this.apiKeyRepository.revoke({
      apiKeyId: currentApiKey.id,
      revokedBy: command.operatorId
    })

    const { keyCode, secret, hashedValue } = generateApiKeyMaterial()
    const apiKey = await this.apiKeyRepository.create({
      serviceAccountId: currentApiKey.serviceAccountId,
      keyCode,
      hashedValue,
      expiresAt,
      createdBy: command.operatorId
    })

    return new CreatedApiKeyResult(apiKey, secret)
  }
}
