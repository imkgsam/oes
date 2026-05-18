<script setup lang="ts">
import type { ItemManagementApi } from '#/api'
import type { TableColumnsType } from 'ant-design-vue'

import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'

import { Page } from '@vben/common-ui'
import { IconifyIcon } from '@vben/icons'

import {
  Button,
  Card,
  Checkbox,
  Dropdown,
  Empty,
  Form,
  Input,
  Menu,
  Modal,
  Select,
  SelectOption,
  Space,
  Table,
  Tag
} from 'ant-design-vue'

import {
  changeManagedItemStatusApi,
  createManagedItemApi,
  createManagedItemModelApi,
  getManagedItemModelAttributeRulesApi,
  listManagedAttributeDefinitionsApi,
  listManagedAttributeOptionsApi,
  listManagedBomsApi,
  listManagedItemCategoriesApi,
  listManagedItemModelsApi,
  listManagedItemsApi,
  listManagedPackagingSpecsApi,
  listManagedSupplierItemMappingsApi,
  setManagedItemCapabilitiesApi,
  setManagedItemModelAttributeRulesApi
} from '#/api'
import { useAuthContextStore } from '#/store/auth-context'

const capabilityOptions: ItemManagementApi.ItemCapabilityKey[] = [
  'sellable',
  'purchasable',
  'stockable',
  'manufacturable',
  'assemblable',
  'transformable',
  'packable',
  'packaged'
]
const modelKindOptions: ItemManagementApi.ItemModelKind[] = ['PHYSICAL', 'SERVICE', 'DIGITAL', 'VIRTUAL']
const modelTypeOptions: ItemManagementApi.ItemModelType[] = [
  'FINISHED_PRODUCT',
  'SEMI_FINISHED_PRODUCT',
  'ACCESSORY',
  'PART',
  'SUB_ASSEMBLY',
  'RAW_MATERIAL',
  'PACKAGING_MATERIAL',
  'SERVICE',
  'VIRTUAL_KIT'
]
const itemTypeOptions: ItemManagementApi.ItemType[] = ['STANDARD', 'PACKAGED_FINISHED_GOOD']
type ItemActionKey = 'detail'
type ItemModelActionKey = 'open'

interface TableActionMenuItem<ActionKey extends string> {
  danger?: boolean
  disabled?: boolean
  hidden?: boolean
  key: ActionKey
  label: string
  testId?: string
}

const authContextStore = useAuthContextStore()
const operationColumnTitle = '操作'
const router = useRouter()
const activeTenantId = computed(() => authContextStore.sessionContext?.tenant?.tenantId ?? '')
const canCreateItem = computed(() => authContextStore.actionCodes.includes('item_master.item.create'))
const canCreateItemModel = computed(() => authContextStore.actionCodes.includes('item_master.item_model.create'))
const canBulkManageItems = computed(() =>
  authContextStore.actionCodes.includes('item_master.item.set_capabilities')
  && authContextStore.actionCodes.includes('item_master.item.update_status')
)
const canListAttributes = computed(() => authContextStore.actionCodes.includes('item_master.attribute.list'))
const canManageAttributes = computed(() => authContextStore.actionCodes.includes('item_master.attribute.manage'))
const canListBom = computed(() => authContextStore.actionCodes.includes('item_master.bom.list'))
const canListItems = computed(() => authContextStore.actionCodes.includes('item_master.item.list'))
const canListItemModels = computed(() => authContextStore.actionCodes.includes('item_master.item_model.list'))
const canListPackaging = computed(() => authContextStore.actionCodes.includes('item_master.packaging.list'))
const canListSupplierMappings = computed(() =>
  authContextStore.actionCodes.includes('item_master.supplier_item_mapping.list_by_item')
)
const canViewItemDetail = computed(() => authContextStore.actionCodes.includes('item_master.item.get_by_id'))

const itemModels = ref<ItemManagementApi.ItemModelRecord[]>([])
const itemCategories = ref<ItemManagementApi.ItemCategoryNode[]>([])
const items = ref<ItemManagementApi.ItemSummary[]>([])
const attributeDefinitions = ref<ItemManagementApi.AttributeDefinitionRecord[]>([])
const attributeOptionsByDefinition = ref<Record<string, ItemManagementApi.AttributeOptionRecord[]>>({})
const derivedItems = ref<ItemManagementApi.ItemSummary[]>([])
const itemModelAttributeRules = ref<ItemManagementApi.ItemModelAttributeRuleRecord[]>([])
const relatedBoms = ref<ItemManagementApi.BomRecord[]>([])
const relatedPackagingSpecs = ref<ItemManagementApi.PackagingSpecRecord[]>([])
const supplierMappingsByItemId = ref<Record<string, ItemManagementApi.SupplierItemMappingListEntry[]>>({})
const loading = ref(false)
const modelLoading = ref(false)
const workbenchLoading = ref(false)
const batchGeneratingItems = ref(false)
const bulkUpdatingItems = ref(false)
const modelModalOpen = ref(false)
const selectedItemModelId = ref('')
const selectedDerivedItemIds = ref<string[]>([])
const filters = reactive({
  capabilities: [] as ItemManagementApi.ItemCapabilityKey[],
  categoryId: '',
  itemModelId: '',
  itemType: '' as '' | ItemManagementApi.ItemType,
  keyword: '',
  status: '' as '' | ItemManagementApi.ItemStatus
})
const modelForm = reactive({
  modelCode: '',
  modelKind: 'PHYSICAL' as ItemManagementApi.ItemModelKind,
  modelName: '',
  modelType: 'FINISHED_PRODUCT' as ItemManagementApi.ItemModelType,
  primaryCategoryId: ''
})
const ruleDraft = reactive({
  allowedOptionIds: [] as string[],
  attributeDefinitionId: '',
  required: 'true'
})

