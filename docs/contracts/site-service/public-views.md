# site-service Public Views Contract

> 本文描述 Site Runtime 可依赖的 public view 数据 shape。public view 是同步给站点的公开数据，不是 OES 编辑源模型，也不是 OES Core 内部主数据结构。

## 1. Envelope

所有带公开 URL 的 P1 resource public view 使用统一 envelope。FAQ directory 是页面级例外，详见第 8 节，不参与 slug ledger。

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `site_id` | 是 | 当前站点。 |
| `resource_type` | 是 | `product / category / content / blog / news / article-category / inspiration-category`。`category` 是产品 taxonomy；`article-category` 是内容 taxonomy；`inspiration-category` 是 Inspiration taxonomy。FAQ 与 Inspiration Item 使用独立的 no-slug view。 |
| `resource_id` | 是 | public view 资源标识。 |
| `locale` | 是 | locale。 |
| `slug` | 是（带 URL 的资源） | 当前 site + resource type + locale 下唯一；页面级 FAQ directory 不使用该字段。 |
| `status` | 是 | `published / unpublished / deleted / disabled`。Preview 响应可临时使用 `draft_preview`，但不得写入正式 store。 |
| `publish_version` | 是 | 该 view 所属站点 publishVersion。 |
| `updated_at` | 是 | view 更新时间。 |
| `payload` | 是 | resource-specific payload。 |

唯一性：

```text
site_id + namespace + locale + normalized slug
```

读取规则：

- Site Runtime store 可以保存所有 status。
- `runtime.publicViews` 默认只返回 `status = published`。
- 下架、删除、禁用语言等展示变化必须通过 status 同步。
- historical slug 只用于 Runtime redirect lookup，不得作为 canonical URL 进入 sitemap。
- `draft_preview` 只允许出现在 preview 响应中，不得写入正式 Runtime store、snapshot、delta 或 changed resource sync 结果。

Canonical / historical slug 约束：

- P1 dynamic namespaces 为 `blog`、`news`、`article-category`、`inspiration-category`；同一 namespace 内 canonical 与 historical slug 共用唯一空间，不能被其他资源重新声明。
- 只有正式发布过的 slug 才能出现在 `historical_slugs[]`；从未发布的 draft slug 不进入 public view。
- Runtime 只有在目标资源当前 `status = published` 时才使用 historical slug 执行单跳 301；`unpublished`、`deleted`、`disabled` 或 locale 不公开的资源不得继续重定向。
- Storefront 负责将稳定资源身份与当前 canonical 组合成最终 URL；historical slug 不携带 route family，也不进入 canonical、sitemap 或 hreflang。
- OES slug reservation / history ledger 的生命周期、并发与删除语义以 [site-service.md](../../architecture/services/site-service.md) 和 [ADR 0011](../../adr/0011-site-dynamic-slug-reservation-and-history.md) 为准。

## 2. ProductPublicView Payload

P1 Product payload 最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `product_id` | 是 | 公开产品资源标识；它与 Product Master / Site Product 的 identity mapping 需在独立产品设计中冻结。 |
| `display_title` | 是 | 当前 site / locale 展示标题。 |
| `display_description` | 是 | 当前 site / locale 展示描述。 |
| `summary` | 否 | 列表页摘要。 |
| `model` | 否 | 公开型号。 |
| `brand` | 否 | 公开品牌摘要。 |
| `category_ids[]` | 否 | 当前站点定义的公开分类 id。 |
| `images[]` | 否 | 公开图片。 |
| `specs[]` | 否 | 公开规格。 |
| `seo` | 是 | SEO 信息。 |

`images[]` item：

| 字段 | 说明 |
| --- | --- |
| `url` | 图片 URL。 |
| `alt` | 当前 locale alt 文案。 |
| `role` | `primary / gallery / seo`。 |

`specs[]` item：

