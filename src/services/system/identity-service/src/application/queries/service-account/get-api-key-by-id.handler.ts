import { Inject } from '@nestjs/common'
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { CheckResourceService } from '../../authorization'
import { ApiKeyEntity } from '../../../domain/entities/api-key.entity'
import { ApiKeyRepository } from '../../../domain/repositories/api-key.repository'
import { ServiceAccountRepository } from '../../../domain/repositories/service-account.repository'
import { SYMBOLS } from '../../../common/constants'
import { ApiKeyView } from './service-account-query.result'
import { GetApiKeyByIdQuery } from './get-api-key-by-id.query'

@QueryHandler(GetApiKeyByIdQuery)
export class GetApiKeyByIdHandler
  implements IQueryHandler<GetApiKeyByIdQuery, ApiKeyView | null>
{
  constructor(
    @Inject(SYMBOLS.REPO.API_KEY)
    private readonly apiKeyRepository: ApiKeyRepository,
    @Inject(SYMBOLS.REPO.SERVICE_ACCOUNT)
    private readonly serviceAccountRepository: ServiceAccountRepository,
    private readonly checkResourceService: CheckResourceService
  ) {}

  async execute(query: GetApiKeyByIdQuery): Promise<ApiKeyView | null> {
    const apiKey = await this.apiKeyRepository.findById(query.apiKeyId)
    if (!apiKey) {
      return null
    }

    const serviceAccount = await this.serviceAccountRepository.findById(apiKey.serviceAccountId)
    if (!serviceAccount) {
      return null
    }

    this.checkResourceService.checkApiKey(query.operatorScope, {
      resourceId: apiKey.id,
      tenantId: serviceAccount.tenantId
    })

    return toApiKeyView(apiKey)
  }
}

function toApiKeyView(apiKey: ApiKeyEntity): ApiKeyView {
  return {
    id: apiKey.id,
    serviceAccountId: apiKey.serviceAccountId,
    keyCode: apiKey.keyCode,
    status: apiKey.status,
    expiresAt: apiKey.expiresAt,
    lastUsedAt: apiKey.lastUsedAt,
    createdAt: apiKey.createdAt,
    updatedAt: apiKey.updatedAt,
    createdBy: apiKey.createdBy,
    revokedAt: apiKey.revokedAt,
    revokedBy: apiKey.revokedBy
  }
}
