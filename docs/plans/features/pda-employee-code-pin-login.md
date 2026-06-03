# PDA Employee Code + Terminal PIN Login

## 1. Purpose

本 feature packet 冻结 PDA `employeeCode + TERMINAL_PIN` 登录的设计范围、服务边界、契约变更与实施顺序。

PDA 是受管现场终端。设备 enrollment、设备状态治理、PDA session 短窗口、heartbeat、诊断日志与设备绑定租户已经在 PDA Phase 1 / Device Management Phase 2 中完成。本 feature 不重新定义设备治理，只在已受管 PDA 上新增现场员工快速登录方式。

目标登录体验：

```text
PDA 扫码或手动输入 employeeCode
-> 弹出 6 位 TERMINAL_PIN 输入弹窗
-> PIN 满 6 位自动提交
-> 后端在设备绑定租户内解析 active employee 与唯一可用 account
-> auth-service 校验 user-scoped TERMINAL_PIN
-> 签发 PDA session
```

## 2. Scope

本阶段包含：

- PDA 默认 `employeeCode + TERMINAL_PIN` 登录。
- 支持员工条码扫码值：`OES:EMPLOYEE:EMP001`；非员工条码不得进入 PIN 输入。
- 支持手动输入纯 `employeeCode`。
- PDA PIN 使用弹窗式 password input，不在主页面放固定 PIN 输入框。
- PIN 满 6 位自动提交。
- 登录失败后保留 `employeeCode`，清空 PIN，并提供“重新扫描员工码 / 更换员工码”入口。
- 账号密码登录保留为链接跳转兜底入口。
- `TERMINAL_PIN` 作为 `auth-service` 拥有的 user-scoped login credential。
- `TERMINAL_PIN` 在 Web 个人中心 / 账号安全中设置、修改、忘记后重设、启用和停用。
- 管理员可要求用户重设 `TERMINAL_PIN` 或禁用目标用户的 `TERMINAL_PIN`，但不能查看或设置明文 PIN。
- 登录成功继续复用现有 PDA session、bootstrap、heartbeat 与设备访问决策。

## 3. Non-goals

本阶段不做：

- `badgeId`、工牌、IC 卡、NFC、蓝牙、实体卡 credential service。
- 离线登录。
- 生物识别。
- PDA 上设置、修改或找回 PIN。
- 管理员查看、生成或设置明文 PIN。
- WMS / MES 业务闭环。
- 复杂签名二维码或 JSON 二维码。
- 新的设备治理能力；设备治理继续以 PDA Device Management Phase 2 为准。

## 4. Service Boundaries

### 4.1 terminal-device-service

`terminal-device-service` 继续只负责受管现场终端设备治理：

- 提供 `terminalDeviceId -> deviceBoundTenantId`。
- 判断设备是否可登录，例如 `ACTIVE / DISABLED / LOST / MAINTENANCE / DECOMMISSIONED`。
- 提供版本策略、heartbeat、诊断日志与设备运行快照。

它不拥有 `employeeCode`、PIN、account、session 或认证策略真相。

### 4.2 hr-service

`hr-service` 拥有 `employeeCode`、`Employee` lifecycle 与 `Employment` 真相。

本 feature 需要新增 HR 精确查询：

```text
ResolveActiveEmployeeByCode(tenantId, employeeCode)
```

语义：

- 按 `tenantId + employeeCode` 精确解析员工。
- 不做模糊搜索。
- 不跨租户查询。
- 只在员工 `lifecycleStatus = ACTIVE` 且存在当前 active employment 时返回成功。
- 返回 `EmployeeSummary + EmploymentSummary`。

`hr-service` 不拥有 account binding，不拥有 PIN。

### 4.3 identity-service

`identity-service` 继续拥有 `User / UserAccount / UserAccountEmployeeBinding`。

本 feature 复用现有 `UserAccountEmployeeBinding` 模型，不新增第二套员工账号绑定表。需要新增身份查询：

```text
ResolveEmployeeLoginAccount(tenantId, employeeId)
```

语义：

- 使用 `employeeId` 查找唯一 `UserAccountEmployeeBinding`。
- 绑定必须属于同一 `tenantId`。
- 绑定的 `UserAccount` 必须存在、属于同一 tenant；若账号 disabled，identity 返回账号状态，auth-service 负责拒绝登录并记录 `EMPLOYEE_ACCOUNT_DISABLED`。
- 返回 `userId / accountId / tenantId / scopeLevel / displayName`。

`identity-service` 不拥有 PIN，不校验 PIN。

### 4.4 auth-service

`auth-service` 拥有：

- `TERMINAL_PIN` credential。
- `EMPLOYEE_CODE_PIN` login flow。
- 终端登录入口策略。
- PIN 校验、失败锁定、认证审计。
- PDA session issuance。

`auth-service` 负责核心认证编排：

