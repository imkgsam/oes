# item-master-service Query API

## 1. 模块职责

`ItemMasterQueryService` 负责 phase 1 的只读查询与映射解析能力，不修改状态。

调用基线：

- 接口类型：内部 gRPC
- 服务：`ItemMasterQueryService`
- 所有 RPC 显式带 `tenant_id`
- 所有 RPC 都要求：
  - internal service context
  - operator context
  - trace context

phase 1 query + 当前最小 category slice 只覆盖：

- Item 基础查询
- Item 目录搜索与 category-aware 收窄
- ItemCategory 轻量树读取
- Bundle 组成读取
- 按 Item 读取 supplier mapping 列表
- 供应商型号映射解析

phase 1 query 不覆盖：

- 包装主数据
- `ManufacturingSpec`
- `StockItemType`
- 销售配置
- integration events 派生读模型

## 2. 通用读取形状

phase 1 query 返回的 `Item` 读取形状至少应包含以下字段：

| 字段 | 说明 |
| --- | --- |
| `item_id` | Item 稳定标识 |
| `item_code` | tenant 内 item 编码 |
| `item_name` | item 名称 |
| `structure_type` | `SINGLE \| BUNDLE` |
| `nature_type` | `PHYSICAL \| VIRTUAL \| SERVICE` |
| `status` | phase 1 生命周期 / enabled 摘要 |
| `capabilities` | `sellable / purchasable / stockable / manufacturable` |
| `primary_category_summary` | 当前主分类摘要；未设置时为空 |

说明：

- `structure_type / nature_type` 在 phase 1 只读暴露，不通过 query 提供变更入口
- `primary_category_summary` 是可选摘要，不表示支持 multi-category
- phase 1 + 当前 slice 仍只允许 `0..1` 个 `primary category`

`primary_category_summary` 最小 shape：

| 字段 | 说明 |
| --- | --- |
| `category_id` | Category 稳定标识 |
| `category_code` | tenant 内 category 编码 |
| `category_name` | category 名称 |
| `status` | 当前 category 生命周期 / enabled 摘要 |

## 3. RPC 语义

### `GetItem`

- 作用：按 `item_id` 读取单个 Item 当前摘要

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `tenant_id` | 是 | 显式租户边界 |
| `item_id` | 是 | 目标 Item 标识 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `item` | 单个 `Item` 读取模型 |

返回语义：

- 目标 Item 存在时返回 `item`
- 目标 Item 不存在时返回 `NOT_FOUND`

### `BatchGetItems`

- 作用：按一组 `item_id` 批量读取 Item 摘要

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `tenant_id` | 是 | 显式租户边界 |
| `item_ids[]` | 是 | 目标 Item 标识集合 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `items[]` | 已命中的 Item 列表 |
| `missing_item_ids[]` | 未命中的 `item_id` 列表 |

空语义：

- 单个 `item_id` 未命中时，不抛逐条错误
- 未命中的标识必须放入 `missing_item_ids[]`
- 整批允许部分命中、部分缺失

### `SearchItems`

- 作用：按条件分页搜索 Item 目录

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `tenant_id` | 是 | 显式租户边界 |
| `keyword` | 否 | 按 `item_code / item_name` 检索 |
| `structure_type` | 否 | 按 `SINGLE / BUNDLE` 过滤 |
| `nature_type` | 否 | 按 `PHYSICAL / VIRTUAL / SERVICE` 过滤 |
| `capability_filters` | 否 | 按 `sellable / purchasable / stockable / manufacturable` 过滤 |
| `status` | 否 | 按生命周期 / enabled 状态过滤 |
| `category_id` | 否 | 按 `primary category` 过滤 |
| `include_descendants` | 否 | 仅在提供 `category_id` 时有效；为 `true` 时包含后代分类 |
| `page` | 否 | 1-based 页码 |
| `page_size` | 否 | 页大小 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `items[]` | 当前页 Item 列表 |
| `total` | 总条数 |
| `page` | 当前页码 |
| `page_size` | 当前页大小 |

空语义：

- 搜索结果为空时正常返回空页
- 空页不是异常，不返回 `NOT_FOUND`

补充语义：

- 未提供 `category_id` 时，`include_descendants` 必须省略或为 `false`
- 提供 `category_id` 且 `include_descendants = false` 时，只匹配该分类下直接挂载为该 `primary category` 的 Item
- 提供 `category_id` 且 `include_descendants = true` 时，匹配该分类及其所有后代分类下的 Item
- 指定的 `category_id` 不存在时返回 `NOT_FOUND`
- 分类存在但当前没有 Item 命中时正常返回空页

### `ListItemCategories`

- 作用：按 tenant 读取轻量 category tree 的某一层级列表

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `tenant_id` | 是 | 显式租户边界 |
| `parent_category_id` | 否 | 为空时读取根节点；有值时读取该节点的直接子节点 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `categories[]` | 当前层级的 category 列表 |

`categories[]` 最小 shape：

| 字段 | 说明 |
| --- | --- |
| `category_id` | Category 稳定标识 |
| `category_code` | tenant 内 category 编码 |
| `category_name` | category 名称 |
| `parent_category_id` | 父分类标识；根节点为空 |
| `status` | 当前 category 生命周期 / enabled 摘要 |
| `has_children` | 是否存在直接子分类 |

空语义：

- tenant 当前没有任何 category 时，返回空 `categories[]`
- `parent_category_id` 对应节点存在但没有直接子节点时，返回空 `categories[]`
- 空树或空层级不是异常，不返回 `NOT_FOUND`