const itemColumns = computed<TableColumnsType<ItemManagementApi.ItemSummary>>(() => [
  { dataIndex: 'itemCode', key: 'itemCode', title: 'Item Code', width: 160 },
  { dataIndex: 'itemName', key: 'itemName', title: 'Item Name', width: 220 },
  { dataIndex: 'itemType', key: 'itemType', title: 'Item Type', width: 170 },
  { key: 'itemModel', title: 'ItemModel', width: 220 },
  { key: 'capabilities', title: 'Capabilities', width: 360 },
  { dataIndex: 'status', key: 'status', title: 'Status', width: 120 },
  { key: 'action', title: operationColumnTitle, width: 100 }
])
const modelColumns = computed<TableColumnsType<ItemManagementApi.ItemModelRecord>>(() => [
  { dataIndex: 'modelCode', key: 'modelCode', title: 'Model Code', width: 160 },
  { dataIndex: 'modelName', key: 'modelName', title: 'Model Name', width: 220 },
  { key: 'primaryCategory', title: 'Category', width: 180 },
  { dataIndex: 'modelKind', key: 'modelKind', title: 'Kind', width: 120 },
  { dataIndex: 'modelType', key: 'modelType', title: 'Type', width: 180 },
  { key: 'modelCapabilities', title: 'Defaults', width: 280 },
  { dataIndex: 'status', key: 'status', title: 'Status', width: 120 },
  { key: 'modelAction', title: operationColumnTitle, width: 130 }
])

/** getItemModelActionItems exposes ItemModel row operations for the native Ant Design dropdown. */
function getItemModelActionItems(
  itemModelRecord: Record<string, any>
): TableActionMenuItem<ItemModelActionKey>[] {
  const itemModel = itemModelRecord as ItemManagementApi.ItemModelRecord

  return [
    {
      key: 'open',
      label: '打开',
      testId: `item-model-select-${itemModel.itemModelId}`
    }
  ]
}

/** getItemActionItems exposes Item row operations for the native Ant Design dropdown. */
function getItemActionItems(itemRecord: Record<string, any>): TableActionMenuItem<ItemActionKey>[] {
  const item = itemRecord as ItemManagementApi.ItemSummary

  return [
    {
      hidden: !canViewItemDetail.value,
      key: 'detail',
      label: '详情',
      testId: `item-detail-${item.itemId}`
    }
  ]
}

/** getVisibleTableActionItems filters hidden table actions before handing them to Ant Design Menu. */
function getVisibleTableActionItems<ActionKey extends string>(items: TableActionMenuItem<ActionKey>[]) {
  return items.filter((item) => !item.hidden)
}

const activeItemCount = computed(() => items.value.filter((item) => item.status === 'ACTIVE').length)
const activeModelCount = computed(() => itemModels.value.filter((model) => model.status === 'ACTIVE').length)
const selectedItemModel = computed(
  () => itemModels.value.find((model) => model.itemModelId === selectedItemModelId.value) ?? null
)
const selectedAttributeOptions = computed(
  () => attributeOptionsByDefinition.value[ruleDraft.attributeDefinitionId] ?? []
)
const requiredGenerationRules = computed(() =>
  itemModelAttributeRules.value.filter((rule) => rule.required && rule.allowedOptionIds.length)
)
const editableBulkCapabilityOptions = computed(() => capabilityOptions.filter((capability) => capability !== 'packaged'))
const bulkStatusValue = ref<ItemManagementApi.ItemStatus>('ACTIVE')
const bulkCapabilityForm = reactive<ItemManagementApi.ItemCapabilities>(emptyCapabilities())

/** emptyCapabilities returns the explicit eight-capability V2 shape required by the BFF. */
function emptyCapabilities(): ItemManagementApi.ItemCapabilities {
  return {
    assemblable: false,
    manufacturable: false,
    packable: false,
    packaged: false,
    purchasable: false,
    sellable: false,
    stockable: false,
    transformable: false
  }
}

/** getCapabilityLabels returns enabled capability chips from table slot records with a V2 capability shape. */
function getCapabilityLabels(record: { capabilities?: Partial<ItemManagementApi.ItemCapabilities> }) {
  return capabilityOptions.filter((capability) => record.capabilities?.[capability])
}

/** getExecutionCapabilityLabels excludes derived flags when deciding whether an Item is operationally configured. */
function getExecutionCapabilityLabels(record: { capabilities?: Partial<ItemManagementApi.ItemCapabilities> }) {
  return capabilityOptions.filter((capability) => capability !== 'packaged' && record.capabilities?.[capability])
}

/** getStatusColor maps active/archive state to Ant Design Vue tag colors. */
function getStatusColor(status: string) {
  return status === 'ACTIVE' ? 'green' : 'default'
}

/** getItemLabel returns a compact Item identity label for related ItemModel summaries. */
function getItemLabel(itemId: string) {
  const item = derivedItems.value.find((candidate) => candidate.itemId === itemId)
    ?? items.value.find((candidate) => candidate.itemId === itemId)

  return item ? `${item.itemCode} · ${item.itemName}` : itemId
}

/** getAttributeLabel resolves AttributeDefinition ids for readable ItemModel rules. */
function getAttributeLabel(attributeDefinitionId: string) {
  const definition = attributeDefinitions.value.find(
    (candidate) => candidate.attributeDefinitionId === attributeDefinitionId
  )

  return definition ? `${definition.attributeCode} · ${definition.attributeName}` : attributeDefinitionId
}

/** getOptionLabels resolves AttributeOption ids for readable ItemModel rule chips. */
function getOptionLabels(attributeDefinitionId: string, optionIds: string[]) {
  const options = attributeOptionsByDefinition.value[attributeDefinitionId] ?? []
  return optionIds.map((optionId) => {
    const option = options.find((candidate) => candidate.attributeOptionId === optionId)
    return option ? `${option.optionCode} · ${option.optionName}` : optionId
  })
}

/** getOptionRecord resolves an AttributeOption id for generated Item identities. */
function getOptionRecord(attributeDefinitionId: string, optionId: string) {
  return (attributeOptionsByDefinition.value[attributeDefinitionId] ?? []).find(
    (candidate) => candidate.attributeOptionId === optionId
  )
}

/** getOptionCombinationKey normalizes locked options so duplicate generated Items can be skipped. */
function getOptionCombinationKey(optionIds: string[]) {
  return [...optionIds].sort().join('|')
}

/** hasOutputBom checks whether one Item has the specific execution-semantics BOM expected by its capability. */
function hasOutputBom(itemId: string, bomType: ItemManagementApi.BomType) {
  return relatedBoms.value.some((bom) => bom.outputItemId === itemId && bom.bomType === bomType)
}

