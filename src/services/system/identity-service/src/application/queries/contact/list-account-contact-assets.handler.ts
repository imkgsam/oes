import { Inject } from '@nestjs/common'
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { SYMBOLS } from '../../../common/constants'
import { AccountContactAssetRepository } from '../../../domain/repositories/account-contact-asset.repository'
import { AccountContactAssetView } from './contact-query.result'
import { toAccountContactAssetView } from './contact-asset-query.mapper'
import { ListAccountContactAssetsQuery } from './list-account-contact-assets.query'

// ListAccountContactAssetsHandler returns Contact Asset candidates for account management and BusinessCard config.
@QueryHandler(ListAccountContactAssetsQuery)
export class ListAccountContactAssetsHandler
  implements IQueryHandler<ListAccountContactAssetsQuery, AccountContactAssetView[]>
{
  constructor(
    @Inject(SYMBOLS.REPO.ACCOUNT_CONTACT_ASSET)
    private readonly accountContactAssetRepository: AccountContactAssetRepository
  ) {}

  async execute(query: ListAccountContactAssetsQuery): Promise<AccountContactAssetView[]> {
    const assets = await this.accountContactAssetRepository.listByAccountContactAssetFilter({
      tenantId: query.tenantId,
      accountId: query.accountId,
      employeeId: query.employeeId,
      types: query.types,
      statuses: query.statuses,
      ownership: query.ownership
    })

    return assets.map(toAccountContactAssetView)
  }
}
