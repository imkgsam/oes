# finance-service Receivable Query API

## 1. 模块职责

`ReceivableQueryService` 负责 phase 1 客户应收计划与财务放行结果的只读查询能力，不修改状态。

调用基线：

- 接口类型：内部 gRPC
- 服务：`ReceivableQueryService`
- 所有 RPC 按 [Finance trusted gRPC baseline](README.md#6-security--context-baseline) 接受 exact-audience `BUSINESS / HUMAN / WEB` ExecutionToken
- tenant、org scope、operator 与 trace 由 trusted context 派生；以下 request 表只列业务 payload

phase 1 query 只覆盖：

- `ReceivableSchedule` 单对象读取
- `ReceivableSchedule` 目录搜索
- `FinanceReleaseSignal` 点查

phase 1 query 不覆盖：

- 完整 invoice lifecycle 读模型
- order profitability
- collection reconciliation dashboard
- statutory accounting 报表

## 2. 通用读取对象

### 2.1 `ReceivableSchedule`

phase 1 `ReceivableSchedule` 最小读取 shape：

| 字段 | 说明 |
| --- | --- |
| `receivable_schedule_id` | `ReceivableSchedule` 稳定标识 |
| `schedule_no` | 应收计划编号摘要 |
| `tenant_id` | 显式租户边界 |
| `org_id` | optional 组织边界摘要 |
| `source_sales_order_id` | 来源 `SalesOrder` 标识 |
| `customer_tenant_party_id` | 客户主体引用 |
| `customer_snapshot` | customer 显示名摘要 |
| `currency_code` | 计划币种 |
| `status` | `OPEN / PARTIALLY_PAID / PAID / CANCELLED / ON_HOLD` |
| `total_scheduled_amount` | 应收计划总额 |
| `total_allocated_amount` | 已核销金额 |
| `outstanding_amount` | 未收金额 |
| `lines[]` | `ReceivableScheduleLine` 列表 |
| `created_at` | 创建时间 |
| `updated_at` | 最近更新时间 |

说明：

- `ReceivableSchedule` 表达客户应付款计划
- 它不是实际回款
- 实际回款应通过 `AccountTransaction + PaymentAllocation` 体现

### 2.2 `ReceivableScheduleLine`

phase 1 `ReceivableScheduleLine` 最小读取 shape：

| 字段 | 说明 |
| --- | --- |
| `receivable_schedule_line_id` | 行标识 |
| `line_no` | 行号 |
| `due_date` | 到期日 |
| `scheduled_amount` | 应收计划金额 |
| `allocated_amount` | 已核销金额 |
| `outstanding_amount` | 未收金额 |
| `status` | `OPEN / PARTIALLY_PAID / PAID / CANCELLED / OVERDUE` |
| `source_sales_order_line_id` | optional 来源销售行引用 |
| `memo` | optional 备注 |

### 2.3 `FinanceReleaseSignal`

phase 1 `FinanceReleaseSignal` 最小读取 shape：

| 字段 | 说明 |
| --- | --- |
| `finance_release_signal_id` | 放行信号标识 |
| `tenant_id` | 显式租户边界 |
| `sales_order_id` | 目标 `SalesOrder` 标识 |
| `customer_tenant_party_id` | 目标客户主体引用 |
| `signal_status` | `RELEASED / HELD / REVIEW_REQUIRED` |
| `reason_code` | optional 原因码摘要 |
| `reason_summary` | optional 原因说明 |
| `effective_at` | 生效时间 |
| `expires_at` | optional 失效时间 |
| `based_on_summary` | optional 财务判断摘要 |
| `updated_at` | 最近更新时间 |

说明：

- `FinanceReleaseSignal` 是 Finance 发布给 Sales 的财务结果
- 它不是 `SalesOrder` gate owner truth
- Sales 只能把它当成商业 gate 的输入之一

### 2.4 `ReceivableScheduleSummary`

phase 1 列表读取最小 shape：

| 字段 | 说明 |
| --- | --- |
| `receivable_schedule_id` | 应收计划标识 |
| `schedule_no` | 计划编号摘要 |
| `source_sales_order_id` | 来源销售单 |
| `customer_tenant_party_id` | 客户主体引用 |
| `customer_display_name` | 客户显示名摘要 |
| `currency_code` | 币种 |
| `status` | 当前状态 |
| `outstanding_amount` | 未收金额 |
| `nearest_due_date` | optional 最近到期日 |
| `finance_release_status` | optional 当前放行状态摘要 |

## 3. RPC 语义

### `GetReceivableSchedule`

- 作用：按 `receivable_schedule_id` 读取单个应收计划

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `receivable_schedule_id` | 是 | 目标应收计划标识 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `receivable_schedule` | 单个 `ReceivableSchedule` 读取模型 |

空语义：

- 目标 `ReceivableSchedule` 存在时返回 `receivable_schedule`
- 目标 `ReceivableSchedule` 不存在时返回 `NOT_FOUND`

### `SearchReceivableSchedules`

- 作用：按条件分页搜索应收计划目录

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `keyword` | 否 | 按 `schedule_no / sales_order_no / customer` 轻量检索 |
| `customer_tenant_party_id` | 否 | 按客户过滤 |
| `source_sales_order_id` | 否 | 按销售单过滤 |
| `status` | 否 | 按计划状态过滤 |
| `finance_release_status` | 否 | 按财务放行状态过滤 |
| `overdue_only` | 否 | 只看存在逾期行的计划 |
| `due_from` | 否 | 到期起始日期 |
| `due_to` | 否 | 到期截止日期 |
| `page` | 否 | 1-based 页码 |
| `page_size` | 否 | 页大小 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `receivable_schedules[]` | 当前页 `ReceivableScheduleSummary` 列表 |
| `total` | 总条数 |
| `page` | 当前页码 |
| `page_size` | 当前页大小 |

空语义：

- 搜索结果为空时正常返回空页

### `GetFinanceReleaseSignal`

- 作用：读取某个 `SalesOrder` 当前有效的财务放行信号

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `sales_order_id` | 是 | 目标 `SalesOrder` 标识 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `finance_release_signal` | 单个 `FinanceReleaseSignal` 读取模型 |

空语义：

- 目标 `SalesOrder` 当前存在有效信号时返回 `finance_release_signal`
- 当前不存在有效信号时返回 `NOT_FOUND`

## 4. 错误语义

phase 1 query 统一暴露以下错误面：

| 错误码 | 语义 |
| --- | --- |
| `INVALID_ARGUMENT` | 请求字段缺失、格式非法、分页参数非法或搜索条件冲突 |
| `UNAUTHENTICATED` | 缺少或无法验证 exact-audience HUMAN WEB ExecutionToken / mTLS binding |
| `PERMISSION_DENIED` | 调用方存在上下文，但没有读取该 tenant / org / customer / sales order 的权限 |
| `NOT_FOUND` | `GetReceivableSchedule` 或 `GetFinanceReleaseSignal` 的目标对象不存在 |
| `FAILED_PRECONDITION` | 资源存在，但当前读取前提不满足 |
| `UNAVAILABLE` | 当前服务暂不可用 |
| `INTERNAL` | 未归类的服务内部错误 |

补充说明：

- `SearchReceivableSchedules` 空页必须走正常响应语义
- phase 1 query 不使用 `ALREADY_EXISTS`
