# finance-service Payment Management API

## 1. 模块职责

`PaymentManagementService` 负责 phase 1B 付款申请、付款审批、付款执行与真实流水核销的命令型接口。

说明：

- payable schedule 的建立与调整真相见 [payable-management.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/finance-service/payable-management.md)
- 本文件不把 `PaymentRequest` 当成 payable truth

## 2. 通用上下文要求

所有当前 management command 都按 [Finance trusted gRPC baseline](README.md#6-security--context-baseline) 执行；tenant、org scope、operator、trace 与 audit identity 只来自 trusted context，以下 request 表只列业务 payload。

## 3. 写入基线语义

### 3.1 `PaymentRequest` 边界

- `PaymentRequest` 是申请付款 / 付款治理入口
- 它可以由采购员从 `PO` 发起，也可以由财务从 due schedule 发起
- 它不是 `PayableSchedule` 真相，也不是银行已经扣款

### 3.2 `PaymentRequest` source / evidence 边界

- `request_source` 只允许：
  - `PROCUREMENT_INITIATED`
  - `FINANCE_INITIATED`
- 申请可携带 supplier bill / invoice / statement evidence snapshot
- 这些 evidence 在 phase 1B 只作为申请证据，不升级为正式 `SupplierInvoice / SupplierStatement` lifecycle
- 当目标 schedule line 尚未到期时，必须要求 `reason`，并将该申请标记为 `EARLY_REQUEST`

### 3.3 `PaymentExecution / AccountTransaction` 边界

- `PaymentExecution` 表达财务执行付款动作
- `AccountTransaction` 表达最终真实账户出入账
- 二者不能混写成同一个对象

### 3.4 `PaymentAllocation` 边界

- `PaymentAllocation` 只能核销真实流水
- `AllocatePaymentToReceivable` 用于入账流水核销应收计划
- `AllocatePaymentToPayable` 用于出账流水核销应付计划

### 3.5 Procurement / Expense 边界

- 采购类支出在 phase 1B 正常路径必须关联 `PO`
- Procurement 只展示 Finance payment summary / `attachmentRef`，不拥有付款真相
- Finance 不直接改 `PO` 状态
- `Non-PO purchase` 不作为 phase 1B 正常主线
- 员工垫付属于 future `ExpenseClaim`

## 4. RPC 语义

### `CreatePaymentRequest`

- 作用：创建一个新的付款申请

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `request_source` | 是 | `PROCUREMENT_INITIATED / FINANCE_INITIATED` |
| `source_purchase_order_id` | 否 | 从采购侧发起时的来源 `PO` |
| `supplier_tenant_party_id` | 是 | 目标供应商主体引用 |
| `beneficiary_supplier_financial_account_id` | 是 | 目标供应商收款账号引用 |
| `currency_code` | 是 | 申请币种 |
| `requested_amount` | 是 | 申请金额 |
| `requested_lines[]` | 是 | 关联的应付计划行集合 |
| `evidence_snapshots[]` | 否 | optional supplier bill evidence snapshot 集合 |
| `reason` | 否 | optional 申请原因摘要；任一 early request 时必填 |

`requested_lines[]` 最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `payable_schedule_id` | 是 | 目标应付计划标识 |
| `payable_schedule_line_id` | 是 | 目标应付计划行标识 |
| `requested_amount` | 是 | 拟支付金额 |

`evidence_snapshots[]` 最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `evidence_type` | 是 | `SUPPLIER_BILL / SUPPLIER_INVOICE / SUPPLIER_STATEMENT / OTHER` |
| `external_document_no` | 否 | optional 外部单据号摘要 |
| `document_date` | 否 | optional 单据日期 |
| `currency_code` | 否 | optional 单据币种 |
| `document_amount` | 否 | optional 单据金额摘要 |
| `attachment_ref` | 否 | optional 附件引用 |
| `note` | 否 | optional 备注 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `payment_request` | 新建后的 `PaymentRequest` |

关键语义：

- `PaymentRequest` 是付款申请，不是 payable truth，也不是银行已经扣款
- `requested_amount` 必须等于 `requested_lines[].requested_amount` 之和
- `PROCUREMENT_INITIATED` 正常路径必须携带 `source_purchase_order_id`
- `FINANCE_INITIATED` 正常路径应来自已存在的 due schedule line
- 任一目标行早于 `due_date` 发起时，必须提供 `reason`
- phase 1B 正常采购支出路径不应创建脱离 `PO` 的常规付款申请

### `DecidePaymentRequest`

- 作用：审批或驳回一个付款申请

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `payment_request_id` | 是 | 目标付款申请标识 |
| `decision` | 是 | `APPROVED / REJECTED` |
| `decision_reason` | 否 | optional 决策原因 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `payment_request` | 决策后的 `PaymentRequest` |

关键语义：

- `APPROVED` 表达允许进入付款执行阶段，不等于已经付款
- `REJECTED` 表达申请被拒绝，不得继续执行付款

### `ExecutePaymentRequest`

- 作用：记录财务对已批准付款申请的一次付款执行动作

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `payment_request_id` | 是 | 目标付款申请标识 |
| `source_financial_account_id` | 是 | 出款公司资金账户 |
| `executed_amount` | 是 | 执行金额 |
| `currency_code` | 是 | 执行币种 |
| `executed_at` | 是 | 执行时间 |
| `execution_reference` | 否 | optional 执行参考号 |
| `attachment_refs[]` | 否 | optional 付款凭证附件引用 |
| `linked_account_transaction_id` | 否 | optional 已知真实流水标识 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `payment_request` | 更新后的 `PaymentRequest` |
| `payment_execution` | 新增的 `PaymentExecution` |

关键语义：

- 该命令记录的是财务执行付款动作
- 目标 `PaymentRequest` 必须已 `APPROVED`
- 允许部分执行；请求可进入 `PARTIALLY_EXECUTED`
- 若真实流水当场已知，可同步挂接 `linked_account_transaction_id`
- 若真实流水尚未导入，后续仍可通过 `AllocatePaymentToPayable` 完成以真实流水为中心的核销

### `AllocatePaymentToReceivable`

- 作用：把一笔真实入账流水核销到应收计划

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `account_transaction_id` | 是 | 目标真实流水标识 |
| `allocations[]` | 是 | 应收核销集合 |

`allocations[]` 最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `receivable_schedule_id` | 是 | 目标应收计划标识 |
| `receivable_schedule_line_id` | 是 | 目标应收计划行标识 |
| `allocated_amount` | 是 | 核销金额 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `payment_allocations[]` | 新增的 `PaymentAllocation` 列表 |

关键语义：

- 只允许把 `INFLOW` 真实流水核销到应收计划
- 分配金额之和不得超过该流水可分配金额
- `ReceivableSchedule` 被核销后可进入 `PARTIALLY_PAID / PAID`

### `AllocatePaymentToPayable`

- 作用：把一笔真实出账流水核销到应付计划

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `account_transaction_id` | 是 | 目标真实流水标识 |
| `payment_execution_id` | 否 | optional 关联的付款执行记录 |
| `allocations[]` | 是 | 应付核销集合 |

`allocations[]` 最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `payable_schedule_id` | 是 | 目标应付计划标识 |
| `payable_schedule_line_id` | 是 | 目标应付计划行标识 |
| `allocated_amount` | 是 | 核销金额 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `payment_allocations[]` | 新增的 `PaymentAllocation` 列表 |

关键语义：

- 只允许把 `OUTFLOW` 真实流水核销到应付计划
- 若来自 `ExecutePaymentRequest`，应优先挂接关联的 `payment_execution_id`
- `PayableSchedule` 与 `PayableScheduleLine` 被核销后可进入 `PARTIALLY_PAID / PAID`
- Procurement 消费的只能是摘要回流，不拥有核销真相

## 5. 错误语义

phase 1B payment management 统一暴露以下错误面：

| 错误码 | 语义 |
| --- | --- |
| `INVALID_ARGUMENT` | 请求字段缺失、格式非法、金额非法、方向非法、early request 缺少 reason，或命令字段互斥冲突 |
| `UNAUTHENTICATED` | 缺少或无法验证 exact-audience HUMAN WEB ExecutionToken / mTLS binding |
| `PERMISSION_DENIED` | 调用方存在上下文，但没有执行该 tenant / org / command 的权限 |
| `NOT_FOUND` | 目标计划、目标付款申请、目标账户、目标流水或依赖引用不存在 |
| `ALREADY_EXISTS` | 尝试创建重复付款申请、重复付款执行记录、重复 evidence snapshot 绑定或重复核销结果 |
| `FAILED_PRECONDITION` | 资源存在，但当前状态不允许执行命令，例如未批准的付款申请被执行、入账流水被核销到应付计划、或常规付款申请试图脱离 `PayableSchedule / PO` 正常路径 |
| `UNAVAILABLE` | 当前服务或必要下游依赖暂不可用 |
| `INTERNAL` | 未归类的服务内部错误 |
