# CRM Service Design

> 涉及 permission-service 的服务职责、核心对象或 owner 边界时，以 [permission-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/permission-service.md) 为准；本文只记录 CRM 设计过程，不能替代服务真相源。

## 1. 文档目的

本文件是 `crm-service` 的设计工作台，用于沉淀当前线程已经确认的 CRM 边界、协同关系、核心对象与阶段性结论。

当前文档的定位是：

- 冻结 CRM 的设计方向与职责边界。
- 作为后续继续讨论或回写 architecture / collaboration / feature packet 的恢复入口。
- 明确哪些设计已经确认，哪些问题仍保持开放。

当前文档明确不负责：

- 直接进入实现细节、数据库 schema 或代码目录级实现计划。
- 直接替代 `docs/architecture/services/*.md` 的稳定职责真相。
- 直接替代 `docs/architecture/collaborations/*.md` 的跨服务协同真相。
- 直接替代 `docs/contracts/**` 的契约正文。

## 2. 当前设计范围

本轮 CRM 设计已经覆盖：

- CRM 在 OES 中的正式 bounded context 定位。
- CRM 与 `party-service`、`permission-service`、`identity-service`、`tenant-org-service`、`communication / mailbox`、`ERP.sales` 的边界。
- CRM 的多渠道入口模型，包括被动进入、主动开发与批量导入能力。
- CRM 的核心对象模型：
  - `Intake`
  - `ProspectingTarget`
  - `Lead`
  - `Account`
  - `Contact`
  - `Opportunity`
  - `Activity`
  - `Matching / Dedup`
  - `Assignment / Collaboration`
- Browser Prospecting 在 CRM 中的归属位置。

本轮刻意不继续冻结：

- gRPC / HTTP 契约字段细节。
- 正式 Prisma schema、表结构与索引。
- feature packet 拆分后的执行顺序与工时。
- `Opportunity` 细阶段枚举是否按行业进一步细化。
- `Contact` 与 person party 的具体绑定流程细节。

## 3. CRM 的正式定位

### 3.1 领域定位

`crm-service` 是 OES 的客户关系与销售推进真相服务，负责回答：

- 我们正在面向哪些客户 / 潜在客户开展销售？
- 这些客户关系当前处于什么状态？
- 当前有哪些正式线索需要跟进？
- 哪些客户联系人、商机和销售动作正在推进？
- 下一步应该由谁继续跟进？

它不是：

- 浏览器插件后端服务
- 主体主数据服务
- 邮件/电话/表单基础设施服务
- 消息投递平台
- 正式报价或订单真相服务

### 3.2 推荐边界口径

本轮确认的口径是：

- CRM 采用“广义销售 CRM”边界。
- CRM 覆盖从客户进入销售视野，到线索管理、客户关系、联系人、商机、销售活动与归属协同的完整前台销售链路。
- CRM 不跨界拥有主体主数据、权限真相、通信基础设施、正式报价与订单真相。

## 4. CRM 拥有与不拥有的内容

### 4.1 CRM Owns

- 多渠道客户进入销售流程的业务入口与状态：
  - `intake`
  - `prospecting`
- 正式销售线索：
  - `lead`
- 客户关系对象：
  - `account`
  - `contact`
- 销售推进对象：
  - `opportunity`
- 销售活动语义：
  - `activity`
- CRM 资源的归属、协同与可见性业务事实：
  - `owner`
  - `ownerTeam`
  - `assignment`
  - `handoff`
  - `collaboration state`
- CRM 侧匹配与去重治理能力：
  - lead / account / contact / party binding candidate matching
- CRM 自身的审计责任：
  - 关键状态变更
  - 操作者
  - 跟进动作
  - 分配与移交
  - 转化与关闭

### 4.2 CRM Does Not Own

- `party-service` 的主体主数据、核心对象、地址 / 联系人正文与 owner 边界；以 [party-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/party-service.md) 为准
- 认证、会话、令牌：
  - `auth-service`
- 身份映射与 operator context 真相：
  - `identity-service`
