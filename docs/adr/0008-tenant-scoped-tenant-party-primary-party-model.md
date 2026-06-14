# ADR 0008: Tenant-scoped TenantParty As Primary Party Model

## Status

Accepted

Supersedes [ADR 0003: Party Master Service And Tenant Party Binding](/Users/acehood/Documents/GitHub/oes/docs/adr/0003-party-master-service-and-tenant-party-binding.md).

## Context

ADR 0003 established `party-service` around a system-wide canonical `Party` plus tenant binding model. That model separated global party truth from tenant-owned references, but it also introduced a broad cross-tenant master-data responsibility before OES has proven the governance, merge, external registry, privacy, and stewardship requirements needed to operate a global subject graph safely.

Current implementation and documentation now need a simpler tenant-first subject model for CRM, SRM, HR, Tenant Org, Sales, Finance, Procurement, Identity, Gateway, and tenant-web:

- a tenant can create and govern its own real-world subjects without requiring global uniqueness;
- business services need one stable tenant-scoped subject reference;
- user accounts must support one technical user having different tenant accounts that each refer to different tenant-local real-world persons;
- organization nodes must refer to the current tenant's own organization subject;
- identifiers must be unique only inside a tenant scope;
- global merge and canonical subject governance should not be part of the current runtime path.

This ADR records the new architecture decision. Stable long-term service boundaries remain in `docs/architecture/services/*.md`; contract details remain in `docs/contracts/**`.

## Decision

OES adopts tenant-scoped `TenantParty` as the primary Party model.

The core subject object is `TenantParty`.

`TenantParty` is the tenant-local real-world subject master record. It carries `tenantId` and is the default subject reference for CRM, SRM, HR, Tenant Org, Sales, Finance, and related business contexts.

`TenantParty.type` distinguishes subject kind:

- `PERSON`
- `ORGANIZATION`

The runtime primary model no longer keeps system-wide `Party`, `PersonParty`, or `OrganizationParty` as canonical subject roots.

The target model does not retain deprecated `partyId` compatibility fields or old runtime paths. If migration needs a temporary bridge, it must be implemented as an explicit migration step and removed before the target schema and code are considered complete.

## Object Rules

`TenantParty` owns tenant-local subject truth:

- `tenantId`
- `type`
- legal or official name fields such as `legalName`
- local display fields such as `displayName`
- lifecycle status
- tenant-local identifiers
- tenant-local subject address and contact bodies where owned by `party-service`

Person and organization are not separate runtime master objects. Their differences are modeled through `TenantParty.type` and type-specific validation in domain/application code.

`TenantPartyIdentifier` uniqueness is tenant-scoped:

- `tenantId + identifierType + issuerCountryOrRegion + normalizedValue`

Names are not uniqueness keys.

No `CanonicalSubject`, `GlobalSubject`, system-wide `Party`, cross-tenant subject merge, or cross-tenant subject unification is implemented in this round. Those capabilities are explicitly deferred and require a future ADR plus dedicated governance contracts.

## Identity And Account Rules

`User` is a technical identity and does not bind to Party.

`UserAccount` represents a scoped account context. In a tenant account context, `UserAccount` associates with `tenantPartyId` inside the same tenant.

This supports one `User` having multiple tenant accounts, where each tenant account can associate with a different tenant-local `TenantParty`.

Employee binding must validate the tenant-scoped subject relation:

- `account.tenantId == employee.tenantId`
- `account.tenantPartyId == employee.tenantPartyId`

## HR Rules

`Employee` keeps `tenantPartyId` as its only subject reference.

`Employee.partyId` is removed from the target runtime model. HR onboarding creates or reuses a tenant-scoped `PERSON` `TenantParty` and then creates the employee record against that `tenantPartyId`.

## Tenant Org Rules

`OrgUnit.organizationPartyId` is renamed to `organizationTenantPartyId`.

The field points to a current-tenant `TenantParty` with `type = ORGANIZATION`. Root and branch organization nodes may bind such a subject according to tenant-org rules; department, team, or other node types must not become a backdoor for arbitrary legal subject binding unless tenant-org design is updated first.

Tenant onboarding creates the current tenant's own `ORGANIZATION` `TenantParty` and binds it to the root org through `organizationTenantPartyId`.

## Business Service Rules

CRM and SRM create or select a current-tenant `TenantParty` directly when creating customer or supplier master records.

Sales and Finance continue to use tenant-scoped counterparty references such as `customerTenantPartyId` and `supplierTenantPartyId`. These fields point to tenant-local `TenantParty`, not a binding over a hidden global Party.

