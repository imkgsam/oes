# finance-service Account Query API

## 1. 模块职责

`FinancialAccountQueryService` 负责 phase 1 资金账户、真实流水与标准汇率的只读查询能力，不修改状态。

调用基线：

- 接口类型：内部 gRPC
- 服务：`FinancialAccountQueryService`
- 所有 RPC 按 [Finance trusted gRPC baseline](README.md#6-security--context-baseline) 接受 exact-audience `BUSINESS / HUMAN / WEB` ExecutionToken
- tenant、org scope、operator 与 trace 由 trusted context 派生；以下 request 表只列业务 payload

phase 1 query 只覆盖：

- `FinancialAccount` 单对象读取
- `FinancialAccount` 目录搜索
- `AccountTransaction` 搜索
- `ExchangeRate` 点查

phase 1 query 不覆盖：

- 银行接口拉取状态
- 自动银行对账结果
- 资金预测分析
- `GL / Journal / JournalEntry`
- 完整对账报表

## 2. 通用读取对象

### 2.1 `FinancialAccount`

phase 1 `FinancialAccount` 最小读取 shape：

| 字段 | 说明 |
| --- | --- |
| `financial_account_id` | `FinancialAccount` 稳定标识 |
| `account_no` | 账户编号摘要 |
| `tenant_id` | 显式租户边界 |
| `org_id` | optional 组织边界摘要 |
| `account_type` | `BANK / CASH / WECHAT / ALIPAY / PAYPAL / STRIPE / OTHER_PSP` |
| `account_name` | 账户显示名 |
| `currency_code` | 账户基准币种 |
| `institution_name` | optional 开户行 / 平台机构摘要 |
| `account_identifier_masked` | 脱敏后的账号 / 钱包标识摘要 |
| `status` | `ACTIVE / INACTIVE / CLOSED` |
| `last_transaction_at` | optional 最近流水时间 |
| `created_at` | 创建时间 |
| `updated_at` | 最近更新时间 |

说明：

- `FinancialAccount` 表达公司资金账户，不表达客户或供应商的外部收付款账号
- phase 1 不要求在 query shape 中展开完整网银、渠道配置或 API 凭据

### 2.2 `AccountTransaction`

phase 1 `AccountTransaction` 最小读取 shape：

| 字段 | 说明 |
| --- | --- |
| `account_transaction_id` | 流水标识 |
| `financial_account_id` | 所属公司资金账户 |
| `direction` | `INFLOW / OUTFLOW` |
| `amount` | 流水金额 |
| `currency_code` | 流水币种 |
| `transaction_time` | 交易发生时间 |
| `value_date` | optional 入账日期 |
| `source_type` | `MANUAL / CSV_IMPORT / FUTURE_API` |
| `external_reference` | optional 银行回单号 / 渠道流水号 |
| `counterparty_name` | optional 对手方名称摘要 |
| `counterparty_account_snapshot` | optional 脱敏后的对手方账号摘要 |
| `memo` | optional 备注 |
| `payment_execution_id` | optional 关联的 `PaymentExecution` |
| `allocation_status` | `UNALLOCATED / PARTIALLY_ALLOCATED / FULLY_ALLOCATED` |
| `created_at` | 创建时间 |

说明：

- `AccountTransaction` 表达真实资金出入账
- 它不是 `PaymentRequest`，也不是 `PaymentExecution`
- 它可以先被录入，再被核销到 `ReceivableSchedule / PayableSchedule`

### 2.3 `CustomerFinancialAccount`

phase 1 `CustomerFinancialAccount` 最小读取 shape：

| 字段 | 说明 |
| --- | --- |
| `customer_financial_account_id` | 客户付款账号标识 |
| `customer_tenant_party_id` | 目标客户主体引用 |
| `account_holder_name` | 开户名 / 账户名摘要 |
| `account_provider_type` | `BANK / WECHAT / ALIPAY / PAYPAL / STRIPE / OTHER` |
| `account_identifier_masked` | 脱敏后的账号摘要 |
| `currency_code` | optional 常用币种摘要 |
| `is_default` | 是否默认首选账号 |
| `verified_status` | `UNVERIFIED / VERIFIED` |

说明：

- 该对象表达客户给公司付款时使用的账号引用
- 它不是 `CustomerAccount`，也不替代 CRM customer relationship truth

### 2.4 `SupplierFinancialAccount`

phase 1 `SupplierFinancialAccount` 最小读取 shape：

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

- 该对象表达公司对外付款时选择的供应商收款账号引用
- 它不是 `SupplierProfile`

### 2.5 `ExchangeRate`

phase 1 `ExchangeRate` 最小读取 shape：

| 字段 | 说明 |
| --- | --- |
| `exchange_rate_id` | 汇率记录标识 |
| `tenant_id` | 显式租户边界 |
| `base_currency_code` | 基准币种 |
| `quote_currency_code` | 报价币种 |
| `rate_value` | 标准汇率值 |
| `effective_at` | 生效时间 |
| `set_by` | 设置人摘要 |
| `updated_at` | 最近更新时间 |

说明：

- `ExchangeRate` 是 Finance 的 standard FX truth
- `sales-service` 如需销售快照，应保存自己的 exchange rate snapshot，而不是反向成为 owner

### 2.6 `FinancialAccountSummary`

phase 1 列表读取最小 shape：

| 字段 | 说明 |
| --- | --- |
| `financial_account_id` | 账户标识 |
| `account_no` | 账户编号摘要 |
| `account_type` | 账户类型 |
| `account_name` | 账户显示名 |
| `currency_code` | 币种 |
| `status` | 当前状态 |
| `last_transaction_at` | optional 最近流水时间 |

## 3. RPC 语义

### `GetFinancialAccount`

- 作用：按 `financial_account_id` 读取单个公司资金账户

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `financial_account_id` | 是 | 目标资金账户标识 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `financial_account` | 单个 `FinancialAccount` 读取模型 |

空语义：

- 目标 `FinancialAccount` 存在时返回 `financial_account`
- 目标 `FinancialAccount` 不存在时返回 `NOT_FOUND`

### `SearchFinancialAccounts`

- 作用：按条件分页搜索公司资金账户目录

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `keyword` | 否 | 按 `account_no / account_name / institution_name` 轻量检索 |
| `account_type` | 否 | 按账户类型过滤 |
| `currency_code` | 否 | 按币种过滤 |
| `status` | 否 | 按状态过滤 |
| `page` | 否 | 1-based 页码 |
| `page_size` | 否 | 页大小 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `financial_accounts[]` | 当前页 `FinancialAccountSummary` 列表 |
| `total` | 总条数 |
| `page` | 当前页码 |
| `page_size` | 当前页大小 |

空语义：

- 搜索结果为空时正常返回空页
- 空页不是异常，不返回 `NOT_FOUND`

### `SearchAccountTransactions`

- 作用：按条件分页搜索真实资金流水

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `financial_account_id` | 否 | 按公司资金账户过滤 |
| `direction` | 否 | `INFLOW / OUTFLOW` |
| `source_type` | 否 | `MANUAL / CSV_IMPORT / FUTURE_API` |
| `allocation_status` | 否 | `UNALLOCATED / PARTIALLY_ALLOCATED / FULLY_ALLOCATED` |
| `external_reference` | 否 | 按回单号 / 渠道流水号过滤 |
| `occurred_from` | 否 | 交易起始时间 |
| `occurred_to` | 否 | 交易截止时间 |
| `page` | 否 | 1-based 页码 |
| `page_size` | 否 | 页大小 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `account_transactions[]` | 当前页 `AccountTransaction` 列表 |
| `total` | 总条数 |
| `page` | 当前页码 |
| `page_size` | 当前页大小 |

空语义：

- 搜索结果为空时正常返回空页

### `GetExchangeRate`

- 作用：按币种对与生效时间点读取 Finance 标准汇率真相

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `base_currency_code` | 是 | 基准币种 |
| `quote_currency_code` | 是 | 报价币种 |
| `effective_at` | 否 | 生效时间点；未传时读取当前有效汇率 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `exchange_rate` | 单个 `ExchangeRate` 读取模型 |

空语义：

- 查询时点存在有效汇率时返回 `exchange_rate`
- 不存在有效汇率时返回 `NOT_FOUND`

## 4. 错误语义

phase 1 query 统一暴露以下错误面：

| 错误码 | 语义 |
| --- | --- |
| `INVALID_ARGUMENT` | 请求字段缺失、格式非法、分页参数非法或搜索条件冲突 |
| `UNAUTHENTICATED` | 缺少或无法验证 exact-audience HUMAN WEB ExecutionToken / mTLS binding |
| `PERMISSION_DENIED` | 调用方存在上下文，但没有读取该 tenant / org / account 的权限 |
| `NOT_FOUND` | `GetFinancialAccount` 或 `GetExchangeRate` 的目标对象不存在 |
| `FAILED_PRECONDITION` | 资源存在，但当前读取前提不满足 |
| `UNAVAILABLE` | 当前服务暂不可用 |
| `INTERNAL` | 未归类的服务内部错误 |

补充说明：

- `SearchFinancialAccounts` 空页、`SearchAccountTransactions` 空页都必须走正常响应语义
- phase 1 query 不使用 `ALREADY_EXISTS`
