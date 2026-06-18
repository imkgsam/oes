# collaboration-service Task Command API

> `collaboration-service` 的服务职责、核心对象、owner 边界与长期命名以 [collaboration-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/collaboration-service.md) 为唯一稳定真相源。本文只描述 Task P1 command 黑盒契约。

## 1. 模块职责

`TaskCommandService` 负责 Task P1 手动任务写接口。

P1 command 只处理 manual task，不处理业务对象绑定、source binding、workflow human task、自动完成、recurrence、team queue、SLA、annotation 或 notification 投递。

## 2. 通用上下文要求

所有 Task P1 command 统一要求：

- `tenant_id`
- internal service context
- authenticated operator context
- trace context
- audit context

补充约束：

- 本文件只冻结“必须要求这些上下文存在”，不展开完整内部字段结构。
- 所有 command 都必须按 command 语义处理，不得被调用方当作 query、幂等读取接口或前端草稿缓存接口使用。
- command 成功后必须写入本服务 audit，并在本地事务成功后发布对应 task fact event。
- P1 不冻结 command metadata header、重试策略、outbox 表结构或审计落库结构。

## 3. Task P1 写入基线语义

### 3.1 Task 边界

- `CreateTask` 创建的是工作待办，不创建业务对象。
- Task P1 不引用 CRM/SRM/HR/Finance/Sales/Procurement/MES/WMS 等业务对象。
- `description` 是任务说明纯文本，不是 annotation、comment、activity 或 audit。
- P1 不提供 `DeleteTask`；错误任务通过 `CancelTask + ArchiveTask` 收口。

### 3.2 可见性语义

- self todo 默认 `visibility = PRIVATE`。
- assigned task 默认 `visibility = ASSIGNMENT_PARTICIPANTS`。
- P1 普通可见性只包括 `createdByAccountId` 与 `assigneeAccountId`。
- admin / org / team / project 可见性均后置。

### 3.3 权限语义

- self todo 创建不需要 `collaboration.task.assign`，只要求 authenticated operator。
- 当 `assignee_account_id != operator.account_id` 时，调用方必须具备 `collaboration.task.assign`。
- P1 不按组织层级、汇报关系、项目成员或团队队列限制指派范围。
- 指派目标必须是同 tenant active account。

### 3.4 状态语义

P1 状态：

- `OPEN`
- `IN_PROGRESS`
- `COMPLETED`
- `CANCELLED`

允许流转：

- `OPEN -> IN_PROGRESS`
- `OPEN -> COMPLETED`
- `OPEN -> CANCELLED`
- `IN_PROGRESS -> COMPLETED`
- `IN_PROGRESS -> CANCELLED`
- `COMPLETED -> OPEN`
- `CANCELLED -> OPEN`

不允许流转：

- `IN_PROGRESS -> OPEN`
- `COMPLETED -> IN_PROGRESS`
- `CANCELLED -> IN_PROGRESS`
- `COMPLETED -> CANCELLED`
- `CANCELLED -> COMPLETED`

`archived_at` 不是状态，只是终态后的归档标记。

## 4. RPC 语义

### `CreateTask`

- 作用：创建一条新的手动任务。

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `tenant_id` | 是 | 显式租户边界 |
| `operator_context` | 是 | 操作人上下文 |
| `trace_context` | 是 | 链路追踪上下文 |
| `audit_context` | 是 | 审计上下文 |
| `title` | 是 | 任务标题 |
| `description` | 否 | 纯文本任务说明 |
| `assignee_account_id` | 否 | 处理人；为空时默认为 operator 自己 |
| `due_at` | 否 | optional 到期时间 |
| `priority` | 否 | `LOW / NORMAL / HIGH / URGENT`；为空时默认 `NORMAL` |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `task` | 新建后的 Task |

关键语义：

- 当 `assignee_account_id` 为空或等于 operator account 时，创建 self todo。
- self todo 成功后 `createdByAccountId = assigneeAccountId = operator.account_id`，`visibility = PRIVATE`，`status = OPEN`。
- 当 `assignee_account_id != operator.account_id` 时，必须校验 operator 具备 `collaboration.task.assign`。
- assigned task 成功后 `createdByAccountId = operator.account_id`，`assigneeAccountId = assignee_account_id`，`visibility = ASSIGNMENT_PARTICIPANTS`，`status = OPEN`。
- 成功创建 self todo 后发布 `TaskCreated`。
- 成功创建 assigned task 后发布 `TaskCreated` 与 `TaskAssigned`。

