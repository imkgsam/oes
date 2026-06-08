# identity-service 职责卡

## 1. Purpose

`identity-service` 是 OES 的账号、身份映射、登录身份查询、联系资产、机器主体与账号绑定关系真相服务，负责回答“这个自然人有哪些账号、账号属于哪个 scope / tenant 引用、账号如何映射到自然人主体或员工、哪些身份摘要可被认证、授权、BFF 与业务服务安全消费”。

涉及 HR `Employee / Employment`、员工生命周期或正式 `人 -> org` 归属时，以 [hr-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/hr-service.md) 为准；本文只定义 identity 自身的账号、身份与 binding 边界。

本文是 `identity-service` 的唯一稳定设计真相源。其他 architecture、collaboration、contract、plan、feature packet 或服务内实现文档只能引用本文，不得重新定义 `identity-service` 的长期职责、核心对象、边界或 owner 语义。

## 2. Owns

- `User` 技术身份真相：
  - `userId`
  - `partyId` 到 `party-service` `PersonParty` 的受控关联
  - 启用状态
  - legacy login handle 展示 / 迁移语义
- `UserAccount` 账号真相：
  - account id
  - `userId`
  - `scopeLevel`
  - tenant 引用
  - account display name
  - account enabled / disabled lifecycle
- 当前 user 可用 account context 列表与 account 展示摘要。
- `UserAccount <-> Employee` 绑定结果真相；`Employee / Employment` 本体仍归 `hr-service`，以 [hr-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/hr-service.md) 为准。
- 联系资产与账号归属关系：
  - 工作邮箱资产
  - 工作手机号资产
  - 公司受控微信 / WhatsApp / 其他社交账号资产
  - 员工个人社交联系方式在 OES 内的受控展示引用
  - 企业微信、飞书、钉钉等外部通信账号的名片展示摘要引用
  - 主工作联系方式标记
  - 联系资产启停、分配、回收、交接与审计语义
- 机器主体基础身份：
  - `ServiceAccount`
  - machine principal scope / type / lifecycle
- API Key 与 machine auth 的现有 contract 语义；长期 credential 边界仍需按 machine-principal 专项继续对齐。
- 面向认证、授权、BFF 与业务服务的受控身份查询结果。

## 3. Does Not Own

- 密码、OTP、MFA、login method、session、token、refresh token、认证 challenge 或认证审计真相；这些归属 `auth-service`。
- 权限码、角色、scope、policy、terminal access policy、授权判定、权限摘要或导航授权真相；这些以 [permission-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/permission-service.md) 为准。
- `Tenant`、tenant lifecycle、`OrgUnit`、org tree、org hierarchy、org reference validation 或 `organizationPartyId` 真相；这些以 [tenant-org-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/tenant-org-service.md) 为准。
- `Employee`、`Employment`、正式 `人 -> org` 任职关系或 onboarding 业务结果；这些归属 `hr-service`。
- 现实世界自然人的真实姓名、法定姓名、昵称、多语言姓名或组织主体 canonical truth；这些归属 `party-service`。
- 客户、供应商、员工、联系人等业务角色语义真相；这些归属对应业务服务。
- 通知模板、渠道、provider、投递任务或通知投递状态真相；这些归属 `notification-service`。
- BusinessCard 的展示配置、Contact Action 排序、公开范围、vCard 输出规则或 public entry 真相；这些归属 BusinessCard / Public Entry owner。
- 外部通信平台的账号生命周期、OAuth token、refresh token、webhook、消息读取、消息发送或会话同步真相；这些需由后续 external communication integration / channel binding 设计冻结。
- API Gateway / BFF 的 HTTP contract、前端聚合形状或 UI 状态。

## 4. Core Responsibilities

