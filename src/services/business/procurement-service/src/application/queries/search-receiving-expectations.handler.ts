import { Inject, Injectable } from '@nestjs/common'
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { TOKENS } from '../../common/constants/tokens'
import { ReceivingRepository } from '../../domain/repositories/receiving.repository'
import { SearchReceivingExpectationsQuery } from './search-receiving-expectations.query'

/** SearchReceivingExpectationsHandler returns the procurement expectation page without mutating receiving truth. */
@Injectable()
@QueryHandler(SearchReceivingExpectationsQuery)
export class SearchReceivingExpectationsHandler
  implements
    IQueryHandler<
      SearchReceivingExpectationsQuery,
      { receivingExpectations: Awaited<ReturnType<ReceivingRepository['search']>>['items']; total: number; page: number; pageSize: number }
    >
{
  constructor(
    @Inject(TOKENS.RECEIVING_REPOSITORY)
    private readonly receivingRepository: ReceivingRepository
  ) {}

  async execute(query: SearchReceivingExpectationsQuery) {
    const page = await this.receivingRepository.search(query.input)
    return {
      receivingExpectations: page.items,
      total: page.total,
      page: page.page,
      pageSize: page.pageSize
    }
  }
}
