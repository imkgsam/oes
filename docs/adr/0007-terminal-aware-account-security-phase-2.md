# ADR 0007: Terminal-aware Account Security Phase 2

日期：2026-05-16

## Status

Accepted

## Context

OES 已经冻结 Terminal Access Policy 与受管终端设备治理方向：

- Terminal Access Policy 由 `permission-service` 拥有，用于判断某个 account 是否允许从某类 terminal 建立或继续 session。
- `terminal-device-service` 负责企业受管共享终端设备，例如 PDA、KIOSK、工业平板。
- `auth-service` 拥有认证、session、token、MFA、trusted login device、登录历史与认证域审计事实。

Terminal-aware Account Security Phase 2 需要补齐账号安全、登录安全、会话治理与 terminal-aware 安全策略，同时避免把受管终端设备、账号安全 trusted device、登录方式配置和权限准入混为一谈。

## Decision

OES 采用以下设计：

- `auth-service` 拥有 terminal-aware session、platform terminal entry login policy、terminal MFA policy、trusted login device、登录历史视图与认证域审计事实。
- `permission-service` 继续只拥有 Terminal Access Policy 与管理操作授权判定，不拥有认证策略真相。
- `identity-service` 提供 user/account、account 候选、员工绑定等身份事实，不拥有认证流程、MFA、session 或 terminal policy。
- `terminal-device-service` 提供受管终端设备状态与设备绑定租户事实，不拥有 auth session、token、MFA 或 trusted login device。
- API Gateway / BFF 固定可信 terminal，承载 HTTP contract 与聚合，不承载核心认证规则。

## Login Method And Terminal Entry Policy

租户不配置 primary login method。

平台级 `Terminal Entry Login Policy` 定义每类 terminal 的固定登录入口允许哪些已实现 primary login flow，例如：

- `WEB`: email password、email OTP、phone password、phone OTP，未来 Google / WeChat / SSO / passkey。
- `PDA`: password 作为过渡，未来 employee code + PIN、badge + PIN。
- `KIOSK`: 未来 employee code + PIN、badge + PIN。

该策略是平台级能力，由平台管理员配置。租户管理员不配置 primary login method，也不通过 terminal entry 间接配置 login method。

Terminal Entry Login Policy 不改变各前端固定登录流程，只控制对应入口是否显示 / 可用，以及后端是否接受该 flow。

## Web And PDA Login Shape

Web 登录保持现有多登录入口与 account selection：

```text
WEB BFF 固定 terminal=WEB
-> auth-service 检查 WEB login flow 是否平台启用
-> user primary authentication
-> account selection
-> terminal access check
-> terminal MFA policy
-> session issuance
```

PDA 登录由受管设备绑定租户决定，用户登录时不选择租户：

```text
PDA BFF / terminal-device-service 确认 device-bound tenant
-> PDA BFF 固定 terminal=PDA 并传入 terminalDeviceId / deviceBoundTenantId
-> auth-service 检查 PDA login flow 是否平台启用
-> user primary authentication
-> 在 device-bound tenant 内解析唯一可 PDA 登录 account
-> terminal access check
-> terminal MFA policy
-> session issuance
```

PDA Phase 2 不提供 account selection。用户在设备绑定 tenant 内必须解析出唯一可 PDA 登录 account；没有或多个可用 PDA account 时拒绝登录，并要求后台治理收敛。

## MFA Policy

不设计全局 MFA 开关。

MFA 直接按 terminal 配置：

- 平台级提供默认 `TerminalMfaPolicy`，用于新租户或未配置租户的默认值。
- 租户级保存自己的 `TerminalMfaPolicy`。
- 最终执行时，优先使用租户配置；租户未配置时使用平台默认。

平台默认不是强制最低基线。租户可以按 terminal 覆盖为更严格或更宽松。未来若需要平台强制安全底线，应另行设计 minimum security baseline。

PDA / KIOSK 理论上支持 MFA 开关，但默认关闭。租户显式开启 PDA / KIOSK MFA 时，管理 UI 应提示其会影响一线终端登录效率。

## Session And Login History

auth session 必须记录：

- `terminal`
- `loginFlow`
- `userId`
- `accountId`
- `tenantId`

PDA session 额外记录：

- `terminalDeviceId`
- `deviceBoundTenantId`

