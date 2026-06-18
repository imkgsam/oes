# site-service Site-facing Sync API Contract

> 本文描述 Site Runtime 通过 `@oes/site-runtime-kit` 拉取 OES published data 的黑盒契约。Site Runtime 不直接调用 `site-service` 内部接口，实际 HTTP 入口由 `api-gateway` Site-facing BFF / Site API 承载。

## 1. 通用约束

所有 API 必须使用 [security-and-signing.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/site-service/security-and-signing.md) 中定义的 signed request。

通用规则：

- `site_id` 从 signed credential 解析，不能信任普通 body/query 传入值。
- `client_id`、`credential_id` 从 signed headers 解析。
- 只返回当前 site 被授权读取的数据。
- 所有响应必须携带 `request_id` / `trace_id` 对应信息。
- 查询失败不得泄露 OES Core 内部对象结构。

## 2. Publish State

### `GetLatestPublishState`

作用：Site Runtime 查询当前站点远端最新发布状态。

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `local_publish_version` | 否 | Site Runtime 当前本地版本，用于 OES 诊断。 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `site_id` | 当前站点。 |
| `latest_publish_version` | OES 当前最新可同步版本。 |
| `latest_sync_id` | 最新 sync batch 标识。 |
| `has_updates` | `local_publish_version < latest_publish_version` 时为 true。 |
| `server_time` | OES 当前时间。 |

语义：

- 无已发布数据时 `latest_publish_version = 0`。
- site disabled 时返回 `SITE_DISABLED`。

## 3. Changed Resources

### `ListChangedResources`

作用：Site Runtime 从本地版本同步到远端最新版本时，获取聚合 changed resource list。

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `from_publish_version` | 是 | Site Runtime 当前本地版本。 |
| `to_publish_version` | 否 | P1 默认省略并同步到 latest。 |
| `resource_types[]` | 否 | 可选过滤；为空表示全部 P1 resource types。 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `site_id` | 当前站点。 |
| `from_publish_version` | 请求起点。 |
| `to_publish_version` | 实际目标版本，P1 通常为 latest。 |
| `requires_snapshot` | 是否要求改用 snapshot。 |
| `changed_resources[]` | 聚合变更资源。 |

`changed_resources[]` item：

| 字段 | 说明 |
| --- | --- |
| `resource_type` | `product / category / content / blog / news`。 |
| `resource_id` | OES public view 资源标识。 |
| `locale` | 资源语言。 |
| `latest_publish_version` | 该资源最新版本。 |
| `change_type` | `create / update / unpublish / locale_activate / locale_disable`。 |

语义：

- Delta 是 `from localVersion to latestVersion` 的聚合 changed resource list。
- 同一资源在版本区间内多次变化，只返回最终最新资源。
- changed resource list 不承载完整业务数据。
- OES 可在 delta 不可用、版本太旧、数据校验失败时返回 `requires_snapshot = true`。

## 4. Batch Public Views

### `BatchGetPublicViews`

作用：Site Runtime 按 changed resource list 批量拉取最新 public views。

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `resources[]` | 是 | 要拉取的资源列表。 |

`resources[]` item：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `resource_type` | 是 | P1 resource type。 |
| `resource_id` | 是 | public view resource id。 |
| `locale` | 是 | locale。 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `public_views[]` | 命中的 public views。 |
| `missing_resources[]` | 未命中资源。 |
| `server_publish_version` | OES 当前 latest publishVersion。 |

语义：

- `public_views[]` 使用 [public-views.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/site-service/public-views.md) 定义的 envelope。
- 下架 / 删除 / 禁用语言必须通过 `status` 返回，不应只返回 missing。
- missing 表示该资源对当前 site 不存在或不可见；runtime 应记录 sync warning。

## 5. Snapshot

### `GetSnapshot`

作用：Site Runtime 首次初始化或 delta 不可用时拉取站点完整 public snapshot。

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `resource_types[]` | 否 | 为空表示全部 P1 resource types。 |
| `locales[]` | 否 | 为空表示全部 active locales。 |
| `page_token` | 否 | 分页 token。 |
| `page_size` | 否 | 分页大小。 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `site_id` | 当前站点。 |
| `snapshot_publish_version` | snapshot 对应版本。 |
| `public_views[]` | 当前页 public views。 |
| `next_page_token` | 下一页 token。 |
| `is_complete` | 是否已拉完。 |

语义：

- snapshot 必须是同一 `snapshot_publish_version` 下的一致视图。
- runtime 只有完整拉取并写入成功后才能推进本地 publish state。
- P1 支持 snapshot rebuild，不要求完整 rollback API。

## 6. Sync Completion Report

### `ReportSyncResult`

作用：Site Runtime 向 OES 上报一次 sync 结果。

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `sync_id` | 否 | 若 runtime 知道对应 sync batch，则携带。 |
| `local_publish_version` | 是 | 同步后本地版本。 |
| `status` | 是 | `completed / failed / degraded / blocked`。 |
| `started_at` | 否 | runtime sync 开始时间。 |
| `completed_at` | 否 | runtime sync 完成时间。 |
| `error_code` | 否 | 失败错误码。 |
| `error_message` | 否 | 可读错误摘要，不应包含 secret。 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `accepted` | OES 是否接受该上报。 |
| `server_time` | OES 当前时间。 |

