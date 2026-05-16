# Permission Service Tenant Onboarding Grant Contract

> 服务设计唯一真相源：[permission-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/permission-service.md)。本文只描述 tenant onboarding 初始授权 handoff contract，不重新定义 RoleTemplate、Role、AccountRole、grant 或权限 owner 边界。

## 1. 目的

定义 tenant onboarding 中首个租户管理员角色派生与初始授权的 owner 语义。

当前文档冻结目标 contract 语义，尚未表示 proto / runtime 已实现。

## 2. Owner 边界

- `permission-service` 拥有 role template、tenant role instance、account role grant 真相。
- `tenant-org-service` 只能作为 tenant onboarding Saga 编排方发起请求。
- `Tenant` lifecycle 与 onboarding 编排边界以 [tenant-org-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/tenant-org-service.md) 为准；本文只定义 permission grant contract。
- `identity-service` 不直接写角色绑定。
- `api-gateway/BFF` 不直接展开角色推导或持久化 account-role 绑定。
- 本 contract 不复用 employee onboarding 语义。
- employee onboarding owner 与 HR 对象边界以 [hr-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/hr-service.md) 为准。

## 3. `EnsureTenantRoleInstanceFromTemplate`

### 3.1 作用

确保某个 tenant 下存在由系统模板派生的 tenant role instance。

首批 tenant onboarding 固定使用：

- `template_role_code = "tenant.admin"`
- `template_role_code = "hr.admin"`

### 3.2 请求关键字段

- `tenant_id`
- `template_role_code`
- `idempotency_key`
- optional `name`
- optional `description`
- optional `reason`

### 3.3 响应关键字段

- `role.id`
- `role.code`
- `role.name`
- `role.tenant_id`
- `role.template_role_id`
- `role.role_kind`
- `created`

### 3.4 幂等语义

- 若目标 tenant 已存在同 code tenant role instance，返回现有 role。
- 若同一 `idempotency_key` 重试且 fingerprint 一致，返回同一 role。
- 若同一 `idempotency_key` 对应不同 tenant 或 template code，返回 idempotency conflict。

### 3.5 错误语义

- validation failure
- template not found
- template disabled
- tenant access denied
- idempotency conflict

## 4. `GrantInitialAccessForTenantAccount`

### 4.1 作用

为 tenant onboarding 创建出的首个 tenant account 授予初始 tenant role。

首个租户管理员默认授予：

- `tenant.admin`
- `hr.admin`

### 4.2 请求关键字段

- `tenant_id`
- `account_id`
- `role_ids[]`
- `idempotency_key`
- optional `reason`

### 4.3 响应关键字段

- `grant.id`
- `grant.tenant_id`
- `grant.account_id`
- `grant.role_ids[]`
- `grant.idempotency_key`

### 4.4 成功语义

- 目标 account 必须属于同一 `tenant_id`。
- 目标 role 必须是同 tenant 的 enabled tenant role instance。
- 对目标 account 建立 account-role grant。
- 同一 `idempotency_key` 重试必须返回同一业务结果或安全复用既有 grant。

### 4.5 错误语义

- validation failure
- account not found
- account tenant mismatch
- role not found
- role not assignable
- permission denied
- idempotency conflict

## 5. 与 employee onboarding grant 的关系

现有 `GrantInitialAccessForEmployeeAccount` 保留给 employee onboarding 使用。

employee onboarding 的业务 owner、`Employee / Employment` 与 HR 生命周期语义以 [hr-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/hr-service.md) 为准。

tenant onboarding 首管理员授权不应复用 employee 命名或 employee 语义，原因：

- 首租户管理员不一定是员工。
- tenant opening 与 employee onboarding 的业务 owner 不同。
- 后续 HR 任职失败不应影响租户管理员的初始平台治理权限。

## 6. 审计要求

成功或失败都应记录 permission-service 审计事件，至少包含：

- event type
- `tenant_id`
- `account_id`
- `role_ids`
- `idempotency_key`
- operator context
- trace context
- result

## 7. 第一阶段暂不冻结

- access package 模型。
- 基于 job / employment / org 的 role 推导。
- 人工审批型权限开通流程。
- 通用 workflow-service role task 集成。
