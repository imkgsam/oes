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

### 1.1 Tenant-bound Route Contract

Site Management P1 的 tenant-bound HTTP 路由以 `/site-management/tenants/:tenantId/**` 寻址，当前只接受 `TENANT` session；不支持 `SYSTEM` session 跨租户访问。

对外稳定行为：

- 执行顺序固定为 session auth → tenant-target binding → permission → handler / downstream。
- 未认证、session 无效或 session 已失效时返回 `401`；tenant-target binding、permission、handler 与 downstream 均不得执行，且不得产生业务副作用。
- `TENANT` session 缺少 tenant 时按无效认证上下文返回 `401`，并 fail closed。
- path target 存在但为空或非法时返回 `400`；缺少必需 path segment、未匹配路由时返回 `404`。
- session tenant 与 path target 不一致时返回 `403`，且不得调用 permission、handler 或 downstream，不得产生业务副作用。
- org 不参与 P1 tenant-target binding 决策：org 缺失不能替代或放宽 tenant binding；即使 org 信息匹配，tenant mismatch 仍返回 `403`。该规则不把 org 升级为本 P1 的硬边界，也不新增字段。
- `SYSTEM` session 访问当前 P1 tenant-bound 路由返回 `403`；permission allow 不构成 bypass。
- 只有 tenant-bound guard 生成并归一化后的 verified tenant target 可以进入下游 Admin context；BFF 不直接信任或转发原始 path target。
- `site-service` 对 Site 及其下属资源再次校验 tenant ownership；归属不一致时返回 `403`，并在读取受保护详情或产生状态变更、发布、webhook、凭证、成功审计等副作用前拒绝。

该行为不新增请求/响应字段，不新增 scope 或 page 字段，也不变更 permission proto；服务职责与 ownership 以 [site-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/site-service.md) 为准，Gateway 入口机制以 [11-gateway-and-bff-architecture.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/11-gateway-and-bff-architecture.md) 为准。

### 1.2 Contract Acceptance Matrix

| 场景 | HTTP 结果 | Tenant binding | Permission 调用 | Downstream / Admin context | 业务副作用 |
| --- | --- | --- | --- | --- | --- |
| 有效 TENANT session，target 与 session tenant 一致，permission allow，资源归属一致 | 按具体接口正常返回 | 通过；产生 normalized verified target | 是 | 接收 guard 生成的 verified target，不接收原始 path target | 允许 |
| 未认证、session 无效或已失效 | `401` | 不执行 | 否 | 不调用 | 无 |
| TENANT session 缺少 tenant | `401` | 不执行 | 否 | 不调用 | 无 |
| target 存在但为空或非法 | `400` | 拒绝 | 否 | 不调用 | 无 |
| URL 缺少 tenant segment | `404` | 不执行 | 否 | 不调用 | 无 |
| TENANT session 与 target 不一致 | `403` | 拒绝 | 否 | 不调用 | 无 |
| org 缺失或 org 信息匹配，但 TENANT session 与 target 不一致 | `403` | 仍按 tenant mismatch 拒绝 | 否 | 不调用 | 无 |
| SYSTEM session 访问 P1 tenant-bound 路由 | `403` | 拒绝 | 否 | 不调用 | 无 |
| TENANT session 与 target 一致，但 permission deny | `403` | 通过 | 是 | 不调用 | 无 |
| 入口绑定与 permission 均通过，但 Site 或下属资源不属于 verified tenant | `403` | 通过 | 是 | 接收 verified target；`site-service` 拒绝 | 无 |

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

- `ListLocaleOptions`
- `CreateSite`
- `UpdateSiteSettings`
- `DisableSite`

### System Locale Options

Locale Options 是 common contract 中的固定 enum，所有租户共用；Admin BFF 只暴露只读选项，禁止在 Admin 端提供 system locale CRUD。

`SiteLocaleOption` 最小 shape：

| 字段 | 说明 |
| --- | --- |
| `locale` | BCP-47 风格语言代码，例如 `en-US`。 |
| `nativeName` | 该语言的本地显示名，例如 `English (United States)`、`简体中文`。 |

规则：

