# Login Method Management

> 涉及 permission code、checkPermission、self-service capability 或授权判定的服务设计边界，以 [permission-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/permission-service.md) 与项目级授权架构为准。本文只记录 Login Method Management feature 的范围与状态。

## 1. 目标

- 提供统一的登录方式管理能力，让用户可以自助管理自己的登录邮箱、登录手机号与密码状态。
- 提供管理员治理入口，让管理员可以查看并治理目标用户的登录方式，但不能直接设置或传播明文密码。
- 明确 `user` 级登录身份、`account` 级工作身份、MFA 因子与会话管理之间的边界。
- 复用当前统一认证主链、首次登录密码设置、OTP、MFA 与审计底座，而不是在前端伪造登录方式配置状态。

## 2. 不做什么

- 不在第一版支持 OAuth / 第三方登录绑定。
- 不在第一版支持自助注册。
- 不在第一版实现完整公网找回密码流程。
- 不在第一版做租户级登录策略配置，例如强制 MFA、密码复杂度策略或登录方式白名单。
- 不允许管理员直接设置、查看、生成或发送用户明文密码。
- 不把企业工作邮箱、工作手机号当作登录方式直接修改。
- 不把 MFA 管理并入登录方式管理；MFA 仍由安全中心的 MFA 能力承接。

## 3. 上游依赖

- architecture:
  - [16-unified-web-account-context-architecture.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/16-unified-web-account-context-architecture.md)
  - [11-gateway-and-bff-architecture.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/11-gateway-and-bff-architecture.md)
  - [15-authorization-layering-and-resource-policy-architecture.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/15-authorization-layering-and-resource-policy-architecture.md)
- services:
  - [auth-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/auth-service.md)
  - [identity-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/identity-service.md)
- collaborations:
  - [authentication-and-identity.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/collaborations/authentication-and-identity.md)
- contracts:
  - [auth-bff-self-service.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/api-gateway/auth-bff-self-service.md)
  - [auth-bff-admin-security.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/api-gateway/auth-bff-admin-security.md)
  - [login.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/auth-service/login.md)
  - [mfa.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/auth-service/mfa.md)
  - [session.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/auth-service/session.md)
- adr:
  - [0001-unified-web-scope-aware-user-account.md](/Users/acehood/Documents/GitHub/oes/docs/adr/0001-unified-web-scope-aware-user-account.md)

## 4. 当前结论

- 登录方式属于 `auth-service` 的认证真相，不属于 `identity-service` 的账号资料真相。
- 登录方式是 `user` 级能力，不随当前选择的 `account` 改变；同一个 user 在不同 account / tenant context 下使用同一组登录方式完成主认证。
- 登录邮箱、登录手机号如果作为登录标识，必须经过认证验证流程后才能成为已验证登录方式。
- 当前 `identity-service` 中的用户邮箱 / 手机可以作为展示资料或创建账号输入，但不能绕过 `auth-service` 直接成为登录方式真相。
- 密码在产品语义上是统一用户密码，不暴露为“邮箱密码”或“手机密码”。
- 现有 schema 中 `Credential` 挂在 `LoginMethod` 下，第一版可以兼容该结构；设置或重设密码时，应同步到该 user 已验证且启用的 `EMAIL / PHONE` 登录方式，避免用户理解成多套密码。
- 管理员重设密码采用“要求用户下次登录设置密码”语义，不生成明文初始密码。
- 当前“是否需要设置密码”不能长期只靠“是否存在 password credential”推断；管理员要求重设密码需要显式状态、原因、操作者与审计。
- 用户自助接口只做 self-bound 认证，不依赖业务权限码。
- 自助与管理员能力可以复用下层 application / domain 逻辑，但不得复用同一条接口层权限门。
- 若 tenant / system 需要限制某项自助安全能力，应通过 self-service policy / capability 表达，而不是复用管理员权限码。
- 管理员接口必须通过 BFF 做 account / user 解析与 operator scope 收敛，不允许前端直接调用内部 gRPC。

## 5. 契约真相位置

- 自助登录方式管理的 BFF 契约已回写到 [auth-bff-self-service.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/api-gateway/auth-bff-self-service.md)。
- 管理员登录方式治理的 BFF 契约已回写到 [auth-bff-admin-security.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/api-gateway/auth-bff-admin-security.md)。
- `auth-service` 内部 gRPC 契约已回写到 [login.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/auth-service/login.md)。
- `PasswordSetupRequirement` 持久模型已进入 auth-service runtime；长期职责仍以 auth-service 服务真相源为准。

