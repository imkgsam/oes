# Tenant Onboarding Flow Hardening Design

## 1. 目标

- 收敛“创建租户 + 创建第一个租户用户”的生产级流程设计。
- 明确 tenant onboarding 的编排 owner、服务边界、幂等与失败恢复策略。
- 为后续 contracts、feature packet 与实现计划提供恢复入口。

## 2. 当前范围

本 workspace 负责：

- system admin 发起 tenant onboarding 的目标流程。
- `TenantOnboardingRun` 轻量 Saga / Process Manager 状态设计。
- `tenant-org-service`、`party-service`、`identity-service`、`auth-service`、`permission-service` 的协作边界。
- Gateway / BFF 与 tenant-web 的外部入口和展示形态。
- 失败、重试、部分成功与人工处理语义。

本 workspace 不负责：

- seed / reset 主线。
- 完整 `workflow-service` 建设。
- employee / employment / HR 任职真相。
- 把 account 到 org 的长期归属放入 identity 或 tenant-org。
- 跨服务共享数据库或跨库事务。

## 3. 已冻结决定

| 日期 | 决定 | 影响范围 | 回写目标 |
| --- | --- | --- | --- |
| 2026-05-02 | 当前阶段不引入完整 `workflow-service`。 | 平台流程编排边界 | feature packet / architecture collaboration |
| 2026-05-02 | tenant onboarding 由 `tenant-org-service` 内部轻量 Saga / Process Manager 承接。 | tenant lifecycle / onboarding owner | tenant-org contract / feature packet |
| 2026-05-02 | Gateway 不做跨服务主编排，只做入口、鉴权、DTO 与展示适配。 | API Gateway / BFF 边界 | api-gateway contract |
| 2026-05-02 | `tenant-org-service` 只记录 onboarding run、step 状态与外部对象引用，不拥有 party / identity / auth / permission 真相。 | 数据边界 | service collaboration doc / feature packet |
| 2026-05-02 | 设计需预留未来迁移到 `workflow-service`。 | 长流程演进 | future workflow design |
| 2026-05-02 | permission 不应复用 employee 语义的 grant 作为首租户管理员授权接口。 | permission contract | permission-service contract |

## 4. 当前现状摘要

当前 tenant 创建入口：

- Frontend: `app/web/apps/tenant-web/src/views/admin/tenant-management.vue`
- Gateway HTTP: `src/services/api-gateway/src/modules/tenant-org-service/interface/http/controllers/tenant-management.controller.ts`
- Gateway service: `src/services/api-gateway/src/modules/tenant-org-service/tenant-management.service.ts`
- tenant-org-service application: `src/services/system/tenant-org-service/src/application/services/tenant-org-management.service.ts`

当前 `POST /tenant-management/tenants` 只创建：

- `Tenant`
- root `OrgUnit`

当前缺失：

- tenant 对应的 organization `Party`
- organization `TenantParty`
- root org 的 `organizationPartyId`
- first admin 的 person party / user / account / login method / role grant
- onboarding run 状态、幂等键、失败恢复入口

当前 first tenant user 没有 onboarding 专用入口，只能复用普通账号管理：

- Gateway HTTP: `POST /auth/admin/accounts`
- 普通账号创建当前会创建 `PersonParty + User + UserAccount + LoginMethod`
- 前端普通账号表单不传 `initialRoleIds`
- 当前不会自动派生并授予 `tenant.admin`

## 5. 目标流程

```text
frontend
  -> api-gateway / tenant-management BFF
    -> tenant-org-service StartTenantOnboarding
      -> party-service RegisterOrganizationParty
      -> tenant-org-service CreateTenant + root OrgUnit
      -> party-service BindExistingPartyToTenant
      -> identity-service CreateUserAccount
        -> party-service RegisterPersonParty
      -> auth-service BootstrapUserLoginMethods
      -> auth-service RequirePasswordSetup
      -> permission-service EnsureTenantRoleInstanceFromTemplate
      -> permission-service GrantInitialAccessForTenantAccount
      -> tenant-org-service MarkOnboardingSucceeded
```

