# Collaboration Task P1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `collaboration-service.task` P1 as a manual task service with private todo, assigned tasks, participant visibility, audit, task fact events, gRPC contracts, and API Gateway access.

**Architecture:** Add a new system service at `src/services/system/collaboration-service` using the existing OES NestJS + Prisma + gRPC service structure. Keep P1 scoped to manual tasks only: no business object refs, no source binding, no automatic completion, no recurrence, no team queue, no notification closed loop.

**Tech Stack:** NestJS, TypeScript, Prisma, PostgreSQL, gRPC / ts-proto via `@oes/common`, Jest, OES permission code source, API Gateway BFF.

---

## 0. Inputs And Scope Guard

Read these before implementation:

- [collaboration-service.md](../architecture/services/collaboration-service.md)
- [collaboration-task-p1.md](./features/collaboration-task-p1.md)
- [task-command.md](../contracts/collaboration-service/task-command.md)
- [task-query.md](../contracts/collaboration-service/task-query.md)
- [service-collaboration-rules.md](../architecture/system/service-collaboration-rules.md)
- [authorization-layering-and-resource-policy.md](../architecture/platforms/authorization-layering-and-resource-policy.md)

Hard P1 non-goals:

- Do not add business object refs.
- Do not add source binding or auto completion.
- Do not add recurrence, reminder scheduler, SLA, team queue, project, annotation, notification dispatch, admin all view, or delete.
- Do not create cross-service database dependencies.

## 1. File Structure To Create

Create the new service with this focused structure:

```text
src/services/system/collaboration-service/
  package.json
  jest.config.js
  tsconfig.json
  tsconfig.spec.json
  prisma/schema.prisma
  src/main.ts
  src/app.module.ts
  src/common/errors/task.errors.ts
  src/domain/entities/task.entity.ts
  src/domain/repositories/task.repository.ts
  src/domain/value-objects/task.enums.ts
  src/application/dtos/task.dto.ts
  src/application/events/task.events.ts
  src/application/ports/account-reference.port.ts
  src/application/ports/task-audit.port.ts
  src/application/ports/task-event-publisher.port.ts
  src/application/services/task-command.service.ts
  src/application/services/task-query.service.ts
  src/infrastructure/prisma/prisma.module.ts
  src/infrastructure/prisma/prisma.service.ts
  src/infrastructure/repositories/prisma-task.repository.ts
  src/infrastructure/adapters/identity-account-reference.grpc.adapter.ts
  src/infrastructure/audit/local-task-audit.repository.ts
  src/infrastructure/events/local-task-event.publisher.ts
  src/interfaces/grpc/task-command.grpc.controller.ts
  src/interfaces/grpc/task-query.grpc.controller.ts
  src/interfaces/grpc/task-grpc.presenter.ts
  src/modules/collaboration-task.module.ts
  test/l1/task-command.service.spec.ts
  test/l1/task-query.service.spec.ts
  test/l1/task-state-rules.spec.ts
  test/l2/prisma-task.repository.spec.ts
  test/l3/task-command.grpc.controller.spec.ts
  test/l3/task-query.grpc.controller.spec.ts
```

Modify existing shared files:

```text
src/common/src/contracts/collaboration_service/collaboration.proto
src/common/src/contracts/collaboration_service/index.ts
src/common/src/contracts/index.ts
src/common/src/authorization/permission-codes/collaboration/task.permission-codes.ts
src/common/src/authorization/permission-codes/collaboration/index.ts
src/common/src/authorization/permission-codes/index.ts
package.json
docs/plans/collaboration-task-p1-implementation-plan.md
```

Modify API Gateway files after service contracts compile:

```text
src/services/api-gateway/src/modules/collaboration-service/collaboration-service.module.ts
src/services/api-gateway/src/modules/collaboration-service/adapters/task-command-grpc.adapter.ts
src/services/api-gateway/src/modules/collaboration-service/adapters/task-query-grpc.adapter.ts
src/services/api-gateway/src/modules/collaboration-service/application/task-bff.service.ts
src/services/api-gateway/src/modules/collaboration-service/interface/http/controllers/task.controller.ts
src/services/api-gateway/src/modules/collaboration-service/interface/http/dtos/task.dto.ts
src/services/api-gateway/src/app.module.ts
src/services/api-gateway/test or colocated specs under src/modules/collaboration-service/**/*.spec.ts
```

## Task 1: Add Shared Proto And Permission Code

**Files:**