### 5.1 状态校准记录

Status, 2026-06-07:

- `auth-service` 已存在 `ListLoginMethods`、`ChangeOwnPassword`、`RequirePasswordSetup` 与 `SetLoginMethodEnabled` 相关 command / query / gRPC controller / repository / tests。
- API Gateway 已存在 self-service HTTP API：`GET /auth/login-methods`、`POST /auth/password/change`、`POST /auth/login-methods/:methodId/enable`、`POST /auth/login-methods/:methodId/disable`。
- API Gateway 已存在 admin HTTP API：`GET /auth/admin/accounts/:accountId/login-methods`、`POST /auth/admin/accounts/:accountId/password/setup-required`、`POST /auth/admin/accounts/:accountId/login-methods/:methodId/enable|disable`。
- tenant-web 已存在 self-service security center 登录方式 API / 页面接入，以及 account-management 管理员登录方式区块。
- 本次已完成 fresh verification，当前 V1A 状态为 `completed / closed`。

Fresh verification:

- `pnpm --filter auth-service exec jest auth.grpc.controller list-login-methods change-own-password require-password-setup set-login-method-enabled password-setup-requirement --runInBand` passed: 6 suites / 47 tests.
- `pnpm --filter api-gateway exec jest auth.controller session-self-service admin-security auth-grpc.adapter --runInBand` passed: 5 suites / 53 tests.
- `pnpm --dir app/web test:unit apps/tenant-web/src/views/_core/profile/security-center.layout.spec.ts apps/tenant-web/src/views/admin/account-management.spec.ts apps/tenant-web/src/api/bff/security/index.spec.ts apps/tenant-web/src/api/bff/admin-security/index.spec.ts` passed: 2 files / 22 tests. Local Node emitted the existing engine warning because current Node is `v25.5.0` while app/web declares `^20.19.0 || ^22.18.0 || ^24.0.0`.

## 6. 线程分工

| Thread / Owner | 职责 | 允许修改路径 | 输入 | 输出 | 状态 |
| --- | --- | --- | --- | --- | --- |
| design owner | 冻结登录方式管理目标、边界、安全规则、V1 slice 与后续拆分 | `docs/plans/features/**`, 必要时 `docs/contracts/**` | 当前 feature 讨论、现有认证与个人中心能力 | 当前 feature packet | completed |
| contract owner | 冻结自助与管理员 BFF 黑盒契约，补 auth-service gRPC 契约 | `docs/contracts/**`, `src/common/src/contracts/auth_service/**` | 当前 feature packet | 契约文档与 proto 变更计划 | completed |
| auth-service owner | 实现登录方式 read model、密码变更、密码重设要求、登录方式启停与审计 | `src/services/system/auth-service/**` | contracts / feature packet | 可测试认证服务能力 | completed |
| api-gateway owner | 编排 self/admin HTTP API，做 account -> user 解析与 operator scope 限制 | `src/services/api-gateway/src/modules/auth-bff/**` | auth-service / identity-service 契约 | BFF 黑盒能力 | completed |
| tenant-web owner | 接入个人安全中心与账号管理页登录方式区块 | `app/web/apps/tenant-web/**` | BFF 契约 | 用户侧与管理员侧页面 | completed |
| review / integration owner | 检查安全规则、审计、权限、会话影响与端到端行为 | 只读全局，必要时最小修正 | 各实现输出 | 验证结论与关闭判断 | completed |

## 7. 当前 slice

- slice:
  - V1A: 登录方式只读模型 + 用户自助修改密码 + 管理员要求重设密码
- scope:
  - `GET self login-methods`
  - `GET admin account login-methods`
  - 用户修改密码
  - 管理员要求用户重设密码
  - 登录后 password setup required gating
  - 审计事件
- ready definition:
  - 自助页可以展示真实登录方式状态
  - 管理员页可以查看目标账号对应 user 的登录方式状态
  - 用户可以安全修改密码
  - 管理员可以要求用户下次登录重设密码，且不产生明文密码
  - 所有 mutation 有审计记录

## 8. 主线范围

- 本线程主线：
  - 登录方式管理 feature 的 V1A 方案与实现状态校准
  - 自助与管理员两个入口
  - 密码安全语义
  - V1B 绑定 / 更换邮箱手机号后置边界