- 角色、权限、scope、policy 与授权判定真相：
  - `permission-service`
- 组织树、部门、小组真相：
  - `tenant-org-service`
- 正式人员任职与成员归属：
  - [hr-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/hr-service.md)
- 邮件线程、共享邮箱工作台、原始通信归档：
  - `communication / mailbox`
- 正式报价、订单与销售履约真相：
  - `ERP.sales`
- AI 执行写入：
  - AI 只允许建议、总结、工具辅助，不直接写业务主数据

## 5. 设计原则

- 插件、BFF、表单、邮件、电话、展会等入口都不能反向定义 CRM 主模型。
- `Account` 是 CRM 的客户关系对象，不等于主体主数据。
- `Opportunity` 是具体销售机会，不等于正式报价。
- `Intake` 和 `Lead` 必须分离，不能只靠 `sourceType` 混在一个对象里。
- `Import` 是 CRM 的入口能力，不是一级核心领域对象。
- `Activity` 拥有销售动作语义，但不拥有通信基础设施真相。
- `Opportunity` 必须绑定 `Account`，不能漂浮存在。
- 每个 CRM 资源都必须在本服务内承担自己的审计责任。

## 6. 多渠道入口模型

CRM 前置入口正式分成两类：

- `Intake`
  - 被动进入的客户接触入口。
- `Prospecting`
  - 主动开发的客户研究入口。

### 6.1 Intake

`Intake` 代表被动进入销售视野的原始业务记录。

典型来源包括：

- 官网表单 / 自建站询盘
- 展会线索
- 电话咨询
- 邮箱来信转入
- 转介绍 / 朋友介绍
- 渠道商 / 合作伙伴转介
- 名单导入
- 第三方渠道导入

`Intake` 回答的是：

- 这条进入记录是什么？
- 它从哪里来？
- 是否值得进入正式销售处理？
- 应该转成 `Lead`、挂到已有客户，还是被拒绝/归档？

### 6.2 Prospecting

`Prospecting` 代表主动开发与前置研究。

典型来源包括：

- 浏览器插件网页开发
- 人工公网研究
- 行业名单筛选
- 同行客户/公开目标挖掘
- 销售手工研究记录

`Prospecting` 回答的是：

- 这个研究目标值不值得继续投入？
- 已经积累了哪些研究事实、联系人线索和判断？
- 什么时候应进入正式 `Lead`？

### 6.3 Import Capability

批量导入是 CRM 的正式入口能力，但不是一级领域对象。

它可以服务于：

- 批量导入 `Intake`
- 在规则明确时导入 `Lead`
- 批量补录到已有 `Account / Contact`

它不应默认支持：

- 批量直接创建 `Opportunity`

实现层可能会出现导入任务与逐行校验记录，但这些属于能力实现支撑，不提升为 CRM 核心主模型。

## 7. CRM 核心对象

### 7.1 Intake

`Intake` 是被动进入的原始客户接触对象。

典型状态建议：

- `NEW`
- `TRIAGED`
- `QUALIFIED`
- `REJECTED`
- `CONVERTED`
- `ARCHIVED`

### 7.2 ProspectingTarget

`ProspectingTarget` 是主动开发中的研究目标。

典型状态建议：

- `OPEN`
- `IN_RESEARCH`
- `READY_FOR_LEAD`
- `LOW_VALUE`
- `DISQUALIFIED`
- `CLOSED`

### 7.3 Lead

`Lead` 是正式进入销售处理流程的线索对象。

典型状态建议：

- `OPEN`
- `QUALIFYING`
- `NURTURING`
- `QUALIFIED`
- `DISQUALIFIED`
- `CONVERTED`
- `ARCHIVED`

### 7.4 Account

`Account` 是 CRM 中的客户账户，也就是销售关系下的 `customer profile / customer account`。

它不等于 `party-service` 的主体主数据。更准确地说：

- `party-service` 回答“这个主体是谁”
- `crm-service.account` 回答“这个主体在销售关系里是什么状态”