- Create: `src/common/src/contracts/collaboration_service/collaboration.proto`
- Create: `src/common/src/contracts/collaboration_service/index.ts`
- Modify: `src/common/src/contracts/index.ts`
- Create: `src/common/src/authorization/permission-codes/collaboration/task.permission-codes.ts`
- Create: `src/common/src/authorization/permission-codes/collaboration/index.ts`
- Modify: `src/common/src/authorization/permission-codes/index.ts`

- [ ] **Step 1: Add the collaboration proto**

Create `src/common/src/contracts/collaboration_service/collaboration.proto` with Task P1 only:

```proto
syntax = "proto3";

package collaboration_service;

service TaskCommandService {
  rpc CreateTask(CreateTaskRequest) returns (TaskResponse);
  rpc UpdateTask(UpdateTaskRequest) returns (TaskResponse);
  rpc StartTask(TaskIdRequest) returns (TaskResponse);
  rpc CompleteTask(CompleteTaskRequest) returns (TaskResponse);
  rpc CancelTask(CancelTaskRequest) returns (TaskResponse);
  rpc ReopenTask(ReopenTaskRequest) returns (TaskResponse);
  rpc ArchiveTask(TaskIdRequest) returns (TaskResponse);
  rpc UnarchiveTask(TaskIdRequest) returns (TaskResponse);
}

service TaskQueryService {
  rpc ListTasks(ListTasksRequest) returns (ListTasksResponse);
  rpc GetTask(TaskIdRequest) returns (TaskResponse);
}

enum TaskVisibility {
  TASK_VISIBILITY_UNSPECIFIED = 0;
  TASK_VISIBILITY_PRIVATE = 1;
  TASK_VISIBILITY_ASSIGNMENT_PARTICIPANTS = 2;
}

enum TaskStatus {
  TASK_STATUS_UNSPECIFIED = 0;
  TASK_STATUS_OPEN = 1;
  TASK_STATUS_IN_PROGRESS = 2;
  TASK_STATUS_COMPLETED = 3;
  TASK_STATUS_CANCELLED = 4;
}

enum TaskPriority {
  TASK_PRIORITY_UNSPECIFIED = 0;
  TASK_PRIORITY_LOW = 1;
  TASK_PRIORITY_NORMAL = 2;
  TASK_PRIORITY_HIGH = 3;
  TASK_PRIORITY_URGENT = 4;
}

enum TaskListScope {
  TASK_LIST_SCOPE_UNSPECIFIED = 0;
  TASK_LIST_SCOPE_MY_TODO = 1;
  TASK_LIST_SCOPE_ASSIGNED_TO_ME = 2;
  TASK_LIST_SCOPE_CREATED_BY_ME = 3;
}

message OperatorContext {
  string account_id = 1;
  string user_id = 2;
  string tenant_id = 3;
}

message TraceContext {
  string trace_id = 1;
  string span_id = 2;
}

message AuditContext {
  string audit_id = 1;
  string reason = 2;
  string source = 3;
}

message CreateTaskRequest {
  string tenant_id = 1;
  OperatorContext operator_context = 2;
  TraceContext trace_context = 3;
  AuditContext audit_context = 4;
  string title = 5;
  string description = 6;
  string assignee_account_id = 7;
  string due_at = 8;
  TaskPriority priority = 9;
}

message UpdateTaskRequest {
  string tenant_id = 1;
  OperatorContext operator_context = 2;
  TraceContext trace_context = 3;
  AuditContext audit_context = 4;
  string task_id = 5;
  string title = 6;
  string description = 7;
  string due_at = 8;
  TaskPriority priority = 9;
}

message TaskIdRequest {
  string tenant_id = 1;
  OperatorContext operator_context = 2;
  TraceContext trace_context = 3;
  AuditContext audit_context = 4;
  string task_id = 5;
}

message CompleteTaskRequest {
  string tenant_id = 1;
  OperatorContext operator_context = 2;
  TraceContext trace_context = 3;
  AuditContext audit_context = 4;
  string task_id = 5;
  string completion_note = 6;
}

message CancelTaskRequest {
  string tenant_id = 1;
  OperatorContext operator_context = 2;
  TraceContext trace_context = 3;
  AuditContext audit_context = 4;
  string task_id = 5;
  string cancel_reason = 6;
}

message ReopenTaskRequest {
  string tenant_id = 1;
  OperatorContext operator_context = 2;
  TraceContext trace_context = 3;
  AuditContext audit_context = 4;
  string task_id = 5;
  string reopen_reason = 6;
}

message ListTasksRequest {
  string tenant_id = 1;
  OperatorContext operator_context = 2;
  TraceContext trace_context = 3;
  TaskListScope scope = 4;
  repeated TaskStatus status = 5;
  repeated TaskPriority priority = 6;
  string due_before = 7;
  string due_after = 8;
  string keyword = 9;
  bool overdue_only = 10;
  bool include_archived = 11;
  bool archived_only = 12;
  int32 page = 13;
  int32 page_size = 14;
}

message TaskView {
  string task_id = 1;
  string tenant_id = 2;
  string title = 3;
  string description = 4;
  string created_by_account_id = 5;
  string assignee_account_id = 6;
  TaskVisibility visibility = 7;
  TaskStatus status = 8;
  TaskPriority priority = 9;
  string due_at = 10;
  bool overdue = 11;
  string started_at = 12;
  string completed_at = 13;
  string completed_by_account_id = 14;
  string completion_note = 15;
  string cancelled_at = 16;
  string cancelled_by_account_id = 17;
  string cancel_reason = 18;
  string archived_at = 19;
  string archived_by_account_id = 20;
  string created_at = 21;
  string updated_at = 22;
}

message TaskResponse {
  TaskView task = 1;
}

message ListTasksResponse {
  repeated TaskView items = 1;
  int32 page = 2;
  int32 page_size = 3;
  int32 total = 4;
}
```

