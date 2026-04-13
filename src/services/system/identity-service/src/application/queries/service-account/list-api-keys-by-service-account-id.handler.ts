import { Inject } from '@nestjs/common'
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import {
  AuthorizationQueryScopeService,
  TenantQueryScope
} from '../../authorization'
import { ApiKeyEntity } from '../../../domain/entities/api-key.entity'
import { ApiKeyRepository } from '../../../domain/repositories/api-key.repository'
import { SYMBOLS } from '../../../common/constants'
import { ApiKeyView } from './service-account-query.result'
import { ListApiKeysByServiceAccountIdQuery } from './list-api-keys-by-service-account-id.query'

@QueryHandler(ListApiKeysByServiceAccountIdQuery)
export class ListApiKeysByServiceAccountIdHandler
  implements IQueryHandler<ListApiKeysByServiceAccountIdQuery, ApiKeyView[]>
{
  constructor(
    @Inject(SYMBOLS.REPO.API_KEY)
    private readonly apiKeyRepository: ApiKeyRepository,
    private readonly authorizationQueryScopeService: AuthorizationQueryScopeService
  ) {}

  async execute(query: ListApiKeysByServiceAccountIdQuery): Promise<ApiKeyView[]> {
    const queryScope = this.authorizationQueryScopeService.build<TenantQueryScope>({
      resource: 'api_key',
      action: 'list',
      operatorScope: query.operatorScope
    })

    const apiKeys = await this.apiKeyRepository.listByServiceAccountId(
      query.serviceAccountId,
      queryScope
    )
    return apiKeys.map(toApiKeyView)
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
