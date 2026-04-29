# procurement-service Purchase Request Management API

## 1. 模块职责

`PurchaseRequestManagementService` 负责 phase 1 采购需求对象的命令型写接口。

## 2. 通用上下文要求

所有 phase 1 management command 统一要求：

- `tenant_id`
- 场景适用时的 `org_id`
- internal service context
- operator context
- trace context
- audit context

补充约束：

- 本文件只冻结“必须要求这些上下文存在”，不展开完整内部字段结构
- 所有 command 都必须按 command 语义处理，不得被调用方当作 query 或草稿缓存接口使用
- phase 1 不冻结 command metadata header、幂等键设计、重试策略或审计落库结构

## 3. 写入基线语义

### 3.1 `PurchaseRequest` 边界

- `CreatePurchaseRequest` 创建的是采购需求，不创建采购承诺
- `PurchaseRequest` phase 1 统一承接：
  - 部门日常采购
  - 销售专采
  - 生产 / 包装需求
  - 维修需求
  - 样品采购
- 采购类支出在 phase 1 的正常路径必须先进入 `PR / PO`
- `Non-PO purchase` 不作为正常主线，不得借 `CreatePurchaseRequest` 反向设计直通例外路径

### 3.2 `PurchaseRequestLine` 边界

- `STANDARD_ITEM` 行必须引用当前存在且 `purchasable` 的 Item
- `TEXT` 行必须提供明确文本说明，不要求先存在 Item 主数据
- phase 1 不强制在 `PR` 阶段锁定供应商，也不把 `SupplierOffering` 校验前置到所有 `PR` 场景

### 3.3 审批快照边界

- `PurchaseRequestApprovalSnapshot` 只表达冻结后的采购侧决策结果
- `DecidePurchaseRequest` 不意味着 phase 1 已引入完整 workflow engine
- phase 1 只冻结 `APPROVED / REJECTED` 最小决策语义

### 3.4 生命周期边界

- `CreatePurchaseRequest` 成功后默认进入 `DRAFT`
- `UpdatePurchaseRequestDraft` 只允许作用于 `DRAFT`
- `SubmitPurchaseRequest` 只允许把 `DRAFT` 提交为 `SUBMITTED`
- `DecidePurchaseRequest` 只允许决策 `SUBMITTED`
- `CancelPurchaseRequest` 不得绕过当前生命周期约束关闭已不允许取消的需求
- `ConvertPurchaseRequestToPurchaseOrder` 只允许基于 `APPROVED / PARTIALLY_CONVERTED` 的 `PR` 把新增选中数量并入 `PO` 草稿

## 4. RPC 语义

### `CreatePurchaseRequest`

- 作用：创建一个新的采购需求草稿

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `tenant_id` | 是 | 显式租户边界 |
| `org_id` | 否 | 适用时的组织边界 |
| `request_type` | 是 | `DEPARTMENTAL / SALES_DEDICATED / PRODUCTION_PACKAGING / MAINTENANCE / SAMPLE` |
| `title` | 否 | optional 采购主题 |
| `reason` | 否 | optional 申请原因 |
| `lines[]` | 是 | 初始采购需求行 |

`lines[]` 最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `line_type` | 是 | `STANDARD_ITEM / TEXT` |
| `item_id` | 否 | `STANDARD_ITEM` 必填 |
| `description` | 是 | 文本说明；`TEXT` 行必须具备明确描述 |
| `requested_quantity` | 是 | 需求数量 |
| `uom` | 是 | 计量单位摘要 |
| `needed_by_date` | 否 | optional 期望到货日期 |
| `demand_reference_type` | 否 | optional 归因类型摘要 |
| `demand_reference_id` | 否 | optional 归因对象标识 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `purchase_request` | 新建后的 `PurchaseRequest` |

关键语义：

- 成功创建后状态必须为 `DRAFT`
- `STANDARD_ITEM` 行成功前必须完成 Item 存在性与 `purchasable` 校验
- `TEXT` 行不强制依赖 Item 主数据

### `UpdatePurchaseRequestDraft`

- 作用：更新一个现有 `DRAFT` PR 的可编辑内容

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `tenant_id` | 是 | 显式租户边界 |
| `purchase_request_id` | 是 | 目标 PR 标识 |
| `title` | 否 | 更新后的主题 |
| `reason` | 否 | 更新后的原因 |
| `lines[]` | 是 | 草稿最终应保存的完整行集合 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `purchase_request` | 更新后的 `PurchaseRequest` |

关键语义：

- 本命令只允许作用于 `DRAFT`
- `lines[]` 采用全量替换语义
- 未出现在新集合中的旧行必须被移除
- `STANDARD_ITEM` 行更新后仍必须满足 Item 存在且 `purchasable`

### `SubmitPurchaseRequest`

- 作用：把 `DRAFT` PR 提交为待决策需求

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `tenant_id` | 是 | 显式租户边界 |
| `purchase_request_id` | 是 | 目标 PR 标识 |
| `submission_comment` | 否 | optional 提交备注 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `purchase_request` | 提交后的 `PurchaseRequest` |

关键语义：

- 只允许从 `DRAFT -> SUBMITTED`
- 提交前至少必须存在一条有效行
- 提交时不得把文本型需求强制升级成标准 Item

### `DecidePurchaseRequest`

- 作用：记录 `SUBMITTED` PR 的当前冻结决策

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `tenant_id` | 是 | 显式租户边界 |
| `purchase_request_id` | 是 | 目标 PR 标识 |
| `decision` | 是 | `APPROVED / REJECTED` |
| `comment` | 否 | optional 决策说明 |
| `approval_reference` | 否 | optional 审计 / workflow 引用 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `purchase_request` | 决策后的 `PurchaseRequest` |