- [ ] **Step 2: Export the collaboration proto path**

Create `src/common/src/contracts/collaboration_service/index.ts`:

```ts
import { joinContractPath } from '../contract-path.util'

/** COLLABORATION_SERVICE_PROTO_PATH resolves the gRPC proto used by collaboration-service clients and servers. */
export const COLLABORATION_SERVICE_PROTO_PATH = joinContractPath(
  'collaboration_service/collaboration.proto'
)
```

Then export it from `src/common/src/contracts/index.ts`:

```ts
export * from './collaboration_service'
```

- [ ] **Step 3: Add the P1 permission code**

Create `src/common/src/authorization/permission-codes/collaboration/task.permission-codes.ts`:

```ts
/** CollaborationTaskPermissionCodes contains task P1 capability permissions. */
export const CollaborationTaskPermissionCodes = {
  ASSIGN: 'collaboration.task.assign'
} as const

export type CollaborationTaskPermissionCode =
  (typeof CollaborationTaskPermissionCodes)[keyof typeof CollaborationTaskPermissionCodes]
```

Create `src/common/src/authorization/permission-codes/collaboration/index.ts`:

```ts
export * from './task.permission-codes'
```

Then export it from `src/common/src/authorization/permission-codes/index.ts`:

```ts
export * from './collaboration'
```

- [ ] **Step 4: Run proto validation**

Run:

```bash
pnpm proto:lint
```

Expected: exit 0.

- [ ] **Step 5: Generate proto code**

Run:

```bash
pnpm proto:regen
pnpm common:build
```

Expected: both commands exit 0 and generated collaboration service types appear under `src/common/src/generated`.

## Task 2: Scaffold collaboration-service

**Files:**

- Create: `src/services/system/collaboration-service/package.json`
- Create: `src/services/system/collaboration-service/jest.config.js`
- Create: `src/services/system/collaboration-service/tsconfig.json`
- Create: `src/services/system/collaboration-service/tsconfig.spec.json`
- Create: `src/services/system/collaboration-service/src/main.ts`
- Create: `src/services/system/collaboration-service/src/app.module.ts`
- Create: `src/services/system/collaboration-service/src/modules/collaboration-task.module.ts`
- Modify: `package.json`

- [ ] **Step 1: Create package and TypeScript config files**

Create `package.json` using the same script shape as `hr-service`, with name `collaboration-service`:

