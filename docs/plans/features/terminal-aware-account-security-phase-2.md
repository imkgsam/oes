# Terminal-aware Account Security Phase 2 Feature Packet

> 服务设计唯一真相源：[auth-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/auth-service.md)。本文只记录 Terminal-aware Account Security Phase 2 的范围、执行阶段与验收要求；服务 owner、核心对象与长期边界不在本文重复定义。

## 1. 目标

冻结并实现 OES 的 terminal-aware 账号安全能力，使 Web、PDA、KIOSK 与 future Mobile 在统一认证边界下拥有清晰的登录方式、MFA、session、登录历史、trusted device 与受管设备协同规则。

## 2. 范围

包含：

- 平台级 Terminal Entry Login Policy。
- 平台默认 Terminal MFA Policy。
- 租户 Terminal MFA Policy。
- terminal-aware session metadata。
- Web 保持 account selection。
- PDA 设备绑定租户，登录时不选择租户。
- PDA 登录后解析唯一可 PDA account。
- 登录历史作为 auth audit 脱敏视图。
- Web trusted browser 与 future Mobile remembered device 边界。
- PDA / KIOSK 不作为 personal trusted login device。
- 用户与管理员 session 列表、筛选和清退能力。
- 受管设备不可登录状态事件触发 auth session cleanup。
- 平台管理员配置页与账号安全 BFF contract。

不包含：

- 租户 primary login method 配置。
- 单台 PDA / KIOSK 登录方式配置。
- user / account 级 terminal login method override。
- PDA / KIOSK account selection。
- PDA / KIOSK 默认登录 MFA。
- SSO / passkey / Google / WeChat 的完整专项设计。
- employee code + PIN、badge + PIN 的完整 HR / badge / PIN credential 设计。
- WMS / MES 高风险业务 step-up、主管确认或审批流。
- 管理员按筛选结果、terminal、terminalDeviceId、tenant 等维度批量清退 session 的页面能力。
- 集中审计平台接管登录历史 owner。

## 3. 设计与契约引用

- 架构决策：[ADR 0007](/Users/acehood/Documents/GitHub/oes/docs/adr/0007-terminal-aware-account-security-phase-2.md)
- 协同蓝图：[terminal-aware-account-security.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/collaborations/terminal-aware-account-security.md)
- auth-service 真相源：[auth-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/auth-service.md)
- Terminal Entry Login Policy contract：[terminal-login-policy.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/auth-service/terminal-login-policy.md)
- Terminal MFA Policy contract：[terminal-mfa-policy.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/auth-service/terminal-mfa-policy.md)
- Session management contract：[session-management.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/auth-service/session-management.md)
- Login history contract：[login-history.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/auth-service/login-history.md)
- Trusted login device contract：[trusted-login-device.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/auth-service/trusted-login-device.md)
- Account Security BFF contract：[account-security-bff.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/api-gateway/account-security-bff.md)
- Platform Auth Security BFF contract：[platform-auth-security-bff.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/api-gateway/platform-auth-security-bff.md)
- PDA Auth BFF contract：[pda-auth-bff-login.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/api-gateway/pda-auth-bff-login.md)

## 4. 核心规则

### 4.1 登录方式

- 用户自己管理 credential / authenticator。
- 租户不配置 primary login method。
- 平台管理员配置每类 terminal 的已实现 login flows。
- Terminal Entry Login Policy 不改变前端固定登录流程。

### 4.2 Web

- Web 保留现有邮箱密码、邮箱 OTP、手机密码、手机 OTP，以及 future Google / WeChat / SSO / passkey 入口。
- Web user 认证成功后可进入 account selection。
- account selection 后执行 Terminal Access Policy 与 Terminal MFA Policy。

### 4.3 PDA

- PDA 登录租户由受管设备绑定决定。
- PDA 用户登录时不选择租户。
- PDA Phase 2 不提供 account selection。
- PDA 用户认证成功后，在 device-bound tenant 内必须解析出唯一可 PDA 登录 account。
- PDA 常规登录 MFA 默认关闭。

### 4.4 MFA

- 不设计全局 MFA 开关。
- MFA 按 terminal 配置。
- 平台默认值不是强制最低基线。
- 租户可按 terminal 覆盖为更严格或更宽松。
- PDA / KIOSK 默认关闭 MFA，但模型层支持显式开启。

### 4.5 Session