返回语义：

- 指定 `parent_category_id` 但目标分类不存在时返回 `NOT_FOUND`

说明：

- 本 RPC 只返回轻量树真相，不返回品牌、包装、制造、库存类型等其他树
- 本 RPC 返回 category 自身状态摘要，但不把状态扩展为权限、定价、采购、库存策略判定

### `GetItemComposition`

- 作用：读取某个 bundle Item 的当前组成关系

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `tenant_id` | 是 | 显式租户边界 |
| `item_id` | 是 | bundle parent 的 `item_id` |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `item_id` | parent Item 标识 |
| `components[]` | 当前组件列表 |

`components[]` 最小 shape：

| 字段 | 说明 |
| --- | --- |
| `component_item_id` | 组件 Item 标识 |
| `component_item_code` | 组件编码摘要 |
| `component_item_name` | 组件名称摘要 |

返回语义：

- parent Item 不存在时返回 `NOT_FOUND`
- parent Item 存在但不是 `BUNDLE` 时返回 `FAILED_PRECONDITION`
- parent Item 是 `BUNDLE` 但当前没有组件时，返回空 `components[]`

说明：

- nested bundle deferred，query 不应把 bundle component 当作 phase 1 已承诺能力
- phase 1 只冻结“bundle 与 component Item 的静态关联”，不在本文件中扩展包装、制造或履约语义

### `ListSupplierItemMappingsByItem`

- 作用：按 `item_id` 分页读取某个 Item 当前挂载的 supplier mappings

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `tenant_id` | 是 | 显式租户边界 |
| `item_id` | 是 | 目标 Item 标识 |
| `page` | 否 | 1-based 页码 |
| `page_size` | 否 | 页大小 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `mappings[]` | 当前页 supplier mapping 列表 |
| `total` | 总条数 |
| `page` | 当前页码 |
| `page_size` | 当前页大小 |

`mappings[]` 最小 shape：

| 字段 | 说明 |
| --- | --- |
| `supplier_id` | 供应商标识 |
| `supplier_item_code` | 供应商侧编码 |
| `supplier_item_name` | 供应商侧名称 |
| `item_id` | 目标 Item 标识 |

返回语义：

- 目标 Item 不存在时返回 `NOT_FOUND`
- 目标 Item 存在但当前没有 mappings 时，返回空 `mappings[]`
- 分页越界或结果为空时正常返回空页，不返回 `NOT_FOUND`

说明：

- 本 RPC 只解决“某个 Item 当前有哪些 supplier mappings”这一只读需求，不改变 `UpsertSupplierItemMapping` 语义
- phase 1 只暴露映射标识关系，不在本文件中扩展价格、MOQ、账期、lead time、供应表现或 supplier offering 语义

### `ResolveSupplierItemMapping`

- 作用：把供应商侧型号标识解析为 OES `Item`

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `tenant_id` | 是 | 显式租户边界 |
| `supplier_id` | 是 | SRM supplier 引用 |
| `supplier_item_code` | 否 | 供应商侧编码 |
| `supplier_item_name` | 否 | 供应商侧名称 |

补充约束：

- `supplier_item_code / supplier_item_name` 至少提供一个

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `resolution_status` | `MATCHED` 或 `NO_MATCH` |
| `mapping` | 命中时返回映射结果；未命中时为空 |

`mapping` 最小 shape：

| 字段 | 说明 |
| --- | --- |
| `supplier_id` | 供应商标识 |
| `supplier_item_code` | 供应商侧编码 |
| `supplier_item_name` | 供应商侧名称 |
| `item_id` | 命中的 Item 标识 |
| `item_code` | 命中的 Item 编码摘要 |
| `item_name` | 命中的 Item 名称摘要 |

空语义：

- 未命中时必须返回 `resolution_status = NO_MATCH`
- 未命中不是异常，不返回 `NOT_FOUND`

## 4. 错误语义

phase 1 query 统一暴露以下错误面：

| 错误码 | 语义 |
| --- | --- |
| `INVALID_ARGUMENT` | 请求字段缺失、格式非法、查询条件互相冲突，`ResolveSupplierItemMapping` 未提供 code / name，或 `include_descendants` 在缺少 `category_id` 时被设置为 `true` |
| `UNAUTHENTICATED` | 缺少有效 internal service context 或 operator context |
| `PERMISSION_DENIED` | 调用方存在上下文，但没有读取该 tenant/item 的权限 |
| `NOT_FOUND` | 单对象读取目标不存在，例如 `GetItem` 的 `item_id` 不存在，或 `SearchItems` / `ListItemCategories` 引用的 category 不存在 |
| `ALREADY_EXISTS` | 当前 query RPC 不应返回该错误；该错误码只作为跨 management/query 共享的统一错误词汇保留 |
| `FAILED_PRECONDITION` | 资源存在，但当前类型或状态不满足读取前提，例如对非 `BUNDLE` Item 调 `GetItemComposition` |

补充说明：

- `SearchItems` 空页、`BatchGetItems` 缺失项、`ListItemCategories` 空树或空层级、`ListSupplierItemMappingsByItem` 空页、`ResolveSupplierItemMapping` 未命中，都必须走正常响应语义，而不是错误替代
- 当前 slice 不新增 `SearchSellableItems`、`SearchPurchasableItems`、`SearchStockableItems` 这类 domain-specific selector RPC；调用方应继续复用 `SearchItems` 并按既有 capability filter 组合
