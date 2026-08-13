# collaboration-service Task Query API

> `collaboration-service` 的服务职责、核心对象、owner 边界与长期命名以 [collaboration-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/collaboration-service.md) 为唯一稳定真相源。本文只描述 Task P1 query 黑盒契约。

## 1. 模块职责

`TaskQueryService` 负责 Task P1 个人任务列表与详情查询接口。

P1 query 只支持参与者视角，不提供管理视图、组织视图、团队队列视图、项目视图或业务对象关联视图。

## 2. 通用上下文要求

所有 Task P1 query 统一通过 trusted HUMAN WEB ExecutionToken 建立 tenant、operator 与 trace authority；这些字段不再由 request body 提供。

补充约束：

- 本文件只冻结“必须要求这些上下文存在”，不展开完整内部字段结构。
- query 不要求 audit context。
- query 不得产生 Task 状态变化。
- P1 不冻结缓存策略、全文检索实现或分页游标实现。

## 3. 查询基线语义

### 3.1 可见性

P1 普通可见性只允许：

- `createdByAccountId = operator.account_id`
- 或 `assigneeAccountId = operator.account_id`

不存在 admin all view、org scope view 或 team queue view。

### 3.2 Scope

P1 `ListTasks` 支持三个 scope：

- `MY_TODO`
- `ASSIGNED_TO_ME`
- `CREATED_BY_ME`

scope 语义：

| Scope | 语义 |
| --- | --- |
| `MY_TODO` | `createdByAccountId = operator` 且 `assigneeAccountId = operator` 且 `visibility = PRIVATE` |
| `ASSIGNED_TO_ME` | `assigneeAccountId = operator` 且 `createdByAccountId != operator` |
| `CREATED_BY_ME` | `createdByAccountId = operator` 且 `assigneeAccountId != operator` |

### 3.3 Overdue

`OVERDUE` 不作为状态。

`overdue` 由 query 读取时派生：

- `status in OPEN / IN_PROGRESS`
- 且 `dueAt < now`

P1 不发布 `TaskOverdue` 事件，不实现 overdue scheduler。

## 4. RPC 语义

### `ListTasks`

- 作用：按当前 operator 的任务视图列出任务。

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `scope` | 是 | `MY_TODO / ASSIGNED_TO_ME / CREATED_BY_ME` |
| `status` | 否 | 可多选；为空时默认 `OPEN / IN_PROGRESS` |
| `priority` | 否 | 可多选 |
| `due_before` | 否 | 只返回 `dueAt <= due_before` 的任务 |
| `due_after` | 否 | 只返回 `dueAt >= due_after` 的任务 |
| `keyword` | 否 | 匹配 `title / description` 的简单关键字 |
| `overdue_only` | 否 | 只返回已超期且未终态任务 |
| `include_archived` | 否 | 是否包含已归档任务；默认 false |
| `archived_only` | 否 | 是否只返回已归档任务；默认 false |
| `page` | 否 | 页码；未传由服务采用默认值 |
| `page_size` | 否 | 每页数量；未传由服务采用默认值 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `items[]` | Task 摘要列表 |
| `page` | 当前页 |
| `page_size` | 每页数量 |
| `total` | 当前过滤条件下总数 |

默认语义：

- `status` 为空时，只返回 `OPEN / IN_PROGRESS`。
- `include_archived = false` 且 `archived_only = false` 时，不返回已归档任务。
- `archived_only = true` 时，只返回已归档任务。
- `archived_only = true` 与 `include_archived = true` 同时传入时，以 `archived_only` 为准。

排序建议：

- 未终态任务优先。
- `dueAt` 升序，空 `dueAt` 排在有 `dueAt` 之后。
- `priority` 高优先。
- `updatedAt` 或 `createdAt` 倒序作为稳定兜底。

主要错误语义：

- `INVALID_ARGUMENT`：scope、status、priority、分页或时间过滤非法。
- `UNAUTHENTICATED`：operator context 缺失或不可用。
- `PERMISSION_DENIED`：operator 不属于请求 tenant 或不具备当前 tenant 上下文。

### `GetTask`

- 作用：按 task id 查询当前 operator 可见的任务详情。

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `task_id` | 是 | 目标 Task 标识 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `task` | Task 详情 |

关键语义：

- 只有 `createdByAccountId` 或 `assigneeAccountId` 可以读取。
- P1 不支持 admin bypass。
- P1 不返回 annotation、activity、notification、workflow 或业务对象聚合信息。

主要错误语义：

- `NOT_FOUND`：目标 task 不存在或不属于当前 tenant。
- `PERMISSION_DENIED`：operator 不是 createdBy 或 assignee。

## 5. Task 摘要 / 详情 shape

P1 query 返回的 task 至少包含：

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
| `overdue` | query 派生布尔值 |
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

P1 不返回：

- business object refs
- source binding
- workflow refs
- notification dispatch status
- annotation list
- comment thread
- attachment summaries

## 6. 明确禁止

- 不允许调用方通过 query 推断或访问非参与者任务。
- 不允许 query 直接拼接业务对象、workflow、notification 或 annotation 真相。
- 不允许把 `overdue` 当作持久状态。
- 不允许前端绕过 `api-gateway` / BFF 直接调用 `collaboration-service`。

## 7. Task Assistant Consumption (Deferred)

`ListTasks` 与 `GetTask` 的 Task Assistant/DELEGATED 注册保持后置。当前 trusted HUMAN WEB RPC 不接受 DELEGATED、AI 或 MACHINE ExecutionToken；未来如需 read ToolContract，必须另行冻结执行类别、权限和审计语义。
