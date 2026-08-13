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

- All 32 RPCs follow the trusted execution contract in this section; request bodies do not carry tenant, org, operator, trace or audit authority.
- Management commands retain command idempotency and bounded business reason fields as specified below.
- API Gateway and tenant-web must not define MES domain objects independently; they must map to these contracts.
- Contract changes that alter service ownership or object names must first update [mes-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/mes-service.md) or an ADR.

## Trusted Execution Contract

### Admission

- All 32 current RPCs are `BUSINESS / HUMAN / WEB` with `aud=urn:oes:service:mes-service`, certificate binding and `all [exactCode]`.
- MACHINE, DELEGATED, SELF_SERVICE, non-WEB terminal, wrong audience/`cnf`, and missing or wrong Code are rejected before controller data.
- Tenant, org, operator, request, trace and audit identity/source derive only from verified ExecutionToken and trusted transport context. Body or ordinary metadata has no authority.
- The current direct production caller is Gateway MES BFF. Future HUMAN PDA and MACHINE automation are separate design packets and do not make a current RPC dual-mode.

### Exact 32-RPC matrix

| RPC | Exact existing Code |
| --- | --- |
| `CreateProductionSpec` | `mes.production_spec.manage` |
| `UpdateProductionSpec` | `mes.production_spec.manage` |
| `ActivateProductionSpec` | `mes.production_spec.manage` |
| `RetireProductionSpec` | `mes.production_spec.manage` |
| `GetProductionSpec` | `mes.production_spec.read` |
| `ListProductionSpecs` | `mes.production_spec.read` |
| `ResolveProductionSpecsForMold` | `mes.production_spec.read` |
| `RegisterMoldDesign` | `mes.mold_design.manage` |
| `RegisterMasterMold` | `mes.production_mold.manage` |
| `RegisterProductionMold` | `mes.production_mold.manage` |
| `ConfirmProductionMoldArrival` | `mes.production_mold.manage` |
| `AcceptProductionMold` | `mes.production_mold.manage` |
| `MoveTooling` | `mes.tooling_installation.manage` |
| `InstallTooling` | `mes.tooling_installation.manage` |
| `UnmountTooling` | `mes.tooling_installation.manage` |
| `ConfirmInstalledMoldReady` | `mes.tooling_installation.manage` |
| `MarkInstalledMoldMaintenance` | `mes.tooling_installation.manage` |
| `RecordMoldUsage` | `mes.mold_usage.record` |
| `RecordMoldUsageBatch` | `mes.mold_usage.record` |
| `AdjustMoldLifeCounter` | `mes.mold_life.manage` |
| `MarkProductionMoldForScrap` | `mes.production_mold.manage` |
| `GetMoldDesign` | `mes.mold_design.read` |
| `ListMoldDesigns` | `mes.mold_design.read` |
| `GetMasterMold` | `mes.production_mold.read` |
| `ListMasterMolds` | `mes.production_mold.read` |
| `GetProductionMold` | `mes.production_mold.read` |
| `ListProductionMolds` | `mes.production_mold.read` |
| `ListProductionMoldsByDesign` | `mes.production_mold.read` |
| `GetToolingCurrentPlacement` | `mes.tooling_installation.read` |
| `GetMoldUsageHistory` | `mes.production_mold.read` |
| `ListCurrentMoldsByWorkCenter` | `mes.tooling_installation.read` |
| `ListMoldLifeCounters` | `mes.production_mold.read` |

The canonical catalog already owns these ten Codes. No Permission Code is added. In particular, `ListMoldLifeCounters` is a read and requires `mes.production_mold.read`; `mes.mold_life.manage` remains exclusive to `AdjustMoldLifeCounter`. Master-mold methods use the existing production-mold read/manage family rather than inventing a second Code family.

### Wire compatibility and business reason

Every request deletes and reserves `tenant_id=1`, `org_id=2`, `operator_context=3`, and `trace_context=4`; all 18 management requests additionally delete and reserve `audit_context=5`. This freezes 146 authority fields. `RecordMoldUsageRequest.capture_source=18` and `RecordMoldUsageBatchRequest.capture_source=11` are also deleted/reserved, for 148 request fields total. `OperatorContext.operator_id=1/operator_type=2/org_id=3`, `TraceContext.trace_id=1/request_id=2`, and `AuditContext.audit_id=1/reason=2/source=3` are eight compatibility tombstones and cannot be reused to restore body authority.

`command_id=6` remains the caller-provided idempotency key. Existing `MoveToolingRequest.movement_reason=11` and `MarkInstalledMoldMaintenanceRequest.reason=9` remain business payload. The other 16 management requests gain optional `string reason`, trimmed to `1..256` UTF-8 characters; blank means absent, and credentials, Tokens, personal sensitive data and arbitrary JSON are prohibited. Reason supplements a trusted audit but cannot override principal, tenant, org, trace, audit id, source or terminal:

| Request | New field |
| --- | --- |
| `CreateProductionSpecRequest` | `reason=14` |
| `UpdateProductionSpecRequest` | `reason=13` |
| `ActivateProductionSpecRequest` | `reason=10` |
| `RetireProductionSpecRequest` | `reason=11` |
| `RegisterMoldDesignRequest` | `reason=21` |
| `RegisterMasterMoldRequest` | `reason=16` |
| `RegisterProductionMoldRequest` | `reason=16` |
| `ConfirmProductionMoldArrivalRequest` | `reason=9` |
| `AcceptProductionMoldRequest` | `reason=9` |
| `InstallToolingRequest` | `reason=16` |
| `UnmountToolingRequest` | `reason=9` |
| `ConfirmInstalledMoldReadyRequest` | `reason=10` |
| `RecordMoldUsageRequest` | `reason=21` |
| `RecordMoldUsageBatchRequest` | `reason=13` |
| `AdjustMoldLifeCounterRequest` | `reason=10` |
| `MarkProductionMoldForScrapRequest` | `reason=9` |

MES derives usage capture source from verified `session_terminal`; this slice permits only `WEB`. Response projections, `OperatorRef`, `AuditRef`, MES-owned tenant/org facts and every ordinary business field keep their existing numbers and meaning. Existing feature corrections such as `ItemModelRef`, mold acceptance, batch usage, master-mold reads and scrap semantics remain intact.

### Caller and protected future surfaces

The live raw-gRPC `mes-smoke.mjs` and package `smoke` command are removed instead of becoming a MACHINE caller. `mes-smoke-lib.mjs` and `mes-smoke.spec.mjs` remain isolated business/idempotency/outbox tests and are adapted so legacy body authority is not treated as production trust. Any future live smoke enters through Gateway HTTP with a test HUMAN session.

MES→Item Master outbound and future Planning, WMS, Quality, Site, PDA, device automation, event, producer, consumer, outbox and inbox contracts are protected. A verified future synchronous machine need receives a separately classified narrow INTERNAL RPC and Code; cross-domain facts receive a separately frozen event. This section creates neither.
