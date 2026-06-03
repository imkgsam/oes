# auth-service 职责卡

## 1. Purpose

`auth-service` 是 OES 的认证、认证凭据、认证挑战、会话、token、MFA 与认证域审计真相服务，负责回答“操作者如何被认证、当前 session 是否有效、认证流程如何续流、当前 session context 如何建立或切换”。

本文是 `auth-service` 的唯一稳定设计真相源。其他 architecture、collaboration、contract、plan、feature packet 或服务内实现文档只能引用本文，不得重新定义 `auth-service` 的长期职责、核心对象、边界或 owner 语义。

## 2. Owns

- 主认证流程真相：
  - 邮箱密码登录
  - 手机密码登录
  - 邮箱 OTP 登录
  - 手机 OTP 登录
  - 员工码 + 现场终端 PIN 登录
- 认证 challenge 真相：
  - login challenge
  - OTP challenge
  - MFA flow challenge
  - password recovery challenge
  - step-up MFA challenge
- 认证凭据与登录方式真相：
  - `LoginMethod`
  - password credential
  - user-scoped `TERMINAL_PIN` credential
  - OTP usage 与验证码校验状态
  - password setup requirement
  - password recovery reset grant
  - platform terminal entry login policy
- session 与 token 真相：
  - active session
  - session context
  - access token 签发语义
  - refresh token rotation
  - session validation
  - logout / revoke / tenant session revoke
- account selection 与 context switch 的 session 侧真相：
  - account selection 后建立当前 session context
  - context switch 后替换当前 session context
  - context switch 后重新签发 token
- MFA 真相：
  - user MFA binding
  - TOTP binding
  - recovery codes
  - platform default terminal MFA policy
  - tenant terminal MFA policy
  - login MFA orchestration
  - sensitive action step-up MFA orchestration
- personal trusted-device 与 new-device MFA 判定所需的认证域设备识别真相。
- 登录失败限流、OTP 发码频控、OTP 尝试次数与认证安全策略执行真相。
- 认证域本地审计事实：
  - login
  - challenge
  - MFA
  - password recovery
  - refresh
  - refresh replay
  - logout
  - session revoke
  - admin security action

## 3. Does Not Own

- 自然人、账号、租户、组织、联系资产主数据真相；这些归属 `identity-service`、[tenant-org-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/tenant-org-service.md) 或 `party-service`。
- email / phone contact asset 的主数据、验证状态与展示资料真相；这些归属 `identity-service`。
- 当前用户可用 account context 列表与 account 展示摘要真相；这些归属 `identity-service`。
- tenant lifecycle 与 org tree 真相；这些以 [tenant-org-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/tenant-org-service.md) 为准。
- 角色、权限、policy、授权判定、权限摘要与导航授权真相；这些以 [permission-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/permission-service.md) 为准。
- 通知模板、渠道、provider、投递任务、投递状态、回执与成本治理真相；这些归属 `notification-service`。
- API Gateway / BFF 的 HTTP contract、前端响应聚合形状、captcha 校验与前端 shell 状态。
- 企业受管共享终端设备 registry、绑定租户、设备禁用、丢失、版本策略或设备运行快照真相；这些归属 `terminal-device-service`。
- Terminal Access Policy、account 是否允许从某 terminal 建立 session 的授权事实；这些归属 `permission-service`。
- 集中审计平台的索引、归档、检索与跨域审计视图；`auth-service` 只拥有认证域本地审计事实。
- Redis、Prisma、具体存储引擎或 runtime repository 形态的长期架构真相。

## 4. Core Responsibilities

