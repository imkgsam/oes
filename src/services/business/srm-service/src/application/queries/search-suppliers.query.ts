import { SupplierStatus } from '../../domain/models/srm-records'
import { Allow } from 'class-validator'

/** SearchSuppliersQuery carries the paged SRM supplier-directory filters frozen for phase 1. */
export class SearchSuppliersQuery {
  @Allow()
  public readonly input: {
    tenantId: string
    keyword?: string
    status?: SupplierStatus
    tenantPartyId?: string
    page?: number
    pageSize?: number
  }

  constructor(input: {
    tenantId: string
    keyword?: string
    status?: SupplierStatus
    tenantPartyId?: string
    page?: number
    pageSize?: number
  }) {
    this.input = input
  }
}
