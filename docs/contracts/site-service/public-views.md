# site-service Public Views Contract

> 本文描述 Site Runtime 可依赖的 public view 数据 shape。public view 是同步给站点的公开数据，不是 OES 编辑源模型，也不是 OES Core 内部主数据结构。

## 1. Envelope

所有 P1 public view 使用统一 envelope：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `site_id` | 是 | 当前站点。 |
| `resource_type` | 是 | `product / category / content / blog / news`。 |
| `resource_id` | 是 | public view 资源标识。 |
| `locale` | 是 | locale。 |
| `slug` | 是 | 当前 site + resource type + locale 下唯一。 |
| `status` | 是 | `published / unpublished / deleted / disabled`。Preview 响应可临时使用 `draft_preview`，但不得写入正式 store。 |
| `publish_version` | 是 | 该 view 所属站点 publishVersion。 |
| `updated_at` | 是 | view 更新时间。 |
| `payload` | 是 | resource-specific payload。 |

唯一性：

```text
site_id + resource_type + locale + slug
```

读取规则：

- Site Runtime store 可以保存所有 status。
- `runtime.publicViews` 默认只返回 `status = published`。
- 下架、删除、禁用语言等展示变化必须通过 status 同步。

## 2. ProductPublicView Payload

P1 Product payload 最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `product_id` | 是 | OES 产品主数据标识。 |
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

## 4. BlogPublicView Payload

P1 Blog payload 固定字段：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `content_id` | 是 | 站点内容标识。 |
| `title` | 是 | 当前 locale 标题。 |
| `summary` | 否 | 摘要。 |
| `cover_image` | 否 | 封面图。 |
| `author` | 否 | 作者展示名。 |
| `tags[]` | 否 | 标签。 |
| `body_html` | 是 | OES 生成的 sanitized HTML 正文。 |
| `published_at` | 否 | 展示发布时间。 |
| `seo` | 是 | SEO 信息。 |

约束：

- P1 不包含 template。
- P1 不包含 page builder。
- P1 不包含 archive。
- Blog 是 site-scoped content，不做跨站点共享发布。
- `body_html` 必须由 OES 侧完成安全清洗，禁止包含 script、inline event handlers、未知 iframe 或不受信任 HTML。
- OES 内部编辑态可以使用结构化富文本，但 public view P1 对站点输出 sanitized HTML。

## 5. NewsPublicView Payload

P1 News payload 与 Blog 接近：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `content_id` | 是 | 站点内容标识。 |
| `title` | 是 | 当前 locale 标题。 |
| `summary` | 否 | 摘要。 |
| `cover_image` | 否 | 封面图。 |
| `author` | 否 | 作者展示名。 |
| `tags[]` | 否 | 标签。 |
| `body_html` | 是 | OES 生成的 sanitized HTML 正文。 |
| `published_at` | 否 | 展示发布时间。 |
| `seo` | 是 | SEO 信息。 |

约束：

- `body_html` 遵循 Blog 相同的 sanitized HTML 规则。

## 6. ContentPublicView Payload

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

## 7. Locale Completeness

active locale 同步前必须满足：

- slug 存在且唯一。
- 展示标题存在。
- 必填正文或描述存在。
- SEO 最小字段满足站点规则。
- 必要图片可用。
- 资源状态允许同步。

preparing locale 不参与公开同步要求。
