# OES Deferred Backlog

更新时间：2026-04-20

本文档只用于记录两类内容：

- 已确认后置的事项
- 从活跃 feature 派生，但当前不进入主线处理的 sidecar / unrelated work

它不是灵感池，不是候选功能池，也不是当前活跃 feature 的阻塞面板。

## 1. 归位规则

以下内容不再写入本文件：

- 灵感 -> `docs/plans/ideas.md`
- 候选功能 / 候选设计 -> `docs/plans/candidates.md`
- 当前活跃 feature 的 blocker -> 对应 `docs/plans/features/<feature-key>.md`

只有明确“不是现在做”的事项，才进入本文档。

## 1.1 分类规则

为避免 backlog 失去可读性与治理价值，所有条目必须先分类，再写入本文档。

默认分类如下：

- `Platform Deferred`
  - 跨服务的平台基础能力、平台化能力、治理能力
- `Product Deferred`
  - 明确有价值但当前不进入主线的产品能力
- `Operational Deferred`
  - 生产化、运营化、可观测性、安全分析类后置项
- `Extraction Deferred`
  - 当前已有样板，但尚不适合立即抽象成共享模型或共享模块的事项
- `Sidecar Work`
  - 从活跃 feature 派生，但当前不进入主线的问题或无关工作

不允许：

- 把所有后置事项混在同一张未分类列表中
- 用 `Deferred Work` 作为唯一分类长期承载所有条目
- 在未判断分类的情况下直接写入 backlog
- 在未做重复检查的情况下直接写入 backlog

## 2. Backlog Thread 工作方式

可以单独开启一个 backlog thread，专门处理本文档中的条目。

该线程不直接实现代码，默认职责是：

- 对新条目先给出归位建议
- 统计当前 backlog 状态
- 与用户确认哪些事项应继续后置
- 将后置任务推进为可执行计划
- 将 sidecar work 迁回对应 feature packet 或升级为独立 plan

### 2.1 标准输出格式

每次 backlog thread 开始工作时，应先输出当前概览：

```text
Backlog 概览
- Platform Deferred：N 个
- Product Deferred：N 个
- Operational Deferred：N 个
- Extraction Deferred：N 个
- Sidecar Work：N 个

本次建议处理：
- 可继续后置：...
- 已到触发条件：...
- 可合并更新原条目：...
- 可迁出到 feature packet：...
```

处理单个条目时，应使用以下格式：

```text
条目：<名称>
分类：Deferred Work / Sidecar Work
当前判断：...
触发条件：...
建议下一步：继续后置 / 迁出到 feature packet / 升级为正式 plan
目标落点：...
```

### 2.2 条目推进规则

- `Deferred Work` 到达触发条件后，必须重新评估，不自动进入实现
- `Sidecar Work` 如果开始影响当前活跃 feature，应迁回对应 feature packet
- 已迁出到正式文档的条目，应在本文件中标记迁出目标，而不是无痕删除

### 2.3 新条目确认规则

当用户提出新的后置事项或派生事项时，不应立即写入本文件。

线程应先给出简短建议：

```text
收到内容：...
建议分类：Deferred Work / Sidecar Work / 应迁入 ideas / 应迁入 candidates / 应回到 feature packet
我认为有价值的部分：...
当前是否属于主线阻塞：是 / 否
建议目标落点：...
等待用户确认：是 / 否 / 调整后再记
```

只有在用户确认后，才写入本文档。

### 2.4 重复检查规则

为避免 backlog 逐步失真，所有线程在写入新条目前必须先做重复检查。

执行要求：

- 先检查 backlog 中是否已经存在同一事项或高度相似事项
- 如已存在，应优先更新原条目的：
  - 当前判断
  - 触发条件 / 后续处理
  - 目标落点
- 不得仅因表述不同而新增重复条目

可视为“同一事项”的典型情况：

- 同一能力的不同说法
- 同一平台化任务拆成多个重复标题，但触发条件与目标一致
- 同一后置事项在不同线程被重复登记

## 3. Platform Deferred

