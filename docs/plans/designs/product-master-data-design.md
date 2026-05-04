# Product Master Data Design Workspace

> 2026-05-04 收口：当前阶段不建立独立 `product-service`。`item-master-service` 承担 Item 基础主数据与类似 product master 的职责；`ManufacturingSpec` 归 `mes-service`，并通过 `manufacturable + PHYSICAL Item` 引用 Item Master 准入边界。

## 1. 目标

- 记录 OES 中 `product master data` 设计讨论的当前结论、分歧点与恢复入口。
- 记录为什么当前阶段不建立独立 `product-service`，以及 Item Master / MES / Sales / WMS 的产品对象归属边界。
- 避免把报价、销售订单、MES、WMS、渠道展示中的“产品”继续压扁成同一个语义对象。

## 2. 当前范围

- 本 workspace 负责：
  - `product master data` 的设计方向与边界判断
  - 报价、订单、生产、库存、出货之间产品语义不一致的问题收敛
  - 当前阶段不建立独立 `product-service` 后，各产品相关对象的 owner 归属记录
- 本 workspace 不负责：
  - 具体数据库表结构
  - 具体 gRPC / event / HTTP 契约字段
  - 具体代码实现
  - 网站群 / 小程序 / APP 发布能力的详细协议设计

## 3. 涉及对象

- services:
  - `item-master-service`
  - `sales-service`
  - `mes-service`
  - `wms-service`
- features:
  - 报价到订单到出货
  - 生产到库存到出货
  - 产品主数据治理
- collaborations:
  - `sales <-> product master data`
  - `mes <-> product master data`
  - `wms <-> product master data`
  - `sales / mes / wms <-> shipment fulfillment`

## 4. 已冻结决定

| 日期 | 决定 | 影响范围 | 回写目标 |
| --- | --- | --- | --- |
| 2026-04-22 | 第一阶段优先主链路是 `报价 -> 订单 -> 出货` 与 `生产 -> 库存 -> 出货`；网站发布先后置，不作为当前产品主数据边界的决定因素。 | product master、sales、MES、WMS、履约协同 | 本 workspace；后续 feature / architecture |
| 2026-04-22 | OES 不接受把报价、销售订单、MES、WMS、网页展示中的“产品”压成同一个统一 `Product` 概念。 | 产品建模、跨域协同 | 本 workspace；后续 architecture / ADR |
| 2026-04-22 | 后续设计必须允许套装、组件、包装单元、制造对象、营销展示对象并存，不能强行一一对齐。 | 产品对象分层、映射规则 | 本 workspace；后续 architecture / contracts |
| 2026-04-22 | `product service` 是否值得建立，不能只因为“多个域依赖产品”就直接下结论；必须看它是否稳定承载跨域共享定义、映射与规则，而不吞掉各域运行事实。 | 服务拆分时机、主数据边界 | 本 workspace；后续 architecture / ADR |
| 2026-04-22 | `product service` 若存在，其候选职责更接近“标准定义 / 共享属性 / 组合与映射规则中心”，而不是报价、库存、在制品、网站运营状态的事实归属地。 | 服务职责划分 | 本 workspace；后续 services / collaborations |
| 2026-05-04 | 当前阶段不建立独立 `product-service`；`item-master-service` 继续作为 Item / product-master-like 基础主数据服务，`ManufacturingSpec` 归 `mes-service`。 | Item Master、MES、产品主数据服务化边界 | `docs/architecture/services/item-master-service.md`; `docs/architecture/services/mes-service.md`; `docs/contracts/mes-service/**` |

## 5. 开放问题

| 日期 | 问题 | 为什么未冻结 | 下一步 |
| --- | --- | --- | --- |
| 2026-04-22 | 哪些对象属于共享主数据，哪些对象属于 `sales / mes / wms` 的运行事实 | `Item / ManufacturingSpec` 已收口，但包装定义、营销展示对象、客户专属组合仍未冻结 | 后续按具体主线分别回写到 Item Master、MES、Sales 或 WMS |
| 2026-04-22 | 包装定义、组合规则、销售对象之间的最小映射模型是什么 | 当前只冻结 `ItemComposition` 与 Sales line snapshot，包装主数据和客户专属组合仍 deferred | 基于报价、履约与包装作业场景继续收敛 |
| 2026-04-22 | 套装关系、组件关系、包装关系中，哪些是稳定主数据，哪些会按客户或订单变化 | 如果客户差异过强，就不能全部主数据化 | 继续基于报价与履约场景补例子判断 |

## 6. 当前判断草稿

- 当前最值得警惕的风险不是“没有独立 `product-service`”，而是把不同业务上下文中的产品对象混成一个模型。
- 当前阶段明确不建立独立 `product-service`。
- `item-master-service` 承担 Item 基础主数据、能力、套装组成与供应商型号映射。
- `mes-service` 承担 `ManufacturingSpec`，因为它服务模具适配、路线、工序参数、WIP 属性锁定与制造现场执行。
- 包装定义、客户专属组合、营销展示对象与长期客户产品目录继续 deferred，不能反向塞进 Item Master 或 MES。

## 7. 真相源回写计划

- 服务职责：
  - `docs/architecture/services/item-master-service.md`
  - `docs/architecture/services/mes-service.md`
- 协同蓝图：
  - `docs/architecture/collaborations/item-master-sales-mes-wms-srm.md`
- contracts：
  - `docs/contracts/item-master-service/**`
  - `docs/contracts/mes-service/**`
- feature packet：
  - 暂不进入 feature packet，先完成设计收敛
- architecture / ADR：
  - 如未来重新打开独立 `product-service`，必须先新增 ADR 说明为什么 `item-master-service` 不足以承载该边界

## 8. 恢复入口

- 下次继续前先读：
  - [manufacturing-master-data-design.md](/Users/acehood/Documents/GitHub/oes/docs/plans/designs/manufacturing-master-data-design.md)
  - [mes-service-design.md](/Users/acehood/Documents/GitHub/oes/docs/plans/designs/mes-service-design.md)
  - [ideas.md](/Users/acehood/Documents/GitHub/oes/docs/plans/ideas.md)
- 当前推荐下一步：
  - 列一张产品对象分层与 ownership 表
  - 用 2-3 个真实产品案例验证对象与映射关系
  - 将仍未冻结的包装定义、营销展示对象、客户专属组合分别归位到 Item Master、Sales、MES 或 WMS
