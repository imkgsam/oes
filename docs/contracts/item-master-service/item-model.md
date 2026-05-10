# item-master-service ItemModel Contract

## 1. Purpose

`ItemModel` 是 `item-master-service` 的唯一模型层对象，可理解为可配置物料模型、款式模型、规格族、SPU 或 template。

所有 `Item` 必须关联一个 `ItemModel`。一次性物料、简单采购件、无规格族管理的物料，也应创建轻量 `ItemModel` 后再创建 `Item`。

## 2. Read Model Shape

`ItemModel` 读取模型至少包含：

| 字段 | 说明 |
| --- | --- |
| `item_model_id` | ItemModel 稳定标识。 |
| `model_code` | tenant 内模型编码。 |
| `model_name` | 模型名称。 |
| `model_kind` | `PHYSICAL / SERVICE / DIGITAL / VIRTUAL`。 |
| `model_type` | `FINISHED_PRODUCT / SEMI_FINISHED_PRODUCT / ACCESSORY / PART / SUB_ASSEMBLY / RAW_MATERIAL / PACKAGING_MATERIAL / SERVICE / VIRTUAL_KIT`。 |
| `active` | 是否可用于新建业务。 |
| `capabilities` | 模型级允许范围和默认值，不是执行真相。 |
| `primary_category_summary` | 主分类摘要；未设置时为空。 |
| `created_at` | 创建时间。 |
| `updated_at` | 更新时间。 |

`capabilities` 最小 shape：

| 字段 | 说明 |
| --- | --- |
| `sellable` | 模型下 Item 默认可销售。 |
| `purchasable` | 模型下 Item 默认可采购。 |
| `stockable` | 模型下 Item 默认可库存。 |
| `manufacturable` | 模型下 Item 默认可制造。 |
| `assemblable` | 模型下 Item 默认可作为 `COMPOSITION_BOM` 输出。 |
| `transformable` | 模型下 Item 默认可作为 `TRANSFORMATION_BOM` 输出。 |
| `packable` | 模型下 Item 默认可作为 `PACKAGING_BOM` 基础输入。 |
| `packaged` | 模型下 Item 默认可作为包装成品。 |

说明：

- `ItemModel.capabilities` 是默认值与允许范围，不是采购、销售、库存、生产或 BOM 执行真相。
- 执行真相永远读取 `Item.active + Item.capabilities`。

## 3. Query RPCs

### `GetItemModel`

按 `item_model_id` 读取单个 `ItemModel`。

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `tenant_id` | 是 | 显式租户边界。 |
| `item_model_id` | 是 | 目标 ItemModel 标识。 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `item_model` | 单个 `ItemModel` 读取模型。 |

### `BatchGetItemModels`

按一组 `item_model_id` 批量读取 `ItemModel`。

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `tenant_id` | 是 | 显式租户边界。 |
| `item_model_ids[]` | 是 | 目标 ItemModel 标识集合。 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `item_models[]` | 已命中的 ItemModel 列表。 |
| `missing_item_model_ids[]` | 未命中的 ItemModel 标识。 |

### `SearchItemModels`

按条件分页搜索 `ItemModel`。

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `tenant_id` | 是 | 显式租户边界。 |
| `keyword` | 否 | 按 `model_code / model_name` 检索。 |
| `model_kind` | 否 | 按本质类型过滤。 |
| `model_type` | 否 | 按业务分类过滤。 |
| `capability_filters` | 否 | 按模型级 capability 过滤。 |
| `active` | 否 | 按 active 状态过滤。 |
| `category_id` | 否 | 按 `ItemModel.primaryCategoryId` 过滤。 |
| `include_descendants` | 否 | 仅在提供 `category_id` 时有效。 |
| `page` | 否 | 1-based 页码。 |
| `page_size` | 否 | 页大小。 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `item_models[]` | 当前页 ItemModel 列表。 |
| `total` | 总条数。 |
| `page` | 当前页码。 |
| `page_size` | 当前页大小。 |

## 4. Management RPCs

### `CreateItemModel`

创建新的 `ItemModel`。

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `tenant_id` | 是 | 显式租户边界。 |
| `model_code` | 是 | tenant 内模型编码。 |
| `model_name` | 是 | 模型名称。 |
| `model_kind` | 是 | `PHYSICAL / SERVICE / DIGITAL / VIRTUAL`。 |
| `model_type` | 是 | 业务分类。 |
| `capabilities` | 否 | 模型级 capability 默认值；未提供时由服务端按治理规则给默认值。 |
| `primary_category_id` | 否 | 主分类；未设置时为空。 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `item_model_id` | 新建 ItemModel 标识。 |
| `item_model` | 新建后的 ItemModel 读取模型。 |

关键语义：

- `model_code` 在 tenant 内唯一。
- `model_kind / model_type` 创建后是否允许修改由后续治理决定；第一阶段不提供专用类型变更 RPC。

### `UpdateItemModelBasics`

更新 `ItemModel` 基础可编辑字段。

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `tenant_id` | 是 | 显式租户边界。 |
| `item_model_id` | 是 | 目标 ItemModel。 |
| `model_code` | 是 | 新模型编码。 |
| `model_name` | 是 | 新模型名称。 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `item_model` | 更新后的 ItemModel。 |

### `SetItemModelCapabilities`

全量替换 `ItemModel` 模型级 capability 默认值。

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `tenant_id` | 是 | 显式租户边界。 |
| `item_model_id` | 是 | 目标 ItemModel。 |
| `capabilities` | 是 | 完整八能力集合。 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `item_model` | 更新后的 ItemModel。 |

关键语义：

- 这是全量替换，不是 patch。
- 修改 `ItemModel.capabilities` 不自动修改已存在 `Item.capabilities`。

### `ChangeItemModelStatus`

变更 `ItemModel.active`。

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `tenant_id` | 是 | 显式租户边界。 |
| `item_model_id` | 是 | 目标 ItemModel。 |
| `active` | 是 | 目标 active 状态。 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `item_model` | 变更后的 ItemModel。 |

关键语义：

- 停用 `ItemModel` 不自动停用其下所有 `Item`。

### `SetItemModelPrimaryCategory`

设置或清空 `ItemModel` 的主分类。

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `tenant_id` | 是 | 显式租户边界。 |
| `item_model_id` | 是 | 目标 ItemModel。 |
| `primary_category_id` | 否 | 目标主分类；为空表示清空。 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `item_model` | 更新后的 ItemModel。 |

关键语义：

- 第一阶段分类主挂 `ItemModel`。
- 不提供 `Item` 级 category override。
