# Personal Center

## 1. 目标

- 为登录后的用户提供一个统一的“个人中心”入口页。
- 在一个页面内清晰区分 `user` 级信息与 `account` 级信息，避免身份语义混淆。
- 让用户能够快速理解：
  - 我这个 `user` 是谁
  - 我当前正以哪个 `account` 在哪个租户 / scope 下工作
  - 当前 `account` 拥有哪些角色
  - 我可以去哪里管理安全相关能力
- 第一阶段先建立稳定的信息架构与入口聚合，不把复杂的绑定 / 验证流程硬塞进单页。

## 2. 不做什么

- 不在第一阶段直接承接登录邮箱 / 登录手机号 / 第三方登录方式的绑定与解绑流程。
- 不在第一阶段直接修改企业下发的工作邮箱、工作手机号或当前 `account` 角色。
- 不把顶部全局偏好设置面板简单复制到个人中心中。
- 不在第一阶段发明新的安全后端能力；安全能力优先复用现有会话管理、MFA 与恢复码入口。
- 不混淆 `user` 级登录身份信息与 `account` 级工作身份信息。

## 3. 上游依赖

- architecture:
  - [16-unified-web-account-context-architecture.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/16-unified-web-account-context-architecture.md)
  - [11-gateway-and-bff-architecture.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/11-gateway-and-bff-architecture.md)
- services:
  - [auth-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/auth-service.md)
  - [entity-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/entity-service.md)
- collaborations:
  - [account-context-switch.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/collaborations/account-context-switch.md)
- contracts:
  - [auth-bff-login.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/api-gateway/auth-bff-login.md)
  - [access-summary.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/api-gateway/access-summary.md)
  - [auth-bff-self-service.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/api-gateway/auth-bff-self-service.md)
- adr:
  - [0001-unified-web-scope-aware-user-account.md](/Users/acehood/Documents/GitHub/oes/docs/adr/0001-unified-web-scope-aware-user-account.md)

## 4. 当前结论

- 个人中心第一阶段采用“单页分区式”结构，而不是 tab 式设置中心或概览首页 + 多级跳转。
- 页面分为 3 个主分区：
  - `User` 级信息区
  - `Account` 级信息区
  - `安全与常用入口区`
- `User` 级信息区表达“这个自然人具备哪些登录身份与登录方式”。
- `Account` 级信息区表达“当前正在使用哪个账号工作、位于哪个租户 / scope 下、拥有哪个角色集合，以及该账号的展示资料是什么”。
- 企业或租户下发给当前 `account` 的工作邮箱、工作手机号属于 `account` 级工作身份信息，默认只读，不能让用户自行修改。
- 登录邮箱、登录手机号、微信、Google 等属于 `user` 级登录方式；第一阶段只展示，后续可以扩展为绑定 / 解绑 / 验证 flow 的入口。
- 当前个人中心第一阶段中的以下资料字段，语义上统一归属于当前 `account`，而不是 `user` 全局资料：
  - 头像
  - 显示名
  - 个人简介
- 当前 `account` 资料字段统一建模为 `account profile`：
  - 外部黑盒字段：`avatar`
  - `displayName`
  - `bio`
- 下游 `identity-service.UserAccount` 内部字段使用 `avatarUrl`；BFF 对外 contract 使用 `avatar`，实现上必须显式按“`avatar` -> `avatarUrl`”映射，不能把内部字段名泄漏到黑盒接口。
- `account profile` 的真相源应落在 `identity-service.UserAccount`，而不是 `auth-service` 或前端本地状态。
- 当前 `account` 拥有的角色必须作为个人中心核心信息之一直接展示，而不是藏在次级页面里。
- 第一阶段只允许直接编辑低风险 `account` 级资料：
  - 头像
  - 显示名
  - 个人简介
- 第一阶段不直接编辑：
  - 登录邮箱
  - 登录手机号
  - 第三方登录绑定
  - 工作邮箱
  - 工作手机号
  - 当前 `account` 角色
  - 当前租户 / scope / 账号上下文
  - 密码 / MFA / 会话