关键原则：

- 不做跨库事务。
- 每个 owner service 只提交自己的本地事务。
- `tenant-org-service` 记录 Saga 进度和外部对象 id。
- 重试从上次失败点继续，不重复创建已成功对象。
- 失败不会让 Gateway 猜测状态，必须返回明确 run / step 状态。

## 6. 服务边界表

| 步骤 | 对象 / 动作 | Owner service | tenant-org-service 只能记录 |
| --- | --- | --- | --- |
| 1 | onboarding run | tenant-org-service | run id、idempotency key、step 状态 |
| 2 | organization party | party-service | `organizationPartyId` |
| 3 | tenant | tenant-org-service | 本地真相 |
| 4 | root org | tenant-org-service | 本地真相，含 `organizationPartyId` |
| 5 | organization tenant-party | party-service | `organizationTenantPartyId` |
| 6 | person party | party-service | 通过 identity 返回的 `personPartyId` / `personTenantPartyId` |
| 7 | user | identity-service | `userId` |
| 8 | tenant account | identity-service | `accountId` |
| 9 | login method | auth-service | bootstrap result |
| 10 | password setup gate | auth-service | password setup required flag |
| 11 | tenant.admin role instance | permission-service | `roleId` |
| 12 | tenant.admin grant | permission-service | `grantId` |

## 7. `TenantOnboardingRun` 草案

建议由 `tenant-org-service` 持久化最小流程状态。

### 7.1 Run 字段

- `id`
- `idempotencyKey`
- `status`: `PENDING | RUNNING | FAILED_RETRYABLE | FAILED_NEEDS_MANUAL_REVIEW | SUCCEEDED`
- `tenantId`
- `rootOrgId`
- `organizationPartyId`
- `organizationTenantPartyId`
- `firstAdminUserId`
- `firstAdminAccountId`
- `firstAdminPersonPartyId`
- `firstAdminTenantPartyId`
- `tenantAdminRoleId`
- `tenantAdminGrantId`
- `requestFingerprint`
- `failureCode`
- `failureMessage`
- `createdBy`
- `createdAt`
- `updatedAt`
- `completedAt`

### 7.2 Step 字段

- `runId`
- `stepKey`
- `status`: `NOT_STARTED | RUNNING | SUCCEEDED | FAILED`
- `attemptCount`
- `lastErrorCode`
- `lastErrorMessage`
- `externalRefJson`
- `startedAt`
- `completedAt`

### 7.3 Step keys

- `REGISTER_ORGANIZATION_PARTY`
- `CREATE_TENANT_WITH_ROOT_ORG`
- `BIND_ORGANIZATION_TENANT_PARTY`
- `CREATE_FIRST_ADMIN_ACCOUNT`
- `BOOTSTRAP_FIRST_ADMIN_LOGIN_METHODS`
- `REQUIRE_FIRST_LOGIN_PASSWORD_SETUP`
- `ENSURE_TENANT_ADMIN_ROLE`
- `GRANT_TENANT_ADMIN_ROLE`

## 8. API 草案

### 8.1 Gateway HTTP

`POST /tenant-management/onboardings`

```json
{
  "idempotencyKey": "tenant-onboarding-alpha-001",
  "tenant": {
    "code": "tenant.alpha",
    "name": "Alpha Tenant"
  },
  "organizationParty": {
    "legalName": "Alpha Ltd.",
    "registeredCountry": "CN",
    "identifiers": [
      {
        "identifierType": "business_registration_no",
        "rawValue": "91310000XXXXXXXXXX",
        "issuerCountryOrRegion": "CN"
      }
    ]
  },
  "rootOrg": {
    "name": "Alpha Root"
  },
  "firstAdmin": {
    "displayName": "Tenant Admin",
    "email": "admin@example.com",
    "phone": "+8613800000000",
    "requirePasswordSetup": true
  }
}
```

