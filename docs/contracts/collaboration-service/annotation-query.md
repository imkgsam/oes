# collaboration-service Annotation Query API

> `collaboration-service` 的服务职责、核心对象、owner 边界与长期命名以 [collaboration-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/collaboration-service.md) 为唯一稳定真相源。本文只描述 Annotation P1 query 黑盒契约。

## 1. 模块职责

`AnnotationQueryService` 负责 Annotation P1 对象备注列表与详情查询接口。

P1 query 只支持按当前 objectRef 查询 `CrmAccount` Notes，不提供全局 Notes 中心、跨对象搜索、最近备注列表、管理回收站或 ObjectTimeline 聚合。

## 2. 通用上下文要求

所有 Annotation P1 query 统一通过 trusted HUMAN WEB ExecutionToken 建立 tenant、operator 与 trace authority；这些字段不再由 request body 提供。

补充约束：

- 本文件只冻结“必须要求这些上下文存在”，不展开完整内部字段结构。
- query 不要求 audit context。
- query 不得产生 Annotation 状态变化。
- P1 不冻结全文检索、缓存策略、游标分页或 ObjectTimeline 投影。

## 3. 查询基线语义

### 3.1 对象可见性

查询 `OBJECT_VISIBLE` 备注前，必须确认 operator 能读取对应 `CrmAccount`。

Annotation Query 不直接查询 CRM 数据库，应通过 `crm-service` object reference validation / read access 能力确认对象存在与读取许可。

### 3.2 备注可见性

P1 可见性：

| Visibility | 查询语义 |
| --- | --- |
| `OBJECT_VISIBLE` | operator 能读取目标 `CrmAccount` 时可见 |
| `PRIVATE` | 仅作者本人可见，治理路径除外 |

普通 Notes 列表不返回已软删除备注。

### 3.3 排序

P1 列表排序：

1. 置顶备注优先。
2. 置顶组内按创建时间倒序。
3. 非置顶组内按创建时间倒序。

编辑备注不改变创建时间排序。

## 4. RPC 语义

### `ListAnnotationsForObject`

- 作用：按当前 objectRef 查询可见 Notes 列表。

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `object_ref` | 是 | 目标业务对象引用；P1 只允许 `crm-service / CrmAccount` |
| `include_private` | 否 | 是否包含当前作者自己的 private notes；默认 true |
| `page` | 否 | 页码；未传由服务采用默认值 |
| `page_size` | 否 | 每页数量；未传由服务采用默认值 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `items[]` | Annotation 摘要列表 |
| `page` | 当前页 |
| `page_size` | 每页数量 |
| `total` | 当前过滤条件下总数 |

关键语义：

- `object_ref` 必须在 P1 白名单中。
- 目标 `CrmAccount` 不存在时返回 `NOT_FOUND`。
- operator 不能读取目标 `CrmAccount` 时返回 `PERMISSION_DENIED`。
- 已归档但仍可读取的 `CrmAccount` 可以查询 Notes。
- 结果包含 `OBJECT_VISIBLE` notes 与当前作者自己的 `PRIVATE` notes。
- P1 不提供 include deleted 参数，不提供回收站视图。

主要错误语义：

- `INVALID_ARGUMENT`：`object_ref`、分页或对象类型非法。
- `UNAUTHENTICATED`：operator context 或 trace context 缺失。
- `PERMISSION_DENIED`：operator 不能读取目标 `CrmAccount`。
- `NOT_FOUND`：目标 `CrmAccount` 不存在。

### `GetAnnotation`

- 作用：按 annotation id 查询当前 operator 可见的备注详情。

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `annotation_id` | 是 | 目标 Annotation 标识 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `annotation` | Annotation 详情 |

关键语义：

- 目标 annotation 必须属于当前 tenant。
- 已软删除备注不通过普通 `GetAnnotation` 返回。
- `OBJECT_VISIBLE` 备注要求 operator 能读取关联 `CrmAccount`。
- `PRIVATE` 备注只允许作者本人读取，治理路径除外。

主要错误语义：

- `INVALID_ARGUMENT`：`annotation_id` 缺失。
- `NOT_FOUND`：annotation 不存在、不属于当前 tenant、已软删除，或为防枚举需要隐藏不可见结果。
- `PERMISSION_DENIED`：operator 不能读取关联 `CrmAccount` 或不是 private note 作者。

## 5. Annotation 摘要 / 详情 shape

P1 query 返回的 annotation 至少包含：

| 字段 | 说明 |
| --- | --- |
| `annotation_id` | Annotation 标识 |
| `tenant_id` | 租户边界 |
| `object_ref` | 关联业务对象引用 |
| `object_display_snapshot` | 创建 / 最近校验时的轻量展示快照；不是业务对象真相 |
| `author_account_id` | 作者账号 |
| `author_display_name_snapshot` | 作者展示名快照 |
| `body_text` | 纯文本备注正文 |
| `visibility` | `PRIVATE / OBJECT_VISIBLE` |
| `pinned` | 是否对象级置顶 |
| `edited` | 是否曾被编辑 |
| `created_at` | 创建时间 |
| `updated_at` | 更新时间 |
| `deleted_at` | 普通查询不返回已删除备注；该字段可在治理路径后续设计中使用 |

P1 不返回：

- images
- attachments
- mention summaries
- comment replies
- task summaries
- notification dispatch status
- ObjectActivity / Timeline items
- audit envelope details
- version diff

## 6. 明确禁止

- 不允许 query 绕过 `CrmAccount` 读取权限显示 `OBJECT_VISIBLE` 备注。
- 不允许普通 query 返回已软删除备注。
- 不允许 query 聚合 Task、Attachment、Notification、ObjectActivity 或 CRM Activity。
- 不允许前端绕过 `api-gateway` / BFF 直接调用 `collaboration-service`。
