# API Gateway MES Mold Management BFF Contract

## 1. Purpose

The API Gateway MES Mold Management BFF exposes tenant-web HTTP endpoints for the Mold / Tooling foundation slice.

This document is not a MES domain truth source. It maps HTTP requests to [mes-service contracts](../mes-service/README.md), injects request context, and adapts transport-level concerns for tenant-web.

## 2. BFF Responsibilities

The BFF owns:

- HTTP route shape for tenant-web.
- Authentication and authorization integration.
- Trusted HUMAN session to MES-audience ExecutionToken exchange, plus command idempotency and bounded business-reason mapping.
- Request / response DTO mapping between HTTP and internal MES gRPC contracts.
- Small web-only conveniences such as pagination query parsing and checklist batch submission shape.

The BFF does not own:

- MES object definitions.
- MES resource hierarchy.
- Mold lifecycle rules.
- Production spec rules.
- Tooling installation rules.
- Mold life counter rules.
- Direct MES database writes.

## 3. Upstream Contract References

The BFF must map to:

- [production-spec-management.md](../mes-service/production-spec-management.md)
- [production-spec-query.md](../mes-service/production-spec-query.md)
- [mold-management.md](../mes-service/mold-management.md)
- [mold-query.md](../mes-service/mold-query.md)

If a tenant-web feature needs a field that is not present in those contracts, update the MES contract first. Do not add a BFF-only MES domain field.

## 4. Permission Surface

Permission codes are transport authorization labels, not MES domain objects.

The canonical first-slice action codes are:

| Permission | Purpose |
| --- | --- |
| `mes.production_spec.read` | Read production specs. |
| `mes.production_spec.manage` | Create, update, activate, or retire production specs. |
| `mes.mold_design.read` | Read mold designs. |
| `mes.mold_design.manage` | Register mold designs. |
| `mes.production_mold.read` | Read production molds. |
| `mes.production_mold.manage` | Register, accept, move, install, unmount, or mark production molds for scrap. |
| `mes.tooling_installation.read` | Read current tooling placement. |
| `mes.tooling_installation.manage` | Install or unmount tooling. |
| `mes.mold_usage.record` | Record mold usage facts. |
| `mes.mold_life.manage` | Adjust mold life counters. |

The ten Codes already exist in the canonical Permission catalog; this slice adds no Code. Master-mold reads/register use `mes.production_mold.read/manage`. `ListMoldLifeCounters` uses `mes.production_mold.read`; only `AdjustMoldLifeCounter` uses `mes.mold_life.manage`.

## 5. HTTP Route Groups

All routes are tenant-scoped:

```text
/mes/tenants/:tenantId
```

Recommended route groups:

| Route group | Maps to |
| --- | --- |
| `/production-specs` | Production spec query and management contracts. |
| `/mold-designs` | Mold design query and registration. |
| `/master-molds` | Master mold registration and query. |
| `/production-molds` | Production mold query and management. |
| `/tooling-installations` | Installation, unmount, and current placement reads. |
| `/mold-usage-records` | Single and batch mold usage recording plus usage history. |
| `/mold-life-counters` | Mold life counter reads and adjustments. |
| `/daily-mold-checklists` | Web checklist read model and batch usage submission. |

## 6. Context Mapping

For every request, Gateway authenticates the current HUMAN WEB session, exchanges the transport-private source credential for `aud=urn:oes:service:mes-service` with the exact RPC Code, and sends it through the dedicated mTLS MES client. The HTTP `:tenantId` is checked against the verified session scope at the edge but is not copied into the gRPC request as authority. Org, operator, trace and audit identity/source likewise remain trusted context, never DTO fields or ordinary metadata. Optional reason stays bounded business payload; `commandId` comes from the request body when provided, otherwise from the trusted request id.

Gateway must not use `GrpcTransportModule.forFeature(MES)`, `InjectGrpcClient(MES)`, `GrpcMetadataPropagationFactory`, `toOperatorScopedMetadataInput`, body context builders or fallback request/trace/audit strings for MES. The two adapters resolve one dedicated certificate-authenticated MES client and the trusted execution producer. This does not migrate MES outbound Item Master calls.

## 7. Web Daily Checklist Convenience

`/daily-mold-checklists` is a BFF convenience route, not a MES domain object.

Rules:

- Print/read endpoints must call `ListCurrentMoldsByWorkCenter`.
- Submission endpoints must call `RecordMoldUsageBatch` once per WorkCenter batch.
- The BFF must not split a submitted checklist into multiple `RecordMoldUsage` gRPC calls.
- The BFF must not persist checklist, print batch, or usage batch business records.
- `SCRAP_PENDING` installed molds must remain visible in print/input rows but disabled for submission.

## 8. Error Mapping

| gRPC / application error | HTTP status | Meaning |
| --- | --- | --- |
| `INVALID_ARGUMENT` | `400` | Request shape or semantic input is invalid. |
| `UNAUTHENTICATED` | `401` | Missing or invalid authentication. |
| `PERMISSION_DENIED` | `403` | Operator lacks required action code. |
| `NOT_FOUND` | `404` | Target object is not visible in tenant / org scope. |
| `ALREADY_EXISTS` | `409` | Unique constraint or active installation conflict. |
| `FAILED_PRECONDITION` | `409` | Lifecycle or state precondition failed. |
| `ABORTED` | `409` | Version or idempotency conflict. |
| `INTERNAL` | `500` | Unexpected server failure. |

## 9. Explicit Non-goals

- No BFF-owned MES domain rules.
- No BFF-owned resource model.
- No direct cross-service database reads.
- No tenant-web-only object names that differ from MES contracts.
- No long-term compatibility layer for the previous phase 1 model.
