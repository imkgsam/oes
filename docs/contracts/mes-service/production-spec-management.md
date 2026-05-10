# ProductionSpec Management Contract

## 1. Purpose

`ProductionSpecManagementService` manages the lifecycle of MES-owned target production specifications.

`ProductionSpec` is owned by `mes-service`. It may reference a `manufacturable` and `PHYSICAL` Item from `item-master-service`, but it does not copy Item master data truth.

This contract freezes only the minimum shape required by Mold / Tooling foundation. Complete production routing, operation parameters, execution constraints, and quality rule binding are deferred.

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

Management rules must execute inside `mes-service` domain / application code. They must not be implemented in API Gateway, DTO validation, Prisma schema, or shared contract types.

## 3. ProductionSpec Minimum Shape

| Field | Required | Meaning |
| --- | --- | --- |
| `productionSpecId` | yes | Stable MES identifier. |
| `tenantId` | yes | Tenant owner. |
| `orgId` | when applicable | Organization owner. |
| `specCode` | yes | Tenant + org scoped code. |
| `name` | yes | Display name. |
| `revisionCode` | no | Engineering or business revision label. |
| `supersedesProductionSpecId` | no | Previous production spec replaced by this one. |
| `itemRef` | yes | Reference to a manufacturable physical Item. |
| `status` | yes | `DRAFT / ACTIVE / RETIRED`. |
| `effectiveFrom` | no | Start date or timestamp. |
| `effectiveTo` | no | End date or timestamp. |
| `retiredAt` | no | Retirement timestamp. |
| `replacementProductionSpecId` | no | Replacement spec. |
| `createdAt` | yes | Creation timestamp. |
| `updatedAt` | yes | Last update timestamp. |
| `version` | yes | Optimistic concurrency version. |

`itemRef` minimum shape:

| Field | Required | Meaning |
| --- | --- | --- |
| `itemId` | yes | Item Master identifier. |
| `itemCodeSnapshot` | no | Historical display snapshot. |
| `itemNameSnapshot` | no | Historical display snapshot. |

Snapshots are for audit and display only. They do not become Item Master truth.

## 4. Commands

### CreateProductionSpec

Creates a draft production specification.

Request body:

| Field | Required | Meaning |
| --- | --- | --- |
| `specCode` | yes | Tenant + org scoped code. |
| `name` | yes | Display name. |
| `revisionCode` | no | Revision label. |
| `supersedesProductionSpecId` | no | Previous spec. |
| `itemRef` | yes | Manufacturable physical Item reference. |
| `effectiveFrom` | no | Optional effective start. |
| `effectiveTo` | no | Optional effective end. |

Response:

| Field | Meaning |
| --- | --- |
| `productionSpec` | Created `ProductionSpec` in `DRAFT` status. |

Rules:

- `specCode` must be unique inside tenant + org.
- `itemRef.itemId` must resolve to an Item that is `manufacturable` and `PHYSICAL`.
- Created specs are not usable by mold contracts until activated.

### UpdateProductionSpec

Updates a draft or active production specification.

Request body:

| Field | Required | Meaning |
| --- | --- | --- |
| `productionSpecId` | yes | Target spec. |
| `expectedVersion` | yes | Optimistic concurrency guard. |
| `name` | no | Replacement display name. |
| `itemRef` | no | Replacement Item reference. |
| `effectiveFrom` | no | Replacement effective start. |
| `effectiveTo` | no | Replacement effective end. |

Response:

| Field | Meaning |
| --- | --- |
| `productionSpec` | Updated `ProductionSpec`. |

Rules:

- Retired specs cannot be updated.
- If `itemRef` changes, the new Item must pass the same manufacturable physical Item check.
- Version mismatch returns a concurrency error.

### ActivateProductionSpec

Makes a production specification available for Mold / Tooling references.

Request body:

| Field | Required | Meaning |
| --- | --- | --- |
| `productionSpecId` | yes | Target spec. |
| `expectedVersion` | yes | Optimistic concurrency guard. |
| `activatedAt` | no | Activation timestamp. |

Response:

| Field | Meaning |
| --- | --- |
| `productionSpec` | Activated `ProductionSpec`. |

Rules:

- Only `DRAFT` specs can be activated.
- The referenced Item must still be visible, manufacturable, and physical.

### RetireProductionSpec

Retires a production specification and prevents new references.

Request body:

| Field | Required | Meaning |
| --- | --- | --- |
| `productionSpecId` | yes | Target spec. |
| `expectedVersion` | yes | Optimistic concurrency guard. |
| `retiredAt` | no | Retirement timestamp. |
| `replacementProductionSpecId` | no | Replacement spec. |

Response:

| Field | Meaning |
| --- | --- |
| `productionSpec` | Retired `ProductionSpec`. |

Rules:

- Retirement does not delete historical Mold / Tooling facts.
- New `MoldDesign` records cannot reference retired specs.
- Existing historical references remain readable.

## 5. Errors

| Error | Meaning |
| --- | --- |
| `INVALID_ARGUMENT` | Missing or invalid command fields. |
| `ALREADY_EXISTS` | Duplicate `specCode`. |
| `NOT_FOUND` | Target spec, replacement spec, or Item reference is not visible. |
| `FAILED_PRECONDITION` | Invalid lifecycle transition or Item capability mismatch. |
| `ABORTED` | Version mismatch or idempotency conflict. |
