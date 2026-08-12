# sales-service Pricing Management API

## 1. 模块职责

`PricingManagementService` 负责 `sales-service` phase 1 pricing capability 的写接口。

phase 1 management 只覆盖：

- `PriceList` 创建、更新、整表换线与状态切换
- `CustomerPriceAgreement` 创建、draft 更新、版本发布
- 基于 `SalesOrderLine` 反向形成客户长期价格协议 draft

phase 1 management 不覆盖：

- 完整 pricing engine
- workflow、campaign engine、rebate、commission
- finance 汇率真相维护
- 合同价完整生命周期

## 2. 通用上下文要求

所有 phase 1 pricing management command 都按 [Sales trusted execution contract](README.md#5-trusted-execution-contract) 接受 `BUSINESS / HUMAN / WEB` ExecutionToken。tenant、operator、org、trace 与审计身份/来源由 trusted context 提供，不再出现在 request body。

补充约束：

- phase 1 仅支持 `USD / CNY`
- command 必须按 command 语义处理，不得被调用方当作 query 使用
- trusted context 的验证与字段处置以 README §5 为准，本文件不展开幂等键或审计落库结构

## 3. 写入基线语义

### 3.1 `PriceList` 语义

- `PriceList` 表达标准价、活动价、展会价
- `PriceList` 在 phase 1 不做独立版本化，按当前头信息和当前行内容维护
- `ReplacePriceListLines` 采用“整表替换”语义，不做 partial patch
- `ChangePriceListStatus` 只改变 `PriceList` 生命周期，不改写既有 Quote / Order snapshot

### 3.2 `CustomerPriceAgreement` 版本化语义

- `CustomerPriceAgreement` 是按 `tenant_id + customer_tenant_party_id + currency_code` 建立的协议家族
- 同一组 `customer + currency` 最多只有一个 active 协议版本
- `CreateCustomerPriceAgreement` 只在该协议家族尚不存在时使用，并创建 `version_no = 1` 的 draft
- 已存在 active 协议时，新的 item / price / MOQ 变更必须进入新的 draft version，而不能原地改写 active version
- `UpdateCustomerPriceAgreementDraft`：
  - 若当前已有 draft，只修改该 draft
  - 若当前没有 draft 但存在 active，必须先从 active fork 出 `next version` draft，再应用本次修改
- `PublishCustomerPriceAgreementVersion` 成功后：
  - draft 变为 active
  - 旧 active 变为 superseded
  - 同一协议家族不再保留第二个 active

### 3.3 `CreateCustomerPriceAgreementFromSalesOrderLine` 语义

- 该命令用于把某个已成立 `SalesOrderLine` 的销售承诺提炼成客户长期价格协议 draft
- 它只生成或更新 draft，不自动 publish
- 它不改变 `SalesOrderLine` owner，也不回写原订单快照

### 3.4 Snapshot 语义

- `QuoteLine / QuoteVersionLine / SalesOrderLine` 最终冻结的是 snapshot，而不是运行时再回源重算
- active 协议、价目表或 Finance 汇率在后续发生变化，不得反向改写既有 Quote / Order snapshot
- `PublishQuote` 必须把 `QuoteLine` 当前 pricing snapshot 原样冻结进 `QuoteVersionLine`
- `ConvertQuoteVersionToOrder` 必须把 `QuoteVersionLine` pricing snapshot 原样复制进 `SalesOrderLine`

## 4. RPC 语义

### `CreatePriceList`

- 作用：创建一个新的 `PriceList`

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `price_list_name` | 是 | PriceList 显示名 |
| `price_list_type` | 是 | `STANDARD | ACTIVITY | EXHIBITION` |
| `currency_code` | 是 | `USD | CNY` |
| `effective_from` | 是 | 生效起点 |
| `effective_to` | 否 | optional 生效终点 |
| `initial_lines[]` | 否 | 初始化行；允许空表创建 |
| `reason` | 否 | optional 用户操作说明；边界与字段号见 README §5.3 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `price_list` | 新建后的 `PriceList` |

空语义：

- phase 1 允许空 `PriceList`
- 成功时必须返回新建 `price_list`

### `UpdatePriceList`

- 作用：更新某个 `PriceList` 的头信息

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `price_list_id` | 是 | 目标 `PriceList` 标识 |
| `price_list_name` | 否 | 新显示名 |
| `effective_from` | 否 | 新起点 |
| `effective_to` | 否 | 新终点 |
| `reason` | 否 | optional 用户操作说明；边界与字段号见 README §5.3 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `price_list` | 更新后的 `PriceList` |

关键语义：

- `currency_code` 与 `price_list_type` 在 phase 1 不通过该命令修改
- 更新头信息不改变既有 Quote / Order snapshot

### `ReplacePriceListLines`

- 作用：整表替换某个 `PriceList` 的行集合

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `price_list_id` | 是 | 目标 `PriceList` 标识 |
| `lines[]` | 是 | 替换后的完整行集合 |
| `reason` | 否 | optional 用户操作说明；边界与字段号见 README §5.3 |

`lines[]` 最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `item_id` | 是 | 目标 Item |
| `unit_price_amount` | 是 | 销售单价 |
| `moq_quantity` | 是 | 最小起订量 |
| `quantity_uom_code` | 是 | 数量单位 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `price_list` | 更新后的 `PriceList` 头信息 |
| `price_list_lines[]` | 替换后的完整行结果 |

关键语义：

- 该命令是 replace，不是 merge
- 同一 `item_id` 在一个 `PriceList` 中最多出现一行

### `ChangePriceListStatus`

- 作用：切换某个 `PriceList` 的生命周期状态

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `price_list_id` | 是 | 目标 `PriceList` 标识 |
| `target_status` | 是 | `DRAFT | ACTIVE | INACTIVE` |
| `reason` | 否 | optional 用户操作说明；边界与字段号见 README §5.3 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `price_list` | 状态变更后的 `PriceList` |

关键语义：

- phase 1 不冻结更细的状态机，只冻结这三个稳定状态
- `ACTIVE` 只表达可被 selected price list 使用，不代表它一定被某个 Quote 自动采用

### `CreateCustomerPriceAgreement`

- 作用：为某个客户和币种创建客户长期价格协议家族，并生成首个 draft version

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `customer_tenant_party_id` | 是 | 客户主体稳定引用 |
| `currency_code` | 是 | `USD | CNY` |
| `initial_lines[]` | 否 | 初始化 draft 行；允许空 draft |
| `reason` | 否 | optional 用户操作说明；边界与字段号见 README §5.3 |

`initial_lines[]` 最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `item_id` | 是 | 目标 Item |
| `unit_price_amount` | 是 | 协议单价 |
| `moq_quantity` | 是 | 协议 MOQ |
| `quantity_uom_code` | 是 | 数量单位 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `customer_price_agreement` | 新建后的 draft 版本 |

空语义：

- 成功时返回 `version_no = 1` 且 `status = DRAFT`
- 若该 `customer + currency` 协议家族已存在，返回 `ALREADY_EXISTS`

### `UpdateCustomerPriceAgreementDraft`

- 作用：修改某个协议家族的当前 draft 版本

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `customer_price_agreement_id` | 是 | 协议家族标识 |
| `draft_mutation` | 是 | 本次 draft 修改内容 |
| `reason` | 否 | optional 用户操作说明；边界与字段号见 README §5.3 |

`draft_mutation` 最小语义：

- 允许新增 item
- 允许修改既有 item 的价格
- 允许修改既有 item 的 MOQ
- 允许删除 draft 中某个 item

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `customer_price_agreement` | 更新后的 draft 版本 |

关键语义：

- 新 item、改价格、改 MOQ 都必须体现在新的 draft version 中，不能原地改 active
- 若当前无 draft 且存在 active，必须自动 fork `next version` draft 再应用修改
- 若协议家族不存在，返回 `NOT_FOUND`

### `PublishCustomerPriceAgreementVersion`

- 作用：显式发布某个协议家族的当前 draft version

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `customer_price_agreement_id` | 是 | 协议家族标识 |
| `reason` | 否 | optional 用户操作说明；边界与字段号见 README §5.3 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `customer_price_agreement` | 发布后的 active 版本 |

关键语义：

- 只有显式 publish 才能产生新的 active version
- publish 成功后，旧 active 若存在则变为 `SUPERSEDED`
- 同一时刻同一 `customer + currency` 最多只有一个 active version
- 不存在 draft 时返回 `FAILED_PRECONDITION`

### `CreateCustomerPriceAgreementFromSalesOrderLine`

- 作用：基于某个 `SalesOrderLine` 的已冻结快照，创建或更新对应客户协议家族的 draft

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `sales_order_line_id` | 是 | 来源订单行标识 |
| `reason` | 否 | optional 用户操作说明；边界与字段号见 README §5.3 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `customer_price_agreement` | 创建或更新后的 draft 版本 |

关键语义：

- 协议家族由 `SalesOrderLine` 自带的 `customer_tenant_party_id + currency_code` 推导
- 若协议家族不存在，则创建 `version_no = 1` draft
- 若协议家族已存在且无 draft，则先 fork `next version` draft
- 该命令把订单行中的 `price_snapshot` 与 `moq_snapshot` 提炼成协议行
- 该命令不自动 publish，不改变原订单 snapshot

## 5. 错误语义

phase 1 pricing management 只冻结以下错误面：

| 错误码 | 语义 |
| --- | --- |
| `INVALID_ARGUMENT` | 请求字段缺失、格式非法、状态非法、重复 item 行、币种不在 `USD / CNY` 内 |
| `UNAUTHENTICATED` | 缺少或无法验证目标 ExecutionToken / mTLS binding |
| `PERMISSION_DENIED` | 调用方存在上下文，但没有在该 tenant pricing 资源上执行命令的权限 |
| `NOT_FOUND` | 目标 `PriceList`、协议家族或 `SalesOrderLine` 不存在 |
| `ALREADY_EXISTS` | 资源已存在，例如 `customer + currency` 协议家族已存在 |
| `FAILED_PRECONDITION` | 资源存在，但当前状态不满足命令前提，例如没有 draft 却请求 publish，或 preview / copy 无法形成完整 MOQ snapshot |

补充说明：

- phase 1 不冻结除上述列表之外的其他错误码
- 命令成功时不得返回空响应掩盖结果，必须返回更新后的资源
