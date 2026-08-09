# Site Media Asset Contract

```text
contractStatus: FROZEN_ASSET_MEDIA_CONTRACT
sharedWireContractStatus: FROZEN
implementationPrerequisites:
  - Global Command must align generated gRPC metadata consumption with the frozen trusted-context contract.
  - Global Command must assign a cross-service outbox/Event Bus delivery capability for availability facts.
  - P1 production-complete takedown requires the frozen oes-managed-cloudflare delivery/purge adapter and a REMOTE_ACTIVE SiteMediaDeliveryBinding.
serviceTruthSource: docs/architecture/services/asset-service.md
collaborationTruthSource: docs/architecture/collaborations/site-asset-media.md
consumerReferences:
  - docs/architecture/services/site-service.md
  - docs/contracts/site-service/admin-bff.md
  - docs/contracts/site-service/public-views.md
  - docs/contracts/site-service/sync-api.md
```

## 1. Scope

本文定义 `asset-service` 向 Site consumer 提供的受控图片 / 视频能力。它用于当前 Inspiration 图片与 Category 可选 SEO / OG 图片，并为未来另行冻结的 Site 静态页面媒体 consumer 提供同一受控边界。

`asset-service` 的长期职责、Asset 对象与生命周期真相以 [asset-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/asset-service.md) 为准。本文定义调用方可依赖的黑盒行为，并由第 8 节拥有和冻结 `SiteMediaAssetService` 11 个 RPC 的 wire 字段与 proto field numbers；proto 实现必须逐项遵循并按兼容性规则 reserve，不得自行重编号。本文不定义数据库 schema 或 provider credential。P1 provider 选择、域名配置与 portability decision 以 [ADR 0012](/Users/acehood/Documents/GitHub/oes/docs/adr/0012-site-media-delivery-and-purge.md) 为准。

当前 Inspiration P1 只消费图片。视频是 Site Media 能力的一部分，但不因此扩展 Inspiration Item 为视频、多媒体相册或页面构建器。

## 2. Ownership And Non-goals

`asset-service` owns:

- Asset 二进制、稳定 `assetId`、存储映射、校验和技术元数据。
- public delivery URL、对象存储 origin、CDN delivery、按 Site 的 delivery binding / 单向迁移、归档、下架 / 隔离与物理删除生命周期。
- tenant / scope 与 Site 使用资格的服务端校验。
- 已知 consumer publication reference 的保护与释放记录。

Site consumer owns:

- Site、Inspiration Item / Category、SEO 文案、locale usage alt、Category membership、rank、Hotspot、publication、sync 与 Site audit。
- 哪个 Item 或 Category 引用了 `assetId`，以及何时一个 Site publication 可以释放引用保护。

明确不属于本契约：

- 任意 URL import、对象存储 key 输入、前端直连对象存储，或由业务服务伪造媒体技术事实。
- page builder、裁切、滤镜、绘图、转码、多码率、HLS / DASH、封面图提取或复杂媒体变体。
- Asset 默认 alt 覆盖 Site 的 locale alt；Asset 默认 alt 如未来存在，只能作编辑辅助。
- 全域 DAM taxonomy、跨业务媒体语义检索，以及 IM、邮件、质检等来源对象的可见性真相。

## 3. Access And Isolation

- 外部客户端只经 `api-gateway` / 适用 BFF 进入；`asset-service` 只接收可信内部调用。
- 每条调用链必须传递 verified tenant、operator context、permission context、trace context 与命令审计元数据。
- Site Management P1 是 tenant-bound；SYSTEM session 不得因知道 Asset ID 而绕过 Site Media tenant 校验。
- Asset Service 必须对每次上传、列表、选择、解析、归档、下架和删除在服务端验证 Asset scope、tenant、状态与操作资格。前端过滤、按钮隐藏或调用方重复传入的 tenant 值不是授权依据。
- 同一 tenant 的获授权 Site 可以复用同一 Site Media；但列表只返回当前调用方获授权使用的 Asset，不构成“同 tenant 的所有 IM、邮件、质检或生产媒体默认对 Site 可见”的承诺。

## 4. Media Validation Baseline

