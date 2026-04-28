# finance-service Payment Query API

## 1. 模块职责

`PaymentQueryService` 负责 phase 1 应付计划、付款申请、付款执行摘要与核销结果的只读查询能力，不修改状态。

调用基线：

- 接口类型：内部 gRPC
- 服务：`PaymentQueryService`
- 所有 RPC 显式带 `tenant_id`
- 场景适用时显式带 `org_id`
- 所有 RPC 都要求：
  - internal service context
  - operator context
  - trace context

phase 1 query 只覆盖：

- `PayableSchedule` 单对象读取
- `PayableSchedule` 目录搜索
- `PaymentRequest` 目录搜索
- `PaymentAllocation` 目录搜索

phase 1 query 不覆盖：

- full supplier invoice matching read model
- 自动银行对账结果
- ExpenseClaim 报销看板
- treasury / cash forecast

## 2. 通用读取对象

### 2.1 `PayableSchedule`

phase 1 `PayableSchedule` 最小读取 shape：

| 字段 | 说明 |
| --- | --- |
| `payable_schedule_id` | `PayableSchedule` 稳定标识 |
| `schedule_no` | 应付计划编号摘要 |
| `tenant_id` | 显式租户边界 |
| `org_id` | optional 组织边界摘要 |
| `source_purchase_order_id` | 来源 `PurchaseOrder` 标识 |
| `supplier_tenant_party_id` | 供应商主体引用 |
| `supplier_snapshot` | supplier 显示名摘要 |
| `currency_code` | 计划币种 |
| `status` | `OPEN / PARTIALLY_PAID / PAID / CANCELLED / ON_HOLD` |
| `total_scheduled_amount` | 应付计划总额 |
| `total_allocated_amount` | 已核销金额 |
| `outstanding_amount` | 未付金额 |
| `lines[]` | `PayableScheduleLine` 列表 |
| `created_at` | 创建时间 |
| `updated_at` | 最近更新时间 |

说明：

- `PayableSchedule` 表达公司应付款计划
- 它不是实际付款
- phase 1 它也不等同于 full supplier invoice lifecycle

### 2.2 `PayableScheduleLine`

phase 1 `PayableScheduleLine` 最小读取 shape：

| 字段 | 说明 |
| --- | --- |
| `payable_schedule_line_id` | 行标识 |
| `line_no` | 行号 |
| `due_date` | 到期日 |
| `scheduled_amount` | 应付计划金额 |
| `allocated_amount` | 已核销金额 |
| `outstanding_amount` | 未付金额 |
| `status` | `OPEN / PARTIALLY_PAID / PAID / CANCELLED / OVERDUE` |
| `source_purchase_order_line_id` | optional 来源采购行引用 |
| `memo` | optional 备注 |

### 2.3 `PaymentRequest`

phase 1 `PaymentRequest` 最小读取 shape：

| 字段 | 说明 |
| --- | --- |
| `payment_request_id` | 付款申请标识 |
| `request_no` | 付款申请编号摘要 |
| `tenant_id` | 显式租户边界 |
| `org_id` | optional 组织边界摘要 |
| `supplier_tenant_party_id` | optional 供应商主体引用 |
| `beneficiary_supplier_financial_account_id` | optional 目标供应商收款账号引用 |
| `currency_code` | 申请币种 |
| `requested_amount` | 申请金额 |
| `status` | `PENDING / APPROVED / REJECTED / PARTIALLY_EXECUTED / EXECUTED` |
| `linked_payable_schedule_ids[]` | 关联应付计划摘要 |
| `executions[]` | `PaymentExecution` 摘要列表 |
| `requested_at` | 申请时间 |
| `updated_at` | 最近更新时间 |

说明：

- `PaymentRequest` 表达付款申请
- 它不是银行已经扣款
- phase 1 正常采购支出路径必须关联 `PR / PO` 对应的 `PayableSchedule`

### 2.4 `PaymentExecution`

phase 1 `PaymentExecution` 最小读取 shape：

| 字段 | 说明 |
| --- | --- |
| `payment_execution_id` | 付款执行记录标识 |
| `payment_request_id` | 所属付款申请 |
| `source_financial_account_id` | 出款公司资金账户 |
| `beneficiary_account_snapshot` | 目标收款账号脱敏摘要 |
| `executed_amount` | 执行金额 |
| `currency_code` | 执行币种 |
| `executed_at` | 执行时间 |
| `execution_reference` | optional 执行参考号 |
| `linked_account_transaction_id` | optional 关联真实流水 |
| `status` | `RECORDED / MATCHED / VOIDED` |