- 执行统一主认证流程，并根据认证结果返回成功、拒绝、MFA 续流或 account selection 续流。
- 在当前阶段保留 account selection 主流程；即使用户只有一个 account，也不把自动进入作为当前稳定行为。
- 通过 `SelectAccount` 确定当前 session context，并建立 active session、签发 access token 与 refresh token。
- 在登录后的 account context switch 中，负责验证目标 account 与当前 session 主体关系，并替换当前 session context、重新签发 token。
- 维护 active session 生命周期，包括 validate、refresh、logout、logout all、logout other devices、admin revoke 与 tenant session revoke。
- 维护 refresh token rotation 与 replay 检测语义。
- 维护 user MFA binding、platform default / tenant terminal MFA policy、login MFA 与 step-up MFA challenge 编排。
- 维护 login method、password credential、password setup requirement 与 password recovery 流程。
- 维护平台级 Terminal Entry Login Policy，并在 primary credential 校验前判定当前 terminal 是否允许请求的 login flow。
- 执行登录失败限流、OTP 发码频控、OTP 尝试次数控制与 trusted-device / new-device MFA 判定。
- 记录认证、安全与 session 操作的本地审计事实。
- 显式区分 self-service 与 admin-management 接口授权语义，不允许长期复用同一接口层权限门承载两种语义。

## 5. Authentication Flow

`auth-service` 的认证流程分为四个稳定阶段：

1. 主认证：校验密码、OTP 或后续扩展认证方式，回答“用户是否完成基础身份验证”。
2. 登录 MFA：当所选 account 对应策略要求 MFA 时，创建并校验 login MFA flow。
3. Account selection：选择当前 `UserAccount`，并由该 account 决定当前 session scope。
4. Session issuance：建立 active session，并签发 access token / refresh token。

当前阶段稳定状态名仍保留：

- `SUCCESS`
- `MFA_REQUIRED`
- `ACCOUNT_SELECTION_REQUIRED`
- `DENIED`

`context selection` 是产品与协同层表达；在 `auth-service` 内部，当前稳定主语义仍是选择 `UserAccount` 作为当前 session context，不引入独立 `workspace` 或独立 context 主数据模型。

单 account 自动建 session 是 future optimization。当前阶段主认证成功后仍进入 account selection 流程，后续是否优化为单 account 自动进入，需要单独评估设备上下文、MFA、审计与兼容影响。

Terminal-aware Account Security Phase 2 增加以下稳定规则：

- Web 保留现有固定登录入口与 account selection。
- PDA 登录租户由受管设备绑定决定，用户登录时不选择租户。
- PDA Phase 2 不提供 account selection；用户认证成功后，必须在设备绑定 tenant 内解析出唯一可 PDA 登录 account。
- `EMPLOYEE_CODE_PIN` 是现场终端登录流程：`employeeCode` 只用于在设备绑定租户内解析 HR 员工与目标 account，真正的认证凭据是 user-scoped `TERMINAL_PIN`。
- Terminal Entry Login Policy 不改变各前端固定登录流程，只作为平台级入口启停与后端准入。

## 6. Account Selection And Session Context

`auth-service` 在 account selection 后建立当前 session context。

稳定规则：

- 当前 session context 必须包含 `userId`、`accountId`、`scopeLevel`、`tenantId`（TENANT scope 必填，SYSTEM scope 为空）以及适用时的 `orgId`。
- terminal-aware session 必须包含 `terminal` 与 `loginFlow`。
- PDA / KIOSK 等受管终端 session 可包含 `terminalDeviceId` 与 `deviceBoundTenantId`。
- `SYSTEM` account 不绑定 tenant，也不读取 tenant lifecycle。
- `TENANT` account 必须绑定 tenant，并在 session 建立、refresh、validate 等关键路径校验 tenant 仍为可用状态。
- account 候选列表和 account 展示摘要由 `identity-service` 提供。
- tenant lifecycle 与 tenant 展示信息由 `tenant-org-service` 提供，服务边界以 [tenant-org-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/tenant-org-service.md) 为准。
- 权限摘要与导航授权由 `permission-service` / `api-gateway` 聚合提供，`auth-service` 不拥有该真相。

登录后的 account context switch 采用“替换当前 session context”语义：

- 不支持同一客户端并行持有多个 active context。
- 切换目标必须属于当前 session 对应 user。
- 切换成功后必须重新签发 access token，当前阶段也应轮换 refresh token。
- 切换后前端必须重新读取 session context、access summary 与导航摘要。
- 当前可切换 account context 列表不归 `auth-service` 所有。