| Media kind | P1 accepted binary                                   | Required server-side validation                                     | Required technical facts                                               |
| ---------- | ---------------------------------------------------- | ------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Image      | JPEG、PNG、WebP                                      | 文件头与完整图片解码；拒绝声明 MIME、扩展名与实际二进制不一致的输入 | authoritative width、height、actual media type                         |
| Video      | browser-direct-playback MP4，H.264 video + AAC audio | 容器与编码解析；拒绝不能按该基线交付的输入                          | authoritative width、height、duration、actual media type / codec facts |

- 文件大小、视频时长、像素尺寸与其他容量上限由 Asset 的可配置治理策略决定；它们必须在服务端执行，但不由 Site 页面 contract 写死。
- 不做转码或兼容性兜底。调用方选择的视频必须已经满足该播放基线。
- Site Inspiration 的 publish validation 必须要求 image kind；视频不可绑定为 Inspiration Item 主图或 SEO / OG 图片。

## 5. Operations

### 5.1 UploadSiteMedia

Purpose: 为当前 verified tenant 创建一个受控 Site Media candidate。

Callers: Site Management BFF 或未来已冻结的 Site consumer BFF。

Input semantics:

- verified tenant and operator context；调用方不得自定义或伪造 target tenant。
- `site_id`，用于将 candidate 放入目标 Site 的 local / remote delivery binding；调用方不得把另一个 tenant 的 Site 当作 target。
- requested Site Media kind；必须满足第 4 节的受控类型与容量策略。
- 二进制文件及其用于审计的原始文件名 / 声明 content type；二者都不是技术真相。
- trace and audit metadata。

Behavior:

- Asset Service 自行流式接收、校验并写入受控对象存储；BFF 与浏览器不直接拥有对象存储写凭据或 storage key。
- 成功上传不等于某个 Site 内容已发布或已绑定。
- 返回候选 Asset 的稳定身份、用于授权预览 / 选择的 public-safe summary 与真实技术事实。不得返回 origin credential、storage key 或云厂商内部信息。

### 5.2 ListAuthorizedSiteMedia

Purpose: 让 Site Admin 的受控 Asset Library 按当前 verified context 浏览、搜索与选择 Site 可用媒体。

Behavior:

- 仅返回当前 tenant、当前 operator 有权使用、且处于可选择状态的 Site Media；请求必须指定 target `site_id`，结果中的预览 URL 对应该 Site 当前 binding。
- 支持由 Asset 自己拥有的基础过滤 / 排序，例如媒体种类、可用状态、创建时间；不把未来全域语义检索或其他业务域的权限真相提前写入此契约。
- 每项至少提供稳定 Asset identity、媒体种类、可供安全预览的 delivery summary、原始宽高、视频时长（适用时）与可用性。调用方不得从列表结果推断或读取对象存储 key。

### 5.3 ResolveSiteMediaForPublication

Purpose: Site Service 在发布前，以已验证 tenant、`siteId` 和 Site 使用场景解析一个 `assetId` 是否可进入公开输出。

Required outcome:

- stable asset identity；
- tenant / scope eligibility；
- lifecycle and availability outcome；
- public-safe, long-lived CDN delivery URL or an equivalent delivery reference that Site 可以冻结到 public view；
- authoritative dimensions of the delivered binary；
- actual media kind and validation outcome；视频额外提供时长与已验证编码事实。

Behavior:

- 对 Inspiration Item 主图和 Category SEO / OG image，调用方必须请求 image kind；Asset 不得把视频或不可用媒体伪装为图片成功返回。
- 只有目标 Site 的 binding 已处于 `REMOTE_ACTIVE`，resolver 才可以返回可写入正式 public view 的 URL。`LOCAL_ONLY`、`REMOTE_CONFIGURING`、`REMOTE_READY` 与 `MIGRATING` 必须以 `ASSET_PUBLIC_DELIVERY_UNAVAILABLE` 拒绝正式发布。
- resolve 失败必须显式表达 reason；不得返回任意 placeholder URL、其他 Asset URL 或从文件名猜测的尺寸。
- 返回的 URL 对应不可静默替换的二进制。更换二进制必须创建或选择新的 Asset identity，再由 Site 修改引用并发布新版本。

### 5.4 ProtectPublicationReference And ReleasePublicationReference

Purpose: 在 Site 已知 publication 仍可能被 Runtime 或 Storefront 读取时，保护其引用的 Asset 不被普通物理删除。

Behavior:

- Site 必须在包含该 Asset 的 public view 被正式提交前建立对应保护；保护覆盖当前 publication、Runtime last-complete 与 Site 支持保留窗口内仍可 target-addressable 的历史 publication。
- Site 只有在不再承诺相关 publication 可读取后才能显式释放保护。Asset 不根据 CDN 访问日志猜测引用是否仍存在。
- 对仍有保护的 Asset，普通 physical delete 必须拒绝；修改草稿或最新引用不会自动释放仍被旧完整 publication 使用的 Asset。
- 保护机制的内部记录形态、幂等键、outbox、重试与跨服务失败恢复由实现阶段在稳定契约下决定；不得以此为由绕过“先保护再公开、后释放再清理”的不变量。

### 5.5 ArchiveSiteMedia

Purpose: 停止 Asset 被新 Site 内容选择，同时保持现有公开 delivery 可用。

Behavior:

- archived Asset 不出现在默认可选择库中，也不得绑定到新的 Site 内容。
- 归档不是下架，不撤销已公开 CDN URL，不破坏被保护的 Site publication。

### 5.6 TakeDownSiteMedia

Purpose: 因侵权、敏感内容、恶意文件或安全事件停止单个 Asset 的公开交付。

Behavior:

- 这是高权限、强审计的 Asset lifecycle command；必须记录原因、操作者、trace 与可追踪的 delivery-purge result。
- Asset Service 必须阻断 origin delivery，并请求 CDN 对该 Asset 的精确 URL / tag 执行 purge。CDN provider 已确认 purge 后，才可报告公开交付下架完成。
- takedown operation、每个 Site delivery mapping 的 origin-block / purge attempt、provider acknowledgement、provider request identifier（如有）、重试次数、时间戳与 trace 必须持久化审计；credential、storage key 与 provider secret 不得进入 audit payload。
- 同一幂等键重试返回同一 operation。origin 已阻断但任一 purge timeout / failure 时状态保持 `PURGE_PENDING`，由持久化、退避重试继续处理并触发告警；不得因为部分 mapping 已确认而发布 `UNAVAILABLE`。
- CDN cache 收敛时间取决于 provider；已经下载到用户设备或第三方缓存的副本无法由 Asset 收回。
- 下架不是替换。Asset 不得返回虚假 placeholder 作为原媒体，也不自动为 Site 改写内容。

### 5.7 DeleteSiteMedia

Purpose: 物理移除 Asset binary 与受控 storage mapping。

Behavior:

- 不对已公开 Site Media 做自动 physical delete。
- ordinary delete 必须先检查并拒绝仍存在的 publication protection；操作方需要先解除已知业务引用，或在合规 / 安全紧急流程中执行受控强制下架。
- 对可能被非 OES 管理的静态页面直接使用的 CDN URL，Asset 无法自动识别使用关系；physical delete 必须明确提示潜在外部 404 风险，并保留高权限审计记录。
- physical delete 应只在 Asset 已满足下架、留存与保护释放策略后发生；具体存储 erasure / backup retention 由基础设施政策决定。

### 5.8 Prepare And ActivateSiteMediaRemoteDelivery

Purpose: 将一个 Site 从仅本地媒体开发迁移到可正式公网交付的远端媒体 binding。它不是 DNS provider 自助配置接口。

Input semantics:

- `site_id`、`media_host` 与 command idempotency key；`media_host` 必须属于已验证 Site 的公开域名策略。
- Site Management BFF 只提交远端意图，不提交 R2 endpoint、bucket、DNS provider、access key、CDN token 或任意自定义 purge URL。

Behavior:

- `Prepare` 使 Asset 验证 P1 `oes-managed-cloudflare` profile 的 DNS、TLS、R2 origin isolation 与精确 URL purge；成功后记录 `REMOTE_READY`，失败保持非远端激活状态并返回稳定失败原因。
- `Activate` 只允许从 `REMOTE_READY` 发起。Asset 把目标 Site 尚未正式公开的 local Site Media 复制到 R2、验证 checksum、建立 immutable delivery mapping 后才记录 `REMOTE_ACTIVE`。
- `REMOTE_ACTIVE` 不允许回退为 local。公开 publication 的 URL 不能改写为 localhost、裸 object storage URL 或另一媒体 host。
- 远端站点可以早于完整 OES 部署上线，但发出 `Activate` 前 Asset metadata 与 operation / audit state 必须位于持久化 control plane，而不能仅存在开发者本机。

