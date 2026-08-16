# auth-service Terminal Entry Login Policy API

> 服务设计唯一真相源：[auth-service.md](../../architecture/services/auth-service.md)。本文只描述 `auth-service` 的黑盒策略接口语义，不重新定义服务职责、核心对象或 owner 边界。

## 1. 能力定位

Terminal Entry Login Policy 是平台级认证入口策略，用于定义每类 terminal 的固定前端登录入口允许哪些已实现 primary login flow。

该能力回答：

```text
当前 terminal 是否允许这次提交的 login flow？
```

它不回答：

```text
某个 account 是否允许从该 terminal 登录
某个租户是否允许 OTP / password / SSO
某台 PDA 是否允许登录
用户是否拥有某个 credential
```

这些分别由 Terminal Access Policy、MFA / session policy、terminal-device-service 或 user credential 能力负责。

## 2. Owner

- 策略真相：`auth-service`
- 管理操作授权判定：`permission-service`
- HTTP 管理入口：`api-gateway` / platform admin BFF
- 前端展示：platform admin UI

## 3. Policy Shape

策略按 terminal 维护：

```text
terminal
enabledLoginFlows[]
updatedBy
updatedAt
```

Phase 2 terminal 集合：

- `WEB`
- `PDA`
- `KIOSK`
- future `MOBILE`

Phase 2 已实现 login flow 才能被启停。`EMPLOYEE_CODE_PIN` 在 PDA Employee Code + Terminal PIN Login feature 实现并验收前不得作为可启用项；`badge + PIN`、SSO、passkey 等未实现 flow 不应作为可启用项。

示例：

```text
WEB:
  EMAIL_PASSWORD
  EMAIL_OTP
  PHONE_PASSWORD
  PHONE_OTP

PDA:
  PASSWORD

PDA after Employee Code + Terminal PIN Login:
  EMPLOYEE_CODE_PIN
  PASSWORD
```

## 4. Runtime Check

### `CheckTerminalLoginFlowAllowed`

- 作用：判断当前 terminal 是否允许使用某个 primary login flow。
- 调用方：
  - auth-service 内部登录 use case
  - 不建议作为对外通用 RPC 暴露给 BFF 直接调用
- 请求关键字段：
  - `terminal`
  - `login_flow`
- 响应关键字段：
  - `allowed`
  - `reason_code`

稳定语义：

- BFF 必须先按 HTTP 入口固定可信 terminal。
- `auth-service` 必须在 primary credential 校验前执行该检查。
- 若不允许，认证流程返回稳定拒绝原因，例如 `LOGIN_FLOW_NOT_ALLOWED_FOR_TERMINAL`。
- 不允许时不得校验 credential、不得创建 challenge、不得进入 account selection。

## 5. Management APIs

### `GetPlatformTerminalLoginPolicy`

- 作用：读取平台级 terminal entry login policy。
- 使用场景：
  - 平台管理员配置页面。
  - BFF 获取当前各 terminal 可用登录入口。
- 权限：
  - 建议 permission code：`auth.terminal_login_policy.read`

响应关键字段：

- `policies[].terminal`
- `policies[].enabled_login_flows[]`
- `policies[].supported_login_flows[]`
- `policies[].updated_at`
- `policies[].updated_by`

### `UpdatePlatformTerminalLoginPolicy`

- 作用：更新平台级 terminal entry login policy。
- 使用场景：
  - 平台管理员启停某 terminal 的已实现 login flow。
- 权限：
  - 建议 permission code：`auth.terminal_login_policy.manage`

请求关键字段：

- `terminal`
- `enabled_login_flows[]`
- `operator_context`
- `reason`，可选

稳定语义：

- 只能启用当前已实现 login flow。
- 请求不能包含租户级、account 级、user 级或 terminalDeviceId 级 override。
- 更新必须记录认证安全审计，包含 before / after、operator、terminal、changed fields、trace context。
- 若关闭某 terminal 的所有 login flow，BFF / UI 必须进行显式确认；运行时将拒绝该 terminal 的所有 primary login。

## 6. 明确禁止

- 禁止租户管理员配置 primary login method。
- 禁止通过该策略表达 account terminal access。
- 禁止通过该策略表达 MFA。
- 禁止通过该策略表达设备禁用、设备绑定或设备版本策略。
- 禁止把未实现 login flow 作为可启用项。

## 7. 关联文档

- [ADR 0007](../../adr/0007-terminal-aware-account-security-phase-2.md)
- [terminal-aware-account-security.md](../../architecture/collaborations/terminal-aware-account-security.md)
- [login.md](./login.md)
