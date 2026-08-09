# Site Inspiration Management P1

```text
status: FROZEN_CORE_WAITING_FOR_SITE_PLATFORM_IMPLEMENTATION
truthSource: docs/architecture/services/site-service.md
publicContract: docs/contracts/site-service/public-views.md
adminContract: docs/contracts/site-service/admin-bff.md
syncContract: docs/contracts/site-service/sync-api.md
runtimeTruthSource: docs/architecture/site-runtime-kit.md
assetTruthSource: docs/architecture/services/asset-service.md
assetContract: docs/contracts/asset-service/site-media.md
assetCollaboration: docs/architecture/collaborations/site-asset-media.md
storefrontBaseline: docs/plans/features/inspirations-masonry-gallery.md
lastUpdatedAt: 2026-08-09
```

## 1. Purpose

把已冻结的 Meilong Inspiration masonry / filter / lightbox 展示从静态 fixture 对接到 OES Site Management 与 Runtime 本地 published data，同时保持现有前端布局、排版、交互和响应式行为不变。

本 packet 只组织执行范围、依赖与验收，不重新定义 Site Service 对 Inspiration 的对象、ownership、字段或失败语义；稳定设计一律以上述 truth source / contracts 为准。

## 2. P1 Scope

- OES `Site Management -> Content Management -> Inspirations` Items / Categories 工作区。
- `SiteInspirationItem`、`SiteInspirationCategory` 与第一阶段 `SiteInspirationHotspot` 几何 authoring。
- 一个 Item 引用一个受控 Asset，可属于零到多个一级 Category，并使用一个 Site 级 rank。
- Category locale display name、intro、slug、SEO title / description、可选 SEO image 与独立发布状态。
- Item locale 可选 alt 与独立发布状态；alt 缺失是 warning，不阻止发布。
- `inspiration` / `inspiration-category` public views、sync resource、Runtime 本地 reader、Category filter 与稳定分页。
- `inspiration-category` slug reservation / history 与 Storefront server-side 301。
- Meilong static fixture → Runtime data migration，不改变现有 masonry、filter、lightbox、infinite load、skeleton、responsive 或 product drawer shell。
- Last complete Runtime publication、empty root noindex、empty Category not found 与无 fixture fallback。

## 3. Explicit Deferrals

- Product Master–Site Product identity、selection 与 publication contract。
- Hotspot Product target 绑定、公开 Hotspot payload 与产品 drawer 数据。
- 任意 URL / 手填商品快照 fallback。
- 多图 Inspiration Item、详情页、page builder、图片裁切、滤镜、绘图、文字图层或复杂图层。
- Category tree 与 Category-Item relation rank。
- 根 `/inspirations` 标题、简介和 SEO 的 OES 管理；这些继续由 Storefront 拥有。

未绑定或 `needs_review` Hotspot 不进入 public view，也不阻塞 Item 图片发布。Phase 2 Product binding 不得在本 packet 中猜测 target identity。

## 4. Cross-service And Platform Dependencies

Asset owner 已冻结 tenant-scoped Site Media：

- 服务职责：[asset-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/asset-service.md)
- 黑盒与 shared wire 语义：[site-media.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/asset-service/site-media.md)
- Site / Asset 协同：[site-asset-media.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/collaborations/site-asset-media.md)

Asset contract 已覆盖 tenant-safe upload / selection / resolve、不可静默替换的 Asset identity、long-lived CDN delivery、authoritative dimensions、publication protection / release、availability facts、archive / takedown / deletion 与 optional SEO image 使用边界。

Site Recovery 已冻结以下三个实现前置条件，但尚未实现：

- trusted gRPC metadata generation / propagation / consumption；
- cross-service Event Bus + outbox delivery；
- CDN delivery / precise purge provider。

具体语义、wire fields、事件可靠性、Cloudflare precise purge 与关闭式路径 lease 以 Site / Asset 稳定真相源、Site Media contract、协同蓝图和 trusted-gRPC feature packet 为准。Global Command 只能在 docs-only design candidate 被接收并集成后编排实现与 Asset conformance；Site Inspiration 在此之前保持 `FROZEN_CORE_WAITING_FOR_SITE_PLATFORM_IMPLEMENTATION`。

