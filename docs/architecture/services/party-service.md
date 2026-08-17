# party-service 职责卡

Last Updated: 2026-06-27

## 1. Purpose

`party-service` 是 OES 的租户主体主档服务，负责回答“当前租户内这个可被交易、签约、开票、结算、任职或审计的自然人 / 组织主体是谁”。

本服务以 ADR 0008 为准，采用 tenant-scoped `TenantParty` 作为核心主体模型；ADR 0003 的 system-wide `Party + TenantParty binding` 模型已被替代。

涉及 HR `Employee / Employment`、员工生命周期或正式 `人 -> org` 归属时，以 [hr-service.md](./hr-service.md) 为准；本文只定义租户主体主档与主体基础事实边界。

## 2. Owns

- `TenantParty`：租户内现实主体主档。
- `TenantParty.type`：`PERSON` 或 `ORGANIZATION`。
- `TenantPartyIdentifier`：租户内主体标识，唯一性为 `tenantId + identifierType + issuerCountryOrRegion + normalizedValue`。
- `TenantPartyProfileItem`：租户主体画像资料项，承载 email、phone、WhatsApp、domain、website、social profile、marketplace store 等可识别、可触达、可展示资料。
- `TenantPartyAddress`：租户视角的主体地址簿正文。
- `TenantPartyContact`：租户视角的主体联系人簿正文。
- 供 CRM、SRM、HR、Tenant Org、Sales、Finance 等上下文受控引用的 `tenantPartyId` 主体基础事实。

## 3. Does Not Own

- system-wide `Party`、`PersonParty`、`OrganizationParty`、全局主体合并或跨租户主体统一。
- `CanonicalSubject`、`GlobalSubject`、外部 registry steward 或跨租户 MDM 治理。
- 登录认证、会话、账号、角色、权限、授权判定。
- 租户内部组织树、部门、小组、组织成员归属；这些以 [tenant-org-service.md](./tenant-org-service.md) 为准。
- 客户、供应商、员工等业务角色语义；CRM、SRM、HR 分别拥有自己的业务角色状态、usage 与审计。
- 销售、采购、收发货、开票、收付款等交易单据地址 / 联系人 snapshot。

## 4. Core Responsibilities

- 统一注册当前租户内的自然人或组织主体。
- 通过 `TenantParty.type` 区分 `PERSON` 与 `ORGANIZATION`，不再通过单独的 Person / Organization 运行时主模型表达。
- 维护租户内主体生命周期状态、法定 / 官方名称、展示名、本地编码、注册国家或地区。
- 维护租户内唯一的主体标识，支持按当前租户解析 identifier。
- 维护租户主体画像资料项，支持按 profile item 搜索候选主体。
- 为 HR onboarding 创建或复用 `PERSON` TenantParty。
- 为 tenant onboarding 创建当前租户自己的 `ORGANIZATION` TenantParty。
- 为 CRM / SRM / Sales / Finance 提供当前租户内 `tenantPartyId` / `customerTenantPartyId` / `supplierTenantPartyId` 引用基础。
- 支撑租户内候选搜索与按 `tenantId + tenantPartyId` 查询。
- 支撑租户内主体停用；停用不是物理删除。

## 5. Core Object Rules

### 5.1 TenantParty

`TenantParty` 是租户内现实主体主档。

核心字段包括：

- `id`
- `tenantId`
- `type`
- `legalName`
- `displayName`
- `localCode`
- `registeredCountry`
- `status`

业务域默认引用 `tenantPartyId`，不得使用旧 `partyId` 作为租户内主体主路径。

### 5.2 TenantPartyIdentifier

`TenantPartyIdentifier` 表达当前租户内的官方主体识别号与稳定证照标识。

- 唯一性为 `tenantId + identifierType + issuerCountryOrRegion + normalizedValue`。
- 名称不是唯一键。
- `domain`、`website`、`email`、`phone`、`whatsapp`、`social profile` 不属于 `TenantPartyIdentifier`。
- Identifier 命中可以作为强主体匹配依据；profile item 命中只能作为候选匹配依据，除非后续 ADR 明确提升某一类型的治理强度。
- 同一个现实世界主体在不同租户中可以形成不同 `TenantParty`，本轮不建立跨租户同一性。

### 5.3 TenantPartyProfileItem

`TenantPartyProfileItem` 表达当前租户认为某个 `TenantParty` 关联的画像资料项。

适用类型包括：

- `EMAIL`
- `PHONE`
- `WHATSAPP`
- `WECHAT`
- `DOMAIN`
- `WEBSITE`
- `SOCIAL_PROFILE`
- `MARKETPLACE_STORE`

核心语义：

- Profile item 不是强主体 identifier。
- Profile item 可用于候选搜索、展示、触达与业务确认，但不得绕过 `TenantPartyIdentifier` 的强匹配边界。
- `DOMAIN / WEBSITE` 表达外部主体与域名或站点的业务关联，不表达当前租户对该域名的 DNS 控制权。
- 租户自有域名绑定、登录域名、自定义短链域名与 DNS 验证不属于 `party-service`；应由租户域名或 public-entry 相关能力单独拥有。
- `TenantPartyProfileItem` 是唯一长期模型；email、phone、WhatsApp、domain、website 与 social profile 均按 profile item 归档。

