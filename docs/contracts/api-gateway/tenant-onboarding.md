# API Gateway Tenant Onboarding Contract

## 1. 目的

定义 tenant-web / system admin 发起 tenant onboarding 的 HTTP BFF contract。

Gateway 只负责客户端入口、鉴权、DTO 校验、下游调用与展示适配，不拥有 onboarding step 状态。

当前文档冻结目标 HTTP contract 语义，尚未表示 runtime 已实现。

## 2. 下游 owner

- 主要下游：`tenant-org-service`
- Gateway 调用：
  - `StartTenantOnboarding`
  - `GetTenantOnboarding`
  - `RetryTenantOnboarding`

Gateway 不直接调用：

- `party-service`
- `identity-service`
- `auth-service`
- `permission-service`

## 3. `POST /tenant-management/onboardings`

### 3.1 作用

启动或恢复一次 tenant onboarding。

### 3.2 权限要求

- 当前 session 必须为 `SYSTEM` scope。
- 当前 account 必须具备 tenant onboarding 创建权限。
- 第一版可复用或扩展 tenant management 权限码；若新增权限码，必须先回写 permission code source 与 role baseline。

### 3.3 Request

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

### 3.4 Response

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
  "steps": [
    {
      "key": "REGISTER_ORGANIZATION_PARTY",
      "status": "SUCCEEDED",
      "message": ""
    }
  ],
  "failure": null
}
```

## 4. `GET /tenant-management/onboardings/:onboardingId`

### 4.1 作用

读取一次 onboarding run 的当前状态。

### 4.2 Response

同 `POST /tenant-management/onboardings` response。

## 5. `POST /tenant-management/onboardings/:onboardingId/retry`

### 5.1 作用

请求 tenant-org-service 从失败点继续 onboarding。

### 5.2 Request

```json
{
  "reason": "system admin retry after downstream service restored"
}
```

### 5.3 Response

同 `POST /tenant-management/onboardings` response。

## 6. 前端展示要求

tenant-web 应采用 wizard / result 形态：

- tenant 基础信息
- 组织主体
- root org
- 第一个管理员
- review
- result / retry

失败时必须展示：

- onboarding id
- 当前状态
- 失败 step
- 错误消息
- 是否可重试
- 已成功对象摘要

## 7. 错误语义

- validation failure
- permission denied
- idempotency conflict
- downstream unavailable
- onboarding failed retryable
- onboarding failed needs manual review

Gateway 应保留下游 trace / request id，便于排查。

## 8. 明确禁止

- Gateway 不保存 onboarding run 表。
- Gateway 不直接调用 party / identity / auth / permission 完成主流程。
- 前端不选择 `tenant.admin` role id。
- 前端不绕过 Gateway 访问内部服务。
