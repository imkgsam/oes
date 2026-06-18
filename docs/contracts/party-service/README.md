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
  - `SearchTenantPartyCandidates`

`merge.md` 是 ADR 0003 时期的历史 contract 记录，不再代表当前 runtime 主路径；未来如恢复跨租户主体治理，必须新增 ADR 与新 contract。

## 3. 全局调用约束

- 所有接口均为内部服务接口，不直接对外部客户端开放。
- 所有调用方都应将 `party-service` 视为 black box。
- 业务域默认引用 `tenantPartyId`，而不是旧 `partyId`。
- `Tenant / OrgUnit / org tree / organizationTenantPartyId` 边界以 [tenant-org-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/tenant-org-service.md) 为准。
- 调用链应传递 tenant / operator / trace context；更强 permission guard 与 audit event 持久化按后续治理能力补齐。

## 4. 当前最小 Contract Surface

- `PartyRegistrationService.RegisterTenantParty`
- `PartyRegistrationService.DeactivateTenantParty`
- `PartyQueryService.GetTenantPartyById`
- `PartyQueryService.ResolveTenantPartyByIdentifier`
- `PartyQueryService.SearchTenantPartyCandidates`

不包含：

- customer / supplier / employee / contact 业务角色管理。
- org tree 或 org membership 管理。
- system-wide Party、PersonParty、OrganizationParty。
- global merge / unmerge / redirect / downstream repair。
- 旧接口兼容 alias。