Procurement consumes supplier facts through SRM `SupplierProfile` and must not depend directly on Party as a procurement owner path.

API Gateway, BFF, tenant-web clients, pages, and tests must use the new field names and must not keep old aliases such as `organizationPartyId`, `personPartyId`, or business-facing `partyId`.

## Contract Impact

`party-service` registration contracts converge from separate person/organization commands to a unified tenant-scoped create/register capability, such as `CreateTenantParty` or `RegisterTenantParty`.

The following old global Party contract paths are removed from the target runtime:

- `RegisterPersonParty`
- `RegisterOrganizationParty`
- `BindExistingPartyToTenant`
- `GetPartyById`
- global `ResolvePartyByIdentifier`
- global `SearchPartyCandidates`
- global `MergeParties`

Tenant-scoped query capabilities remain or are introduced around `TenantParty`, including:

- get `TenantParty` by `tenantId + tenantPartyId`
- resolve tenant-local identifiers
- search tenant-local subject candidates
- deactivate tenant-local `TenantParty`

Any proto or `src/common` contract changes must be regenerated through the established repository workflow, and all downstream adapters/tests must be updated in the same implementation stream.

## Migration Strategy

Migration must be explicit, repeatable, auditable, and avoid data loss where possible.

Target data migration rules:

- For each old `TenantParty`, create or update one new tenant-scoped `TenantParty` carrying the old `tenantId`, subject type, names, status, local display fields, and local code.
- If old `TenantParty` referenced old `Party / PersonParty / OrganizationParty`, copy only the tenant-visible subject facts needed by the new `TenantParty`; do not preserve global `partyId` as a runtime subject path.
- Move old `PartyIdentifier` rows into tenant-scoped `TenantPartyIdentifier` rows using the owning tenant from the old `TenantParty`.
- Enforce the new unique key `tenantId + identifierType + issuerCountryOrRegion + normalizedValue`.
- If the same old global Party was bound by multiple tenants, produce one new `TenantParty` per tenant. These records are not considered the same runtime subject.
- Migrate `User.partyId` by removing it from `User`. Where a tenant account can be linked to an employee or existing tenant subject, populate `UserAccount.tenantPartyId`.
- Migrate `Employee.partyId` by removing it from `Employee`; keep `Employee.tenantPartyId` as the only subject reference.
- Rename `OrgUnit.organizationPartyId` to `organizationTenantPartyId` and ensure values point to current-tenant `ORGANIZATION` `TenantParty` records.

If historical data cannot be mapped without ambiguity, the migration must record a remediation item with enough context for manual resolution. It must not invent cross-tenant identity links or silently keep old `partyId` as a fallback.

## Consequences

Benefits:

- The first implementation phase has a smaller and clearer bounded context.
- Tenant isolation is explicit in the subject model.
- Business services have one stable default subject reference.
- User, account, employee, and org-node semantics no longer depend on premature global master-data governance.

Costs:

- Cross-tenant duplicate real-world subjects are allowed.
- Future global subject governance will require a new model and migration path.
- Existing proto, Prisma schema, service code, tests, smoke scripts, BFF DTOs, frontend clients, and documentation need coordinated updates.

## Non-goals

This ADR does not implement:

- `CanonicalSubject`
- `GlobalSubject`
- all-tenant Party merge
- global deduplication or external registry stewardship
- cross-tenant subject unification
- user-to-party binding
- long-term compatibility aliases for old `partyId` paths

## Implementation Order

The implementation must proceed in controlled phases:

1. Freeze this ADR and mark ADR 0003 as superseded.
2. Refactor `party-service` schema, contracts, runtime, generated clients, and tests.
3. Refactor `identity-service`, `hr-service`, and `tenant-org-service`.
4. Align CRM, SRM, Sales, Finance, Procurement, Gateway, and tenant-web.
5. Update stable service truth sources, contract documents, collaboration documents, and feature documents.
6. Run service-level, contract, smoke, integration, and frontend tests.
7. Run a final repository scan to confirm old global Party runtime references have been removed.

## Required Cleanup Bar

The final runtime target must not retain dependencies on:

- system-wide `Party`
- `PersonParty`
- `OrganizationParty`
- `RegisterPersonParty`
- `RegisterOrganizationParty`
- `BindExistingPartyToTenant`
- `GetPartyById`
- `User.partyId`
- `Employee.partyId`
- `OrgUnit.organizationPartyId`

Those terms may remain only in historical ADRs, migration notes, or explicitly superseded documentation.
