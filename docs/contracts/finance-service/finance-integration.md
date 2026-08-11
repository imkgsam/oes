# finance-service Integration Contract

## 1. 目的

本文件只冻结 `sales-service`、`procurement-service` 与 `finance-service` 之间 phase 1 / phase 1B 集成输入输出语义。

本文件不冻结：

- event catalog
- broker / topic / queue
- outbox / inbox 实现
- payload 全量字段
- proto message 细节

## 2. 基线原则

- Trusted gRPC cutover 只迁移当前 27 个 Gateway HUMAN RPC；本文件的 Sales / Procurement integration input/output 不进入该实现 lease。
- 当前 RPC 不得同时接受 Gateway HUMAN 与 service INTERNAL mode。本轮不新增 INTERNAL RPC、Code、event contract、consumer、outbox 或 inbox；后续同步 service-to-service 或事件实现必须另行冻结独立 contract 与 closed lease。
- `finance-service` 只消费上游已经成立的交易事实，不接管 `SalesOrder` 或 `PurchaseOrder` owner truth
- `finance-service` 只向下游发布可消费摘要，不要求下游复制 Finance 内部对象真相
- 当前请求必须立即拿到答案的协作走同步 `gRPC`
- 本地事务成功后的事实扩散才允许进入 future event / async collaboration
- 采购侧只展示 Finance payment summary / `attachmentRef`，不拥有付款真相

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
| `purchase_order_no` | optional 采购单编号摘要 |
| `supplier_tenant_party_id` | 供应商主体引用 |
| `supplier_snapshot` | supplier 显示名摘要 |
| `currency_code` | 交易币种 |
| `payable_plan_lines[]` | 建议的应付计划行摘要 |
| `procurement_snapshot_reference` | Procurement 交易快照引用摘要 |
| `occurred_at` | 上游事实发生时间 |
| `operator_context` | 必要操作人上下文 |
| `trace_context` | 必要追踪上下文 |
| `audit_metadata` | 必要审计元数据 |

`payable_plan_lines[]` 最小语义字段：

| 字段 | 说明 |
| --- | --- |
| `line_type` | `DEPOSIT / BALANCE / INSTALLMENT / TERM_DUE` |
| `source_ref` | 来源 `PO` 的稳定引用 |
| `due_date` | 到期日 |
| `scheduled_amount` | 建议应付金额 |
| `source_purchase_order_line_id` | optional 来源采购行引用 |
| `memo` | optional 备注 |

语义约束：

- 这是 Finance 建立 `PayableSchedule` 的输入，不是把 `PurchaseOrder` owner 转移给 Finance
- Procurement 仍然 owns `PurchaseOrder` 与采购交易事实
- phase 1B 正常支出路径必须可回溯到 `PO`

### 3.3 `PurchaseOrderChanged -> Finance payable schedule adjustment input`

作用：

- 让 Finance 基于 `PurchaseOrderChange` 调整既有应付计划

最小语义字段：

| 字段 | 说明 |
| --- | --- |
| `tenant_id` | 显式租户边界 |
| `org_id` | optional 组织边界 |
| `purchase_order_id` | 来源采购单标识 |
| `purchase_order_change_id` | 上游变更标识 |
| `procurement_snapshot_reference` | 变更后的 Procurement 快照引用摘要 |
| `payable_schedule_adjustments[]` | 建议的应付计划调整集合 |
| `occurred_at` | 上游事实发生时间 |
| `operator_context` | 必要操作人上下文 |
| `trace_context` | 必要追踪上下文 |
| `audit_metadata` | 必要审计元数据 |

`payable_schedule_adjustments[]` 最小语义字段：

