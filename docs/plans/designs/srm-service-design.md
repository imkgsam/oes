# SRM Service Design

## 1. 文档目的

本文件是 `srm-service` 的设计工作台，用于沉淀当前线程已经确认的 SRM 边界、协同关系、核心对象与阶段性结论。

当前文档的定位是：

- 冻结 SRM 的设计方向与职责边界。
- 作为后续继续讨论或回写 architecture / collaboration / feature packet 的恢复入口。
- 明确哪些设计已经确认，哪些问题仍保持开放。

当前文档明确不负责：

- 直接进入实现细节、数据库 schema 或代码目录级实现计划。
- 直接替代 `docs/architecture/services/*.md` 的稳定职责真相。
- 直接替代 `docs/architecture/collaborations/*.md` 的跨服务协同真相。
- 直接替代 `docs/contracts/**` 的契约正文。

## 2. 当前设计范围

本轮 SRM 设计已经覆盖：

- SRM 在 OES 中作为独立业务服务的正式定位。
- SRM 与 `party-service`、`permission-service`、`identity-service`、`tenant-org-service`、`procurement-service`、`communication / mailbox`、future quality / finance domain 的边界。
- 第一版 SRM 的核心对象方向：
  - `Supplier`
  - `SupplierContact`
- 第一版 SRM 的分析页方向：
  - `SupplierAnalysisView`
- 供应商分析页与跨服务经营事实之间的分层原则。

本轮刻意不继续冻结：

- gRPC / HTTP 契约字段细节。
- 正式 Prisma schema、表结构与索引。
- feature packet 拆分后的执行顺序与工时。
- 分析证据模型是统一 envelope、领域化 facts 还是混合结构。
- `SupplierQualification` 的资质模型与流程细节。
- `SupplierImprovementPlan` 的范围、触发条件与关闭流程。

## 3. SRM 的正式定位

### 3.1 领域定位

`srm-service` 是 OES 的供应商关系与供应侧协同真相服务，负责回答：

- 当前租户有哪些正式供应商关系对象？
- 这些供应商当前处于什么合作状态？
- 我们应该通过哪些联系人与供应商协作？
- 当前供应商分析页应展示哪些指标、趋势、风险和人工补充判断？
- Procurement、Communication、Workflow 和后续业务域应如何受控引用供应商业务真相？

它不是：

- 主体主数据服务
- 采购订单或采购履约真相服务
- 来料质量真相服务
- 邮件线程 / 共享邮箱工作台
- 消息投递平台
- AI 决策真相服务

### 3.2 推荐边界口径

本轮确认的口径是：

- SRM 是独立业务服务，与 CRM 类似采用“先冻结边界和核心对象，再逐步生长 feature”的策略。
- SRM 覆盖供应商业务档案、联系人、合作状态和供应商分析页。
- SRM 第一版不把准入 / 资质审核、整改闭环、采购交易、质量真相和财务结算真相直接纳入。
- SRM 可以消费其他服务发布的供应商分析相关事实，但不复制其原始业务真相。

## 4. SRM 拥有与不拥有的内容

### 4.1 SRM Owns

- 供应商业务档案：
  - `Supplier`
- 供应商联系人业务对象：
  - `SupplierContact`
- 供应商业务角色与分类语义：
  - 例如原料供应商、设备供应商、模具供应商、外协加工商
  - 例如战略型、观察期、冻结、淘汰等管理分类和状态
- 供应商合作状态与服务范围
- 联系人角色、首选联系渠道、主联系人语义、联系人健康度
- 第一版供应商分析页：
  - `SupplierAnalysisView`
- SRM 自身的人工风险备注、补充说明和供应商治理辅助事实

### 4.2 SRM Does Not Own

- `party-service` 的主体主数据真相：
  - `Party`
  - `TenantParty`
  - `PartyIdentifier`
  - `PartyRelationship`
- 认证、会话、令牌：
  - `auth-service`
- 身份映射与 operator context 真相：
  - `identity-service`
- 角色、权限、scope、policy 与授权判定真相：
  - `permission-service`
- 组织树、部门、小组、成员归属真相：
  - `tenant-org-service`
- 采购申请、采购订单、履约状态和延期计算规则：
  - `procurement-service`
- 来料检验、拒收、批次不良与质量判定真相：
  - future `quality-service` / `inventory` / `mes-service`
- 原始通信线程、共享邮箱责任制与通信归档：
  - `communication / mailbox`