- 本线程不做：
  - 新增 V1B 邮箱 / 手机号更换流程
  - 新增 OAuth / 第三方登录绑定
  - 新增租户级登录策略
  - 在未 fresh verification 前声明 fully closed
- 偏移返回条件：
  - 若实现需要改变 `user` / `account` / `tenant` 归属语义，暂停并升级到 architecture / ADR。
  - 若需要让管理员直接设置明文密码，暂停并重新评估安全设计。
  - 若需要引入 OAuth 或租户级登录策略，迁出为独立 feature。

## 9. V1 能力设计

### 9.1 用户自助能力

- 查看自己的登录方式：
  - 登录邮箱
  - 登录手机号
  - 密码状态
  - 是否启用
  - 是否已验证
- 修改密码：
  - 默认要求当前密码。
  - 后续可以支持“近期 MFA 验证”替代当前密码，但不进入 V1A。
- 停用登录方式：
  - 不能停用最后一个可用登录方式。
  - 若停用登录方式会影响当前 session 的登录方法，应提示并要求重新登录或刷新安全状态。
- 绑定 / 更换邮箱与手机号：
  - 进入 V1B。
  - 必须通过 OTP 验证新标识后才能生效。

### 9.2 管理员能力

- 查看目标 account 对应 user 的登录方式。
- 要求目标 user 下次登录重设密码。
- 启用 / 停用目标 user 的登录方式。
- 管理员新增或更换登录邮箱 / 手机号进入 V1B：
  - 管理员只能发起绑定或验证流程。
  - 新标识在用户或通知通道验证前不能成为已验证登录方式。
- 管理员操作默认写审计事件。
- 管理员要求重设密码后，建议撤销目标 user 的现有活跃 sessions；如果不撤销，必须至少让 refresh 后的 session context 返回 `passwordSetupRequired`。

## 10. 建议接口草案

### 10.1 自助 BFF API

```http
GET  /api/v1/auth/login-methods
POST /api/v1/auth/password/change
POST /api/v1/auth/login-methods/:methodId/enable
POST /api/v1/auth/login-methods/:methodId/disable
```

V1B 再追加：

```http
POST /api/v1/auth/login-methods/email/verification
POST /api/v1/auth/login-methods/email/confirm
POST /api/v1/auth/login-methods/phone/verification
POST /api/v1/auth/login-methods/phone/confirm
```

### 10.2 管理员 BFF API

```http
GET  /api/v1/auth/admin/accounts/:accountId/login-methods
POST /api/v1/auth/admin/accounts/:accountId/password/setup-required
POST /api/v1/auth/admin/accounts/:accountId/login-methods/:methodId/enable
POST /api/v1/auth/admin/accounts/:accountId/login-methods/:methodId/disable
```

V1B 再追加：

```http
POST /api/v1/auth/admin/accounts/:accountId/login-methods/email
POST /api/v1/auth/admin/accounts/:accountId/login-methods/phone
```

### 10.3 Auth Service 能力

- `ListLoginMethodsByUser`
- `ChangeOwnPassword`
- `RequirePasswordSetup`
- `SetLoginMethodEnabled`
- V1B:
  - `RequestLoginIdentifierVerification`
  - `ConfirmLoginIdentifierVerification`

## 11. 权限设计

- 自助接口：
  - authenticated session 即可。
  - 语义上是 self-bound，不走 `checkPermission`。
  - 不得复用管理员 `auth.login_method.manage` 或同类权限码作为前置条件。
- 管理员接口：
  - 建议新增权限码：
    - `auth.login_method.read`
    - `auth.login_method.manage`
    - `auth.password.require_setup`
  - 平台管理员可跨租户管理。
  - 租户管理员只能管理当前租户可见 account 对应的 user。
  - BFF 必须通过 `identity-service` 查询 `accountId -> userId / tenantId / scopeLevel` 后再下发 auth-service mutation。

## 12. 安全规则

- 不允许删除或停用最后一个可用登录方式。
- 自助修改邮箱 / 手机号必须验证新标识。
- 修改密码必须校验当前密码；后续支持近期 MFA 时也必须有明确 challenge 记录。
- 管理员不能设置明文密码。
- 管理员不能看到 password hash、OTP、credential secret。
- 管理员要求重设密码必须写审计事件。
- 登录方式启停必须写审计事件。
- OTP 发送必须复用现有限流与挑战机制。
- 登录方式状态改变后，需要明确是否撤销目标用户现有 sessions。
- 响应体永远不返回 credential secret、password hash、OTP、TOTP secret 或 recovery code 已存储值。