```text
Check EMPLOYEE_CODE_PIN allowed for PDA
-> HR ResolveActiveEmployeeByCode
-> Identity ResolveEmployeeLoginAccount
-> Check TERMINAL_PIN
-> Resolve Terminal Access Policy
-> Issue PDA session
```

### 4.5 api-gateway / PDA BFF

PDA BFF 负责：

- 固定 `terminal = PDA`。
- 校验 HTTP DTO。
- 从 `terminal-device-service` 解析 `terminalDeviceId / deviceBoundTenantId`。
- 调用 auth-service 登录 RPC。
- 返回 PDA HTTP response shape。

BFF 不承载核心认证、安全策略、员工解析或 PIN 校验规则。

### 4.6 app/pda

PDA 端负责：

- 扫码与手动输入 `employeeCode`。
- 解析 `OES:EMPLOYEE:<employeeCode>` 前缀格式。
- 弹出 PIN 输入弹窗。
- 6 位 PIN 自动提交。
- 错误提示、重新扫描入口、账号密码登录跳转。
- 本地诊断日志记录 normalized `employeeCode`，但不记录 PIN。

## 5. Credential Model

`TERMINAL_PIN` 是 `auth-service` 拥有的 user-scoped login credential。

建议模型方向：

```text
LoginMethodType = TERMINAL_PIN
CredentialType = TERMINAL_PIN
LoginMethodEnum = EmployeeCodePin
TerminalLoginFlow = EMPLOYEE_CODE_PIN
```

稳定规则：

- `TERMINAL_PIN` 绑定 `userId`，不是 `accountId`、`employeeId` 或 `terminalDeviceId`。
- 同一个 user 在多个租户账号下使用同一个 `TERMINAL_PIN`。
- 能否登录某租户终端仍由 device-bound tenant、active employee、employee-account binding、account enabled、Terminal Access Policy 与设备状态共同决定。
- `TERMINAL_PIN` 可供 PDA 和未来 KIOSK / 触摸屏使用，不命名为 `PDA_PIN`。
- PIN 长度为 6 位数字。
- 禁止明显弱 PIN，例如 `000000 / 111111 / 123456 / 654321`。
- 服务端只保存 hash。
- PIN 不能与 token、refresh token 或扫码原始敏感 payload 一起进入日志。

## 6. Web Management

用户侧入口：

```text
tenant-web / 个人中心 / 账号安全 / 现场终端 PIN
```

用户能力：

- 首次设置 `TERMINAL_PIN`。
- 修改 `TERMINAL_PIN`。
- 忘记 PIN 后在已登录 Web 个人中心重设。
- 启用 / 停用自己的 `TERMINAL_PIN` login method。

设置、修改和重设 PIN 必须在 Web 已登录态下完成 step-up：

- 优先 MFA。
- 没有 MFA 时要求当前密码。

管理员治理能力：

- 查看目标用户 `TERMINAL_PIN` 状态：未设置、已启用、已禁用、需要重设。
- 要求目标用户重设 `TERMINAL_PIN`。
- 禁用目标用户 `TERMINAL_PIN`。
- 查看相关 auth audit。

管理员禁止：

- 查看 PIN。
- 设置明文 PIN。
- 生成临时明文 PIN。
- 代替用户输入新 PIN。

PDA 不提供 PIN 设置、找回或重置流程。若 PIN 未设置、被禁用或需要重设，PDA 只提示去 Web 个人中心处理。

## 7. Runtime Login Contract

PDA 继续使用现有 HTTP endpoint：

```http
POST /pda/auth/login
```

新增 method：

```json
{
  "method": "EMPLOYEE_CODE_PIN",
  "employeeCode": "EMP001",
  "pin": "123456",
  "device": {
    "deviceId": "terminal-device-id",
    "deviceName": "Seuic Cruise Ge",
    "identity": {},
    "software": {}
  }
}
```

账号密码兜底继续使用同一 endpoint 的现有 method，例如：

```json
{
  "method": "PHONE_PASSWORD",
  "identifier": "13800138000",
  "credential": "password",
  "device": {}
}
```

登录成功 session 必须记录：

- `terminal = PDA`
- `loginFlow = EMPLOYEE_CODE_PIN`
- `terminalDeviceId`
- `deviceBoundTenantId`
- `userId`
- `accountId`
- `tenantId`

PDA 不做 account selection。

## 8. Errors, Locking And Audit

PDA 前端对凭据类失败统一显示：

```text
员工码或 PIN 错误
```

以下状态可以展示操作指引：

- PIN 未设置：请先到 Web 个人中心设置现场终端 PIN。
- PIN 需要重设：请到 Web 个人中心重设现场终端 PIN。
- PIN 已停用：请到 Web 个人中心启用或联系管理员。
- 设备不可用：走现有设备受限页面。
- 版本不可用：走现有版本阻断流程。
- 账号/员工绑定治理问题：请联系管理员。