Site 实现不得以 request-body tenant/operator、进程内 EventEmitter、origin-delete/no-op purge、普通 URL、直接对象存储访问或复制 Asset 元数据真相绕过前置条件。

## 5. Four-end Impact

| 端 | 责任 |
| --- | --- |
| OES Admin / Site Service | Items / Categories / Hotspot authoring、locale publication、rank、slug ledger、Asset reference validation、public view generation、sync / audit。 |
| Runtime Kit SDK | 同步 `inspiration` / `inspiration-category`，原子写本地 store，提供 Category/count 与 Item cursor reader，维持 last complete publication。 |
| Meilong Runtime / Backend | 暴露 Storefront 本地读取、not-found / historical redirect / empty result / publication-changed 语义，不 request-time 调 OES / Asset Service。 |
| Meilong Storefront | 保留现有布局与交互，把静态 inventory / gallery / SEO Category map 替换为 Runtime 数据；根页文案与 SEO 继续前端拥有。 |

## 6. Required Sequencing

1. Site Recovery docs-only candidate 通过既有 I&V 并集成，固定 59+7 Site RPC cutover、Site Media wire、Event/outbox/inbox、Cloudflare precise purge 与 exact writer lease。
2. Global Command 按已冻结 lease 编排 shared platform implementation，并组织 Asset contract conformance。
3. Program Control 在 Asset Site Media 实现达到可消费状态并核对 shared ownership 与允许路径后，安排 shared Site contracts / generated types 的实现。
4. Site Service / Admin BFF 实现 Category、Item、Hotspot geometry、Asset resolve / protect / release、availability reaction、publication 与 sync materialization。
5. Runtime Kit / Meilong Runtime 实现本地 store 与 reader。
6. Storefront 在 Runtime reader 可用后替换 production fixture data；不得提前建立临时 HTTP / URL fallback。
7. 组织一个覆盖四端与 Asset collaboration 的 Inspiration Core acceptance；Product Hotspot binding 留给独立 Phase 2。

具体实现任务数量与 ownership 由 Program Control 在已冻结 lease 内决定，不由本 packet 机械固定。

## 7. Acceptance Targets

- OES 可创建一级 Category，按 locale 维护 display name、intro、slug 与 SEO，并管理 Category rank。
- OES 可创建 Item、选择一个受控 Asset、选择零到多个 Category、维护 Site 级 rank 与 locale alt / publication。
- 无 alt Item 可以发布；Storefront 输出空 alt，不回退 Asset 默认值、其他 locale 或文件名。
- Item 无 Category 时只出现在根页；多 Category 不复制 Item，所有 Category 使用同一 Item rank。
- OES 可在图片实际边界点击 / 拖动 / 删除 Hotspot；持久化 `[0,1]` normalized geometry。未绑定或 `needs_review` Hotspot 不公开。
- 更换 Asset 后 Hotspot 进入 `needs_review`，Item 图片仍可独立发布。
- Category locale 缺失或没有 published Item 时不出现在筛选 / sitemap，直接路由 not found；historical slug 单跳 301 到当前 `/inspirations/category/{slug}`。
- Runtime reader 按 locale / Category / rank 分页；cursor 绑定 local publishVersion，版本变化返回 publication-changed 并由 Storefront 从第一页重载。
- Runtime 同步失败继续提供上一完整 gallery；首次无数据不回退 fixture。
- 根 `/inspirations` 无 Item 时仍显示 Storefront 自有 shell + 固定空状态并 `noindex`；SitePage disabled / locale unavailable 仍优先遵循 exposure governance。
- Meilong masonry、filter、lightbox、infinite load、skeleton、responsive、hotspot visual shell 与 product drawer layout 没有非授权设计变化。

## 8. Closure

P1 只有在稳定 contracts、三项平台前置、Asset conformance、四端实现与 focused acceptance 全部关闭后才可标记完成。Product Hotspot binding 未完成不阻塞 Inspiration Core 关闭，但必须继续明确为 Phase 2 deferred，而不是使用测试商品或任意 URL 填补。
