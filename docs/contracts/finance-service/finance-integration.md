# finance-service Integration Contract

## 1. 目的

本文件只冻结 `sales-service`、`procurement-service` 与 `finance-service` 之间 phase 1 集成输入输出语义。

本文件不冻结：

- event catalog
- broker / topic / queue
- outbox / inbox 实现
- payload 全量字段
- proto message 细节

## 2. 基线原则

- `finance-service` 只消费上游已经成立的交易事实，不接管 `SalesOrder` 或 `PurchaseOrder` owner truth
- `finance-service` 只向下游发布可消费摘要，不要求下游复制 Finance 内部对象真相
- 当前请求必须立即拿到答案的协作走同步 `gRPC`
- 本地事务成功后的事实扩散才允许进入 future event / async collaboration

## 3. Integration Inputs

### 3.1 `SalesOrderEstablished -> Finance receivable context input`

作用：

- 让 Finance 基于已成立的销售交易建立应收计划上下文

最小语义字段：

| 字段 | 说明 |
| --- | --- |
| `tenant_id` | 显式租户边界 |
| `org_id` | optional 组织边界 |
| `sales_order_id` | 已成立销售单标识 |
| `customer_tenant_party_id` | 客户主体引用 |
| `customer_snapshot` | customer 显示名摘要 |
| `currency_code` | 交易币种 |
| `sales_exchange_rate_snapshot` | Sales 冻结的汇率快照摘要 |
| `receivable_plan_lines[]` | 建议的应收计划行摘要 |
| `commercial_snapshot_reference` | Sales 商业快照引用摘要 |
| `occurred_at` | 上游事实发生时间 |
| `operator_context` | 必要操作人上下文 |
| `trace_context` | 必要追踪上下文 |
| `audit_metadata` | 必要审计元数据 |

语义约束：

- 这是 Finance 建立 `ReceivableSchedule` 的输入，不是把 `SalesOrder` owner 转移给 Finance
- Sales 仍然 owns quote / order / commercial snapshot truth
- Finance 可以基于此输入调用 `CreateReceivableScheduleFromSalesOrder` 或等价内部编排

### 3.2 `PurchaseOrderIssued -> Finance payable context input`

作用：

- 让 Finance 基于已发出的采购交易建立应付计划上下文

最小语义字段：

| 字段 | 说明 |
| --- | --- |
| `tenant_id` | 显式租户边界 |
| `org_id` | optional 组织边界 |
| `purchase_order_id` | 已发采购单标识 |
| `supplier_tenant_party_id` | 供应商主体引用 |
| `supplier_snapshot` | supplier 显示名摘要 |
| `currency_code` | 交易币种 |
| `payable_plan_lines[]` | 建议的应付计划行摘要 |
| `procurement_snapshot_reference` | Procurement 交易快照引用摘要 |
| `occurred_at` | 上游事实发生时间 |
| `operator_context` | 必要操作人上下文 |
| `trace_context` | 必要追踪上下文 |
| `audit_metadata` | 必要审计元数据 |

语义约束：

- 这是 Finance 建立 `PayableSchedule` 的输入，不是把 `PurchaseOrder` owner 转移给 Finance
- Procurement 仍然 owns `PurchaseOrder` 与采购交易事实
- phase 1 正常支出路径必须可回溯到 `PR / PO`

## 4. Integration Outputs

### 4.1 `PaymentAllocated / ReceivablePaid summary -> Sales / Fulfillment consume`

作用：

- 把 Finance 侧客户回款 / 核销结果摘要回流给 Sales / Fulfillment

最小语义字段：

| 字段 | 说明 |
| --- | --- |
| `tenant_id` | 显式租户边界 |
| `sales_order_id` | 关联销售单标识 |
| `receivable_schedule_id` | 关联应收计划标识 |
| `receivable_schedule_line_ids[]` | 被影响的应收计划行 |
| `allocated_amount` | 本次核销金额 |
| `outstanding_amount` | 核销后的未收金额摘要 |
| `receivable_status` | `OPEN / PARTIALLY_PAID / PAID` 摘要 |
| `account_transaction_id` | 真实流水标识 |
| `occurred_at` | Finance 事实发生时间 |
| `trace_context` | 必要追踪上下文 |

语义约束：

- 下游消费的是摘要，不拥有 `PaymentAllocation` 或 `AccountTransaction` 真相
- Sales 如需决定后续商业动作，应结合自己的 gate 语义，而不是把 Finance 对象内嵌进 Sales

### 4.2 `PaymentRequestApproved summary -> Procurement consume`

作用：

- 把付款申请已批准的摘要回流给 Procurement，用于采购侧查看付款推进状态

最小语义字段：

| 字段 | 说明 |
| --- | --- |
| `tenant_id` | 显式租户边界 |
| `payment_request_id` | 付款申请标识 |
| `payable_schedule_ids[]` | 关联应付计划标识 |
| `purchase_order_ids[]` | 关联采购单标识 |
| `supplier_tenant_party_id` | 供应商主体引用 |
| `approved_amount` | 已批准金额摘要 |
| `approved_at` | 批准时间 |
| `trace_context` | 必要追踪上下文 |

语义约束：

- 该摘要只表达“可以进入付款执行阶段”
- 它不表达银行已经扣款

### 4.3 `PaymentExecuted summary -> Procurement consume`

作用：

- 把财务执行付款动作的摘要回流给 Procurement，用于采购侧查看付款执行进度

最小语义字段：

| 字段 | 说明 |
| --- | --- |
| `tenant_id` | 显式租户边界 |
| `payment_request_id` | 付款申请标识 |
| `payment_execution_id` | 付款执行记录标识 |
| `payable_schedule_ids[]` | 关联应付计划标识 |
| `purchase_order_ids[]` | 关联采购单标识 |
| `executed_amount` | 执行金额 |
| `currency_code` | 执行币种 |
| `source_financial_account_id` | 出款公司资金账户 |
| `linked_account_transaction_id` | optional 已知真实流水标识 |
| `executed_at` | 执行时间 |
| `trace_context` | 必要追踪上下文 |

语义约束：

- 该摘要表达“财务已执行付款动作”
- 若真实流水稍后才导入，`linked_account_transaction_id` 可以后补
- Procurement 消费的是推进状态摘要，不拥有 `PaymentExecution` 真相

## 5. Deferred

以下 integration 能力明确 deferred，不在本文件冻结：

- event catalog 命名全集
- broker / topic / subscription design
- outbox / inbox / retry policy
- full `FinanceReleaseSignal` async broadcast catalog
- full supplier invoice matching integration
- bank API callback integration
- automatic bank reconciliation integration
- `ExpenseClaim` workflow integration
