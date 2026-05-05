# tenant-org-service Tenant Onboarding Contract

## 1. 目的

定义 tenant onboarding 的内部服务 contract，让“创建租户 + 创建第一个租户管理员”成为可幂等、可恢复、可审计的生产级流程。

当前文档冻结目标 contract 语义；截至 2026-05-05，proto / runtime 已支持当前 onboarding 主线，本次文档收口不重跑 Jest / Vitest。

## 2. Owner 边界

- `tenant-org-service`
  - 拥有 tenant onboarding 流程状态。
  - 拥有 `Tenant` 与 root `OrgUnit` 真相。
  - 作为轻量 Saga / Process Manager 调用下游 owner service。
- `party-service`
  - 拥有 organization / person `Party` 与 `TenantParty` 真相。
- `identity-service`
  - 拥有 `User` 与 `UserAccount` 真相。
- `auth-service`
  - 拥有 login method、credential、password setup gate 与 session 真相。
- `hr-service`
  - 拥有首租户管理员对应的 employee 与 employment 真相。
- `permission-service`
  - 拥有 `tenant.admin` / `hr.admin` / `account.basic` role instance 与 account role grant 真相。
- `api-gateway`
  - 只做 HTTP contract、鉴权、DTO 转换与展示适配。

明确禁止：

- Gateway 保存或推进 onboarding step 状态。
- `tenant-org-service` 直接写 party / identity / auth / permission 数据库。
- 用 seed / reset 脚本替代该正式业务流程。

## 3. 通用上下文要求

所有 onboarding 写接口都要求：

- internal service caller
- authenticated system-scope operator
- operator context
- trace context
- idempotency key
- 审计元数据

## 4. `StartTenantOnboarding`

### 4.1 作用

启动或恢复一次 tenant onboarding Saga。

### 4.2 请求关键字段

- `idempotency_key`
- `tenant.code`
- `tenant.name`
- `organization_party.legal_name`
- optional `organization_party.registered_country`
- optional `organization_party.identifiers[]`
- `root_org.name`
- `first_admin.display_name`
- optional `first_admin.email`
- optional `first_admin.phone`
- optional `first_admin.require_password_setup`

校验规则：

- `idempotency_key` 必填。
- `tenant.code` 必填且格式由 tenant-org-service 管理。
- `tenant.name` 必填。
- `organization_party.legal_name` 必填。
- `root_org.name` 必填。
- `first_admin.display_name` 必填。
- `first_admin.email` 与 `first_admin.phone` 至少一个必填。
- `first_admin.phone` 必须使用 canonical `+` 国际格式。

### 4.3 响应关键字段

- `onboarding.id`
- `onboarding.status`
- `tenant`
- `root_org`
- `organization_party.party_id`
- `organization_party.tenant_party_id`
- `first_admin.user_id`
- `first_admin.account_id`
- `first_admin.person_party_id`
- `first_admin.person_tenant_party_id`
- `first_admin_employee.employee_id`
- `first_admin_employee.employment_id`
- optional `first_admin_employee.access_process_id`
- `access.tenant_admin_role_id`
- `access.grant_id`
- optional `access.hr_admin_role_id`
- optional `access.hr_admin_grant_id`
- optional `access.account_basic_role_id`
- `steps[]`
- optional `failure`

### 4.4 成功语义

成功后必须满足：

- tenant 存在且由 tenant-org-service 拥有。
- root org 存在，且可引用 organization party。
- organization party 与 organization tenant-party 存在。
- first admin user/account 存在。
- first admin employee / employment 存在，且由 hr-service 拥有。
- first admin login method 已 bootstrap。
- 若请求要求 password setup，则 auth-service 中存在 password setup gate。
- permission-service 中存在 tenant scoped `tenant.admin`、`hr.admin` 与 onboarding 所需基础账号角色。
- first admin account 已被授予 `tenant.admin` 与 `hr.admin`；`account.basic` 默认访问由 HR employee onboarding access 段通过 permission 边界完成。

## 5. `GetTenantOnboarding`

### 5.1 作用

查询一次 onboarding run 的当前状态与步骤结果。

### 5.2 请求关键字段

- `onboarding_id`

### 5.3 响应关键字段

同 `StartTenantOnboarding` 响应结构。

## 6. `RetryTenantOnboarding`

### 6.1 作用

从上次失败步骤继续执行可重试 onboarding run。

### 6.2 请求关键字段

- `onboarding_id`
- optional `reason`

### 6.3 成功语义

- 已成功 step 不应重复执行破坏性写入。
- 若 step 已有 external reference，应优先复用。
- 若请求 fingerprint 与原始 run 不一致，应拒绝。

## 7. Run 状态

- `PENDING`
- `RUNNING`
- `FAILED_RETRYABLE`
- `FAILED_NEEDS_MANUAL_REVIEW`
- `SUCCEEDED`

## 8. Step 状态

- `NOT_STARTED`
- `RUNNING`
- `SUCCEEDED`
- `FAILED`

Step keys:

- `REGISTER_ORGANIZATION_PARTY`
- `CREATE_TENANT_WITH_ROOT_ORG`
- `BIND_ORGANIZATION_TENANT_PARTY`
- `CREATE_FIRST_ADMIN_ACCOUNT`
- `CREATE_FIRST_ADMIN_EMPLOYEE`
- `BOOTSTRAP_FIRST_ADMIN_LOGIN_METHODS`
- `REQUIRE_FIRST_LOGIN_PASSWORD_SETUP`
- `ENSURE_TENANT_ADMIN_ROLE`
- `GRANT_TENANT_ADMIN_ROLE`
- `ENSURE_HR_ADMIN_ROLE`
- `GRANT_HR_ADMIN_ROLE`
- `ENSURE_ACCOUNT_BASIC_ROLE`

## 9. 幂等语义

- 同一 `idempotency_key` + 同一 request fingerprint：
  - 已成功则返回同一 onboarding result。
  - 可重试失败则允许继续执行未完成步骤。
  - 正在执行则返回当前 run 状态或由实现选择互斥等待。
- 同一 `idempotency_key` + 不同 request fingerprint：
  - 返回 idempotency conflict。

## 10. 失败恢复

- 默认不物理删除已创建主数据。
- 下游失败后，run 必须记录失败 step、错误码、错误消息、可重试标记与已知 external refs。
- 可重试失败返回 `FAILED_RETRYABLE`。
- 语义冲突或需要人工确认的失败返回 `FAILED_NEEDS_MANUAL_REVIEW`。
- retry 从失败 step 或下一个未完成 step 继续。

## 11. 第一阶段暂不冻结

- 是否新增 `TenantStatus.PROVISIONING`。
- 更完整的 employee onboarding 补偿管理面；当前仅支持首租户管理员员工化主链。
- 是否使用完整 `workflow-service`。
- 是否把 onboarding run 暴露为通用 workflow instance。
