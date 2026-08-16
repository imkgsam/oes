# auth-service Terminal MFA Policy API

> 服务设计唯一真相源：[auth-service.md](../../architecture/services/auth-service.md)。本文只描述 terminal-aware MFA policy 的黑盒接口语义，不重新定义 `auth-service` 长期职责。

## 1. 能力定位

Terminal MFA Policy 用于按 terminal 配置登录 MFA 要求。

Phase 2 不设计全局 MFA 开关。最终执行按当前 `tenant + terminal` 判断：

```text
if tenant terminal MFA policy exists:
  use tenant policy
else:
  use platform default terminal MFA policy
```

平台默认值不是强制最低基线，租户可以按 terminal 覆盖为更严格或更宽松。

## 2. Owner

- 策略真相：`auth-service`
- 管理操作授权判定：`permission-service`
- HTTP 管理入口：`api-gateway` / platform admin BFF / tenant admin BFF

## 3. Policy Shape

Terminal MFA Policy 按 terminal 维护：

```text
terminal
loginMfaRequired
newDeviceMfaRequired
allowedFactors[]
factorPriority[]
updatedBy
updatedAt
```

Phase 2 规则：

- 所有 terminal 理论上都支持开关。
- PDA / KIOSK 默认关闭。
- 租户显式开启 PDA / KIOSK MFA 时，管理 UI 应展示影响一线登录效率的提示。
- PDA / KIOSK 高风险业务动作优先通过业务 step-up、主管确认或审批流设计，不属于常规登录 MFA。

## 4. Runtime Resolution

### `ResolveTerminalMfaRequirement`

- 作用：解析某次 account session 建立是否需要 login MFA。
- 调用方：
  - auth-service account selection / session issuance use case
- 请求关键字段：
  - `tenant_id`
  - `scope_level`
  - `terminal`
  - `account_id`
  - `login_flow`
  - `device_context_summary`，可选
- 响应关键字段：
  - `mfa_required`
  - `scenario`
  - `allowed_factors[]`
  - `factor_priority[]`
  - `policy_source`

稳定语义：

- 解析发生在 account 已确定之后、session 建立之前。
- PDA 由受管设备绑定 tenant 后解析唯一 account，再进入该判断。
- 若需要 MFA，继续使用 `auth-service` 既有 login MFA challenge 编排。
- 若不需要 MFA，直接进入 session issuance。

## 5. Platform Default Management

### `GetPlatformDefaultTerminalMfaPolicy`

- 作用：读取平台默认 terminal MFA policy。
- 权限：
  - 建议 permission code：`auth.platform_mfa_policy.read`

### `UpdatePlatformDefaultTerminalMfaPolicy`

- 作用：更新平台默认 terminal MFA policy。
- 权限：
  - 建议 permission code：`auth.platform_mfa_policy.manage`

稳定语义：

- 平台默认用于新租户初始化或租户未配置时的兜底。
- 平台默认不是强制最低基线。
- 更新必须记录认证安全审计。

## 6. Tenant Management

### `GetTenantTerminalMfaPolicy`

- 作用：读取当前租户 terminal MFA policy 及其平台默认回退值。
- 权限：
  - 建议 permission code：`auth.tenant_mfa_policy.read`

响应应明确：

- `effective_policies[]`
- `tenant_overrides[]`
- `platform_defaults[]`
- 每个 terminal 的 `source = TENANT / PLATFORM_DEFAULT`

### `UpdateTenantTerminalMfaPolicy`

- 作用：更新租户 terminal MFA policy。
- 权限：
  - 建议 permission code：`auth.tenant_mfa_policy.manage`

稳定语义：

- 租户可以按 terminal 覆盖为更严格或更宽松。
- PDA / KIOSK 显式开启 MFA 时，BFF / UI 应要求操作者确认影响。
- 更新必须记录认证安全审计，包含 before / after、operator、tenant、terminal、changed fields、trace context。

## 7. 明确禁止

- 禁止全局 MFA 开关绕过 terminal-specific policy。
- 禁止把 MFA policy 用于配置 primary login method。
- 禁止把 PDA / KIOSK MFA 固定写死为不支持。
- 禁止由 BFF 自行判断 MFA 是否需要。

## 8. 关联文档

- [ADR 0007](../../adr/0007-terminal-aware-account-security-phase-2.md)
- [mfa.md](./mfa.md)
- [terminal-aware-account-security.md](../../architecture/collaborations/terminal-aware-account-security.md)
