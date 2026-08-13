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

非 Gateway 调用方也必须使用各自的 SYSTEM MACHINE 身份。入站 HUMAN ET（如果存在）只提供上游 subject、tenant/org 与 trace/audit 归因，不能直接作为 Party authority；调用方必须在 request-local scope 中建立自己的 `TrustedExecutionContext`（`principalType=MACHINE`、自身 subject、可信 request id 与 W3C `traceparent`），再由 Common `TrustedGrpcMetadataProvider` 通过自身 source credential 换取 Party audience ET。缺少可信 context、有效 source credential、当前 workload/binding selector 或 Party ET 时直接 fail closed；不回退到普通 metadata、body identity 或 Gateway 身份。

Phase 1 的 provider preparation 与 Phase 2 的真实 MACHINE 联调共用同一 contract：selector 只来自部署配置（自身 Machine Principal、`MachineWorkloadBinding` reference/version 与 workload SPIFFE），Auth/Identity/Permission 负责最终复核，调用方不能自行声明 tenant、scope、grant 或 certificate facts。稳定错误分类为 `PARTY_CALLER_EXECUTION_CONTEXT_REQUIRED`、`PARTY_CALLER_FOUNDATION_UNAVAILABLE` 与 `PARTY_CALLER_SOURCE_CREDENTIAL_INVALID`；三者都终止调用，不产生业务副作用。每个服务保留自己的 adapter/provider 文件，禁止跨 package 相对导入或复用 Gateway MACHINE producer。

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