/** getDerivedItemGaps lists concrete setup gaps that can be inferred from current workbench data. */
function getDerivedItemGaps(item: ItemManagementApi.ItemSummary) {
  const gaps: string[] = []

  if (!getExecutionCapabilityLabels(item).length) {
    gaps.push('缺 capability')
  }
  if (item.itemType === 'PACKAGED_FINISHED_GOOD' && !item.packagingSpecId) {
    gaps.push('缺 PackagingSpec')
  }
  if (item.capabilities.assemblable && !hasOutputBom(item.itemId, 'COMPOSITION')) {
    gaps.push('缺 COMPOSITION_BOM')
  }
  if (item.capabilities.transformable && !hasOutputBom(item.itemId, 'TRANSFORMATION')) {
    gaps.push('缺 TRANSFORMATION_BOM')
  }
  if ((item.itemType === 'PACKAGED_FINISHED_GOOD' || item.capabilities.packaged) && !hasOutputBom(item.itemId, 'PACKAGING')) {
    gaps.push('缺 PACKAGING_BOM')
  }
  if (item.capabilities.purchasable && !(supplierMappingsByItemId.value[item.itemId] ?? []).some((mapping) => mapping.active)) {
    gaps.push('缺 SupplierMapping')
  }

  return gaps
}

/** openDerivedItemGap routes one visible setup gap to the workbench that owns the missing data. */
function openDerivedItemGap(item: ItemManagementApi.ItemSummary, gap: string) {
  if (gap === '缺 PackagingSpec') {
    router.push({
      name: 'TenantItemPackagingManagement',
      query: { itemModelId: item.itemModelId }
    })
    return
  }

  const bomTypeByGap: Record<string, ItemManagementApi.BomType> = {
    '缺 COMPOSITION_BOM': 'COMPOSITION',
    '缺 PACKAGING_BOM': 'PACKAGING',
    '缺 TRANSFORMATION_BOM': 'TRANSFORMATION'
  }
  const bomType = bomTypeByGap[gap]
  if (bomType) {
    router.push({
      name: 'TenantItemBomManagement',
      query: {
        bomType,
        outputItemId: item.itemId
      }
    })
    return
  }

  router.push({
    name: 'TenantItemManagementDetail',
    params: { itemId: item.itemId }
  })
}

/** buildRequiredOptionCombinations creates the first-phase Cartesian product for required ItemModel rules. */
function buildRequiredOptionCombinations() {
  return requiredGenerationRules.value.reduce<string[][]>(
    (combinations, rule) =>
      combinations.flatMap((combination) =>
        rule.allowedOptionIds.map((optionId) => [...combination, optionId])
      ),
    [[]]
  )
}

/** buildGeneratedItemDrafts creates STANDARD Item payloads from missing required option combinations. */
function buildGeneratedItemDrafts() {
  if (!selectedItemModel.value) {
    return []
  }

  const rules = requiredGenerationRules.value
  const existingKeys = new Set(
    derivedItems.value.map((item) => getOptionCombinationKey(item.lockedAttributeOptionIds ?? []))
  )

  return buildRequiredOptionCombinations()
    .filter((optionIds) => !existingKeys.has(getOptionCombinationKey(optionIds)))
    .map((optionIds) => {
      const optionRecords = optionIds.map((optionId, index) => {
        const rule = rules[index]
        return rule ? getOptionRecord(rule.attributeDefinitionId, optionId) : undefined
      })
      const optionCodes = optionRecords.map((option, index) => option?.optionCode ?? optionIds[index])
      const optionNames = optionRecords.map((option, index) => option?.optionName ?? optionIds[index])

      return {
        capabilities: {
          ...selectedItemModel.value!.capabilities,
          packaged: false
        },
        itemCode: `${selectedItemModel.value!.modelCode}-${optionCodes.join('-')}`,
        itemModelId: selectedItemModel.value!.itemModelId,
        itemName: `${selectedItemModel.value!.modelName} - ${optionNames.join(' / ')}`,
        itemType: 'STANDARD' as ItemManagementApi.ItemType,
        lockedAttributeOptionIds: optionIds,
        packagingSpecId: undefined
      }
    })
}

/** toggleDerivedItemSelection tracks which derived Items should receive bulk execution settings. */
function toggleDerivedItemSelection(itemId: string, checked: boolean) {
  selectedDerivedItemIds.value = checked
    ? Array.from(new Set([...selectedDerivedItemIds.value, itemId]))
    : selectedDerivedItemIds.value.filter((selectedId) => selectedId !== itemId)
}

/** buildBulkCapabilities preserves derived capability truth while applying editable execution flags. */
function buildBulkCapabilities(item: ItemManagementApi.ItemSummary) {
  return {
    ...bulkCapabilityForm,
    packaged: item.itemType === 'PACKAGED_FINISHED_GOOD' || Boolean(item.capabilities.packaged)
  }
}

/** loadCategoryBranch recursively flattens ItemCategory tree layers for selectors. */
async function loadCategoryBranch(parentCategoryId?: string, bucket: ItemManagementApi.ItemCategoryNode[] = []) {
  const result = await listManagedItemCategoriesApi(activeTenantId.value, {
    parentCategoryId
  })

  for (const category of result.categories ?? []) {
    bucket.push(category)
    if (category.hasChildren) {
      await loadCategoryBranch(category.categoryId, bucket)
    }
  }

  return bucket
}

/** loadCategories refreshes the lightweight category selector data used by this workbench. */
async function loadCategories() {
  if (!activeTenantId.value) {
    itemCategories.value = []
    return
  }

  itemCategories.value = await loadCategoryBranch()
}

/** loadItemModels refreshes the model-level ItemModel directory. */
async function loadItemModels() {
  if (!canListItemModels.value || !activeTenantId.value) {
    itemModels.value = []
    return
  }

  modelLoading.value = true
  try {
    const result = await listManagedItemModelsApi(activeTenantId.value, {
      categoryId: filters.categoryId || undefined,
      includeDescendants: filters.categoryId ? true : undefined,
      page: 1,
      pageSize: 100,
      status: 'ACTIVE'
    })
    itemModels.value = result.itemModels ?? []
  } finally {
    modelLoading.value = false
  }
}

/** loadItems refreshes the executable Item directory using current V2 filters. */
async function loadItems() {
  if (!canListItems.value || !activeTenantId.value) {
    items.value = []
    return
  }

  loading.value = true
  try {
    const result = await listManagedItemsApi(activeTenantId.value, {
      capabilities: filters.capabilities.length ? [...filters.capabilities] : undefined,
      categoryId: filters.categoryId || undefined,
      includeDescendants: filters.categoryId ? true : undefined,
      itemModelId: filters.itemModelId || undefined,
      itemType: filters.itemType || undefined,
      keyword: filters.keyword.trim() || undefined,
      page: 1,
      pageSize: 20,
      status: filters.status || undefined
    })
    items.value = result.items ?? []
  } finally {
    loading.value = false
  }
}