- 提供 `User`、`UserAccount`、联系资产、机器主体与账号绑定关系的查询能力。
- 维护 `User.partyId` 到 `party-service` 自然人主体的受控关联。
- 维护 scope-aware `UserAccount`，支持 `SYSTEM` 与 `TENANT` 两类 account context。
- 为 `auth-service` 提供登录后 account candidate、account existence、account ownership、account enabled state 与 scope / tenant 引用事实。
- 为 `auth-service` 的员工码现场终端登录提供 `employeeId -> unique UserAccount + enabled state` 的受控解析事实；员工 lifecycle 与 active employment 仍由 `hr-service` 判断，PIN 仍由 `auth-service` 校验。
- 为 `api-gateway` / BFF 提供 account context、账号目录、身份展示摘要与必要的用户发现能力。
- 维护 `UserAccount <-> Employee` 绑定结果，并在绑定时校验同 tenant 与同自然人主体约束。
- 维护工作邮箱、工作手机号、公司受控社交账号、员工个人社交联系方式展示引用与外部通信账号展示摘要这类账号联系资产的分配、回收、启停、交接和主联系方式语义。
- 维护机器主体基础身份；机器认证、API Key credential 与 delegation 的长期协同需按专项 contract / architecture 继续推进。
- 区分登录标识、联系资产、真实姓名与展示名，不把一个字段扩张成多种真相。
- 对当前账号自助资料修改与管理员资料管理使用显式分离的接口边界，不允许长期复用同一个 management 写接口承载 self-service 语义。

## 5. User And Login Identity Boundary

`identity-service` owns `User` 技术身份和可查询身份摘要，但不拥有认证凭据。

稳定规则：

- `User.partyId` 是到 `party-service` `PersonParty` 的受控关联。
- `User.username` 是历史字段；如被读取，只能作为可选 legacy login handle 展示或迁移依据。
- `User.username` 不是真实姓名、法定姓名、昵称、展示名或多语言姓名真相源。
- 若后续需要唯一用户名登录，应先冻结 login handle 语义，再同步更新 `auth-service` login method / credential 设计。
- 个人邮箱 / 个人手机号如作为登录标识参与认证，其认证可用性、密码、OTP 与 login method 归 `auth-service`；`identity-service` 只提供身份侧查询与联系资产 / profile 事实。
- 真实姓名搜索、自然人合并、法定主体识别等能力应通过 `party-service` 协同设计，不在 `identity-service` query 中直接扩展为姓名模糊搜索。

## 6. UserAccount And Account Context

`UserAccount` 表示一个自然人在某个工作上下文中的账号。

稳定规则：

- `UserAccount.scopeLevel = SYSTEM` 表示系统 / 平台账号。
- `UserAccount.scopeLevel = TENANT` 表示租户账号。
- `SYSTEM` account 不绑定 tenant，`tenantId` 必须为空。
- `TENANT` account 必须绑定真实 tenant 引用，`tenantId` 必填。
- `tenantId` 在 `identity-service` 内只表示 account context 对 tenant 的引用，不是 tenant 主数据或 lifecycle 真相。
- `identity-service` 只按账号自身启用状态与 tenant 引用返回 account candidates；tenant lifecycle 由 `tenant-org-service` 提供并以 [tenant-org-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/tenant-org-service.md) 为准，认证准入由 `auth-service` 消费后决策。
- account display name 是 account context 展示摘要，不等同于自然人真实姓名。
- 当前可切换 account context 列表归 `identity-service` 提供；切换后的 session context、token 与 refresh 语义归 `auth-service`。

## 7. Tenant / Org / HR Boundary

历史服务内旧文档曾把 `Tenant`、`Org`、org tree 与 account-org membership 作为 identity 设计正文。该方向已被当前项目级边界取代。

稳定规则：

- `Tenant`、tenant status、tenant lifecycle 与 tenant 展示摘要以 [tenant-org-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/tenant-org-service.md) 为准。
- `OrgUnit`、org tree、org hierarchy 与 org reference validation 以 [tenant-org-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/tenant-org-service.md) 为准。
- `Employment -> OrgUnit` 是正式 `人 -> org` 任职真相，归 `hr-service`。
- `UserAccount <-> Employee` binding 只表达账号与员工聚合的受控关联，不替代 `Employee / Employment`。
- `ResolveEmployeeLoginAccount` 可基于既有 `UserAccount <-> Employee` binding 返回某 active employee 对应的唯一 account 及其 enabled state，用于认证编排与准确审计；该能力不得把 identity-service 扩展为 HR lifecycle、terminal access 或 PIN owner。
- legacy account-org membership 或 account 视角 org 数据只能作为 compatibility / projection 口径存在，不得成为 onboarding、HR、授权或组织治理主链 owner。
- `identity-service` 可在账号、联系资产、机器主体、审计记录中保留 `tenantId / orgId` 引用字段，但不得通过本地模型或共享数据库读取 tenant / org 真相。

## 8. Contact Assets

`identity-service` owns account-scoped contact asset truth。

稳定规则：