session 不复制完整设备 registry 信息；设备名称、状态、版本策略、绑定治理等真相仍归 `terminal-device-service`。

PDA session lifetime 使用作业终端短会话策略：access token 默认 15 分钟，refresh token 默认 20 分钟；PDA 端 15 分钟无操作应主动 logout。PDA App 关闭后不恢复用户登录态，只恢复设备 enrollment / `terminalDeviceId`，重新打开 App 必须重新登录。Web session 继续沿用 Web 的通用 refresh 策略。

登录历史归 `auth-service`，本质上是认证域审计事实的产品化、脱敏查询视图。普通 login history 不展示每次 refresh / access token validate，只展示登录成功、失败、拒绝、MFA 结果等用户可理解事件。refresh replay、session revoke 等安全事件可进入 security activity 视图。

## Trusted Login Device

personal trusted login device 只用于个人化登录环境，例如 Web trusted browser，未来可扩展到 Mobile remembered app/device。

PDA / KIOSK 受管设备不作为某个 user 的 personal trusted login device：

- PDA / KIOSK 可以是企业受管可信设备。
- PDA / KIOSK 不提供“某个用户信任此设备”、“remember MFA on this device”或个人 trusted device 语义。

## Session Management

Phase 2 session 管理收敛为：

- 用户查看自己的 active sessions。
- 用户退出全部 sessions 或指定 session。
- 管理员按 user / account / tenant / terminal / terminalDeviceId 等字段筛选 active sessions。
- 管理员清退指定 session 或指定 user 的全部 sessions。

Phase 2 不提供按筛选结果、terminal、terminalDeviceId、tenant 等维度的管理员批量清退按钮。

## Managed Terminal Device Session Cleanup

受管终端设备进入不可登录状态后，需要主动清退该 `terminalDeviceId` 关联的 auth sessions。

设计边界：

- `terminal-device-service` 拥有设备状态真相，并在设备禁用、丢失、解绑或退役时发布设备状态事件。
- `auth-service` 消费事件后，按 `terminalDeviceId` 幂等清退相关 active sessions，并记录认证安全审计。
- PDA login / refresh / bootstrap 仍应重查设备状态，作为事件延迟或失败时的兜底。

## Consequences

正向影响：

- Web 登录流程与 PDA 一线登录流程保持各自产品形态。
- 租户不配置 primary login method，避免多 account user 在 account selection 后被不同租户 login method policy 反悔拦截。
- MFA 模型统一支持所有 terminal，同时默认保护 PDA / KIOSK 一线效率。
- personal trusted device 与 managed terminal device 明确分离。
- 设备禁用可触发主动 session 清退，但 session truth 仍归 `auth-service`。

代价：

- 需要新增 auth-service 平台级 terminal login policy、terminal MFA policy 与相关管理契约。
- PDA 登录链路必须消费受管设备绑定租户事实，并处理唯一可 PDA account 解析。
- 需要 terminal-device-service 与 auth-service 之间的设备状态事件协同。

## Alternatives Considered

### 租户配置 primary login method

拒绝。若 user 先用 OTP 证明身份，再选择一个不允许 OTP 的租户 account，会产生不直观的反悔拦截。租户安全差异在 Phase 2 通过 terminal MFA、session policy、Terminal Access Policy 与权限治理表达。

### PDA / KIOSK 不支持 MFA

拒绝。模型层应统一支持所有 terminal 的 MFA 开关；PDA / KIOSK 只是默认关闭，且不建议常规启用。

### PDA / KIOSK 作为 personal trusted login device

拒绝。PDA / KIOSK 多为共享设备，企业受管可信不等于某个 user 的个人可信登录环境。

### 管理员按 terminal / device 批量清退 sessions

拒绝作为 Phase 2 管理页面能力。读侧支持筛选，写侧只支持指定 session 与指定 user 全量清退。设备状态生命周期触发的自动清退属于设备安全联动，不暴露为任意筛选批量操作。

## Related Documents

- [auth-service.md](../architecture/services/auth-service.md)
- [permission-service.md](../architecture/services/permission-service.md)
- [identity-service.md](../architecture/services/identity-service.md)
- [terminal-access-policy.md](../architecture/collaborations/terminal-access-policy.md)
- [managed-terminal-device-management.md](../architecture/collaborations/managed-terminal-device-management.md)