/** loadAttributeDirectoryForWorkbench loads active attribute definitions and options for ItemModel rules. */
async function loadAttributeDirectoryForWorkbench() {
  if (!canListAttributes.value || !activeTenantId.value) {
    attributeDefinitions.value = []
    attributeOptionsByDefinition.value = {}
    return
  }

  const result = await listManagedAttributeDefinitionsApi(activeTenantId.value, {
    page: 1,
    pageSize: 50,
    status: 'ACTIVE'
  })
  attributeDefinitions.value = result.attributeDefinitions ?? []
  const nextOptionsByDefinition: Record<string, ItemManagementApi.AttributeOptionRecord[]> = {}

  for (const definition of attributeDefinitions.value) {
    const optionsResult = await listManagedAttributeOptionsApi(activeTenantId.value, definition.attributeDefinitionId, {
      status: 'ACTIVE'
    })
    nextOptionsByDefinition[definition.attributeDefinitionId] = optionsResult.attributeOptions ?? []
  }

  attributeOptionsByDefinition.value = nextOptionsByDefinition
}

/** loadItemModelWorkbench refreshes Odoo-like related sections for one selected ItemModel. */
async function loadItemModelWorkbench(itemModelId: string) {
  if (!activeTenantId.value || !itemModelId) {
    return
  }

  workbenchLoading.value = true
  try {
    await loadAttributeDirectoryForWorkbench()

    if (canListAttributes.value) {
      const rulesResult = await getManagedItemModelAttributeRulesApi(activeTenantId.value, itemModelId)
      itemModelAttributeRules.value = rulesResult.rules ?? []
    }

    if (canListItems.value) {
      const itemsResult = await listManagedItemsApi(activeTenantId.value, {
        itemModelId,
        page: 1,
        pageSize: 50,
        status: 'ACTIVE'
      })
      derivedItems.value = itemsResult.items ?? []
    }

    if (canListPackaging.value) {
      const packagingResult = await listManagedPackagingSpecsApi(activeTenantId.value, {
        itemModelId,
        page: 1,
        pageSize: 50
      })
      relatedPackagingSpecs.value = packagingResult.packagingSpecs ?? []
    }

    if (canListBom.value) {
      const bomGroups = await Promise.all(
        derivedItems.value.map((item) =>
          listManagedBomsApi(activeTenantId.value, {
            outputItemId: item.itemId,
            page: 1,
            pageSize: 50
          })
        )
      )
      relatedBoms.value = bomGroups.flatMap((group) => group.boms ?? [])
    }

    if (canListSupplierMappings.value) {
      const mappingGroups = await Promise.all(
        derivedItems.value
          .filter((item) => item.capabilities.purchasable)
          .map(async (item) => {
            const result = await listManagedSupplierItemMappingsApi(activeTenantId.value, item.itemId, {
              page: 1,
              pageSize: 50
            })

            return [item.itemId, result.mappings ?? []] as const
          })
      )
      supplierMappingsByItemId.value = Object.fromEntries(mappingGroups)
    } else {
      supplierMappingsByItemId.value = {}
    }

    ruleDraft.attributeDefinitionId = attributeDefinitions.value[0]?.attributeDefinitionId ?? ''
    ruleDraft.allowedOptionIds = []
    ruleDraft.required = 'true'
    selectedDerivedItemIds.value = []
  } finally {
    workbenchLoading.value = false
  }
}

/** selectItemModel opens one ItemModel as the Odoo-like model workbench focus. */
async function selectItemModel(itemModelId: string) {
  selectedItemModelId.value = itemModelId
  await loadItemModelWorkbench(itemModelId)
}

/** addRuleDraft stages one simple ItemModelAttributeRule row in the selected workbench. */
function addRuleDraft() {
  if (!ruleDraft.attributeDefinitionId) {
    return
  }

  const nextRule = {
    allowedOptionIds: [...ruleDraft.allowedOptionIds],
    attributeDefinitionId: ruleDraft.attributeDefinitionId,
    itemModelId: selectedItemModelId.value,
    required: ruleDraft.required === 'true'
  }
  itemModelAttributeRules.value = [
    ...itemModelAttributeRules.value.filter(
      (rule) => rule.attributeDefinitionId !== ruleDraft.attributeDefinitionId
    ),
    nextRule
  ]
  ruleDraft.allowedOptionIds = []
}

/** saveItemModelAttributeRules full-replaces the selected ItemModel's simple attribute rule set. */
async function saveItemModelAttributeRules() {
  if (!activeTenantId.value || !selectedItemModelId.value || !canManageAttributes.value) {
    return
  }

  await setManagedItemModelAttributeRulesApi(activeTenantId.value, selectedItemModelId.value, {
    rules: itemModelAttributeRules.value.map((rule) => ({
      allowedOptionIds: [...rule.allowedOptionIds],
      attributeDefinitionId: rule.attributeDefinitionId,
      required: rule.required
    }))
  })
  await loadItemModelWorkbench(selectedItemModelId.value)
}

/** batchGenerateItemsFromRequiredRules creates missing STANDARD Items from required ItemModel options. */
async function batchGenerateItemsFromRequiredRules() {
  if (!activeTenantId.value || !selectedItemModel.value || !selectedItemModelId.value || !canCreateItem.value) {
    return
  }

  const drafts = buildGeneratedItemDrafts()
  if (!drafts.length) {
    return
  }

  batchGeneratingItems.value = true
  try {
    for (const draft of drafts) {
      await createManagedItemApi(activeTenantId.value, draft)
    }
    await Promise.all([loadItems(), loadItemModelWorkbench(selectedItemModelId.value)])
  } finally {
    batchGeneratingItems.value = false
  }
}

