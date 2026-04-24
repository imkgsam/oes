# identity-service Employee Binding Contract

## 1. 目的

定义 `identity-service` 在员工 onboarding 中负责的 `UserAccount <-> Employee` 绑定黑盒语义。

## 2. owner 边界

- `identity-service` 拥有 `User / UserAccount` 真相
- `identity-service` 持久化 `UserAccount <-> Employee` 绑定结果
- `hr-service` 只发起绑定请求或读取绑定结果
- `Employee / Employment` 真相仍归 `hr-service`

## 3. 最小能力

### `BindAccountToEmployee`

- 作用：建立一个 `UserAccount -> Employee` 绑定
- 请求关键字段：
  - `account_id`
  - `employee_id`
  - `tenant_id`
- 绑定前置校验：
  - 账号与员工属于同一 tenant
  - `identity.User.partyId` 与该 `Employee` 上游 person party 一致
- 成功语义：
  - 绑定结果由 `identity-service` 持久化
  - 绑定成功不代表 permission grant 已成功
  - 若后续 permission grant 失败，binding 保留，但 account 不得被视为已完成 onboarding access
- 失败语义：
  - tenant mismatch
  - party mismatch
  - account not found
  - employee not found

### `UnbindAccountFromEmployee`

- 作用：移除一个既有绑定
- 注意：
  - 解绑不影响 `Employee / Employment` 真相是否成立

### `GetEmployeeBindingByAccountId`

- 作用：按账号查询绑定摘要

## 4. 明确禁止

- 不允许 `identity-service` 根据 account-org membership 反推正式 employee/org 真相
- 不允许 `hr-service` 自己持久化账号绑定表
