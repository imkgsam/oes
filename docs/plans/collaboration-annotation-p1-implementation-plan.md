# Collaboration Annotation P1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `collaboration-service.annotation` P1 with CrmAccount internal notes, global Collaboration Panel Notes tab, object reference validation, create/manage permissions, and local audit.

**Architecture:** Extend the existing `collaboration-service` with a focused `annotation` module while keeping Task, CRM, Attachment, Notification, and ObjectTimeline boundaries separate. Annotation stores note truth and calls `crm-service` through a CrmAccount object reference adapter for existence, read access, and lifecycle checks; external clients access it only through API Gateway / BFF and the tenant-web Collaboration Panel.

**Tech Stack:** NestJS, TypeScript, Prisma, PostgreSQL, gRPC / ts-proto via `@oes/common`, Jest, OES permission code source, API Gateway BFF, tenant-web Vue / Vben framework.

---

## 0. Inputs And Scope Guard

Read these before implementation:

- [collaboration-service.md](../architecture/services/collaboration-service.md)
- [collaboration-annotation-p1.md](./features/collaboration-annotation-p1.md)
- [annotation-command.md](../contracts/collaboration-service/annotation-command.md)
- [annotation-query.md](../contracts/collaboration-service/annotation-query.md)
- [crm-service/object-reference.md](../contracts/crm-service/object-reference.md)
- [service-collaboration-rules.md](../architecture/system/service-collaboration-rules.md)
- [authorization-layering-and-resource-policy.md](../architecture/platforms/authorization-layering-and-resource-policy.md)
- [observability-and-audit.md](../architecture/platforms/observability-and-audit.md)

Hard P1 non-goals:

- Do not add images, attachments, rich text, Markdown, mention, comment thread, notification trigger, ObjectActivity, ObjectTimeline, global Notes center, cross-object search, or object types other than `CrmAccount`.
- Do not create a global Object Registry.
- Do not let `collaboration-service` query CRM database tables directly.
- Do not let `crm-service` store Annotation truth.
- Do not allow admins to edit another user's note body.

## 1. File Structure To Create Or Modify

Extend the existing service with focused Annotation files:

```text
src/services/system/collaboration-service/
  prisma/schema.prisma
  src/common/errors/annotation.errors.ts
  src/domain/entities/annotation.entity.ts
  src/domain/repositories/annotation.repository.ts
  src/domain/value-objects/annotation.enums.ts
  src/application/dtos/annotation.dto.ts
  src/application/ports/annotation-audit.port.ts
  src/application/ports/object-reference.port.ts
  src/application/ports/annotation-permission.port.ts
  src/application/services/annotation-command.service.ts
  src/application/services/annotation-query.service.ts
  src/infrastructure/adapters/crm-object-reference.grpc.adapter.ts
  src/infrastructure/adapters/annotation-permission.grpc.adapter.ts
  src/infrastructure/audit/local-annotation-audit.repository.ts
  src/infrastructure/repositories/prisma-annotation.repository.ts
  src/interfaces/grpc/annotation-command.grpc.controller.ts
  src/interfaces/grpc/annotation-query.grpc.controller.ts
  src/interfaces/grpc/annotation-grpc.presenter.ts
  src/modules/collaboration-annotation.module.ts
  test/l1/annotation-command.service.spec.ts
  test/l1/annotation-query.service.spec.ts
  test/l1/annotation-visibility-rules.spec.ts
  test/l2/prisma-annotation.repository.spec.ts
  test/l3/annotation-command.grpc.controller.spec.ts
  test/l3/annotation-query.grpc.controller.spec.ts
```

Modify shared contracts and permission source:

```text
src/common/src/contracts/collaboration_service/collaboration.proto
src/common/src/contracts/crm_service/crm.proto
src/common/src/contracts/index.ts
src/common/src/authorization/permission-codes/collaboration/annotation.permission-codes.ts
src/common/src/authorization/permission-codes/collaboration/index.ts
src/common/src/authorization/permission-codes/index.ts
```

Modify CRM:

```text
src/services/business/crm-service/src/application/queries/validate-object-reference.query.ts
src/services/business/crm-service/src/application/queries/validate-object-reference.handler.ts
src/services/business/crm-service/src/interfaces/grpc/crm-object-reference.grpc.controller.ts
src/services/business/crm-service/src/modules/crm-query.module.ts
src/services/business/crm-service/test/l3/crm-object-reference.grpc.controller.spec.ts
```

Modify API Gateway and tenant-web:

```text
src/services/api-gateway/src/modules/collaboration-service/adapters/annotation-command-grpc.adapter.ts
src/services/api-gateway/src/modules/collaboration-service/adapters/annotation-query-grpc.adapter.ts
src/services/api-gateway/src/modules/collaboration-service/application/annotation-bff.service.ts
src/services/api-gateway/src/modules/collaboration-service/interface/http/controllers/annotation.controller.ts
src/services/api-gateway/src/modules/collaboration-service/interface/http/dtos/annotation.dto.ts
app/web/apps/tenant-web/src/api/bff/collaboration-annotation/index.ts
app/web/apps/tenant-web/src/components/collaboration-panel/
app/web/apps/tenant-web/src/views/admin/customer-management.vue
```

## Task 1: Add Shared Contracts And Permission Codes

**Files:**

- Modify: `src/common/src/contracts/collaboration_service/collaboration.proto`
- Modify: `src/common/src/contracts/crm_service/crm.proto`
- Modify: `src/common/src/contracts/index.ts`
- Create: `src/common/src/authorization/permission-codes/collaboration/annotation.permission-codes.ts`
- Modify: `src/common/src/authorization/permission-codes/collaboration/index.ts`
- Modify: `src/common/src/authorization/permission-codes/index.ts`

- [ ] **Step 1: Add collaboration annotation RPC messages and services**

Extend the existing collaboration proto with:

```proto
service AnnotationCommandService {
  rpc CreateAnnotation(CreateAnnotationRequest) returns (AnnotationResponse);
  rpc UpdateAnnotation(UpdateAnnotationRequest) returns (AnnotationResponse);
  rpc DeleteAnnotation(DeleteAnnotationRequest) returns (AnnotationResponse);
  rpc SetAnnotationPinned(SetAnnotationPinnedRequest) returns (AnnotationResponse);
}

service AnnotationQueryService {
  rpc ListAnnotationsForObject(ListAnnotationsForObjectRequest) returns (ListAnnotationsResponse);
  rpc GetAnnotation(GetAnnotationRequest) returns (AnnotationResponse);
}

enum AnnotationVisibility {
  ANNOTATION_VISIBILITY_UNSPECIFIED = 0;
  ANNOTATION_VISIBILITY_PRIVATE = 1;
  ANNOTATION_VISIBILITY_OBJECT_VISIBLE = 2;
}

message ObjectRef {
  string object_owner_service = 1;
  string object_type = 2;
  string object_id = 3;
}

message ObjectDisplaySnapshot {
  string title = 1;
  string subtitle = 2;
  string status = 3;
}

message Annotation {
  string annotation_id = 1;
  string tenant_id = 2;
  ObjectRef object_ref = 3;
  ObjectDisplaySnapshot object_display_snapshot = 4;
  string author_account_id = 5;
  string author_display_name_snapshot = 6;
  string body_text = 7;
  AnnotationVisibility visibility = 8;
  bool pinned = 9;
  bool edited = 10;
  string created_at = 11;
  string updated_at = 12;
}
```

Expected: proto contains no image, attachment, mention, thread, event, or ObjectTimeline fields.

- [ ] **Step 2: Add CRM object reference RPC**

Extend the CRM proto with:

```proto
service CrmObjectReferenceService {
  rpc ValidateCrmObjectReference(ValidateCrmObjectReferenceRequest) returns (ValidateCrmObjectReferenceResponse);
}

enum CrmObjectReferenceCapability {
  CRM_OBJECT_REFERENCE_CAPABILITY_UNSPECIFIED = 0;
  CRM_OBJECT_REFERENCE_CAPABILITY_READ = 1;
  CRM_OBJECT_REFERENCE_CAPABILITY_CREATE_ANNOTATION = 2;
  CRM_OBJECT_REFERENCE_CAPABILITY_MUTATE_ANNOTATION = 3;
}

enum CrmObjectLifecycle {
  CRM_OBJECT_LIFECYCLE_UNSPECIFIED = 0;
  CRM_OBJECT_LIFECYCLE_ACTIVE = 1;
  CRM_OBJECT_LIFECYCLE_ARCHIVED = 2;
  CRM_OBJECT_LIFECYCLE_DELETED_OR_UNAVAILABLE = 3;
}
```

Expected: CRM validates only CRM-owned object references and does not include Annotation fields.

- [ ] **Step 3: Add annotation permission codes**

Create `annotation.permission-codes.ts` with:

```ts
/** CollaborationAnnotationPermissionCodes defines the P1 permissions for creating and governing object notes. */
export const CollaborationAnnotationPermissionCodes = {
  CREATE: 'collaboration.annotation.create',
  MANAGE: 'collaboration.annotation.manage'
} as const
```

Expected: no `update_own` or `delete_own` permission codes; own edit/delete are author rules.

- [ ] **Step 4: Run proto and permission verification**

Run:

```bash
pnpm proto:lint
pnpm --filter permission-service test
```

Expected: proto lint passes; permission tests pass or only fail on pre-existing unrelated workspace issues.

## Task 2: Implement CRM Object Reference Validation

**Files:**

- Create: `src/services/business/crm-service/src/application/queries/validate-object-reference.query.ts`
- Create: `src/services/business/crm-service/src/application/queries/validate-object-reference.handler.ts`
- Create: `src/services/business/crm-service/src/interfaces/grpc/crm-object-reference.grpc.controller.ts`
- Modify: `src/services/business/crm-service/src/modules/crm-query.module.ts`
- Test: `src/services/business/crm-service/test/l3/crm-object-reference.grpc.controller.spec.ts`

- [ ] **Step 1: Write L3 tests for CrmAccount validation**

Cover:

- active `CrmAccount` + readable operator + `CREATE_ANNOTATION` returns allowed.
- archived `CrmAccount` + `READ` returns readable but create not allowed.
- archived `CrmAccount` + `CREATE_ANNOTATION` returns failed precondition.
- missing account returns not found.
- unsupported object type returns invalid argument.

- [ ] **Step 2: Implement query handler**

Implement owner-service logic:

- load `CrmAccount` by tenant and id.
- apply CRM read authorization path already used by account details.
- map lifecycle to `ACTIVE / ARCHIVED / DELETED_OR_UNAVAILABLE`.
- allow `READ` for readable archived accounts.
- deny `CREATE_ANNOTATION` and normal `MUTATE_ANNOTATION` for archived accounts.
- return display snapshot from CRM account display fields.

- [ ] **Step 3: Expose gRPC controller**

Add a controller that:

- validates context.
- maps proto capability enum to application query.
- maps application result to proto response.
- returns OES-standard errors for invalid argument, not found, permission denied, and failed precondition.

- [ ] **Step 4: Run CRM verification**

Run:

```bash
pnpm --filter crm-service test:l2
pnpm --filter crm-service test:l3
```

Expected: CRM repository and gRPC tests pass or unrelated pre-existing failures are documented.

## Task 3: Implement Collaboration Annotation Module

**Files:**

- Modify: `src/services/system/collaboration-service/prisma/schema.prisma`
- Create domain/application/infrastructure/interface files listed in section 1
- Test: `src/services/system/collaboration-service/test/l1/annotation-command.service.spec.ts`
- Test: `src/services/system/collaboration-service/test/l1/annotation-query.service.spec.ts`
- Test: `src/services/system/collaboration-service/test/l1/annotation-visibility-rules.spec.ts`
- Test: `src/services/system/collaboration-service/test/l2/prisma-annotation.repository.spec.ts`
- Test: `src/services/system/collaboration-service/test/l3/annotation-command.grpc.controller.spec.ts`
- Test: `src/services/system/collaboration-service/test/l3/annotation-query.grpc.controller.spec.ts`