| 时间 | 后置事项 | 分类 | 当前判断 | 后续处理 |
|---|---|---|---|---|
| 2026-04-14 | `DecisionEvent` 查询与统一模型 | Platform Deferred | 当前系统服务管理审计已完成对齐，但授权判定轨迹 `DecisionEvent` 与管理变更审计 `AuditEvent` 的使用场景、量级与权限边界不同。当前阶段目标仍是先搭稳基础设施并启动业务服务开发，不适合继续扩展判定审计查询能力。 | 到达触发条件后重新评估并拆成独立 plan：1. 核心业务服务已开始推进；2. 出现明确“为什么被允许 / 拒绝”的跨服务排障或安全分析需求；3. 确认 `DecisionEvent` 的 retention、查询权限与查询入口设计。 |
| 2026-04-14 | 审计平台化：`audit-service`、审计事件汇聚 `outbox / ingestion`、平台级全局 `audit query` | Platform Deferred | 当前 `identity-service`、`auth-service`、`permission-service` 已完成单服务 audit 样板与本地真相源，对框架阶段已足够。继续推进平台级汇聚会明显抬高复杂度，并分散业务服务启动阶段的注意力。 | 到达触发条件后重新评估并升级为正式 plan：1. 至少两个以上业务服务已产生稳定审计数据；2. 出现跨服务统一审计检索需求；3. 确认中央审计存储、查询权限与数据生命周期策略。 |
| 2026-04-14 | 事件总线级 trace propagation | Platform Deferred | 当前已完成 HTTP / gRPC tracing 基线，但异步事件链路追踪仍不属于当前主线。过早进入实现会增加框架复杂度，而当前业务服务与事件总线链路尚未正式展开。 | 到达触发条件后重新评估：1. 事件总线或 outbox 正式进入实现；2. 新业务服务开始接入异步链路；3. 确认 trace metadata 在事件载体中的传播策略。 |
| 2026-04-14 | Access Summary 的 tenant feature / plugin enablement 过滤 | Platform Deferred | 已永久后置。当前系统暂不继续向租户级模块化或插件启用模型演进，`auth-bff` 与 `permission-service` 的 access summary / navigation 主链只保留 roles、actionCodes、role navigation 与 policy 相关授权语义。 | 不再作为当前路线图候选推进。若未来重新考虑租户级模块化，必须先新增 architecture / ADR 反转当前决策，再重评估 access-summary、navigation 与权限码过滤边界。 |
| 2026-04-14 | 历史 `CheckPermissionWithContext` deprecated 兼容链路清理 | Platform Deferred | 当前历史兼容链路仍保留，是为了避免在权限治理主线尚未彻底收口时误删调用方。它已经不应再被新能力复用，但直接删除前仍需完成调用面审查和契约迁移。 | 到达触发条件后按治理步骤迁出到独立 cleanup plan：1. 确认无真实业务调用方；2. 明确 proto / controller no-new-callers 策略；3. 删除兼容 RPC、controller method、query、handler、domain compatibility method 与对应测试。 |
| 2026-04-19 | `Tenant` owner 从 `identity-service` 迁移到 `tenant-org-service` | Platform Deferred | `tenant-org-service` 的目标职责是统一管理 tenant boundary 与 tenant 内部 org 结构；现有 `identity-service` 已承载 tenant / account context 实现，当前先完成 `tenant-org-service` 的服务设计，再启动 tenant owner 迁移，避免在设计未冻结前直接改实现。目标态由 `tenant-org-service` 承接 tenant boundary 真相，`identity-service` 保留 account 到 tenant 的引用与上下文聚合能力。 | 到达触发条件后重新评估并拆成 ADR / migration plan：1. `tenant-org-service` 服务设计已冻结；2. tenant boundary、org model 与 contracts 已明确；3. 梳理 `identity-service` 中 `Tenant` schema、`GetTenantById`、account context 与 BFF 聚合调用面；4. 明确数据迁移、兼容查询、事件发布与回滚策略。 |

## 4. Product Deferred

