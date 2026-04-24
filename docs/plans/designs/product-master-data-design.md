# Product Master Data Design Workspace

## 1. 目标

- 记录 OES 中 `product master data` 设计讨论的当前结论、分歧点与恢复入口。
- 为后续判断 `product service` 是否独立、最小边界应包含哪些对象提供工作台。
- 避免把报价、销售订单、MES、WMS、渠道展示中的“产品”继续压扁成同一个语义对象。

## 2. 当前范围

- 本 workspace 负责：
  - `product master data` 的设计方向与边界判断
  - 报价、订单、生产、库存、出货之间产品语义不一致的问题收敛
  - `product service` 是否成立、成立后最小职责范围的讨论记录
- 本 workspace 不负责：
  - 具体数据库表结构
  - 具体 gRPC / event / HTTP 契约字段
  - 具体代码实现
  - 网站群 / 小程序 / APP 发布能力的详细协议设计

## 3. 涉及对象

- services:
  - `product service`（待定）
  - `sales-service`（未来）
  - `mes-service`
  - `wms-service`（未来）
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

## 5. 开放问题

| 日期 | 问题 | 为什么未冻结 | 下一步 |
| --- | --- | --- | --- |
| 2026-04-22 | `product service` 是否应在当前阶段就独立成服务，还是先作为较粗粒度主数据能力存在 | 仍需根据真实对象清单和主链路复杂度判断是否过度设计 | 先列产品对象分层与归属表，再判断是否需要独立服务 |
| 2026-04-22 | 哪些对象属于共享主数据，哪些对象属于 `sales / mes / wms` 的运行事实 | 当前只有方向判断，尚未形成对象级清单 | 产出对象分层表与 ownership 表 |
| 2026-04-22 | `Manufacturing Spec`、包装定义、组合规则、销售对象之间的最小映射模型是什么 | 这是后续是否值得建立 `product service` 的核心依据 | 基于真实案例继续收敛 |
| 2026-04-22 | 工艺路线模板是否属于 `product master data`，还是应归 `mes-service` / 独立工艺域 | 目前只形成“标准模板可能相关、执行事实一定不归 product”的判断，尚未冻结 | 在制造设计线程中与 `mes-service` 边界联动收敛 |
| 2026-04-22 | 套装关系、组件关系、包装关系中，哪些是稳定主数据，哪些会按客户或订单变化 | 如果客户差异过强，就不能全部主数据化 | 继续基于报价与履约场景补例子判断 |

## 6. 当前判断草稿

- 当前最值得警惕的风险不是“没有独立 `product service`”，而是把不同业务上下文中的产品对象混成一个模型。
- 若后续确认跨域共享且相对稳定的对象主要包括这些内容：
  - 产品族 / `SPU`
  - 组件定义
  - 可销售对象的标准定义
  - 制造规格定义
  - 标准包装定义
  - 组合与映射规则
  - 共享属性字典
  则建立 `product service` 的理由会比较充分。
- 若后续发现大部分组合、包装、销售表达都按客户 / 订单强烈变化，而稳定共享部分很薄，则当前直接独立 `product service` 可能属于过度设计。
- 当前倾向不是“先否定”或“先肯定” `product service`，而是先做对象分层与 ownership 收敛，再决定服务形态。

## 7. 真相源回写计划

- 服务职责：
  - `docs/architecture/services/product-service.md`（未来，如确定独立服务）
- 协同蓝图：
  - `docs/architecture/collaborations/product-sales-mes-wms.md`（未来）
- contracts：
  - `docs/contracts/product-service/**`（未来）
- feature packet：
  - 暂不进入 feature packet，先完成设计收敛
- architecture / ADR：
  - 如确认需要独立 `product service` 或形成新的产品对象分层原则，再升级到 architecture / ADR

## 8. 恢复入口

- 下次继续前先读：
  - [manufacturing-master-data-design.md](/Users/acehood/Documents/GitHub/oes/docs/plans/designs/manufacturing-master-data-design.md)
  - [mes-service-design.md](/Users/acehood/Documents/GitHub/oes/docs/plans/designs/mes-service-design.md)
  - [ideas.md](/Users/acehood/Documents/GitHub/oes/docs/plans/ideas.md)
- 当前推荐下一步：
  - 列一张产品对象分层与 ownership 表
  - 用 2-3 个真实产品案例验证对象与映射关系
  - 再判断 `product service` 是正式独立服务，还是先作为较粗粒度主数据能力存在