- `CreateSite.default_locale` 必须来自 fixed Locale Options。
- `AddPreparingLocale.locale` 必须来自 fixed Locale Options。
- fixed Locale Options 不可由租户或 Admin UI 修改；新增系统语言必须通过 common contract 变更进入版本管理。
- Locale Options 响应承载 `nativeName`；tenant-web 按 `nativeName` 展示，语言名称不接入 OES Admin UI i18n，避免新增站点语言时同步维护前端语言包。
- site locale lifecycle 仍由 `AddPreparingLocale / ActivateLocale / DisableLocale` 管理。

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
- default locale 必须来自 fixed Locale Options。
- P1 不支持更换 default locale。

## 4. Locales

P1 commands：

- `AddPreparingLocale`
- `CheckLocaleCompleteness`
- `ActivateLocale`
- `DisableLocale`

规则：

- 新增语言先进入 `preparing`。
- 新增语言必须来自 fixed Locale Options。
- `preparing` 不公开。
- `ActivateLocale` 前必须通过站点静态页面能力覆盖与 locale 基础检查；不要求一次性补齐全部历史动态资源。
- `ActivateLocale` 会生成该 locale 全量 pending sync。
- default locale 不允许 disable。

## 5. SitePage Governance

P1 queries：

- `ListSitePages`

P1 commands：

- `UpdateSitePageGovernance`

规则：

- `ListSitePages` 必须区分 Storefront 能力发现事实与运营治理状态，并返回稳定页面身份、支持的 locale、能力是否可用、页面是否启用、页面级 index 意图、capability drift、同步状态与最近发现时间。
- `UpdateSitePageGovernance` 只修改页面整体的 enabled 与 index 意图；不提供页面 × locale 开关、`pageKind`、布局、内容或独立 sitemap 开关。
- 新发现能力默认不公开；重复注册、Runtime 重启或能力恢复不得重置运营配置。
- capability drift、locale 能力覆盖不足与其他页面发布前置失败，必须通过结构化 preflight issues 返回；被阻断的 Sync 返回当前 publishVersion，不创建 sync batch、不推进版本且不发送 webhook。
- 页面治理变更只形成 pending state；显式 Sync 后才进入 Site Exposure Publication。

## 6. Products

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
- `AddProductsToSite.locales[]` 只能选择当前 site 的 active / preparing locales，且这些 locales 必须来自 fixed Locale Options。
- 保存产品站点展示配置只标记 pending sync。
- 待发布资源的当前 locale version 不完整时不能 sync 该资源；缺少其他资源或其他 locale 版本不阻塞当前资源的独立发布。

## 7. Blog / News

P1 queries：

- `ListSiteContents`
- `GetSiteContent`
- `ListContentCategories`
- `GetContentCategory`
- `CheckSiteContentCompleteness`

P1 commands：

- `CreateSiteContent`
- `UpdateSiteContentLocaleVersion`
- `UnpublishSiteContent`
- `PreviewSiteContent`
- `CreateContentCategory`
- `UpdateContentCategoryLocaleVersion`
- `PublishContentCategoryLocale`
- `ReorderContentCategories`
- `DeleteContentCategory`

规则：

- `content_type = blog / news`。
- Blog / News 是 site-scoped。
- Blog / News 使用同一字段模型，仅通过 `content_type` 区分路由、列表与 SEO 类型。
- P1 不做 template、page builder 或完整 CMS archive。
- P1 允许 Blog / News 专用 Content Category SEO archive 页面。
- 保存草稿不通知站点。
- Blog / News locale version、Content Category locale version 与 Category locale 写入只能选择当前 site 的 active / preparing locales，且这些 locales 必须来自 fixed Locale Options。
- Blog / News 的当前 locale version 完整后可以独立同步；引用的 Content Category 必须在该内容 locale 下完整。Article 自身 `content_type` 决定 Blog / News，不再由 Category 重复限制。
- Preview 只覆盖 Blog / News detail，不覆盖 Content Category archive 或列表页；Category 真实页面验证通过独立测试 Site publication 完成，不新增 Category preview token 或 draft archive composition。

`CreateSiteContent` 最小请求：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `site_id` | 是 | 目标站点。 |
| `content_type` | 是 | `blog / news`。 |

