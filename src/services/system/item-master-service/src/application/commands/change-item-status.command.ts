import { Allow } from 'class-validator'
import { ItemStatus } from '../../domain/value-objects/item.value-objects'

/** ChangeItemStatusCommand captures the minimal phase 1 status transition intent. */
export class ChangeItemStatusCommand {
  @Allow()
  public readonly input: {
    tenantId: string
    itemId: string
    targetStatus: ItemStatus
  }

  constructor(input: { tenantId: string; itemId: string; targetStatus: ItemStatus }) {
    this.input = input
  }

  get tenantId(): string {
    return this.input.tenantId
  }
  get itemId(): string {
    return this.input.itemId
  }
  get targetStatus(): ItemStatus {
    return this.input.targetStatus
  }
}
