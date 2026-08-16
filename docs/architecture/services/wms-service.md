# wms-service 职责卡

Last Updated: 2026-08-15

## 1. Purpose

`wms-service` 是 OES 的仓储执行与库存真相服务，负责回答“货现在在哪里、还有多少、处于什么状态、能不能再被别人使用、下一步仓内应该如何处理与交付”。

当前职责卡是基于卫浴陶瓷制造与仓储现场的最小稳定版本，优先冻结库存准确、交仓、包装、占用与后处理协同边界。

## 2. Owns

- 正式仓储责任下的库存对象、库存余额与库存状态真相。
- `InventoryUnit`、`InventoryLot`、`InventoryBalance`、`PackageUnit`、`InventoryGenealogy` 等仓储对象与库存转换追溯事实。
- 仓库、仓区、区位、缓冲区、待处理区、待发区等仓储拓扑。
- 入库、上架、区位记录、库内移位、跨仓调拨与回仓。
- 占用 / 预留 / 分配真相，以及紧急订单重分配前的仓储侧判断基础。
- 包装作业与包装耗材领用引起的库存转换事实。
- 送后处理前的库存锁定、冻结、送返与处理返回后的库存状态变化。
- 混合追踪能力：
  - 无码按数量
  - 箱码
  - 单件码
- 箱 / 件 / 套等计量单位换算下的库存一致性。
- 盘点差异发现与库存动作历史查询入口。

## 3. Does Not Own

- 胚体、`ProductionUnit` 与制造过程中的 WIP 真相；该事实归属 `mes-service`。
- 打孔、laser logo、修补、试水等后处理工序执行真相；该事实归属 `mes-service`。
- 质检规则、质量放行结论与质量治理真相。
- 销售订单、交期承诺、经营单据与财务结算真相。
- 扫码解析、统一编码与路由平台真相。

## 4. Core Responsibilities

- 在放行后接手 `MES -> WMS` 交仓责任，而不是在烧成完成时自动接手。
- 以位置准确、数量准确、状态准确与单位准确为核心，建立库存准确闭环。
- 支持卫浴陶瓷大件的区位管理，以及配件、包材等更适合箱 / 件管理的库存控制。
- 支持目标 SKU 现货、可转化基础 SKU、已包装可拆回库存与已占用库存的履约可用性判断基础。
- 为紧急订单提供重分配前的可行性判断，但不替代人工审批。
- 管理包装与出货前仓储准备，而不接管制造与质量工序真相。

## 5. External Interfaces

- 典型上游：
  - `api-gateway`
  - `mes-service`
  - `sales-service / fulfillment boundary`
  - 统一扫码入口 / trace identity
- 典型下游：
  - future shipping / logistics integration
  - future BI / audit read models
- 当前设计工作台：

## 6. Upstream Dependencies

- `mes-service`
  - 提供放行后可交仓对象、后处理执行结果与制造侧追溯摘要。
- `sales-service / fulfillment boundary`
  - 提供订单承诺、商业放行条件、履约需求、紧急程度与人工审批结果。
- 统一扫码入口 / trace identity
  - 提供编码解析与对象路由能力。
- `item-master-service`
  - 提供 `ItemModel`、active + stockable `Item`、`PackagingSpec` 与 `PACKAGING_BOM` 引用基础。
  - WMS 不复制 Item 主数据，也不建立 `StockItemType` 替代 Item truth。
- `procurement-service`
  - 提供 `ReceivingExpectation` 存在性与受控 receipt projection；WMS 不复制 expectation、PO 或 discrepancy resolution 真相。

## 6.1 Trusted gRPC Boundary