/** bulkApplyDerivedItemSettings applies active state and editable capabilities to selected derived Items. */
async function bulkApplyDerivedItemSettings() {
  if (
    !activeTenantId.value
    || !selectedItemModelId.value
    || !canBulkManageItems.value
    || !selectedDerivedItemIds.value.length
  ) {
    return
  }

  const selectedItems = derivedItems.value.filter((item) => selectedDerivedItemIds.value.includes(item.itemId))
  bulkUpdatingItems.value = true
  try {
    for (const item of selectedItems) {
      await changeManagedItemStatusApi(activeTenantId.value, item.itemId, {
        status: bulkStatusValue.value
      })
      await setManagedItemCapabilitiesApi(activeTenantId.value, item.itemId, {
        capabilities: buildBulkCapabilities(item)
      })
    }
    selectedDerivedItemIds.value = []
    await Promise.all([loadItems(), loadItemModelWorkbench(selectedItemModelId.value)])
  } finally {
    bulkUpdatingItems.value = false
  }
}

/** openRelatedItems narrows the current Item list to the selected ItemModel-derived Items. */
function openRelatedItems() {
  if (!selectedItemModelId.value) {
    return
  }

  filters.itemModelId = selectedItemModelId.value
  void loadItems()
}

/** openAttributeManagement jumps to the Attribute directory for missing AttributeDefinition or Option setup. */
function openAttributeManagement() {
  router.push({
    name: 'TenantItemAttributeManagement'
  })
}

/** openCreateItemForSelectedModel starts Item creation with the current ItemModel preselected. */
function openCreateItemForSelectedModel() {
  if (!selectedItemModelId.value || !canCreateItem.value) {
    return
  }

  router.push({
    name: 'TenantItemManagementCreate',
    query: { itemModelId: selectedItemModelId.value }
  })
}

/** openRelatedPackaging jumps to the Packaging management page scoped by ItemModel. */
function openRelatedPackaging() {
  if (!selectedItemModelId.value) {
    return
  }

  router.push({
    name: 'TenantItemPackagingManagement',
    query: { itemModelId: selectedItemModelId.value }
  })
}

/** openRelatedBoms jumps to the BOM management page scoped by the first derived output Item. */
function openRelatedBoms() {
  const firstOutputItemId = derivedItems.value[0]?.itemId
  if (!firstOutputItemId) {
    return
  }

  router.push({
    name: 'TenantItemBomManagement',
    query: { outputItemId: firstOutputItemId }
  })
}

/** applyFilters refreshes both model-level and execution-level lists with shared category narrowing. */
function applyFilters() {
  void Promise.all([loadItemModels(), loadItems()])
}

/** resetFilters restores the Item directory query to the compact V2 default. */
function resetFilters() {
  filters.capabilities = []
  filters.categoryId = ''
  filters.itemModelId = ''
  filters.itemType = ''
  filters.keyword = ''
  filters.status = ''
  applyFilters()
}

/** openItemCreatePage sends all Item creation through the full rule-aware create page. */
function openItemCreatePage() {
  if (!canCreateItem.value) {
    return
  }

  router.push({
    name: 'TenantItemManagementCreate'
  })
}

/** handleItemModelAction dispatches one dropdown menu action for an ItemModel row. */
async function handleItemModelAction(actionKey: ItemModelActionKey, itemModelRecord: Record<string, any>) {
  const itemModel = itemModelRecord as ItemManagementApi.ItemModelRecord

  if (actionKey === 'open') {
    await selectItemModel(itemModel.itemModelId)
  }
}

/** handleItemAction dispatches one dropdown menu action for an Item row. */
function handleItemAction(actionKey: ItemActionKey, itemRecord: Record<string, any>) {
  const item = itemRecord as ItemManagementApi.ItemSummary

  if (actionKey === 'detail') {
    openDetailPage(item.itemId)
  }
}

/** openModelModal prepares the ItemModel create form. */
function openModelModal() {
  modelForm.modelCode = ''
  modelForm.modelName = ''
  modelForm.modelKind = 'PHYSICAL'
  modelForm.modelType = 'FINISHED_PRODUCT'
  modelForm.primaryCategoryId = ''
  modelModalOpen.value = true
}

/** submitItemModel creates a model-level master data entry. */
async function submitItemModel() {
  if (!activeTenantId.value || !modelForm.modelCode.trim() || !modelForm.modelName.trim()) {
    return
  }

  await createManagedItemModelApi(activeTenantId.value, {
    capabilities: emptyCapabilities(),
    modelCode: modelForm.modelCode.trim(),
    modelKind: modelForm.modelKind,
    modelName: modelForm.modelName.trim(),
    modelType: modelForm.modelType,
    primaryCategoryId: modelForm.primaryCategoryId || undefined
  })
  modelModalOpen.value = false
  await loadItemModels()
}

/** openDetailPage keeps item execution editing inside the item detail route. */
function openDetailPage(itemId: string) {
  if (!canViewItemDetail.value) {
    return
  }

  router.push({
    name: 'TenantItemManagementDetail',
    params: { itemId }
  })
}

onMounted(() => {
  void Promise.all([loadCategories(), loadItemModels(), loadItems()])
})
</script>