- [ ] **Step 1: Write L1 command service tests**

Cover:

- create object-visible note after object reference validation and create permission.
- create private note.
- reject unsupported object type.
- reject empty body.
- reject create when CRM validation denies archived object.
- allow author update own note.
- reject admin editing another user's note.
- allow author soft delete own note.
- allow manage soft delete any note.
- allow manage pin/unpin.
- reject pin on archived target object.

- [ ] **Step 2: Write L1 query service tests**

Cover:

- object-visible notes visible to object readers.
- private notes visible only to author.
- deleted notes hidden from ordinary list and get.
- sorting is pinned first, then created time descending.
- archived but readable `CrmAccount` can list notes.

- [ ] **Step 3: Add Prisma model and repository**

Persist:

- tenant id.
- object owner service, type, id.
- object display snapshot.
- author account id and display snapshot.
- body text.
- visibility.
- pinned flag.
- edited flag.
- soft delete metadata.
- created/updated timestamps.

Do not persist images, attachments, mention, reply tree, task linkage, notification status, or ObjectTimeline fields.

- [ ] **Step 4: Implement command/query services**

Command service must:

- call object reference adapter for each command that depends on current object lifecycle.
- call permission adapter for create/manage.
- enforce author rules locally.
- write local audit on succeeded, rejected, and failed command attempts.
- avoid public event publication in P1.

Query service must:

- validate object ref through CRM before list.
- enforce private/object-visible visibility.
- hide soft-deleted notes.
- sort pinned first and created time descending.

- [ ] **Step 5: Expose gRPC controllers**

Controllers must:

- require tenant, operator, trace, and audit context for commands.
- require tenant, operator, and trace context for queries.
- map all error semantics from the contract.

- [ ] **Step 6: Run collaboration verification**

Run:

```bash
pnpm --filter collaboration-service prisma:push
pnpm --filter collaboration-service test
```

Expected: annotation L1/L2/L3 tests pass and existing task tests remain passing.

## Task 4: Add API Gateway Annotation BFF

**Files:**

- Create: `src/services/api-gateway/src/modules/collaboration-service/adapters/annotation-command-grpc.adapter.ts`
- Create: `src/services/api-gateway/src/modules/collaboration-service/adapters/annotation-query-grpc.adapter.ts`
- Create: `src/services/api-gateway/src/modules/collaboration-service/application/annotation-bff.service.ts`
- Create: `src/services/api-gateway/src/modules/collaboration-service/interface/http/controllers/annotation.controller.ts`
- Create: `src/services/api-gateway/src/modules/collaboration-service/interface/http/dtos/annotation.dto.ts`
- Modify: `src/services/api-gateway/src/modules/collaboration-service/collaboration-service.module.ts`
- Test: colocated specs under `src/services/api-gateway/src/modules/collaboration-service/**/*.spec.ts`

- [ ] **Step 1: Write controller and service tests**

Cover:

- list notes for `crm-service/CrmAccount`.
- create note with object-visible default.
- update own note.
- soft delete note.
- pin/unpin note.
- reject unsupported object type through downstream error mapping.

- [ ] **Step 2: Implement BFF routes**

Expose these routes:

```text
GET    /collaboration/objects/:ownerService/:objectType/:objectId/annotations
POST   /collaboration/objects/:ownerService/:objectType/:objectId/annotations
PATCH  /collaboration/annotations/:annotationId
DELETE /collaboration/annotations/:annotationId
PATCH  /collaboration/annotations/:annotationId/pinned
```

These routes are the P1 external HTTP surface. They must stay objectRef-driven and go through API Gateway.

- [ ] **Step 3: Preserve context**

Ensure BFF sends:

- tenant id.
- operator account context.
- trace context.
- audit context for writes.

- [ ] **Step 4: Run API Gateway tests**

Run:

```bash
pnpm --filter api-gateway exec jest src/modules/collaboration-service --runInBand
```

Expected: collaboration gateway tests pass.

## Task 5: Add Tenant-Web Collaboration Panel Notes Tab

**Files:**