`Account` 应拥有的典型信息包括：

- owner / team
- source summary
- segment / tier
- relationship stage
- tags
- latest touchpoint
- risk / competitor note
- open leads / opportunities summary
- `tenantPartyId` 绑定结果，若已绑定

本轮确认的 `Account` 状态建议：

- `PROSPECT`
- `ACTIVE_CUSTOMER`
- `DORMANT`
- `BLOCKED`
- `ARCHIVED`

说明：

- `PROSPECT` 表示潜在客户账户，允许信息不完整。
- `ACTIVE_CUSTOMER` 表示已经进入稳定合作/交易关系的客户账户。

### 7.5 Contact

`Contact` 是 CRM 中的业务联系人对象。

它拥有：

- 联系人在销售关系中的角色
- 与 `Account` 的业务关系
- 联系偏好
- 可联络状态
- 是否关键人 / 决策人 / 影响人

典型状态建议：

- `ACTIVE`
- `INACTIVE`
- `DO_NOT_CONTACT`
- `ARCHIVED`

典型角色标签建议允许多值：

- `DECISION_MAKER`
- `INFLUENCER`
- `CHAMPION`
- `EXECUTOR`
- `PROCUREMENT`
- `TECHNICAL`

### 7.6 Opportunity

`Opportunity` 是一笔已经被销售确认、值得推进、并且有潜在成交价值的具体销售机会。

本轮已确认：

- `Opportunity` 以手动创建为主。
- 系统可以建议创建，但不应自动创建。
- `Opportunity` 必须绑定一个 `Account`。
- `Opportunity` 不拥有正式报价真相，报价归 `ERP.sales`。

典型状态建议按销售阶段表达，而不是简单 open / close：

- `IDENTIFIED`
- `DISCOVERY`
- `SOLUTION_FIT`
- `QUOTING_READY`
- `NEGOTIATING`
- `WON`
- `LOST`
- `ON_HOLD`

### 7.7 Activity

`Activity` 是 CRM 中的销售动作与互动语义对象。

它应覆盖的活动类型至少包括：

- `CALL`
- `MEETING`
- `VISIT`
- `NOTE`
- `TASK`
- `EMAIL`
- `MESSAGE`
- `STATUS_CHANGE`
- `ASSIGNMENT_CHANGE`

其中 `EMAIL` 应纳入 `Activity`，但边界是：

- CRM 记录邮件在销售流程中的业务语义、摘要和关联关系。
- 原始邮件正文、线程、附件、收发过程、共享邮箱责任制不归 CRM，仍归 `communication / mailbox`。

### 7.8 Matching / Dedup

`Matching / Dedup` 是 CRM 的正式横切能力，不是可有可无的实现细节。

至少应覆盖：

- 同公司重复线索检测
- 同邮箱 / 手机号联系人检测
- `Lead` 与已有 `Account` 的候选匹配
- 导入名单逐行候选匹配
- 转 lead / 转 account 时的重复提示
- 与 `tenantPartyId` 的候选绑定

### 7.9 Assignment / Collaboration

`Assignment / Collaboration` 是 CRM 的归属与协同能力。

它提供的业务事实包括：

- owner
- ownerTeam
- handoff
- collaboration state
- follow-up responsibility
- shared visibility facts

它不是权限服务，但它是权限判定所需业务事实的重要来源。

## 8. 核心转换关系

本轮确认的主要转换路径如下：

- `Intake -> Lead`
  - 当被动进入记录被确认值得正式销售处理。
- `ProspectingTarget -> Lead`
  - 当研究目标已具备形成正式线索的条件。
- `Lead -> Account`
  - 当销售需要建立稳定客户关系档案。
- `Lead -> Contact`
  - 当销售识别出明确联系人。
- `Account -> Opportunity`
  - 由销售手动创建。

本轮明确不建议：

- `Lead` 自动创建 `Opportunity`
- `Opportunity` 不绑定 `Account`
- 批量导入默认直接创建 `Opportunity`

当前推荐约束：