| 字段 | 说明 |
| --- | --- |
| `name` | 当前 locale 规格名。 |
| `value` | 当前 locale 规格值。 |
| `unit` | 单位，可为空。 |
| `group` | 规格分组，可为空。 |

`seo`：

| 字段 | 说明 |
| --- | --- |
| `title` | SEO title。 |
| `description` | SEO description。 |
| `image` | SEO / OG image，可为空。 |
| `canonical_url` | canonical URL，可由 OES 或站点生成策略提供。 |

约束：

- Product master public-safe fields 需要在实现前与 product / item master owner 冻结。
- Product Master–Site Product / `SiteProductPublication` 的 identity、mapping 与 lifecycle 不属于本 contract 已冻结内容；现有 `ProductPublicView` shape 不能作为该关系的设计依据。
- `category_ids[]` 引用当前 site 已发布的 `CategoryPublicView.payload.category_id`，不要求等同于 item-master 内部 category id。
- P1 不包含 price / inventory。
- Site Runtime 不得用 ProductPublicView 做最终价格、库存、订单校验。

## 3. CategoryPublicView Payload

P1 Category payload 最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `category_id` | 是 | 分类标识。 |
| `parent_category_id` | 否 | 父分类。 |
| `display_title` | 是 | 当前 locale 展示名。 |
| `description` | 否 | 描述。 |
| `image` | 否 | 分类图。 |
| `sort_order` | 否 | 排序。 |
| `seo` | 是 | SEO 信息。 |

约束：

- `CategoryPublicView` P1 source 是 site-defined category data。
- 不同 site 可以有不同 category tree、name、slug、ordering 与 SEO。
- `CategoryPublicView` 不暗示分类必然来自 item-master category projection。
- 若 OES 内部实现参考 item-master、PIM 或其他分类源，必须先由 `site-service` 转成当前 site 的公开分类定义后再发布。
- Site Runtime 与 Storefront 只消费当前 site 已发布的 category public views，不关心分类内部来源。
- P1 不冻结完整 PIM、CMS、taxonomy platform 或跨站共享分类治理 contract。

### 3.1 InspirationCategoryPublicView Payload

`InspirationCategoryPublicView` 是带 Category URL 的动态页面数据，使用统一 envelope 和 `resource_type = inspiration-category`。

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `inspiration_category_id` | 是 | Site 内稳定 Category 身份。 |
| `display_name` | 是 | 当前 locale 页面标题与筛选项名称。 |
| `intro` | 是 | 当前 locale Category 页面简介。 |
| `sort_order` | 是 | Category 筛选项的站点级顺序；不影响 Item 顺序。 |
| `historical_slugs[]` | 否 | 当前 locale 历史 slug，用于 Category canonical 301。 |
| `seo` | 是 | 当前 locale SEO 数据。 |

`seo` 最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `title` | 是 | Category 页 SEO title。 |
| `description` | 是 | Category 页 SEO description。 |
| `image` | 否 | Category 页 OG / SEO image；为空时按站点既定规则处理。 |

约束：

- `slug` 位于统一 envelope，由 OES Site slug ledger 管理；Storefront 使用固定 `/inspirations/category/{slug}` route family。
- `display_name`、`intro`、`seo` 与发布状态均为 locale 级数据；缺少目标 locale 时不得回退其他语言。
- 无任何当前 locale 已发布 Inspiration Item 的 Category 不进入公开筛选、sitemap 或 indexable 页面；直接访问按 Storefront/Runtime 约定返回 404。
- Category 页面布局、固定前缀、筛选交互与视觉模板仍由 Storefront 拥有。

## 4. BlogPublicView Payload

