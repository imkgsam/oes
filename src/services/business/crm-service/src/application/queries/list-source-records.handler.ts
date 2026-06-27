import { Inject, Injectable } from '@nestjs/common'
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { TOKENS } from '../../common/constants/tokens'
import { CrmSourceRecord } from '../../domain/models/crm-records'
import { CrmAccountRepository } from '../../domain/repositories/crm-account.repository'
import { ListSourceRecordsQuery } from './list-source-records.query'

export interface ListSourceRecordsResult {
  sourceRecords: CrmSourceRecord[]
}

/** ListSourceRecordsHandler returns CRM source evidence for one tenant-scoped account. */
@Injectable()
@QueryHandler(ListSourceRecordsQuery)
export class ListSourceRecordsHandler implements IQueryHandler<ListSourceRecordsQuery, ListSourceRecordsResult> {
  constructor(
    @Inject(TOKENS.CRM_ACCOUNT_REPOSITORY)
    private readonly accountRepository: CrmAccountRepository
  ) {}

  /** execute reads source records without widening account visibility beyond the tenant boundary. */
  async execute(query: ListSourceRecordsQuery): Promise<ListSourceRecordsResult> {
    return {
      sourceRecords: await this.accountRepository.listSourceRecords(query.tenantId, query.crmAccountId)
    }
  }
}