## 6. Delivery And Public URL Semantics

- 二进制真相存放在 Asset 管理的对象存储 origin；CDN 负责缓存和边缘 delivery。OES 不在应用数据库中保存第二份文件二进制作为“备份”。
- P1 远端 public delivery URL 固定为 `https://media.<site-domain>/v1/site-media/<assetId>/<checksum>.<extension>`，由 OES 管理的 Cloudflare edge delivery mapping + CDN 交付。它不能裸露 object storage endpoint、key 或 credential；edge mapping 将该 path 映射到 private R2 origin key，且不能在公开请求时调用 Asset Service。
- URL 必须兼容 Runtime 本地 published data 与离线 OES operation：正常公开请求不需要短时 URL refresh，也不 request-time 调 Asset Service。
- 更换媒体不覆盖同一 Asset delivery 的二进制；Site 通过新 Asset identity 生成新 public view。历史 Site public output 因而可保持可重放的媒体尺寸与 URL 语义。
- 静态页面可以在构建产物中直接使用 delivery URL；这不表示 Asset 管理页面设计、源码或部署。
- cache key 只能由 delivery URL 的 host + path 构成；query、cookie、authorization、设备或地域不得令同一 immutable Asset 产生另一个 cache entry。远端响应使用 `Cache-Control: public, max-age=31536000, immutable`、正确 `Content-Type` 与 `X-Content-Type-Options: nosniff`。P1 远端单文件上限为 `512 MiB`。
- Asset 可在保持相同 public host、path 与 checksum 的前提下迁移底层 R2 / CDN provider；这属于基础设施迁移，不能改变已冻结 Site public view 的 URL。改变 public host 时必须保留旧 URL 或发布新的 Site version，不能静默断开历史 output。
- Asset 必须输出按 provider profile、Site binding 与 operation 分类的 storage write / delete、delivery resolve、purge request / acknowledgement / retry / failure、confirmation latency 与未完成 takedown 指标；P1 不实现租户级 provider billing，但 Platform 必须据此观察 R2 storage / operation 与 CDN purge 成本。

## 7. Availability Facts And Consumer Reaction

Asset Service 对已知 consumer 发布可消费的生命周期事实，包括至少：公开可用性已变化、下架 / 隔离完成、删除完成或解析不再成立。

- Site 在新 publication 的 completeness check 中发现 resolve 不可用时，必须拒绝该资源进入新公开版本。
- 已发布 Asset 因受控下架 / 隔离变为不可用时，Site 必须将受影响资源标记为待处理或 degraded，阻止其以该 Asset 进入后续新版本；是否替换图片或取消发布由 Site operator 明确决定。
- Asset 的正常 archive / cleanup 不得破坏受保护的 Site publication；合规或安全强制下架是有意撤销 delivery 的例外。

事件 topic / payload 以 [asset-service Event Contract](/Users/acehood/Documents/GitHub/oes/docs/contracts/events/asset-service.md) 为准，gRPC service / method / field number 以本契约第 8 节为准。实现不得私自从现有 avatar proto 复用、重编号或猜测字段。

## 8. Shared gRPC And Event Wire Contract

本节冻结 Site Media 的 shared wire semantics。实现时必须新增 `asset_service.SiteMediaAssetService`，不得把 Site Media 字段塞入既有头像 RPC 的 request / response，也不得复用 `ResolveAssetPublicUrl` 作为 Site publication resolver。

### 8.1 Transport Context

