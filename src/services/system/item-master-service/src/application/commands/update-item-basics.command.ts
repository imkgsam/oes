import { Allow } from 'class-validator'
import { ItemNatureType, ItemStructureType } from '../../domain/value-objects/item.value-objects'

/** UpdateItemBasicsCommand captures the only mutable phase 1 basic fields plus raw extras for contract rejection. */
export class UpdateItemBasicsCommand {
  @Allow()
  public readonly input: {
    tenantId: string
    itemId: string
    itemCode: string
    itemName: string
    structureType?: ItemStructureType
    natureType?: ItemNatureType
  }

  constructor(input: {
    tenantId: string
    itemId: string
    itemCode: string
    itemName: string
    structureType?: ItemStructureType
    natureType?: ItemNatureType
  }) {
    this.input = input
  }

  get tenantId(): string {
    return this.input.tenantId
  }
  get itemId(): string {
    return this.input.itemId
  }
  get itemCode(): string {
    return this.input.itemCode
  }
  get itemName(): string {
    return this.input.itemName
  }
  get structureType(): ItemStructureType | undefined {
    return this.input.structureType
  }
  get natureType(): ItemNatureType | undefined {
    return this.input.natureType
  }
}
