# Mold / Tooling Management Contract

## 1. Purpose

`MoldManagementService` exposes command-oriented write operations for the Mold / Tooling foundation slice.

This contract follows the MES architecture baseline:

```text
MoldDesign
  -> ProductionMold
  -> ToolingInstallation(type = MOLD)
  -> MoldInstallationDetail
  -> MoldUsageRecord
  -> MoldLifeCounter
```

The contract does not cover complete maintenance work orders, full quality analytics, procurement decisions, asset accounting, PDA scan execution, or complete production execution.

## 2. Common Command Context

Every command requires:

| Field | Required | Meaning |
| --- | --- | --- |
| `tenantId` | yes | Tenant boundary. |
| `orgId` | when applicable | Organization boundary. |
| `operatorContext` | yes | Acting operator. |
| `traceContext` | yes | Trace and request correlation. |
| `auditContext` | yes | Audit reason and source. |
| `commandId` | yes | Idempotency key. |

Business rules must execute inside `mes-service` domain / application code.

## 3. Reference Shapes

### ProductionSpecRef

| Field | Required | Meaning |
| --- | --- | --- |
| `productionSpecId` | yes | MES production spec identifier. |
| `specCodeSnapshot` | no | Historical display snapshot. |
| `displayNameSnapshot` | no | Historical display snapshot. |

### ItemRef

| Field | Required | Meaning |
| --- | --- | --- |
| `itemId` | yes | Item Master identifier. |
| `itemCodeSnapshot` | no | Historical display snapshot. |
| `itemNameSnapshot` | no | Historical display snapshot. |

### StorageResourceRef

| Field | Required | Meaning |
| --- | --- | --- |
| `storageResourceId` | yes | Fixed or semi-fixed MES storage resource. |
| `resourceCodeSnapshot` | no | Historical display snapshot. |
| `displayNameSnapshot` | no | Historical display snapshot. |

### CarrierResourceRef

| Field | Required | Meaning |
| --- | --- | --- |
| `carrierResourceId` | yes | Movable carrier resource. |
| `resourceCodeSnapshot` | no | Historical display snapshot. |
| `displayNameSnapshot` | no | Historical display snapshot. |

### WorkCenterRef

| Field | Required | Meaning |
| --- | --- | --- |
| `workCenterId` | yes | Execution unit. |
| `workCenterCodeSnapshot` | no | Historical display snapshot. |
| `displayNameSnapshot` | no | Historical display snapshot. |

### WorkUnitRef

| Field | Required | Meaning |
| --- | --- | --- |
| `workUnitId` | yes | Work point inside a WorkCenter. |
| `workUnitCodeSnapshot` | no | Historical display snapshot. |
| `displayNameSnapshot` | no | Historical display snapshot. |

## 4. Core Object Shapes

### MoldDesign

| Field | Required | Meaning |
| --- | --- | --- |
| `moldDesignId` | yes | Stable design id. |
| `designCode` | yes | Tenant + org scoped code. |
| `name` | yes | Design name. |
| `revisionCode` | no | Revision label. |
| `supersedesMoldDesignId` | no | Previous design. |
| `itemRef` | no | Optional Item reference. |
| `productionSpecRefs[]` | no | Compatible production specs. |
| `materialType` | yes | Material dimension such as resin or gypsum. |
| `functionRole` | yes | `MASTER / PRODUCTION`. |
| `productionMethodTags[]` | no | High pressure, floor casting, line casting, or similar tags. |
| `outputStructureType` | yes | `SINGLE / TWIN / MULTI / COMPONENT_COMBINATION`. |
| `outputs[]` | yes | Theoretical output structure. |
| `defaultLifeLimit` | no | Default life limit. |
| `defaultLifeUnit` | no | Default life unit. |
| `status` | yes | `ACTIVE / INACTIVE / SUPERSEDED`. |

### ProductionMold

| Field | Required | Meaning |
| --- | --- | --- |
| `productionMoldId` | yes | Stable production mold id. |
| `moldCode` | yes | Tenant + org scoped mold code. |
| `moldDesignId` | yes | Design this mold follows. |
| `sourceMasterMoldId` | no | Source master mold. |
| `supplierRef` | no | Supplier reference snapshot. |
| `purchaseRef` | no | Procurement reference snapshot. |
| `receivedAt` | no | Received timestamp. |
| `acceptedAt` | no | Accepted timestamp. |
| `currentStatus` | yes | `RECEIVED / PREPARING / AVAILABLE / INSTALLED / MAINTENANCE / DISABLED / SCRAPPED`. |
| `currentStorageResourceRef` | no | Current fixed or semi-fixed storage. |
| `currentCarrierResourceRef` | no | Current movable carrier. |
| `currentInstallationSummary` | no | Active installation summary. |
| `lifeCounterSummary` | no | Current life counter summary. |
| `scrappedAt` | no | Scrap timestamp. |

### ToolingInstallation

