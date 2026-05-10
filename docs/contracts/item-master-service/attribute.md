# item-master-service Attribute Contract

## 1. Purpose

Attribute 用于表达物料本体或规格识别属性。第一阶段只冻结简单 attribute 模型：

- `AttributeDefinition`
- `AttributeOption`
- `ItemModelAttributeRule`

包装方式、客户包装、随箱配件、客户说明书、客户标签等不进入 attribute。

## 2. Read Model Shapes

`AttributeDefinition` 最小 shape：

| 字段 | 说明 |
| --- | --- |
| `attribute_definition_id` | 属性定义标识。 |
| `attribute_code` | tenant 内属性编码。 |
| `attribute_name` | 属性名称。 |
| `active` | 是否可用于新建业务。 |

`AttributeOption` 最小 shape：

| 字段 | 说明 |
| --- | --- |
| `attribute_option_id` | 属性选项标识。 |
| `attribute_definition_id` | 所属属性定义。 |
| `option_code` | tenant 内选项编码。 |
| `option_name` | 选项名称。 |
| `active` | 是否可用于新建业务。 |

`ItemModelAttributeRule` 最小 shape：

| 字段 | 说明 |
| --- | --- |
| `item_model_id` | 目标 ItemModel。 |
| `attribute_definition_id` | 允许的属性定义。 |
| `required` | 创建 Item 时是否必须锁定该属性。 |
| `allowed_option_ids[]` | 允许的 AttributeOption 集合。 |

## 3. Query RPCs

### `ListAttributeDefinitions`

分页读取 tenant 内 attribute definitions。

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `tenant_id` | 是 | 显式租户边界。 |
| `keyword` | 否 | 按 code / name 检索。 |
| `active` | 否 | 按 active 状态过滤。 |
| `page` | 否 | 1-based 页码。 |
| `page_size` | 否 | 页大小。 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `attribute_definitions[]` | 当前页属性定义。 |
| `total` | 总条数。 |
| `page` | 当前页码。 |
| `page_size` | 当前页大小。 |

### `ListAttributeOptions`

读取某个 attribute definition 下的 options。

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `tenant_id` | 是 | 显式租户边界。 |
| `attribute_definition_id` | 是 | 属性定义标识。 |
| `active` | 否 | 按 active 状态过滤。 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `attribute_options[]` | 属性选项列表。 |

### `GetItemModelAttributeRules`

读取某个 `ItemModel` 的 attribute 规则。

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `tenant_id` | 是 | 显式租户边界。 |
| `item_model_id` | 是 | 目标 ItemModel。 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `rules[]` | 当前 ItemModel 的 attribute rules。 |

## 4. Management RPCs

### `CreateAttributeDefinition`

创建属性定义。

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `tenant_id` | 是 | 显式租户边界。 |
| `attribute_code` | 是 | tenant 内属性编码。 |
| `attribute_name` | 是 | 属性名称。 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `attribute_definition` | 新建后的属性定义。 |

### `UpdateAttributeDefinition`

更新属性定义基础字段或 active 状态。

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `tenant_id` | 是 | 显式租户边界。 |
| `attribute_definition_id` | 是 | 目标属性定义。 |
| `attribute_code` | 是 | 新属性编码。 |
| `attribute_name` | 是 | 新属性名称。 |
| `active` | 是 | 目标 active 状态。 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `attribute_definition` | 更新后的属性定义。 |

### `CreateAttributeOption`

创建属性选项。

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `tenant_id` | 是 | 显式租户边界。 |
| `attribute_definition_id` | 是 | 所属属性定义。 |
| `option_code` | 是 | tenant 内选项编码。 |
| `option_name` | 是 | 选项名称。 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `attribute_option` | 新建后的属性选项。 |

### `UpdateAttributeOption`

更新属性选项基础字段或 active 状态。

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `tenant_id` | 是 | 显式租户边界。 |
| `attribute_option_id` | 是 | 目标属性选项。 |
| `option_code` | 是 | 新选项编码。 |
| `option_name` | 是 | 新选项名称。 |
| `active` | 是 | 目标 active 状态。 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `attribute_option` | 更新后的属性选项。 |

### `SetItemModelAttributeRules`

全量替换某个 `ItemModel` 的 attribute rules。

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `tenant_id` | 是 | 显式租户边界。 |
| `item_model_id` | 是 | 目标 ItemModel。 |
| `rules[]` | 是 | 替换后的完整规则集合。 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `rules[]` | 生效后的规则集合。 |

关键语义：

- 这是全量替换，不是 patch。
- `allowed_option_ids[]` 必须属于对应 `attribute_definition_id`。
- 第一阶段不引入复杂 `AttributeCombinationRule`。