- Contact Asset 第一阶段服务员工资料与 Employee Digital Business Card 的联系方式展示，不承接外部账号登录绑定、OAuth token、webhook、消息读取或消息发送。
- Contact Asset 的 primary 关联是 tenant-scoped `UserAccount`：
  - `tenantId + accountId` 是第一阶段主归属口径。
  - `userId` 是身份主体引用与查询辅助。
  - `employeeId` 可作为当前分配对象或 HR lifecycle 协同引用，但不是 Contact Asset owner。
- 第一阶段 Contact Asset 类型包括：
  - `WORK_EMAIL`
  - `WORK_PHONE`
  - `WECHAT`
  - `WHATSAPP`
  - `EXTERNAL_COMMUNICATION_ACCOUNT`
  - `OTHER_SOCIAL`
- 工作邮箱和工作手机号是账号联系资产，可分配、回收、启停、标记主联系方式并记录审计。
- `WECHAT` / `WHATSAPP` 可表达公司受控账号或员工个人账号，必须通过 ownership 区分。
- 公司名下手机号注册的微信、WhatsApp 或其他社交账号在 OES 内视为公司受控 Contact Asset；员工只是当前使用 / 分配对象，不是资产 owner。
- 员工个人微信、WhatsApp 或其他个人社交联系方式可作为名片兜底展示引用，但不是公司资产；公司不得在离职后回收或转交该个人账号。
- 员工个人联系方式第一阶段不建立独立 consent 模型；添加、修改、移除和展示配置动作必须记录审计元数据。
- 企业微信、飞书、钉钉等第一阶段建模为 `EXTERNAL_COMMUNICATION_ACCOUNT`，只保存 provider、handle / external reference、display summary 等名片展示摘要；外部平台账号 lifecycle 仍归外部平台。
- 同一类社交联系入口在 BusinessCard 默认只展示一个：公司受控 Contact Asset 优先；没有公司受控账号时，才展示员工个人联系方式引用。
- 公司受控社交账号在员工离职、调岗失去使用权或 account disabled 时，默认立即从原员工名片隐藏，并进入交接或停用状态。
- 第一阶段 Contact Asset 最小状态语义为 `ACTIVE`、`PENDING_HANDOVER`、`DISABLED`、`RELEASED`；更细 verification、sync、claim、lost 或 revoked 状态需另行冻结。
- 工作联系方式不天然等于登录方式；是否可登录、是否已启用 login method、OTP / password credential 均归 `auth-service`。
- 第一阶段 OES 登录默认使用个人 primary login method；公司分配的工作邮箱、工作手机号、公司受控社交账号不作为默认登录方式。
- BusinessCard 只能引用 Contact Asset 并决定展示配置、排序、公开范围和是否进入 vCard，不拥有 phone、email、WeChat、WhatsApp 或外部通信账号正文。
- 第一阶段不做 org / team / role 级公共联系资产；公共号、部门号、客服号或销售公共号应通过后续设计单独冻结。
- 自助联系绑定与管理员联系资产治理必须分离：
  - self-service 只作用于当前登录主体，并从当前 session / operator context 派生 target。
  - admin-management 面向目标账号或目标用户，必须经过权限与 scope 判定。
- 联系资产可保存 `tenantId / orgId` 作为上下文引用，但不拥有 tenant / org 真相。

## 9. Machine Identity

`identity-service` owns machine principal identity foundation。

稳定范围：

- `ServiceAccount` 是当前机器主体基础模型。
- `scopeLevel` 表达 `SYSTEM / TENANT` 机器主体。
- `TENANT` scope machine principal 必须绑定真实 tenant 引用。
- `SYSTEM` scope machine principal 不绑定 tenant。
- `type` 表达机器主体类型，例如 internal service、external integration、AI agent 或 automation bot。
- lifecycle 至少需要 active / disabled 语义。

当前注意事项：

- API Key 与 machine auth contract 已存在，但长期 credential 边界仍需按 machine-principal 专项继续对齐。
- `APIKey` 是 credential，不是主体。
- `auth-service` 后续如承担机器认证 token / delegation issuance，应通过专项协同设计明确，不由 `identity-service` 单独定义。
- `permission-service` 对机器主体的权限、upper-bound policy 或 delegation scope 仍需独立冻结，且必须回写到 [permission-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/permission-service.md) 或新的 ADR。

## 10. Self-service And Admin-management Boundary

