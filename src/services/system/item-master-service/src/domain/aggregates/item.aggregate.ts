import { ExceptionFactory } from '@oes/common/exceptions'
import {
  ITEM_MASTER_FAILED_PRECONDITION,
  ITEM_MASTER_INVALID_ARGUMENT
} from '../../common/errors/item-master.errors'
import {
  ItemCapabilities,
  ItemCapabilitiesProps,
  ItemNatureType,
  ItemStatus,
  ItemStructureType
} from '../value-objects/item.value-objects'

export interface ItemState {
  id: string
  tenantId: string
  itemCode: string
  itemName: string
  structureType: ItemStructureType
  natureType: ItemNatureType
  status: ItemStatus
  capabilities: ItemCapabilities
}

/** Item models the tenant-scoped item master aggregate and enforces phase 1 classification and capability rules. */
export class Item {
  private constructor(private readonly state: ItemState) {}

  /** create builds a new phase 1 item aggregate with immutable classification and empty capabilities. */
  static create(input: {
    id: string
    tenantId: string
    itemCode: string
    itemName: string
    structureType: ItemStructureType
    natureType: ItemNatureType
  }): Item {
    assertNonBlank(input.tenantId, 'tenantId')
    assertNonBlank(input.itemCode, 'itemCode')
    assertNonBlank(input.itemName, 'itemName')

    return new Item({
      id: input.id,
      tenantId: input.tenantId.trim(),
      itemCode: input.itemCode.trim(),
      itemName: input.itemName.trim(),
      structureType: input.structureType,
      natureType: input.natureType,
      status: ItemStatus.ACTIVE,
      capabilities: ItemCapabilities.none()
    })
  }

  /** reconstitute rebuilds an aggregate from already validated persistence state. */
  static reconstitute(state: ItemState): Item {
    return new Item({
      ...state,
      capabilities: ItemCapabilities.from(state.capabilities.toPrimitives())
    })
  }

  get id(): string {
    return this.state.id
  }

  get tenantId(): string {
    return this.state.tenantId
  }

  get itemCode(): string {
    return this.state.itemCode
  }

  get itemName(): string {
    return this.state.itemName
  }

  get structureType(): ItemStructureType {
    return this.state.structureType
  }

  get natureType(): ItemNatureType {
    return this.state.natureType
  }

  get status(): ItemStatus {
    return this.state.status
  }

  get capabilities(): ItemCapabilities {
    return this.state.capabilities
  }

  /** isBundle reports whether the item is the only phase 1 structure type allowed to own composition. */
  isBundle(): boolean {
    return this.state.structureType === ItemStructureType.BUNDLE
  }

  /** isPhysical reports whether the item may carry stockable or manufacturable capabilities in phase 1. */
  isPhysical(): boolean {
    return this.state.natureType === ItemNatureType.PHYSICAL
  }

  /** updateBasics replaces the only mutable phase 1 basic fields: item_code and item_name. */
  updateBasics(input: { itemCode: string; itemName: string }): Item {
    assertNonBlank(input.itemCode, 'itemCode')
    assertNonBlank(input.itemName, 'itemName')
    this.state.itemCode = input.itemCode.trim()
    this.state.itemName = input.itemName.trim()
    return this
  }

  /** replaceCapabilities applies the full replacement capability contract and guards PHYSICAL-only flags. */
  replaceCapabilities(capabilities: ItemCapabilities): Item {
    if ((capabilities.stockable || capabilities.manufacturable) && !this.isPhysical()) {
      throw ExceptionFactory.domain(ITEM_MASTER_FAILED_PRECONDITION, {
        reason: 'stockable/manufacturable require PHYSICAL item'
      })
    }

    this.state.capabilities = ItemCapabilities.from(capabilities.toPrimitives())
    return this
  }

  /** changeStatus switches the minimal phase 1 lifecycle summary while supporting no-op transitions. */
  changeStatus(targetStatus: ItemStatus): Item {
    this.state.status = targetStatus
    return this
  }

  /** toPrimitives exposes aggregate state for persistence and gRPC presentation. */
  toPrimitives(): Omit<ItemState, 'capabilities'> & { capabilities: ItemCapabilitiesProps } {
    return {
      ...this.state,
      capabilities: this.state.capabilities.toPrimitives()
    }
  }
}

/** assertNonBlank rejects empty strings before they can become aggregate state. */
function assertNonBlank(value: string, field: string): void {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw ExceptionFactory.domain(ITEM_MASTER_INVALID_ARGUMENT, {
      field
    })
  }
}