- 每次调用必须同时通过当前 channel 的 mTLS `VerifiedWorkloadIdentity` 与 `authorization: Bearer <ExecutionToken>` 建立可信上下文。Token 必须由 Auth / STS 签发、`aud=asset-service`、以 `cnf` 绑定当前 workload，并携带 verified tenant / execution principal 与本 RPC 所需 Permission Code。
- `request-id`、`traceparent`、`tracestate` 与安全审计关联字段通过统一 [gRPC metadata architecture](/Users/acehood/Documents/GitHub/oes/docs/architecture/14-grpc-metadata-and-service-trust-architecture.md) 传播。Site Media request body 不声明 tenant、operator、scopeLevel、permission、service name 或签名 operator payload。
- Admin-facing upload、list、archive、takedown、delete、delivery management RPC 使用 `BUSINESS` mode 与对应 `asset.site_media.*` Code。Site Service 发起的 resolve / publication protect / release 使用 `INTERNAL` mode 与精确 `asset.internal.site_media.*` Code。
- Site 调 Asset 前必须向 STS exchange `aud=asset-service` 的下一跳 Token；不能原样转发 `aud=site-service` Token，也不能由 Site 自行签名。
- 合法 `site_id`、`asset_id` 与 operation id 是业务目标，不是身份来源。Asset 加载自身归属事实，并把目标 tenant 与 Token tenant 比较；SYSTEM principal 不具有隐式 tenant wildcard。
- 所有 command 都必须带 `idempotency_key`；Asset 以 verified tenant、execution principal、direct workload、operation 与该 key 作为幂等范围。
- 分页 token、operation id、Asset id 与 Site id 均为 opaque stable identifier；调用方不得从格式推断 storage key、tenant 或业务对象信息。

#### Repository Implementation Prerequisite

截至本次 Site Recovery 冻结，shared proto explicit-metadata generation、Gateway verified source-credential lifecycle、MACHINE/workload verifier、trusted carrier 与既有 Asset 五 RPC cutover 已集成。仍待实现的是 Site 59+7 RPC cutover、`SiteMediaAssetService`、对应 Permission registration、Site multi-hop caller、Asset outbox、Site inbox 与 Cloudflare precise purge。实现必须按 [trusted-grpc-execution-context.md](/Users/acehood/Documents/GitHub/oes/docs/plans/features/trusted-grpc-execution-context.md) 的关闭式 lease 推进；Asset / Site 不保留 body identity、legacy signed-operator 或 ordinary metadata fallback。

### 8.2 `SiteMediaAssetService` Operations

The frozen wire owner is the new proto `src/common/src/contracts/asset_service/site_media.proto`, with package `asset_service` and service `SiteMediaAssetService`. Generated output under `src/common/src/generated/` is ignored build output and is never a writer-owned tracked path.

Shared messages use these exact fields and numbers:

```text
UploadSiteMediaStart
  1 idempotency_key:string
  2 site_id:string
  3 requested_media_kind:string
  4 original_file_name:string
  5 declared_content_type:string

UploadSiteMediaChunk
  oneof payload
    1 start:UploadSiteMediaStart
    2 content_chunk:bytes

SiteMediaAssetSummary
  1 asset_id:string
  2 media_kind:string
  3 lifecycle_status:string
  4 delivery_status:string
  5 preview_url:string
  6 width:uint32
  7 height:uint32
  8 duration_ms:uint64
  9 created_at:string
  10 availability_version:uint64

ResolvedSiteMedia
  1 asset_id:string
  2 media_kind:string
  3 lifecycle_status:string
  4 delivery_status:string
  5 public_url:string
  6 width:uint32
  7 height:uint32
  8 duration_ms:uint64
  9 codec:string
  10 availability_version:uint64
```

Each RPC request and response uses these exact field numbers:

| RPC | Request fields | Response fields |
| --- | --- | --- |
| `UploadSiteMedia(stream UploadSiteMediaChunk)` | stream message above | `asset=1` |
| `ListAuthorizedSiteMedia` | `site_id=1`, `query=2`, `media_kind_filter=3`, `include_archived=4`, `page_size=5`, `page_token=6` | `assets=1`, `next_page_token=2` |
| `ResolveSiteMediaForPublication` | `site_id=1`, `asset_id=2`, `required_media_kind=3` | `resolved=1` |
| `PrepareSiteMediaRemoteDelivery` | `idempotency_key=1`, `site_id=2`, `media_host=3` | `delivery_binding_status=1`, `validation_operation_id=2` |
| `ActivateSiteMediaRemoteDelivery` | `idempotency_key=1`, `site_id=2` | `delivery_binding_status=1`, `migration_operation_id=2` |
| `ProtectSitePublicationReferences` | `idempotency_key=1`, `site_id=2`, `publish_version:uint64=3`, `asset_ids=4` | `protected_asset_ids=1`, `protection_status=2` |
| `ReleaseSitePublicationReferences` | `idempotency_key=1`, `site_id=2`, `publish_version:uint64=3` | `released_asset_ids=1`, `release_status=2` |
| `ArchiveSiteMedia` | `idempotency_key=1`, `asset_id=2` | `asset=1` |
| `TakeDownSiteMedia` | `idempotency_key=1`, `asset_id=2`, `reason_code=3`, `reason_note=4` | `operation_id=1`, `delivery_status=2` |
| `GetSiteMediaDeliveryStatus` | `asset_id=1` | `asset_id=1`, `lifecycle_status=2`, `delivery_status=3`, `availability_version:uint64=4`, `last_operation_id=5` |
| `DeleteSiteMedia` | `idempotency_key=1`, `asset_id=2`, `deletion_reason=3` | `operation_id=1`, `deletion_status=2` |

