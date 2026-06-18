# site-service Preview and Runtime Status Contract

> 本文描述 Preview 与 Site Runtime status 的 P1 黑盒契约。Preview 用于 OES Admin 查看真实站点效果，不影响正式 published data。

## 1. Preview Token

Preview 只能由 OES Admin 登录用户发起。

### `IssuePreviewToken`

入口：Admin BFF。

作用：为已保存草稿生成短时 preview token。

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `site_id` | 是 | 目标站点。 |
| `resource_type` | 是 | `product / blog / news`；P1 不支持 category preview。 |
| `resource_id` | 是 | 目标资源。 |
| `locale` | 是 | preview locale。 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `preview_token` | 短时 token，不携带完整内容。 |
| `preview_url` | OES Admin 应打开的站点 preview URL。 |
| `expires_at` | 过期时间。 |

语义：

- P1 要求先保存草稿，再 preview。
- token 绑定 site、resource、locale、operator。
- token 固定 15 分钟过期。
- issue token 不生成 publishVersion，不触发 webhook。

## 2. Preview View

### `GetPreviewView`

入口：Site-facing API，由 Site Runtime 通过 SDK 调用。

作用：Site Runtime 使用 preview token 拉取 draft preview view。

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `preview_token` | 是 | OES Admin 发起 preview 时生成。 |
| `resource_type` | 是 | preview resource type。 |
| `resource_id` | 是 | preview resource id。 |
| `locale` | 是 | preview locale。 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `preview_view` | 使用 public view envelope，但 `status = draft_preview`。 |
| `expires_at` | token 过期时间。 |
| `noindex` | P1 固定 true。 |
| `cache_policy` | P1 固定 `no-store`。 |

语义：

- Site Runtime 必须使用 signed request + preview token。
- Preview view 不写入正式 `published_resources`。
- Preview page 必须 `noindex`、`nofollow`、`no-store`。
- Storefront Frontend 不得直接调用 OES Preview API。
- 无真实 OES draft preview、OES Preview API 暂不可用或 draft lookup 失败时，Site Runtime 可以 fail closed 并返回 5xx；该响应仍必须携带 `Cache-Control: no-store` 和 `X-Robots-Tag: noindex, nofollow` 或等效语义。
- Storefront Frontend 可以将 preview 5xx 转换为 200 安全 fallback 页面，用于保持预览入口可读；fallback 页面仍必须 `noindex`、`nofollow`、`no-store`。
- Preview fallback 不得写入正式 local published store，不得生成或推进 `publish_version`，不得触发 webhook，也不得被解释为正式 published data。
- Preview fallback 只适用于 preview route，不得影响正常公开页面读取旧 published data 的行为。

主要错误：

- `TOKEN_EXPIRED`
- `TOKEN_INVALID`
- `TOKEN_RESOURCE_MISMATCH`
- `DRAFT_NOT_FOUND`
- `SITE_DISABLED`
- `CREDENTIAL_REVOKED`

## 3. Runtime Status Endpoint

Runtime status 有两个方向：

1. OES 查询 Site Runtime 受保护 endpoint：`GET /api/oes/runtime-status`
2. Site Runtime 在同步后通过 `ReportSyncResult` 上报同步结果

P1 必须实现受保护 runtime-status endpoint；`ReportSyncResult` 用于同步结果回传，不替代 runtime-status endpoint。

## 4. Runtime Status Shape

最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `site_id` | 是 | 站点标识。 |
| `status` | 是 | `healthy / degraded / blocked / failed / unknown`。 |
| `local_publish_version` | 是 | Site Runtime 本地版本。 |
| `last_known_remote_publish_version` | 否 | runtime 最近看到的 OES 版本。 |
| `last_successful_sync_at` | 否 | 最近成功同步时间。 |
| `last_sync_status` | 否 | `idle / running / completed / failed / blocked`。 |
| `last_error_code` | 否 | 最近错误码。 |
| `last_error_message` | 否 | 可读错误摘要，不含 secret。 |
| `store_ready` | 是 | Local Published Store 是否可用。 |
| `sync_in_progress` | 是 | 是否正在同步。 |
| `pending_sync` | 是 | 同步中是否又收到新触发。 |
| `kit_version` | 是 | `@oes/site-runtime-kit` 版本。 |
| `reported_at` | 是 | 上报时间。 |

状态语义：

- `healthy`: store 可用，最近同步成功或无待同步。
- `degraded`: OES 暂不可用、最近同步失败或本地版本落后但仍可服务旧数据。
- `blocked`: site disabled、credential revoked、scope insufficient 等阻断问题。
- `failed`: Local Published Store 不可用或 runtime 无法接流量。
- `unknown`: OES 最近没有收到状态。

## 5. Health Endpoints

Site Runtime 本地 health endpoint 与 runtime status 不同：

- `/health/live`: 只表达进程存活。
- `/health/ready`: 只表达是否适合接公网流量。
- `/api/oes/runtime-status`: 给 OES 管理面使用，必须受保护。

`live / ready` 不得暴露 credential、secret、详细 sync errors 或内部路径。
