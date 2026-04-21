# ADR 0003: Party Master Service And Tenant Party Binding

## Status

Accepted

## Context

OES needs a stable way to represent real-world natural persons and organizations that can participate in quotes, contracts, orders, invoices, accounting, CRM, SRM, tenant organization, identity, and future HR scenarios.

The earlier `entity-service` framing was too broad. It described a generic real-world entity abstraction, but it did not clearly separate:

- canonical legal / natural party truth
- tenant-owned party references
- business roles such as customer, supplier, employee, and contact
- tenant-internal organization nodes
- transaction-time snapshots

This creates a risk that identity, CRM, SRM, tenant organization, HR, and transaction services each re-model people and organizations differently, or that one generic entity service accumulates unrelated business semantics.

## Decision

OES will evolve the previous `entity-service` concept into `party-service`.

`party-service` owns party master data:

- `Party`
  - canonical natural person or organization subject.
- `TenantParty`
  - tenant-owned binding to a party; first-phase business domains should reference this identifier.
- `PartyIdentifier`
  - stable identifiers such as tax ID, business registration number, passport number, or national ID.
- `PartyRelationship`
  - a small set of stable party-to-party relationships such as subsidiary, branch, legal representative, shareholder, or beneficial owner.

Business roles remain outside `party-service`:

- CRM owns customer and customer contact semantics.
- SRM owns supplier and supplier contact semantics.
- HR owns employee and employment semantics.
- Tenant organization owns org tree, org membership, and org scope semantics.
- Identity owns accounts, login identity, and operator context.

First-phase business documents should reference `tenantPartyId` rather than raw `partyId`, and should preserve transaction-time snapshots for legally or commercially relevant fields.

## Consequences

- `party-service` becomes the stable service name and architecture truth source for party master data.
- `TenantParty` is the default business-domain reference point for quotes, orders, contracts, invoices, CRM customers, and SRM suppliers.
- `partyId` remains the canonical identity of a natural person or organization, but it should not be used by business domains to bypass tenant ownership.
- Names are not global uniqueness keys. Strong matching must rely on scoped identifiers and verification state.
- Contacts are not modeled as party relationships in the first phase. CRM and SRM own contact roles and may reference person parties.
- Organization nodes are not parties by default. `tenant-org-service` may optionally associate an `OrgUnit` with an organization party when a node represents a legal organization.
- Historical transactions must keep snapshots because party names, identifiers, addresses, or relationships can change over time.

## Transition Risk And Guardrails

This ADR freezes the target architecture, not the current runtime implementation.

The repository may still contain code, package names, generated contracts, database schemas, service identifiers, or runtime configuration under the old `entity-service` name until a dedicated migration task is executed.

During the transition:

- New architecture documents should use `party-service` as the stable target name.
- Existing runtime references to `entity-service` must be treated as legacy implementation details, not as the long-term service boundary.
- Feature work that depends on party master data must not introduce new `entity-service` semantics or expand the old generic entity model.
- Any code-level rename must be handled as an explicit migration, including contracts, generated clients, service discovery, package names, Prisma artifacts, tests, and downstream callers.
- If a thread needs to touch current `entity-service` code before the migration, it must state whether it is making a compatibility change or beginning the formal `party-service` migration.

## Deferred Work

- Rename existing code, package names, generated contracts, and runtime service identifiers from `entity-service` to `party-service`.
- Design the concrete gRPC contracts for party registration, tenant binding, matching, merging, and query.
- Design detailed identifier verification and merge governance workflows.
- Decide how much external registry / public business data integration belongs in future party master capabilities.
- Define event contracts such as `party.registered`, `tenant_party.bound`, `party.merged`, and `tenant_party.deactivated`.
