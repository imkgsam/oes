import { CustomerStatus } from '../../domain/models/crm-records'
import { Allow } from 'class-validator'

/** SearchCustomerAccountsQuery carries the paged CRM account-directory filters frozen for phase 1. */
export class SearchCustomerAccountsQuery {
  @Allow()
  public readonly input: {
    tenantId: string
    keyword?: string
    status?: CustomerStatus
    primaryTenantPartyId?: string
    page?: number
    pageSize?: number
  }

  constructor(input: {
    tenantId: string
    keyword?: string
    status?: CustomerStatus
    primaryTenantPartyId?: string
    page?: number
    pageSize?: number
  }) {
    this.input = input
  }
}
