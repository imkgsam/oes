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

phase 1 query 只覆盖：

- Item 基础查询
- Item 目录搜索
- Bundle 组成读取
- 按 Item 读取 supplier mapping 列表
- 供应商型号映射解析

phase 1 query 不覆盖：

- `ItemCategory`
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

说明：

- `structure_type / nature_type` 在 phase 1 只读暴露，不通过 query 提供变更入口
- `ItemCategory` 不在 phase 1 query shape 中出现

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
| `INVALID_ARGUMENT` | 请求字段缺失、格式非法、查询条件互相冲突，或 `ResolveSupplierItemMapping` 未提供 code / name |
| `UNAUTHENTICATED` | 缺少有效 internal service context 或 operator context |
| `PERMISSION_DENIED` | 调用方存在上下文，但没有读取该 tenant/item 的权限 |
| `NOT_FOUND` | 单对象读取目标不存在，例如 `GetItem` 的 `item_id` 不存在 |
| `FAILED_PRECONDITION` | 资源存在，但当前类型或状态不满足读取前提，例如对非 `BUNDLE` Item 调 `GetItemComposition` |
| `UNAVAILABLE` | 下游依赖或当前服务暂不可用 |
| `INTERNAL` | 未归类的服务内部错误 |

补充说明：

- `ALREADY_EXISTS` 不是 query RPC 的预期错误
- `SearchItems` 空页、`BatchGetItems` 缺失项、`ListSupplierItemMappingsByItem` 空页、`ResolveSupplierItemMapping` 未命中，都必须走正常响应语义，而不是错误替代