<template>
  <Page>
    <section class="item-management-page">
      <header class="item-management-page__header">
        <div>
          <div class="item-management-page__eyebrow">主数据 / Item Master V2</div>
          <h1>ItemModel 与 Item 管理</h1>
          <p>ItemModel 是模型层入口，Item 是采购、销售、库存、生产和 BOM 的执行身份。</p>
        </div>
        <Space>
          <Button v-if="canCreateItemModel" data-testid="item-model-create-button" @click="openModelModal">
            创建 ItemModel
          </Button>
          <Button
            v-if="canCreateItem"
            data-testid="item-create-button"
            type="primary"
            @click="openItemCreatePage"
          >
            创建 Item
          </Button>
        </Space>
      </header>

      <div class="item-management-page__metrics">
        <Card>
          <span>当前页 Item</span>
          <strong>{{ items.length }}</strong>
        </Card>
        <Card>
          <span>Active Item</span>
          <strong>{{ activeItemCount }}</strong>
        </Card>
        <Card>
          <span>Active ItemModel</span>
          <strong>{{ activeModelCount }}</strong>
        </Card>
      </div>

      <Card data-testid="item-filter-card">
        <Form layout="vertical">
          <div class="item-management-page__filter-grid">
            <Form.Item label="Keywords">
              <Input data-testid="item-filter-keyword" v-model:value="filters.keyword" placeholder="Item 编码 / 名称" />
            </Form.Item>
            <Form.Item label="ItemModel">
              <Select data-testid="item-filter-model" v-model:value="filters.itemModelId" :loading="modelLoading">
                <SelectOption value="">全部 ItemModel</SelectOption>
                <SelectOption v-for="model in itemModels" :key="model.itemModelId" :value="model.itemModelId">
                  {{ model.modelCode }} · {{ model.modelName }}
                </SelectOption>
              </Select>
            </Form.Item>
            <Form.Item label="Item Type">
              <Select data-testid="item-filter-type" v-model:value="filters.itemType">
                <SelectOption value="">全部类型</SelectOption>
                <SelectOption v-for="type in itemTypeOptions" :key="type" :value="type">{{ type }}</SelectOption>
              </Select>
            </Form.Item>
            <Form.Item label="Category">
              <Select data-testid="item-filter-category" v-model:value="filters.categoryId">
                <SelectOption value="">全部分类</SelectOption>
                <SelectOption
                  v-for="category in itemCategories"
                  :key="category.categoryId"
                  :value="category.categoryId"
                >
                  {{ category.categoryCode }} · {{ category.categoryName }}
                </SelectOption>
              </Select>
            </Form.Item>
            <Form.Item label="Capabilities">
              <Select data-testid="item-filter-capabilities-select" v-model:value="filters.capabilities" mode="multiple">
                <SelectOption v-for="capability in capabilityOptions" :key="capability" :value="capability">
                  {{ capability }}
                </SelectOption>
              </Select>
            </Form.Item>
            <Form.Item label="Status">
              <Select data-testid="item-filter-status" v-model:value="filters.status">
                <SelectOption value="">全部状态</SelectOption>
                <SelectOption value="ACTIVE">ACTIVE</SelectOption>
                <SelectOption value="INACTIVE">INACTIVE</SelectOption>
              </Select>
            </Form.Item>
            <Form.Item label=" ">
              <Space>
                <Button data-testid="item-filter-search" type="primary" :loading="loading" @click="applyFilters">
                  查询
                </Button>
                <Button data-testid="item-filter-reset" @click="resetFilters">重置</Button>
              </Space>
            </Form.Item>
          </div>
        </Form>
      </Card>

      <Card title="ItemModel">
        <Table
          :columns="modelColumns"
          :data-source="itemModels"
          :loading="modelLoading"
          :pagination="false"
          row-key="itemModelId"
          size="middle"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'modelCode'">
              <strong>{{ record.modelCode }}</strong>
            </template>
            <template v-else-if="column.key === 'modelCapabilities'">
              <Space v-if="getCapabilityLabels(record).length" wrap>
                <Tag v-for="capability in getCapabilityLabels(record)" :key="capability">{{ capability }}</Tag>
              </Space>
              <span v-else class="item-management-page__muted">未配置</span>
            </template>
            <template v-else-if="column.key === 'primaryCategory'">
              {{ record.primaryCategorySummary?.categoryCode ?? '-' }}
            </template>
            <template v-else-if="column.key === 'status'">
              <Tag :color="getStatusColor(record.status)">{{ record.status }}</Tag>
            </template>
            <template v-else-if="column.key === 'modelAction'">
              <Dropdown
                v-if="getVisibleTableActionItems(getItemModelActionItems(record)).length > 0"
                :trigger="['click']"
              >
                <Button aria-label="物料模型操作" shape="circle" size="small" type="text">
                  <IconifyIcon icon="ant-design:more-outlined" />
                </Button>
                <template #overlay>
                  <Menu @click="(info) => handleItemModelAction(String(info.key) as ItemModelActionKey, record)">
                    <Menu.Item
                      v-for="item in getVisibleTableActionItems(getItemModelActionItems(record))"
                      :key="item.key"
                      :danger="item.danger"
                      :data-testid="item.testId"
                      :disabled="item.disabled"
                    >
                      {{ item.label }}
                    </Menu.Item>
                  </Menu>
                </template>
              </Dropdown>
              <span v-else class="tenant-table-action-empty">无可用操作</span>
            </template>
          </template>
        </Table>
      </Card>

      <Card v-if="selectedItemModel" :loading="workbenchLoading" data-testid="item-model-workbench">
        <template #title>
          <div class="item-management-page__workbench-title">
            <span>{{ selectedItemModel.modelCode }} · {{ selectedItemModel.modelName }}</span>
            <small>Odoo-like ItemModel workbench</small>
          </div>
        </template>

        <div class="item-management-page__smart-buttons">
          <Button v-if="canCreateItem" data-testid="item-model-smart-create-item" type="primary" @click="openCreateItemForSelectedModel">
            创建 Item
          </Button>
          <Button data-testid="item-model-smart-items" @click="openRelatedItems">
            Items {{ derivedItems.length }}
          </Button>
          <Button data-testid="item-model-smart-packaging" @click="openRelatedPackaging">
            Packaging Specs {{ relatedPackagingSpecs.length }}
          </Button>
          <Button data-testid="item-model-smart-bom" @click="openRelatedBoms">
            BOM {{ relatedBoms.length }}
          </Button>
        </div>

        <section class="item-management-page__workbench-grid">
          <Card title="Attributes">
            <p class="item-management-page__note">
              这里维护该 ItemModel 允许哪些 AttributeDefinition / AttributeOption，以及是否必选。
            </p>
            <div class="item-management-page__rule-editor">
              <Select v-model:value="ruleDraft.attributeDefinitionId" data-testid="item-model-rule-attribute">
                <SelectOption
                  v-for="definition in attributeDefinitions"
                  :key="definition.attributeDefinitionId"
                  :value="definition.attributeDefinitionId"
                >
                  {{ definition.attributeCode }} · {{ definition.attributeName }}
                </SelectOption>
              </Select>
              <Select
                v-model:value="ruleDraft.allowedOptionIds"
                data-testid="item-model-rule-options"
                mode="multiple"
              >
                <SelectOption
                  v-for="option in selectedAttributeOptions"
                  :key="option.attributeOptionId"
                  :value="option.attributeOptionId"
                >
                  {{ option.optionCode }} · {{ option.optionName }}
                </SelectOption>
              </Select>
              <Select v-model:value="ruleDraft.required" data-testid="item-model-rule-required">
                <SelectOption value="true">必选</SelectOption>
                <SelectOption value="false">可选</SelectOption>
              </Select>
              <Button data-testid="item-model-rule-add" @click="addRuleDraft">添加规则</Button>
            </div>
            <div v-if="itemModelAttributeRules.length" class="item-management-page__rule-list">
              <div
                v-for="rule in itemModelAttributeRules"
                :key="rule.attributeDefinitionId"
                class="item-management-page__rule-row"
              >
                <strong>{{ getAttributeLabel(rule.attributeDefinitionId) }}</strong>
                <span>{{ rule.required ? '必选' : '可选' }}</span>
                <Space wrap>
                  <Tag
                    v-for="optionLabel in getOptionLabels(rule.attributeDefinitionId, rule.allowedOptionIds)"
                    :key="optionLabel"
                  >
                    {{ optionLabel }}
                  </Tag>
                </Space>
              </div>
            </div>
            <div v-else class="item-management-page__empty-action">
              <Empty description="暂无 AttributeRule" />
              <p>先配置该 ItemModel 的规格属性，例如颜色、尺寸、孔位；配置完成后再生成 Item。</p>
              <Button data-testid="item-model-empty-attributes" @click="openAttributeManagement">
                去 Attribute 管理
              </Button>
            </div>
            <Button
              v-if="canManageAttributes"
              data-testid="item-model-rules-save"
              type="primary"
              @click="saveItemModelAttributeRules"
            >
              保存 Attribute Rules
            </Button>
          </Card>

          <Card title="Derived Items">
            <div class="item-management-page__section-actions">
              <Button
                v-if="canCreateItem"
                data-testid="item-model-batch-generate-items"
                :disabled="!requiredGenerationRules.length || batchGeneratingItems"
                :loading="batchGeneratingItems"
                type="primary"
                @click="batchGenerateItemsFromRequiredRules"
              >
                按必选 AttributeRule 批量生成 Items
              </Button>
              <span class="item-management-page__muted">生成 STANDARD Item；PackagedItem 仍通过 PackagingSpec + PACKAGING_BOM 维护。</span>
            </div>
            <div
              v-if="canBulkManageItems && derivedItems.length"
              class="item-management-page__bulk-panel"
            >
              <Select v-model:value="bulkStatusValue" data-testid="item-model-bulk-status">
                <SelectOption value="ACTIVE">ACTIVE</SelectOption>
                <SelectOption value="INACTIVE">INACTIVE</SelectOption>
              </Select>
              <div class="item-management-page__bulk-capabilities">
                <Checkbox
                  v-for="capability in editableBulkCapabilityOptions"
                  :key="capability"
                  :checked="bulkCapabilityForm[capability]"
                  :data-testid="`item-model-bulk-capability-${capability}`"
                  @update:checked="bulkCapabilityForm[capability] = $event"
                >
                  {{ capability }}
                </Checkbox>
              </div>
              <Button
                data-testid="item-model-bulk-apply"
                :disabled="!selectedDerivedItemIds.length || bulkUpdatingItems"
                :loading="bulkUpdatingItems"
                type="primary"
                @click="bulkApplyDerivedItemSettings"
              >
                批量应用 active / capabilities
              </Button>
            </div>
            <div v-if="derivedItems.length" class="item-management-page__related-list">
              <div
                v-for="item in derivedItems"
                :key="item.itemId"
                class="item-management-page__derived-row"
              >
                <Checkbox
                  v-if="canBulkManageItems"
                  :checked="selectedDerivedItemIds.includes(item.itemId)"
                  :data-testid="`item-model-derived-select-${item.itemId}`"
                  @update:checked="toggleDerivedItemSelection(item.itemId, $event)"
                />
                <Button
                  :data-testid="`item-model-derived-item-${item.itemId}`"
                  @click="openDetailPage(item.itemId)"
                >
                  {{ item.itemCode }} · {{ item.itemName }}
                </Button>
                <Tag :color="getStatusColor(item.status)">{{ item.status }}</Tag>
                <Space wrap>
                  <Tag v-for="capability in getCapabilityLabels(item)" :key="capability">{{ capability }}</Tag>
                </Space>
                <Space v-if="getDerivedItemGaps(item).length" wrap>
                  <Tag
                    v-for="gap in getDerivedItemGaps(item)"
                    :key="gap"
                    color="orange"
                    :data-testid="`item-model-derived-gap-${item.itemId}-${gap}`"
                    role="button"
                    @click="openDerivedItemGap(item, gap)"
                  >
                    {{ gap }}
                  </Tag>
                </Space>
              </div>
            </div>
            <div v-else class="item-management-page__empty-action">
              <Empty description="暂无派生 Item" />
              <p>AttributeRule 配置完成后，创建具体执行 Item，并逐个维护 active 与 capabilities。</p>
              <Button
                v-if="canCreateItem"
                data-testid="item-model-empty-create-item"
                type="primary"
                @click="openCreateItemForSelectedModel"
              >
                创建 Item
              </Button>
            </div>
          </Card>

          <Card title="Packaging Specs">
            <div v-if="relatedPackagingSpecs.length" class="item-management-page__related-list">
              <Tag v-for="spec in relatedPackagingSpecs" :key="spec.packagingSpecId">
                {{ spec.specCode }} · {{ spec.specName }}
              </Tag>
            </div>
            <div v-else class="item-management-page__empty-action">
              <Empty description="暂无 PackagingSpec" />
              <p>如果该模型需要包装规格，请到包装管理维护 PackagingSpec，再生成 PackagedItem。</p>
              <Button data-testid="item-model-empty-packaging" @click="openRelatedPackaging">
                去包装管理
              </Button>
            </div>
          </Card>

          <Card title="Related BOMs">
            <div v-if="relatedBoms.length" class="item-management-page__related-list">
              <Tag v-for="bom in relatedBoms" :key="bom.bomId">
                {{ bom.bomCode }} · {{ bom.bomType }} · {{ getItemLabel(bom.outputItemId) }}
              </Tag>
            </div>
            <div v-else class="item-management-page__empty-action">
              <Empty description="暂无关联 BOM" />
              <p>BOM 绑定到具体 Item，不直接绑定 ItemModel；请先创建 Item，再维护 Composition / Packaging / Transformation BOM。</p>
              <Button
                v-if="!derivedItems.length && canCreateItem"
                data-testid="item-model-empty-bom-create-item"
                @click="openCreateItemForSelectedModel"
              >
                先创建 Item
              </Button>
              <Button v-else data-testid="item-model-empty-bom" @click="openRelatedBoms">
                去 BOM 管理
              </Button>
            </div>
          </Card>
        </section>
      </Card>

      <Card title="Item">
        <Table
          :columns="itemColumns"
          :data-source="items"
          :loading="loading"
          :locale="{ emptyText: '暂无 Item' }"
          :pagination="false"
          row-key="itemId"
          size="middle"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'itemCode'">
              <strong>{{ record.itemCode }}</strong>
            </template>
            <template v-else-if="column.key === 'itemModel'">
              {{ record.itemModelSummary?.modelCode ?? record.itemModelId }}
            </template>
            <template v-else-if="column.key === 'capabilities'">
              <Space v-if="getCapabilityLabels(record).length" wrap>
                <Tag v-for="capability in getCapabilityLabels(record)" :key="capability">{{ capability }}</Tag>
              </Space>
              <span v-else class="item-management-page__muted">未配置</span>
            </template>
            <template v-else-if="column.key === 'status'">
              <Tag :color="getStatusColor(record.status)">{{ record.status }}</Tag>
            </template>
            <template v-else-if="column.key === 'action'">
              <Dropdown
                v-if="getVisibleTableActionItems(getItemActionItems(record)).length > 0"
                :trigger="['click']"
              >
                <Button aria-label="物料操作" shape="circle" size="small" type="text">
                  <IconifyIcon icon="ant-design:more-outlined" />
                </Button>
                <template #overlay>
                  <Menu @click="(info) => handleItemAction(String(info.key) as ItemActionKey, record)">
                    <Menu.Item
                      v-for="item in getVisibleTableActionItems(getItemActionItems(record))"
                      :key="item.key"
                      :danger="item.danger"
                      :data-testid="item.testId"
                      :disabled="item.disabled"
                    >
                      {{ item.label }}
                    </Menu.Item>
                  </Menu>
                </template>
              </Dropdown>
              <span v-else class="tenant-table-action-empty">无可用操作</span>
            </template>
          </template>
        </Table>
        <Empty v-if="!items.length && !loading" description="暂无 Item" />
      </Card>

      <Modal :footer="null" :open="modelModalOpen" title="创建 ItemModel" @cancel="modelModalOpen = false">
        <Form layout="vertical" @submit.prevent="submitItemModel">
          <Form.Item label="Model Code">
            <Input v-model:value="modelForm.modelCode" data-testid="create-model-code" />
          </Form.Item>
          <Form.Item label="Model Name">
            <Input v-model:value="modelForm.modelName" data-testid="create-model-name" />
          </Form.Item>
          <Form.Item label="Model Kind">
            <Select v-model:value="modelForm.modelKind" data-testid="create-model-kind">
              <SelectOption v-for="kind in modelKindOptions" :key="kind" :value="kind">{{ kind }}</SelectOption>
            </Select>
          </Form.Item>
          <Form.Item label="Model Type">
            <Select v-model:value="modelForm.modelType" data-testid="create-model-type">
              <SelectOption v-for="type in modelTypeOptions" :key="type" :value="type">{{ type }}</SelectOption>
            </Select>
          </Form.Item>
          <Form.Item label="Primary Category">
            <Select v-model:value="modelForm.primaryCategoryId" data-testid="create-model-category">
              <SelectOption value="">不设置分类</SelectOption>
              <SelectOption
                v-for="category in itemCategories"
                :key="category.categoryId"
                :value="category.categoryId"
              >
                {{ category.categoryCode }} · {{ category.categoryName }}
              </SelectOption>
            </Select>
          </Form.Item>
          <Space>
            <Button @click="modelModalOpen = false">取消</Button>
            <Button data-testid="create-model-submit" type="primary" @click="submitItemModel">创建</Button>
          </Space>
        </Form>
      </Modal>
    </section>
  </Page>
