# identity-service Employee Binding Contract

## 1. 目的

定义 `identity-service` 在员工 onboarding 中负责的 `UserAccount <-> Employee` 绑定黑盒语义。

`identity-service` 的长期服务边界以 [identity-service.md](../../architecture/services/identity-service.md) 为准；HR `Employee / Employment` 与正式 `人 -> org` 归属以 [hr-service.md](../../architecture/services/hr-service.md) 为准。本文只描述 employee binding contract，不重新定义 HR 对象语义。

## 2. owner 边界

- `identity-service` 的 `User / UserAccount` 与 `UserAccount <-> Employee` binding 边界以服务真相源为准
- `hr-service` 只发起绑定请求或读取绑定结果
- `Employee / Employment` 真相仍归 `hr-service`，具体服务边界以 [hr-service.md](../../architecture/services/hr-service.md) 为准
- `Tenant / OrgUnit / org tree` 边界以 [tenant-org-service.md](../../architecture/services/tenant-org-service.md) 为准；本文不把 account-org membership 重新抬升为正式组织归属。

## 3. 最小能力

### `BindAccountToEmployee`

- 作用：建立一个 `UserAccount -> Employee` 绑定
- 请求关键字段：
  - `account_id`
  - `employee_id`
  - `tenant_id`
- 绑定前置校验：
  - 账号与员工属于同一 tenant
  - `UserAccount.tenantPartyId` 与该 `Employee.tenantPartyId` 一致
- 成功语义：
  - 绑定结果由 `identity-service` 持久化
  - 绑定成功不代表 permission grant 已成功
  - 若后续 permission grant 失败，binding 保留，但 account 不得被视为已完成 onboarding access
- 失败语义：
  - tenant mismatch
  - tenant party mismatch
  - account not found
  - employee not found

### `UnbindAccountFromEmployee`

- 作用：移除一个既有绑定
- 注意：
  - 解绑不影响 `Employee / Employment` 真相是否成立

### `GetEmployeeBindingByAccountId`

- 作用：按账号查询绑定摘要

### `ResolveEmployeeLoginAccount`

- 作用：保留按 `tenant_id + employee_id` 查询员工绑定账号及其启用状态的既有 BUSINESS compatibility contract
- 使用边界：
  - 供现有声明的 BUSINESS 调用方继续使用
  - `auth-service` 的 pre-HUMAN `EMPLOYEE_CODE_PIN` 登录不得调用本方法，只使用下述 INTERNAL `ResolveAuthEmployeeLoginAccount`
- 请求关键字段：
  - `tenant_id`
  - `employee_id`
- 成功响应关键字段：
  - `user_id`
  - `account_id`
  - `tenant_id`
  - `scope_level`
  - `display_name`
  - `account_enabled`
- 稳定规则：
  - 复用 `identity-service` 现有 `UserAccountEmployeeBinding` 真相，不新增第二套员工账号绑定模型
  - `employee_id` 必须存在唯一绑定
  - 绑定的 `tenant_id` 必须与请求 `tenant_id` 一致
  - 绑定的 `UserAccount` 必须存在、属于同一 tenant
  - 若账号 disabled，仍可返回 `account_enabled = false`，但调用方不得把该结果解释为登录或授权成功
  - 若无绑定、tenant mismatch 或账号不存在，返回空响应
  - 本能力不判断 employee lifecycle、active employment、PIN、MFA、Terminal Access Policy 或设备状态

### `ResolveAuthEmployeeLoginAccount`

- 作用：为 `auth-service` 的 pre-HUMAN `EMPLOYEE_CODE_PIN` 登录解析唯一绑定账号及其最小启用事实
- admission：仅接受 exact registered `auth-service` workload、`aud=urn:oes:service:identity-service`、SYSTEM MACHINE principal、current certificate `cnf` 与 INTERNAL Code `identity.internal.auth_login_account.resolve`
- 请求关键字段：
  - `tenant_id`，来自已验证 terminal/device boundary，仅作为 owner lookup selector
  - `employee_id`，来自 HR `ResolveAuthLoginEmployee` owner fact
- 成功响应关键字段：
  - `user_id`
  - `account_id`
  - `employee_id`
  - `tenant_id`
  - `scope_level`
  - `display_name`
  - `account_enabled`
- 稳定规则：
  - 复用同一 `UserAccountEmployeeBinding` owner truth，不新增登录专用绑定模型
  - Identity 必须验证 active binding、唯一 account、`scope_level = TENANT` 与 request/account tenant 一致
  - disabled account 可返回 `account_enabled = false` 供 Auth 记录准确审计，但不得建立 session
  - 无绑定、owner mismatch、tenant mismatch、账号不存在或结构异常返回 safe empty/denied，并由 Auth 保持统一登录失败语义
  - 本能力不判断 employee lifecycle、active employment、PIN、MFA、Terminal Access Policy 或设备状态

## 4. 明确禁止

- 不允许 `identity-service` 根据 account-org membership 反推正式 employee/org 真相
- 不允许 `hr-service` 自己持久化账号绑定表
- 不允许把 `ResolveEmployeeLoginAccount` 扩展为认证凭据校验、PIN 管理或 terminal access 判定入口
- 不允许把 `ResolveAuthEmployeeLoginAccount` 扩展为通用账号目录、认证凭据校验、PIN 管理、employee lifecycle 或 terminal access 判定入口
