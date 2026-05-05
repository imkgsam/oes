# mes-service Manufacturing Spec Query API

## 1. 模块职责

`ManufacturingSpecQueryService` 负责 `mes-service` 第一阶段制造规格的只读查询能力，不修改状态。

调用基线：

- 接口类型：内部 gRPC
- 服务：`ManufacturingSpecQueryService`
- 所有 RPC 显式带 `tenant_id`
- 场景适用时显式带 `org_id`
- 所有 RPC 都要求：
  - internal service context
  - operator context
  - trace context

phase 1 query 只覆盖：

- 制造规格详情读取
- 制造规格分页列表
- 面向模具设计 / 模具建档的制造规格解析

phase 1 query 不覆盖：

- Sales SKU 映射查询
- 完整 Item selector
- 完整 ProductFamily 管理面
- 完整 `Routing / Operation` 查询
- quality rule 查询
- WIP runtime 查询
- 外部 HTTP / BFF surface

本文件是 contract freeze；截至 2026-05-05，内部 gRPC proto 与 `mes-service` runtime 已支持本文件的 phase 1 query surface。

## 2. 通用读取对象

### 2.1 `ManufacturingSpec`

phase 1 `ManufacturingSpec` 最小读取 shape：

| 字段 | 说明 |
| --- | --- |
| `manufacturing_spec_id` | 制造规格标识 |
| `tenant_id` | 显式租户边界 |
| `org_id` | optional 组织边界摘要 |
| `spec_code` | 制造规格编码 |
| `name` | 制造规格名称 |
| `revision_code` | phase 1 版本摘要 |
| `supersedes_spec_id` | optional 被替代规格 |
| `product_family_ref` | 产品族 opaque ref + display snapshot |
| `item_ref` | `manufacturable + PHYSICAL Item` ref + display snapshot |
| `manufacturing_attributes[]` | 制造属性摘要 |
| `route_intent_ref` | optional route intent / route ref |
| `status` | `DRAFT / ACTIVE / RETIRED` |
| `effective_from` | optional 生效起始时间 |
| `effective_to` | optional 生效截止时间 |
| `created_at` | 创建时间 |
| `updated_at` | 最近更新时间 |
| `version` | 并发版本摘要 |

说明：

- `ManufacturingSpec` 是 MES 制造规格 truth，不是 Item truth。
- `item_ref` 只保存稳定 Item id 与展示快照；Item code/name/category/composition 仍归 `item-master-service`。
- `product_family_ref` 第一阶段只作为 MES 制造规格侧分组引用，不冻结独立 product service。
- `route_intent_ref` 不代表完整 route contract 已冻结。

### 2.2 `ManufacturingAttribute`

phase 1 `ManufacturingAttribute` 最小读取 shape：

| 字段 | 说明 |
| --- | --- |
| `attribute_key` | 属性 key |
| `attribute_value` | 属性值摘要 |
| `display_name_snapshot` | optional 属性展示名 |
| `value_display_snapshot` | optional 属性值展示名 |

### 2.3 `ManufacturingSpecSummary`

phase 1 `ManufacturingSpecSummary` 最小 shape：

| 字段 | 说明 |
| --- | --- |
| `manufacturing_spec_id` | 制造规格标识 |
| `spec_code` | 制造规格编码 |
| `name` | 制造规格名称 |
| `revision_code` | 版本摘要 |
| `product_family_ref` | 产品族 ref + display snapshot |
| `item_ref` | Item ref + display snapshot |
| `status` | 规格状态 |

## 3. RPC 语义

### `GetManufacturingSpec`

- 作用：按 `manufacturing_spec_id` 读取单个制造规格。

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `tenant_id` | 是 | 显式租户边界 |
| `org_id` | 否 | 组织范围过滤 |
| `manufacturing_spec_id` | 是 | 目标制造规格 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `manufacturing_spec` | 单个 `ManufacturingSpec` 读取模型 |

返回语义：

- 目标存在且可见时返回 `manufacturing_spec`。
- 目标不存在或不在调用方 tenant / org 可见范围时返回 `NOT_FOUND`，不得用 `FAILED_PRECONDITION` 泄露跨 org 目标存在性。

### `ListManufacturingSpecs`

