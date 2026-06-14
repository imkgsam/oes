import { Allow } from 'class-validator'
import {
  CrmAccountLifecycleStage,
  CrmAccountRecordStatus
} from '../../domain/models/crm-records'

export interface ListCrmAccountsQueryInput {
  tenantId: string
  keyword?: string | null
  lifecycleStage?: CrmAccountLifecycleStage | null
  recordStatus?: CrmAccountRecordStatus | null
  ownerAccountId?: string | null
  page?: number
  pageSize?: number
}

/** ListCrmAccountsQuery carries tenant-scoped CRM P1 account directory filters. */
export class ListCrmAccountsQuery {
  @Allow()
  readonly input: ListCrmAccountsQueryInput

  constructor(input: ListCrmAccountsQueryInput) {
    this.input = input
  }
}
