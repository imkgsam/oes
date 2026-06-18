const ITEM_MODEL_KIND_PHYSICAL = 1;
const ITEM_MODEL_TYPE_RAW_MATERIAL = 6;
const ITEM_TYPE_STANDARD = 1;

// createPurchasableSmokeItem provisions the minimal Contract V2 ItemModel -> Item chain needed by live smoke flows.
export async function createPurchasableSmokeItem(itemManagement, seed, input) {
  const createItemModel = itemManagement?.createItemModel;
  const createItem = itemManagement?.createItem;
  const setItemCapabilities = itemManagement?.setItemCapabilities;
  if (
    typeof createItemModel !== 'function' ||
    typeof createItem !== 'function' ||
    typeof setItemCapabilities !== 'function'
  ) {
    throw new Error('item-master-service unavailable');
  }

  const createModelResponse = await createItemModel(createItemModelRequest(seed, input));
  const itemModelId = createModelResponse?.itemModel?.itemModelId ?? createModelResponse?.itemModelId;
  if (!itemModelId) {
    throw new Error('item-master createItemModel did not return itemModelId');
  }

  const createItemResponse = await createItem(createItemRequest(seed, input, itemModelId));
  const itemId = createItemResponse?.item?.itemId ?? createItemResponse?.itemId;
  if (!itemId) {
    throw new Error('item-master createItem did not return itemId');
  }

  const capabilitiesResponse = await setItemCapabilities(createSetCapabilitiesRequest(seed, itemId));
  if (!capabilitiesResponse?.item?.capabilities?.purchasable) {
    throw new Error('item-master setItemCapabilities did not enable purchasable=true');
  }

  return { itemModelId, itemId };
}

// createItemModelRequest creates the lightweight ItemModel required before any Contract V2 Item can exist.
export function createItemModelRequest(seed, input) {
  return {
    tenantId: seed.tenantId,
    modelCode: requireText(input?.modelCode, 'modelCode'),
    modelName: requireText(input?.modelName, 'modelName'),
    modelKind: input?.modelKind ?? ITEM_MODEL_KIND_PHYSICAL,
    modelType: input?.modelType ?? ITEM_MODEL_TYPE_RAW_MATERIAL,
    capabilities: {
      purchasable: true,
      ...(input?.modelCapabilities ?? {})
    }
  };
}

// createItemRequest creates one STANDARD Item under the freshly created smoke ItemModel.
export function createItemRequest(seed, input, itemModelId) {
  return {
    tenantId: seed.tenantId,
    itemModelId: requireText(itemModelId, 'itemModelId'),
    itemCode: requireText(input?.itemCode, 'itemCode'),
    itemName: requireText(input?.itemName, 'itemName'),
    itemType: input?.itemType ?? ITEM_TYPE_STANDARD
  };
}

// createSetCapabilitiesRequest marks the smoke Item as purchasable for SRM offering and Procurement conversion validation.
export function createSetCapabilitiesRequest(seed, itemId) {
  return {
    tenantId: seed.tenantId,
    itemId: requireText(itemId, 'itemId'),
    capabilities: {
      purchasable: true
    }
  };
}

// requireText normalizes smoke fixture inputs before they cross a gRPC contract boundary.
function requireText(value, field) {
  const text = `${value ?? ''}`.trim();
  if (!text) {
    throw new Error(`item-master smoke fixture missing ${field}`);
  }
  return text;
}