P1 Blog payload 固定字段：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `content_id` | 是 | 站点内容标识。 |
| `title` | 是 | 当前 locale 标题。 |
| `summary` | 否 | 摘要。 |
| `cover_image` | 否 | 封面图。 |
| `cover_image_alt` | 否 | 封面图 alt。 |
| `author_display_name` | 否 | 作者展示名。 |
| `category_ids[]` | 是 | 有序 Content Category public view resource id。 |
| `tags[]` | 否 | 当前 locale 的细粒度关联标签。 |
| `body_html` | 是 | OES 生成的 sanitized HTML 正文。 |
| `published_at` | 否 | 展示发布时间。 |
| `historical_slugs[]` | 否 | 当前 locale 历史 slug，用于 301 redirect。 |
| `seo` | 是 | SEO 信息。 |

约束：

- P1 不包含 template。
- P1 不包含 page builder。
- P1 不包含完整 CMS archive；P1 允许 Blog / News Content Category SEO archive。
- Blog 是 site-scoped content，不做跨站点共享发布。
- Blog public view 只携带有序 `category_ids[]`；Category 展示名、archive intro、slug、描述与 SEO 以 `ArticleCategoryPublicView` 为准。第一个 id 是通用卡片的 primary category，但不改变其他 Category archive membership。
- `body_html` 必须由 OES 侧完成安全清洗，禁止包含 script、inline event handlers、未知 iframe 或不受信任 HTML。
- `cover_image_alt` 是当前 locale 内容版本在封面图使用场景下的最终 alt；不得自动继承 media asset 默认 alt。
- `body_html` 中非装饰性图片必须有当前 locale 使用场景下的 `alt`；装饰性图片必须显式输出 `alt=""`。
- OES 内部编辑态可以使用结构化富文本，但 public view P1 对站点输出 sanitized HTML。
- `published_at` 若运营未填写，首次正式 Sync 时由 OES 自动填入首次发布成功时间；后续 Sync 不自动覆盖。

## 5. NewsPublicView Payload

P1 News payload 与 Blog 接近：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `content_id` | 是 | 站点内容标识。 |
| `title` | 是 | 当前 locale 标题。 |
| `summary` | 否 | 摘要。 |
| `cover_image` | 否 | 封面图。 |
| `cover_image_alt` | 否 | 封面图 alt。 |
| `author_display_name` | 否 | 作者展示名。 |
| `category_ids[]` | 是 | 有序 Content Category public view resource id。 |
| `tags[]` | 否 | 当前 locale 的细粒度关联标签。 |
| `body_html` | 是 | OES 生成的 sanitized HTML 正文。 |
| `published_at` | 否 | 展示发布时间。 |
| `historical_slugs[]` | 否 | 当前 locale 历史 slug，用于 301 redirect。 |
| `seo` | 是 | SEO 信息。 |

约束：

- `body_html` 遵循 Blog 相同的 sanitized HTML 规则。
- `cover_image_alt` 与正文图片 `alt` 遵循 Blog 相同的 locale + 使用场景规则；media asset 默认 alt 不能自动成为最终 published alt。
- News public view 只携带有序 `category_ids[]`；Category 展示名、archive intro、slug、描述与 SEO 以 `ArticleCategoryPublicView` 为准。

Blog / News 的 `tags[]` item：

| 字段 | 说明 |
| --- | --- |
| `key` | 当前 site 内稳定的筛选 key。 |
| `label` | 当前 locale 展示文案。 |

`tags[]` 只用于筛选、展示与关联；它不是独立 public resource、SEO archive 或 sitemap 输入。

## 6. ArticleCategoryPublicView Payload

Content Category public view 使用 `resource_type = article-category`，并与产品 `CategoryPublicView` 严格分离。

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `content_category_id` | 是 | Content Category 标识。 |
| `display_name` | 是 | 当前 locale 的 H1 与默认卡片分类展示名。 |
| `archive_intro` | 否 | 当前 locale 归档页可见简介。 |
| `archive_label` | 否 | 归档 / 筛选入口短标签；为空时使用 `display_name`。 |
| `sort_order` | 否 | 唯一的站点级 Category archive/filter candidate 排序。 |
| `historical_slugs[]` | 否 | 当前 locale 历史 slug，用于 301 redirect。 |
| `seo` | 是 | Category archive SEO 信息；内部字段可按下述固定规则为空或回退。 |