## 7. Session And Token

`auth-service` owns active session truth，而不是仅验证 JWT 签名。

稳定规则：

- access token 必须是短期身份与 session context 摘要，不承载完整权限事实。
- access token validation 必须同时校验 JWT 与服务端 active session truth。
- refresh token 必须走 rotation 语义。
- refresh token replay 必须触发安全处理，并记录认证域审计事实。
- logout、logout other devices、logout all 与 admin revoke 都必须改变 active session truth，而不是只依赖客户端删除 token。
- terminal-aware session lifetime 由 `auth-service` 按 terminal 决定；`WEB` 保持通用长 refresh 策略，`PDA` 使用短作业终端策略（access token 默认 15 分钟，refresh token 默认 20 分钟）。
- PDA 用户 session 不跨 App 关闭自动恢复；PDA 端只持久化设备 enrollment / `terminalDeviceId`，重新打开 App 后必须重新登录。
- tenant 被 suspend / archive 后，`TENANT` scope session 不得继续 validate 或 refresh；可通过惰性失效与主动 revoke 双路径治理。
- `SYSTEM` scope session 不受 tenant lifecycle 影响。
- PDA / KIOSK 等受管终端设备进入 disabled / lost / unbound / retired 等不可登录状态后，`auth-service` 应消费设备状态事件并按 `terminalDeviceId` 幂等清退相关 active sessions。
- PDA login / refresh / bootstrap 仍应重查受管设备状态，作为事件延迟或失败时的兜底。

存储方向只在本文冻结到“active session truth 必须由 `auth-service` 拥有”。Redis、Prisma 或后续持久化 session 历史属于实现或专项架构问题，不在本文冻结为长期存储方案。

## 8. Login Methods And Credentials

`auth-service` owns 认证可用性；`identity-service` owns 联系资产主数据。

稳定规则：

- `identity-service` owns email / phone contact asset、联系资产验证状态、用户 / 账号展示资料。
- `auth-service` owns login method、password credential、OTP challenge、MFA credential、recovery code 与 password setup requirement。
- `TERMINAL_PIN` 是 `auth-service` 拥有的 user-scoped login credential，可供 PDA、KIOSK、触摸屏等现场共享终端使用；不得命名或建模为 PDA 专属凭据。
- `TERMINAL_PIN` 绑定 `userId`，不绑定 `accountId`、`employeeId` 或 `terminalDeviceId`；能否登录某租户终端仍由设备绑定租户、active employee、employee-account binding、account enabled、Terminal Access Policy 与设备状态共同决定。
- `TERMINAL_PIN` 设置、修改、忘记后重设、启用和停用属于 Web 已登录后的 self-service 账号安全能力，必须通过 step-up 保护；PDA 不提供 PIN 设置或找回流程。
- 管理员可要求用户重设 `TERMINAL_PIN` 或禁用目标用户的 `TERMINAL_PIN` login method，但不得查看、生成或设置明文 PIN。
- `TERMINAL_PIN` 必须只保存 hash；认证、诊断或审计日志不得记录 PIN 明文。
- `auth-service` 可以保存认证所需的 normalized identifier 或目标地址快照，但不得把它扩展为 email / phone 联系资产主数据。
- 联系资产绑定、变更或验证完成后，是否同步创建或启用 login method，必须通过显式 self-service 或 admin-management 接口完成。
- password recovery 使用认证域 challenge 与一次性 reset grant，不暴露账号存在性。
- 管理员要求用户重设密码应通过 admin-management 语义表达；用户自助修改或找回密码应通过 self-service / unauthenticated recovery 语义表达。
- 租户不配置 primary login method。
- 平台级 Terminal Entry Login Policy 定义每类 terminal 固定登录入口允许哪些已实现 login flow。
- 用户自己管理 credential / authenticator 可用性；Terminal Entry Login Policy 不表达 user、account、tenant 或单台设备级 login method override。

## 9. OTP And Notification Boundary

