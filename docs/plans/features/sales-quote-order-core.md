# Sales Quote Order Core

## 1. 目标

- 将 `sales-service` phase 1 已冻结结论回写为可执行 feature packet，作为后续 `SALES-CONTRACT` 的唯一主线入口。
- 建立销售交易第一阶段最小闭环：
  - `Quote`
  - `QuoteVersion`
  - `SalesOrder`
  - `SalesOrderLine`
  - transaction snapshot
  - customer commitment
- 明确 `sales-service` 只承接对客商业前提与 handoff，不吞掉 CRM、Party、Item、WMS、MES、Finance 或 CLM 真相。

## 2. 不做什么

- 不在本 packet 中进入代码实现、proto 字段设计或数据库结构设计。
- 不在本 packet 中设计“大 erp-service”。
- 不在本 packet 中把 opportunity、Party、Item、库存、制造执行或财务对象并入 `sales-service`。
- 不在本 packet 中把 `Contract / CLM` 作为 phase 1 必经步骤。
- 不在本 packet 中展开完整 pricing engine、packaging master 或客户产品目录。

## 3. 上游依赖

- services:
  - [sales-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/sales-service.md)
  - [crm-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/crm-service.md)
  - [party-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/party-service.md)
  - [item-master-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/item-master-service.md)
  - [mes-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/mes-service.md)
  - [wms-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/wms-service.md)
- collaborations:
  - [sales-crm-party-item-master.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/collaborations/sales-crm-party-item-master.md)
  - [item-master-sales-mes-wms-srm.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/collaborations/item-master-sales-mes-wms-srm.md)
  - [sales-fulfillment-mes-wms-finance.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/collaborations/sales-fulfillment-mes-wms-finance.md)
- plans:
  - [erp-service-design.md](/Users/acehood/Documents/GitHub/oes/docs/plans/designs/erp-service-design.md)

## 4. 当前结论

- 不再设计大 `erp-service` 承接销售主链；sales phase 1 正式 owner 为 `sales-service`。
- `sales-service` owns：
  - `Quote`
  - `QuoteVersion`
  - `SalesOrder`
  - `SalesOrderLine`
  - transaction snapshot
  - customer commitment
- `sales-service` does-not-own：
  - `crm-service opportunity`
  - `party-service` 主体真相
  - `item-master-service` Item 真相
  - `wms-service` 库存 / 占用真相
  - `mes-service` 制造执行真相
  - future `finance-service` 的 `AR / AP / invoice / payment`
  - `Contract / CLM` 生命周期真相
- `Quote` 草稿可反复修改；只有显式发布才生成 `QuoteVersion`。
- 下载 / 预览 / 打印 / 导出不生成 `QuoteVersion`。
- `SalesOrder` 只能通过显式成立动作创建。
- 订单成立、允许生产、允许备货、允许发货必须拆开，不得折叠为单一确认动作。
- fulfillment boundary 拥有 physical release 与执行推进；`sales-service` 只拥有商业前提与 handoff。
- `SalesOrderLine` phase 1 必须保存：
  - `itemId`
  - `itemSnapshot`
  - `salesConfigSnapshot`
  - `packagingRequirementSnapshot`
  - `priceQuantityDeliverySnapshot`
  - `customerItemSnapshot`
- `customerItemSnapshot` 用于出口业务中的客户自有 `SKU / 型号 / 标签显示名`。
- 长期 `CustomerItemMapping` 仅作为 `Sales / CRM` 协同候选；phase 1 不实现完整客户产品目录。

## 5. 契约真相位置

- 稳定服务职责：
  - [sales-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/sales-service.md)
- 稳定协同蓝图：
  - [sales-crm-party-item-master.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/collaborations/sales-crm-party-item-master.md)
  - [sales-fulfillment-mes-wms-finance.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/collaborations/sales-fulfillment-mes-wms-finance.md)
  - [item-master-sales-mes-wms-srm.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/collaborations/item-master-sales-mes-wms-srm.md)
- 下一步 contract 入口：
  - [sales-service contracts](/Users/acehood/Documents/GitHub/oes/docs/contracts/sales-service/README.md)

## 6. 当前 slice

- slice:
  - `sales-service` quote-order core
- status:
  - implementation-present / fresh-verification-needed
- scope:
  - `Quote`
  - `QuoteVersion`
  - `SalesOrder`
  - `SalesOrderLine`
  - line-level transaction snapshots
  - order establishment / allow-production / allow-stocking / allow-shipping
  - fulfillment handoff boundary
- ready definition:
  - 服务职责已回写
  - 关键协同蓝图已冻结 minimum 口径
  - sales-service 黑盒 contract 已建立
  - sales-service runtime 已存在；本次状态校准未重跑 fresh verification

### 6.1 状态校准记录

Status, 2026-06-07:

- `docs/contracts/sales-service/**` 已存在并承接 Sales phase 1 management、query、pricing management 与 pricing query contract。
- `src/services/business/sales-service/**` 已存在 service runtime、Prisma schema、gRPC controller、tests 与 smoke script。
- 本次校准只修正文档状态；未重跑 `sales-service` test / build / smoke，因此当前状态不得写成 fresh verified 或 fully closed。
- Trusted-gRPC 迁移已在 [trusted-grpc-execution-context.md](trusted-grpc-execution-context.md#97-sales-27-rpc-frozen-cutover-lease) 冻结为独立 transport slice。该 slice 会删除历史 raw gRPC `sales-smoke.mjs` 及 package command，后续 fresh verification 使用 packet 中的 proto、build、focused test 与 security gates，不再以该 smoke 为关闭条件；这不改变本 packet 的 Sales 业务能力。

## 7. 最小模型

### 7.1 Quote

- 表达对客报价草稿与当前工作态。
- 草稿阶段允许反复修改，不要求每次保存形成历史正式版本。

### 7.2 QuoteVersion

- 表达一次正式对外发布的稳定报价基线。
- 用于历史留痕、客户确认、订单成立依据与旧版本找回。

### 7.3 SalesOrder

- 表达显式成立后的正式销售订单。
- 订单成立与后续执行放行必须拆开治理。

### 7.4 SalesOrderLine

- 表达单行 customer commitment。
- 除稳定 `itemId` 外，phase 1 必须冻结：
  - `itemSnapshot`
  - `salesConfigSnapshot`
  - `packagingRequirementSnapshot`
  - `priceQuantityDeliverySnapshot`
  - `customerItemSnapshot`

### 7.5 Customer Commitment

- 表达销售域对客户承诺的数量、价格、交付与展示口径。
- 这些承诺进入 fulfillment boundary 后，物理执行真相不再归 `sales-service`。

## 8. 主线范围

- 本线程主线：
  - 冻结报价、正式版本、订单成立与 line snapshot 边界
  - 冻结 sales 与 CRM / Party / Item / Fulfillment / WMS / MES / Finance 的协同口径
- 本线程不做：
  - proto、数据库、运行时状态机、UI、workflow 细节、finance service 细化
- 偏移返回条件：
  - 如需新增跨服务公共契约、事件模型或 operator context 结构，必须先升级 architecture / ADR

## 9. 阻塞 / 依赖

- `SALES-CONTRACT` 线程需要基于本 packet 冻结 command / query 面，而不是回到 design workspace 重谈 owner 边界。
- fulfillment boundary 的正式服务形态仍未冻结，但不阻塞当前 sales phase 1 owner 边界。
- finance integration 只冻结边界，不阻塞 quote-order core 进入 contract 阶段。

## 10. Deferred 清单

- `Contract / CLM` 生命周期
- 完整 `CustomerItemMapping` / 客户产品目录
- 完整 pricing engine
- packaging master
- finance service 详细职责与会计对象
- fulfillment boundary 的正式服务拆分与事件全集
- quote / order 完整状态机字段与审批框架细节

## 11. 线程分工

| Thread / Owner | 职责 | 允许修改路径 | 输入 | 输出 | 状态 |
| --- | --- | --- | --- | --- | --- |
| SALES-ARCH-WRITEBACK thread | 回写 `sales-service` 稳定真相源与 feature packet | `docs/architecture/services/sales-service.md`, `docs/architecture/collaborations/**`, `docs/plans/features/sales-quote-order-core.md`, 必要索引页 | `erp-service-design` 与本轮冻结结论 | 服务职责、协同蓝图、feature packet | completed |
| SALES-CONTRACT thread | 冻结 `sales-service` 黑盒契约 | `docs/contracts/sales-service/**` | 本 feature packet、服务职责、协同蓝图 | quote / order / handoff contracts | completed |
| SALES-REALIZATION thread | 在已冻结边界内实现服务骨架与验证 | `src/services/business/sales-service/**` | feature packet、contracts | 可运行服务与验证结果 | implementation-present / fresh-verification-needed |

## 12. 验收标准

- `sales-service` 职责卡已明确 owns / does-not-own / phase 1 范围。
- 至少一份 Sales 与 `CRM / Party / Item-master` 的协同蓝图已冻结。
- 至少一份 Sales 与 `Fulfillment / WMS / MES / Finance` 的协同蓝图已冻结。
- feature packet 已能直接作为 `SALES-CONTRACT` 的输入，而不需要继续引用“大 erp-service”设计。

## 13. 关闭条件

- `docs/contracts/sales-service/**` 已建立并承接本 packet。
- 后续 contract 线程无需再次讨论“是否设计大 erp-service”。
- line snapshot、quote version 与 handoff 边界在 contract 阶段未被重新打开。
- 若需要关闭本 packet，应先重跑 sales-service 相关 test / build 与 trusted-gRPC packet 的 focused/security gates，并把 fresh verification 结果回写到本文。
