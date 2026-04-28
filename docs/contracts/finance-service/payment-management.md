# finance-service Payment Management API

## 1. 模块职责

`PaymentManagementService` 负责 phase 1 应付计划建立、付款申请、付款执行与真实流水核销的命令型接口。

## 2. 通用上下文要求

所有 phase 1 management command 统一要求：

- `tenant_id`
- 场景适用时的 `org_id`
- internal service context
- operator context
- trace context
- audit context

## 3. 写入基线语义

### 3.1 `PayableSchedule` 边界

- `PayableSchedule` 表达公司应该付款的计划
- 它不是实际付款
- phase 1 正常建立路径来自 `PurchaseOrderIssued`
- 它不等于 full supplier invoice lifecycle

### 3.2 `PaymentRequest / PaymentExecution / AccountTransaction` 边界

- `PaymentRequest` 表达付款申请
- `PaymentExecution` 表达财务执行付款动作的记录
- `AccountTransaction` 表达最终真实账户出入账
- 三者不能混写成同一个对象

### 3.3 `PaymentAllocation` 边界

- `PaymentAllocation` 只能核销真实流水
- `AllocatePaymentToReceivable` 用于入账流水核销应收计划
- `AllocatePaymentToPayable` 用于出账流水核销应付计划

### 3.4 Procurement / Expense 边界

- 采购类支出在 phase 1 正常路径必须关联 `PR / PO`
- `Non-PO purchase` 不作为 phase 1 正常主线
- 员工垫付属于 future `ExpenseClaim`
- phase 1 不冻结完整报销 workflow

## 4. RPC 语义

### `CreatePayableScheduleFromPurchaseOrder`

- 作用：基于已发出 `PurchaseOrder` 的受控摘要建立应付计划

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `tenant_id` | 是 | 显式租户边界 |
| `org_id` | 否 | 适用时的组织边界 |
| `purchase_order_id` | 是 | 来源 `PurchaseOrder` 标识 |
| `supplier_tenant_party_id` | 是 | 供应商主体引用 |
| `supplier_snapshot` | 是 | 供应商显示名摘要 |
| `currency_code` | 是 | 交易币种 |
| `lines[]` | 是 | 应付计划行集合 |

`lines[]` 最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `due_date` | 是 | 到期日 |
| `scheduled_amount` | 是 | 应付计划金额 |
| `source_purchase_order_line_id` | 否 | optional 来源采购行引用 |
| `memo` | 否 | optional 备注 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `payable_schedule` | 新建后的 `PayableSchedule` |

关键语义：

- 该命令建立的是应付计划，不是实际付款
- phase 1 正常采购支出路径必须可追溯到 `PR / PO`

### `CreatePaymentRequest`

- 作用：创建一个新的付款申请

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `tenant_id` | 是 | 显式租户边界 |
| `org_id` | 否 | 适用时的组织边界 |
| `supplier_tenant_party_id` | 是 | 目标供应商主体引用 |
| `beneficiary_supplier_financial_account_id` | 是 | 目标供应商收款账号引用 |
| `currency_code` | 是 | 申请币种 |
| `requested_amount` | 是 | 申请金额 |
| `payable_allocations[]` | 是 | 关联的应付计划行集合 |
| `purpose` | 否 | optional 申请原因摘要 |

`payable_allocations[]` 最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `payable_schedule_id` | 是 | 目标应付计划标识 |
| `payable_schedule_line_id` | 是 | 目标应付计划行标识 |
| `requested_amount` | 是 | 拟支付金额 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `payment_request` | 新建后的 `PaymentRequest` |

关键语义：

- `PaymentRequest` 是付款申请，不是银行已经扣款
- phase 1 正常采购支出路径不应创建脱离 `PR / PO` 的常规付款申请

### `DecidePaymentRequest`

- 作用：审批或驳回一个付款申请

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `tenant_id` | 是 | 显式租户边界 |
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
| `tenant_id` | 是 | 显式租户边界 |
| `payment_request_id` | 是 | 目标付款申请标识 |
| `source_financial_account_id` | 是 | 出款公司资金账户 |
| `executed_amount` | 是 | 执行金额 |
| `currency_code` | 是 | 执行币种 |
| `executed_at` | 是 | 执行时间 |
| `execution_reference` | 否 | optional 执行参考号 |
| `linked_account_transaction_id` | 否 | optional 已知真实流水标识 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `payment_request` | 更新后的 `PaymentRequest` |
| `payment_execution` | 新增的 `PaymentExecution` |

关键语义：

- 该命令记录的是财务执行付款动作
- 若真实流水当场已知，可同步挂接 `linked_account_transaction_id`
- 若真实流水尚未导入，后续仍可通过 `AllocatePaymentToPayable` 完成以真实流水为中心的核销

### `AllocatePaymentToReceivable`

- 作用：把一笔真实入账流水核销到应收计划

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `tenant_id` | 是 | 显式租户边界 |
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
| `tenant_id` | 是 | 显式租户边界 |
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
- `PayableSchedule` 被核销后可进入 `PARTIALLY_PAID / PAID`

## 5. 错误语义

phase 1 management 统一暴露以下错误面：

| 错误码 | 语义 |
| --- | --- |
| `INVALID_ARGUMENT` | 请求字段缺失、格式非法、金额非法、方向非法或命令字段互斥冲突 |
| `UNAUTHENTICATED` | 缺少有效 internal service context、operator context、trace context 或 audit context |
| `PERMISSION_DENIED` | 调用方存在上下文，但没有执行该 tenant / org / command 的权限 |
| `NOT_FOUND` | 目标计划、目标付款申请、目标账户、目标流水或依赖引用不存在 |
| `ALREADY_EXISTS` | 尝试创建重复付款申请、重复付款执行记录或重复核销结果 |
| `FAILED_PRECONDITION` | 资源存在，但当前状态不允许执行命令，例如未批准的付款申请被执行、入账流水被核销到应付计划 |
| `UNAVAILABLE` | 当前服务暂不可用 |
| `INTERNAL` | 未归类的服务内部错误 |