- session 必须记录 `terminal / loginFlow / userId / accountId / tenantId`。
- PDA / KIOSK session 额外记录 `terminalDeviceId / deviceBoundTenantId`。
- session 不复制完整设备 registry 真相。

### 4.6 Login History

- login history 是 auth audit 的产品化脱敏视图。
- 不另立第二套登录历史真相。
- 普通 login history 不展示每次 refresh / validate。

### 4.7 Trusted Device

- Web 可支持 trusted browser。
- future Mobile 可支持 remembered app/device。
- PDA / KIOSK 不支持 personal trusted login device。

### 4.8 Device Cleanup

- terminal-device-service 发布设备不可登录状态事件。
- auth-service 消费事件后按 `terminalDeviceId` 幂等清退 active sessions。
- PDA login / refresh / bootstrap 仍重查设备状态作为兜底。

## 5. 权限与审计

建议权限码：

- `auth.terminal_login_policy.read`
- `auth.terminal_login_policy.manage`
- `auth.platform_mfa_policy.read`
- `auth.platform_mfa_policy.manage`
- `auth.tenant_mfa_policy.read`
- `auth.tenant_mfa_policy.manage`
- `auth.session.admin.view`
- `auth.session.admin.revoke`

策略变更、session 清退、设备状态触发清退、登录失败 / 拒绝 / MFA 结果都必须记录认证安全审计。

审计字段至少考虑：

- operator
- user
- account
- tenant
- terminal
- loginFlow
- sessionId
- terminalDeviceId
- deviceBoundTenantId
- before / after
- reasonCode
- traceId

## 6. 执行分阶段

1. 文档、ADR 与 contract 冻结。
2. proto / shared enum / generated contract 调整。
3. auth-service terminal entry login policy 模型、查询、更新与登录前准入。
4. auth-service terminal MFA policy 模型、平台默认与租户覆盖解析。
5. auth-service session metadata、login history 视图、trusted device 边界调整。
6. PDA 登录链路接入 device-bound tenant 与唯一 PDA account 解析。
7. terminal-device-service 设备不可登录事件与 auth-service session cleanup 消费。
8. API Gateway account security / platform auth security / tenant admin security BFF。
9. 前端平台管理员配置页、租户 terminal MFA 设置页、账号安全 session / login history 页面。
10. seed、迁移、测试与 smoke。

## 7. 验收场景

必须覆盖：

- Web disabled login flow 被拒绝，且不校验 credential。
- Web enabled login flow 可完成 user authentication 并进入 account selection。
- PDA disabled login flow 被拒绝。
- PDA 使用设备绑定 tenant，不允许用户选择租户。
- PDA user 在绑定 tenant 内无可 PDA account 时拒绝。
- PDA user 在绑定 tenant 内多个可 PDA account 时拒绝。
- PDA user 在绑定 tenant 内唯一可 PDA account 时建立 session。
- PDA session 记录 `terminalDeviceId / deviceBoundTenantId`。
- Web session 记录 `terminal / loginFlow / userId / accountId / tenantId`。
- 租户 terminal MFA 覆盖平台默认。
- PDA / KIOSK 默认 MFA 关闭，显式开启后才触发。
- Login history 展示登录成功、失败、拒绝、MFA 结果，不展示普通 refresh 成功。
- PDA / KIOSK 不进入 trusted login device 列表。
- 管理员可筛选 sessions，但不能按筛选结果批量清退。
- 管理员可清退指定 session 与指定 user 全部 sessions。
- 设备 disabled / lost / unbound / retired 事件触发 auth-service 幂等清退相关 sessions。
- PDA refresh / bootstrap 对 disabled / lost 设备做兜底阻断。
- 所有策略变更与安全动作写入 auth audit。

## 8. 风险

- PDA 设备绑定 tenant 与唯一 account 解析依赖 terminal-device-service 与 identity/permission 协同，必须与 PDA device management thread 对齐。
- 关闭 terminal 的全部 login flows 会导致该 terminal 无法登录，平台 UI 必须二次确认。
- 租户开启 PDA / KIOSK MFA 会影响一线效率，UI 必须强提醒。
- 设备状态事件清退要求幂等与重试，不能依赖跨服务事务。
- 若未来引入租户强制 SSO / 禁用 OTP，应新开 Enterprise Login Realm Policy 设计，不应回塞本 feature。