约束：

- Content Category 是 site-scoped，不跨站共享。
- Category public view 可同步到 Runtime，但不代表它一定公开可见。
- `published_usage = 0` 的 Category locale 可以具有已同步 public view，以支持先准备分类再发布 Article；Runtime / Storefront 仍不得把它暴露为导航、archive、sitemap 或可索引 URL。
- public view 只包含目标 locale 最新正式发布的 Category revision。该 locale 的新草稿不得覆盖上一份 published revision；没有目标 locale published revision 时不得回退另一语言。
- Content Category 不通过独立 unpublish / disable 状态控制 archive 存在性；某 `content_type + locale` 是否公开只由 last published Category revision 与 published Article 实际引用共同决定。
- 已删除 Content Category 不得进入公开筛选、archive 或 sitemap。删除曾发布 Category 时，新的完整 Site publication 必须移除其 Runtime public view / alias 可达性；historical URL 返回 404，但 OES slug ledger 仍永久保留该稳定资源的已发布 slug ownership。
- `archive_label` 为空时使用 `display_name`；`seo.title` 为空时使用 `display_name` 作为资源级基础标题；`seo.description` 为空时使用 `archive_intro`，两者均为空时省略 description；`seo.image` 为空时交由 Storefront 全局 OG fallback，仍无可用图片则省略。
- Site Service 不使用 `siteName`、其他 locale 文案或自动生成内容填充这些字段；Storefront 拥有最终 title composition 与站点 shell SEO。
- Storefront 只能展示当前 content type + locale 下被至少一篇 `published` Blog / News 引用的 Category。
- Blog 与 News 分别完成公开资格过滤后，必须沿用同一套 `sort_order`；public view 不输出 Blog 专属或 News 专属排序。同值时以稳定 `content_category_id` 作为确定性 tie-breaker。
- Article 的 `category_ids[]` 使用稳定 Category identity，因此 Category metadata / rank / canonical slug 的新 publication 不要求重建未变更的 Article revision。Runtime 必须在同一完整 Site publishVersion 中读取 Category view、Article membership 与 alias index，不能混合新旧版本。
- Category 不输出 Blog / News archive visibility 开关。当前 locale Category 与对应类型 published Article 的实际引用决定是否成为公开 archive/filter 候选项；`archive_label` 不表示 OES 管理主导航，Storefront 拥有最终导航结构、位置、文案呈现与交互。
- 空 Category archive 不得进入 sitemap；访问时必须返回 404。
- Category archive 是 SEO-friendly archive / filter page，不是 Category landing page。
- P1 不包含 Category 专题正文、营销模块、多级内容分类树或复杂搜索。

## 7. Runtime Local Content Filter Contract

Site Runtime 必须从本地 published `BlogPublicView` / `NewsPublicView` 提供组合过滤，不得要求 Storefront 根据页面 URL 选择专用资源接口。最小 filter shape：

```text
contentTypes[]
categorySlug
tagKeys[]
tagMatch = any | all
sort
page
pageSize
```

该能力是 Runtime 本地读模型 / API contract，不是 Storefront 直连 OES Site-facing API 的契约。Storefront 可将页面路由映射成上述 filter；Meilong 的冻结映射仅使用 `/blogs/categories/:categorySlug` 与 `/news/categories/:categorySlug`。

## 8. FaqDirectoryPublicView Payload

FAQ 页面使用独立的 directory public view，不复用带 slug 的动态资源 redirect envelope。它只服务 Storefront 的单页 `/faqs`，不生成 Category 详情 URL。

最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `site_id` | 是 | 当前站点。 |
| `resource_type` | 是 | 固定为 `faq`。 |
| `resource_id` | 是 | 固定为站点 FAQ directory 的稳定标识。 |
| `locale` | 是 | 当前 locale。 |
| `status` | 是 | `published / unpublished / disabled`。 |
| `publish_version` | 是 | 该 view 所属站点 publishVersion。 |
| `updated_at` | 是 | view 更新时间。 |
| `payload` | 是 | 已排序 Category 与 Entry 数据。 |

