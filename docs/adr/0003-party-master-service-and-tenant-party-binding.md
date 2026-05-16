# ADR 0003: Party Master Service And Tenant Party Binding

## Status

Accepted

## Context

OES needs a stable way to represent real-world natural persons and organizations that can participate in quotes, contracts, orders, invoices, accounting, CRM, SRM, tenant organization, identity, and future HR scenarios.

Party master data must clearly separate:

- canonical legal / natural party truth
- tenant-owned party references
- business roles such as customer, supplier, employee, and contact
- tenant-internal organization nodes
- transaction-time snapshots

Without this separation, identity, CRM, SRM, tenant organization, HR, and transaction services would each re-model people and organizations differently, or one overly broad service would accumulate unrelated business semantics.

## Decision

OES uses `party-service` as the dedicated party master service.

Current `party-service` responsibilities, core object names, ownership boundaries, and non-goals are defined only in [party-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/party-service.md). This ADR records the architecture decision and must not be used as a second service design source.

Business roles remain outside `party-service`:

- CRM owns customer and customer contact semantics.
- SRM owns supplier and supplier contact semantics.
- HR owns employee and employment semantics; current HR service design is defined only in [hr-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/hr-service.md).
- Tenant organization owns org tree, org membership, and org scope semantics.
- Identity owns accounts, login identity, and operator context.

First-phase business documents should reference `tenantPartyId` rather than raw `partyId`, and should preserve transaction-time snapshots for legally or commercially relevant fields.

## Consequences

- `party-service` becomes the stable service name; its current stable architecture truth source is [party-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/party-service.md).
- `TenantParty` is the default business-domain reference point for quotes, orders, contracts, invoices, CRM customers, and SRM suppliers.
- `partyId` remains the canonical identity of a natural person or organization, but it should not be used by business domains to bypass tenant ownership.
- Names are not global uniqueness keys. Strong matching must rely on scoped identifiers and verification state.
- Contacts are not modeled as party relationships in the first phase. CRM and SRM own contact roles and may reference person parties.
- Organization nodes are not parties by default. `tenant-org-service` may optionally associate an `OrgUnit` with an organization party when a node represents a legal organization.
- Historical transactions must keep snapshots because party names, identifiers, addresses, or relationships can change over time.

## Deferred Work

- Design detailed identifier verification and merge governance workflows.
- Decide how much external registry / public business data integration belongs in future party master capabilities.
- Define event contracts such as `party.registered`, `tenant_party.bound`, `party.merged`, and `tenant_party.deactivated`.

## Status Note 2026-04-23

This ADR remains the architecture decision record and should not be rewritten as an implementation changelog.

Current repository state has advanced beyond parts of the original deferred list:

- `party-service` phase-1 runtime and proto contracts are available.
- Registration, tenant binding, query, and merge black-box contract documents exist under `docs/contracts/party-service/`.
- Detailed merge governance, event contracts, and external registry integration remain deferred.
