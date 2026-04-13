import { Inject } from '@nestjs/common'
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import {
  AuthorizationQueryScopeService,
  TenantQueryScope
} from '../../authorization'
import { CONTACT_ASSET_TYPES, SYMBOLS } from '../../../common/constants'
import { AccountContactAssetEntity } from '../../../domain/entities/account-contact-asset.entity'
import { AccountContactAssetRepository } from '../../../domain/repositories/account-contact-asset.repository'
import { AccountContactAssetView } from './contact-query.result'
import { ListAccountWorkPhoneAssetsQuery } from './list-account-work-phone-assets.query'

@QueryHandler(ListAccountWorkPhoneAssetsQuery)
export class ListAccountWorkPhoneAssetsHandler
  implements IQueryHandler<ListAccountWorkPhoneAssetsQuery, AccountContactAssetView[]>
{
  constructor(
    @Inject(SYMBOLS.REPO.ACCOUNT_CONTACT_ASSET)
    private readonly accountContactAssetRepository: AccountContactAssetRepository,
    private readonly authorizationQueryScopeService: AuthorizationQueryScopeService
  ) {}

  async execute(query: ListAccountWorkPhoneAssetsQuery): Promise<AccountContactAssetView[]> {
    const queryScope = this.authorizationQueryScopeService.build<TenantQueryScope>({
      resource: 'account_contact_asset',
      action: 'list',
      operatorScope: query.operatorScope
    })

    const assets = await this.accountContactAssetRepository.listByAccountIdAndType(
      query.accountId,
      CONTACT_ASSET_TYPES.WORK_PHONE,
      queryScope
    )

    return assets.map(toAccountContactAssetView)
  }
}

function toAccountContactAssetView(asset: AccountContactAssetEntity): AccountContactAssetView {
  return {
    id: asset.id,
    tenantId: asset.tenantId,
    accountId: asset.accountId,
    type: asset.type,
    value: asset.value,
    status: asset.status,
    isPrimary: asset.isPrimary,
    assignedAt: asset.assignedAt,
    revokedAt: asset.revokedAt
  }
}