- Create: `app/web/apps/tenant-web/src/api/bff/collaboration-annotation/index.ts`
- Create: `app/web/apps/tenant-web/src/components/collaboration-panel/CollaborationPanel.vue`
- Create: `app/web/apps/tenant-web/src/components/collaboration-panel/NotesTab.vue`
- Create: `app/web/apps/tenant-web/src/components/collaboration-panel/types.ts`
- Modify: `app/web/apps/tenant-web/src/views/admin/customer-management.vue`
- Test: colocated `.spec.ts` files for API client, panel, notes tab, and CRM page integration.

- [ ] **Step 1: Write UI tests**

Cover:

- CRM Account page shows panel button for supported CrmAccount context.
- panel opens/closes without navigating away.
- Notes tab lists notes.
- create note sends pure text body and default object-visible visibility.
- private visibility toggle sends private visibility.
- edit own note updates text.
- delete own note hides it from list.
- manage user can pin/unpin note when action is available from BFF permissions.

- [ ] **Step 2: Implement API client**

The client must call API Gateway routes only; no direct service calls.

- [ ] **Step 3: Implement global panel surface**

Panel behavior:

- object context is provided by the hosting detail page.
- panel only appears for supported object types.
- P1 supported type is `crm-service / CrmAccount`.
- P1 only renders `Notes` tab.
- panel close does not mutate the CRM page state.

- [ ] **Step 4: Implement Notes tab**

Notes behavior:

- pure text multiline editor.
- reject empty body before submit.
- visibility selector with `OBJECT_VISIBLE` default and `PRIVATE` option.
- list sorting follows backend response.
- show pinned marker and edited marker.
- do not expose image, attachment, mention, rich text, reply, or timeline UI.

- [ ] **Step 5: Run tenant-web tests**

Run:

```bash
pnpm --dir app/web test:unit -- collaboration
pnpm --dir app/web test:unit -- customer-management
```

Expected: collaboration panel and CRM integration tests pass.

## Task 6: End-To-End Verification And Documentation Closure

**Files:**

- Modify: `docs/plans/features/collaboration-annotation-p1.md`
- Modify: `docs/plans/collaboration-annotation-p1-implementation-plan.md`

- [ ] **Step 1: Run service verification**

Run:

```bash
pnpm proto:lint
pnpm --filter crm-service test:l3
pnpm --filter collaboration-service test
pnpm --filter api-gateway exec jest src/modules/collaboration-service --runInBand
```

Expected: all new backend tests pass.

- [ ] **Step 2: Run frontend verification**

Run:

```bash
pnpm --dir app/web test:unit -- collaboration
pnpm --dir app/web test:unit -- customer-management
```

Expected: panel and Notes tab tests pass.

- [ ] **Step 3: Manual smoke**

Verify:

- open a `CrmAccount` detail page.
- open Collaboration Panel.
- create object-visible note.
- create private note and confirm another account cannot see it.
- edit own note.
- soft delete own note.
- pin/unpin with manage permission.
- confirm archived CrmAccount allows viewing notes but rejects creating/editing/pinning.

- [ ] **Step 4: Close feature packet**

Update `collaboration-annotation-p1.md` only after implementation is verified:

- mark realization thread as completed.
- record verification commands and results.
- keep deferred ledger intact.

## 2. Execution Order

1. Task 1 first because all runtime surfaces depend on generated contracts and permission codes.
2. Task 2 before Task 3 because Annotation write/query paths require CRM object reference validation.
3. Task 3 before Task 4 because API Gateway should call real collaboration-service contracts.
4. Task 4 before Task 5 because tenant-web should consume API Gateway, not service internals.
5. Task 6 last.

## 3. Self-Review Checklist

- The plan implements only `CrmAccount` Annotation P1.
- No task adds images, attachments, mention, rich text, comment thread, notification, ObjectTimeline, global Notes center, or object types beyond `CrmAccount`.
- CRM owns object validation; collaboration-service owns Annotation truth.
- Annotation audit remains local to collaboration-service and aligned with OES audit envelope.
- API Gateway is the only external entry.
- tenant-web implements a global panel surface that is only visible for supported object contexts.