主要错误语义：

- `INVALID_ARGUMENT`：`title` 缺失、字段非法或 `priority` 非法。
- `PERMISSION_DENIED`：operator 无权创建 assigned task。
- `NOT_FOUND`：目标 assignee account 不存在。
- `FAILED_PRECONDITION`：目标 assignee account 不属于当前 tenant 或不是 active account。

### `UpdateTask`

- 作用：更新任务内容。

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `tenant_id` | 是 | 显式租户边界 |
| `task_id` | 是 | 目标 Task 标识 |
| `title` | 否 | 更新后的标题 |
| `description` | 否 | 更新后的纯文本说明 |
| `due_at` | 否 | 更新后的到期时间 |
| `priority` | 否 | 更新后的优先级 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `task` | 更新后的 Task |

关键语义：

- 只有 `createdByAccountId` 可以更新任务内容。
- 只允许更新 `OPEN / IN_PROGRESS` 状态任务。
- 已归档任务不得更新。
- 本命令不修改 assignee，不修改 status，不创建 annotation。
- 成功后发布 `TaskUpdated`。

主要错误语义：

- `NOT_FOUND`：目标 task 不存在或不属于当前 tenant。
- `PERMISSION_DENIED`：operator 不是 task 创建者。
- `FAILED_PRECONDITION`：任务已完成、已取消或已归档，当前不可更新。
- `INVALID_ARGUMENT`：字段非法。

### `StartTask`

- 作用：将任务标记为进行中。

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `tenant_id` | 是 | 显式租户边界 |
| `task_id` | 是 | 目标 Task 标识 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `task` | 开始后的 Task |

关键语义：

- 只有 `assigneeAccountId` 可以开始任务。
- `OPEN -> IN_PROGRESS`。
- 若任务已是 `IN_PROGRESS`，幂等成功，不改变其他业务字段。
- 设置或覆盖 `startedAt` 为最近一次开始时间。
- 成功状态变化后发布 `TaskStarted`。

主要错误语义：

- `NOT_FOUND`：目标 task 不存在或不属于当前 tenant。
- `PERMISSION_DENIED`：operator 不是 assignee。
- `FAILED_PRECONDITION`：任务为 `COMPLETED / CANCELLED` 或已归档。

### `CompleteTask`

- 作用：将任务标记为完成。

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `tenant_id` | 是 | 显式租户边界 |
| `task_id` | 是 | 目标 Task 标识 |
| `completion_note` | 否 | 完成说明纯文本 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `task` | 完成后的 Task |

关键语义：

- `createdByAccountId` 或 `assigneeAccountId` 可以完成任务。
- `OPEN / IN_PROGRESS -> COMPLETED`。
- 若任务已是 `COMPLETED`，幂等成功，不覆盖既有完成字段。
- 记录 `completedAt`、`completedByAccountId`、`completionNote`。
- 成功状态变化后发布 `TaskCompleted`。

主要错误语义：

- `NOT_FOUND`：目标 task 不存在或不属于当前 tenant。
- `PERMISSION_DENIED`：operator 既不是 createdBy 也不是 assignee。
- `FAILED_PRECONDITION`：任务为 `CANCELLED` 或已归档。

### `CancelTask`

- 作用：取消任务。

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `tenant_id` | 是 | 显式租户边界 |
| `task_id` | 是 | 目标 Task 标识 |
| `cancel_reason` | 否 | 取消原因纯文本 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `task` | 取消后的 Task |

关键语义：

- 只有 `createdByAccountId` 可以取消任务。
- `OPEN / IN_PROGRESS -> CANCELLED`。
- 若任务已是 `CANCELLED`，幂等成功，不覆盖既有取消字段。
- 记录 `cancelledAt`、`cancelledByAccountId`、`cancelReason`。
- 成功状态变化后发布 `TaskCancelled`。

