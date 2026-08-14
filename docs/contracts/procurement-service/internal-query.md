# procurement-service Internal Receiving Expectation Query API

## 1. 目的与信任边界

`ProcurementInternalQueryService` 只向 WMS 暴露 `PostReceipt` 已要求的 ReceivingExpectation 受控引用事实，避免 WMS 复用面向 Gateway 页面展示的宽 `GetReceivingExpectation`。

- RPC：`ResolveReceivingExpectationForReceipt`
- 分类：`INTERNAL / HUMAN_OBO`
- Code：`procurement.internal.receiving_expectation.resolve_for_receipt`
- audience：`urn:oes:service:procurement-service`
- subject：发起当前 WMS `PostReceipt` 的 verified HUMAN
- actor：exact `wms-service` SYSTEM MACHINE workload
- 拒绝 direct HUMAN、pure MACHINE root、DELEGATED、TENANT MACHINE、错误 workload/audience/Code/certificate 与 legacy authority
- WMS trusted inbound 完成前 caller 只允许 `PREPARED_NOT_ACTIVATED`

## 2. Wire shape

请求只包含：

| 字段 | 编号 | 说明 |
| --- | ---: | --- |
| `receiving_expectation_id` | 1 | 显式引用的 Procurement expectation |

响应只包含：

| 字段 | 编号 | 说明 |
| --- | ---: | --- |
| `receiving_expectation_id` | 1 | expectation 稳定标识 |
| `purchase_order_id` | 2 | 所属 PO 标识 |
| `purchase_order_line_id` | 3 | 所属 PO 行标识 |
| `target_warehouse_id` | 4 | optional 目标仓摘要 |
| `open_quantity` | 5 | Procurement 当前未收数量摘要 |
| `status` | 6 | Procurement 当前 expectation 状态摘要 |

`NOT_FOUND` 表示当前 verified tenant 下 expectation 不存在。该 RPC 不新增 active/open gating，不关闭 expectation，不判断 supplier resolution，也不修改 WMS receipt 或库存真相；target warehouse 匹配继续由 WMS `PostReceipt` 规则执行。

## 3. 归因与禁止项

- Auth OBO exchange 保留 HUMAN subject，从 deployment-owned workload policy 选择 WMS actor；caller 不提交 actor 或 tenant。
- target ET expiry 不超过 subject ET，并保留 subject `jti -> target jti` 与 actor/workload 审计关联。
- body/local metadata tenant、generic Procurement client、caller-selected projection 与 fallback 均禁止。
- 后台无 HUMAN subject 的 WMS 作业不使用本契约，留待独立设计。