- 第一阶段个人中心需要一个独立的黑盒 summary payload，避免前端把 `session/context`、`access-summary` 与未来 `user` 资料字段在页面内临时拼接成伪真相。
- 该 payload 至少应包含：
  - `userProfile.loginEmail`
  - `userProfile.loginPhone`
  - `userProfile.loginMethods[]`
  - `accountContext.avatar`
  - `accountContext.displayName`
  - `accountContext.bio`
  - `accountContext.accountName`
  - `accountContext.tenantName`
  - `accountContext.scopeLevel`
  - `accountContext.roles[]`
  - `accountContext.workEmail`
  - `accountContext.workPhone`
  - `securityEntries[]`

## 5. 契约真相位置

- `GET /auth/session/context` 仍然是 shell 级 `account / tenant / scopeLevel` 初始化真相源，只负责登录后壳层上下文建立，不承担 personal-center 富资料读模型真相。
- 当前 `account` 的角色展示继续以 [access-summary.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/api-gateway/access-summary.md) 中的 `GET /auth/session/access-summary` 为真相源。
- 安全与自助入口继续复用 [auth-bff-self-service.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/api-gateway/auth-bff-self-service.md) 已冻结能力。
- personal-center 的富资料读模型直接以 [auth-bff-login.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/api-gateway/auth-bff-login.md) 中的 `GET /auth/personal-center` 为实现真相源，不应回退到 `GET /auth/session/context` 拼接资料字段。
- personal-center 的 `account profile` 写模型直接以 [auth-bff-login.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/api-gateway/auth-bff-login.md) 中的 `PATCH /auth/personal-center/account-profile` 为实现真相源。
- 第一阶段 `account profile` 黑盒 contract 的可编辑字段为：
  - `avatar`
  - `displayName`
  - `bio`

## 6. 线程分工

| Thread / Owner | 职责 | 允许修改路径 | 输入 | 输出 | 状态 |
| --- | --- | --- | --- | --- | --- |
| design owner | 冻结个人中心的目标、边界、信息分区、第一阶段可编辑范围与后置项归位 | `docs/plans/features/**`, 必要时 `docs/contracts/api-gateway/**` | 当前 `auth-bff` context / access summary 契约、现有 profile / security 页面、统一 account-context 语义 | 当前 feature packet 与后续契约需求清单 | completed |
| contract / producer owner | 新增并实现 `account` 级资料摘要 / 写接口与登录方式摘要能力，冻结 BFF 黑盒契约并提供 fixture | `docs/contracts/api-gateway/**`, `src/services/api-gateway/**`, 必要时下游 service 只读查询路径 | 当前 feature packet、现有 `session/context` / `access-summary` 契约 | 稳定 contract、fixture、`READY_FOR_CONSUMER` | completed |
| consumer owner | 基于已冻结契约接入 tenant-web 个人中心页面，不重新发明契约 | `app/web/apps/tenant-web/**` | 当前 feature packet、已冻结 BFF contract、现有 profile / security 页面样式模式 | 可用个人中心页面与前端验证结果 | completed |
| review / integration owner | 检查实现是否混淆 `user` / `account` 语义，收口验证并关闭本 feature | 只读全局，必要时回写当前 feature packet 状态 | producer / consumer 输出、当前 feature packet | 验证结论、关闭判断 | completed |

## 7. 当前 slice

- slice: feature implemented and verified
- scope:
  - 冻结页面定位
  - 冻结分区结构
  - 冻结第一阶段可编辑范围
  - 冻结 `user` / `account` 信息分层
  - 校正资料字段归属到 `account`
  - 冻结后置项边界
- ready definition:
  - 页面主结构已实现
  - 第一阶段编辑范围已实现
  - `user` 级登录方式与 `account` 级工作联系方式边界已落地
  - `GET /auth/personal-center` 与 `PATCH /auth/personal-center/account-profile` 已实现

