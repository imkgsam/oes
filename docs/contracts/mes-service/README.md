# MES Service Contracts

This directory contains black-box contracts for `mes-service`.

The architecture truth source is [mes-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/mes-service.md). Contract documents must reference that architecture baseline and must not redefine MES service ownership, resource hierarchy, mold object design, quality boundary, planning boundary, WMS handoff, or Item Master boundary.

## Current Contract Set

- [production-spec-management.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/mes-service/production-spec-management.md)
- [production-spec-query.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/mes-service/production-spec-query.md)
- [mold-management.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/mes-service/mold-management.md)
- [mold-query.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/mes-service/mold-query.md)

## Rewrite Scope

This contract slice supports the Mold / Tooling foundation only. It freezes the minimum contract surface needed for:

- `ProductionSpec` selection and lifecycle.
- `MoldDesign`, `MasterMold`, and `ProductionMold` management.
- `ToolingInstallation(type=MOLD)` and `MoldInstallationDetail`.
- `MoldUsageRecord` and `MoldLifeCounter`.
- Resource references required by mold storage, movement, and installation.

This slice does not freeze complete `ProductionUnit`, operation execution, quality rule, planning, APS, WMS handoff, or PDA scan execution contracts.

## Historical Replacement Note

Historical phase 1 object names are replaced by the current MES architecture baseline. They are not target contract names and must not be reintroduced by contract, runtime, BFF, or UI layers.

## Contract Rules

- All management commands must carry tenant, optional org, operator, trace, audit, and command idempotency context.
- Query contracts must carry tenant, optional org, operator, and trace context.
- API Gateway and tenant-web must not define MES domain objects independently; they must map to these contracts.
- Contract changes that alter service ownership or object names must first update [mes-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/mes-service.md) or an ADR.