| Field | Required | Meaning |
| --- | --- | --- |
| `toolingInstallationId` | yes | Installation id. |
| `toolingType` | yes | Must be `MOLD` for this slice. |
| `toolingId` | yes | `ProductionMold` id. |
| `workCenterRef` | yes | Target execution unit. |
| `workUnitRef` | no | Target work point. |
| `installedAt` | yes | Installation timestamp. |
| `unmountedAt` | no | Unmount timestamp. |
| `status` | yes | `ACTIVE / UNMOUNTED / CLOSED_BY_SCRAP`. |

### MoldInstallationDetail

| Field | Required | Meaning |
| --- | --- | --- |
| `toolingInstallationId` | yes | Parent installation id. |
| `moldPosition` | no | Human-readable mold position. |
| `cavityPosition` | no | Cavity position when relevant. |
| `cavityMapping` | no | Structured cavity mapping snapshot. |
| `setupParameters` | no | Setup parameter snapshot. |

### MoldUsageRecord

| Field | Required | Meaning |
| --- | --- | --- |
| `moldUsageRecordId` | yes | Usage fact id. |
| `productionMoldId` | yes | Used production mold. |
| `toolingInstallationId` | no | Active installation used by the operation. |
| `workCenterRef` | yes | Execution unit. |
| `workUnitRef` | no | Work point. |
| `usedAt` | yes | Usage timestamp. |
| `usageQuantity` | yes | Business quantity. |
| `lifeDelta` | yes | Life counter delta. |
| `lifeUnit` | yes | Life counter unit, first slice uses `CASTING_CYCLE`. |
| `productionSpecRef` | no | Production spec selected for this usage. |
| `productionUnitRef` | no | Optional production unit reference when available. |
| `traceSubjectRef` | no | Optional trace subject reference when available. |
| `operatorRef` | yes | Operator snapshot. |

### MoldLifeCounter

| Field | Required | Meaning |
| --- | --- | --- |
| `moldLifeCounterId` | yes | Counter id. |
| `productionMoldId` | yes | Counted mold. |
| `lifeUnit` | yes | Counter unit. |
| `usedValue` | yes | Accumulated value. |
| `limitValue` | no | Limit value. |
| `warningThresholdValue` | no | Warning threshold. |
| `lastUsageRecordId` | no | Last usage record. |
| `lastAdjustedAt` | no | Last manual adjustment. |

## 5. Commands

### RegisterMoldDesign

Creates a mold design.

Rules:

- `designCode` must be unique inside tenant + org.
- `outputs[]` must contain at least one primary output.
- Referenced production specs must be active and visible.
- Item snapshots are display aids only and do not become Item Master truth.

### RegisterMasterMold

Creates a master mold record.

Rules:

- The referenced `MoldDesign` must be visible.
- Master molds do not enter production installation or usage lifecycle.

### RegisterProductionMold

Creates a production mold record.

Rules:

- The referenced `MoldDesign` must be visible and active.
- Initial placement must be either a `StorageResourceRef` or a `CarrierResourceRef`, not both unless the carrier is explicitly stored inside that storage resource by a future resource contract.
- Created production molds are not installed until `InstallTooling` succeeds.

### MoveTooling

Moves a master mold or production mold between storage and carrier references.

Rules:

- Scrapped production molds cannot move to an available production placement.
- Movement records placement facts only; it does not change execution history.

### InstallTooling

Installs a production mold to a WorkCenter / WorkUnit.

Rules:

- `toolingType` must be `MOLD`.
- The target production mold must be installable.
- The target WorkCenter must be an execution unit, not an Area.
- WorkUnit is used for finer installation points such as mold slot, upper mold point, or casting point.
- A production mold can have at most one active tooling installation.
- Successful install creates `ToolingInstallation` and `MoldInstallationDetail`.

### UnmountTooling

Closes an active tooling installation.

Rules:

- The installation must be active.
- Closing an installation does not delete usage records or life counters.

### RecordMoldUsage

Records mold usage and increments life counters.

Rules:

- Usage is a mold life fact, not an operation execution replacement.
- If a production unit exists, reference it through `productionUnitRef`.
- If trace identity exists, reference it through `traceSubjectRef`.
- The first slice uses `CASTING_CYCLE` as the primary life unit.

### AdjustMoldLifeCounter

Performs an authorized life counter correction.

Rules:

- Requires audit reason.
- Does not delete historical usage records.

### ScrapProductionMold

Scraps a production mold.

Rules:

- Scrapped production molds cannot be installed, moved to available placement, or used.
- Active tooling installation must be closed as part of the same local transaction.

## 6. Errors

| Error | Meaning |
| --- | --- |
| `INVALID_ARGUMENT` | Missing or invalid command fields. |
| `ALREADY_EXISTS` | Duplicate code or active installation conflict. |
| `NOT_FOUND` | Target object is not visible. |
| `FAILED_PRECONDITION` | Invalid lifecycle, placement, or installation state. |
| `ABORTED` | Version mismatch or idempotency conflict. |
