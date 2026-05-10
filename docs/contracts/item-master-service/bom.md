# item-master-service BOM Contract

## 1. Purpose

`BOM` 统一表达 `Item` 与 `Item` 之间的输入、输出、组成、转换与消耗关系。

第一阶段 BOM 类型：

- `COMPOSITION_BOM`
- `TRANSFORMATION_BOM`
- `PACKAGING_BOM`

BOM 只定义输入、输出、组成、转换与消耗关系，不等于工序。工序、人员、WorkCenter、质量结果由 MES 或 WMS 的任务执行对象记录。

## 2. Read Model Shape

`BOM` 最小 shape：

| 字段 | 说明 |
| --- | --- |
| `bom_id` | BOM 稳定标识。 |
| `bom_code` | tenant 内 BOM 编码。 |
| `bom_name` | BOM 名称。 |
| `bom_type` | `COMPOSITION_BOM / TRANSFORMATION_BOM / PACKAGING_BOM`。 |
| `output_item_id` | 输出 Item。 |
| `active` | 是否可用于新建业务。 |
| `lines[]` | BOM line 列表。 |
| `created_at` | 创建时间。 |
| `updated_at` | 更新时间。 |

`BOMLine` 最小 shape：

| 字段 | 说明 |
| --- | --- |
| `bom_line_id` | BOM line 标识。 |
| `component_item_id` | 输入 / 组件 / 消耗 Item。 |
| `line_role` | `PRIMARY_INPUT / COMPONENT / PACKAGING_MATERIAL`。 |
| `quantity` | 数量。 |
| `uom_code` | 单位编码。 |
| `line_note` | 行备注。 |

## 3. Query RPCs

### `GetBom`

按 `bom_id` 读取单个 BOM。

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `tenant_id` | 是 | 显式租户边界。 |
| `bom_id` | 是 | 目标 BOM。 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `bom` | 单个 BOM。 |

### `SearchBoms`

分页搜索 BOM。

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `tenant_id` | 是 | 显式租户边界。 |
| `keyword` | 否 | 按 `bom_code / bom_name` 检索。 |
| `bom_type` | 否 | 按 BOM 类型过滤。 |
| `output_item_id` | 否 | 按输出 Item 过滤。 |
| `component_item_id` | 否 | 按输入 / 组件 Item 过滤。 |
| `active` | 否 | 按 active 状态过滤。 |
| `page` | 否 | 1-based 页码。 |
| `page_size` | 否 | 页大小。 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `boms[]` | 当前页 BOM。 |
| `total` | 总条数。 |
| `page` | 当前页码。 |
| `page_size` | 当前页大小。 |

### `GetBomByOutputItem`

按输出 Item 与 BOM 类型读取当前 active BOM。

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `tenant_id` | 是 | 显式租户边界。 |
| `output_item_id` | 是 | 输出 Item。 |
| `bom_type` | 是 | BOM 类型。 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `resolution_status` | `MATCHED / NO_MATCH`。 |
| `bom` | 命中时返回 BOM；未命中时为空。 |

空语义：

- 未命中返回 `NO_MATCH`，不是异常。
- 若存在多个 active BOM 命中同一 `output_item_id + bom_type`，表示主数据不一致，应返回 `FAILED_PRECONDITION`。

## 4. Management RPCs

### `CreateBom`

创建 BOM。

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `tenant_id` | 是 | 显式租户边界。 |
| `bom_code` | 是 | tenant 内 BOM 编码。 |
| `bom_name` | 是 | BOM 名称。 |
| `bom_type` | 是 | BOM 类型。 |
| `output_item_id` | 是 | 输出 Item。 |
| `lines[]` | 是 | BOM lines。 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `bom_id` | 新建 BOM 标识。 |
| `bom` | 新建后的 BOM。 |

关键语义：

- `output_item_id` 必须指向 active Item。
- `COMPOSITION_BOM` 输出 Item 应具备 `assemblable`。
- `TRANSFORMATION_BOM` 输出 Item 应具备 `transformable`。
- `PACKAGING_BOM` 输出 Item 应具备 `packaged`。
- 所有 `lines[].component_item_id` 必须指向 active Item。
- `PACKAGING_BOM` 必须至少有一行 `line_role = PRIMARY_INPUT`，该行 `component_item_id` 应指向 active + packable Item。
- 第一阶段 BOM line 不使用 `consumable` capability 限制。
- 必须禁止 BOM 循环，包括直接循环和多层循环。

### `UpdateBomBasics`

更新 BOM 基础字段。

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `tenant_id` | 是 | 显式租户边界。 |
| `bom_id` | 是 | 目标 BOM。 |
| `bom_code` | 是 | 新 BOM 编码。 |
| `bom_name` | 是 | 新 BOM 名称。 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `bom` | 更新后的 BOM。 |

### `ReplaceBomLines`

全量替换 BOM lines。

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `tenant_id` | 是 | 显式租户边界。 |
| `bom_id` | 是 | 目标 BOM。 |
| `lines[]` | 是 | 替换后的完整 BOM lines。 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `bom` | 替换 lines 后的 BOM。 |

关键语义：

- 这是全量替换，不是 patch。
- 空 `lines[]` 表示清空当前 BOM lines，但 BOM 自身仍存在。
- 替换后的所有 `lines[].component_item_id` 必须指向 active Item。
- 替换后仍必须通过循环校验。
- `PACKAGING_BOM` 替换后仍必须满足至少一个 active + packable `PRIMARY_INPUT`。

### `ChangeBomStatus`

变更 BOM active 状态。

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `tenant_id` | 是 | 显式租户边界。 |
| `bom_id` | 是 | 目标 BOM。 |
| `active` | 是 | 目标 active 状态。 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `bom` | 变更后的 BOM。 |

## 5. Deferred

- 虚拟套装 / kit 销售展开。
- 复杂替代料。
- 可选 BOM 行。
- BOM line 使用 `consumable` capability 限制。