主要错误语义：

- `NOT_FOUND`：目标 task 不存在或不属于当前 tenant。
- `PERMISSION_DENIED`：operator 不是 createdBy。
- `FAILED_PRECONDITION`：任务为 `COMPLETED` 或已归档。

### `ReopenTask`

- 作用：将已完成或已取消任务重新打开。

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `tenant_id` | 是 | 显式租户边界 |
| `task_id` | 是 | 目标 Task 标识 |
| `reopen_reason` | 否 | 重开原因纯文本 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `task` | 重开后的 Task |

关键语义：

- `COMPLETED -> OPEN`：createdBy 或 assignee 可以重开。
- `CANCELLED -> OPEN`：只有 createdBy 可以重开。
- 已归档任务必须先 `UnarchiveTask` 才能重开。
- 重开后清空当前完成 / 取消主字段；历史必须通过 audit 保留。
- 成功状态变化后发布 `TaskReopened`。

主要错误语义：

- `NOT_FOUND`：目标 task 不存在或不属于当前 tenant。
- `PERMISSION_DENIED`：operator 不满足对应状态的重开权限。
- `FAILED_PRECONDITION`：任务不是 `COMPLETED / CANCELLED`，或任务已归档。

### `ArchiveTask`

- 作用：归档终态任务。

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `tenant_id` | 是 | 显式租户边界 |
| `task_id` | 是 | 目标 Task 标识 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `task` | 归档后的 Task |

关键语义：

- 只有 `createdByAccountId` 可以归档任务。
- 只允许归档 `COMPLETED / CANCELLED` 任务。
- 已归档任务幂等成功。
- 记录 `archivedAt`、`archivedByAccountId`。
- 首次成功归档后发布 `TaskArchived`。

主要错误语义：

- `NOT_FOUND`：目标 task 不存在或不属于当前 tenant。
- `PERMISSION_DENIED`：operator 不是 createdBy。
- `FAILED_PRECONDITION`：任务不是 `COMPLETED / CANCELLED`。

### `UnarchiveTask`

- 作用：取消任务归档。

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `tenant_id` | 是 | 显式租户边界 |
| `task_id` | 是 | 目标 Task 标识 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `task` | 取消归档后的 Task |

关键语义：

- 只有 `createdByAccountId` 可以取消归档。
- 未归档任务幂等成功。
- 清空 `archivedAt`、`archivedByAccountId`。
- 首次成功取消归档后发布 `TaskUnarchived`。

主要错误语义：

- `NOT_FOUND`：目标 task 不存在或不属于当前 tenant。
- `PERMISSION_DENIED`：operator 不是 createdBy。

## 5. Task 返回摘要

P1 command 返回的 `task` 至少包含：

| 字段 | 说明 |
| --- | --- |
| `task_id` | Task 标识 |
| `tenant_id` | 租户边界 |
| `title` | 任务标题 |
| `description` | 纯文本任务说明 |
| `created_by_account_id` | 创建者账号 |
| `assignee_account_id` | 处理人账号 |
| `visibility` | `PRIVATE / ASSIGNMENT_PARTICIPANTS` |
| `status` | `OPEN / IN_PROGRESS / COMPLETED / CANCELLED` |
| `priority` | `LOW / NORMAL / HIGH / URGENT` |
| `due_at` | optional 到期时间 |
| `started_at` | optional 最近开始时间 |
| `completed_at` | optional 完成时间 |
| `completed_by_account_id` | optional 完成人 |
| `completion_note` | optional 完成说明 |
| `cancelled_at` | optional 取消时间 |
| `cancelled_by_account_id` | optional 取消人 |
| `cancel_reason` | optional 取消原因 |
| `archived_at` | optional 归档时间 |
| `archived_by_account_id` | optional 归档人 |
| `created_at` | 创建时间 |
| `updated_at` | 更新时间 |

## 6. 明确禁止

- 不允许 command 直接创建或修改业务对象。
- 不允许 command 写入 annotation、comment、notification dispatch、workflow instance 或 activity timeline 真相。
- 不允许调用方把 task command 当作跨服务长事务协调器。
- 不允许跨 tenant 指派任务。
- 不允许物理删除任务。