OTP 与通知投递必须分离 owner。

`auth-service` owns：

- OTP challenge 创建
- OTP value / hash / 校验
- OTP usage
- OTP 过期
- OTP 发码频控
- OTP 尝试次数
- OTP 相关认证审计
- OTP 是否通过并推动认证流程

`notification-service` owns：

- 通知 dispatch
- 模板
- 渠道
- provider adapter
- 发送任务
- 投递状态
- 回执
- 失败原因
- 成本与通知侧可观测性

`auth-service` 可以同步调用 `notification-service` 获取“通知请求已被受理 / 拒绝”的结果，但不得同步等待外部供应商真正送达。`notification-service` 不拥有 OTP 真相，也不判断 OTP 是否正确。

`auth-service` 内部 local notification fallback 只属于开发、测试或兼容运行方式，不是长期服务边界真相。

## 10. MFA Policy And Challenge

`auth-service` owns authentication MFA policy and challenge orchestration。

稳定范围：

- user MFA binding
- `EMAIL_OTP`
- `SMS_OTP`
- `TOTP`
- `BACKUP_CODE`
- platform default terminal MFA policy
- tenant terminal MFA policy
- login MFA challenge
- new-device login MFA
- sensitive action step-up MFA
- short-lived MFA grant token

稳定规则：

- 不设计全局 MFA 开关；MFA 按 terminal 独立配置。
- platform default terminal MFA policy 用作新租户或未配置租户的默认值，不是强制最低安全基线。
- tenant terminal MFA policy 是 TENANT scope account 登录时的最终优先策略；租户可以按 terminal 覆盖得更严格或更宽松。
- PDA / KIOSK 默认关闭登录 MFA，但模型层允许显式开启。
- PDA / KIOSK 高风险业务动作优先通过业务 step-up、主管确认或审批流设计，不属于常规登录 MFA。
- `permission-service` 不拥有 MFA policy 真相；它只判断管理者是否有权读取或修改 MFA policy。
- user MFA binding 与 tenant / platform MFA policy 是两个不同层次：策略决定是否需要 MFA，binding 决定当前 user 有哪些可用因子。
- `EMAIL_OTP / SMS_OTP` 的 MFA factor challenge 必须由用户显式触发发码；返回 `MFA_REQUIRED` 不等于已发出 OTP。
- `TOTP / BACKUP_CODE` 不依赖 notification dispatch。
- recovery codes 是 TOTP 的恢复与兜底能力，服务端只保存 hash，明文只在生成 / 轮换响应中展示一次。
- step-up MFA 面向已登录敏感操作，不与 login MFA flow 混用。

## 11. Device Context And Trusted Device

设备上下文用于 session 展示、登录历史、审计、trusted-device 与 new-device MFA。

当前稳定边界：

- `auth-service` 通过显式请求字段接收设备上下文，例如 `deviceId`、`deviceName`、`userAgent`、`ipAddress`。
- 当前阶段以 `SelectAccount` / 登录流程相关请求中的显式字段作为设备上下文进入 session 主链的正式入口。
- BFF 可以从 HTTP request 中提取 `user-agent`、client IP 或前端传入的 device 信息，再显式传给 `auth-service`。
- 裸 `ipAddress` 或裸 `userAgent` 不得单独作为 trusted-device 判定依据。
- trusted-device truth 需要以稳定 `deviceId` 等明确设备标识为基础。
- Personal trusted login device 只用于个人化登录环境，例如 Web trusted browser 与 future Mobile remembered app/device。
- PDA / KIOSK 受管设备不作为某个 user 的 personal trusted login device，不提供“信任此 PDA / KIOSK”或 remember MFA 语义。
- 受管终端设备是否 active、disabled、lost、bound 或 retired 的真相归 `terminal-device-service`；`auth-service` 只消费其状态与 `terminalDeviceId` 引用。

未来若要把设备上下文改为统一 gRPC metadata、operator context 或 `src/common` 自动传播机制，必须先走项目级 architecture / common 设计；`auth-service` 单服务线程不得私自扩展共享上下文结构。