</template>

<style scoped>
.item-management-page {
  color: #1f2937;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
}

.item-management-page__header {
  align-items: flex-start;
  display: flex;
  gap: 16px;
  justify-content: space-between;
}

.item-management-page__eyebrow,
.item-management-page__muted,
.item-management-page__note {
  color: #64748b;
}

.item-management-page__header h1 {
  font-size: 22px;
  font-weight: 600;
  line-height: 30px;
  margin: 0;
}

.item-management-page__header p {
  color: #64748b;
  margin: 4px 0 0;
}

.item-management-page__metrics {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(3, minmax(140px, 1fr));
}

.item-management-page__metrics :deep(.ant-card-body) {
  padding: 14px 16px;
}

.item-management-page__metrics span {
  color: #64748b;
  display: block;
  font-size: 12px;
}

.item-management-page__metrics strong {
  display: block;
  font-size: 22px;
  margin-top: 2px;
}

.item-management-page__filter-grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(3, minmax(180px, 1fr));
}

.item-management-page__workbench-title {
  align-items: baseline;
  display: flex;
  gap: 10px;
  justify-content: space-between;
}

.item-management-page__workbench-title small {
  color: #64748b;
}

.item-management-page__smart-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 14px;
}

.item-management-page__workbench-grid {
  display: grid;
  gap: 14px;
  grid-template-columns: repeat(2, minmax(260px, 1fr));
}

