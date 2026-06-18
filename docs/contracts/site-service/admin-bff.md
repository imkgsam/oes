# site-service Admin BFF Contract

> 本文描述 OES Admin Site Management P1 所需的最小 BFF 契约。实际 HTTP 入口由 `api-gateway` Admin BFF 承载；服务职责以 [site-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/site-service.md) 为准。

## 1. 通用约束

所有 Admin BFF 接口要求：

- authenticated operator context
- tenant context
- permission context
- trace context
- audit context for commands

Admin BFF 不直接暴露 `site-service` 内部数据库结构。

## 2. Site Workspace

### `ListSiteCards`

作用：渲染 Site Management 卡片工作台。

响应卡片最小 shape：

| 字段 | 说明 |
| --- | --- |
| `site_id` | 站点标识。 |
| `site_name` | 站点名称。 |
| `site_type` | `brand / b2b / b2c / dealer / regional`。 |
| `primary_domain` | 主域名。 |
| `brand_id` | 品牌。 |
| `region_code` | 区域。 |
| `channel_code` | 渠道。 |
| `status` | `draft / active / disabled`。 |
| `active_locales[]` | 当前公开语言。 |
| `preparing_locales[]` | 准备中语言。 |
| `runtime_status` | `healthy / degraded / blocked / failed / unknown`。 |
| `pending_sync_count` | 待同步数量。 |
| `latest_publish_version` | OES 最新版本。 |
| `runtime_publish_version` | Site Runtime 本地版本。 |
| `last_sync_at` | 最近同步时间。 |
| `last_error_summary` | 最近错误摘要。 |

## 3. Site Settings

P1 commands：

- `CreateSite`
- `UpdateSiteSettings`
- `DisableSite`

`CreateSite` 最小请求：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `site_name` | 是 | 站点名称。 |
| `site_type` | 是 | 站点类型。 |
| `brand_id` | 否 | 品牌。 |
| `region_code` | 否 | 区域。 |
| `channel_code` | 否 | 渠道。 |
| `default_locale` | 是 | 默认语言。 |
| `primary_domain` | 否 | 主域名，可后续补。 |
| `preview_base_url` | 否 | 预览 URL base。 |

语义：

- 新站点默认 `status = draft`。
- default locale 自动创建为 `active`。
- P1 不支持更换 default locale。

## 4. Locales

P1 commands：

- `AddPreparingLocale`
- `CheckLocaleCompleteness`
- `ActivateLocale`
- `DisableLocale`

规则：

- 新增语言先进入 `preparing`。
- `preparing` 不公开。
- `ActivateLocale` 前必须通过完整性检查。
- `ActivateLocale` 会生成该 locale 全量 pending sync。
- default locale 不允许 disable。

## 5. Products

P1 queries：

- `ListSiteProducts`
- `SearchProductMasterForAdd`
- `GetSiteProductPublication`

P1 commands：

- `AddProductsToSite`
- `UpdateSiteProductPublication`
- `UnpublishSiteProduct`
- `PreviewSiteProduct`

规则：

- `ListSiteProducts` 默认只返回已加入当前站点的产品发布清单。
- `SearchProductMasterForAdd` 才查询 Product Master。
- 保存产品站点展示配置只标记 pending sync。
- active 语言不完整时不能 sync。

## 6. Blog / News

P1 queries：

- `ListSiteContents`
- `GetSiteContent`

P1 commands：

- `CreateSiteContent`
- `UpdateSiteContentLocaleVersion`
- `UnpublishSiteContent`
- `PreviewSiteContent`

规则：

- `content_type = blog / news`。
- Blog / News 是 site-scoped。
- P1 不做 template、page builder、archive。
- 保存草稿不通知站点。

## 7. Sync

P1 queries：

- `GetPendingSyncSummary`
- `ListPendingSyncResources`
- `ListSyncHistory`
- `GetSyncDetail`

P1 commands：

- `SyncAllPendingChanges`
- `RetryLastSync`
- `ResendWebhook`

规则：

- 无变更不生成版本、不发 webhook。
- 同步前检查 active locale 完整性。
- 每个站点每次 sync batch 最多发一次 webhook。
- `RetryLastSync` 不得盲目创建重复 public views；应基于 sync batch 状态恢复。
- `ResendWebhook` 不生成新版本。

## 8. Credentials

P1 commands：

- `GenerateSiteCredential`
- `RotateSiteCredential`
- `RevokeSiteCredential`

响应规则：

- secret 明文只在生成 / rotate 时显示一次。
- 后续只显示 metadata。

metadata 最小 shape：

| 字段 | 说明 |
| --- | --- |
| `credential_id` | 凭证标识。 |
| `client_id` | client 标识。 |
| `status` | `active / rotating / revoked`。 |
| `scopes[]` | scope 列表。 |
| `created_at` | 创建时间。 |
| `last_used_at` | 最近使用时间。 |
| `revoked_at` | 吊销时间。 |

## 9. Audit

P1 query：

- `ListSiteAuditLogs`

最小筛选：

- operation type
- operator
- resource type
- time range
- result

最小 audit shape：

| 字段 | 说明 |
| --- | --- |
| `audit_id` | 审计标识。 |
| `site_id` | 站点。 |
| `operation` | 操作类型。 |
| `resource_type` | 资源类型。 |
| `resource_id` | 资源标识。 |
| `operator_id` | 操作者。 |
| `result` | `success / failed`。 |
| `reason` | 失败或说明摘要。 |
| `trace_id` | trace id。 |
| `occurred_at` | 发生时间。 |