Response:

```json
{
  "onboardingId": "run-id",
  "status": "SUCCEEDED",
  "tenant": {
    "id": "tenant-id",
    "code": "tenant.alpha",
    "name": "Alpha Tenant",
    "rootOrgId": "root-org-id"
  },
  "organizationParty": {
    "partyId": "organization-party-id",
    "tenantPartyId": "organization-tenant-party-id"
  },
  "firstAdmin": {
    "userId": "user-id",
    "accountId": "account-id",
    "personPartyId": "person-party-id",
    "tenantPartyId": "person-tenant-party-id"
  },
  "access": {
    "roleCode": "tenant.admin",
    "roleId": "role-id",
    "grantId": "grant-id"
  },
  "steps": []
}
```

Supporting APIs:

- `GET /tenant-management/onboardings/:onboardingId`
- `POST /tenant-management/onboardings/:onboardingId/retry`

### 8.2 tenant-org-service gRPC / application

建议新增：

- `StartTenantOnboarding`
- `GetTenantOnboarding`
- `RetryTenantOnboarding`

`CreateTenant` 可继续作为低阶 tenant management 能力保留；onboarding 不应再让 Gateway 自行组合低阶接口。

## 9. 下游契约缺口

### 9.1 party-service

当前 `RegisterOrganizationParty` / `RegisterPersonParty` / `BindExistingPartyToTenant` 没有显式幂等键。

建议补充其一：

- 最小方案：onboarding run 记录成功外部 id，失败后先 query / detect，再继续。
- 正式方案：party registration / binding 写接口支持 `idempotency_key`。

推荐正式方案，但可分阶段落地。

### 9.2 identity-service

当前 `CreateUserAccount` 会通过 party-service 创建 person party / tenant-party，但上游响应主要返回 account summary。

建议 onboarding 需要 identity 返回：

- `userId`
- `accountId`
- `personPartyId`
- `personTenantPartyId`

若不改通用 `CreateUserAccount`，可新增 onboarding-oriented response 或 query hydration。

### 9.3 auth-service

当前已有：

- `BootstrapUserLoginMethods`
- `RequirePasswordSetup`

tenant onboarding 应明确调用顺序：

1. bootstrap login methods
2. require password setup when request requires it

auth-service 仍不接收明文初始密码。

### 9.4 permission-service

当前已有 employee 语义接口：

- `GrantInitialAccessForEmployeeAccount`

tenant onboarding 不应复用该语义。

建议新增：

- `EnsureTenantRoleInstanceFromTemplate`
  - input: `tenant_id`, `template_role_code = "tenant.admin"`, `idempotency_key`
  - output: `role`
- `GrantInitialAccessForTenantAccount`
  - input: `tenant_id`, `account_id`, `role_ids`, `idempotency_key`, `reason`
  - output: `grant`

## 10. 幂等与失败恢复

### 10.1 总体幂等

- Gateway 必须传 `idempotencyKey`。
- tenant-org-service 用 `requestFingerprint` 防止同一 key 对应不同请求。
- 同一 key 重复提交：
  - 若 run 成功，返回相同 result。
  - 若 run 可重试失败，继续未完成步骤或返回当前状态。
  - 若 fingerprint 冲突，返回 idempotency conflict。

### 10.2 失败策略

| 失败点 | 已有副作用 | 恢复策略 |
| --- | --- | --- |
| organization party 创建后失败 | organization party 可能已存在 | 记录 party id；重试复用 |
| tenant/root org 创建后失败 | tenant/root org 已存在 | 不删除；继续 tenant-party 绑定 |
| tenant-party 绑定失败 | tenant/root org 已存在 | 重试绑定或进入人工处理 |
| first admin account 创建失败 | 前序对象已存在 | 重试账号创建 |
| login method 创建失败 | account 已存在 | 重试 auth bootstrap |
| password setup 失败 | login method 可能已存在 | 重试 password setup |
| role instance 派生失败 | account 已存在 | 重试 ensure role |
| role grant 失败 | account/login/role 可能已存在 | 重试 grant，不重复建账号 |

