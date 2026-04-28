import { Allow } from 'class-validator'
import { ItemCapabilities } from '../../domain/value-objects/item.value-objects'

/** SetItemCapabilitiesCommand captures the full replacement capability payload. */
export class SetItemCapabilitiesCommand {
  @Allow()
  public readonly input: {
    tenantId: string
    itemId: string
    capabilities: ItemCapabilities
  }

  constructor(input: { tenantId: string; itemId: string; capabilities: ItemCapabilities }) {
    this.input = input
  }

  get tenantId(): string {
    return this.input.tenantId
  }
  get itemId(): string {
    return this.input.itemId
  }
  get capabilities(): ItemCapabilities {
    return this.input.capabilities
  }
}