关键语义：

- 只允许对 `SUBMITTED` PR 做决策
- 决策成功后必须生成当前生效的 `approval_snapshot`
- `APPROVED` 只表达采购需求被放行进入后续采购承诺建立，不等于已经形成 `PO`

### `CancelPurchaseRequest`

- 作用：取消一个当前仍允许取消的采购需求

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `tenant_id` | 是 | 显式租户边界 |
| `purchase_request_id` | 是 | 目标 PR 标识 |
| `cancel_reason` | 是 | 取消原因 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `purchase_request` | 取消后的 `PurchaseRequest` |

关键语义：

- phase 1 只冻结“服务必须拒绝不再允许取消的 PR”这一行为边界
- 具体何时因已锁定后续采购承诺而不可取消，留给 realization 在本边界内实现
- 取消成功后状态必须为 `CANCELLED`

### `ConvertPurchaseRequestToPurchaseOrder`

- 作用：将已批准的 `PR line` 转入新的或现有的 `DRAFT PO`

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `tenant_id` | 是 | 显式租户边界 |
| `target_purchase_order_id` | 否 | 如传入则并入现有 `DRAFT PO`；不传入则创建新的 `DRAFT PO` |
| `supplier_id` | 否 | 创建新 `PO` 时必填；并入现有 `PO` 时由目标 `PO` 决定 |
| `source_lines[]` | 是 | 进入 `PO` 的 PR 行选择，可来自一个或多个 `APPROVED / PARTIALLY_CONVERTED PR` |
| `currency_code` | 否 | 创建新 `PO` 时必填；并入现有 `PO` 时可省略 |
| `payment_terms_snapshot` | 否 | optional 本次采购付款条款快照 |
| `supplier_commercial_terms_snapshot` | 否 | optional 本次采购商业条款快照 |

`source_lines[]` 最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `purchase_request_id` | 是 | 源 PR 标识 |
| `purchase_request_line_id` | 是 | 源 PR 行标识 |
| `purchase_order_quantity` | 是 | 拟转成 PO 的数量 |
| `ordered_unit_price` | 否 | optional 拟定单价 |
| `general_stock_excess_reason` | 否 | 当数量超出源 PR 需求时必须提供 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `purchase_order` | 新建或更新后的 `PO` 草稿 |

关键语义：

- 本命令可用于：
  - 基于选中 `PR line` 创建新的 `DRAFT PO`
  - 将额外选中 `PR line` 并入现有 `DRAFT PO`，以支持多 `PR` 合并下单
- 不得因为转单而创建新的 `PR`
- 不得因为转单而删除旧的 `PR / PR line`
- 源 `PR / PR line` 必须保留，并在转单后更新为 `PARTIALLY_CONVERTED / CONVERTED`
- 标准 `Item` 行转为 `PO` 草稿时，必须同步校验：
  - 目标供应商当前为 `ACTIVE`
  - Item 当前存在
  - Item 当前 `purchasable`
  - 目标供应商当前存在 `ACTIVE SupplierOffering`
- 文本型 / 非标准采购选择供应商时，仍必须校验目标供应商当前为 `ACTIVE`
- 文本型 / 非标准采购可不强制依赖 `ACTIVE SupplierOffering`
- `payment_terms_snapshot` 与 `supplier_commercial_terms_snapshot` 只保存本次采购快照，不改变 `SRM` owner truth
- 若同一 `PR line` 仅部分数量被并入 `PO`，该行与所属 `PR` 必须进入 `PARTIALLY_CONVERTED`
- 若同一 `PR line` 的剩余可转数量全部被并入 `PO`，该行必须进入 `CONVERTED`
- 当源 `PR` 的全部可转行都已完成转单时，源 `PR` 必须进入 `CONVERTED`
- 当 `purchase_order_quantity > requested_quantity` 时，超出部分必须在后续 `PO allocation` 中标记为 `general stock`，并保留 reason

## 5. 错误语义

phase 1 management 统一暴露以下错误面：

| 错误码 | 语义 |
| --- | --- |
| `INVALID_ARGUMENT` | 请求字段缺失、格式非法、`TEXT` 行缺少描述、`STANDARD_ITEM` 行缺少 `item_id`，或数量 / 计量单位非法 |
| `UNAUTHENTICATED` | 缺少有效 internal service context、operator context、trace context 或 audit context |
| `PERMISSION_DENIED` | 调用方存在上下文，但没有在该 tenant / org / PR 上执行命令的权限 |
| `NOT_FOUND` | 目标 `PurchaseRequest / PurchaseRequestLine / PurchaseOrder / Item / SupplierProfile` 不存在 |
| `ALREADY_EXISTS` | 当前命令违反唯一性约束 |
| `FAILED_PRECONDITION` | 资源存在，但当前状态或外部真相不满足命令前提，例如对非 `DRAFT` 更新、对非 `SUBMITTED` 决策、并入的目标 `PO` 不是 `DRAFT`、目标供应商非 `ACTIVE`、标准 Item 不可采购，或标准 Item 缺少 `ACTIVE SupplierOffering` |
| `UNAVAILABLE` | 下游依赖或当前服务暂不可用 |
| `INTERNAL` | 未归类的服务内部错误 |

补充说明：

- 标准 `Item` 校验失败、`SupplierOffering` 不满足、PR 生命周期不满足，都必须走 `FAILED_PRECONDITION`
- phase 1 不冻结 workflow engine 失败语义