| RPC                                            | Request body                                                                                                                                                | Response body                                                                              | Stable behavior                                                                                                        |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| `UploadSiteMedia(stream UploadSiteMediaChunk)` | 第一帧 `UploadSiteMediaStart { idempotency_key, site_id, requested_media_kind, original_file_name, declared_content_type }`；后续帧为 `content_chunk` bytes | `SiteMediaAssetSummary asset`                                                              | client-streaming upload；Asset 流式校验和写入目标 Site binding 的 origin，不向 Browser / BFF 发放 storage credential。 |
| `ListAuthorizedSiteMedia`                      | `{ site_id, query, media_kind_filter, include_archived, page_size, page_token }`                                                                            | `{ assets[], next_page_token }`                                                            | 仅返回当前 verified context 且目标 Site 可查看 / 选择的 Site Media；`query` 只保证基础文本检索，不承诺全域语义搜索。   |
| `ResolveSiteMediaForPublication`               | `{ site_id, asset_id, required_media_kind }`                                                                                                                | `ResolvedSiteMedia`                                                                        | 检查 tenant / scope / Site delivery binding / availability / media kind，并返回可冻结的 delivery facts。               |
| `PrepareSiteMediaRemoteDelivery`               | `{ idempotency_key, site_id, media_host }`                                                                                                                  | `{ delivery_binding_status, validation_operation_id }`                                     | 验证远端 managed provider、DNS、TLS、origin isolation 与 precise purge；不接受 provider secret。                       |
| `ActivateSiteMediaRemoteDelivery`              | `{ idempotency_key, site_id }`                                                                                                                              | `{ delivery_binding_status, migration_operation_id }`                                      | 将 `REMOTE_READY` Site 的未公开本地媒体迁移并一次性激活远端；不可回退到 local。                                        |
| `ProtectSitePublicationReferences`             | `{ idempotency_key, site_id, publish_version, asset_ids[] }`                                                                                                | `{ protected_asset_ids[], protection_status }`                                             | 在 Site 提交该 target publication 前建立 protection；重复请求保持幂等。                                                |
| `ReleaseSitePublicationReferences`             | `{ idempotency_key, site_id, publish_version }`                                                                                                             | `{ released_asset_ids[], release_status }`                                                 | 仅在 Site 不再承诺该 target 可读取后释放整组 protection。                                                              |
| `ArchiveSiteMedia`                             | `{ idempotency_key, asset_id }`                                                                                                                             | `SiteMediaAssetSummary asset`                                                              | 停止新选择，不撤销 existing delivery。                                                                                 |
| `TakeDownSiteMedia`                            | `{ idempotency_key, asset_id, reason_code, reason_note }`                                                                                                   | `{ operation_id, delivery_status }`                                                        | 阻断 origin 并启动精确 CDN purge；`delivery_status` 可以为 pending，完成由状态查询 / lifecycle event 表达。            |
| `GetSiteMediaDeliveryStatus`                   | `{ asset_id }`                                                                                                                                              | `{ asset_id, lifecycle_status, delivery_status, availability_version, last_operation_id }` | 提供下架、purge 与公开交付的可读状态；不泄漏 provider internals。                                                      |
| `DeleteSiteMedia`                              | `{ idempotency_key, asset_id, deletion_reason }`                                                                                                            | `{ operation_id, deletion_status }`                                                        | 检查 protection、留存与高权限治理；拒绝时返回稳定错误而不静默删除。                                                    |

固定 mode / Permission mapping：

