# finance-service Payable / Payment Query API

## 1. 模块职责

`PaymentQueryService` 负责 phase 1B 应付计划、付款申请、付款执行与应付核销结果的只读查询能力，不修改状态。

调用基线：

- 接口类型：内部 `gRPC`
- 服务：`PaymentQueryService`
- 所有 RPC 按 [Finance trusted gRPC baseline](README.md#6-security--context-baseline) 接受 exact-audience `BUSINESS / HUMAN / WEB` ExecutionToken
- tenant、org scope、operator 与 trace 由 trusted context 派生；以下 request 表只列业务 payload

phase 1B query 只覆盖：

- `PayableSchedule` 单对象读取
- `PayableSchedule` 目录搜索
- `PaymentRequest` 目录搜索
- `PaymentExecution` 目录搜索
- `PaymentAllocation` 目录搜索

phase 1B query 不覆盖：

- full `SupplierInvoice` lifecycle read model
- `SupplierStatement` reconciliation read model
- full `AP matching`
- automatic bank reconciliation
- `GL / Journal / JournalEntry`
- `ExpenseClaim` dashboard
- credit / refund / offset formal lifecycle

## 2. 通用读取对象

### 2.1 `PayableSchedule`

phase 1B `PayableSchedule` 最小读取 shape：

| 字段 | 说明 |
| --- | --- |
| `payable_schedule_id` | `PayableSchedule` 稳定标识 |
| `schedule_no` | 应付计划编号摘要 |
| `tenant_id` | 显式租户边界 |
| `org_id` | optional 组织边界摘要 |
| `source_type` | 固定为 `PURCHASE_ORDER` |
| `source_purchase_order_id` | 来源 `PurchaseOrder` 标识 |
| `source_purchase_order_no` | 来源 `PO` 编号摘要 |
| `procurement_snapshot_reference` | Procurement 交易快照引用摘要 |
| `supplier_tenant_party_id` | 供应商主体引用 |
| `supplier_snapshot` | supplier 显示名摘要 |
| `currency_code` | 计划币种 |
| `status` | `OPEN / PARTIALLY_PAID / PAID / CANCELLED / ON_HOLD` |
| `total_scheduled_amount` | 应付计划总额 |
| `total_requested_amount` | 已进入付款申请的金额摘要 |
| `total_executed_amount` | 已执行付款金额摘要 |
| `total_allocated_amount` | 已核销金额 |
| `outstanding_amount` | 未付金额 |
| `lines[]` | `PayableScheduleLine` 列表 |
| `created_at` | 创建时间 |
| `updated_at` | 最近更新时间 |

说明：

- `PayableSchedule` 是应付计划真相，不是付款申请，也不是实际流水
- phase 1B 默认一个已发 `PO` 对应一个 `PayableSchedule`
- 多条 `PayableScheduleLine` 用于表达定金、尾款、分期与账期

### 2.2 `PayableScheduleLine`

phase 1B `PayableScheduleLine` 最小读取 shape：

| 字段 | 说明 |
| --- | --- |
| `payable_schedule_line_id` | 行标识 |
| `line_no` | 行号 |
| `line_type` | `DEPOSIT / BALANCE / INSTALLMENT / TERM_DUE / ADJUSTMENT` |
| `source_ref` | 对上游 `PO / PO change` 的稳定来源引用 |
| `due_date` | 到期日 |
| `scheduled_amount` | 应付计划金额 |
| `requested_amount` | 已进入付款申请的金额摘要 |
| `executed_amount` | 已执行付款金额摘要 |
| `allocated_amount` | 已核销金额 |
| `outstanding_amount` | 未付金额 |
| `status` | `OPEN / PARTIALLY_PAID / PAID / CANCELLED / OVERDUE` |
| `request_governance_status` | `NONE / DUE_NO_REQUEST / EARLY_REQUEST / REQUEST_SUBMITTED / APPROVED_PENDING_EXECUTION / PARTIALLY_PAID / PAID` |
| `source_purchase_order_line_id` | optional 来源采购行引用 |
| `supersedes_source_ref` | optional 被 supersede 的旧 `source_ref` |
| `memo` | optional 备注 |

说明：

- `DUE_NO_REQUEST` 表示已到期但当前没有有效付款申请
- `EARLY_REQUEST` 表示付款申请早于该行 `due_date`，且必须带原因
- 已付款 / 已核销历史不得通过覆盖本行静默改写

### 2.3 `PaymentRequest`

phase 1B `PaymentRequest` 最小读取 shape：

| 字段 | 说明 |
| --- | --- |
| `payment_request_id` | 付款申请标识 |
| `request_no` | 付款申请编号摘要 |
| `tenant_id` | 显式租户边界 |
| `org_id` | optional 组织边界摘要 |
| `request_source` | `PROCUREMENT_INITIATED / FINANCE_INITIATED` |
| `source_purchase_order_id` | optional 从采购侧发起时的来源 `PO` |
| `supplier_tenant_party_id` | 供应商主体引用 |
| `beneficiary_supplier_financial_account_id` | 目标供应商收款账号引用 |
| `currency_code` | 申请币种 |
| `requested_amount` | 申请金额 |
| `status` | `SUBMITTED / APPROVED / REJECTED / PARTIALLY_EXECUTED / EXECUTED / CANCELLED` |
| `reason` | optional 申请原因摘要 |
| `lines[]` | `PaymentRequestLine` 列表 |
| `evidence_snapshots[]` | `SupplierBillEvidenceSnapshot` 列表 |
| `requested_at` | 申请时间 |
| `updated_at` | 最近更新时间 |

说明：

- `PaymentRequest` 是申请付款 / 付款治理入口，不是 payable truth
- 采购员可从 `PO` 发起 `PROCUREMENT_INITIATED` request
- 财务可从到期应付计划发起 `FINANCE_INITIATED` request

### 2.4 `PaymentRequestLine`

phase 1B `PaymentRequestLine` 最小读取 shape：

| 字段 | 说明 |
| --- | --- |
| `payment_request_line_id` | 付款申请行标识 |
| `payable_schedule_id` | 关联应付计划标识 |
| `payable_schedule_line_id` | 关联应付计划行标识 |
| `schedule_due_date` | 对应应付计划行到期日 |
| `requested_amount` | 本行申请金额 |
| `is_early_request` | 是否早于到期日发起 |
| `line_status` | `OPEN / PARTIALLY_EXECUTED / EXECUTED / CANCELLED` |

说明：

- `PaymentRequestLine` 只把申请与 `PayableScheduleLine` 建立治理关联
- 它不替代 `PayableScheduleLine` 的金额与状态真相

### 2.5 `PaymentExecution`

phase 1B `PaymentExecution` 最小读取 shape：

| 字段 | 说明 |
| --- | --- |
| `payment_execution_id` | 付款执行记录标识 |
| `payment_request_id` | 所属付款申请 |
| `source_financial_account_id` | 出款公司资金账户 |
| `beneficiary_supplier_financial_account_id` | optional 目标供应商收款账号引用 |
| `beneficiary_account_snapshot` | 目标收款账号脱敏摘要 |
| `executed_amount` | 执行金额 |
| `currency_code` | 执行币种 |
| `executed_at` | 执行时间 |
| `execution_reference` | optional 执行参考号 |
| `attachment_refs[]` | optional 付款凭证附件引用 |
| `linked_account_transaction_id` | optional 关联真实流水 |
| `status` | `RECORDED / MATCHED / VOIDED` |

说明：

- `PaymentExecution` 表达财务实际付款动作
- 它不自动等价于 `AccountTransaction`
- 真实资金流水仍由 `AccountTransaction` 表达

### 2.6 `PaymentAllocation`

phase 1B `PaymentAllocation` 最小读取 shape：

| 字段 | 说明 |
| --- | --- |
| `payment_allocation_id` | 核销标识 |
| `account_transaction_id` | 被核销的真实流水 |
| `payment_execution_id` | optional 关联的付款执行记录 |
| `payment_request_id` | optional 关联的付款申请 |
| `target_type` | 固定为 `PAYABLE_SCHEDULE_LINE` 或 `RECEIVABLE_SCHEDULE_LINE` |
| `target_schedule_id` | 目标计划标识 |
| `target_schedule_line_id` | 目标计划行标识 |
| `allocated_amount` | 核销金额 |
| `currency_code` | 核销币种 |
| `allocated_at` | 核销时间 |

说明：

- `PaymentAllocation` 表达真实流水核销结果
- 应付侧只允许以 `OUTFLOW` 真实流水核销到 `PAYABLE_SCHEDULE_LINE`

### 2.7 `SupplierFinancialAccount`

phase 1B payable / payment consume 的最小 `SupplierFinancialAccount` shape：

| 字段 | 说明 |
| --- | --- |
| `supplier_financial_account_id` | 供应商收款账号标识 |
| `supplier_tenant_party_id` | 目标供应商主体引用 |
| `account_holder_name` | 开户名 / 账户名摘要 |
| `account_provider_type` | `BANK / WECHAT / ALIPAY / PAYPAL / STRIPE / OTHER` |
| `account_identifier_masked` | 脱敏后的账号摘要 |
| `currency_code` | optional 常用币种摘要 |
| `is_default` | 是否默认首选账号 |
| `verified_status` | `UNVERIFIED / VERIFIED` |

说明：

- 该对象表达付款目标账号引用
- 它不是 `SupplierProfile`，也不是付款真相本身

### 2.8 `SupplierBillEvidenceSnapshot`

phase 1B supplier bill evidence snapshot 最小读取 shape：

| 字段 | 说明 |
| --- | --- |
| `evidence_snapshot_id` | 证据快照标识 |
| `evidence_type` | `SUPPLIER_BILL / SUPPLIER_INVOICE / SUPPLIER_STATEMENT / OTHER` |
| `external_document_no` | optional 外部单据号摘要 |
| `document_date` | optional 单据日期 |
| `currency_code` | optional 单据币种 |
| `document_amount` | optional 单据金额摘要 |
| `attachment_ref` | optional 附件引用 |
| `note` | optional 备注 |
| `captured_at` | 采集时间 |

说明：

- phase 1B 中 supplier bill / invoice / statement 只作为 `PaymentRequest` evidence snapshot
- 它们不升级为正式 `SupplierInvoice / SupplierStatement` lifecycle 对象

### 2.9 `PayableScheduleSummary`

phase 1B 列表读取最小 shape：

| 字段 | 说明 |
| --- | --- |
| `payable_schedule_id` | 应付计划标识 |
| `schedule_no` | 计划编号摘要 |
| `source_purchase_order_id` | 来源采购单 |
| `source_purchase_order_no` | 来源采购单编号摘要 |
| `supplier_tenant_party_id` | 供应商主体引用 |
| `supplier_display_name` | 供应商显示名摘要 |
| `currency_code` | 币种 |
| `status` | 当前计划状态 |
| `request_governance_status_summary` | 当前治理状态摘要 |
| `outstanding_amount` | 未付金额 |
| `nearest_due_date` | optional 最近到期日 |

### 2.10 `PaymentRequestSummary`

phase 1B 列表读取最小 shape：

| 字段 | 说明 |
| --- | --- |
| `payment_request_id` | 付款申请标识 |
| `request_no` | 申请编号摘要 |
| `request_source` | 申请来源 |
| `supplier_tenant_party_id` | 供应商主体引用 |
| `supplier_display_name` | 供应商显示名摘要 |
| `currency_code` | 币种 |
| `requested_amount` | 申请金额 |
| `status` | 当前状态 |
| `requested_at` | 申请时间 |

### 2.11 `PaymentExecutionSummary`

phase 1B 列表读取最小 shape：

| 字段 | 说明 |
| --- | --- |
| `payment_execution_id` | 执行记录标识 |
| `payment_request_id` | 所属付款申请 |
| `supplier_tenant_party_id` | 供应商主体引用 |
| `executed_amount` | 执行金额 |
| `currency_code` | 币种 |
| `status` | 当前状态 |
| `executed_at` | 执行时间 |

## 3. RPC 语义

### `GetPayableSchedule`

- 作用：按 `payable_schedule_id` 读取单个应付计划

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `payable_schedule_id` | 是 | 目标应付计划标识 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `payable_schedule` | 单个 `PayableSchedule` 读取模型 |

空语义：

- 目标 `PayableSchedule` 存在时返回 `payable_schedule`
- 目标 `PayableSchedule` 不存在时返回 `NOT_FOUND`

### `SearchPayableSchedules`

- 作用：按条件分页搜索应付计划目录

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `keyword` | 否 | 按 `schedule_no / purchase_order_no / supplier` 轻量检索 |
| `supplier_tenant_party_id` | 否 | 按供应商过滤 |
| `source_purchase_order_id` | 否 | 按采购单过滤 |
| `status` | 否 | 按计划状态过滤 |
| `request_governance_status` | 否 | 按 `DUE_NO_REQUEST / EARLY_REQUEST / REQUEST_SUBMITTED` 等治理状态过滤 |
| `overdue_only` | 否 | 只看存在逾期行的计划 |
| `due_from` | 否 | 到期起始日期 |
| `due_to` | 否 | 到期截止日期 |
| `page` | 否 | 1-based 页码 |
| `page_size` | 否 | 页大小 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `payable_schedules[]` | 当前页 `PayableScheduleSummary` 列表 |
| `total` | 总条数 |
| `page` | 当前页码 |
| `page_size` | 当前页大小 |

空语义：

- 搜索结果为空时正常返回空页

### `SearchPaymentRequests`

- 作用：按条件分页搜索付款申请目录

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `request_source` | 否 | `PROCUREMENT_INITIATED / FINANCE_INITIATED` |
| `supplier_tenant_party_id` | 否 | 按供应商过滤 |
| `source_purchase_order_id` | 否 | 按来源采购单过滤 |
| `status` | 否 | 按付款申请状态过滤 |
| `beneficiary_supplier_financial_account_id` | 否 | 按目标收款账号过滤 |
| `requested_from` | 否 | 申请起始时间 |
| `requested_to` | 否 | 申请截止时间 |
| `page` | 否 | 1-based 页码 |
| `page_size` | 否 | 页大小 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `payment_requests[]` | 当前页 `PaymentRequestSummary` 列表 |
| `total` | 总条数 |
| `page` | 当前页码 |
| `page_size` | 当前页大小 |

空语义：

- 搜索结果为空时正常返回空页

### `SearchPaymentExecutions`

- 作用：按条件分页搜索付款执行目录

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `payment_request_id` | 否 | 按付款申请过滤 |
| `supplier_tenant_party_id` | 否 | 按供应商过滤 |
| `source_financial_account_id` | 否 | 按公司出款账户过滤 |
| `linked_account_transaction_id` | 否 | 按已挂接真实流水过滤 |
| `status` | 否 | 按执行状态过滤 |
| `executed_from` | 否 | 执行起始时间 |
| `executed_to` | 否 | 执行截止时间 |
| `page` | 否 | 1-based 页码 |
| `page_size` | 否 | 页大小 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `payment_executions[]` | 当前页 `PaymentExecutionSummary` 列表 |
| `total` | 总条数 |
| `page` | 当前页码 |
| `page_size` | 当前页大小 |

空语义：

- 搜索结果为空时正常返回空页

### `SearchPaymentAllocations`

- 作用：按条件分页搜索真实流水核销结果

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `account_transaction_id` | 否 | 按真实流水过滤 |
| `payment_execution_id` | 否 | 按付款执行记录过滤 |
| `target_type` | 否 | `PAYABLE_SCHEDULE_LINE / RECEIVABLE_SCHEDULE_LINE` |
| `target_schedule_id` | 否 | 按目标计划过滤 |
| `target_schedule_line_id` | 否 | 按目标计划行过滤 |
| `allocated_from` | 否 | 核销起始时间 |
| `allocated_to` | 否 | 核销截止时间 |
| `page` | 否 | 1-based 页码 |
| `page_size` | 否 | 页大小 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `payment_allocations[]` | 当前页 `PaymentAllocation` 列表 |
| `total` | 总条数 |
| `page` | 当前页码 |
| `page_size` | 当前页大小 |

空语义：

- 搜索结果为空时正常返回空页

## 4. 错误语义

phase 1B query 统一暴露以下错误面：

| 错误码 | 语义 |
| --- | --- |
| `INVALID_ARGUMENT` | 请求字段缺失、格式非法、分页参数非法或搜索条件冲突 |
| `UNAUTHENTICATED` | 缺少或无法验证 exact-audience HUMAN WEB ExecutionToken / mTLS binding |
| `PERMISSION_DENIED` | 调用方存在上下文，但没有读取该 tenant / org / payable object 的权限 |
| `NOT_FOUND` | `GetPayableSchedule` 的目标对象不存在 |
| `ALREADY_EXISTS` | phase 1B query `RPC` 不使用该错误；调用方不应依赖此返回 |
| `FAILED_PRECONDITION` | 资源存在，但当前读取前提不满足 |
| `UNAVAILABLE` | 当前服务暂不可用 |
| `INTERNAL` | 未归类的服务内部错误 |

补充说明：

- `SearchPayableSchedules`、`SearchPaymentRequests`、`SearchPaymentExecutions`、`SearchPaymentAllocations` 空页都必须走正常响应语义
- query 侧暴露 `ALREADY_EXISTS` 只是为了统一错误面，不表示这些 `RPC` 会主动返回该错误
