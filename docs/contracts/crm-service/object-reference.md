# crm-service Object Reference API

> `crm-service` 的服务职责、核心对象、owner 边界与长期命名以 [crm-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/crm-service.md) 为唯一稳定真相源。本文只描述供外部协作能力校验 `CrmAccount` 对象引用的黑盒契约。

## 1. 模块职责

`CrmObjectReferenceService` 负责为平台协作能力提供 CRM 对象引用校验。

P1 只服务 `collaboration-service.annotation` 对 `CrmAccount` 的备注接入，不提供通用 CRM object registry，不替代 CRM query service，也不暴露 CRM 内部表结构。

## 2. 通用上下文要求

所有 Object Reference query 统一要求：

- `tenant_id`
- internal service context
- authenticated operator context
- trace context

补充约束：

- 本文件只冻结“必须要求这些上下文存在”，不展开完整内部字段结构。
- 该能力是 query / validation，不修改 CRM 状态。
- 该能力不要求 audit context；调用方自己的 command 仍必须写本服务 audit。

## 3. 支持范围

P1 只支持：

- `object_owner_service = crm-service`
- `object_type = CrmAccount`

P1 不支持：

- `CrmContact`
- `Opportunity`
- `CrmActivity`
- CRM 之外的任意对象
- 全局 Object Registry

## 4. RPC 语义

### `ValidateCrmObjectReference`

- 作用：验证一个 CRM 对象引用是否存在、当前 operator 是否可读、是否允许指定协作动作。

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `tenant_id` | 是 | 显式租户边界 |
| `operator_context` | 是 | 操作人上下文 |
| `trace_context` | 是 | 链路追踪上下文 |
| `object_type` | 是 | P1 只允许 `CrmAccount` |
| `object_id` | 是 | 目标 CRM 对象 ID |
| `requested_capability` | 是 | `READ / CREATE_ANNOTATION / MUTATE_ANNOTATION` |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `object_ref` | 规范化后的对象引用 |
| `exists` | 对象是否存在；不存在时也可直接返回 `NOT_FOUND` |
| `readable` | 当前 operator 是否可读取对象 |
| `capability_allowed` | 当前 requested capability 是否允许 |
| `object_lifecycle` | `ACTIVE / ARCHIVED / DELETED_OR_UNAVAILABLE` |
| `display_snapshot` | 轻量展示快照 |
| `deny_reason` | 拒绝原因摘要；仅用于调用方错误映射和排障 |

`display_snapshot` 至少包含：

| 字段 | 说明 |
| --- | --- |
| `title` | CRM Account 当前展示名摘要 |
| `subtitle` | optional 编号、阶段或其他轻量摘要 |
| `status` | CRM Account 状态摘要 |

关键语义：

- CRM owns `CrmAccount` 是否存在、是否可读、生命周期状态以及是否允许创建备注的判断。
- `READ` 用于 Annotation query 前置校验。
- `CREATE_ANNOTATION` 用于创建备注前置校验。
- `MUTATE_ANNOTATION` 用于编辑、删除、置顶等备注变更前置校验；归档对象应拒绝编辑和置顶，但允许调用方在治理删除场景根据自身权限继续删除备注。
- `display_snapshot` 只供协作 UI 展示，不转移 CRM 主数据真相。

主要错误语义：

- `INVALID_ARGUMENT`：`object_type`、`object_id` 或 `requested_capability` 非法。
- `UNAUTHENTICATED`：operator context 或 trace context 缺失。
- `NOT_FOUND`：目标 `CrmAccount` 不存在或不属于当前 tenant。
- `PERMISSION_DENIED`：operator 不能读取目标 `CrmAccount`。
- `FAILED_PRECONDITION`：目标 `CrmAccount` 存在但生命周期状态不允许 requested capability。

## 5. 调用方语义

`collaboration-service.annotation` 调用该能力时：

- 不得直接查询 CRM 数据库。
- 不得缓存 CRM 对象权限作为长期授权真相。
- 可以保存 `display_snapshot` 作为 Annotation 展示快照，但不得把它当作 CRM 当前真相。
- 必须把 annotation command/query 自己的 audit 留在 `collaboration-service`。

## 6. 明确禁止

- 不允许把该接口扩成跨服务全局 object registry。
- 不允许把 Annotation 正文、Task、Attachment、Notification 或 ObjectTimeline 语义塞进 CRM。
- 不允许 CRM 为外部协作能力保存 Annotation 真相。