`UpdateSiteContentLocaleVersion` 最小请求：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `content_id` | 是 | 内容标识。 |
| `locale` | 是 | locale。 |
| `title` | 是 | 当前 locale 标题。 |
| `slug` | 是 | 当前 locale canonical slug。 |
| `summary` | 否 | 摘要。 |
| `cover_image` | 否 | 封面图。 |
| `cover_image_alt` | 否 | 封面图 alt。 |
| `author_display_name` | 否 | 作者展示名。 |
| `category_ids[]` | 否 | 引用的 Content Category。 |
| `body_rich_text` | 否 | 编辑态富文本结构；若 P1 未单独冻结结构，可为空。 |
| `body_html` | 是 | OES Admin 输入的富文本 HTML，site-service 发布前必须清洗。 |
| `published_at` | 否 | 展示发布时间；首次正式同步为空时由 OES 自动填。 |
| `seo_title` | 是 | SEO title。 |
| `seo_description` | 是 | SEO description。 |
| `seo_image` | 否 | SEO / OG image。 |
| `status` | 否 | `draft / published / unpublished`。 |

`SiteContent` read model 最小 shape：

| 字段 | 说明 |
| --- | --- |
| `content_id` | 内容标识。 |
| `site_id` | 站点。 |
| `content_type` | `blog / news`。 |
| `status` | 整体状态。 |
| `locale_versions[]` | 多语言版本。 |
| `category_ids[]` | 当前内容引用的 Content Category。 |
| `sync_status` | 聚合 sync 状态。 |

### 7.1 Dynamic slug write semantics

Blog / News 与 Content Category 的 slug 写入遵循同一 Site Service slug reservation 规则：

- 保存草稿时立即预占当前 slug；与同一 site、locale、URL namespace 内其他资源的 draft、canonical 或 historical slug 冲突时，命令失败。
- 从未发布的草稿改名会释放旧 draft-only 占用；旧值不进入历史，也不产生 redirect。
- 已发布资源改名时，当前线上 canonical 在下一次正式 Sync 前保持有效；Sync 成功后旧 canonical 成为永久 historical slug，新值成为 canonical。
- 同一资源可以换回自己拥有的 historical slug；不同资源之间不能交换已发布 slug。
- Unpublish / delete 不释放已正式发布过的 slug；Runtime 不把不可公开的目标作为 301 目标，公开请求收敛为 404。
- 并发申请由数据库唯一约束在事务中裁决，预检查不能替代唯一性保证。

该规则不引入 Admin BFF 的手工 redirect 管理界面，也不覆盖静态页面、营销页、域名或 locale 路由 redirect。稳定边界以 [site-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/site-service.md) 与 [ADR 0011](/Users/acehood/Documents/GitHub/oes/docs/adr/0011-site-dynamic-slug-reservation-and-history.md) 为准。

## 8. Blog / News Content Categories

Content Category 是 site-scoped Blog / News 分类标签与 SEO archive 管理对象。

P1 queries：

- `ListContentCategories`
- `GetContentCategory`
- `ListVisibleContentCategories`
- `CheckContentCategoryCompleteness`
- `ListContentCategoryUsage`

P1 commands：

- `CreateContentCategory`
- `UpdateContentCategoryLocaleVersion`
- `PublishContentCategoryLocale`
- `ReorderContentCategories`
- `DeleteContentCategory`

`CreateContentCategory` 最小请求：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `site_id` | 是 | 目标站点。 |
| `sort_order` | 否 | 唯一的站点级 Content Category archive/filter 候选项排序；Blog / News 不分别维护顺序，Storefront 决定是否和如何展示。 |
| `initial_locale_version` | 是 | default locale 的完整初始草稿；与 Category 基础信息原子保存。 |

`initial_locale_version` 使用 `UpdateContentCategoryLocaleVersion` 的 locale、display name、slug、archive intro / label 与 SEO 语义，且 `locale` 必须等于 Site default locale。基础信息或初始 locale 任一步失败时，`CreateContentCategory` 整体失败，不得留下空壳 Category。

`UpdateContentCategoryLocaleVersion` 最小请求：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `category_id` | 是 | Content Category 标识。 |
| `locale` | 是 | locale。 |
| `display_name` | 是 | 展示名。 |
| `slug` | 是 | 当前 locale canonical slug。 |
| `archive_intro` | 否 | 页面可见的 Content Category archive 简短描述。 |
| `seo_title` | 否 | Content Category archive SEO title；为空时公开端使用 `display_name` 作为资源级基础标题。 |
| `seo_description` | 否 | Content Category archive SEO description；为空时回退 `archive_intro`，两者都为空则省略。 |
| `seo_image` | 否 | Content Category archive SEO / OG image；为空时交由 Storefront 全局 OG fallback，仍无可用图片则省略。 |
| `archive_label` | 否 | Content Category archive/filter display label，非站点主导航 label；为空时用 `display_name`。 |