## 8. 主线范围

- 本线程主线：
  - 设计一个综合个人中心页面
  - 明确 `user` 级信息区、`account` 级信息区、安全与常用入口区
  - 明确第一阶段哪些信息可编辑、哪些只读、哪些只做入口
  - 校正头像 / 显示名 / 简介的语义归属
- 本线程不做：
  - 直接实现页面
  - 设计完整的登录方式绑定 / 解绑 / 验证流程
  - 设计企业工作联系方式的编辑流程
  - 改动 `operator context`、租户模型、权限模型或 account-context 语义
- 偏移返回条件：
  - 若需要改变 `user` / `account` / `tenant` 现有语义边界，则暂停并升级到 architecture / ADR
  - 若需要让前端绕过 BFF 直接消费下游身份真相，则暂停并先补黑盒 contract

## 9. 阻塞 / 依赖

- 已确认个人中心第一阶段不是“顶部偏好设置面板”的重复壳。
- 已确认页面必须显式区分 `user` 级信息与 `account` 级信息。
- 已确认当前 `account` 角色展示属于主线信息，不能后置到次级页面。
- 已确认企业下发的工作邮箱 / 工作手机号属于 `account` 级只读信息。
- 已确认登录方式绑定 / 解绑 / 验证属于后续独立 flow，不进入当前主线。

## 10. 派生问题 Ledger

| 时间 | 问题 | 分类 | 当前影响 | 处理策略 | 目标落点 | 状态 |
| --- | --- | --- | --- | --- | --- | --- |
| 2026-04-15 | 顶部偏好设置是否应在个人中心重复出现 | Blocker-Now | 若直接重复，会让页面退化成系统设置壳 | 已确认第一阶段移除单独偏好设置分区，不与顶部默认设置重复 | 当前 feature packet | closed |
| 2026-04-15 | 登录方式绑定 / 解绑 / 验证流程如何承接 | Blocker-Later | 影响个人中心后续扩展，但不阻塞第一页成立 | 第一阶段只展示 `user` 级登录方式；后续作为独立 flow / feature 设计 | 当前 feature packet，后续可迁入独立 feature packet 或 `candidates.md` | open |
| 2026-04-15 | `account` 级资料字段（头像 / 显示名 / 简介）的正式真相源与写接口是否已存在 | Blocker-Later | 影响头像 / 显示名 / 简介从“页面设计”走向“真实可编辑实现” | 已冻结为 BFF 黑盒 contract：读走 `GET /auth/personal-center`，写走 `PATCH /auth/personal-center/account-profile`；实现不得回退到 `GET /auth/session/context` 拼接资料字段 | `docs/contracts/api-gateway/**` | closed |
| 2026-04-15 | 当前页面是否需要展示“其他 account 概览” | Sidecar | 会增加信息密度并弱化当前账号语义 | 当前已确认不纳入第一阶段，继续聚焦当前 `account` 上下文 | [backlog.md](/Users/acehood/Documents/GitHub/oes/docs/plans/backlog.md) 或下一阶段 feature slice | open |
| 2026-04-16 | `bio` 应落在哪个模型 | Blocker-Now | 若继续悬空，会导致资料编辑接口边界不清 | 已确认 `bio` 与 `avatarUrl` / `displayName` 一样归属于 `UserAccount`，统一作为 `account profile` 字段推进 | 当前 feature packet / 后续 contract | closed |

## 11. 验收标准

- 登录后用户有一个明确的“个人中心”入口页。
- 页面能够清晰区分 `user` 级信息与 `account` 级信息。
- 页面能展示 `user` 级资料：
  - 登录方式摘要
  - 登录邮箱
  - 登录手机号
- 页面能展示当前 `account` 级资料：
  - 当前账号头像
  - 当前账号显示名
  - 当前账号个人简介
  - 当前账号名称
  - 当前租户名称
  - 当前 scope
  - 当前 `account` 的 role 列表
  - 工作邮箱
  - 工作手机号