- Email / SMS / IM 渠道投递：
  - `notification-service`
- AI 自动写入主数据与状态变更

## 5. 设计原则

- SRM 必须是独立服务，不并入 Procurement。
- `Supplier` 是 SRM 的供应商关系对象，不等于 `party-service` 主体主数据。
- `SupplierContact` 是正式核心对象，不作为 `Supplier` 聚合内的临时小字段块。
- 第一版优先降低供应商创建成本，不强行引入重准入流程。
- 供应商分析页可以聚合 risk，但风险和绩效都不应反向定义其他业务域真相。
- 原始经营事实保留在拥有它们的服务中，SRM 只消费面向供应商分析的派生结果或相关事实事件。
- 第一版优先冻结用户真正需要的页面语义和业务对象，不提前做过度通用的分析存储抽象。

## 6. 第一版核心对象

### 6.1 Supplier

`Supplier` 是 SRM 中的供应商业务档案对象。

它不等于 `party-service` 的主体主数据。更准确地说：

- `party-service` 回答“这个主体是谁”
- `srm-service.Supplier` 回答“这个主体作为供应商在当前租户内如何被合作与治理”

`Supplier` 第一版应承载的典型信息包括：

- `tenantPartyId` 或其他主体引用结果
- supplier code / display name
- supplier type
- management category
- service categories
- enabled org scope
- owner / team
- collaboration summary
- analysis summary
- current status

第一版 `Supplier` 状态建议：

- `DRAFT`
- `ACTIVE`
- `SUSPENDED`
- `RETIRED`

说明：

- 第一版不引入 `pending_review` 等审核中状态。
- `DRAFT` 允许前期快速录入且信息不完整。
- `ACTIVE` 表示已进入正常合作视图并可被下游受控引用。

### 6.2 SupplierContact

`SupplierContact` 是 SRM 中的供应商业务联系人对象。

它拥有：

- 联系人在供应商关系中的业务角色
- 与 `Supplier` 的业务关系
- 联系方式与首选沟通渠道
- 是否主联系人
- 可联络状态
- 联系人健康度与离职/失效等业务语义

典型状态建议：

- `ACTIVE`
- `INACTIVE`
- `DO_NOT_CONTACT`
- `ARCHIVED`

典型角色标签建议允许多值：

- `PROCUREMENT`
- `QUALITY`
- `DELIVERY`
- `FINANCE`
- `GENERAL`

处理原则：

- 联系人离职或失效时不物理删除。
- 应变更其状态并保留历史协作引用。
- 如果主联系人失效，应在分析页或供应商概览中显式提示主联系人缺失。

### 6.3 SupplierAnalysisView

`SupplierAnalysisView` 是第一版 SRM 的供应商分析页读模型。

它面向页面返回：

- 时间窗口下的指标汇总
- 趋势
- 整体评分
- 风险分析
- 联系人健康度
- 主要问题与人工补充备注

第一版已确认：

- 风险可以作为分析页的一部分展示，不需要独立出单独页面。
- `performance` 与 `risk` 在第一版优先作为分析视图能力，而不是重写入聚合。
- 时间窗口应支持可调，例如一周、一月、一年、全部。

## 7. 分析页数据来源原则

### 7.1 来源分层

`SupplierAnalysisView` 的数据来源应分成三类：

- SRM 自有事实
  - 供应商状态
  - 联系人状态
  - 主联系人缺失
  - 管理分类
  - 人工风险备注
- 其他业务域拥有的经营事实
  - 采购履约
  - 质量检验
  - 对账协同
  - 外部沟通协作
- SRM 内部的聚合结果
  - 评分
  - 趋势
  - 风险提示
  - 问题摘要

### 7.2 所有权原则

本轮确认：

- 原始业务真相保留在拥有该事实的服务中。
- SRM 不直接拥有采购订单、质检单、发票单或邮件线程原始真相。
- SRM 只消费面向供应商分析的派生结果、事实事件或受控查询结果。
- 前端应优先读取 SRM 的 `SupplierAnalysisView`，而不是在前端直接拼接 Procurement / Quality / Finance 多个服务。

### 7.3 风险与绩效的区分

本轮确认：

- 风险更偏“当前是否需要采取动作”的视图。
- 绩效更偏“某时间窗口内最终表现如何”的视图。
- 第一版产品层面将两者统一展示在供应商分析页中。
- 事件与事实层是否继续细分为风险类和最终绩效类模型，当前保持开放。

