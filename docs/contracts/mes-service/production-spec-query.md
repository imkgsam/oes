# ProductionSpec Query Contract

## 1. Purpose

`ProductionSpecQueryService` exposes read-only access to MES-owned target production specifications.

This query surface supports Mold / Tooling foundation selectors and reference validation. It does not expose complete routing, operation, execution, or quality-rule design.

## 2. Common Query Context

Every query requires:

| Field | Required | Meaning |
| --- | --- | --- |
| `tenantId` | yes | Tenant boundary. |
| `orgId` | when applicable | Organization boundary. |
| `operatorContext` | yes | Acting operator. |
| `traceContext` | yes | Trace and request correlation. |

## 3. Read Models

### ProductionSpec

| Field | Meaning |
| --- | --- |
| `productionSpecId` | Stable MES identifier. |
| `tenantId` | Tenant owner. |
| `orgId` | Organization owner when applicable. |
| `specCode` | Tenant + org scoped code. |
| `name` | Display name. |
| `revisionCode` | Revision label. |
| `itemRef` | Manufacturable physical Item reference and display snapshot. |
| `status` | `DRAFT / ACTIVE / RETIRED`. |
| `effectiveFrom` | Optional effective start. |
| `effectiveTo` | Optional effective end. |
| `retiredAt` | Optional retirement timestamp. |
| `replacementProductionSpecId` | Optional replacement. |
| `createdAt` | Creation timestamp. |
| `updatedAt` | Last update timestamp. |
| `version` | Optimistic concurrency version. |

### ProductionSpecSummary

| Field | Meaning |
| --- | --- |
| `productionSpecId` | Stable MES identifier. |
| `specCode` | Display code. |
| `name` | Display name. |
| `revisionCode` | Revision label. |
| `itemRef` | Item reference and display snapshot. |
| `status` | Lifecycle status. |

### UnavailableProductionSpecRef

| Field | Meaning |
| --- | --- |
| `refId` | Requested production spec id. |
| `reasonCode` | `NOT_FOUND / RETIRED / NOT_ACTIVE / NOT_VISIBLE / ITEM_NOT_MANUFACTURABLE / ITEM_NOT_PHYSICAL`. |

## 4. Queries

### GetProductionSpec

Request:

| Field | Required | Meaning |
| --- | --- | --- |
| `productionSpecId` | yes | Target spec. |

Response:

| Field | Meaning |
| --- | --- |
| `productionSpec` | Full read model. |

Rules:

- Non-visible records return `NOT_FOUND`.

### ListProductionSpecs

Request:

| Field | Required | Meaning |
| --- | --- | --- |
| `status` | no | Optional status filter. |
| `itemId` | no | Optional Item filter. |
| `keyword` | no | Optional code / name search. |
| `includeRetired` | no | Whether retired specs are included. |
| `page` | no | Page number, starting from `1`. |
| `pageSize` | no | Page size. |

Response:

| Field | Meaning |
| --- | --- |
| `productionSpecs[]` | Page of summaries. |
| `total` | Total matched rows. |
| `page` | Current page. |
| `pageSize` | Page size. |

Rules:

- Empty result sets return a normal empty page.
- Default selector behavior should prefer active specs.

### ResolveProductionSpecsForMold

Request:

| Field | Required | Meaning |
| --- | --- | --- |
| `productionSpecIds[]` | no | Explicit production spec ids. |
| `moldDesignId` | no | Existing mold design whose spec references should be resolved. |

Response:

| Field | Meaning |
| --- | --- |
| `resolvedSpecs[]` | Active and visible production spec summaries. |
| `unavailableRefs[]` | Requested references that cannot be used. |

Rules:

- At least one input source must be provided.
- Partial failures should return `unavailableRefs[]` instead of failing the whole query.
- If `moldDesignId` itself is not visible, return `NOT_FOUND`.

## 5. Errors

| Error | Meaning |
| --- | --- |
| `INVALID_ARGUMENT` | Missing id, invalid pagination, or no resolve input. |
| `NOT_FOUND` | Target object is not visible. |
