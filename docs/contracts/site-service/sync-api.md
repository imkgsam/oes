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
- 一次同步运行只能使用一个由 `GetLatestPublishState` 发现的正整数 target publishVersion；除 `GetLatestPublishState` 外，所有 delta、batch 与 snapshot 请求都必须显式携带该 target，服务端不得在缺失时推断 latest。
- Target 是 Site 统一发布版本，不是 FAQ、Blog、News 等资源的独立版本号，也不新增面向运营人员的历史版本或回滚功能。

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
- `latest_publish_version` 只代表 OES 已完整提交、可被 Runtime 读取的最新正式版本；进行中或回滚的 Sync 不得对外可见。
- Runtime 必须先读取该值，再把它固定为本轮明确 target。Webhook 携带的 publishVersion 只用于提示有新版本，不替代本查询。
- site disabled 时返回 `SITE_DISABLED`。

## 3. Changed Resources

### `ListChangedResources`

作用：Site Runtime 从本地版本同步到远端最新版本时，获取聚合 changed resource list。

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `from_publish_version` | 是 | Site Runtime 当前本地版本。 |
| `to_publish_version` | 是 | Runtime 通过 `GetLatestPublishState` 发现并固定的本轮 target。 |
| `resource_types[]` | 否 | 可选过滤；为空表示全部 P1 resource types。 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `site_id` | 当前站点。 |
| `from_publish_version` | 请求起点。 |
| `to_publish_version` | 本轮固定目标版本，必须与请求 target 一致。 |
| `requires_snapshot` | 是否要求改用 snapshot。 |
| `changed_resources[]` | 聚合变更资源。 |

`changed_resources[]` item：

| 字段 | 说明 |
| --- | --- |
| `resource_type` | `product / category / content / blog / news / article-category / faq / inspiration / inspiration-category`。 |
| `resource_id` | OES public view 资源标识。 |
| `locale` | 资源语言。 |
| `latest_publish_version` | 该资源最新版本。 |
| `change_type` | `create / update / unpublish / locale_activate / locale_disable`。 |

语义：

- Delta 是 `from localVersion to pinnedTargetVersion` 的聚合 changed resource list。
- 同一资源在版本区间内多次变化，只返回最终最新资源。
- changed resource list 不承载完整业务数据。
- OES 可在 delta 不可用、版本太旧、数据校验失败时返回 `requires_snapshot = true`。
- OES 在本轮读取期间提交了更高版本，也不得把高于 pinned target 的资源混入响应。Runtime 必须拒绝任何 target 不一致或版本漂移的结果，且不得推进本地 publish state。
- `article-category` 资源变化表示 `ArticleCategoryPublicView` 变化；它可以独立同步，不要求重发所有关联 Blog / News。
- Blog / News 的 Content Category 关联变化必须作为对应 `blog` / `news` 资源变化返回。
- `faq` 资源变化表示当前 site + locale 的 `FaqDirectoryPublicView` 变化；FAQ Category 与 Entry 的排序和内容变化聚合为该 directory view 变化。

### 3.1 Site Exposure Publication

站点页面与 locale 公开治理不作为带 slug 的业务 public view，而是作为独立的版本化 Site Exposure Publication 随同步通道传输。

语义：

- 页面能力发现状态不通过 publishVersion 自动公开；
- OES Admin 对 SitePage、站点 locale 与页面级 SEO 意图的已保存变更，只有在显式 Sync 后才进入 exposure publication；
- `ListChangedResources` 必须能够表达 exposure publication 在版本区间内发生变化；
- `BatchGetPublicViews` 与 `GetSnapshot` 必须返回与目标 publishVersion 一致的 exposure publication，且不能把它伪装成要求 slug 的 public view envelope；
- Runtime 只有在 exposure publication 与受影响业务 public views 一起原子提交后，才能推进本地 publish state；
- capability drift、静态页面 locale 能力不完整或其他 Sync preflight 失败时，不生成 exposure publication、不推进 publishVersion、不发送 webhook。

## 4. Batch Public Views

### `BatchGetPublicViews`

作用：Site Runtime 按 changed resource list 批量拉取本轮固定 target 的 public views。

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `target_publish_version` | 是 | 本轮固定 target；必须与取得 `resources[]` 的 delta target 一致。 |
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
| `server_publish_version` | 本响应实际服务的版本；必须等于请求 `target_publish_version`，不表示响应时变化中的 latest。 |
| `exposure_publication` | 同一 target 的 Site Exposure Publication。 |

