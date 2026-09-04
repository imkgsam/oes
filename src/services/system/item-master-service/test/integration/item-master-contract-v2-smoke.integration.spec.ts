import {
  BomType,
  ItemModelKind,
  ItemModelType,
  ItemType
} from '@oes/common/generated/item_master_service'

/** Contract V2 smoke tests guard the generated item-master symbols used by the runtime. */
describe('item-master Contract V2 generated symbols', () => {
  it('exposes ItemModel, Item, and BOM enum values required by V2 runtime', () => {
    expect(ItemModelKind.ITEM_MODEL_KIND_PHYSICAL).toBeGreaterThan(0)
    expect(ItemModelType.ITEM_MODEL_TYPE_FINISHED_PRODUCT).toBeGreaterThan(0)
    expect(ItemType.ITEM_TYPE_PACKAGED_FINISHED_GOOD).toBeGreaterThan(0)
    expect(BomType.BOM_TYPE_PACKAGING).toBeGreaterThan(0)
  })
})
