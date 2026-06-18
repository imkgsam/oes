# collaboration-service Annotation Command API

> `collaboration-service` 的服务职责、核心对象、owner 边界与长期命名以 [collaboration-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/collaboration-service.md) 为唯一稳定真相源。本文只描述 Annotation P1 command 黑盒契约。

## 1. 模块职责

`AnnotationCommandService` 负责 Annotation P1 对象备注写接口。

P1 command 只处理围绕 `crm-service / CrmAccount` 的内部纯文本备注，不处理图片、附件、富文本、mention、comment thread、notification、ObjectActivity / ObjectTimeline 或全局 Notes 中心。

## 2. 通用上下文要求

所有 Annotation P1 command 统一要求：

- `tenant_id`
- internal service context
- authenticated operator context
- trace context
- audit context

补充约束：

- 本文件只冻结“必须要求这些上下文存在”，不展开完整内部字段结构。
- 所有 command 都必须按 command 语义处理，不得被调用方当作 query、草稿保存或前端缓存接口使用。
- command 成功或拒绝 / 失败都必须写入 `collaboration-service.annotation` 本地 audit，并对齐 OES audit envelope。
- P1 不冻结公共 subscribable annotation events、outbox 表结构、审计落库结构或重试策略。

## 3. Annotation P1 写入基线语义

### 3.1 对象边界

- P1 只允许 `object_owner_service = crm-service` 且 `object_type = CrmAccount`。
- 未接入白名单的对象类型必须拒绝创建备注。
- Annotation 不直接查询 CRM 数据库，不持有 `CrmAccount` 主数据真相。
- 写入前必须通过 `crm-service` 的对象引用校验能力确认对象存在、operator 可读、当前对象状态允许备注。

### 3.2 内容边界

- P1 备注正文是纯文本、多行内部备注。
- 正文不得为空或只包含空白字符。
- P1 不支持图片、附件、富文本、Markdown、mention、模板、AI 总结或回复树。
- 编辑后必须保留“已编辑”语义与本地 audit；P1 不展示版本 diff。

### 3.3 可见性语义

P1 只支持：

- `PRIVATE`
- `OBJECT_VISIBLE`

默认可见性为 `OBJECT_VISIBLE`。

读取语义：

- `OBJECT_VISIBLE`：operator 必须能读取对应 `CrmAccount`。
- `PRIVATE`：仅作者本人可见，治理路径除外。

### 3.4 权限语义

P1 冻结两个权限语义：

- `collaboration.annotation.create`
- `collaboration.annotation.manage`

操作规则：

- 创建备注：需要能读取对应 `CrmAccount`，且具备 `collaboration.annotation.create`。
- 编辑备注：P1 只允许作者编辑自己的备注。
- 软删除自己的备注：作者规则允许，不单独要求权限码。
- 软删除他人备注：需要 `collaboration.annotation.manage`。
- 置顶 / 取消置顶：需要 `collaboration.annotation.manage`。
- P1 不允许管理员编辑他人备注正文。

### 3.5 归档对象语义

- 已归档但仍可读取的 `CrmAccount` 可以查看 Notes。
- 已归档 `CrmAccount` 不允许新增普通备注。
- 已归档 `CrmAccount` 不允许编辑或置顶既有备注，治理删除除外。
- 物理删除对象后的备注处理不在 P1 冻结范围。

## 4. RPC 语义

### `CreateAnnotation`

- 作用：在支持对象上创建一条内部备注。

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `tenant_id` | 是 | 显式租户边界 |
| `operator_context` | 是 | 操作人上下文 |
| `trace_context` | 是 | 链路追踪上下文 |
| `audit_context` | 是 | 审计上下文 |
| `object_ref` | 是 | 目标业务对象引用；P1 只允许 `crm-service / CrmAccount` |
| `body_text` | 是 | 纯文本备注正文 |
| `visibility` | 否 | `PRIVATE / OBJECT_VISIBLE`；为空时默认 `OBJECT_VISIBLE` |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `annotation` | 新建后的 Annotation |

关键语义：

- 必须先校验 `object_ref` 在 P1 白名单中。
- 必须通过 `crm-service` 对象引用校验能力确认 `CrmAccount` 存在、operator 可读、当前对象允许创建备注。
- 创建成功后记录本地 audit。
- P1 不发布公共 annotation event。

主要错误语义：