其他 command 最小请求：

- `PublishContentCategoryLocale`: `category_id / locale`，发布该 locale 当前 draft revision。
- `ReorderContentCategories`: `site_id / ordered_category_ids[]`，提交当前非删除 Category 的完整站点级顺序；不得分别提交 Blog / News 顺序。
- `DeleteContentCategory`: `category_id`；引用保护与 tombstone 语义见下述规则。

`ContentCategory` read model 最小 shape：

| 字段 | 说明 |
| --- | --- |
| `category_id` | Content Category 标识。 |
| `site_id` | 站点。 |
| `sort_order` | Content Category archive/filter candidate 排序。 |
| `locale_versions[]` | 多语言 draft revision、last published revision 与 pending changes。 |
| `sync_status` | 聚合 sync 事实；供 pending / retrying / failed 异常提示，正常状态不要求逐行展示。 |
| `published_usage` | 当前 published Blog / News 引用统计。 |

规则：

- Content Category 属于某个 site，不跨站共享。
- 管理入口为 `Site Management -> Content Management -> Article Categories`；`Content Management` 只是导航分组，不是新的领域对象。
- 创建成功只得到 draft，不自动公开或 Sync；其他 locale 通过 `UpdateContentCategoryLocaleVersion` 逐个添加。
- Category locale 只维护 draft revision 与 last published revision。`PublishContentCategoryLocale` 用于首次发布或发布修改；P1 不提供 Category locale unpublish、Category disable 或独立 archive visibility command。
- `PublishContentCategoryLocale` 不要求已经存在 Article 引用；成功后该 Category locale 可供同 locale Article editor 选择，但 `published_usage = 0` 时仍不具备公开 archive 资格。
- 更新已有 last published revision 的 locale 只保存新的 draft revision；再次发布前公开读取继续使用上一 revision，不得保存即上线，也不得回退其他 locale 内容。
- locale 首次发布或再次发布修改后进入站点级 pending sync，并由既有自动 Site Sync / webhook / Runtime pull 闭环传播；站点 Backend 不提供第二次人工同步步骤。
- Category 列表最小运营摘要包含 default locale 名称、各 locale last published revision / pending draft changes，以及 Blog / News published usage counts。不得再存储或展示笼统的 `active / healthy` 或独立“公开位置”状态；usage 为零自然表示当前不公开，只有 pending / retrying / failed sync 才需要逐行提示。
- Blog / News 编辑器必须通过可搜索、多选且保留选择顺序的 Category selector 提交 `category_ids[]`；普通运营 UI 不接受 CSV 或手工 Category id 输入，也不在文章编辑器中创建另一个 Category 模型。
- Blog / News 共用一套 Content Category；Category 不拥有适用类型，Article 的 `content_type` 与实际引用决定每一类 archive membership。
- Content Category 只接受一套站点级 `sort_order`。`ListVisibleContentCategories` 按当前 `content_type + locale` 过滤公开候选项后沿用该相对顺序，不接受 Blog 专属或 News 专属排序字段。
- Content Category 支持多 locale，不同 locale 可有不同 slug、展示名、archive 简介与 SEO 文案。
- locale 发布硬要求只有非空 `display_name` 与通过 slug ledger 校验的 canonical `slug`；`archive_intro / archive_label / seo_title / seo_description / seo_image` 缺失只产生非阻塞 warning。
- Content Category locale version 必须在引用它的 Blog / News locale 下完整，才允许被该 locale 的正式发布内容引用。
- Article locale 正式发布必须校验每个 `category_id` 在同 locale 已存在 last published Category revision；只有草稿、缺少该 locale 或已删除的 Category 都必须阻断 Article 发布并返回可读原因。
- Content Category 通过稳定 `category_id` 被 Article 引用，可以独立 pending sync；发布展示名、slug、archive 简介、SEO、排序或历史 slug 修改时，不要求重发所有关联 Blog / News。
- Blog / News 的 Content Category 关联变化必须标记该内容 pending sync。
- Category sync 失败时必须保留 last complete Runtime publication，并在 Admin 返回 pending / retrying / failed 的同步事实；站点 Backend 不承担人工二次同步，恢复后自动追赶最新目标版本。
- Article draft 中移除 Category 不改变线上 archive membership；只有 replacement revision 正式发布后，旧 published revision 才不再构成公开引用。
- `DeleteContentCategory` 只在不存在任何 Article draft 或 published revision 引用时成功；冲突必须返回阻塞 Article 的稳定身份、可识别标题、`content_type`、locale 与 revision 类型，不得级联删除关系或文章。
- 从未发布 Category 删除后释放 draft-only slug reservation。曾发布 Category 删除后从普通列表、selector 与公开输出移除，但保留最小 identity / slug ownership / audit tombstone；全部已发布 canonical / historical slug 继续占用，不能转让给其他资源。
- Content Category slug 变更必须保留 historical slug；slug 与历史 slug 冲突必须在保存时拒绝。
- `ListVisibleContentCategories` 只返回当前 content type + locale 下被 published Blog / News 引用的 Content Category。
- Category 不接受 Blog / News archive visibility 开关。只有当前 locale Category 已发布且被对应 `content_type` 的 published Article 引用时，`ListVisibleContentCategories` 才返回它；`archive_label` 不构成 OES-managed main navigation，Storefront 拥有最终结构、位置、交互和视觉呈现。
- P1 不做 Content Category landing page、多级 Content Category 树、跨站 Content Category 共享、自动打标或复杂搜索。
- P1 不提供 Article Category archive 草稿预览；Admin BFF 不接受 Category preview command，Runtime 不组合 draft Category 与 draft / published Article 列表。

