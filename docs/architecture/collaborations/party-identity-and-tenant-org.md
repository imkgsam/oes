# Party、Identity、HR 与 Tenant/Org 协同蓝图

Last Updated: 2026-06-10

## 1. 目标

定义 OES 中现实世界主体、登录身份、租户边界与组织结构之间的协同方式。

本协同以 [ADR 0008](../../adr/0008-tenant-scoped-tenant-party-primary-party-model.md) 为准：核心主体模型是 tenant-scoped `TenantParty`。

## 2. 真相归属

- `party-service`
  - 当前租户内 `TenantParty`、`TenantPartyIdentifier`、主体基础事实。
- `identity-service`
  - `User` 技术身份、`UserAccount`、账号联系资产、`UserAccount <-> Employee` binding。
  - `User` 不绑定 Party。
  - tenant `UserAccount` 可关联当前租户内 `tenantPartyId`。
- `tenant-org-service`
  - `Tenant`、`OrgUnit`、org tree、org hierarchy、`organizationTenantPartyId`。
- `hr-service`
  - `Employee / Employment` 与正式 `Employment -> OrgUnit` 任职事实。

各服务长期职责以对应 `docs/architecture/services/<service>.md` 为准。

## 3. 核心协同规则

- 业务域默认引用 `tenantPartyId`，不得绕回旧 `partyId`。
- `Employee` 只保留 `tenantPartyId` 作为主体引用。
- `UserAccount <-> Employee` binding 必须校验同 tenant，且 `UserAccount.tenantPartyId == Employee.tenantPartyId`。
- `OrgUnit.organizationTenantPartyId` 指向当前租户内 `ORGANIZATION` TenantParty；`OrgUnit` 不等于 Party。
- `account -> org` 不是正式人到组织归属；正式归属来自 `Employment -> OrgUnit`。

## 4. 允许协同

- `identity-service -> party-service`：创建或查询 tenant-scoped `PERSON` TenantParty，用于 tenant account 关联。
- `hr-service -> party-service`：创建或复用 tenant-scoped `PERSON` TenantParty，用于 Employee。
- `tenant-org-service -> party-service`：创建或查询 tenant-scoped `ORGANIZATION` TenantParty，用于 root / branch org binding。
- `api-gateway -> 下游服务`：只做 BFF DTO、展示适配和受控调用，不重新定义主体或组织 owner 语义。

## 5. 明确禁止

- 不恢复 system-wide Party 作为运行时主路径。
- 不让 `identity-service` 维护真实姓名或自然人主体 truth。
- 不让 `tenant-org-service` 拥有主体主档。
- 不让 `party-service` 承担登录、会话、org tree、客户联系人或员工任职语义。
- 不让前端绕过 Gateway / BFF 直接消费内部 gRPC 服务。

## 6. 关联文档

- [party-service.md](../services/party-service.md)
- [identity-service.md](../services/identity-service.md)
- [tenant-org-service.md](../services/tenant-org-service.md)
- [hr-service.md](../services/hr-service.md)
- [employee-onboarding.md](./employee-onboarding.md)