## 13. 阻塞 / 依赖

- 当前个人中心 / 安全中心已有登录方式管理入口。
- 当前安全中心已有 MFA、会话与恢复码管理，不应把这些能力重复搬进登录方式管理。
- 当前管理员账号管理页已存在登录方式治理区块。
- 当前 `auth-service` 仍主要靠 `LoginMethod` 与 `Credential` 表达登录方式和凭据；这是 V1A 兼容结构，不作为 V1B 联系方式更换流程的完整模型。
- V1A 已新增独立 `PasswordSetupRequirement` 持久模型，用于表达管理员重设密码、首次登录补密码和未来安全策略触发的显式 password setup gate。

## 14. 派生问题 Ledger

| 时间 | 问题 | 分类 | 当前影响 | 处理策略 | 目标落点 | 状态 |
| --- | --- | --- | --- | --- | --- | --- |
| 2026-04-20 | 管理员是否可以直接设置用户新密码 | Blocker-Now | 影响安全设计和产品语义 | 已确认不允许；管理员只能要求用户重设密码 | 当前 feature packet | closed |
| 2026-04-20 | 登录邮箱 / 手机号是否与个人资料字段共用真相 | Blocker-Later | 影响 V1B 绑定 / 更换流程 | V1A 不处理更换；V1B 通过 BFF 编排 auth-service 登录方式与 identity-service 展示资料同步 | 当前 feature packet / 后续 contract | open |
| 2026-04-20 | 密码是否属于 user 级还是 login-method 级 | Blocker-Now | 影响用户心智和后端实现 | 产品语义冻结为 user 级统一密码；实现兼容当前 credential schema | 当前 feature packet | closed |
| 2026-04-20 | 启停登录方式后是否踢 session | Blocker-Later | 影响安全体验和实施复杂度 | V1A 要求明确策略；推荐管理员重设密码时撤销目标用户 sessions，普通启停至少刷新 session 安全状态 | auth-service / api-gateway contract | open |
| 2026-04-20 | OAuth 是否进入当前 feature | Sidecar | 会扩大到第三方身份 provider、回调与绑定模型 | 不进入 V1；后续独立 feature | `docs/plans/candidates.md` 或新 feature packet | open |

## 15. 验收标准

- 用户能在个人安全中心看到真实登录方式状态。
- 用户能安全修改自己的密码。
- 管理员能在账号管理上下文中查看目标 user 的登录方式状态。
- 管理员能要求目标 user 下次登录重设密码。
- 管理员要求重设密码后，目标 user 不能绕过密码设置直接进入工作台。
- 管理员不能直接设置或查看用户明文密码。
- 禁用登录方式时，系统能阻止禁用最后一个可用登录方式。
- 所有登录方式 mutation 都有审计记录。
- 自助接口不越权管理其他用户。
- 租户管理员不能管理当前租户可见范围外的 user 登录方式。
- 平台管理员与租户管理员使用同一页面模型，按 operator scope 自适应。

## 16. 关闭条件

- feature packet 已冻结为当前阶段执行真相。
- 自助与管理员 BFF 黑盒契约已回写到 `docs/contracts/api-gateway/**`。
- auth-service 登录方式管理命令 / 查询契约已冻结。
- V1A 代码链路已实现并通过聚焦 fresh verification。
- V1B 绑定 / 更换邮箱手机号流程已单独拆分或明确后置。

## 16.1 关闭结论

- Status: `completed / closed`
- 本 feature packet 已关闭，仅保留为历史执行记录。
- 当前关闭范围为 V1A：登录方式只读模型、用户自助修改密码、登录方式启停、管理员查看目标账号登录方式、管理员要求用户重设密码。
- V1B 邮箱 / 手机号绑定与更换验证、OAuth / 第三方登录绑定、租户级登录策略继续后置，不回流到当前已关闭主线。

## 17. 备注

- 当前 feature 是 `personal-center` 中“登录方式绑定 / 解绑 / 验证流程”的后续独立主线，不应回填到 personal-center 第一阶段中混做。
- 第一版应优先把密码安全语义和登录方式只读真相稳定下来，再推进邮箱 / 手机号更换验证。
- 如果后续引入租户级登录策略，应新建策略 feature，而不是继续扩大当前登录方式管理 packet。
