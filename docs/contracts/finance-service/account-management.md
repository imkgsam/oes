# finance-service Account Management API

## 1. 模块职责

`FinancialAccountManagementService` 负责 phase 1 公司资金账户、真实流水、客户 / 供应商收付款账号与标准汇率的命令型写接口。

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
- 所有 command 都必须按 command 语义处理，不得被调用方当作 query 或同步缓存接口使用
- phase 1 不冻结 command metadata header、幂等键设计、审计落库结构或重试策略

## 3. 写入基线语义

### 3.1 `FinancialAccount` 边界

- `FinancialAccount` 是公司自有资金账户
- 它可以代表银行、现金、微信、支付宝、`PayPal / Stripe` 等受控资金载体
- 它不代表客户付款账号，也不代表供应商收款账号
- `UpdateFinancialAccountBasics` 只修改基本资料与状态，不回写历史流水

### 3.2 `AccountTransaction` 边界

- `AccountTransaction` 表达实际资金出入账
- `ImportAccountTransactions` 适用于批量导入真实流水
- `RecordAccountTransaction` 适用于手工补录单笔真实流水
- `AccountTransaction` 不是 `PaymentRequest`
- `AccountTransaction` 也不是 `JournalEntry`

### 3.3 Counterparty Account 边界

- `RegisterCustomerFinancialAccount` 记录客户付款账号引用，不创建 CRM customer relationship truth
- `RegisterSupplierFinancialAccount` 记录供应商收款账号引用，不创建 `SupplierProfile`
- 这两个对象都必须以 `tenantParty` 级引用为边界，不复制上游主档真相

### 3.4 `ExchangeRate` 边界

- `SetExchangeRate` 维护 Finance 标准汇率真相
- Sales 只消费该真相并在自身交易链上冻结 exchange rate snapshot
- phase 1 不冻结复杂汇率来源治理、审批流或多口径估值引擎

## 4. RPC 语义

### `CreateFinancialAccount`

- 作用：创建一个新的公司资金账户

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `tenant_id` | 是 | 显式租户边界 |
| `org_id` | 否 | 适用时的组织边界 |
| `account_type` | 是 | `BANK / CASH / WECHAT / ALIPAY / PAYPAL / STRIPE / OTHER_PSP` |
| `account_name` | 是 | 账户显示名 |
| `currency_code` | 是 | 账户基准币种 |
| `institution_name` | 否 | 开户行 / 平台机构摘要 |
| `account_identifier` | 是 | 原始账号 / 钱包标识；响应只返回脱敏摘要 |
| `opening_balance` | 否 | optional 期初余额摘要 |
| `opening_balance_as_of` | 否 | optional 期初余额时点 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `financial_account` | 新建后的 `FinancialAccount` |

关键语义：

- 成功创建后状态必须为 `ACTIVE`
- 同一租户下不允许建立语义上重复的公司资金账户

### `UpdateFinancialAccountBasics`

- 作用：更新现有公司资金账户的基本资料

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `tenant_id` | 是 | 显式租户边界 |
| `financial_account_id` | 是 | 目标资金账户标识 |
| `account_name` | 是 | 更新后的账户显示名 |
| `institution_name` | 否 | 更新后的机构摘要 |
| `account_identifier` | 否 | 更新后的原始账号 / 钱包标识；响应只返回脱敏摘要 |
| `status` | 是 | `ACTIVE / INACTIVE / CLOSED` |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `financial_account` | 更新后的 `FinancialAccount` |

关键语义：

- 本命令不修改历史 `AccountTransaction`
- 关闭后的账户不应再作为新的付款执行账户或导入主目标账户

### `ImportAccountTransactions`

- 作用：为某个公司资金账户批量导入真实流水

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `tenant_id` | 是 | 显式租户边界 |
| `financial_account_id` | 是 | 目标公司资金账户 |
| `source_batch_reference` | 否 | optional 导入批次摘要 |
| `transactions[]` | 是 | 批量导入的流水集合 |

`transactions[]` 最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `direction` | 是 | `INFLOW / OUTFLOW` |
| `amount` | 是 | 流水金额 |
| `currency_code` | 是 | 流水币种 |
| `transaction_time` | 是 | 交易发生时间 |
| `value_date` | 否 | optional 入账日期 |
| `external_reference` | 否 | optional 回单号 / 渠道流水号 |
| `counterparty_name` | 否 | optional 对手方名称 |
| `counterparty_account_snapshot` | 否 | optional 脱敏后的对手方账号摘要 |
| `memo` | 否 | optional 备注 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `accepted_count` | 成功导入条数 |
| `rejected_count` | 拒绝导入条数 |
| `account_transaction_ids[]` | 成功导入后的流水标识列表 |