- 当前 `account` 的 role 以直观方式呈现，而不是仅通过调试字段或隐藏区块表达。
- 页面能聚合现有安全与常用入口，而不伪造不存在的安全流程。
- 第一阶段只允许编辑当前 `account` 的头像、显示名、个人简介，不越界承接高风险身份 / 安全修改能力。
- 第一阶段资料编辑契约必须是“当前 `account` 自助编辑当前 `account profile`”，不接受跨账号 profile 修改。

## 12. 关闭条件

- 当前 feature packet 已冻结并完成第一阶段实现。
- 页面分区结构、字段边界、第一阶段编辑范围与后置项都已明确且已落地。
- `GET /auth/personal-center` 与 `PATCH /auth/personal-center/account-profile` 已进入实现真相。
- tenant-web 已完成对应页面接入，后续只需围绕绑定 / 解绑等后置能力继续扩展。

## 12.1 当前实现状态

- `identity-service`
  - 已为 `UserAccount` 补齐 `bio`
  - 已实现 account profile 的 query / command / gRPC 读写链路
- `auth-bff`
  - 已实现 `GET /auth/personal-center`
  - 已实现 `PATCH /auth/personal-center/account-profile`
  - 已将 `avatar / displayName / bio` 正式归入 `accountContext`
- `tenant-web`
  - 已实现个人中心页面 inline 编辑当前 account profile
  - 已将 `user` 区块收敛为登录身份信息，只读展示
  - 已保留企业工作联系方式、角色展示与切换账号入口

## 13. 备注

- 当前已有 `_core/profile/base-setting.vue` 更接近模板化资料表单，不等价于正式的 OES 个人中心页面。
- 第一阶段个人中心应更像“身份与上下文总入口”，而不是模板表单或系统设置集合。
- 后续若进入登录方式绑定 / 解绑 / 验证设计，应单独处理验证码、邮件链接确认、第三方 OAuth 回调与安全审计，不应继续塞回本页面的主表单里。
- 当前已确认：`user` 级稳定字段以登录身份信息为主；头像、显示名、简介在本 feature 中统一视为当前 `account` 的展示资料。
- 当前已确认：BFF 外部黑盒字段使用 `avatar` / `displayName` / `bio`，其中 `avatar` 在下游 `UserAccount` 内部映射到 `avatarUrl`；这组字段统一视为 `UserAccount` 的 `account profile`，而不是临时聚合字段。

## 14. 当前实现归属整理

- 目的：
  - 为当前工作区中与 `personal-center` 相邻但不完全同题的认证改动划清边界，避免后续提交、回归验证或新 feature 继续混线。
- 当前 thread 的直接归属文件：
  - `docs/plans/features/personal-center.md`
  - `docs/contracts/api-gateway/auth-bff-login.md`
  - `src/services/api-gateway/src/modules/auth-bff/application/ports/personal-center-summary.port.ts`
  - `src/services/api-gateway/src/modules/auth-bff/application/use-cases/personal-center.use-case.ts`
  - `src/services/api-gateway/src/modules/auth-bff/application/use-cases/personal-center.use-case.spec.ts`
  - `src/services/api-gateway/src/modules/auth-bff/infrastructure/downstream/personal-center/personal-center-summary.adapter.ts`
  - `src/services/api-gateway/src/modules/auth-bff/infrastructure/downstream/personal-center/personal-center-summary.adapter.spec.ts`
  - `src/services/api-gateway/src/modules/auth-bff/interfaces/http/view-models/personal-center.view-model.ts`
  - `app/web/apps/tenant-web/src/api/bff/personal-center/index.ts`
  - `app/web/apps/tenant-web/src/views/_core/profile/index.vue`
  - `app/web/apps/tenant-web/src/views/_core/profile/personal-center.vue`
  - `app/web/apps/tenant-web/src/views/_core/profile/components/personal-user-section.vue`
  - `app/web/apps/tenant-web/src/views/_core/profile/components/personal-account-section.vue`
  - `app/web/apps/tenant-web/src/views/_core/profile/components/personal-security-section.vue`
