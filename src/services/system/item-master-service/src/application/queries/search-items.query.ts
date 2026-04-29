import { Allow } from 'class-validator'
import { ItemCapabilitiesProps } from '../../domain/value-objects/item.value-objects'

/** SearchItemsQuery captures the frozen phase 1 catalog search filters and pagination controls. */
export class SearchItemsQuery {
  @Allow()
  public readonly input: {
    tenantId: string
    keyword?: string
    structureType?: number
    natureType?: number
    capabilityFilters?: Partial<ItemCapabilitiesProps>
    status?: number
    categoryId?: string
    includeDescendants?: boolean
    page?: number
    pageSize?: number
  }

  @Allow()
  public readonly tenantId: string

  @Allow()
  public readonly keyword?: string

  @Allow()
  public readonly structureType?: number

  @Allow()
  public readonly natureType?: number

  @Allow()
  public readonly capabilityFilters?: Partial<ItemCapabilitiesProps>

  @Allow()
  public readonly status?: number

  @Allow()
  public readonly categoryId?: string

  @Allow()
  public readonly includeDescendants?: boolean

  @Allow()
  public readonly page?: number

  @Allow()
  public readonly pageSize?: number

  constructor(input: {
    tenantId: string
    keyword?: string
    structureType?: number
    natureType?: number
    capabilityFilters?: Partial<ItemCapabilitiesProps>
    status?: number
    categoryId?: string
    includeDescendants?: boolean
    page?: number
    pageSize?: number
  }) {
    this.input = input
    this.tenantId = input.tenantId
    this.keyword = input.keyword
    this.structureType = input.structureType
    this.natureType = input.natureType
    this.capabilityFilters = input.capabilityFilters
    this.status = input.status
    this.categoryId = input.categoryId
    this.includeDescendants = input.includeDescendants
    this.page = input.page
    this.pageSize = input.pageSize
  }
}