.item-management-page__rule-editor {
  display: grid;
  gap: 10px;
  grid-template-columns: minmax(180px, 1fr) minmax(220px, 1.2fr) 120px auto;
  margin-bottom: 12px;
}

.item-management-page__rule-list,
.item-management-page__related-list {
  display: grid;
  gap: 8px;
  margin-bottom: 12px;
}

.item-management-page__section-actions {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 12px;
}

.item-management-page__bulk-panel {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  display: grid;
  gap: 10px;
  grid-template-columns: 140px minmax(220px, 1fr) auto;
  margin-bottom: 12px;
  padding: 12px;
}

.item-management-page__bulk-capabilities,
.item-management-page__derived-row {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.item-management-page__empty-action {
  align-items: flex-start;
  display: grid;
  gap: 8px;
}

.item-management-page__empty-action p {
  color: #64748b;
  margin: 0;
}

.item-management-page__rule-row {
  align-items: center;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  display: grid;
  gap: 8px;
  grid-template-columns: minmax(140px, 1fr) 70px minmax(180px, 1.4fr);
  padding: 10px;
}

.item-management-page__error {
  color: #dc2626;
}

@media (max-width: 900px) {
  .item-management-page__filter-grid,
  .item-management-page__metrics,
  .item-management-page__bulk-panel,
  .item-management-page__rule-editor,
  .item-management-page__rule-row,
  .item-management-page__workbench-grid {
    grid-template-columns: 1fr;
  }
}
</style>