- `Lead` 可以独立存在。
- `Account` 可以先以最小信息存在。
- `Opportunity` 必须绑定 `Account`。
- `Contact` 推荐绑定，但不要求在最早时点绝对完整。

## 9. 与其他服务的协同边界

### 9.1 与 `party-service`

`party-service` 拥有主体主数据真相，CRM 拥有业务角色与关系状态真相。

推荐边界：

- `Intake / Prospecting / Lead` 阶段允许先不绑定 `tenantPartyId`。
- `Account` 稳定建立后，再进入主体匹配 / 绑定流程。
- `Account` 通常引用一个 `tenantPartyId`。
- `Contact` 可以在需要时引用 person party，但联系人角色语义仍归 CRM。

### 9.2 与 `permission-service`

- `permission-service` 拥有授权判定真相。
- `crm-service` 提供资源 owner、team、status、visibility facts 等业务事实。
- 不在 controller、DTO、schema 中固化授权真相。

### 9.3 与 `identity-service`

- `identity-service` 提供 operator / account 身份上下文。
- CRM 不拥有账号、登录身份与 operator context 真相。

### 9.4 与 `tenant-org-service`

- `tenant-org-service` 的 `Tenant / OrgUnit / org tree / org reference validation` 边界以 [tenant-org-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/tenant-org-service.md) 为准。
- CRM 只消费组织引用与组织结构上下文，不复制组织主模型，也不把人员任职派生的 org scope 或团队归属真相写入 CRM；正式任职口径以 [hr-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/hr-service.md) 为准。

### 9.5 与 `communication / mailbox`

- `communication / mailbox` 拥有邮件线程、消息归档、共享邮箱责任制与外部沟通过程管理。
- CRM 拥有这些通信在销售关系中的业务语义与关联关系。
- CRM 可以有 `EMAIL` 类型 `Activity`，但不拥有原始通信系统真相。

### 9.6 与 `ERP.sales`

本轮已确认：

- 正式报价归 `ERP.sales`。
- CRM 到 `Opportunity` 为止。
- CRM 拥有售前商业推进上下文，不拥有正式报价或订单真相。

### 9.7 与 AI

AI 只允许：

- 建议
- 总结
- 推荐动作
- 辅助匹配
- 工具型协同

AI 不允许：

- 直接写入或修改正式 CRM 主数据
- 绕过应用服务执行状态变更

AI 协同定位为后置增强，不作为当前 CRM 真相边界的一部分。

### 9.8 与审计能力

每个业务服务都必须自己承担本服务的审计责任。

对于 CRM 来说，这意味着：

- lead / account / contact / opportunity / assignment / conversion / import 等关键动作必须在 `crm-service` 内可追踪。
- 如果未来存在集中审计能力，它也只是集中检索或归档，不替代 CRM 本服务的审计真相拥有责任。

## 10. Browser Prospecting 在 CRM 中的位置

Browser Prospecting 只是 CRM 的一个前端入口，不是 CRM 的设计中心。

当前确认的边界是：

- 浏览器插件只是 `prospecting` 的一个 adapter。
- 插件只通过 BFF / Gateway 进入，不直接定义 CRM 主模型。
- `ResearchTarget / ContactClue / LeadDraft` 不能直接等同 `Account / Contact / Lead`。
- 浏览器插件背后的 durable business facts 应归属于 CRM 的 `prospecting` slice，而不是长期留在 BFF。

### 10.1 当前已冻结的 Prospecting 第一阶段对象

为支撑 Browser Prospecting 第一阶段，当前仍保留以下最小对象方向：

- `ResearchTarget`
- `ResearchTargetRelation`
- `ResearchEvent`
- `ResearchFact`
- `ContactClue`
- `LeadDraft`

这些对象当前仍是：

- `prospecting` slice 的一阶段对象
- Prospecting 到正式 CRM 的防腐层

它们当前明确不等于：

- formal `Lead`
- formal `Account`
- formal `Contact`
- formal `Opportunity`

### 10.2 当前仍适用的 Prospecting 约束

