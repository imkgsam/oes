# item-master-service Item Contract

## 1. Purpose

`Item` 是固定属性后的具体 SKU / 可执行物料身份 / variant。

`Item` 由 `ItemModel + locked AttributeOption combination + optional PackagingSpec` 定义。`locked_attribute_option_ids[]` 只锁定物料本体规格，不锁定质量等级、瑕疵、库存状态、销售策略或营销展示标签。

所有采购、销售、库存、生产、BOM 与包装执行最终以 `Item.active + Item.capabilities` 为准。

## 2. Read Model Shape

`Item` 读取模型至少包含：

| 字段 | 说明 |
| --- | --- |
| `item_id` | Item 稳定标识。 |
| `item_model_id` | 所属 ItemModel，必填。 |
| `item_code` | tenant 内 Item 编码。 |
| `item_name` | Item 名称。 |
| `item_type` | `STANDARD / PACKAGED_FINISHED_GOOD`。 |
| `locked_attribute_option_ids[]` | 已锁定 AttributeOption 组合。 |
| `packaging_spec_id` | 包装规格；普通 Item 为空，包装成品必填。 |
| `active` | 是否可用于新建业务。 |
| `capabilities` | 执行层 capability 真相。 |
| `item_model_summary` | 所属 ItemModel 摘要。 |
| `primary_category_summary` | 从 ItemModel 获得的主分类摘要。 |
| `created_at` | 创建时间。 |
| `updated_at` | 更新时间。 |

`capabilities` 最小 shape：

| 字段 | 说明 |
| --- | --- |
| `sellable` | 可作为销售执行 Item。 |
| `purchasable` | 可作为采购执行 Item。 |
| `stockable` | 可被 WMS 创建 `InventoryUnit` 并进入 `InventoryBalance`。 |
| `manufacturable` | 可作为 MES `ProductionSpec / WorkOrder` 的目标 Item。 |
| `assemblable` | 可作为 `COMPOSITION_BOM` 的输出 Item。 |
| `transformable` | 可作为 `TRANSFORMATION_BOM` 的输出 Item。 |
| `packable` | 可作为 `PACKAGING_BOM` 的基础输入 Item。 |
| `packaged` | 表示该 Item 是包装成品。 |

## 3. Packaged Item Rule

`PackagedItem` 不是独立对象。

包装成品必须表达为：

```text
Item.item_type = PACKAGED_FINISHED_GOOD
+ Item.packaging_spec_id != null
+ Item.capabilities.packaged = true
```

不冻结 `baseItemId` 字段。包装成品的输入来源、消耗和组成统一由 `PACKAGING_BOM` 表达。

## 4. Query RPCs

### `GetItem`

按 `item_id` 读取单个 Item。

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `tenant_id` | 是 | 显式租户边界。 |
| `item_id` | 是 | 目标 Item。 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `item` | 单个 Item 读取模型。 |

### `BatchGetItems`

批量读取 Item。

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `tenant_id` | 是 | 显式租户边界。 |
| `item_ids[]` | 是 | 目标 Item 标识集合。 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `items[]` | 已命中的 Item 列表。 |
| `missing_item_ids[]` | 未命中的 Item 标识。 |

### `SearchItems`

按条件分页搜索 Item。

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `tenant_id` | 是 | 显式租户边界。 |
| `keyword` | 否 | 按 `item_code / item_name` 检索。 |
| `item_model_id` | 否 | 按所属 ItemModel 过滤。 |
| `item_type` | 否 | 按 `STANDARD / PACKAGED_FINISHED_GOOD` 过滤。 |
| `packaging_spec_id` | 否 | 按包装规格过滤。 |
| `locked_attribute_option_ids[]` | 否 | 按已锁定 AttributeOption 包含关系过滤。 |
| `capability_filters` | 否 | 按执行层 capability 过滤。 |
| `active` | 否 | 按 active 状态过滤。 |
| `category_id` | 否 | 按所属 ItemModel 的主分类过滤。 |
| `include_descendants` | 否 | 仅在提供 `category_id` 时有效。 |
| `page` | 否 | 1-based 页码。 |
| `page_size` | 否 | 页大小。 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `items[]` | 当前页 Item 列表。 |
| `total` | 总条数。 |
| `page` | 当前页码。 |
| `page_size` | 当前页大小。 |

