# finance-service Receivable Management API

## 1. 模块职责

`ReceivableManagementService` 负责 phase 1 应收计划建立与财务放行结果写入的命令型接口。

## 2. 通用上下文要求

所有当前 management command 都按 [Finance trusted gRPC baseline](README.md#6-security--context-baseline) 执行；tenant、org scope、operator、trace 与 audit identity 只来自 trusted context，以下 request 表只列业务 payload。

## 3. 写入基线语义

### 3.1 `ReceivableSchedule` 边界

- `ReceivableSchedule` 表达客户应付款计划，不表达实际回款
- phase 1 正常建立路径来自 `SalesOrderEstablished`
- Finance 只消费 Sales 受控交易事实，不回写 `SalesOrder` owner truth

### 3.2 `FinanceReleaseSignal` 边界

- `SetFinanceReleaseSignal` 只写入 Finance 对外发布的财务结果
- 该结果可以基于信用、逾期、未收风险等财务条件形成
- 它不直接修改 `SalesOrder` 的 commercial gate

## 4. RPC 语义

### `CreateReceivableScheduleFromSalesOrder`

- 作用：基于已成立 `SalesOrder` 的受控摘要建立应收计划

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `sales_order_id` | 是 | 来源 `SalesOrder` 标识 |
| `customer_tenant_party_id` | 是 | 客户主体引用 |
| `customer_snapshot` | 是 | 客户显示名摘要 |
| `currency_code` | 是 | 交易币种 |
| `sales_exchange_rate_snapshot` | 否 | Sales 冻结的汇率快照摘要，仅作交易回溯引用 |
| `lines[]` | 是 | 应收计划行集合 |

`lines[]` 最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `due_date` | 是 | 到期日 |
| `scheduled_amount` | 是 | 应收计划金额 |
| `source_sales_order_line_id` | 否 | optional 来源销售行引用 |
| `memo` | 否 | optional 备注 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `receivable_schedule` | 新建后的 `ReceivableSchedule` |

关键语义：

- 该命令建立的是应收计划，不是实际收款
- Finance 采用 Sales 提供的交易快照作为来源引用，但标准汇率 owner 仍归 Finance
- 同一 `SalesOrder` 是否允许生成多个 schedule，可在 realization 细化；但不得打破“SalesOrder 仍归 Sales”这一边界

### `SetFinanceReleaseSignal`

- 作用：为某个 `SalesOrder` 写入或更新当前财务放行结果

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `sales_order_id` | 是 | 目标 `SalesOrder` 标识 |
| `customer_tenant_party_id` | 是 | 目标客户主体引用 |
| `signal_status` | 是 | `RELEASED / HELD / REVIEW_REQUIRED` |
| `reason_code` | 否 | optional 原因码摘要 |
| `reason_summary` | 否 | optional 原因说明 |
| `effective_at` | 是 | 生效时间 |
| `expires_at` | 否 | optional 失效时间 |
| `based_on_summary` | 否 | optional 财务判断摘要 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `finance_release_signal` | 新写入或更新后的 `FinanceReleaseSignal` |

关键语义：

- 该命令只维护 Finance 的 signal truth
- `sales-service` 仍然 owns 自己的 gate 语义
- Sales 消费到 `HELD / REVIEW_REQUIRED` 时是否阻断后续动作，属于 Sales 自身商业 gate 决策

## 5. 错误语义

phase 1 management 统一暴露以下错误面：

| 错误码 | 语义 |
| --- | --- |
| `INVALID_ARGUMENT` | 请求字段缺失、格式非法、金额非法、日期非法或命令字段互斥冲突 |
| `UNAUTHENTICATED` | 缺少或无法验证 exact-audience HUMAN WEB ExecutionToken / mTLS binding |
| `PERMISSION_DENIED` | 调用方存在上下文，但没有执行该 tenant / org / command 的权限 |
| `NOT_FOUND` | 目标 `SalesOrder`、目标 customer 引用或依赖对象不存在 |
| `ALREADY_EXISTS` | 尝试创建语义上重复的当前有效应收计划或重复有效放行信号 |
| `FAILED_PRECONDITION` | 资源存在，但当前状态不允许执行命令，例如销售订单尚未成立却尝试建立应收计划 |
| `UNAVAILABLE` | 当前服务暂不可用 |
| `INTERNAL` | 未归类的服务内部错误 |