```json
{
  "name": "collaboration-service",
  "version": "0.0.1",
  "description": "",
  "author": "",
  "private": true,
  "license": "UNLICENSED",
  "scripts": {
    "format": "prettier --write \"src/**/*.ts\" \"test/**/*.ts\"",
    "lint": "eslint \"{src,apps,libs,test}/**/*.ts\" --fix",
    "test": "jest --config jest.config.js --runInBand",
    "test:l1": "jest --config jest.config.js --runInBand test/l1",
    "test:l2": "jest --config jest.config.js --runInBand test/l2",
    "test:l3": "jest --config jest.config.js --runInBand test/l3",
    "build": "tsc -b",
    "dev:build": "tsc -b -w --preserveWatchOutput",
    "dev:start": "wait-on dist/main.js ../../../common/dist/index.js && nodemon --watch dist --watch ../../../common/dist --ext js,json --signal SIGTERM dist/main.js",
    "dev": "concurrently -k -n build,run \"pnpm run dev:build\" \"pnpm run dev:start\"",
    "start": "node dist/main.js",
    "prisma:generate": "npx prisma generate --schema=./prisma/schema.prisma",
    "prisma:push": "npx prisma db push --schema=./prisma/schema.prisma",
    "clear:build": "rimraf dist && rimraf tsconfig.tsbuildinfo",
    "clear:nm": "rimraf node_modules"
  },
  "dependencies": {
    "@grpc/grpc-js": "^1.14.3",
    "@nestjs/common": "^11.0.1",
    "@nestjs/config": "^4.0.3",
    "@nestjs/core": "^11.0.1",
    "@nestjs/microservices": "^11.1.3",
    "@oes/common": "workspace:*",
    "reflect-metadata": "^0.2.2",
    "rxjs": "^7.8.1"
  },
  "devDependencies": {
    "@nestjs/testing": "^11.0.1",
    "@types/jest": "^29.5.14",
    "@types/node": "^22.10.7",
    "concurrently": "^9.2.1",
    "jest": "^29.7.0",
    "nodemon": "^3.1.14",
    "prettier": "^3.4.2",
    "ts-jest": "^29.2.5",
    "wait-on": "^8.0.5",
    "typescript": "^5.7.3"
  }
}
```

Copy `jest.config.js`, `tsconfig.json`, and `tsconfig.spec.json` from `hr-service`, changing only package-specific display names if present.

- [ ] **Step 2: Create Nest module shell**

Create `src/app.module.ts`:

```ts
import { Module } from '@nestjs/common'
import { CollaborationTaskModule } from './modules/collaboration-task.module'

/** AppModule wires collaboration-service modules into the Nest runtime. */
@Module({
  imports: [CollaborationTaskModule]
})
export class AppModule {}
```

Create `src/modules/collaboration-task.module.ts` with empty providers for now:

```ts
import { Module } from '@nestjs/common'

/** CollaborationTaskModule wires the Task P1 command/query, persistence, audit, and gRPC surfaces. */
@Module({})
export class CollaborationTaskModule {}
```

Create `src/main.ts` following another system gRPC service, using `COLLABORATION_SERVICE_PROTO_PATH` and package `collaboration_service`.

- [ ] **Step 3: Add root scripts**

Modify root `package.json` scripts:

```json
"cos": "pnpm --filter collaboration-service dev"
```

Add `collaboration-service` to `backend:system:db:sync`:

```json
"backend:system:db:sync": "pnpm --filter permission-service prisma:push && pnpm --filter identity-service prisma:push && pnpm --filter hr-service prisma:push && pnpm --filter auth-service prisma:push && pnpm --filter asset-service prisma:push && pnpm --filter party-service prisma:push && pnpm --filter tenant-org-service prisma:push && pnpm --filter terminal-device-service prisma:push && pnpm --filter item-master-service prisma:push && pnpm --filter public-entry-service prisma:push && pnpm --filter collaboration-service prisma:push"
```

Do not add it to `backend:system` startup until the service builds and has a stable port configuration.

- [ ] **Step 4: Verify scaffold build**

Run:

```bash
pnpm --filter collaboration-service build
```

Expected: build succeeds after common generated types are available.

## Task 3: Add Prisma schema and repository

**Files:**

- Create: `src/services/system/collaboration-service/prisma/schema.prisma`
- Create: `src/services/system/collaboration-service/src/infrastructure/prisma/prisma.module.ts`
- Create: `src/services/system/collaboration-service/src/infrastructure/prisma/prisma.service.ts`
- Create: `src/services/system/collaboration-service/src/domain/repositories/task.repository.ts`
- Create: `src/services/system/collaboration-service/src/infrastructure/repositories/prisma-task.repository.ts`
- Test: `src/services/system/collaboration-service/test/l2/prisma-task.repository.spec.ts`

- [ ] **Step 1: Write repository L2 tests first**

Create tests for:

- create task with self todo fields
- list by assignee and createdBy
- update status
- archive only stores archive fields

Use the same integration database helper pattern as `hr-service` or `tenant-org-service`.

- [ ] **Step 2: Add Prisma schema**

Create schema:

```prisma
generator client {
  provider = "prisma-client-js"
  output   = "../prisma/generated/prisma"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum CollaborationTaskVisibility {
  PRIVATE
  ASSIGNMENT_PARTICIPANTS
}

enum CollaborationTaskStatus {
  OPEN
  IN_PROGRESS
  COMPLETED
  CANCELLED
}

enum CollaborationTaskPriority {
  LOW
  NORMAL
  HIGH
  URGENT
}

model CollaborationTask {
  id                   String                      @id @default(uuid()) @db.Uuid
  tenantId             String                      @db.VarChar(100)
  title                String                      @db.VarChar(255)
  description          String?                     @db.VarChar(4000)
  createdByAccountId   String                      @db.VarChar(100)
  assigneeAccountId    String                      @db.VarChar(100)
  visibility           CollaborationTaskVisibility
  status               CollaborationTaskStatus     @default(OPEN)
  priority             CollaborationTaskPriority   @default(NORMAL)
  dueAt                DateTime?
  startedAt            DateTime?
  completedAt          DateTime?
  completedByAccountId String?                     @db.VarChar(100)
  completionNote       String?                     @db.VarChar(4000)
  cancelledAt          DateTime?
  cancelledByAccountId String?                     @db.VarChar(100)
  cancelReason         String?                     @db.VarChar(1000)
  archivedAt           DateTime?
  archivedByAccountId  String?                     @db.VarChar(100)
  createdAt            DateTime                    @default(now())
  updatedAt            DateTime                    @updatedAt

  @@index([tenantId, assigneeAccountId, status])
  @@index([tenantId, createdByAccountId, status])
  @@index([tenantId, dueAt])
  @@index([tenantId, archivedAt])
}

model CollaborationTaskAuditEnvelope {
  id                String   @id @default(uuid()) @db.Uuid
  tenantId          String   @db.VarChar(100)
  taskId            String   @db.Uuid
  action            String   @db.VarChar(80)
  result            String   @db.VarChar(40)
  operatorAccountId String   @db.VarChar(100)
  createdByAccountId String  @db.VarChar(100)
  assigneeAccountId String   @db.VarChar(100)
  traceId           String?  @db.VarChar(100)
  auditId           String?  @db.VarChar(100)
  reasonSnapshot    String?  @db.VarChar(1000)
  occurredAt        DateTime @default(now())
  payload           Json?

  @@index([tenantId, taskId])
  @@index([tenantId, occurredAt])
}
```

- [ ] **Step 3: Add repository interface**

Create `task.repository.ts`:

```ts
import { TaskEntity, TaskListFilter, TaskListResult } from '../entities/task.entity'

/** TaskRepository persists and queries Task P1 records inside collaboration-service. */
export interface TaskRepository {
  create(task: TaskEntity): Promise<TaskEntity>
  save(task: TaskEntity): Promise<TaskEntity>
  findById(tenantId: string, taskId: string): Promise<TaskEntity | null>
  list(filter: TaskListFilter): Promise<TaskListResult>
}

export const TASK_REPOSITORY = Symbol('TASK_REPOSITORY')
```

- [ ] **Step 4: Implement Prisma repository**

Implement `PrismaTaskRepository` with `toDomain` and `toPersistence` mappers. Use structured Prisma filters for scopes; do not do ad hoc post-filtering in memory except for derived `overdue`.

- [ ] **Step 5: Run L2 repository tests**

Run:

```bash
pnpm --filter collaboration-service prisma:generate
pnpm --filter collaboration-service test:l2
```

Expected: repository tests pass against the local integration DB pattern.

## Task 4: Implement domain entity and state rules

**Files:**

- Create: `src/services/system/collaboration-service/src/domain/value-objects/task.enums.ts`
- Create: `src/services/system/collaboration-service/src/domain/entities/task.entity.ts`
- Create: `src/services/system/collaboration-service/src/common/errors/task.errors.ts`
- Test: `src/services/system/collaboration-service/test/l1/task-state-rules.spec.ts`

- [ ] **Step 1: Write state rule tests**

Cover:

- `OPEN -> IN_PROGRESS` allowed
- `IN_PROGRESS -> OPEN` rejected
- `COMPLETED -> OPEN` allowed by createdBy or assignee
- `CANCELLED -> OPEN` allowed only by createdBy
- archive rejected unless terminal

- [ ] **Step 2: Add enums**

```ts
/** TaskStatus enumerates the manual task lifecycle states frozen for P1. */
export enum TaskStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

/** TaskPriority enumerates the simple P1 priority levels. */
export enum TaskPriority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

/** TaskVisibility enumerates the P1 visibility modes. */
export enum TaskVisibility {
  PRIVATE = 'PRIVATE',
  ASSIGNMENT_PARTICIPANTS = 'ASSIGNMENT_PARTICIPANTS'
}
```

- [ ] **Step 3: Add task entity**

Implement `TaskEntity` with methods:

```ts
start(operatorAccountId: string, now: Date): void
complete(operatorAccountId: string, note: string | null, now: Date): void
cancel(operatorAccountId: string, reason: string | null, now: Date): void
reopen(operatorAccountId: string): void
archive(operatorAccountId: string, now: Date): void
unarchive(operatorAccountId: string): void
updateBasics(input: { title?: string; description?: string | null; dueAt?: Date | null; priority?: TaskPriority }): void
canRead(operatorAccountId: string): boolean
```