| 时间 | 后置事项 | 分类 | 当前判断 | 后续处理 |
|---|---|---|---|---|
| 2026-04-12 | 登录周边能力：二维码登录、找回密码、自助注册、第三方登录 | Product Deferred | 当前认证主链已足够支撑 `tenant-web` 继续推进登录、上下文、Dashboard、登出、权限摘要和自助安全页面；但二维码登录、找回密码、自助注册、第三方登录均不属于当前阶段可执行能力。它们不是单纯前端页面问题，必须区分产品决策、BFF 契约、下游服务能力、前端交互与安全验收。当前前端只允许保留受控占位入口，不得伪造可执行流程。 | 到达触发条件后重新评估并拆成独立 plan / contracts：1. 产品确认该能力进入当前阶段；2. BFF 黑盒契约冻结；3. auth / identity / notification / third-party provider 等下游能力明确；4. 前端再移除占位页并接入真实流程。 |
| 2026-04-13 | 管理员用户检索与租户选择器：按邮箱 / 手机 / 用户名搜索目标用户，以及系统管理员可视化租户选择器 | Product Deferred | 当前“认证与会话管理”页面已经可用，但管理员目标用户定位仍依赖审计事件中的 `operatorId` 或手动输入 `userId`，系统管理员租户筛选仍为 `tenantId` 文本输入。这两个能力都需要新的 BFF 黑盒契约，前端不能直接绕过 BFF 消费内部 `identity-service` 能力。 | 到达触发条件后重新评估并拆成独立 contracts / plan：1. 确认管理员需要更友好的用户检索与租户筛选体验；2. BFF 暴露管理员用户搜索接口；3. BFF 暴露租户目录或租户搜索接口；4. 前端再将文本输入升级为搜索选择器。 |
| 2026-04-13 | Access token refresh 浏览器端专项联调 | Product Deferred | 前端已具备 refresh 代码路径，但当前业务页面覆盖仍有限，且该专项不应为测试目的新增临时页面或按钮。 | 等更多正式鉴权页面稳定接入后，再以浏览器级联调或 E2E 用例完成专项验证。 |
| 2026-04-14 | 机器身份管理组的 BFF / Gateway 对外接口冻结 | Product Deferred | 当前 `identity-service` 下游机器身份能力已经较稳定，但仍缺少明确前端页面或外部消费场景。提前冻结对外 HTTP 契约会让 BFF 暴露语义不稳定的管理面。 | 到达触发条件后重新评估并拆成独立 feature / contracts：1. 确认真实使用人和入口端；2. 冻结页面场景与权限语义；3. 再决定 BFF 还是管理型 Gateway 入口，并补黑盒 contract。 |
| 2026-04-15 | 所有用户账户安全中的登录历史页面 | Product Deferred | 当前已确认先推进“管理员会话管理”主线，不把“登录历史页面”混入同一个 feature。登录历史页面需要单独冻结查询口径：是否覆盖成功与失败登录、是否按 session 事件还是 audit 事件建模、IP 归属地解析放在哪里、以及是否与异常登录通知联动。现阶段继续推进会把会话管理页、审计历史页与安全通知边界混在一起。 | 到达触发条件后重新评估并拆成独立 feature design / contracts：1. 当前管理员会话管理主线闭环；2. 明确登录历史的数据真相源是 session、audit 还是混合视图；3. 明确查询字段、保留时长与通知联动边界；4. 再决定是否拆成“登录历史”“异常登录提示”“账号安全通知”多个子 feature。 |
| 2026-04-17 | 自助登录历史二期：`OTP` 失败登录归属补齐 | Product Deferred | 当前自助登录历史已完成第一阶段闭环，并且明确采用 `user` 级登录尝试历史；但目前只对邮箱 / 手机密码失败登录补齐 `userId` 归属，邮箱 / 手机 `OTP` 失败链路仍未进入同等语义。继续在当前主线扩张会把已闭环的一期功能再次拉宽。 | 到达触发条件后再迁出到独立 feature packet：1. 需要把 `EMAIL_OTP / PHONE_OTP` 失败记录纳入同一自助登录历史；2. 明确 OTP 失败时的用户解析与风控语义；3. 保证失败审计归属与前端展示口径一致。 |
| 2026-04-19 | 管理员租户管理：系统管理员手动创建租户 | Product Deferred | 该能力有明确产品价值，但不是当前 role-management 主线。租户创建不是单纯表单，需要先冻结归属服务、创建字段、初始化组织 / 默认管理员账号 / 默认角色绑定、审计与权限边界。 | 到达触发条件后拆成独立 feature / contracts：1. 确认系统管理员租户管理入口；2. 冻结 identity-service tenant management 写契约；3. 明确是否同步创建初始组织、租户管理员账号与角色绑定；4. 明确审计、幂等、重复 code/name 校验与失败回滚策略。 |
| 2026-04-20 | 严格型登录 MFA：排除与主登录同类因子的二次验证复用 | Product Deferred | 当前登录场景 MFA V1 已冻结为“务实型”，允许主登录与二次验证暂时复用同类 OTP 因子，以先打通租户级策略、priority 排序与登录续流编排。严格型的价值明确，但不应在当前主线里把 challenge 编排和策略模型一并拉重。 | 到达触发条件后拆成独立 feature 增强或当前 packet 的 V1B：1. 登录场景 MFA 续流稳定落地；2. 产品确认需要更高强度的第二因子独立性；3. 基于现有 `challenge` 上下文增加 `primaryFactorFamily` 过滤规则；4. 补充契约、测试与前端提示。 |
| 2026-04-20 | `Policy Explain / Impact Preview` 管理面 | Product Deferred | 当前权限控制产品面已推进到 `Policy Governance Readonly`，管理员已可只读查看 policy 事实；但 `Policy Explain / Impact Preview` 仍未开始。Explain 需要显式构造 subject / resource / environment 上下文，并明确输入表单、结果解释、影响范围与审计边界，不应被混入当前已完成的只读治理页。 | 到达触发条件后拆成独立 feature / contracts：1. 当前只读治理页稳定运行；2. 明确 explain 输入模型与 operator 权限边界；3. 明确 impact preview 是否只读、是否允许批量分析；4. 再冻结 Gateway contract 与 tenant-web 管理面。 |

