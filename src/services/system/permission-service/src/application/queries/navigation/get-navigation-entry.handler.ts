import { Inject } from '@nestjs/common'
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { ExceptionFactory } from '@oes/common/exceptions'
import { NAVIGATION_ENTRY_NOT_FOUND } from '../../../common/constants/exception-enums/navigation.errors'
import { SYMBOLS } from '../../../common/constants/symbols'
import { NavigationEntry } from '../../../domain/aggregates/navigation-entry.aggregate'
import { NavigationRepository } from '../../../domain/repositories/navigation.repository'
import { GetNavigationEntryQuery } from './get-navigation-entry.query'

@QueryHandler(GetNavigationEntryQuery)
export class GetNavigationEntryHandler implements IQueryHandler<GetNavigationEntryQuery> {
  constructor(
    @Inject(SYMBOLS.REPO.NAVIGATION)
    private readonly navigationRepo: NavigationRepository
  ) {}

  async execute(query: GetNavigationEntryQuery): Promise<NavigationEntry> {
    const entry = await this.navigationRepo.findEntryByKey(query.entryKey)
    if (!entry) {
      throw ExceptionFactory.domain(NAVIGATION_ENTRY_NOT_FOUND)
    }
    return entry
  }
}
