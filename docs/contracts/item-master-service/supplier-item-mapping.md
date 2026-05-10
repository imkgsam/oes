# item-master-service SupplierItemMapping Contract

## 1. Purpose

`SupplierItemMapping` 归属 `item-master-service`，只表达供应商侧编码 / 名称如何映射到 OES 执行层 `Item`。

```text
supplierId + supplierItemCode / supplierItemName -> itemId
```

`SupplierItemMapping` 不承载价格、MOQ、账期、lead time、供应表现或供应商合作状态。

## 2. Read Model Shape

`SupplierItemMapping` 最小 shape：

| 字段 | 说明 |
| --- | --- |
| `supplier_item_mapping_id` | 映射标识。 |
| `supplier_id` | 供应商引用。 |
| `supplier_item_code` | 供应商侧编码。 |
| `supplier_item_name` | 供应商侧名称。 |
| `item_id` | 映射到的执行层 Item。 |
| `item_summary` | 目标 Item 摘要。 |
| `active` | 是否可用于新业务解析。 |

## 3. Query RPCs

### `ListSupplierItemMappingsByItem`

按 `item_id` 分页读取 supplier mappings。

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `tenant_id` | 是 | 显式租户边界。 |
| `item_id` | 是 | 目标 Item。 |
| `active` | 否 | 按 active 状态过滤。 |
| `page` | 否 | 1-based 页码。 |
| `page_size` | 否 | 页大小。 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `mappings[]` | 当前页 supplier mappings。 |
| `total` | 总条数。 |
| `page` | 当前页码。 |
| `page_size` | 当前页大小。 |

### `ResolveSupplierItemMapping`

把供应商侧型号标识解析为 OES `Item`。

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `tenant_id` | 是 | 显式租户边界。 |
| `supplier_id` | 是 | 供应商引用。 |
| `supplier_item_code` | 否 | 供应商侧编码。 |
| `supplier_item_name` | 否 | 供应商侧名称。 |

补充约束：

- `supplier_item_code / supplier_item_name` 至少提供一个。

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `resolution_status` | `MATCHED / NO_MATCH`。 |
| `mapping` | 命中时返回映射；未命中时为空。 |

空语义：

- 未命中返回 `NO_MATCH`，不是异常。

## 4. Management RPCs

### `UpsertSupplierItemMapping`

新增或更新供应商型号到 Item 的映射。

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `tenant_id` | 是 | 显式租户边界。 |
| `supplier_id` | 是 | 供应商引用。 |
| `supplier_item_code` | 否 | 供应商侧编码。 |
| `supplier_item_name` | 否 | 供应商侧名称。 |
| `item_id` | 是 | 映射到的执行层 Item。 |
| `active` | 否 | 目标 active 状态；未提供时默认为 true。 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `mapping` | 当前生效的映射。 |

关键语义：

- `supplier_item_code / supplier_item_name` 至少提供一个。
- `item_id` 必须指向执行层 `Item`，不能指向 `ItemModel`。
- 目标 `Item` 必须存在且 active。
- 该命令只维护映射关系，不维护采购商业条款。
