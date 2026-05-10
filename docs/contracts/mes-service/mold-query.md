# Mold / Tooling Query Contract

## 1. Purpose

`MoldQueryService` exposes read-only access to Mold / Tooling foundation data owned by `mes-service`.

Query models are optimized for selectors, workbench pages, checklist generation, and traceable mold history. They do not replace command-side domain rules.

## 2. Common Query Context

Every query requires:

| Field | Required | Meaning |
| --- | --- | --- |
| `tenantId` | yes | Tenant boundary. |
| `orgId` | when applicable | Organization boundary. |
| `operatorContext` | yes | Acting operator. |
| `traceContext` | yes | Trace and request correlation. |

## 3. Read Models

### MoldDesignSummary

| Field | Meaning |
| --- | --- |
| `moldDesignId` | Stable design id. |
| `designCode` | Display code. |
| `name` | Display name. |
| `revisionCode` | Revision label. |
| `status` | Lifecycle status. |

### ProductionMoldSummary

| Field | Meaning |
| --- | --- |
| `productionMoldId` | Stable mold id. |
| `moldCode` | Display code. |
| `moldDesignSummary` | Mold design summary. |
| `currentStatus` | Production mold lifecycle status. |
| `currentPlacementSummary` | Storage, carrier, or installation placement summary. |
| `lifeCounterSummary` | Current life counter summary. |

### ToolingPlacementSummary

| Field | Meaning |
| --- | --- |
| `placementType` | `STORAGE_RESOURCE / CARRIER_RESOURCE / WORK_CENTER / WORK_UNIT`. |
| `storageResourceRef` | Fixed or semi-fixed storage reference. |
| `carrierResourceRef` | Movable carrier reference. |
| `workCenterRef` | Execution unit reference. |
| `workUnitRef` | Work point reference. |
| `toolingInstallationId` | Active installation id when installed. |
| `moldInstallationDetail` | Mold-specific installation detail when installed. |

### MoldUsageHistoryEntry

| Field | Meaning |
| --- | --- |
| `entryType` | `INSTALL / UNMOUNT / USAGE / LIFE_ADJUSTMENT / MOVE / SCRAP`. |
| `happenedAt` | Event time. |
| `productionMoldId` | Related mold. |
| `summary` | Human-readable summary. |
| `auditRef` | Audit reference when available. |

## 4. Queries

### GetMoldDesign

Request:

| Field | Required | Meaning |
| --- | --- | --- |
| `moldDesignId` | yes | Target design. |

Response:

| Field | Meaning |
| --- | --- |
| `moldDesign` | Full `MoldDesign` read model. |

### ListMoldDesigns

Request:

| Field | Required | Meaning |
| --- | --- | --- |
| `keyword` | no | Code / name search. |
| `status` | no | Status filter. |
| `productionSpecId` | no | Compatible production spec filter. |
| `itemId` | no | Optional Item filter. |
| `page` | no | Page number. |
| `pageSize` | no | Page size. |

Response:

| Field | Meaning |
| --- | --- |
| `moldDesigns[]` | Page of summaries. |
| `total` | Total matched rows. |
| `page` | Current page. |
| `pageSize` | Page size. |

### GetProductionMold

Request:

| Field | Required | Meaning |
| --- | --- | --- |
| `productionMoldId` | yes | Target production mold. |

Response:

| Field | Meaning |
| --- | --- |
| `productionMold` | Full production mold read model. |

### ListProductionMolds

Request:

| Field | Required | Meaning |
| --- | --- | --- |
| `moldDesignId` | no | Design filter. |
| `status` | no | Lifecycle filter. |
| `storageResourceId` | no | Storage filter. |
| `carrierResourceId` | no | Carrier filter. |
| `warningLevel` | no | Life warning filter. |
| `page` | no | Page number. |
| `pageSize` | no | Page size. |

Response:

| Field | Meaning |
| --- | --- |
| `productionMolds[]` | Page of summaries. |
| `total` | Total matched rows. |
| `page` | Current page. |
| `pageSize` | Page size. |

### ListProductionMoldsByDesign

Request:

| Field | Required | Meaning |
| --- | --- | --- |
| `moldDesignId` | yes | Target design. |
| `status` | no | Lifecycle filter. |
| `page` | no | Page number. |
| `pageSize` | no | Page size. |

Response:

| Field | Meaning |
| --- | --- |
| `moldDesignSummary` | Design summary. |
| `productionMolds[]` | Page of production mold summaries. |
| `total` | Total matched rows. |

### GetToolingCurrentPlacement

Request:

| Field | Required | Meaning |
| --- | --- | --- |
| `toolingType` | yes | `MOLD` for this slice. |
| `toolingId` | yes | Production mold id. |

Response:

| Field | Meaning |
| --- | --- |
| `placement` | Current placement summary. |

### GetMoldUsageHistory

Request:

| Field | Required | Meaning |
| --- | --- | --- |
| `productionMoldId` | yes | Target production mold. |
| `from` | no | Optional start time. |
| `to` | no | Optional end time. |
| `page` | no | Page number. |
| `pageSize` | no | Page size. |

Response:

| Field | Meaning |
| --- | --- |
| `entries[]` | Usage and lifecycle history entries. |
| `total` | Total matched rows. |

### ListCurrentMoldsByWorkCenter

Request:

| Field | Required | Meaning |
| --- | --- | --- |
| `workCenterId` | yes | Execution unit. |
| `workUnitId` | no | Optional work point filter. |

Response:

| Field | Meaning |
| --- | --- |
| `items[]` | Active mold installations and production mold summaries. |

### ListMoldLifeCounters

Request:

| Field | Required | Meaning |
| --- | --- | --- |
| `productionMoldId` | no | Optional mold filter. |
| `warningLevel` | no | Optional warning filter. |
| `page` | no | Page number. |
| `pageSize` | no | Page size. |

Response:

| Field | Meaning |
| --- | --- |
| `counters[]` | Mold life counters. |
| `total` | Total matched rows. |

### PrintDailyMoldChecklist

Request:

| Field | Required | Meaning |
| --- | --- | --- |
| `workCenterId` | yes | Execution unit. |
| `checklistDate` | yes | Checklist date. |

Response:

| Field | Meaning |
| --- | --- |
| `items[]` | Current installed molds that can receive usage records. |
| `checklistDate` | Checklist date. |
| `workCenterId` | Execution unit. |

Rules:

- Checklist output is a read model, not a write commitment.
- Usage is recorded only by `RecordMoldUsage`.

## 5. Errors

| Error | Meaning |
| --- | --- |
| `INVALID_ARGUMENT` | Invalid id, date range, or pagination. |
| `NOT_FOUND` | Target object is not visible. |