### 5.4 Address / Contact

`party-service` 可拥有租户主体地址与联系人正文，但不拥有业务 usage。

- CRM 拥有客户地址 / 联系人 usage。
- SRM 拥有供应商地址 / 联系人 usage。
- HR 拥有员工任职与组织归属语义。
- 交易单据必须保存自己的历史 snapshot。

## 6. External Interfaces

当前已落地的黑盒能力：

- `PartyRegistrationService.RegisterTenantParty`
- `PartyRegistrationService.DeactivateTenantParty`
- `PartyQueryService.GetTenantPartyById`
- `PartyQueryService.ResolveTenantPartyByIdentifier`
- `PartyQueryService.ResolveTenantPartyForConsumer`
- `PartyQueryService.SearchTenantPartyCandidates`

已移除的旧运行时主路径：

- `RegisterPersonParty`
- `RegisterOrganizationParty`
- `BindExistingPartyToTenant`
- `GetPartyById`
- global `ResolvePartyByIdentifier`
- global `SearchPartyCandidates`
- `MergeParties`

## 7. Downstream / Published Facts

- `tenantPartyId` 对应的租户主体事实。
- `TenantParty.type`、名称、展示名、本地编码、注册国家或地区、状态。
- 租户内 identifier 解析结果。
- 租户内 profile item 候选匹配结果。
- 租户内候选主体列表。

## 8. Non-goals

- 不做跨租户主体去重、合并、unmerge、redirect 或下游引用修复。
- 不做 `CanonicalSubject / GlobalSubject`。
- 不让业务域绕过 `TenantParty` 直接复制主体主数据。
- 不保留旧 `partyId` 字段作为运行时主路径。

## 9. Current Runtime Alignment

当前 runtime / proto / generated client 已采用统一 `RegisterTenantParty` 与 tenant-scoped query surface。

迁移只允许在 migration SQL 中读取旧 `Party / PersonParty / OrganizationParty / partyId` 数据用于搬迁；最终 Prisma schema、服务代码、proto、gateway、tenant-web 不应保留旧主路径。

## 10. Trusted gRPC inbound boundary

All six current Party RPCs are internal foundation calls, not end-user business APIs. Each call requires `aud=urn:oes:service:party-service`, an exact registered SYSTEM MACHINE workload, mTLS certificate binding and a short-lived ExecutionToken carrying the matching `party.internal.*` Code. Gateway uses its own SYSTEM MACHINE ET after completing any user-facing authorization; Party does not re-evaluate the user's HUMAN role.

Party rejects HUMAN, DELEGATED, tenant-scoped MACHINE, unknown workload, wrong issuer/audience/certificate binding, missing or mismatched Code and legacy metadata/body authority. The request `tenant_id` field is removed and reserved at field number 1 on all six requests. Tenant scope is derived from the verified ET and must match every tenant-scoped target; response `TenantPartySummary.tenant_id` remains a business projection.

The six frozen INTERNAL Codes are `party.internal.register_tenant_party`, `party.internal.deactivate_tenant_party`, `party.internal.get_tenant_party_by_id`, `party.internal.resolve_tenant_party_by_identifier`, `party.internal.resolve_tenant_party_for_consumer` and `party.internal.search_tenant_party_candidates`. Current workload allowlists are exact: Identity, HR, TenantOrg and CRM may register; TenantOrg is the only current deactivation owner; Gateway, HR, TenantOrg, CRM and SRM may query by id; CRM may resolve consumer evidence; identifier resolution and candidate search have no current production caller and remain reserved for a future explicitly registered workload. No Party business capability, merge path, schema or outbound collaboration changes in this migration.

Party caller migration is intentionally two-phase. Phase 1 prepares the five existing non-Gateway callers (CRM, SRM, HR, Identity and TenantOrg) with service-owned dedicated Party clients, module DI, trusted metadata/exchange composition and fail-closed tests. During preparation, a caller with no verified source credential or target-audience ExecutionToken fails closed; it does not manufacture tenant, principal, Permission Code or ordinary metadata authority. Each caller keeps its own adapter and provider files inside its package; cross-package relative imports are forbidden. The legacy Party metadata/body fallback is removed from these caller paths.

Phase 2 begins only after the already-defined Auth/Identity/Permission MACHINE foundation is available to the deployment: each workload receives its own registered Machine Principal and SPIFFE binding, obtains an Auth-owned short-lived MachineWorkloadSourceCredential, exchanges it through Auth STS for `aud=urn:oes:service:party-service`, and sends the certificate-bound ET over mTLS. Final acceptance then exercises the real credential, STS, audience and certificate bindings end to end. This sequencing changes no Party RPC, business rule, persistence, schema, or outbound collaboration and does not migrate any other RPC in the five caller services.
