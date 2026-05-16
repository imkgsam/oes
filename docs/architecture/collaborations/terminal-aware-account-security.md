# Terminal-aware Account Security 协同蓝图

> `auth-service` 的服务设计唯一真相源为 [auth-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/auth-service.md)。本文只记录 terminal-aware account security 在 `auth-service`、`permission-service`、`identity-service`、`terminal-device-service` 与 BFF 之间的协同方式，不重新定义单服务 owner 边界。

## 1. 目标

本文冻结 OES Terminal-aware Account Security Phase 2 的跨服务协同方式，覆盖：

- terminal-aware session
- platform terminal entry login policy
- terminal-aware MFA policy
- login history / security activity
- trusted login device 与 managed terminal device 边界
- Web / PDA 登录链路差异
- 受管终端设备状态与 auth session 清退联动

## 2. 参与方

- `api-gateway` / terminal-specific BFF
- `auth-service`
- `permission-service`
- `identity-service`
- `terminal-device-service`
- Web / PDA / KIOSK / future Mobile 前端

## 3. 真相归属

`auth-service` owns：

- active session truth
- token / refresh / session validation
- user credential / authenticator
- platform terminal entry login policy
- platform default terminal MFA policy
- tenant terminal MFA policy
- personal trusted login device
- login history 视图与认证域本地审计事实
- terminal-device session cleanup 的执行结果

`permission-service` owns：

- Terminal Access Policy
- role / account terminal access facts
- management 操作授权判定
- permission code / role / policy truth

`identity-service` owns：

- user / account identity facts
- user account 候选与展示摘要
- account enabled state 与 tenant 引用
- employee binding 查询事实；`Employee / Employment` 仍以 HR 服务设计为准

`terminal-device-service` owns：

- managed terminal device registry
- 设备绑定 tenant
- 设备状态，例如 active / disabled / lost / unbound / retired
- 设备版本、入网、运行快照与设备治理审计

`api-gateway` / BFF owns：

- 外部 HTTP contract
- terminal-specific 入口
- 可信 terminal 归一化
- 前端展示聚合
- DTO 校验与下游编排

BFF 不拥有认证、MFA、session、Terminal Access Policy 或设备 registry 真相。

## 4. Terminal Entry Login Policy

Terminal Entry Login Policy 是平台级认证入口策略，定义每类 terminal 的固定前端登录入口允许哪些已实现 primary login flow。

稳定规则：

- 策略真相归 `auth-service`。
- 由平台管理员配置。
- 租户管理员不配置 primary login method。
- 策略只启停已实现 login flow。
- 未实现的 employee code + PIN、badge + PIN、SSO、passkey 不应作为可启用开关；可作为 planned/disabled 展示或不展示。
- 策略不改变各前端固定登录流程，只控制入口可用性与后端准入。

示例：

```text
WEB:
  EMAIL_PASSWORD
  EMAIL_OTP
  PHONE_PASSWORD
  PHONE_OTP

PDA:
  PASSWORD

KIOSK:
  none in Phase 2, future EMPLOYEE_CODE_PIN / BADGE_PIN
```

## 5. Web Login 协同

Web 登录继续保持现有固定入口与多 account selection。

```text
tenant-web
-> /auth/* BFF, terminal=WEB
-> auth-service checks WEB login flow is enabled
-> auth-service verifies user credential / authenticator
-> identity-service returns account candidates
-> user selects account
-> auth-service validates account ownership, account enabled state, tenant lifecycle
-> permission-service resolves Terminal Access Policy
-> auth-service resolves tenant terminal MFA policy
-> session issued
```

Web 支持 login MFA、new-device MFA、trusted browser 与 future passkey / SSO / social login；这些能力按专项 contract 与实现阶段演进。

## 6. PDA Login 协同

PDA 登录租户由受管设备绑定决定，用户登录时不选择租户。

```text
PDA App
-> /pda/* BFF, terminal=PDA
-> BFF / terminal-device-service confirms terminalDeviceId and deviceBoundTenantId
-> auth-service checks PDA login flow is enabled
-> auth-service verifies user credential / authenticator
-> identity-service resolves accounts for user under deviceBoundTenantId
-> permission-service resolves Terminal Access Policy for candidate accounts
-> exactly one PDA-allowed account must remain
-> auth-service resolves terminal MFA policy; PDA default is false
-> session issued with terminalDeviceId and deviceBoundTenantId
```

