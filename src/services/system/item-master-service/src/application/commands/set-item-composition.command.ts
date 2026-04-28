import { Allow } from 'class-validator'

/** SetItemCompositionCommand captures the full replacement component list for one bundle parent. */
export class SetItemCompositionCommand {
  @Allow()
  public readonly input: {
    tenantId: string
    itemId: string
    componentItemIds: string[]
  }

  constructor(input: { tenantId: string; itemId: string; componentItemIds: string[] }) {
    this.input = input
  }

  get tenantId(): string {
    return this.input.tenantId
  }
  get itemId(): string {
    return this.input.itemId
  }
  get componentItemIds(): string[] {
    return this.input.componentItemIds
  }
}