- 作用：按条件分页读取制造规格目录。

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `tenant_id` | 是 | 显式租户边界 |
| `org_id` | 否 | 组织范围过滤 |
| `keyword` | 否 | 按 `spec_code / name` 检索 |
| `product_family_ref_id` | 否 | 按产品族 opaque id 过滤 |
| `item_id` | 否 | 按 Item ref 过滤 |
| `attribute_filters[]` | 否 | 按制造属性 key/value 过滤 |
| `status` | 否 | 按 `DRAFT / ACTIVE / RETIRED` 过滤 |
| `include_retired` | 否 | 是否包含 retired；默认不包含 |
| `page` | 否 | 1-based 页码 |
| `page_size` | 否 | 页大小 |

`attribute_filters[]` 最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `attribute_key` | 是 | 属性 key |
| `attribute_value` | 是 | 属性值 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `manufacturing_specs[]` | 当前页 `ManufacturingSpecSummary` 列表 |
| `total` | 总条数 |
| `page` | 当前页码 |
| `page_size` | 当前页大小 |

空语义：

- 搜索结果为空时正常返回空页。
- 空页不是异常，不返回 `NOT_FOUND`。

### `ResolveManufacturingSpecsForMold`

- 作用：为模具设计、模具建档或模具适配校验解析可用制造规格。

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `tenant_id` | 是 | 显式租户边界 |
| `org_id` | 否 | 组织范围过滤 |
| `mold_design_id` | 否 | 已存在 MoldDesign；用于读取其制造规格适配 refs |
| `product_family_ref_id` | 否 | 按产品族过滤可用规格 |
| `item_id` | 否 | 按 Item ref 过滤可用规格 |
| `manufacturing_spec_ids[]` | 否 | 调用方显式请求解析的一组制造规格 |
| `include_retired` | 否 | 是否允许返回 retired；默认 false |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `resolved_specs[]` | 可用制造规格摘要列表 |
| `unavailable_refs[]` | 无法解析或不可用的引用摘要 |

`unavailable_refs[]` 最小 shape：

| 字段 | 说明 |
| --- | --- |
| `ref_type` | `MOLD_DESIGN / MANUFACTURING_SPEC / ITEM / PRODUCT_FAMILY` |
| `ref_id` | 请求中的引用 |
| `reason_code` | `NOT_FOUND / RETIRED / NOT_ACTIVE / NOT_VISIBLE / NOT_MANUFACTURABLE_ITEM / NOT_PHYSICAL_ITEM` |

关键语义：

- 至少必须提供 `mold_design_id`、`manufacturing_spec_ids[]`、`product_family_ref_id` 或 `item_id` 中的一种输入。
- 当提供 `mold_design_id` 时，服务应以该 MoldDesign 的 `manufacturing_spec_refs` 为主解析目标。
- 默认只返回 `ACTIVE` spec。
- `include_retired = true` 仅用于历史展示，不得被调用方用于新建 MoldDesign 或 WIP 绑定。
- 解析结果是 MES 内部制造规格可用性判断，不代表 Item、Sales SKU 或 quality rule truth。

## 4. 错误语义

phase 1 query 统一暴露以下错误面：

| 错误码 | 语义 |
| --- | --- |
| `INVALID_ARGUMENT` | 请求字段缺失、格式非法、分页参数非法、查询条件互相冲突，或 `ResolveManufacturingSpecsForMold` 没有任何解析输入 |
| `UNAUTHENTICATED` | 缺少有效 internal service context、operator context 或 trace context |
| `PERMISSION_DENIED` | 调用方存在上下文，但没有读取该 tenant / org 下制造规格的权限 |
| `NOT_FOUND` | 单对象读取目标不存在，或显式要求必须存在的 MoldDesign 不存在 |
| `FAILED_PRECONDITION` | 资源存在，但当前读取前提不满足，例如只允许 active spec 的场景中显式要求 retired spec |
| `UNAVAILABLE` | 当前服务暂不可用 |
| `INTERNAL` | 未归类的服务内部错误 |

补充说明：

- `ListManufacturingSpecs` 空页必须走正常响应语义。
- `ResolveManufacturingSpecsForMold` 对部分不可用引用应优先返回 `unavailable_refs[]`，而不是让整次查询失败；但 `mold_design_id` 本身不存在时返回 `NOT_FOUND`。
- query 返回的 display snapshot 只服务历史展示与列表阅读，不代表跨服务 owner truth。