- 当前 15 个 WMS RPC 各自只有一种执行分类：`BUSINESS / HUMAN / WEB`。Gateway 是唯一 production caller，audience 固定为 `urn:oes:service:wms-service`，每个方法要求冻结的 existing Permission Code、WEB terminal、mTLS 与 certificate-bound ET；MACHINE、DELEGATED、SELF_SERVICE、非 Gateway workload 与任何 dual mode 均拒绝。
- 15 个 request 中的 15 个 `tenant_id`、15 个 `operator_context`、15 个 `trace_context`、4 个 management `audit_context` 与 6 个 request `org_id` 共 55 个 authority 字段全部删除并按原 field number/name reserve；三个 legacy context message 的 8 个 nested 字段同样 tombstone。response 与 WMS-owned records 中的 tenant/org projection 保留。
- tenant、适用 org、subject/operator、trace、audit 与 direct workload 只来自 verified ET、mTLS identity 与 transport correlation。request/body、ordinary metadata、signed operator payload、request-id/trace-id fallback 与 raw smoke 不构成 authority。
- Gateway 通过 dedicated WMS mTLS client 使用 HUMAN session 兑换 WMS audience ET；WMS ingress 只接受 Token，不调用 Auth 做普通 RPC admission，也不保留 generic `SERVICE_NAMES.WMS` client 或 legacy metadata fallback。
- WMS trusted ingress 建立 request-isolated verified HUMAN proof 后，激活已准备的 WMS→Item Master `ResolveStockableItem` 与 WMS→Procurement `ResolveReceivingExpectationForReceipt` HUMAN_OBO caller。两条调用都保留原 HUMAN subject/tenant，并由 Auth 绑定 exact `wms-service` SYSTEM MACHINE actor、target audience、Permission decision、expiry 与 caller certificate；目标服务只接收当前目标 ET。
- 两条 outbound activation 不新增 WMS、Item Master 或 Procurement 业务能力，不改变 receipt、inventory、transaction、audit、idempotency、schema、event/outbox 或 retry 语义。后台无 HUMAN subject 的 worker/Cron/Robot、AI/ActionGrant 与 DELEGATED runtime 继续 deferred。

## 7. Downstream / Published Facts

- 仓储库存位置、数量、状态与可用性摘要。
- 占用 / 释放 / 重分配结果。
- 包装转换引起的库存变化事实。
- 库存转换、包装、装配、拆解与追溯关系事实。
- 送后处理、跨仓调拨、外发与回仓的仓储动作事实。
- 盘点差异与库存动作历史摘要。

## 8. Non-goals

- 不把所有实物对象都直接归为 WMS 库存。
- 不在 WMS 内重建 MES 的工序、质检与返修真相。
- 不让 `sales-service / fulfillment boundary` 继续维护独立的物理占用真相。
- 不假设全仓天然一物一码。
- 不默认按标准货架仓逻辑反向定义卫浴陶瓷仓储现场。

## 9. Current Stage

当前阶段优先冻结最小职责边界：

- 第一阶段首先服务库存准确闭环，而不是高级自动化策略。
- 空瓷是否归 WMS 由是否完成放行并进入正式库存区决定，不由名称决定。
- 包装作业系统上归 WMS，人员组织归属暂不冻结。
- 打孔、修补、试水等后处理执行真相归 `mes-service`，WMS 只负责仓储侧送返与状态控制。
- 所有正式库存都按 `Item` 汇总，`StockItemType` 不作为新稳定设计概念。
- `PostReceipt` 显式引用 expectation 时，只通过 Procurement 的窄 `ResolveReceivingExpectationForReceipt` INTERNAL RPC 校验当前 tenant 可见性并取得 target warehouse 摘要；不能复用 Procurement 的 Gateway BUSINESS 查询。
- WMS→Item Master 与 WMS→Procurement 的执行形态固定为 `HUMAN_OBO`：保留发起 `PostReceipt` 的 HUMAN subject，`act` 为 exact `wms-service` SYSTEM MACHINE actor。它们随本服务 trusted inbound cutover 一并激活，不存在 MACHINE_ROOT、body tenant 或 legacy metadata fallback。
