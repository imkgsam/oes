/** ItemStructureType captures the only frozen phase 1 structure categories. */
export enum ItemStructureType {
  SINGLE = 'SINGLE',
  BUNDLE = 'BUNDLE'
}

/** ItemNatureType captures the only frozen phase 1 nature categories. */
export enum ItemNatureType {
  PHYSICAL = 'PHYSICAL',
  VIRTUAL = 'VIRTUAL',
  SERVICE = 'SERVICE'
}

/** ItemStatus keeps phase 1 lifecycle semantics to the minimal active or inactive summary. */
export enum ItemStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE'
}

export interface ItemCapabilitiesProps {
  sellable: boolean
  purchasable: boolean
  stockable: boolean
  manufacturable: boolean
}

/** ItemCapabilities groups the frozen phase 1 capability set and exposes replacement-friendly helpers. */
export class ItemCapabilities {
  constructor(
    public readonly sellable: boolean,
    public readonly purchasable: boolean,
    public readonly stockable: boolean,
    public readonly manufacturable: boolean
  ) {}

  /** none creates the default empty capability set for new items. */
  static none(): ItemCapabilities {
    return new ItemCapabilities(false, false, false, false)
  }

  /** from rebuilds the capability value object from a plain shape. */
  static from(input: Partial<ItemCapabilitiesProps> = {}): ItemCapabilities {
    return new ItemCapabilities(
      Boolean(input.sellable),
      Boolean(input.purchasable),
      Boolean(input.stockable),
      Boolean(input.manufacturable)
    )
  }

  /** toPrimitives flattens the capability value object for persistence and gRPC presentation. */
  toPrimitives(): ItemCapabilitiesProps {
    return {
      sellable: this.sellable,
      purchasable: this.purchasable,
      stockable: this.stockable,
      manufacturable: this.manufacturable
    }
  }
}