`payload` 最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `categories[]` | 是 | 当前 locale 已发布 FAQ Category。 |
| `categories[].category_id` | 是 | Category 稳定身份。 |
| `categories[].title` | 是 | 当前 locale 分类名称。 |
| `categories[].anchor_key` | 是 | Storefront 动态导航与页面锚点使用的 key。 |
| `categories[].sort_order` | 是 | Category 排序。 |
| `categories[].entries[]` | 是 | 该 Category 下已发布 FAQ Entry。 |
| `categories[].entries[].entry_id` | 是 | Entry 稳定身份。 |
| `categories[].entries[].question` | 是 | 当前 locale 问题。 |
| `categories[].entries[].answer_html` | 是 | OES 清洗后的安全答案 HTML。 |
| `categories[].entries[].sort_order` | 是 | Category 内问题排序。 |

约束：

- Category 与 Entry 只在当前 locale 的 published directory view 中出现；Storefront 不回退其他语言。
- `anchor_key` 来自已发布 Category 数据；左侧 Category 导航、页面内 Category 区块与锚点必须使用同一值动态生成。
- FAQ directory view 不参与 slug ledger、historical alias index、canonical URL 或独立 sitemap entry。
- `answer_html` 必须由 OES 完成安全清洗；Storefront 只渲染已发布结果。
- Storefront 页面标题、简介、路由级 SEO 文案和布局不由该 public view 覆盖；FAQPage JSON-LD 由 Storefront 根据当前已发布 entries 生成。
- 客户问题提交不进入该 public view；提交结果进入 CRM Inquiry。

## 9. InspirationItemPublicView Media Boundary

`InspirationItemPublicView` 表达瀑布流中的一个已发布图片项目。Item 当前没有独立详情 URL，因此不要求 Item slug，不进入 historical alias index 或独立 sitemap entry。

No-slug envelope：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `site_id` | 是 | 当前站点。 |
| `resource_type` | 是 | 固定为 `inspiration`。 |
| `resource_id` | 是 | Item 稳定资源身份。 |
| `locale` | 是 | 当前公开语言。 |
| `status` | 是 | `published / unpublished / deleted / disabled`。 |
| `publish_version` | 是 | 该 view 所属 Site publishVersion。 |
| `updated_at` | 是 | view 更新时间。 |
| `payload` | 是 | Item 公开使用语义。 |

`payload` 当前冻结的最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `inspiration_item_id` | 是 | Site 内稳定 Item 身份。 |
| `category_ids[]` | 是 | 当前 Item 的 Inspiration Category 身份；可以为空。 |
| `asset.asset_id` | 是 | Asset Service 拥有的稳定受控资产身份。 |
| `asset.public_url` | 是 | 发布时解析并随 Site Sync 输出的 public-safe 图片地址。 |
| `asset.width` | 是 | Asset 原始正整数像素宽度。 |
| `asset.height` | 是 | Asset 原始正整数像素高度。 |
| `asset.alt` | 否 | Inspiration 使用场景下当前 locale 的 alt；缺失时 Storefront 输出 `alt=""`，不得自动回退或伪造。 |
| `item_rank` | 是 | Site 级 Item 人工顺序；Category 过滤不改变该顺序。 |

约束：