- `UploadSiteMedia`：BUSINESS `asset.site_media.upload`。
- `ListAuthorizedSiteMedia`、`GetSiteMediaDeliveryStatus`：BUSINESS `asset.site_media.read`。
- `PrepareSiteMediaRemoteDelivery`、`ActivateSiteMediaRemoteDelivery`：BUSINESS `asset.site_media.delivery.manage`。
- `ArchiveSiteMedia`：BUSINESS `asset.site_media.archive`。
- `TakeDownSiteMedia`：BUSINESS `asset.site_media.takedown`。
- `DeleteSiteMedia`：BUSINESS `asset.site_media.delete`。
- `ResolveSiteMediaForPublication`：INTERNAL `asset.internal.site_media.resolve`。
- `ProtectSitePublicationReferences`：INTERNAL `asset.internal.site_media.publication.protect`。
- `ReleaseSitePublicationReferences`：INTERNAL `asset.internal.site_media.publication.release`。

INTERNAL 三个 publication primitive 只允许 Site workload 按 STS issuance policy 申请，不能加入 HUMAN / MACHINE 业务角色。它们不取代 Site `site.management.sync` 的 BUSINESS 授权。

`UploadSiteMediaChunk` 使用 proto `oneof`，只允许第一帧为 `start`、后续帧为 `content_chunk`；空 content、第二个 start 或超出受控上传限制必须拒绝。流实际大小、解析结果与 checksum 由 Asset 计算，不能信任调用方声明。

Upload 失败、取消或 client disconnect 不得留下 active Asset 或可选 delivery。幂等输入包含最终 Asset-calculated checksum：相同 key 与相同 canonical input 返回原结果，相同 key 与不同 input 返回 `ASSET_IDEMPOTENCY_CONFLICT`。

`SiteMediaAssetSummary` 最小字段：`asset_id`、`media_kind`、`lifecycle_status`、`delivery_status`、`preview_url`、`width`、`height`、`duration_ms`（视频适用）、`created_at`、`availability_version`。`preview_url` 必须仍是 public-safe delivery reference，不能是 storage URL。

`ResolvedSiteMedia` 最小字段：`asset_id`、`media_kind`、`lifecycle_status`、`delivery_status`、`public_url`、`width`、`height`、`duration_ms`（视频适用）、`codec`（视频适用）、`availability_version`。`public_url + asset_id + width + height` 是 Inspiration public view 必须冻结的最小事实；video technical facts 不改变 Inspiration 仅图片的约束。

### 8.3 Lifecycle Event

Asset 对已知 consumer 发布 `asset.site-media.availability.changed`，business `eventVersion = 1`。这是 Asset 事实，不是 Site command，也不携带 Site Item / Category 业务字段。

CloudEvents 1.0 Structured JSON envelope、Asset-owned `data` payload、`availabilityVersion` 顺序、兼容性、Event Catalog 状态与未来 compiled contract target，以 [asset-service Event Contract](/Users/acehood/Documents/GitHub/oes/docs/contracts/events/asset-service.md) 为唯一真相源。`eventId`、`occurredAt`、tenant、trace 与 event version 属于 CloudEvents envelope，不得重复伪装为 Asset `data` 字段。

当前进程内 `EventEmitter` 不是本事件的生产实现。公共事件必须通过已冻结的 NATS JetStream outbox / inbox 平台投递。

### 8.4 Stable Errors

以下错误码是 Site Media wire contract 的稳定分类，HTTP / gRPC transport 映射由 Gateway 统一处理：

- `ASSET_MEDIA_VALIDATION_FAILED`：真实二进制、容量或受控格式校验失败。
- `ASSET_SCOPE_FORBIDDEN`：verified tenant / scope 不允许读取或操作目标 Asset。
- `ASSET_NOT_SELECTABLE`：Asset 已归档、下架、删除或不具备 Site Media 使用资格。
- `ASSET_MEDIA_KIND_MISMATCH`：调用方要求 image / video 与实际受控媒体类型不一致。
- `ASSET_PUBLIC_DELIVERY_UNAVAILABLE`：不能为 publication 提供可用 public delivery。
- `ASSET_PUBLICATION_PROTECTED`：物理删除被当前或保留 publication protection 阻止。
- `ASSET_LIFECYCLE_OPERATION_IN_PROGRESS`：同一 Asset 的下架 / 删除操作尚未完成。
- `ASSET_IDEMPOTENCY_CONFLICT`：同一幂等键被用于不同语义输入。
- `ASSET_REMOTE_DELIVERY_NOT_READY`：Site 的远端 DNS / TLS / origin / purge 验证未完成，或远端迁移尚未成功。
- `ASSET_REMOTE_DELIVERY_IRREVERSIBLE`：已激活远端交付的 Site 请求回退到 local。

