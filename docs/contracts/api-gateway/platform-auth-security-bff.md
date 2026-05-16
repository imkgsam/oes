# Platform Auth Security BFF API

> `auth-service` 的服务设计、terminal login policy、terminal MFA policy 与认证安全审计边界只以 [auth-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/auth-service.md) 为准。本文只描述平台管理员 HTTP contract、编排与返回形状。

## 1. 能力定位

Platform Auth Security BFF 面向平台管理员，覆盖：

- 平台级 Terminal Entry Login Policy
- 平台默认 Terminal MFA Policy

该 BFF 不提供租户 primary login method 配置，也不提供租户级登录方式 override。

## 2. Downstream

主要下游：

- `auth-service`
- `permission-service`，用于平台级管理操作授权判定

BFF 只做 HTTP contract、DTO 校验、权限入口编排与展示聚合，不承载核心认证策略规则。

## 3. Terminal Entry Login Policy

### `GET /platform/auth-security/terminal-login-policy`

- 作用：读取平台级 terminal entry login policy。
- 权限：
  - `auth.terminal_login_policy.read`
- 下游：
  - `auth-service.GetPlatformTerminalLoginPolicy`

响应关键字段：

- `terminals[].terminal`
- `terminals[].enabledLoginFlows[]`
- `terminals[].supportedLoginFlows[]`
- `terminals[].updatedAt`
- `terminals[].updatedBy`

### `PUT /platform/auth-security/terminal-login-policy/:terminal`

- 作用：更新某 terminal 的 enabled login flows。
- 权限：
  - `auth.terminal_login_policy.manage`
- 下游：
  - `auth-service.UpdatePlatformTerminalLoginPolicy`

请求关键字段：

- `enabledLoginFlows[]`
- `reason`

稳定语义：

- 只能启停已实现 login flow。
- 未实现 login flow 不能被提交为 enabled。
- 若关闭某 terminal 的全部 login flow，BFF / UI 应要求显式确认。
- 更新由 `auth-service` 记录认证安全审计。

## 4. Platform Default Terminal MFA Policy

### `GET /platform/auth-security/default-terminal-mfa-policy`

- 作用：读取平台默认 terminal MFA policy。
- 权限：
  - `auth.platform_mfa_policy.read`
- 下游：
  - `auth-service.GetPlatformDefaultTerminalMfaPolicy`

### `PUT /platform/auth-security/default-terminal-mfa-policy/:terminal`

- 作用：更新某 terminal 的平台默认 MFA policy。
- 权限：
  - `auth.platform_mfa_policy.manage`
- 下游：
  - `auth-service.UpdatePlatformDefaultTerminalMfaPolicy`

请求关键字段：

- `loginMfaRequired`
- `newDeviceMfaRequired`
- `allowedFactors[]`
- `factorPriority[]`
- `reason`

稳定语义：

- 平台默认不是强制最低基线。
- PDA / KIOSK 默认关闭。
- 平台更新不直接覆盖已有租户配置；租户未配置时才使用平台默认。
- 更新由 `auth-service` 记录认证安全审计。

## 5. 明确禁止

- 禁止平台 BFF 提供租户 primary login method 配置。
- 禁止 BFF 自行判断 terminal login flow 是否允许。
- 禁止 BFF 自行判断 MFA 是否需要。
- 禁止 BFF 写入 permission-service 以外的授权事实。

## 6. 关联文档

- [terminal-login-policy.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/auth-service/terminal-login-policy.md)
- [terminal-mfa-policy.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/auth-service/terminal-mfa-policy.md)
- [terminal-aware-account-security.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/collaborations/terminal-aware-account-security.md)