## 9. FAQ

FAQ 是 Site Management 管理的 site-scoped 内容对象；Storefront 只保留 FAQ 页面布局、交互、页面标题/简介/路由级 SEO 文案与 Contact Customer Service 链接。

P1 queries：

- `ListFaqCategories`
- `GetFaqCategory`
- `ListFaqEntries`
- `GetFaqEntry`
- `CheckFaqCompleteness`

P1 commands：

- `CreateFaqCategory`
- `UpdateFaqCategoryLocaleVersion`
- `DisableFaqCategory`
- `CreateFaqEntry`
- `UpdateFaqEntryLocaleVersion`
- `UnpublishFaqEntry`

规则：

- FAQ 只支持一级 Category；每条 Entry 只能属于一个 Category；Category 与 Entry 均支持人工排序。
- Category 与 Entry 按当前 site locale 独立保存和发布；缺少当前 locale 的内容不得回退其他语言。
- FAQ 只有单页 `/faqs`；Category 不产生独立 URL、slug 或 historical redirect。
- 保存 FAQ 只产生 pending sync；显式 Sync 才生成 `FaqDirectoryPublicView`。
- FAQ 页面由 `SitePage` 的 `FAQ` 能力控制整体公开和 index 意图；FAQ 内容不写入 SitePage。
- 客户提交问题不由 Site Management 处理，默认进入 CRM Inquiry；不得自动公开或自动创建 FAQ。
- FAQ 管理查询和命令必须执行 tenant/site ownership 校验，并产生相应审计记录。

`UpdateFaqCategoryLocaleVersion` 最小请求：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `category_id` | 是 | FAQ Category 标识。 |
| `locale` | 是 | 当前 site 的 active / preparing locale。 |
| `title` | 是 | 当前 locale 分类名称。 |
| `anchor_key` | 是 | 当前 locale 页面导航与锚点 key；在同一 site + locale 内唯一。 |
| `sort_order` | 是 | FAQ 页面中的 Category 顺序。 |

`CreateFaqEntry` 最小请求：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `site_id` | 是 | 目标站点。 |
| `category_id` | 是 | 目标 FAQ Category。 |
| `sort_order` | 是 | Category 内问题顺序。 |

`UpdateFaqEntryLocaleVersion` 最小请求：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `entry_id` | 是 | FAQ Entry 标识。 |
| `locale` | 是 | 当前 site 的 active / preparing locale。 |
| `question` | 是 | 当前 locale 问题。 |
| `answer_html` | 是 | 编辑输入；site-service 发布前必须清洗。 |
| `sort_order` | 是 | Category 内问题顺序。 |

