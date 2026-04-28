import { Allow } from 'class-validator'

/** SearchSelectableCustomersQuery carries the CRM selector read filters frozen for phase 1 downstream use. */
export class SearchSelectableCustomersQuery {
  @Allow()
  public readonly input: {
    tenantId: string
    keyword?: string
    page?: number
    pageSize?: number
  }

  constructor(input: { tenantId: string; keyword?: string; page?: number; pageSize?: number }) {
    this.input = input
  }
}