Each class and function must include a short summary comment per AGENTS.md.

- [ ] **Step 4: Add errors**

Create stable error factories or classes:

```ts
export const TASK_NOT_FOUND = 'TASK_NOT_FOUND'
export const TASK_PERMISSION_DENIED = 'TASK_PERMISSION_DENIED'
export const TASK_INVALID_STATE = 'TASK_INVALID_STATE'
export const TASK_INVALID_ARGUMENT = 'TASK_INVALID_ARGUMENT'
export const TASK_ASSIGNEE_NOT_ACTIVE = 'TASK_ASSIGNEE_NOT_ACTIVE'
```

Map these to gRPC exceptions in controllers.

- [ ] **Step 5: Run L1 state tests**

Run:

```bash
pnpm --filter collaboration-service test:l1 -- task-state-rules
```

Expected: state rules pass.

## Task 5: Implement application command/query services

**Files:**

- Create: `src/services/system/collaboration-service/src/application/dtos/task.dto.ts`
- Create: `src/services/system/collaboration-service/src/application/ports/account-reference.port.ts`
- Create: `src/services/system/collaboration-service/src/application/ports/task-audit.port.ts`
- Create: `src/services/system/collaboration-service/src/application/ports/task-event-publisher.port.ts`
- Create: `src/services/system/collaboration-service/src/application/events/task.events.ts`
- Create: `src/services/system/collaboration-service/src/application/services/task-command.service.ts`
- Create: `src/services/system/collaboration-service/src/application/services/task-query.service.ts`
- Test: `src/services/system/collaboration-service/test/l1/task-command.service.spec.ts`
- Test: `src/services/system/collaboration-service/test/l1/task-query.service.spec.ts`

- [ ] **Step 1: Write command service tests first**

Cover:

- self todo does not require assign permission
- assigned task requires assign permission
- assigned task rejects inactive target account
- only createdBy updates/cancels/archive
- assignee starts
- createdBy or assignee completes
- terminal task archive only by createdBy

- [ ] **Step 2: Add ports**

`AccountReferencePort`:

```ts
/** AccountReferencePort validates account targets without moving identity truth into collaboration-service. */
export interface AccountReferencePort {
  isActiveTenantAccount(input: { tenantId: string; accountId: string }): Promise<boolean>
}

export const ACCOUNT_REFERENCE_PORT = Symbol('ACCOUNT_REFERENCE_PORT')
```

`TaskAuditPort`:

```ts
/** TaskAuditPort records command audit envelopes for Task P1 actions. */
export interface TaskAuditPort {
  record(input: {
    tenantId: string
    taskId: string
    action: string
    result: 'SUCCEEDED' | 'REJECTED' | 'FAILED'
    operatorAccountId: string
    createdByAccountId: string
    assigneeAccountId: string
    traceId?: string
    auditId?: string
    reasonSnapshot?: string
    payload?: Record<string, unknown>
  }): Promise<void>
}
```

`TaskEventPublisherPort`:

```ts
/** TaskEventPublisherPort publishes task fact events after local command success. */
export interface TaskEventPublisherPort {
  publish(event: TaskFactEvent): Promise<void>
}
```

- [ ] **Step 3: Implement command service**

`TaskCommandService` must:

- validate context fields
- check `collaboration.task.assign` through existing guard/BFF permission path or a local injected boolean from interface layer
- validate assignee via `AccountReferencePort`
- load task by tenant before mutation
- enforce participant rules in application/domain
- save task
- record audit
- publish event after save

Do not call notification-service.

- [ ] **Step 4: Implement query service**

`TaskQueryService` must:

- validate operator and tenant
- apply `MY_TODO / ASSIGNED_TO_ME / CREATED_BY_ME` scopes
- apply filters
- derive `overdue`
- reject unknown scope/status/priority

- [ ] **Step 5: Run L1 application tests**

Run:

```bash
pnpm --filter collaboration-service test:l1
```

Expected: command/query/state tests pass.

## Task 6: Implement infrastructure adapters for audit, events, and identity account validation

**Files:**

- Create: `src/services/system/collaboration-service/src/infrastructure/adapters/identity-account-reference.grpc.adapter.ts`
- Create: `src/services/system/collaboration-service/src/infrastructure/audit/local-task-audit.repository.ts`
- Create: `src/services/system/collaboration-service/src/infrastructure/events/local-task-event.publisher.ts`
- Modify: `src/services/system/collaboration-service/src/modules/collaboration-task.module.ts`
- Test: `src/services/system/collaboration-service/test/l1/task-command.service.spec.ts`