锁定策略：

```text
连续 5 次失败，锁定 15 分钟。
```

锁定对象：

```text
员工码能解析到 user:
  userId + EMPLOYEE_CODE_PIN

员工码无法解析:
  tenantId + normalizedEmployeeCode + terminalDeviceId
```

成功登录后清除该 user 的 `EMPLOYEE_CODE_PIN` 失败计数。

auth audit 必须记录真实原因，建议 reason code：

- `LOGIN_FLOW_DISABLED`
- `DEVICE_NOT_ACTIVE`
- `EMPLOYEE_CODE_NOT_FOUND`
- `EMPLOYEE_INACTIVE`
- `EMPLOYEE_ACCOUNT_BINDING_NOT_FOUND`
- `EMPLOYEE_ACCOUNT_DISABLED`
- `EMPLOYEE_ACCOUNT_BINDING_CONFLICT`
- `TERMINAL_PIN_NOT_SET`
- `TERMINAL_PIN_RESET_REQUIRED`
- `TERMINAL_PIN_DISABLED`
- `INVALID_TERMINAL_PIN`
- `TERMINAL_PIN_LOCKED`
- `TERMINAL_ACCESS_DENIED`
- `LOGIN_SUCCEEDED`

审计字段建议：

- `terminal`
- `loginFlow`
- `terminalDeviceId`
- `deviceBoundTenantId`
- `tenantId`
- `employeeCode`
- `employeeId`，如果解析到
- `userId`，如果解析到
- `accountId`，如果解析到
- `failureReason`
- `traceId`
- `ipAddress / userAgent / deviceName`
- `occurredAt`

日志规则：

- 可以记录 normalized `employeeCode`。
- 可以记录 scan format。
- 永远不记录 PIN。
- 不记录 access token / refresh token。
- 未识别扫码 payload 不记录全文。

## 9. PDA UI

PDA 默认登录页使用现场终端登录体验：

- 大面积扫码等待状态。
- 显示设备绑定状态 / 终端名称。
- 支持扫码员工码。
- 支持手动输入员工码。
- 不展示固定 PIN 输入框。
- 提供“账号密码登录”链接，跳转到密码登录兜底页。

扫码成功：

```text
解析 normalized employeeCode
-> 显示当前员工码
-> 打开 PIN 弹窗
-> 6 位 PIN 输入完成后自动提交
```

失败：

```text
保留 employeeCode
清空 PIN
PIN 弹窗保持打开
显示错误提示
提供“重新扫描员工码 / 更换员工码”
```

重新扫描：

```text
关闭 PIN 弹窗
清空 employeeCode
回到扫码等待状态
```

兼容性要求：

- Android 9 / WebView 66。
- Vue3 + Vant。
- PIN 弹窗优先使用 Vant PasswordInput / NumberKeyboard 能力或兼容实现。
- 避免依赖过新的 CSS。

## 10. Required Document Updates

本 feature 需要同步更新：

- `docs/architecture/services/auth-service.md`
- `docs/architecture/services/hr-service.md`
- `docs/architecture/services/identity-service.md`
- `docs/architecture/terminals/pda.md`
- `docs/architecture/collaborations/terminal-aware-account-security.md`
- `docs/contracts/api-gateway/pda-auth-bff-login.md`
- `docs/contracts/auth-service/login.md`
- `docs/contracts/auth-service/terminal-login-policy.md`
- `docs/contracts/hr-service/query.md`
- `docs/contracts/identity-service/employee-binding.md`

不修改 PDA Device Management Phase 2 feature packet，避免把本 feature 混入已验收设备治理线程。

## 11. Implementation Order

实现前必须先完成文档冻结，然后按 TDD 推进：

1. HR `ResolveActiveEmployeeByCode` contract、tests、runtime。
2. Identity `ResolveEmployeeLoginAccount` contract、tests、runtime。
3. Auth `TERMINAL_PIN` self-service / admin governance tests、runtime。
4. Auth `LoginWithEmployeeCodePin` tests、runtime。
5. API Gateway PDA login DTO / mapping tests、runtime。
6. PDA Web login UI tests、runtime。
7. Android / WebView 66 真机或兼容 smoke。
8. Auth / PDA BFF / PDA Web smoke verification。

## 12. Open Risks

- `TERMINAL_PIN` 是 user-scoped 低熵凭据。必须依赖设备绑定租户、active employee、account binding、Terminal Access Policy 和失败锁定共同收窄风险。
- Web 个人中心需要承接 PIN 设置 / 重设 / 启停 UI；如果该 UI 不在同一阶段交付，PDA 登录会遇到“PIN 未设置但无入口处理”的体验缺口。
- HR 与 identity 新增查询是跨服务 contract 变更，必须先更新 proto / contract，再实现。
