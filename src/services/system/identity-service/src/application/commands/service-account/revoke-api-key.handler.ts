import { Inject } from '@nestjs/common'
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { ExceptionFactory } from '@oes/common/exceptions'
import { CheckResourceService } from '../../authorization'
import {
  API_KEY_STATUSES,
  IDENTITY_API_KEY_ALREADY_REVOKED,
  IDENTITY_API_KEY_NOT_FOUND,
  IDENTITY_SERVICE_ACCOUNT_NOT_FOUND,
  SYMBOLS
} from '../../../common/constants'
import { ApiKeyEntity } from '../../../domain/entities/api-key.entity'
import { ApiKeyRepository } from '../../../domain/repositories/api-key.repository'
import { ServiceAccountRepository } from '../../../domain/repositories/service-account.repository'
import { RevokeApiKeyCommand } from './revoke-api-key.command'

@CommandHandler(RevokeApiKeyCommand)
export class RevokeApiKeyHandler
  implements ICommandHandler<RevokeApiKeyCommand, ApiKeyEntity>
{
  constructor(
    @Inject(SYMBOLS.REPO.API_KEY)
    private readonly apiKeyRepository: ApiKeyRepository,
    @Inject(SYMBOLS.REPO.SERVICE_ACCOUNT)
    private readonly serviceAccountRepository: ServiceAccountRepository,
    private readonly checkResourceService: CheckResourceService
  ) {}

  async execute(command: RevokeApiKeyCommand): Promise<ApiKeyEntity> {
    const apiKey = await this.apiKeyRepository.findById(command.apiKeyId)
    if (!apiKey) {
      throw ExceptionFactory.domain(IDENTITY_API_KEY_NOT_FOUND, {
        apiKeyId: command.apiKeyId
      })
    }

    const serviceAccount = await this.serviceAccountRepository.findById(apiKey.serviceAccountId)
    if (!serviceAccount) {
      throw ExceptionFactory.domain(IDENTITY_SERVICE_ACCOUNT_NOT_FOUND, {
        serviceAccountId: apiKey.serviceAccountId
      })
    }

    this.checkResourceService.checkApiKey(command.operatorScope, {
      resourceId: apiKey.id,
      tenantId: serviceAccount.tenantId
    })

    if (apiKey.status === API_KEY_STATUSES.REVOKED) {
      throw ExceptionFactory.domain(IDENTITY_API_KEY_ALREADY_REVOKED, {
        apiKeyId: command.apiKeyId
      })
    }

    return this.apiKeyRepository.revoke({
      apiKeyId: command.apiKeyId,
      revokedBy: command.operatorId
    })
  }
}