- [ ] **Step 1: Implement local audit repository**

Persist `CollaborationTaskAuditEnvelope` rows in the service database. Use the same local audit-envelope-first pattern as SRM/Procurement where practical, but keep the P1 audit payload minimal.

- [ ] **Step 2: Implement local event publisher**

For P1, implement a local publisher that returns resolved promises and logs/collects events for tests. Shape event objects as:

```ts
export interface TaskFactEvent {
  eventId: string
  eventType:
    | 'TaskCreated'
    | 'TaskAssigned'
    | 'TaskUpdated'
    | 'TaskStarted'
    | 'TaskCompleted'
    | 'TaskCancelled'
    | 'TaskReopened'
    | 'TaskArchived'
    | 'TaskUnarchived'
  occurredAt: string
  tenantId: string
  taskId: string
  actorAccountId: string
  createdByAccountId: string
  assigneeAccountId: string
  status: string
  previousStatus?: string
  priority: string
  dueAt?: string
  titleSnapshot: string
  traceId?: string
}
```

- [ ] **Step 3: Implement identity account adapter**

Use `identity-service` query contract only to validate target account existence/active tenant scope. If existing identity contracts cannot answer active tenant account status cleanly, implement the adapter interface with a fail-closed stub and document the missing identity contract in the implementation notes before wiring runtime assignment beyond tests.

- [ ] **Step 4: Wire providers**

Update `CollaborationTaskModule` to provide repository, audit, event publisher, account reference adapter, command service, and query service.

- [ ] **Step 5: Run service L1 tests**

Run:

```bash
pnpm --filter collaboration-service test:l1
```

Expected: all L1 tests pass.

## Task 7: Implement gRPC controllers and presenters

**Files:**

- Create: `src/services/system/collaboration-service/src/interfaces/grpc/task-command.grpc.controller.ts`
- Create: `src/services/system/collaboration-service/src/interfaces/grpc/task-query.grpc.controller.ts`
- Create: `src/services/system/collaboration-service/src/interfaces/grpc/task-grpc.presenter.ts`
- Modify: `src/services/system/collaboration-service/src/modules/collaboration-task.module.ts`
- Test: `src/services/system/collaboration-service/test/l3/task-command.grpc.controller.spec.ts`
- Test: `src/services/system/collaboration-service/test/l3/task-query.grpc.controller.spec.ts`

- [ ] **Step 1: Write L3 controller tests first**

Cover:

- missing tenant/operator/trace/audit on command rejects
- create self todo maps request to command service
- create assigned task maps assignee
- list scope maps generated enum to domain scope
- get task enforces service response mapping

- [ ] **Step 2: Implement presenter**

Map domain `TaskEntity` to generated `TaskView`. Include `overdue` only in query presenter or compute it in application result.

- [ ] **Step 3: Implement command controller**

Use generated controller decorators from `@oes/common/generated/collaboration_service` after proto generation. Validate required command contexts before calling application service.

- [ ] **Step 4: Implement query controller**

Validate query contexts, map filters, and delegate to `TaskQueryService`.

- [ ] **Step 5: Run L3 tests**

Run:

```bash
pnpm --filter collaboration-service test:l3
```

Expected: gRPC controller tests pass.

## Task 8: Add API Gateway BFF surface

**Files:**

- Create: `src/services/api-gateway/src/modules/collaboration-service/collaboration-service.module.ts`
- Create: `src/services/api-gateway/src/modules/collaboration-service/adapters/task-command-grpc.adapter.ts`
- Create: `src/services/api-gateway/src/modules/collaboration-service/adapters/task-query-grpc.adapter.ts`
- Create: `src/services/api-gateway/src/modules/collaboration-service/application/task-bff.service.ts`
- Create: `src/services/api-gateway/src/modules/collaboration-service/interface/http/controllers/task.controller.ts`
- Create: `src/services/api-gateway/src/modules/collaboration-service/interface/http/dtos/task.dto.ts`
- Modify: `src/services/api-gateway/src/app.module.ts`
- Test: colocated API Gateway specs under `src/services/api-gateway/src/modules/collaboration-service/**/*.spec.ts`

- [ ] **Step 1: Write BFF controller tests first**

Cover routes conceptually:

- `GET /tasks?scope=MY_TODO`
- `GET /tasks/:taskId`
- `POST /tasks`
- `PATCH /tasks/:taskId`
- `POST /tasks/:taskId/start`
- `POST /tasks/:taskId/complete`
- `POST /tasks/:taskId/cancel`
- `POST /tasks/:taskId/reopen`
- `POST /tasks/:taskId/archive`
- `POST /tasks/:taskId/unarchive`

