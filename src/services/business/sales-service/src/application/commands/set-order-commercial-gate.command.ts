import { Allow } from 'class-validator'
import { SalesCommercialGateName } from '../../domain/models/sales-records'

/** SetOrderCommercialGateCommand captures one explicit production, stocking, or shipping gate decision. */
export class SetOrderCommercialGateCommand {
  @Allow()
  public readonly input: {
    tenantId: string
    salesOrderId: string
    gateName: SalesCommercialGateName
    allowed: boolean
  }

  constructor(input: {
    tenantId: string
    salesOrderId: string
    gateName: SalesCommercialGateName
    allowed: boolean
  }) {
    this.input = input
  }

  get tenantId(): string {
    return this.input.tenantId
  }

  get salesOrderId(): string {
    return this.input.salesOrderId
  }

  get gateName(): SalesCommercialGateName {
    return this.input.gateName
  }

  get allowed(): boolean {
    return this.input.allowed
  }
}