- 一个 Item 只引用一张图片 Asset；P1 不定义多图相册。
- Item 可以属于多个 Inspiration Category，但多分类不得复制 Asset 文件或 Item。
- `item_rank` 是全局 Item 顺序；不存在 Category-Item 关系级排序字段。Category 只提供自己的筛选项顺序。
- `asset.public_url / width / height` 来自受控 Asset facts；`asset.alt` 由 Site Management 按 Item 使用场景与 locale 拥有，但可以为空。
- Storefront 从 `width / height` 得到原始比例并继续使用自身已冻结 masonry / lightbox 布局；public view 不输出列数、裁切模板或响应式布局配置。
- 正常公开请求只读取 Runtime 本地已发布 view，不 request-time 调用 Asset Service。
- Asset 无法公开解析时 Item 不得发布；已发布引用的 Asset 不得被盲目物理删除。
- 缺少 `asset.alt` 不阻止发布；Storefront 输出空 alt，相关结构化数据不生成虚假 caption，OES 只记录非阻塞可访问性警告。
- 根 `/inspirations` 页面的标题、简介、页面级 SEO、OG / Twitter 文案与根页 JSON-LD 不由该 public view 提供，继续由 Storefront 静态实现维护；SitePage / locale exposure 只决定其公开与索引治理。
- Category 引用、排序、Category URL / SEO 的领域语义与 Category public view 已冻结。Hotspot 几何属于 Item，但在 Product target 身份冻结前不进入正式 `InspirationItemPublicView`；未绑定、需重新确认或 target 不可公开的 Hotspot 必须被省略，Item 本身仍可公开。

### 9.1 Inspiration Runtime Query Semantics

Runtime 从本地已提交 public views 提供 Inspiration 查询，Storefront 正常请求不得实时调用 OES 或 Asset Service。

Item list request 最小语义：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `locale` | 是 | 目标公开语言。 |
| `category_slug` | 否 | 可选 Category filter；为空表示根 `All`。 |
| `cursor` | 否 | 下一页游标。 |
| `limit` | 否 | Storefront 选择的批次大小，受 Runtime 上限约束。 |

Item list response 最小语义：

| 字段 | 说明 |
| --- | --- |
| `publish_version` | Runtime 当前用于该页的本地完整版本。 |
| `items[]` | 按 `item_rank + stable item identity` 排序的 published Item。 |
| `next_cursor` | 下一页游标；无后续页时为空。 |
| `has_more` | 是否还有后续 Item。 |

Category reader 返回当前 locale 公开 Category、Category rank 与 published Item count，并遵循以下规则：

- Category filter 只过滤 membership，不改变 Item 全局顺序，也不存在 Category-Item relation rank。
- 分页发生在 locale、status、Asset availability 与 Category filter 之后。
- Cursor 必须绑定当前 `publish_version` 和查询 filter。若本地 publishVersion 在连续分页期间变化，Runtime 返回 `PUBLICATION_CHANGED` 等价信号；Storefront 清空当前列表并从第一页重新读取，避免重复或漏项。
- Storefront 拥有首次与后续加载数量、IntersectionObserver、skeleton 和 masonry 行为；OES / Runtime contract 不固定 28 / 20 等批次数字。
- 当前 locale 不存在 Category、Category 为空或未发布时返回 not found；historical Category slug 返回稳定资源身份与当前 canonical slug，由 Storefront 执行 server-side 301。
- 根 `/inspirations` 当前 locale 没有 published Item 时仍返回页面 200，由 Storefront 保留自身标题 / 简介并显示固定通用空状态，同时输出 `noindex`；不得回退静态 fixture。
- SitePage disabled 或 locale 不公开时优先遵循 Site Exposure Publication，不以空状态绕过页面治理。
- Runtime Sync 失败时继续提供上一份完整本地 Inspiration publication；首次没有完整 publication 时返回空 / unavailable 结果，不读取 Storefront 静态数组。

## 10. ContentPublicView Payload

P1 Runtime Kit 可以读取 `content` 类型 public view；`site-service` P1 Admin 默认不提供完整 page builder。

Content payload 用于后续简单固定内容页或站点固定区块，P1 最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `content_id` | 是 | 内容标识。 |
| `content_key` | 是 | 站点内稳定 key。 |
| `title` | 是 | 当前 locale 标题。 |
| `body_html` | 是 | OES 生成的 sanitized HTML。 |
| `seo` | 是 | SEO 信息。 |