默认不物理删除已创建主数据。

可选补偿：

- onboarding 长期失败时，可将 tenant 标记为 `SUSPENDED` 或 onboarding-specific `FAILED_NEEDS_MANUAL_REVIEW`。
- 是否引入 `TenantStatus.PROVISIONING` 仍需在 contract 阶段单独确认。

## 11. 前端设计草案

当前 `tenant-management.vue` 的“创建 Tenant” Modal 应升级为 onboarding wizard。

建议步骤：

1. Tenant 基础信息
   - tenant code
   - tenant name
2. 组织主体
   - legal name
   - registered country
   - identifiers
3. Root org
   - root org name
   - 展示将绑定 organization party
4. 第一个管理员
   - display name
   - email
   - phone
   - require password setup
5. Review
   - 显示将创建的对象清单
6. Result
   - 成功：展示 tenant / root org / party / account / role grant
   - 失败：展示失败 step、可重试状态与 retry 操作

前端不应让用户选择 `tenant.admin` role id。前端只展示“将授予租户管理员”，role 派生和授权由 permission-service owning API 完成。

## 12. 风险点

- 若下游写接口没有幂等键，重试逻辑会依赖查询与唯一约束，恢复体验较弱。
- 若不引入 onboarding run 状态，失败后无法稳定告诉前端“完成到哪一步”。
- 若复用 employee grant，会污染 permission 语义。
- 若 Gateway 编排，会让 BFF 变成长流程 owner，违背当前已确认边界。
- 若现在引入完整 `workflow-service`，会把本任务扩大为平台流程引擎建设。

## 13. 待确认问题

| 日期 | 问题 | 为什么未冻结 | 下一步 |
| --- | --- | --- | --- |
| 2026-05-02 | 是否引入 `TenantStatus.PROVISIONING` | 会改变 tenant lifecycle 语义 | contract/design 阶段确认 |
| 2026-05-02 | party-service 写接口是否第一版就补 `idempotency_key` | 影响 contract 修改范围 | 实现计划前确认 |
| 2026-05-02 | identity-service 是否扩展 `CreateUserAccount` response | 影响通用账号契约 | contract 阶段确认 |
| 2026-05-02 | permission 新接口命名采用 tenant-specific 还是 generic account onboarding | 影响长期授权 onboarding 模型 | permission contract 阶段确认 |

## 14. 真相源回写计划

- 服务职责：
  - `docs/architecture/services/tenant-org-service.md`
  - `docs/architecture/services/permission-service.md`
- 协同蓝图：
  - 新增或更新 tenant onboarding collaboration 文档
- contracts：
  - `docs/contracts/tenant-org-service/management.md`
  - `docs/contracts/api-gateway/**`
  - `docs/contracts/permission-service/**`
  - 必要时更新 `party-service` / `identity-service` / `auth-service` contracts
- feature packet：
  - 新增 `docs/plans/features/tenant-onboarding-flow-hardening.md`

## 15. 恢复入口

下次继续前先读：

- `docs/plans/designs/tenant-onboarding-flow-hardening.md`
- `docs/architecture/services/tenant-org-service.md`
- `docs/architecture/services/party-service.md`
- `docs/architecture/services/identity-service.md`
- `docs/architecture/services/auth-service.md`
- `docs/architecture/services/permission-service.md`
- `docs/contracts/permission-service/onboarding-grant.md`

当前推荐下一步：

- 将本 workspace 转成 feature packet 草案。
- 冻结 tenant-org onboarding API 与 permission onboarding grant contract。
- 主控确认待确认问题后，再进入实现计划。
