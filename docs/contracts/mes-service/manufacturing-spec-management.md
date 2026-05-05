# mes-service Manufacturing Spec Management API

## 1. 模块职责

`ManufacturingSpecManagementService` 负责 `mes-service` 第一阶段制造规格的命令型写接口。

命令范围只覆盖：

- 制造规格建档
- 制造规格基础信息更新
- 制造规格启用
- 制造规格退役

本文件不覆盖 Sales SKU 映射、完整 `Routing / Operation` 管理、完整 quality rule、WIP runtime、外部 HTTP / BFF surface 或 tenant-web UI。

本文件是 contract freeze；截至 2026-05-05，内部 gRPC proto 与 `mes-service` runtime 已支持本文件的 phase 1 management surface。

## 2. 通用上下文要求

所有 phase 1 management command 统一要求：

- `tenant_id`
- 场景适用时的 `org_id`
- internal service context
- operator context
- trace context
- audit context
- command id / idempotency key

补充约束：

- 所有 command 都必须按 command 语义处理，不得被调用方当作 query 或同步缓存接口使用。
- `ManufacturingSpec` 的状态、引用、唯一性与 owner 边界规则必须在 `mes-service` domain / application 层执行。
- gateway、DTO、Prisma schema 或 `src/common` 不得承载制造规格业务规则。
- command 目标、`supersedes_spec_id` 与 `replacement_spec_id` 必须属于同 tenant / org；跨 org 目标按不可见处理并返回 `NOT_FOUND`。

## 3. 写入基线语义

### 3.1 Owner Boundary

- `ManufacturingSpec` 归 `mes-service`。
- `ManufacturingSpec` 表达会影响制造现场执行、模具适配、路线选择与 WIP 属性锁定的制造规格。
- `ManufacturingSpec` 不是销售 SKU、不是 Item、不是 MoldDesign、不是完整 route、不是 quality rule。
- `item-master-service` 只提供 `manufacturable` 且 `PHYSICAL` 的 Item 准入边界。

### 3.2 引用与快照

`ProductFamilyRef` 最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `ref_id` | 是 | 产品族或 SPU 分组 opaque id |
| `ref_code_snapshot` | 否 | 展示 code 快照 |
| `display_name_snapshot` | 否 | 展示名称快照 |

`ItemRef` 最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `item_id` | 是 | `item-master-service` 中的 Item 标识 |
| `item_code_snapshot` | 否 | Item code 展示快照 |
| `item_name_snapshot` | 否 | Item name 展示快照 |

`RouteIntentRef` 最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `route_ref_id` | 否 | future route / routing owner 中的 opaque id |
| `route_code_snapshot` | 否 | route code 展示快照 |
| `display_name_snapshot` | 否 | route 名称展示快照 |

冻结约束：

- `item_ref.item_id` 必须指向当前租户可采用的 `manufacturable + PHYSICAL Item`。
- `ProductFamilyRef` 第一阶段只作为制造规格侧的轻量分组引用，不冻结独立 `product-service` 或完整产品族管理 contract。
- `RouteIntentRef` 只表达未来 route 关联意图，不冻结 route 管理面。
- display snapshot 只服务历史展示，不代表跨服务 owner truth。

### 3.3 ManufacturingSpec 状态

`ManufacturingSpec.status` phase 1 固定为：

| 状态 | 含义 | 允许进入方式 |
| --- | --- | --- |
| `DRAFT` | 已建档但不可作为正式制造引用 | `CreateManufacturingSpec` |
| `ACTIVE` | 可被模具、WIP 或后续执行流程引用 | `ActivateManufacturingSpec` |
| `RETIRED` | 已退役，不再允许新引用 | `RetireManufacturingSpec` |

冻结约束：

- 只有 `ACTIVE` spec 可以作为新的 `MoldDesign.manufacturing_spec_refs` 正式适配目标。
- `RETIRED` spec 不允许重新直接改回 `ACTIVE`；如需复用，应创建新 revision。
- 已被历史 MoldDesign、WIP 或事件引用的 spec 不得硬删除。
- `DRAFT` spec 可以更新；`ACTIVE` spec 只允许低风险展示字段与 future route intent 调整，制造属性变更应优先创建新 revision。

