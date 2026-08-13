# party-service Contracts

## 1. 目的

本目录提供 `party-service` 的黑盒接口文档。稳定服务边界以 [party-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/party-service.md) 和 [ADR 0008](/Users/acehood/Documents/GitHub/oes/docs/adr/0008-tenant-scoped-tenant-party-primary-party-model.md) 为准。

`party-service` 当前采用 tenant-scoped `TenantParty` 作为核心主体模型；ADR 0003 的 system-wide `Party + TenantParty binding` 模型仅作为历史记录保留。

## 2. 模块划分

- [registration.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/party-service/registration.md)
  - `RegisterTenantParty`
  - `DeactivateTenantParty`
- [query.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/party-service/query.md)
  - `GetTenantPartyById`
  - `ResolveTenantPartyByIdentifier`
  - `ResolveTenantPartyForConsumer`
  - `SearchTenantPartyCandidates`

`merge.md` 是 ADR 0003 时期的历史 contract 记录，不再代表当前 runtime 主路径；未来如恢复跨租户主体治理，必须新增 ADR 与新 contract。

## 3. 全局调用约束

- 所有接口均为内部服务接口，不直接对外部客户端开放。
- 所有调用方都应将 `party-service` 视为 black box。
- 业务域默认引用 `tenantPartyId`，而不是旧 `partyId`。
- `Tenant / OrgUnit / org tree / organizationTenantPartyId` 边界以 [tenant-org-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/tenant-org-service.md) 为准。
- 所有六个 RPC 都使用 Party audience 的 SYSTEM MACHINE certificate-bound ET；tenant scope 从 ET 派生，不再信任 request body 的 `tenant_id`。
- Gateway 先完成 HUMAN HTTP 授权，再以自己的 SYSTEM MACHINE ET 调用 Party；Party 不混合 HUMAN 与 MACHINE 两套 RPC 模式。

## 4. 当前最小 Contract Surface

- `PartyRegistrationService.RegisterTenantParty`
- `PartyRegistrationService.DeactivateTenantParty`
- `PartyQueryService.GetTenantPartyById`
- `PartyQueryService.ResolveTenantPartyByIdentifier`
- `PartyQueryService.ResolveTenantPartyForConsumer`
- `PartyQueryService.SearchTenantPartyCandidates`

不包含：

- customer / supplier / employee / contact 业务角色管理。
- org tree 或 org membership 管理。
- system-wide Party、PersonParty、OrganizationParty。
- global merge / unmerge / redirect / downstream repair。