最小 read model：

- FAQ Category 返回 `category_id / site_id / status / sort_order / locale_versions[] / sync_status`。
- FAQ Entry 返回 `entry_id / site_id / category_id / status / sort_order / locale_versions[] / sync_status`。
- `CheckFaqCompleteness` 按目标 locale 校验 Category title、anchor key 唯一性、Entry question/answer、单 Category 归属与排序；不要求一次性补齐其他 locale。
- 禁用仍包含 published Entry 的 Category 必须失败；运营需要先移动或下架这些 Entry 并完成同步。

## 10. Inspiration

Inspiration Admin BFF 服务 Site Management 的 Item、Category 与 Hotspot authoring。前端展示布局已经冻结，本契约只管理数据与发布流程。

核心用例：

- `ListInspirationCategories`
- `CreateInspirationCategory`
- `UpdateInspirationCategoryLocaleVersion`
- `ReorderInspirationCategories`
- `ListInspirationItems`
- `CreateInspirationItem`
- `UpdateInspirationItem`
- `UpdateInspirationItemLocaleVersion`
- `ReorderInspirationItems`
- `PublishInspirationItemLocale`
- `UnpublishInspirationItemLocale`
- `PublishInspirationCategoryLocale`
- `UnpublishInspirationCategoryLocale`
- `CheckInspirationCompleteness`
- `AddInspirationHotspot`
- `MoveInspirationHotspot`
- `DeleteInspirationHotspot`
- `ConfirmInspirationHotspot`

Asset selection boundary：

- 管理端通过受控 Asset capability 选择已有图片或上传新图片，并把返回的稳定 `assetId` 交给 Site Admin BFF。
- Site Admin BFF 不接受普通外链 URL 代替正式 Asset，也不拥有二进制上传、对象存储 key、宽高或 CDN 真相。
- `CreateInspirationItem` / `UpdateInspirationItem` 必须验证目标 Site tenant ownership，并在正式发布前验证 Asset scope、状态与 public-safe resolution。

Workspace and publication flow：

- 管理端入口为 `Site Management -> Content -> Inspirations`，包含 `Items` 与 `Categories`；不新增顶层 Site navigation，也不把 Item 当作 SitePage。
- Item 可以引用零到多个 Category。零 Category Item 仍可在根 `/inspirations` 公开，但不进入任何 Category 页面；不得自动创建公开 `Uncategorized` Category。
- Item 只有一个 Site 级 rank；Category filter 保留该顺序，不接受 Category-Item relation rank。
- Item locale 的 alt 可以为空；缺失只返回非阻塞可访问性 warning，不阻止保存、发布或 Sync。
- Category locale 发布要求 display name、intro、slug、SEO title 与 SEO description；OG image 可为空。缺少目标 locale 时不回退其他语言。
- 保存公开相关变化只形成 pending sync；正式 Site Sync 才生成 public views 并 webhook 通知 Runtime。操作者不需要在站点 Backend 再次点击同步。
- Category 在某 locale 没有已发布 Item 时可以保留在 Admin，但公开筛选、sitemap 与直接路由都省略该 Category。

列表最小状态信息：

- Item：thumbnail、Category membership、draft / published / unpublished、locale publication、pending sync、Hotspot unbound / needs_review summary、Asset availability。
- Category：rank、各 locale publication、当前 locale published Item count、pending sync 与 slug / SEO completeness。

`CreateInspirationCategory` 最小请求：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `site_id` | 是 | 目标 Site。 |
| `rank` | 是 | Category 筛选项顺序。 |

`UpdateInspirationCategoryLocaleVersion` 最小请求：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `category_id` | 是 | Inspiration Category 身份。 |
| `locale` | 是 | 当前 Site active / preparing locale。 |
| `display_name` | 是 | 页面标题与筛选项名称。 |
| `intro` | 是 | Category 页面简介。 |
| `slug` | 是 | 当前 locale canonical slug，使用 `inspiration-category` ledger。 |
| `seo_title` | 是 | Category SEO title。 |
| `seo_description` | 是 | Category SEO description。 |
| `seo_image_asset_id` | 否 | 可选 OG / SEO Asset 引用。 |

