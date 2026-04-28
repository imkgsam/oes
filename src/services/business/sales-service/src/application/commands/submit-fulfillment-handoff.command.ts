import { Allow } from 'class-validator'

/** SubmitFulfillmentHandoffCommand captures one sales-side handoff submission to the future fulfillment boundary. */
export class SubmitFulfillmentHandoffCommand {
  @Allow()
  public readonly input: {
    tenantId: string
    salesOrderId: string
  }

  constructor(input: {
    tenantId: string
    salesOrderId: string
  }) {
    this.input = input
  }

  get tenantId(): string {
    return this.input.tenantId
  }

  get salesOrderId(): string {
    return this.input.salesOrderId
  }
}