稳定规则：

- PDA Phase 2 不提供 account selection。
- 没有可 PDA 登录 account 时拒绝登录。
- 多个可 PDA 登录 account 时拒绝登录，并要求后台治理收敛。
- PDA 常规登录 MFA 默认关闭，但模型层支持租户按 terminal 显式开启。

## 7. Terminal MFA Policy

不设计全局 MFA 开关。

MFA 直接按 terminal 配置：

- 平台级提供默认 `TerminalMfaPolicy`。
- 租户级保存自己的 `TerminalMfaPolicy`。
- 最终执行优先租户配置；租户未配置时使用平台默认。
- 平台默认不是强制最低基线，租户可更严格或更宽松。

PDA / KIOSK 默认关闭 MFA。若租户显式开启 PDA / KIOSK MFA，管理 UI 应提示该配置会影响一线终端效率。

## 8. Session Model

所有 auth session 必须记录：

- `terminal`
- `loginFlow`
- `userId`
- `accountId`
- `tenantId`

PDA / KIOSK 等受管终端 session 额外记录：

- `terminalDeviceId`
- `deviceBoundTenantId`

session 可以保留少量登录时设备摘要用于展示和审计，但不得复制设备 registry、绑定状态、版本策略或维修/丢失治理真相。

## 9. Login History And Security Activity

`auth-service` 统一记录认证域本地审计事实。

Login history 是认证域审计事实的产品化脱敏视图，不另立第二套真相。

普通 login history 展示：

- 登录成功
- 登录失败
- 登录被拒绝，例如 disabled login flow、terminal access denied、PDA 无可用 account、PDA 多 account 冲突
- MFA 成功 / 失败

普通 login history 不展示：

- 每次 access token validate
- 每次 refresh 成功
- PDA heartbeat
- 设备诊断上报

refresh replay、session revoke、设备状态触发 session cleanup 等进入 security activity 或管理员审计视图。

## 10. Trusted Login Device Boundary

Personal trusted login device 只用于个人化登录环境：

- Web trusted browser
- future Mobile remembered app/device

PDA / KIOSK 不支持个人 trusted login device：

- 不提供“信任此 PDA / KIOSK”
- 不提供 remember MFA on PDA / KIOSK
- 不把 PDA / KIOSK 受管设备列为 user personal trusted device

PDA / KIOSK 可以是企业受管可信设备，该真相归 `terminal-device-service`。

## 11. Session Management

用户自助能力：

- 查看自己的 active sessions。
- 退出全部 sessions。
- 退出指定 session。

管理员能力：

- 按 user / account / tenant / terminal / terminalDeviceId 等字段筛选 active sessions。
- 清退指定 session。
- 清退指定 user 的全部 sessions。

Phase 2 不提供管理员按筛选结果、terminal、terminalDeviceId、tenant 等维度批量清退。

## 12. Device State And Session Cleanup

受管终端设备进入不可登录状态后，应主动清退该 `terminalDeviceId` 关联的 auth sessions。

推荐协同：

```text
terminal-device-service publishes device status event
-> auth-service consumes event
-> auth-service revokes active sessions matching terminalDeviceId
-> auth-service records security audit
```

PDA login / refresh / bootstrap 仍应重查设备状态，作为事件延迟、失败或重试时的兜底。

## 13. 明确禁止

- 禁止租户配置 primary login method。
- 禁止把 Terminal Entry Login Policy 写成每租户、每 account 或每设备的 login method override。
- 禁止 PDA / KIOSK 常规登录默认 MFA。
- 禁止把 PDA / KIOSK 受管设备作为 personal trusted login device。
- 禁止 terminal-device-service 直接写 auth session 数据。
- 禁止 BFF 承载核心认证、安全策略或设备状态真相。

## 14. 关联文档

- [ADR 0007](/Users/acehood/Documents/GitHub/oes/docs/adr/0007-terminal-aware-account-security-phase-2.md)
- [auth-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/auth-service.md)
- [permission-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/permission-service.md)
- [identity-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/identity-service.md)
- [terminal-access-policy.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/collaborations/terminal-access-policy.md)
- [managed-terminal-device-management.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/collaborations/managed-terminal-device-management.md)
