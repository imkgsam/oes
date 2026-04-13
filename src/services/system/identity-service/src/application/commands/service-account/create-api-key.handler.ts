import { Inject } from '@nestjs/common'
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { ExceptionFactory } from '@oes/common/exceptions'
import { CheckResourceService } from '../../authorization'
import {
  API_KEY_STATUSES,
  IDENTITY_API_KEY_EXPIRES_AT_MUST_BE_FUTURE,
  IDENTITY_SERVICE_ACCOUNT_DISABLED,
  IDENTITY_SERVICE_ACCOUNT_NOT_FOUND,
  MACHINE_PRINCIPAL_STATUSES,
  SYMBOLS
} from '../../../common/constants'
import { ApiKeyEntity } from '../../../domain/entities/api-key.entity'
import { ApiKeyRepository } from '../../../domain/repositories/api-key.repository'
import { ServiceAccountRepository } from '../../../domain/repositories/service-account.repository'
import { generateApiKeyMaterial } from './api-key-support'
import { CreateApiKeyCommand } from './create-api-key.command'

export class CreatedApiKeyResult {
  constructor(
    public readonly apiKey: ApiKeyEntity,
    public readonly secret: string
  ) {}
}

@CommandHandler(CreateApiKeyCommand)
export class CreateApiKeyHandler
  implements ICommandHandler<CreateApiKeyCommand, CreatedApiKeyResult>
{
  constructor(
    @Inject(SYMBOLS.REPO.SERVICE_ACCOUNT)
    private readonly serviceAccountRepository: ServiceAccountRepository,
    @Inject(SYMBOLS.REPO.API_KEY)
    private readonly apiKeyRepository: ApiKeyRepository,
    private readonly checkResourceService: CheckResourceService
  ) {}

  async execute(command: CreateApiKeyCommand): Promise<CreatedApiKeyResult> {
    const serviceAccount = await this.serviceAccountRepository.findById(command.serviceAccountId)
    if (!serviceAccount) {
      throw ExceptionFactory.domain(IDENTITY_SERVICE_ACCOUNT_NOT_FOUND, {
        serviceAccountId: command.serviceAccountId
      })
    }

    this.checkResourceService.checkServiceAccount(command.operatorScope, {
      resourceId: serviceAccount.id,
      tenantId: serviceAccount.tenantId
    })

    if (serviceAccount.status !== MACHINE_PRINCIPAL_STATUSES.ACTIVE) {
      throw ExceptionFactory.domain(IDENTITY_SERVICE_ACCOUNT_DISABLED, {
        serviceAccountId: command.serviceAccountId,
        status: serviceAccount.status
      })
    }

    const expiresAt = command.expiresAt ? new Date(command.expiresAt) : undefined
    if (expiresAt && expiresAt.getTime() <= Date.now()) {
      throw ExceptionFactory.domain(IDENTITY_API_KEY_EXPIRES_AT_MUST_BE_FUTURE, {
        expiresAt: command.expiresAt
      })
    }

    const { keyCode, secret, hashedValue } = generateApiKeyMaterial()

    const apiKey = await this.apiKeyRepository.create({
      serviceAccountId: command.serviceAccountId,
      keyCode,
      hashedValue,
      expiresAt,
      createdBy: command.operatorId
    })

    if (apiKey.status !== API_KEY_STATUSES.ACTIVE) {
      throw new Error('Created API key must be ACTIVE')
    }

    return new CreatedApiKeyResult(apiKey, secret)
  }
}