### `ResolveItemVariant`

从 `ItemModel + locked AttributeOption combination + optional PackagingSpec` 解析唯一 Item。

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `tenant_id` | 是 | 显式租户边界。 |
| `item_model_id` | 是 | 目标 ItemModel。 |
| `locked_attribute_option_ids[]` | 否 | 已锁定 AttributeOption 组合。 |
| `packaging_spec_id` | 否 | 包装规格。 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `resolution_status` | `MATCHED / NO_MATCH`。 |
| `item` | 命中时返回 Item；未命中时为空。 |

空语义：

- 未命中返回 `NO_MATCH`，不是异常。
- 命中多个表示唯一性数据被破坏，应返回 `FAILED_PRECONDITION`。

## 5. Management RPCs

### `CreateItem`

创建新的执行层 Item。

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `tenant_id` | 是 | 显式租户边界。 |
| `item_model_id` | 是 | 所属 ItemModel。 |
| `item_code` | 是 | tenant 内 Item 编码。 |
| `item_name` | 是 | Item 名称。 |
| `item_type` | 是 | `STANDARD / PACKAGED_FINISHED_GOOD`。 |
| `locked_attribute_option_ids[]` | 否 | 已锁定 AttributeOption 组合。 |
| `packaging_spec_id` | 否 | 包装规格。 |
| `capabilities` | 否 | 执行层 capability；未提供时由 ItemModel 默认值初始化。 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `item_id` | 新建 Item 标识。 |
| `item` | 新建后的 Item。 |

关键语义：

- `item_model_id` 必填。
- `locked_attribute_option_ids[]` 必须符合所属 ItemModel 的 attribute rules。
- 同一个 `ItemModel + lockedAttributes + optional packagingSpecId` 必须唯一。
- `locked_attribute_option_ids[]` 只用于形成稳定 Item 身份；质量等级、瑕疵、返修、库存冻结、占用、客户 SKU、营销标签或临时销售要求不得通过 locked attributes 表达。
- `PACKAGED_FINISHED_GOOD` 必须提供 `packaging_spec_id`，并且 `capabilities.packaged = true`。
- `STANDARD` Item 的 `packaging_spec_id` 必须为空。

### `UpdateItemBasics`

更新 Item 基础字段。

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `tenant_id` | 是 | 显式租户边界。 |
| `item_id` | 是 | 目标 Item。 |
| `item_code` | 是 | 新 Item 编码。 |
| `item_name` | 是 | 新 Item 名称。 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `item` | 更新后的 Item。 |

关键语义：

- 本命令只改 `item_code / item_name`。
- `item_model_id / locked_attribute_option_ids / item_type / packaging_spec_id` 不通过本命令修改。

### `SetItemCapabilities`

全量替换 Item 执行层 capabilities。

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `tenant_id` | 是 | 显式租户边界。 |
| `item_id` | 是 | 目标 Item。 |
| `capabilities` | 是 | 完整八能力集合。 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `item` | 更新后的 Item。 |

关键语义：

- 这是全量替换，不是 patch。
- `Item.capabilities` 是执行真相。
- `PACKAGED_FINISHED_GOOD` 的 `capabilities.packaged` 不允许被设置为 `false`。
- 非 `PACKAGED_FINISHED_GOOD` Item 不允许将 `capabilities.packaged` 设置为 `true`。
- 第一阶段不冻结 `traceable / kittable / consumable`。

### `ChangeItemStatus`

变更 `Item.active`。

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `tenant_id` | 是 | 显式租户边界。 |
| `item_id` | 是 | 目标 Item。 |
| `active` | 是 | 目标 active 状态。 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `item` | 变更后的 Item。 |

关键语义：

- 归档不删除历史。
- 停用 Item 不影响历史订单、库存、生产、采购或审计记录。
