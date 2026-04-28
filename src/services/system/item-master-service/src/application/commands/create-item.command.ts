import { Allow } from 'class-validator'
import { ItemNatureType, ItemStructureType } from '../../domain/value-objects/item.value-objects'

/** CreateItemCommand captures the full phase 1 item creation intent. */
export class CreateItemCommand {
  @Allow()
  public readonly input: {
    tenantId: string
    itemCode: string
    itemName: string
    structureType: ItemStructureType
    natureType: ItemNatureType
  }

  constructor(input: {
    tenantId: string
    itemCode: string
    itemName: string
    structureType: ItemStructureType
    natureType: ItemNatureType
  }) {
    this.input = input
  }

  get tenantId(): string {
    return this.input.tenantId
  }
  get itemCode(): string {
    return this.input.itemCode
  }
  get itemName(): string {
    return this.input.itemName
  }
  get structureType(): ItemStructureType {
    return this.input.structureType
  }
  get natureType(): ItemNatureType {
    return this.input.natureType
  }
}