## 5. Operational Deferred

| 时间 | 后置事项 | 分类 | 当前判断 | 后续处理 |
|---|---|---|---|---|
| 2026-04-14 | 审计搜索与分析增强：`OpenSearch / Elastic` 审计副本检索 | Operational Deferred | 当前 audit 真相源已用各服务本地 `PostgreSQL` 样板承载，框架阶段先不引入额外搜索基础设施。现阶段审计目标是保证模型正确与可演进，而不是先做集中检索或安全分析平台。 | 到达触发条件后重新评估并拆成独立 plan：1. 平台级 audit query 已立项或落地；2. 审计检索、聚合分析或安全运营需求明确；3. 确认副本同步链路与索引策略。 |
| 2026-04-14 | `metrics` 实现与生产级 logging 治理：`retention / dashboard / alerting` | Operational Deferred | 当前 observability 目标已明确为“生产可演进的最小可用基线”，并已完成本地 `tracing / logging / audit` 样板闭环。`metrics` 与 logging 生产治理都属于生产运营阶段工作，当前框架期不需要投入完整实现。 | 到达触发条件后重新评估并拆成独立 plan：1. 平台开始进入稳定运行与运营观测阶段；2. 需要正式保留策略、看板与告警；3. 团队确认 metrics 指标集与生产日志治理边界。 |

## 6. Extraction Deferred

| 时间 | 后置事项 | 分类 | 当前判断 | 后续处理 |
|---|---|---|---|---|
| 2026-04-14 | 共享 `audit query` model 抽取 | Extraction Deferred | 当前已完成三个单服务 `audit query` 样板，但当前业务服务尚未展开，过早抽象会增加框架复杂度。此项应在更多业务服务和查询样板出现后，再做稳定共性提炼。 | 到达触发条件后重新评估：1. 新业务服务开始接入审计查询；2. 至少再出现一批稳定样板；3. 能明确区分平台共性与服务特定过滤/读模型。 |
| 2026-04-14 | `CheckResourceService` 更通用统一入口设计 | Extraction Deferred | 当前 `checkResource` 首批试点已经证明模式可行，但接口形态仍保留试点期的分散样板。现在就抽象成统一入口，容易在资源语义、入参形状、错误模型尚未完全稳定时过度设计。 | 到达触发条件后重新评估：1. 至少再出现一批稳定业务样板；2. 多个服务确认存在重复的资源检查编排；3. 能清楚区分平台共性与服务特定资源语义。 |
| 2026-04-14 | detail query 的最小授权快照 / 预检查优化 | Extraction Deferred | 当前 detail query 采用“先加载资源，再执行 `checkResource`”的顺序，语义清晰且已被当前试点接受。进一步引入最小授权快照或 repo 前预检查，需要稳定的资源索引、判定成本模型与统一抽象，否则容易变成过早优化。 | 到达触发条件后重新评估：1. Gateway 联调或生产化验证显示真实性能压力；2. 至少两类 detail query 都证明存在重复授权前置需求；3. 能明确快照来源、缓存边界与失效策略。 |

## 7. Sidecar Work

| 时间 | 条目 | 分类 | 来源 | 当前判断 | 后续处理 |
|---|---|---|---|---|---|
| 2026-04-14 | `permission-management` contract 文档补充请求 / 响应示例、错误处理建议、刷新 / 回填策略 | Sidecar Work | `authorization-layering-implementation-plan.md` / `docs/contracts/api-gateway/permission-management.md` | 当前 `permission / role / role-template / account-role` 接口 contract 已达到“前端可按页面接入”的完成态，继续补示例和更细的交互说明有价值，但不再属于本轮权限管理主线收口。 | 当新的前端对接线程开始，或出现具体页面实现阻塞时，再迁回对应 feature packet 或升级为独立文档增强任务。 |

## 8. 使用约束

- 本文件不能直接作为实现依据
- 当前活跃 feature 的 blocker 不得写入本文件
- 如果某条内容已经提升为正式 plan / feature packet，应在本文档中标记迁出目标