- `INVALID_ARGUMENT`：`object_ref` 缺失、对象类型非法、正文为空、可见性非法。
- `UNAUTHENTICATED`：operator context、trace context 或 audit context 缺失。
- `PERMISSION_DENIED`：operator 无 `collaboration.annotation.create`，或不能读取目标 `CrmAccount`。
- `NOT_FOUND`：目标 `CrmAccount` 不存在。
- `FAILED_PRECONDITION`：目标 `CrmAccount` 已归档或当前状态不允许新增备注。

### `UpdateAnnotation`

- 作用：编辑自己创建的备注正文或可见性。

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `tenant_id` | 是 | 显式租户边界 |
| `operator_context` | 是 | 操作人上下文 |
| `trace_context` | 是 | 链路追踪上下文 |
| `audit_context` | 是 | 审计上下文 |
| `annotation_id` | 是 | 目标 Annotation |
| `body_text` | 否 | 更新后的纯文本正文；传入时不得为空白 |
| `visibility` | 否 | 更新后的 `PRIVATE / OBJECT_VISIBLE` |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `annotation` | 更新后的 Annotation |

关键语义：

- P1 只允许作者本人编辑。
- 已软删除备注不得编辑。
- 若关联 `CrmAccount` 已归档，P1 不允许编辑。
- 至少必须传入一个实际变更字段。
- 成功后保留“已编辑”语义并记录本地 audit。

主要错误语义：

- `INVALID_ARGUMENT`：`annotation_id` 缺失、正文为空白、可见性非法或没有实际变更。
- `NOT_FOUND`：目标 annotation 不存在或不属于当前 tenant。
- `PERMISSION_DENIED`：operator 不是作者本人，或当前 operator 已不能读取目标 `CrmAccount`。
- `FAILED_PRECONDITION`：备注已删除，或目标 `CrmAccount` 已归档。

### `DeleteAnnotation`

- 作用：软删除一条备注。

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `tenant_id` | 是 | 显式租户边界 |
| `operator_context` | 是 | 操作人上下文 |
| `trace_context` | 是 | 链路追踪上下文 |
| `audit_context` | 是 | 审计上下文 |
| `annotation_id` | 是 | 目标 Annotation |
| `delete_reason` | 否 | 治理删除原因摘要 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `annotation` | 删除后的 Annotation 摘要 |

关键语义：

- 作者可以软删除自己的备注。
- 具备 `collaboration.annotation.manage` 的 operator 可以软删除任意备注。
- 已软删除备注再次删除可幂等成功，不覆盖首次删除者和首次删除时间。
- 软删除不物理清除正文；普通 Notes 列表不展示已删除备注。
- 目标 `CrmAccount` 已归档时，治理删除仍允许。

主要错误语义：

- `INVALID_ARGUMENT`：`annotation_id` 缺失。
- `NOT_FOUND`：目标 annotation 不存在或不属于当前 tenant。
- `PERMISSION_DENIED`：operator 既不是作者，也不具备 `collaboration.annotation.manage`。

### `SetAnnotationPinned`

- 作用：置顶或取消置顶一条备注。

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `tenant_id` | 是 | 显式租户边界 |
| `operator_context` | 是 | 操作人上下文 |
| `trace_context` | 是 | 链路追踪上下文 |
| `audit_context` | 是 | 审计上下文 |
| `annotation_id` | 是 | 目标 Annotation |
| `pinned` | 是 | true 表示置顶，false 表示取消置顶 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `annotation` | 更新后的 Annotation |

关键语义：

- 置顶 / 取消置顶必须具备 `collaboration.annotation.manage`。
- 置顶是对象级，不是个人收藏。
- 支持多条置顶备注。
- 置顶不改变可见性，只改变对可见用户的排序。
- 已软删除备注不得置顶。
- 关联 `CrmAccount` 已归档时，P1 不允许置顶 / 取消置顶。

主要错误语义：

- `INVALID_ARGUMENT`：`annotation_id` 缺失。
- `NOT_FOUND`：目标 annotation 不存在或不属于当前 tenant。
- `PERMISSION_DENIED`：operator 缺少 `collaboration.annotation.manage`。
- `FAILED_PRECONDITION`：备注已删除，或目标 `CrmAccount` 已归档。

## 5. 明确禁止

- 不允许绕过 `crm-service` 对象引用校验，直接给任意字符串 objectRef 创建备注。
- 不允许 Annotation command 直接读取 CRM 数据库。
- 不允许把 Annotation 正文写入 audit 作为唯一读取来源。
- 不允许管理员编辑他人备注正文。
- 不允许 P1 command 创建附件、图片、mention、Task、Activity 或 Notification。
- 不允许前端绕过 `api-gateway` / BFF 直接调用 `collaboration-service`。