`identity-service` 的接口层必须显式区分 self-service 与 admin-management。

Self-service 默认语义：

- 当前用户修改自己的低风险基础资料。
- 当前用户完成自己的联系绑定后触发必要的身份侧同步。
- target 必须由当前 session / operator context 推导，不接受前端任意指定他人 target。
- 不默认要求管理员资料修改权限码，但仍必须满足安全策略、白名单动作与审计要求。

Admin-management 默认语义：

- 管理员查看或治理目标账号、目标用户、工作联系方式资产或机器主体。
- 必须经过 `RBAC + scope / resource` 授权判定，并记录审计。

历史混合接口只作为迁移债，不得继续扩展。该迁移由 [self-service-admin-boundary-migration.md](/Users/acehood/Documents/GitHub/oes/docs/plans/features/self-service-admin-boundary-migration.md) 持续跟踪，而不是在各服务中分别维护孤立清单。

## 11. External Interfaces

典型上游入口：

- `auth-service`
- `api-gateway` / BFF
- `hr-service`
- `permission-service`
  - 提供账号管理、contact asset 管理、machine principal 管理与 employee binding 管理接口的权限判定；permission 侧核心对象与 owner 边界以 [permission-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/permission-service.md) 为准。
- 业务服务

典型契约位置：

- [identity-service/query.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/identity-service/query.md)
- [identity-service/management.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/identity-service/management.md)
- [identity-service/machine-auth.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/identity-service/machine-auth.md)
- [identity-service/employee-binding.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/identity-service/employee-binding.md)

Contract 文档只描述黑盒调用语义、字段、错误与当前接口形状；不得重新定义本文中的服务 owner、核心对象或长期边界。

## 12. Upstream Dependencies

- `party-service`
  - 提供 canonical natural person / organization party 事实。
  - 承接真实姓名、法定姓名、多语言姓名、主体识别与主体合并等现实世界主体语义。
- `tenant-org-service`
  - 提供 tenant lifecycle、tenant 摘要、org tree 与 org reference validation。
  - 为 TENANT scope account / machine principal 提供 tenant 引用校验依据。
- `hr-service`
  - 提供 `Employee / Employment` 真相。
  - 在 onboarding 或人员治理中发起或消费 `UserAccount <-> Employee` binding。
- `permission-service`
  - 为 identity 管理接口、账号目录、机器主体管理等受保护能力提供授权判定。
- `auth-service`
  - 消费 identity account facts 建立认证续流、account selection 与 session context。
  - 拥有认证凭据、login method、session、token 与认证域审计。

## 13. Downstream / Published Facts

- user 技术身份摘要。
- `User.partyId` 关联摘要。
- account context 列表。
- account existence / ownership / enabled state。
- account scope / tenant reference。
- account display summary。
- contact asset summary。
- machine principal summary。
- `UserAccount <-> Employee` binding summary。

## 14. Non-goals

- 不拥有 session、refresh token、认证 challenge、password、OTP、MFA 或 login method 真相。
- 不定义权限、角色、policy、scope 或 terminal access 策略模型。
- 不拥有 tenant / org tree / org lifecycle / org hierarchy。
- 不拥有 `Employee / Employment -> OrgUnit` 的正式归属真相。
- 不承载业务域客户、供应商、员工等最终业务角色语义。
- 不提供真实姓名模糊搜索；如后续需要按姓名发现自然人，应先设计 `party-service` 协同能力。
- 不通过 service-local docs、feature packet 或 contract 文档长期承载第二份 identity-service 服务设计。

## 15. Current Stage And Cleanup Rules

当前 `identity-service` 处于唯一真相元整理与历史文档收敛阶段：

- 本文承接长期服务设计真相。
- `docs/contracts/identity-service/**` 继续作为黑盒 contract 真相，但不得重新定义服务职责。
- `docs/architecture/collaborations/**` 继续作为跨服务协同蓝图，但不得重新定义 `identity-service` owner 语义。
- 服务内旧 design、task、history、overview、roadmap 只作为本次提炼来源与历史记录，不再作为稳定设计入口。
- 服务内旧 docs 在提炼完成后应删除；服务根目录可保留一个极短 README 指向本文与 contract 入口。
- self-service / admin-management 拆分由 [self-service-admin-boundary-migration.md](/Users/acehood/Documents/GitHub/oes/docs/plans/features/self-service-admin-boundary-migration.md) 持续推进。
