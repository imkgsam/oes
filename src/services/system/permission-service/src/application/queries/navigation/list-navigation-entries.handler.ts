import { Inject } from '@nestjs/common'
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { SYMBOLS } from '../../../common/constants/symbols'
import { NavigationRepository } from '../../../domain/repositories/navigation.repository'
import { ListNavigationEntriesQuery } from './list-navigation-entries.query'
import { NavigationEntryPageResult } from './navigation-query.result'

@QueryHandler(ListNavigationEntriesQuery)
export class ListNavigationEntriesHandler implements IQueryHandler<ListNavigationEntriesQuery> {
  constructor(
    @Inject(SYMBOLS.REPO.NAVIGATION)
    private readonly navigationRepo: NavigationRepository
  ) {}

  async execute(query: ListNavigationEntriesQuery): Promise<NavigationEntryPageResult> {
    return this.navigationRepo.listEntries({
      page: query.page,
      pageSize: query.pageSize,
      keyword: query.keyword,
      featureKey: query.featureKey,
      terminal: query.terminal,
      enabled: query.enabled
    })
  }
}
