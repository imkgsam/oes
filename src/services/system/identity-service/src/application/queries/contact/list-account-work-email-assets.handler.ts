import { Inject } from '@nestjs/common'
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { CONTACT_ASSET_TYPES, SYMBOLS } from '../../../common/constants'
import { AccountContactAssetEntity } from '../../../domain/entities/account-contact-asset.entity'
import { AccountContactAssetRepository } from '../../../domain/repositories/account-contact-asset.repository'
import { ListAccountWorkEmailAssetsQuery } from './list-account-work-email-assets.query'

@QueryHandler(ListAccountWorkEmailAssetsQuery)
export class ListAccountWorkEmailAssetsHandler
  implements IQueryHandler<ListAccountWorkEmailAssetsQuery, AccountContactAssetEntity[]>
{
  constructor(
    @Inject(SYMBOLS.REPO.ACCOUNT_CONTACT_ASSET)
    private readonly accountContactAssetRepository: AccountContactAssetRepository
  ) {}

  execute(query: ListAccountWorkEmailAssetsQuery): Promise<AccountContactAssetEntity[]> {
    return this.accountContactAssetRepository.listByAccountIdAndType(
      query.accountId,
      CONTACT_ASSET_TYPES.WORK_EMAIL
    )
  }
}