关键语义：

- 该命令导入的是实际流水，不是付款计划
- realization 可以细化重复检测策略，但不得改变“重复真实流水不得被静默重复写入”的边界

### `RecordAccountTransaction`

- 作用：手工登记一笔真实资金流水

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `tenant_id` | 是 | 显式租户边界 |
| `financial_account_id` | 是 | 目标公司资金账户 |
| `direction` | 是 | `INFLOW / OUTFLOW` |
| `amount` | 是 | 流水金额 |
| `currency_code` | 是 | 流水币种 |
| `transaction_time` | 是 | 交易发生时间 |
| `external_reference` | 否 | optional 回单号 / 渠道流水号 |
| `counterparty_name` | 否 | optional 对手方名称 |
| `counterparty_account_snapshot` | 否 | optional 脱敏后的对手方账号摘要 |
| `memo` | 否 | optional 备注 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `account_transaction` | 新登记的 `AccountTransaction` |

关键语义：

- 本命令登记的是实际出入账事实
- 它可以先于 allocation 存在

### `RegisterCustomerFinancialAccount`

- 作用：登记客户付款账号引用

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `tenant_id` | 是 | 显式租户边界 |
| `customer_tenant_party_id` | 是 | 目标客户主体引用 |
| `account_holder_name` | 是 | 开户名 / 账户名 |
| `account_provider_type` | 是 | `BANK / WECHAT / ALIPAY / PAYPAL / STRIPE / OTHER` |
| `account_identifier` | 是 | 原始账号；响应只返回脱敏摘要 |
| `currency_code` | 否 | optional 常用币种 |
| `is_default` | 否 | 是否设为默认账号 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `customer_financial_account` | 新登记的 `CustomerFinancialAccount` |

关键语义：

- 它只记录收款参考账号，不改变 Customer owner truth

### `RegisterSupplierFinancialAccount`

- 作用：登记供应商收款账号引用

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `tenant_id` | 是 | 显式租户边界 |
| `supplier_tenant_party_id` | 是 | 目标供应商主体引用 |
| `account_holder_name` | 是 | 开户名 / 账户名 |
| `account_provider_type` | 是 | `BANK / WECHAT / ALIPAY / PAYPAL / STRIPE / OTHER` |
| `account_identifier` | 是 | 原始账号；响应只返回脱敏摘要 |
| `currency_code` | 否 | optional 常用币种 |
| `is_default` | 否 | 是否设为默认账号 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `supplier_financial_account` | 新登记的 `SupplierFinancialAccount` |

关键语义：

- 它只记录付款目标账号，不改变 `SupplierProfile` owner truth

### `SetExchangeRate`

- 作用：设置一条 Finance 标准汇率真相

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `tenant_id` | 是 | 显式租户边界 |
| `base_currency_code` | 是 | 基准币种 |
| `quote_currency_code` | 是 | 报价币种 |
| `rate_value` | 是 | 标准汇率值 |
| `effective_at` | 是 | 生效时间 |
| `reason` | 否 | optional 设置原因 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `exchange_rate` | 新写入或更新后的 `ExchangeRate` |

关键语义：

- Finance owns standard exchange rate truth
- 历史 Sales snapshot 不因后续 `SetExchangeRate` 被回写

## 5. 错误语义

phase 1 management 统一暴露以下错误面：

| 错误码 | 语义 |
| --- | --- |
| `INVALID_ARGUMENT` | 请求字段缺失、格式非法、金额非法、账号信息非法或命令字段互斥冲突 |
| `UNAUTHENTICATED` | 缺少有效 internal service context、operator context、trace context 或 audit context |
| `PERMISSION_DENIED` | 调用方存在上下文，但没有执行该 tenant / org / command 的权限 |
| `NOT_FOUND` | 目标账户、目标主体或依赖引用不存在 |
| `ALREADY_EXISTS` | 尝试创建重复资金账户、重复对手方账号引用或重复汇率真相 |
| `FAILED_PRECONDITION` | 资源存在，但当前状态不允许执行命令，例如对已关闭账户继续导入流水 |
| `UNAVAILABLE` | 当前服务暂不可用 |
| `INTERNAL` | 未归类的服务内部错误 |