- 当前 thread 的配套归属文件：
  - `src/services/api-gateway/src/modules/auth-bff/auth-bff.module.ts`
  - `src/services/api-gateway/src/modules/auth-bff/infrastructure/downstream/identity-service/identity-query-grpc.adapter.ts`
  - `src/services/api-gateway/src/modules/auth-bff/interfaces/http/controllers/auth.controller.ts`
  - `src/services/api-gateway/src/modules/auth-bff/interfaces/http/controllers/auth.controller.spec.ts`
  - `app/web/apps/tenant-web/src/api/bff/index.ts`
  - `app/web/apps/tenant-web/src/modules/workbench/routes.ts`
  - `app/web/apps/tenant-web/src/layouts/basic.vue`
  - 说明：
    - 这些文件不是为了扩展认证平台能力本身，而是为了把个人中心入口、路由、聚合读模型接进现有壳层。
- 与当前 thread 相邻但不应混入本次 personal-center 提交判断的文件：
  - `src/services/api-gateway/src/modules/auth-bff/application/use-cases/session-contexts.use-case.ts`
  - `src/services/api-gateway/src/modules/auth-bff/application/use-cases/session-contexts.use-case.spec.ts`
  - `src/services/api-gateway/src/modules/auth-bff/application/use-cases/switch-context.use-case.ts`
  - `src/services/api-gateway/src/modules/auth-bff/application/use-cases/switch-context.use-case.spec.ts`
  - `src/services/api-gateway/src/modules/auth-bff/interfaces/http/view-models/session-context-switch.view-model.ts`
  - `src/services/api-gateway/src/modules/auth-bff/interfaces/http/dtos/login.dto.ts`
  - `app/web/apps/tenant-web/src/api/bff/context/index.ts`
  - 原因：
    - 它们属于“切换账号 / 登录后上下文切换”主线，虽然个人中心复用了这个能力入口，但语义上仍是独立 feature。
- 明确排除在当前 thread 之外的文件：
  - `src/services/api-gateway/src/modules/auth-bff/application/use-cases/admin-security.use-case.ts`
  - `src/services/api-gateway/src/modules/auth-bff/application/use-cases/admin-security.use-case.spec.ts`
  - `src/services/api-gateway/src/modules/auth-bff/application/use-cases/session-self-service.use-case.ts`
  - `src/services/api-gateway/src/modules/auth-bff/application/use-cases/session-self-service.use-case.spec.ts`
  - `src/services/api-gateway/src/modules/auth-bff/infrastructure/downstream/auth-service/auth-grpc.adapter.ts`
  - `src/services/api-gateway/src/modules/auth-bff/interfaces/http/dtos/admin-security.dto.ts`
  - `src/services/api-gateway/src/modules/auth-bff/interfaces/http/view-models/admin-security.view-model.ts`
  - `src/services/api-gateway/src/modules/auth-bff/interfaces/http/controllers/auth.integration.spec.ts`
  - `app/web/apps/tenant-web/src/api/bff/admin-security/index.ts`
  - `app/web/apps/tenant-web/src/api/bff/security/index.ts`
  - `app/web/apps/tenant-web/src/views/_core/profile/security-center.vue`
  - 原因：
    - 这些文件承载的是管理员会话管理、自助会话管理与安全中心增强，不属于 personal-center 本体，应继续留在独立 thread 中判断、验证与提交。
- 当前建议的提交策略：
  - 若后续需要对本 feature 做独立提交，应优先只纳入“直接归属文件 + 配套归属文件”。
  - 与 `session-context switch`、`security-center`、`admin-security` 相关的文件应分开复核，不要因为路径相近而默认一并提交。