## 4. RPC 语义

### `CreateManufacturingSpec`

- 作用：创建一个制造规格草稿。

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `tenant_id` | 是 | 显式租户边界 |
| `org_id` | 否 | 适用时的组织边界 |
| `spec_code` | 是 | tenant + org 范围内唯一制造规格编码 |
| `name` | 是 | 制造规格名称 |
| `revision_code` | 否 | 第一阶段版本摘要 |
| `supersedes_spec_id` | 否 | 被替代的制造规格 |
| `product_family_ref` | 是 | 产品族 opaque ref + display snapshot |
| `item_ref` | 是 | `manufacturable + PHYSICAL Item` ref |
| `manufacturing_attributes[]` | 是 | 制造属性摘要 |
| `route_intent_ref` | 否 | optional route intent / route ref |
| `effective_from` | 否 | 生效起始时间 |
| `effective_to` | 否 | 生效截止时间 |
| `reason` | 是 | 建档原因 |

`manufacturing_attributes[]` 最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `attribute_key` | 是 | 属性 key，例如 `holePattern` |
| `attribute_value` | 是 | 属性值摘要 |
| `display_name_snapshot` | 否 | 属性展示名 |
| `value_display_snapshot` | 否 | 属性值展示名 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `manufacturing_spec` | 新建后的 `ManufacturingSpec`，初始状态为 `DRAFT` |

关键语义：

- `spec_code` 必须在 tenant + org 范围内唯一。
- `item_ref.item_id` 必须通过受控方式校验为 `manufacturable + PHYSICAL Item`。
- `manufacturing_attributes[]` 至少包含一个制造属性。
- `supersedes_spec_id` 若提供，必须属于同 tenant / org 且不得指向 `RETIRED` 之外的无效对象。
- 成功后必须写审计。

### `UpdateManufacturingSpec`

- 作用：更新制造规格基础信息或草稿属性。

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `tenant_id` | 是 | 显式租户边界 |
| `org_id` | 否 | 适用时的组织边界 |
| `manufacturing_spec_id` | 是 | 目标制造规格 |
| `expected_version` | 否 | 调用方认知版本，用于 stale command 防护 |
| `name` | 否 | 新名称 |
| `product_family_ref` | 否 | 产品族 opaque ref + display snapshot |
| `item_ref` | 否 | `manufacturable + PHYSICAL Item` ref |
| `manufacturing_attributes[]` | 否 | 替换后的制造属性摘要 |
| `route_intent_ref` | 否 | optional route intent / route ref |
| `effective_from` | 否 | 生效起始时间 |
| `effective_to` | 否 | 生效截止时间 |
| `reason` | 是 | 更新原因 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `manufacturing_spec` | 更新后的 `ManufacturingSpec` |

关键语义：

- `DRAFT` spec 允许更新制造属性、Item 引用、产品族引用与展示字段。
- `ACTIVE` spec 默认不允许变更 `item_ref` 或 `manufacturing_attributes[]`；如需改变制造语义，应创建新 revision。
- `RETIRED` spec 不允许更新，除非是审计化备注类 future 能力；phase 1 不冻结该能力。
- 若提供 `expected_version` 且与服务端不一致，返回 stale command / version conflict。
- 成功后必须写审计。

### `ActivateManufacturingSpec`

- 作用：启用制造规格，使其可被新模具、WIP 或后续执行流程引用。

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `tenant_id` | 是 | 显式租户边界 |
| `org_id` | 否 | 适用时的组织边界 |
| `manufacturing_spec_id` | 是 | 目标制造规格 |
| `expected_version` | 否 | 调用方认知版本 |
| `activated_at` | 否 | 启用时间；未传由服务记录当前时间 |
| `reason` | 是 | 启用原因 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `manufacturing_spec` | 启用后的 `ManufacturingSpec` |

关键语义：

