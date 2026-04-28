export const ITEM_MASTER_MANAGEMENT_PERMISSION_CODES = {
  LIST_ITEM: 'item_master.item.list',
  VIEW_ITEM_DETAIL: 'item_master.item.get_by_id',
  CREATE_ITEM: 'item_master.item.create',
  UPDATE_ITEM_BASICS: 'item_master.item.update_basics',
  UPDATE_ITEM_STATUS: 'item_master.item.update_status',
  SET_ITEM_CAPABILITIES: 'item_master.item.set_capabilities',
  SET_ITEM_COMPOSITION: 'item_master.item.set_composition',
  LIST_SUPPLIER_ITEM_MAPPINGS: 'item_master.supplier_item_mapping.list_by_item',
  UPSERT_SUPPLIER_ITEM_MAPPING: 'item_master.supplier_item_mapping.upsert'
} as const