## 12. Self-service And Admin-management Boundary

`auth-service` 的接口层必须显式区分 self-service 与 admin-management。

Self-service 默认语义：

- 当前用户修改自己的密码。
- 当前用户管理自己的 login methods。
- 当前用户管理自己的 MFA binding。
- 当前用户查看和管理自己的 sessions。
- 当前用户查看自己的 login history。
- target 必须由当前 session / operator context 解析，不接受前端任意指定他人 target。
- 不默认要求管理员 permission code，但仍必须满足安全策略、白名单动作与审计要求。

Admin-management 默认语义：

- 管理员查看或治理目标用户 sessions。
- 管理员撤销目标 session。
- 管理员按 user / account / tenant / terminal / terminalDeviceId 筛选 sessions。
- 管理员撤销指定 user 的全部 sessions。
- 管理员要求目标用户重设密码。
- 管理员启用 / 停用目标用户 login method。
- 管理员读取或修改 tenant / platform MFA policy。
- 平台管理员读取或修改 platform terminal entry login policy 与 platform default terminal MFA policy。
- 必须经过 `RBAC + scope / resource` 授权判定，并记录审计。

Phase 2 管理员 session 写操作不提供按筛选结果、terminal、terminalDeviceId 或 tenant 的任意批量 revoke。

application / domain 层可以复用底层业务逻辑，但 BFF / gRPC / interface 层不得长期复用同一个权限门承载 self-service 与 admin-management。

历史混合接口只作为迁移债，不得继续扩展。该迁移由 [self-service-admin-boundary-migration.md](/Users/acehood/Documents/GitHub/oes/docs/plans/features/self-service-admin-boundary-migration.md) 持续跟踪，而不是在各服务中分别维护孤立清单。

## 13. Audit Facts

`auth-service` owns local authentication and session audit facts。

稳定规则：

- 所有认证、安全与 session 状态变化都应记录认证域本地审计事实。
- 审计事实应尽量携带 `operatorId`、`userId`、`accountId`、`scopeLevel`、`tenantId`、`orgId`、`sessionId`、`terminal`、`loginFlow`、`terminalDeviceId`、`deviceBoundTenantId`、`traceId` 与设备上下文摘要。
- tenant-bound 审计查询必须按 operator scope 收敛。
- system scope 可按授权查询全局认证域审计。
- 未来集中审计平台可以聚合、索引、归档、检索或展示认证域审计事实，但不接管 `auth-service` 的本地审计事实 owner。
- login history 是认证域审计事实的产品化、脱敏查询视图，不另立第二套登录历史真相。
- 普通 login history 不展示每次 access token validate 或 refresh 成功；refresh replay、session revoke、设备状态触发清退等安全事件进入 security activity 或管理员审计视图。

## 14. External Interfaces

典型上游入口：

- `api-gateway`
- Auth BFF
- tenant-web / platform web through BFF
- 受控内部服务

典型契约位置：

- [auth-service/login.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/auth-service/login.md)
- [auth-service/session.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/auth-service/session.md)
- [auth-service/mfa.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/auth-service/mfa.md)
- [auth-service/audit.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/auth-service/audit.md)
- [auth-service/terminal-login-policy.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/auth-service/terminal-login-policy.md)
- [auth-service/terminal-mfa-policy.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/auth-service/terminal-mfa-policy.md)
- [auth-service/session-management.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/auth-service/session-management.md)
- [auth-service/login-history.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/auth-service/login-history.md)
- [auth-service/trusted-login-device.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/auth-service/trusted-login-device.md)

相关 BFF contract：

- [auth-bff-login.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/api-gateway/auth-bff-login.md)
- [auth-bff-self-service.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/api-gateway/auth-bff-self-service.md)
- [auth-bff-admin-security.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/api-gateway/auth-bff-admin-security.md)
- [account-security-bff.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/api-gateway/account-security-bff.md)
- [platform-auth-security-bff.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/api-gateway/platform-auth-security-bff.md)
- [access-summary.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/api-gateway/access-summary.md)