说明：

- `PaymentExecution` 表达财务执行付款动作的记录
- 它不自动等价于真实账户流水；真实流水仍由 `AccountTransaction` 表达

### 2.5 `PaymentAllocation`

phase 1 `PaymentAllocation` 最小读取 shape：

| 字段 | 说明 |
| --- | --- |
| `payment_allocation_id` | 核销标识 |
| `account_transaction_id` | 被核销的真实流水 |
| `payment_execution_id` | optional 关联的付款执行记录 |
| `target_type` | `RECEIVABLE_SCHEDULE_LINE / PAYABLE_SCHEDULE_LINE` |
| `target_schedule_id` | 目标计划标识 |
| `target_schedule_line_id` | 目标计划行标识 |
| `allocated_amount` | 核销金额 |
| `currency_code` | 核销币种 |
| `allocated_at` | 核销时间 |

说明：

- `PaymentAllocation` 表达真实流水核销到应收 / 应付计划的结果
- Sales 与 Procurement 消费的是摘要，不拥有核销真相

### 2.6 `PayableScheduleSummary`

phase 1 列表读取最小 shape：

| 字段 | 说明 |
| --- | --- |
| `payable_schedule_id` | 应付计划标识 |
| `schedule_no` | 计划编号摘要 |
| `source_purchase_order_id` | 来源采购单 |
| `supplier_tenant_party_id` | 供应商主体引用 |
| `supplier_display_name` | 供应商显示名摘要 |
| `currency_code` | 币种 |
| `status` | 当前状态 |
| `outstanding_amount` | 未付金额 |
| `nearest_due_date` | optional 最近到期日 |

### 2.7 `PaymentRequestSummary`

phase 1 列表读取最小 shape：

| 字段 | 说明 |
| --- | --- |
| `payment_request_id` | 付款申请标识 |
| `request_no` | 申请编号摘要 |
| `supplier_tenant_party_id` | optional 供应商主体引用 |
| `supplier_display_name` | optional 供应商显示名摘要 |
| `currency_code` | 币种 |
| `requested_amount` | 申请金额 |
| `status` | 当前状态 |
| `requested_at` | 申请时间 |

## 3. RPC 语义

### `GetPayableSchedule`

- 作用：按 `payable_schedule_id` 读取单个应付计划

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `tenant_id` | 是 | 显式租户边界 |
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
| `tenant_id` | 是 | 显式租户边界 |
| `org_id` | 否 | 按组织范围过滤 |
| `keyword` | 否 | 按 `schedule_no / purchase_order_no / supplier` 轻量检索 |
| `supplier_tenant_party_id` | 否 | 按供应商过滤 |
| `source_purchase_order_id` | 否 | 按采购单过滤 |
| `status` | 否 | 按计划状态过滤 |
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
| `tenant_id` | 是 | 显式租户边界 |
| `org_id` | 否 | 按组织范围过滤 |
| `supplier_tenant_party_id` | 否 | 按供应商过滤 |
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

### `SearchPaymentAllocations`

- 作用：按条件分页搜索真实流水核销结果

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `tenant_id` | 是 | 显式租户边界 |
| `account_transaction_id` | 否 | 按真实流水过滤 |
| `payment_execution_id` | 否 | 按付款执行记录过滤 |
| `target_type` | 否 | `RECEIVABLE_SCHEDULE_LINE / PAYABLE_SCHEDULE_LINE` |
| `target_schedule_id` | 否 | 按目标计划过滤 |
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

phase 1 query 统一暴露以下错误面：

| 错误码 | 语义 |
| --- | --- |
| `INVALID_ARGUMENT` | 请求字段缺失、格式非法、分页参数非法或搜索条件冲突 |
| `UNAUTHENTICATED` | 缺少有效 internal service context、operator context 或 trace context |
| `PERMISSION_DENIED` | 调用方存在上下文，但没有读取该 tenant / org / supplier / payable object 的权限 |
| `NOT_FOUND` | `GetPayableSchedule` 的目标对象不存在 |
| `FAILED_PRECONDITION` | 资源存在，但当前读取前提不满足 |
| `UNAVAILABLE` | 当前服务暂不可用 |
| `INTERNAL` | 未归类的服务内部错误 |

补充说明：

- `SearchPayableSchedules`、`SearchPaymentRequests`、`SearchPaymentAllocations` 空页都必须走正常响应语义
- phase 1 query 不使用 `ALREADY_EXISTS`