语义：

- `public_views[]` 使用 [public-views.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/site-service/public-views.md) 定义的 resource envelope；`faq` 使用其中定义的页面级 `FaqDirectoryPublicView` 例外 shape。
- 同一轮所有 public views、`server_publish_version` 与 Site Exposure Publication 必须属于 Runtime 已固定的同一 target；不能因为 OES 又提交了更新版本而返回混合版本。
- 请求内每个资源都按该 target 的站点公开状态求值；不得读取资源当前 latest 后仅把响应版本号标记为 target。
- 下架 / 删除 / 禁用语言必须通过 `status` 返回，不应只返回 missing。
- missing 表示该资源对当前 site 不存在或不可见；runtime 应记录 sync warning。
- Runtime 不能忽略本地已存在但本次返回 missing 的资源；对于已撤下、删除或 locale 不再公开的资源，必须在同一同步事务中将本地状态收敛为不可公开，不能继续保留旧的 published 行为。
- 同步写入必须同时更新 canonical 与 historical slug alias index；资源 unpublish、delete 或 locale disable 时，历史 aliases 一并失活，不能继续把请求重定向到不可公开资源。
- Runtime 可以保存 `article-category` public view，但公开 Content Category 导航、archive 和 sitemap 必须由 published Blog / News 引用反向驱动，不能直接展示全部 article-category views。
- Runtime 可以保存 `faq` directory public view，但 FAQ 页面只使用当前 locale 的 published directory view，不从 OES request-time 查询，也不从静态 Storefront fixture 回退。

## 5. Snapshot

### `GetSnapshot`

作用：Site Runtime 首次初始化或 delta 不可用时拉取站点完整 public snapshot。

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `target_publish_version` | 是 | 本轮固定 target；首面与后续每一页都必须重复携带相同值。 |
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
| `exposure_publication` | 同一 target 的 Site Exposure Publication。 |

语义：

- snapshot 必须是同一 `snapshot_publish_version` 下的一致视图。
- `snapshot_publish_version` 必须等于请求 `target_publish_version`；`page_token` 只表达该 target 内的分页位置，不能替代 target，也不能把请求切换到另一个版本。
- Snapshot 多页读取必须固定在一个 target；后续页不能漂移到更新版本。Runtime 发现目标与预期不一致时必须丢弃整轮临时结果，不得部分提交。
- snapshot 必须包含同一版本的 Site Exposure Publication；静态页面治理虽然不属于内容 public view，但其公开状态必须随 snapshot 一致提交。
- runtime 只有完整拉取并写入成功后才能推进本地 publish state。
- P1 支持 snapshot rebuild，不要求完整 rollback API。
- snapshot 包含 `article-category` public views 时，Runtime 仍必须按 published Blog / News 引用过滤公开 Content Category 可见性。
- snapshot 包含 `faq` public view 时，Runtime 必须将当前 locale 的完整 FAQ directory 与目标 publishVersion 原子提交；缺失目标 locale view 时不得使用其他语言或静态 fixture 补齐。

## 5.1 Concurrent Publication Catch-up

当 Runtime 正在同步 pinned target 时收到更高 publishVersion 对应的新 webhook：

- 新事件必须验签、去重并合并为 pending sync trigger，不并行写本地 published store；
- 当前 target 成功原子提交后，Runtime 立即重新调用 `GetLatestPublishState`，发现更高版本后继续下一轮；
- 若当前 target 因版本漂移、网络或校验失败而无法完成，Runtime 保留上一个完整本地版本，并在 pending trigger、pull fallback 或 startup recovery 中重新发现 latest；
- Runtime 不要求操作者再次点击 OES Sync，也不要求人工触发 Runtime Sync。

OES 对每个确有变化且已正式提交的 publishVersion 发送独立 webhook；无变更的 Sync 不生成版本，也不发送 webhook。Webhook 发送只能发生在正式提交之后，通知失败不得把未提交数据暴露为 latest。

## 5.2 Target Validation And Availability

Site Service 对 `ListChangedResources.to_publish_version`、`BatchGetPublicViews.target_publish_version` 与 `GetSnapshot.target_publish_version` 使用同一验证语义：

