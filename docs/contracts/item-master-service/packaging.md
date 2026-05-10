# item-master-service Packaging Contract

## 1. Purpose

包装主数据归属 `item-master-service`。

第一阶段冻结：

- `PackagingMethod`
- `PackagingSpec`
- `BOM(type = PACKAGING_BOM)`

具体纸箱、泡沫、蜂窝板、说明书、标签、随箱配件等消耗不直接塞进 `PackagingSpec`，而是通过 `PACKAGING_BOM` 表达。

## 2. PackagingMethod Shape

`PackagingMethod` 表示包装方式分类，例如普通包装、加强包装、电商包装。

最小 shape：

| 字段 | 说明 |
| --- | --- |
| `packaging_method_id` | 包装方式标识。 |
| `method_code` | tenant 内包装方式编码。 |
| `method_name` | 包装方式名称。 |
| `active` | 是否可用于新建业务。 |

## 3. PackagingSpec Shape

`PackagingSpec` 是具体包装规格：

```text
PackagingSpec =
  ItemModel
  + PackagingMethod
  + optional Customer
```

最小 shape：

| 字段 | 说明 |
| --- | --- |
| `packaging_spec_id` | 包装规格标识。 |
| `item_model_id` | 目标 ItemModel。 |
| `packaging_method_id` | 包装方式。 |
| `customer_id` | 可选客户引用；为空表示通用包装规格。 |
| `spec_code` | tenant 内包装规格编码。 |
| `spec_name` | 包装规格名称。 |
| `gross_weight` | 毛重。 |
| `volume` | 体积。 |
| `outer_length` | 外箱长度。 |
| `outer_width` | 外箱宽度。 |
| `outer_height` | 外箱高度。 |
| `work_instruction` | 简单作业要求，例如标签位置、封箱方式、包装备注。 |
| `version` | 版本。 |
| `effective_from` | 生效开始时间。 |
| `effective_to` | 生效结束时间；可为空。 |
| `active` | 是否可用于新建业务。 |

## 4. Query RPCs

### `ListPackagingMethods`

读取包装方式列表。

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `tenant_id` | 是 | 显式租户边界。 |
| `keyword` | 否 | 按 code / name 检索。 |
| `active` | 否 | 按 active 状态过滤。 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `packaging_methods[]` | 包装方式列表。 |

### `GetPackagingSpec`

按 `packaging_spec_id` 读取包装规格。

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `tenant_id` | 是 | 显式租户边界。 |
| `packaging_spec_id` | 是 | 目标 PackagingSpec。 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `packaging_spec` | 单个 PackagingSpec。 |

### `SearchPackagingSpecs`

分页搜索包装规格。

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `tenant_id` | 是 | 显式租户边界。 |
| `keyword` | 否 | 按 code / name 检索。 |
| `item_model_id` | 否 | 按 ItemModel 过滤。 |
| `packaging_method_id` | 否 | 按包装方式过滤。 |
| `customer_id` | 否 | 按客户引用过滤。 |
| `active` | 否 | 按 active 状态过滤。 |
| `page` | 否 | 1-based 页码。 |
| `page_size` | 否 | 页大小。 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `packaging_specs[]` | 当前页 PackagingSpec。 |
| `total` | 总条数。 |
| `page` | 当前页码。 |
| `page_size` | 当前页大小。 |

## 5. Management RPCs

### `CreatePackagingMethod`

创建包装方式。

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `tenant_id` | 是 | 显式租户边界。 |
| `method_code` | 是 | tenant 内包装方式编码。 |
| `method_name` | 是 | 包装方式名称。 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `packaging_method` | 新建后的包装方式。 |

### `UpdatePackagingMethod`

更新包装方式基础字段。

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `tenant_id` | 是 | 显式租户边界。 |
| `packaging_method_id` | 是 | 目标包装方式。 |
| `method_code` | 是 | 新包装方式编码。 |
| `method_name` | 是 | 新包装方式名称。 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `packaging_method` | 更新后的包装方式。 |

### `ChangePackagingMethodStatus`

变更包装方式 active 状态。

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `tenant_id` | 是 | 显式租户边界。 |
| `packaging_method_id` | 是 | 目标包装方式。 |
| `active` | 是 | 目标 active 状态。 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `packaging_method` | 变更后的包装方式。 |

### `CreatePackagingSpec`

创建包装规格。

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `tenant_id` | 是 | 显式租户边界。 |
| `item_model_id` | 是 | 目标 ItemModel。 |
| `packaging_method_id` | 是 | 包装方式。 |
| `customer_id` | 否 | 可选客户引用。 |
| `spec_code` | 是 | tenant 内包装规格编码。 |
| `spec_name` | 是 | 包装规格名称。 |
| `gross_weight` | 否 | 毛重。 |
| `volume` | 否 | 体积。 |
| `outer_length` | 否 | 外箱长度。 |
| `outer_width` | 否 | 外箱宽度。 |
| `outer_height` | 否 | 外箱高度。 |
| `work_instruction` | 否 | 简单作业要求。 |
| `version` | 否 | 版本。 |
| `effective_from` | 否 | 生效开始时间。 |
| `effective_to` | 否 | 生效结束时间。 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `packaging_spec` | 新建后的 PackagingSpec。 |

### `UpdatePackagingSpec`

更新包装规格基础字段。

请求 shape 与 `CreatePackagingSpec` 相同，但必须额外提供 `packaging_spec_id`。

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `packaging_spec` | 更新后的 PackagingSpec。 |

### `ChangePackagingSpecStatus`

变更包装规格 active 状态。

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `tenant_id` | 是 | 显式租户边界。 |
| `packaging_spec_id` | 是 | 目标 PackagingSpec。 |
| `active` | 是 | 目标 active 状态。 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `packaging_spec` | 变更后的 PackagingSpec。 |