`CreateInspirationItem` 最小请求：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `site_id` | 是 | 目标 Site。 |
| `asset_id` | 是 | 受控图片 Asset。 |
| `category_ids[]` | 是 | 零到多个 Inspiration Category id；空数组表示只在根页展示。 |
| `rank` | 是 | Site 级 Item 顺序。 |

`UpdateInspirationItemLocaleVersion` 最小请求：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `item_id` | 是 | Inspiration Item 身份。 |
| `locale` | 是 | 当前 Site active / preparing locale。 |
| `alt` | 否 | 当前 locale 使用场景 alt；可以为空。 |

最小 read model：

- Category 返回 `category_id / site_id / rank / status / locale_versions[] / published_item_counts_by_locale / sync_status`。
- Item 返回 `item_id / site_id / asset_ref / category_ids[] / rank / status / locale_versions[] / hotspots[] / asset_availability / sync_status`。
- Hotspot 返回 `hotspot_id / item_id / x_ratio / y_ratio / rank / placement_status / target_status`；第一阶段 `placement_status = confirmed / needs_review`，`target_status = unbound`，不返回任意商品快照。
- `CheckInspirationCompleteness` 按目标 locale 校验 Asset 可公开解析、Category ownership、Category locale 必填内容、slug ledger、Item locale publication 与公开资格；alt 缺失只返回 warning。

Hotspot placement flow：

```text
Create / edit Inspiration Item
  ↓
Select controlled Asset
  ↓
Enter hotspot placement mode
  ↓
Click actual image bounds to add marker
  ↓
Drag, delete or save marker
  ↓
Persist normalized coordinates
```

规则：

- Admin UI 可以把位置转换为百分比或等价归一化值，但正常运营人员不输入 x/y 数字。
- 黑盒 contract 使用 `x_ratio / y_ratio` 十进制归一化坐标，合法范围为闭区间 `[0, 1]`；Site Service 必须验证坐标在图片有效范围内，预览容器留白与屏幕像素不得成为坐标事实。
- Product target 尚未冻结时 Hotspot 可以保存为未绑定；未绑定 Hotspot 不阻塞 Item 图片发布，也不进入 public view。
- 更换 Item Asset 后，所有 Hotspot 自动进入 `needs_review`；运营人员需要移动、删除或确认。未确认 Hotspot 不公开。
- `ConfirmInspirationHotspot` 只确认当前 Asset 下的位置；它不创建 Product target，也不能把任意 URL、手填商品名称、价格或测试商品快照当作 Product 绑定。
- Hotspot editor 不提供裁切、滤镜、绘图、文字标注或复杂图层能力。
- Add / move / delete / confirm 均必须产生 Site audit。只有变化影响到已经具备有效 Product target 且公开资格的 Hotspot public output 时才使对应 Item 进入 pending sync；纯未绑定 / `needs_review` 几何编辑不应制造无公开变化的 publishVersion。

Hotspot command 最小请求：

- `AddInspirationHotspot`: `item_id / x_ratio / y_ratio / rank`。
- `MoveInspirationHotspot`: `hotspot_id / x_ratio / y_ratio`；移动后当前 Asset 下 placement 视为重新确认。
- `DeleteInspirationHotspot`: `hotspot_id`。
- `ConfirmInspirationHotspot`: `hotspot_id`；只把当前 Asset 下 `needs_review` placement 变为 `confirmed`。

## 11. Sync

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
- 同步前检查已启用静态页面的 locale 能力覆盖，以及每个待发布资源 locale version 自身的完整性。
- Pending resources 和 sync history 必须支持 `article-category`、`faq` resource type。
- Blog / News 内容完整性必须包含引用 Content Category 的 ownership、状态与当前 locale 完整性检查。
- 每个站点每次 sync batch 最多发一次 webhook。
- `RetryLastSync` 不得盲目创建重复 public views；应基于 sync batch 状态恢复。
- `ResendWebhook` 不生成新版本。

## 12. Credentials

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

## 13. Audit

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

P1 Blog / News + Content Category 至少记录：

- `content.created`
- `content.updated`
- `content.unpublished`
- `content.slug_changed`
- `content.preview_token_issued`
- `content_category.created`
- `content_category.updated`
- `content_category.locale_published`
- `content_category.deleted`
- `content_category.slug_changed`
- `sync.started`
- `sync.completed`
- `sync.failed`