Stable gRPC transport mapping:

| Category | gRPC status |
| --- | --- |
| media validation or kind mismatch | `INVALID_ARGUMENT` |
| tenant / scope denial | `PERMISSION_DENIED` |
| state, publication protection, public delivery or remote readiness precondition | `FAILED_PRECONDITION` |
| lifecycle operation already in progress | `ABORTED` |
| idempotency key conflict | `ALREADY_EXISTS` |

## 9. Audit And Acceptance

Asset 必须可审计上传、选择、解析拒绝、publication protection / release、归档、下架、CDN purge 与物理删除；Site 保持自身 Item / Category / Hotspot / publication audit，双方不得写对方数据库。

最低黑盒验收：

1. 同 tenant、具备 Site Management 权限的操作者可上传或选择可授权的 Site 图片；跨 tenant、SYSTEM scope 或不可选状态 Asset 必须 fail closed。
2. Inspiration 只能解析并发布一个可用 image Asset；public view 冻结 `assetId`、delivery URL、width、height 和 Site-owned locale alt，且不接受任意 URL。
3. Site SEO / OG 图片使用同一受控 image Asset 流程；视频不得作为该用途成功解析。
4. Image / video 声明类型与真实二进制不一致时被拒绝；成功媒体具有真实技术事实，且 video 不触发转码流程。
5. Site 新 publication 成功前已建立 Asset protection；替换当前草稿不得释放仍供 last-complete 或历史 target publication 使用的旧 Asset。
6. Archive 阻止新选择但不撤销 delivery；普通 delete 在保护存在时拒绝；强制下架阻断 delivery、完成 CDN purge 并留下审计。
7. Asset 下架 / 不可用事实可被 Site 消费；Site 不用 placeholder 或其他 Asset 自动替换，并将相关资源置为待处理 / degraded。
8. Runtime / Storefront 正常公开读取只使用 Site 已同步的本地 public view，不 request-time 调 Asset Service 或对象存储控制接口。
9. `LOCAL_ONLY` Site 可以上传、预览与编辑，但不得把本地 MinIO URL 写入正式 public view；远端 DNS / TLS / purge 验证失败时仍不得发布。
10. `REMOTE_READY` Site 激活后，Asset 只在 checksum 一致时迁移未公开 local media；`REMOTE_ACTIVE` 后的 resolver 返回 `media.<site-domain>` immutable URL，且拒绝回退 local。
11. 对一个被多个 active Site 使用的 Asset，下架必须显示所有 delivery mapping 的 origin-block / precise-purge audit；任何一个 mapping 未确认时不得发布 `UNAVAILABLE`。

## 10. Implementation Boundary

实现必须在 shared proto / event contract 冻结后按以下责任拆分：

- Asset Service lane：Asset domain lifecycle、server-side validation、local / remote storage and delivery adapter、单向 Site delivery binding migration、provider confirmation、reference protection、availability facts、Asset audit 与 focused tests。
- API Gateway / Site Management BFF lane：tenant-bound external HTTP、operator / permission propagation、媒体域名意图与远端激活编排、文件流编排与 Asset adapter；不保存媒体真相、storage key 或 provider credential。
- Site Service lane：保存 `assetId` reference 与媒体域名 / 激活意图、发布前带 `siteId` resolve、publication protection / release 编排、public view materialization、Asset availability consumer 与 Site audit。
- Runtime / Storefront lane：只消费已同步的 public-safe Asset projection；不增加 Asset request-time fallback 或静态 fixture fallback。

本契约不授权任何 lane 在未冻结的 shared proto / event / permission contract 下自行添加字段、事件或旁路存储调用。

Asset 当前只有 S3-compatible object storage adaptor，尚无 CDN purge provider。实现线程可以在 Asset domain 中依赖 delivery/purge port，但不得用本地 no-op、仅删 origin object 或本地 EventEmitter 宣称完成 production takedown；CDN provider 的选择与配置是上述 Global Command 前置条件的一部分。