## 8. 与其他服务的协同边界

### 8.1 与 `party-service`

`party-service` 拥有主体主数据真相，SRM 拥有供应商业务角色与合作状态真相。

推荐边界：

- `Supplier` 引用 `tenantPartyId` 或受控主体引用结果。
- `SupplierContact` 在需要时可引用 person party。
- 供应商联系人业务角色语义仍归 SRM，不回写到 `party-service`。

### 8.2 与 `permission-service`

- `permission-service` 拥有授权判定真相。
- `srm-service` 提供资源 owner、team、status、visibility facts 等业务事实。
- 不在 controller、DTO、schema 中固化授权真相。

### 8.3 与 `identity-service`

- `identity-service` 提供 operator / account 身份上下文。
- SRM 不拥有账号、登录身份与 operator context 真相。

### 8.4 与 `tenant-org-service`

- `tenant-org-service` 提供组织树、团队归属与 org scope 真相。
- SRM 只消费其组织上下文，不复制组织主模型。

### 8.5 与 `procurement-service`

本轮已确认：

- Procurement 拥有采购单据与履约规则真相。
- 延期天数、短交等采购履约判断应优先由 Procurement 根据自身规则形成，再作为供应商分析输入提供给 SRM。
- SRM 不应反向复制采购履约规则。

### 8.6 与 future quality / inventory / mes domains

- 质量域拥有检验、拒收、批次异常等真相。
- SRM 只消费对供应商分析有意义的质量结果或事件。

### 8.7 与 `communication / mailbox`

- `communication / mailbox` 拥有外部通信线程、共享邮箱责任制与归档真相。
- SRM 拥有这些通信在供应商关系中的业务语义与分析页上的协作摘要。

### 8.8 与 AI

AI 只允许：

- 建议
- 总结
- 风险提示
- 推荐动作
- 辅助分析

AI 不允许：

- 直接写入或修改正式 SRM 主数据
- 绕过应用服务执行状态变更

## 9. 当前后置范围

以下内容当前后置，不进入第一版核心冻结范围：

- `SupplierQualification`
  - 资质清单
  - 准入审核
  - 到期提醒
  - 审核流转
- `SupplierImprovementPlan`
  - 质量 / 交付 / 合规整改闭环
  - 里程碑、复核、关闭逻辑

后续如要推进这些模块，应另开线程继续设计，并回写本工作台或更稳定真相源。

## 10. 开放问题

以下问题本轮保持开放，不强行冻结：

1. SRM 内部分析证据模型的落库方式
   - 是统一 envelope、领域化 facts，还是混合模型，当前待定。
2. 供应商分析页首批必须纳入的指标清单和评分口径
   - 当前只冻结页面方向，不冻结最终指标口径。
3. 其他服务向 SRM 提供分析输入时，优先采用事件、受控查询还是专门分析投影
   - 当前只冻结“原始真相留在拥有服务”这一原则。
4. 风险类信号与最终绩效事实在事件模型上的拆分粒度
   - 当前保持开放。

## 11. 已确认判断

| 日期 | 判断 | 影响范围 |
| --- | --- | --- |
| 2026-04-20 | `srm-service` 应作为独立业务服务设计，不能并入 Procurement。 | bounded context / service boundary |
| 2026-04-20 | 第一版 SRM 应优先冻结 `Supplier`、`SupplierContact` 和 `SupplierAnalysisView`。 | object model / product direction |
| 2026-04-20 | `SupplierQualification` 与 `SupplierImprovementPlan` 当前后置，不进入第一版核心范围。 | scope control |
| 2026-04-20 | `SupplierContact` 是正式核心对象，不作为 `Supplier` 的临时子字段块。 | object boundary |
| 2026-04-20 | 供应商分析页中可统一展示 performance 与 risk。 | analysis page |
| 2026-04-20 | 原始业务事实保留在拥有它们的服务中，SRM 只消费面向供应商分析的派生结果或事件。 | cross-service collaboration |

## 12. References

- [srm-service.md](../../architecture/services/srm-service.md)
- [crm-service-design.md](./crm-service-design.md)
- [party-service.md](../../architecture/services/party-service.md)
- [02-bounded-contexts.md](../../architecture/02-bounded-contexts.md)
- [10-communication-and-mailbox-architecture.md](../../architecture/10-communication-and-mailbox-architecture.md)