当前仍保留以下判断：

- Browser Prospecting 第一阶段如需持久化，优先落在 future `crm-service` 的 `prospecting` slice。
- `LeadDraft -> CRM Lead` 暂时仍只保留为交接点，不在本轮冻结正式契约。
- 浏览器 workspace 连续性状态不应污染 CRM durable truth。

## 11. 已确认判断

| 日期 | 判断 | 影响范围 |
| --- | --- | --- |
| 2026-04-18 | CRM 是核心业务域，不应由插件或 BFF 反向定义正式主模型。 | CRM boundary / plugin boundary |
| 2026-04-18 | Browser Prospecting 的 `ResearchTarget / ContactClue / LeadDraft` 不能直接等同 CRM `Account / Contact / Lead`。 | prospecting handoff |
| 2026-04-18 | Browser Prospecting 第一阶段如需后端持久化，优先考虑 future `crm-service` 内部 `prospecting` 模块。 | backend ownership |
| 2026-04-19 | CRM 应从 OES 全局视角设计，不以浏览器插件需求为核心边界。 | CRM service scope |
| 2026-04-19 | CRM 应支持多渠道客户进入，不只覆盖浏览器网页开发。 | channel model |
| 2026-04-19 | CRM 前置入口正式分为 `Intake` 与 `Prospecting` 两类。 | upstream model |
| 2026-04-19 | `Account` 是 CRM 中的客户关系对象，不等于 `party-service` 主体主数据。 | party / CRM boundary |
| 2026-04-19 | `Import` 是 CRM 入口能力，不是一级核心领域对象。 | module boundary |
| 2026-04-19 | `Opportunity` 以手动创建为主，并且必须绑定 `Account`。 | sales pipeline model |
| 2026-04-19 | 正式报价归 `ERP.sales`，CRM 不拥有正式报价真相。 | ERP boundary |
| 2026-04-19 | `Email` 应进入 `Activity`，但 CRM 不拥有原始通信真相。 | communication boundary |
| 2026-04-19 | 每个服务都必须自行承担自己的审计责任，CRM 不外包审计真相。 | audit model |
| 2026-04-19 | AI 只做建议、总结、工具辅助，后置协同，不直接写入业务数据。 | AI boundary |

## 12. 当前开放问题

以下问题当前保留开放，但不阻塞本轮设计边界：

- `Intake` 是否还需要继续细分子类型。
- `Contact` 与 person party 的具体绑定时机与治理流程。
- `Opportunity` 阶段枚举是否需要按行业场景进一步定制。
- `Activity` 中 `TASK` 是否长期内聚在 CRM，还是未来拆到更通用的任务能力。
- 批量导入默认入 `Intake`，还是允许部分高质量来源直接入 `Lead`。

## 13. 回写目标

本工作台后续应回写到以下真相源：

- 服务职责：
  - `docs/architecture/services/crm-service.md`
- 协同蓝图：
  - `crm-and-party-binding`
  - `crm-and-communication`
  - `crm-and-authorization`
  - `crm-to-erp-sales-handoff`
- 后续 feature packet：
  - `crm-intake-foundation`
  - `crm-prospecting-foundation`
  - `crm-lead-management-foundation`
  - `crm-account-contact-foundation`
  - `crm-opportunity-foundation`

## 14. 恢复入口

后续若重新开启 CRM 设计，优先从以下文档恢复：

- [crm-service-design.md](/Users/acehood/Documents/GitHub/oes/docs/plans/designs/crm-service-design.md)
- [crm-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/crm-service.md)
- [browser-prospecting-workspace.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/api-gateway/browser-prospecting-workspace.md)
- [party-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/party-service.md)
- [10-communication-and-mailbox-architecture.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/10-communication-and-mailbox-architecture.md)
- [ADR 0003: Party Master Service And Tenant Party Binding](/Users/acehood/Documents/GitHub/oes/docs/adr/0003-party-master-service-and-tenant-party-binding.md)

当前线程在此停留，不继续推进实现细节。