Contract 文档只描述黑盒调用语义、字段、错误与当前接口形状；不得重新定义本文中的服务 owner、核心对象或长期边界。

## 15. Upstream Dependencies

- `identity-service`
  - 提供 user、account、login target 相关身份映射与展示查询支撑。
  - 提供当前 user 可用 account context 列表与 account 摘要。
  - 拥有联系资产主数据与账号展示资料真相。
- `tenant-org-service`
  - 提供 tenant lifecycle、tenant 摘要、org tree 与组织上下文支撑。
  - 为 TENANT scope session 建立、refresh、validate 与 context switch 提供 tenant status 校验依据。
- `permission-service`
  - 为 admin-management、terminal login policy、MFA policy 管理、audit 查询等受保护管理能力提供授权判定。
  - 提供 access summary 与导航授权支撑，但不拥有 session context；permission 侧核心对象与 owner 边界以 [permission-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/permission-service.md) 为准。
- `terminal-device-service`
  - 提供受管终端设备状态、设备绑定 tenant 与设备不可登录事件。
  - 不拥有 auth session、token、MFA、trusted login device 或认证审计真相。
- `notification-service`
  - 提供 OTP、安全提醒等通知 dispatch 能力。
  - 不接管 OTP、challenge 或认证结果真相。
- `api-gateway` / BFF
  - 提供 HTTP contract、防腐层、captcha、前端响应聚合、session context view 与 access summary 聚合。

## 16. Downstream / Published Facts

- 主认证结果。
- 认证续流状态。
- challenge 是否存在、是否已完成、是否过期。
- 当前 session 是否有效。
- 当前 session context 摘要。
- terminal-aware session metadata。
- access token 与 refresh token 签发结果。
- refresh token rotation 与 replay 处理结果。
- account selection / context switch 后的 session 更新结果。
- MFA policy 与 MFA binding 查询结果。
- Terminal Entry Login Policy 与 Terminal MFA Policy 查询结果。
- step-up MFA grant 结果。
- 登录历史与认证域本地审计查询结果。

## 17. Non-goals

- 不直接暴露外部 HTTP API；外部客户端统一通过 Gateway / BFF。
- 不拥有前端 shell、导航菜单、权限摘要或页面聚合模型。
- 不复制 `identity-service` 的 user / account / contact asset 主数据。
- 不复制 `tenant-org-service` 的 tenant / org 主数据。
- 不复制 `permission-service` 的 role / policy / authorization truth。
- 不复制 `terminal-device-service` 的 managed terminal device registry、设备绑定、设备状态或版本策略真相。
- 不直接对接 Email / SMS provider。
- 不将 local notification fallback 视为长期平台通知边界。
- 不在本文冻结 Redis、Prisma 或其他存储实现方案。
- 不把基础 self-service 能力建模为普通 RBAC 岗位权限。
- 不让租户配置 primary login method。
- 不把 PDA / KIOSK 受管设备作为 personal trusted login device。
- 不通过 service-local docs、feature packet 或 contract 文档长期承载第二份 auth-service 服务设计。

## 18. Current Stage And Cleanup Rules

当前 `auth-service` 仍处于唯一真相元整理与历史文档收敛阶段：

- 本文已承接长期服务设计真相。
- `docs/contracts/auth-service/**` 继续作为黑盒 contract 真相，但不得重新定义服务职责。
- `docs/architecture/collaborations/**` 继续作为跨服务协同蓝图，但不得重新定义 `auth-service` owner 语义。
- `src/services/system/auth-service/doc/**` 中的旧 design、task、history、overview、roadmap 只作为本次提炼来源与历史记录，不再作为稳定设计入口。
- 服务内旧 docs 在提炼完成后应删除，或最多保留一个极短 README 指向本文与 contract 入口。
- self-service / admin-management 拆分由 [self-service-admin-boundary-migration.md](/Users/acehood/Documents/GitHub/oes/docs/plans/features/self-service-admin-boundary-migration.md) 持续推进，避免在各服务中分别维护孤立迁移清单。
