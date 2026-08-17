# Permission Service Onboarding Grant Contract

> 服务设计唯一真相源：[permission-service.md](../../architecture/services/permission-service.md)。HR `Employee / Employment`、员工生命周期、正式 `人 -> org` 归属与 onboarding owner 边界以 [hr-service.md](../../architecture/services/hr-service.md) 为准。本文只描述 employee onboarding 初始授权 handoff contract，不重新定义 Role、AccountRole、grant、权限 owner 或 HR 对象语义。

## 1. 目的

定义员工 onboarding 中初始角色 / grant 的 owner 语义与最小 handoff 合同。

## 2. owner 边界

- `permission-service` 拥有 role / permission / grant 真相
- `hr-service` 只能提交 onboarding grant 请求，不拥有 grant 真相
- `identity-service` 不直接写角色绑定
- `api-gateway/BFF` 只负责输入收集，不拥有 grant 规则

## 3. 最小 handoff 语义

### `GrantInitialAccessForEmployeeAccount`

- 作用：为新绑定账号授予初始角色或 grant
- 请求关键字段：
  - `tenant_id`
  - `account_id`
  - `role_ids[]`
  - `idempotency_key`
  - optional `reason`
- 当前 minimum 口径：
  - 先冻结 direct role grant
  - access package 仅冻结 owner，不冻结 shape
- 成功语义：
  - 对目标 account 建立初始角色 / grant
  - 同一 `idempotency_key` 重试必须返回同一业务结果或可安全重复执行
- 失败语义：
  - 不得回滚 `Party / Employee / Employment`
  - 不得要求 HR 或 Identity 直接写角色绑定
  - 调用方应把失败归入 onboarding access 段补偿流程

## 4. 主要错误语义

- validation failure
  - 角色列表为空或字段缺失
- account not found
- tenant mismatch
- permission denied
  - 调用方 operator 不具备 onboarding grant 权限
- idempotency conflict
  - 同一幂等键对应的请求关键字段不一致

## 5. 明确禁止

- 不允许 HR、Identity、BFF 直接写 account-role 绑定
- 不允许在未补 contract 前由 HR 自行发明 access package 语义