- [ ] **Step 2: Add DTOs**

DTOs must expose only P1 fields:

```ts
export class CreateTaskDto {
  title!: string
  description?: string
  assigneeAccountId?: string
  dueAt?: string
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'
}
```

Do not expose business object refs, source binding, recurrence, team queue, or project fields.

- [ ] **Step 3: Implement BFF service and adapters**

The BFF service must:

- build tenant/operator/trace/audit contexts using existing API Gateway helpers
- call gRPC adapters
- not implement task business rules locally
- not write task state locally

- [ ] **Step 4: Wire module**

Import `CollaborationServiceModule` in API Gateway app module.

- [ ] **Step 5: Run API Gateway tests**

Run:

```bash
pnpm --filter api-gateway exec jest src/modules/collaboration-service --runInBand
```

Expected: new BFF tests pass.

## Task 9: Permission catalog and seed integration

**Files:**

- Modify: `src/common/src/authorization/permission-codes/collaboration/task.permission-codes.ts`
- Modify permission-service seed tests if they assert full catalog counts:
  - `src/services/system/permission-service/test/l1/common-permission-code-generator.spec.ts`
  - `src/services/system/permission-service/test/l1/permission-foundation.seed.spec.ts`

- [ ] **Step 1: Run permission code generator tests**

Run:

```bash
pnpm --filter permission-service exec jest test/l1/common-permission-code-generator.spec.ts --runInBand
```

Expected before fixes: failures if the new module is not discovered.

- [ ] **Step 2: Ensure collaboration permission exports are discovered**

Confirm root permission code index exports `./collaboration`. If generator expects metadata, add the same metadata shape used by existing modules.

- [ ] **Step 3: Run permission seed tests**

Run:

```bash
pnpm --filter permission-service exec jest test/l1/common-permission-code-generator.spec.ts test/l1/permission-foundation.seed.spec.ts --runInBand
```

Expected: tests pass and `collaboration.task.assign` is in generated catalog output.

## Task 10: End-to-end verification and docs update

**Files:**

- Modify: `docs/plans/features/collaboration-task-p1.md`
- Modify: `docs/plans/collaboration-task-p1-implementation-plan.md`
- Optional after implementation: service README if local convention requires it

- [ ] **Step 1: Run focused service tests**

Run:

```bash
pnpm --filter collaboration-service test
```

Expected: all collaboration-service L1/L2/L3 tests pass.

- [ ] **Step 2: Run common build and proto lint**

Run:

```bash
pnpm proto:lint
pnpm common:build
```

Expected: both pass.

- [ ] **Step 3: Run API Gateway focused tests**

Run:

```bash
pnpm --filter api-gateway exec jest src/modules/collaboration-service --runInBand
```

Expected: collaboration BFF tests pass.

- [ ] **Step 4: Run permission focused tests**

Run:

```bash
pnpm --filter permission-service exec jest test/l1/common-permission-code-generator.spec.ts test/l1/permission-foundation.seed.spec.ts --runInBand
```

Expected: permission code source discovers `collaboration.task.assign`.

- [ ] **Step 5: Update feature packet status**

In `docs/plans/features/collaboration-task-p1.md`, update implementation status and verification evidence with the exact commands run and outcomes. Do not mark the feature completed until runtime, gateway, and permission verification all pass.

## Self-Review Checklist

- Spec coverage:
  - Service boundary covered by Tasks 2-8.
  - P1 Task fields covered by Tasks 3-7.
  - Status lifecycle covered by Tasks 4-7.
  - `collaboration.task.assign` covered by Tasks 1 and 9.
  - Query scopes covered by Tasks 5, 7, and 8.
  - Audit and events covered by Tasks 5 and 6.
  - Gateway/BFF covered by Task 8.
  - Deferred capabilities excluded in Tasks 0, 1, 5, and 8.
- Placeholder scan:
  - This plan intentionally uses concrete file paths, commands, enum names, and method names.
- Type consistency:
  - Proto names use snake_case; TypeScript domain names use camelCase.
  - Domain enum values match Prisma enum values and contract enum labels.

## Execution Handoff

Plan complete and saved to `docs/plans/collaboration-task-p1-implementation-plan.md`. Two execution options:

1. Subagent-Driven (recommended) - dispatch a fresh subagent per task, review between tasks, fast iteration.
2. Inline Execution - execute tasks in this session using executing-plans, batch execution with checkpoints.

Which approach?