- 只允许 `DRAFT -> ACTIVE`。
- 启用前必须重新校验 `item_ref.item_id` 仍为可采用的 `manufacturable + PHYSICAL Item`。
- 若 `effective_to` 已早于启用时间，必须返回 `FAILED_PRECONDITION`。
- 成功后必须写审计。

### `RetireManufacturingSpec`

- 作用：退役制造规格，禁止后续新引用。

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `tenant_id` | 是 | 显式租户边界 |
| `org_id` | 否 | 适用时的组织边界 |
| `manufacturing_spec_id` | 是 | 目标制造规格 |
| `expected_version` | 否 | 调用方认知版本 |
| `retired_at` | 否 | 退役时间；未传由服务记录当前时间 |
| `replacement_spec_id` | 否 | 替代制造规格 |
| `reason` | 是 | 退役原因 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `manufacturing_spec` | 退役后的 `ManufacturingSpec` |
| `replacement_spec_summary` | optional 替代规格摘要 |

关键语义：

- 允许 `DRAFT -> RETIRED` 或 `ACTIVE -> RETIRED`。
- `replacement_spec_id` 若提供，必须是同 tenant / org 下 `ACTIVE` spec。
- 退役不修复历史 MoldDesign、WIP 或事件引用。
- 退役后不得再被新 `MoldDesign` 作为适配规格引用。
- 成功后必须写审计。

## 5. 错误语义

phase 1 management 统一暴露以下错误面：

| 错误码 | 语义 |
| --- | --- |
| `INVALID_ARGUMENT` | 请求字段缺失、格式非法、制造属性为空、时间窗口非法、引用 shape 非法 |
| `UNAUTHENTICATED` | 缺少有效 internal service context、operator context、trace context 或 audit context |
| `PERMISSION_DENIED` | 调用方存在上下文，但没有在该 tenant / org 下维护制造规格的权限 |
| `NOT_FOUND` | 目标 `ManufacturingSpec`、替代 spec、被替代 spec、显式引用对象不存在，或目标不在调用方 tenant / org 可见范围内 |
| `ALREADY_EXISTS` | `spec_code` 重复，或同一 command id 已被不同请求占用 |
| `FAILED_PRECONDITION` | 状态或业务前提不满足，例如 retired spec 更新、active spec 制造属性变更、Item 不满足 `manufacturable + PHYSICAL`、过期 spec 启用 |
| `ABORTED` | stale command、并发版本冲突或 `expected_version` 与服务端不一致 |
| `UNAVAILABLE` | 下游依赖或当前服务暂不可用 |
| `INTERNAL` | 未归类的服务内部错误 |

错误分类冻结：

| taxonomy | 对应错误码 | 说明 |
| --- | --- | --- |
| duplicate spec code | `ALREADY_EXISTS` | `spec_code` 在 tenant + org 范围内重复 |
| invalid item reference | `NOT_FOUND / FAILED_PRECONDITION` | 不存在返回 `NOT_FOUND`，存在但不可制造或非物理返回 `FAILED_PRECONDITION` |
| invalid status transition | `FAILED_PRECONDITION` | 当前状态不允许该 command |
| active semantic mutation | `FAILED_PRECONDITION` | 尝试直接修改 active spec 的制造语义 |
| stale command / version conflict | `ABORTED / ALREADY_EXISTS` | stale version 返回 `ABORTED`；同 idempotency key 不同 payload 返回 `ALREADY_EXISTS` |

## 6. 审计

所有成功 command 必须写审计。

审计最小元数据：

| 字段 | 说明 |
| --- | --- |
| `tenant_id` | 租户边界 |
| `org_id` | optional 组织边界 |
| `operator_ref` | 操作人引用 |
| `operator_role_snapshot` | 操作时角色摘要 |
| `trace_id` | trace context |
| `command_id` | command id / idempotency key |
| `reason` | 命令原因 |
| `before_snapshot` | 变更前摘要 |
| `after_snapshot` | 变更后摘要 |
| `occurred_at` | 审计发生时间 |

phase 1 不冻结独立 integration event catalog；如 future 需要 `ManufacturingSpecCreated / ManufacturingSpecActivated / ManufacturingSpecRetired` 事件，应先进入事件 contract 设计。