| 字段 | 说明 |
| --- | --- |
| `action` | `ADD / CANCEL_UNEXECUTED / SUPERSEDE_UNEXECUTED` |
| `target_source_ref` | optional 被影响既有 schedule line 的稳定来源引用 |
| `new_source_ref` | optional 追加或 supersede 后新 line 的稳定来源引用 |
| `line_type` | `ADD / SUPERSEDE_UNEXECUTED` 时的 line type |
| `due_date` | `ADD / SUPERSEDE_UNEXECUTED` 时的到期日 |
| `scheduled_amount` | `ADD / SUPERSEDE_UNEXECUTED` 时的金额 |
| `source_purchase_order_line_id` | optional 来源采购行引用 |
| `memo` | optional 备注 |

语义约束：

- Procurement 发的是已发生的 `PurchaseOrderChange` 事实，不是命令 Finance 覆盖内部历史
- Finance 只能追加、取消或 supersede 未执行 schedule line
- 已付款 / 已核销历史不得被上游 change 输入静默改写

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

### 4.2 `PaymentRequestApproved summary -> Procurement read model consume`

作用：

- 把付款申请已批准的摘要回流给 Procurement，用于采购侧查看付款推进状态

最小语义字段：

| 字段 | 说明 |
| --- | --- |
| `tenant_id` | 显式租户边界 |
| `payment_request_id` | 付款申请标识 |
| `request_source` | `PROCUREMENT_INITIATED / FINANCE_INITIATED` |
| `payable_schedule_ids[]` | 关联应付计划标识 |
| `purchase_order_ids[]` | 关联采购单标识 |
| `supplier_tenant_party_id` | 供应商主体引用 |
| `approved_amount` | 已批准金额摘要 |
| `currency_code` | 币种 |
| `approved_at` | 批准时间 |
| `trace_context` | 必要追踪上下文 |

语义约束：

- 该摘要只表达“可以进入付款执行阶段”
- 它不表达银行已经扣款
- Procurement 只更新自己的 payment summary read model，不拥有 `PaymentRequest` 真相

### 4.3 `PaymentExecuted summary -> Procurement read model consume`

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
| `attachment_refs[]` | optional 付款凭证附件引用 |
| `linked_account_transaction_id` | optional 已知真实流水标识 |
| `executed_at` | 执行时间 |
| `trace_context` | 必要追踪上下文 |

语义约束：

- 该摘要表达“财务已执行付款动作”
- 若真实流水稍后才导入，`linked_account_transaction_id` 可以后补
- Procurement 消费的是推进状态摘要，不拥有 `PaymentExecution` 真相

### 4.4 `PayablePaid summary -> Procurement read model consume`

作用：

- 把应付计划已部分或全部核销的摘要回流给 Procurement，用于采购侧展示付款结果

最小语义字段：

| 字段 | 说明 |
| --- | --- |
| `tenant_id` | 显式租户边界 |
| `payable_schedule_id` | 关联应付计划标识 |
| `payable_schedule_line_ids[]` | 被影响的应付计划行 |
| `purchase_order_ids[]` | 关联采购单标识 |
| `allocated_amount` | 本次核销金额 |
| `outstanding_amount` | 核销后的未付金额摘要 |
| `payable_status` | `OPEN / PARTIALLY_PAID / PAID` 摘要 |
| `attachment_refs[]` | optional Finance 管理的付款凭证引用 |
| `last_paid_at` | optional 最近付款时间摘要 |
| `trace_context` | 必要追踪上下文 |

语义约束：

- 该摘要用于更新 Procurement `payment_summary`
- Procurement 只展示 summary 与 `attachmentRef`，不拥有 `PaymentAllocation` 或 `AccountTransaction` 真相

## 5. Deferred

以下 integration 能力明确 deferred，不在本文件冻结：

- event catalog 命名全集
- broker / topic / subscription design
- outbox / inbox / retry policy
- full `FinanceReleaseSignal` async broadcast catalog
- `SupplierInvoice` lifecycle integration
- `SupplierStatement` reconciliation integration
- full `AP matching`
- `GL / JournalEntry / statutory accounting`
- bank API callback integration
- automatic bank reconciliation integration
- `ExpenseClaim` workflow integration
- credit / refund / offset formal lifecycle