约束：

- P1 不用 `content` 实现 page builder。
- 若实现线程不交付 content 管理 UI，Runtime Kit 仍可保留读取能力。

## 11. Locale Completeness

动态资源按资源与 locale 独立发布；站点激活某 locale 不要求一次性补齐全部历史资源。某个资源 locale version 只有在自身满足以下条件时才允许正式同步：

- slug 存在且唯一。
- 展示标题存在。
- 必填正文或描述存在。
- SEO 最小字段满足站点规则。
- 必要图片可用。
- 资源状态允许同步。
- Blog / News 必须至少引用一个 Content Category；每个被引用的 Content Category 必须在对应 content locale 正式发布所需的 locale 下完整。
- Blog / News archive membership 由 Article 自身 `content_type` 与 `category_ids[]` 实际引用共同决定；Category 不输出重复的适用类型。
- 同一 Blog / News content locale version 的 `tags[].key` 必须唯一且非空。
- FAQ locale version 必须具有非空 question、answer、所属已发布 Category 与有效排序；当前 locale 没有已发布 FAQ directory view 时不得使用其他语言回退。

preparing locale 不参与公开同步要求。

静态页面的 locale 完整性不由本节内容资源规则替代；站点激活 locale 前，必须另行通过 Storefront 页面能力声明检查已启用静态页面的实现覆盖。

## 12. SEO And Routing Rules

OES dynamic resource redirect index:

- OES public views 为 OES-owned dynamic resources 提供 canonical slug 与 `historical_slugs[]`。
- Runtime / Storefront 必须对 Blog、News、Content Category historical slug 执行 server-side 301 到当前 canonical URL。
- Product / Category 若后续引入 historical slug，也复用同一 dynamic resource redirect index 语义。
- 静态页面、营销页面、域名、协议、trailing slash、locale 路由重写和 campaign redirect 不进入 OES redirect contract，归 Storefront / Nuxt / Edge。

Blog / News detail：

- canonical 指向当前 canonical slug。
- Blog JSON-LD 使用 `BlogPosting`。
- News JSON-LD 使用 `NewsArticle`。
- historical slug URL 必须 301 到当前 canonical URL。

Content Category archive：

- Category archive 页面主体是符合 Storefront 所选 Runtime filter 的本地 published `BlogPublicView` / `NewsPublicView` 列表。
- OES public view contract 不为所有站点统一冻结 Category archive URL；Meilong 的 canonical 已单独冻结为 `/blogs/categories/:categorySlug` 与 `/news/categories/:categorySlug`。
- sitemap 只包含有 published 内容的 canonical Category archive 第 1 页；pagination page 2+ 可访问但不进入 sitemap。
- 同一已发布 Category 自身的 historical slug 可由 Storefront / Edge 根据 metadata 301 到当前 canonical；Meilong 的目标仍是对应的复数 `categories` 路径。

Retired Meilong archive namespace：

- `/blogs/category/**`、`/news/category/**`、`/blogs/topic/**`、`/news/topic/**` 及其 locale-prefixed variants 都是开发期遗留 namespace。
- 上述路径必须 terminal 404，不得 redirect，不得返回 `Location`；即使 slug 能匹配已发布 Content Category 也不例外。
- retired namespace 与同一 Category 自身的 historical slug 是不同概念；后者仍可在复数 canonical namespace 内 301。

Sitemap / robots eligibility:

- sitemap 只能包含 canonical、`indexable = true`、`status = published`、active locale 的 URL。
- historical slug、preview、`noindex` resource、空 archive、pagination page 2+ 不进入 sitemap。
- Storefront 可以合并自己拥有的静态 canonical pages；这些静态 pages 不由 OES public view 定义。
- robots 由 Storefront 输出并阻止 preview、API、admin 等路径；resource noindex 不依赖 robots，必须在页面 head/header 输出。
