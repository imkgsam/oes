# Account Security BFF API

> `auth-service` 的服务设计、session、login history、trusted login device、MFA 与认证审计边界只以 [auth-service.md](../../architecture/services/auth-service.md) 为准。本文只描述面向 Web 账号安全页面的 HTTP contract、编排与返回形状。

## 1. 能力定位

Account Security BFF 面向当前登录用户的账号安全中心，覆盖：

- 当前用户 session 列表
- 指定 session 退出
- 全部 session 退出
- 登录历史
- trusted browser / remembered device
- MFA 绑定与账号安全设置入口

该 BFF 不承载管理员安全治理能力。

## 2. Downstream

主要下游：

- `auth-service`
- `identity-service`，用于必要展示摘要
- `tenant-org-service`，用于 tenant 展示摘要

## 3. Session APIs

### `GET /account-security/sessions`

- 作用：查询当前 user 的 active sessions。
- 下游：`auth-service.ListOwnSessions`
- 响应关键字段：
  - `sessions[].sessionId`
  - `sessions[].terminal`
  - `sessions[].loginFlow`
  - `sessions[].accountSummary`
  - `sessions[].tenantSummary`
  - `sessions[].lastSeenAt`
  - `sessions[].clientSummary`
  - `sessions[].terminalDeviceSummary`
  - `sessions[].isCurrent`

### `POST /account-security/sessions/:sessionId/revoke`

- 作用：退出当前 user 的指定 session。
- 下游：`auth-service.RevokeOwnSession`

### `POST /account-security/sessions/revoke-all`

- 作用：退出当前 user 的全部 sessions。
- 下游：`auth-service.RevokeOwnAllSessions`
- 是否保留当前 session 由具体产品 contract 固定，不由前端自行决定。

## 4. Login History APIs

### `GET /account-security/login-history`

- 作用：查询当前 user 的登录历史。
- 下游：`auth-service.ListOwnLoginHistory`
- 支持查询参数：
  - `terminal`
  - `result`
  - `from`
  - `to`
  - `cursor`
  - `pageSize`

普通登录历史不展示每次 refresh / validate。refresh replay、session revoke 等可进入 security activity 视图。

## 5. Trusted Login Device APIs

### `GET /account-security/trusted-devices`

- 作用：查看当前 user 的 personal trusted login devices。
- 下游：`auth-service.ListOwnTrustedLoginDevices`
- 稳定语义：
  - Web trusted browser 可展示。
  - future Mobile remembered app/device 可展示。
  - PDA / KIOSK 受管设备不得展示为 personal trusted device。

### `POST /account-security/trusted-devices/:trustedDeviceId/revoke`

- 作用：撤销当前 user 的一个 trusted login device。

## 6. MFA APIs

当前用户 MFA binding、TOTP、recovery codes、step-up grant 等能力继续以既有 `auth-bff-self-service` 与 `auth-service/mfa.md` 为准。本文不重新定义 MFA factor 细节。

## 7. 明确禁止

- 禁止前端指定其他 user 作为 self-service target。
- 禁止 BFF 自行维护 session、trusted device 或 login history truth。
- 禁止将 PDA / KIOSK 受管设备展示为 user trusted device。

## 8. 关联文档

- [auth-bff-self-service.md](./auth-bff-self-service.md)
- [session-management.md](../auth-service/session-management.md)
- [login-history.md](../auth-service/login-history.md)
- [trusted-login-device.md](../auth-service/trusted-login-device.md)