| 情况 | 服务端行为 | Runtime 行为 |
| --- | --- | --- |
| target 缺失、为 0 或格式非法 | `SYNC_TARGET_REQUIRED` | 记录协议错误，不提交本地状态；不得用 latest 重试同一请求。 |
| target 高于当前 latest committed version | `SYNC_TARGET_NOT_COMMITTED` | 放弃本轮并重新调用 `GetLatestPublishState`。 |
| target 已提交且仍可读取 | 严格返回该 target 的资源、版本号与 exposure | 完成整轮校验后原子提交。 |
| target 已超出保留范围或版本化公开输出不完整 | `SYNC_TARGET_UNAVAILABLE` | 丢弃整轮临时结果、保留旧本地版本，重新发现 latest 并优先使用 snapshot 重建。 |
| 请求链或响应中出现不同 target | `SYNC_TARGET_MISMATCH` 或 Runtime 本地等价校验错误 | 整轮失败，禁止部分提交或推进 publish state。 |

附加规则：

- 已提交但较旧的 target 只要仍在可读范围内就不是错误，必须按该版本诚实返回。
- 发布 N+1 本身不得让仍在正常同步窗口内的 N 变为不可读；保留清理与版本发布必须是不同的受控动作。
- 错误响应不得夹带 latest 的 public views 作为 fallback。
- P1 不引入 server-issued sync session 或 snapshot token；显式 target 是唯一的跨请求版本关联依据。

## 5.3 Contract Compatibility And Rollout

`target_publish_version` 是 shared proto 与 Site-facing HTTP body 的新增字段。稳定态一律必填；升级必须按以下顺序协调，不能把 backend-only fallback 当作完成：

Shared proto wire mapping 冻结为：

- `BatchGetPublicViewsRequest.target_publish_version = 3`，HTTP JSON 使用 `target_publish_version`，Gateway 同时只在协议迁移层接受 camelCase `targetPublishVersion`。
- `GetSnapshotRequest.target_publish_version = 6`，HTTP JSON 使用 `target_publish_version`，Gateway 同时只在协议迁移层接受 camelCase `targetPublishVersion`。
- 两个字段在 proto3 wire format 中是 additive，但 application validation 将 `0` 与缺失统一视为 `SYNC_TARGET_REQUIRED`；不能利用 proto default 0 恢复 latest-at-read 语义。

1. 先发布新增字段的 shared proto / generated bindings，并让 API Gateway 与 Site Service 能够接收、透传和校验 target；迁移窗口内可由受控 compatibility gate 暂时接受旧 Runtime，但不得声称旧请求具备 pinned-target 保证。
2. 再发布 Runtime Kit producer，使 delta 使用既有 `to_publish_version`，每个 batch 与每个 snapshot page 都发送同一个 `target_publish_version`。
3. 所有受管 Runtime 升级并验证后，关闭 compatibility gate；缺失 target 必须稳定返回 `SYNC_TARGET_REQUIRED`。
4. 最后恢复依赖该不变量的 FAQ backend 与其他资源实现，并执行跨版本并发验收。

协议兼容依赖字段的 additive 演进，不复用普通 body `site_id`，也不改变 signed credential 的站点身份来源。

## 5.4 Focused Acceptance

至少覆盖以下协议级验收：

1. Runtime 查询 latest 得到 N，并在 delta、多个 batch 与 snapshot 多页请求中持续发送 N。
2. 第一批或第一页返回后，OES 正式提交 N+1；余下 N 请求仍只能返回 N 的 public views、response version 与 Site Exposure Publication。
3. Runtime 原子提交本地 N 后重新查询 latest，自动发现并追赶 N+1，不需要操作者再次 Sync。
4. 任一 batch、snapshot page、public view 或 exposure 返回非 N 时，Runtime 丢弃整轮临时结果，本地版本与公开读取仍停留在上一个完整版本。
5. Batch 或 snapshot 缺失 target 时，Gateway / Site Service 返回 `SYNC_TARGET_REQUIRED`，不得查询或返回 latest 数据。
6. Target 高于 latest、超出保留范围、输出不完整以及 page token 与 target 不匹配时，分别命中冻结错误语义，不得 silent fallback。
7. `FaqDirectoryPublicView` 与同轮其他资源共享 N；FAQ 不生成独立版本号、历史版本管理或回滚入口。

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
