# ADR 0011: Site Dynamic Slug Reservation And History

## Status

Accepted — 2026-07-22; extended to `inspiration-category` — 2026-07-25

## Context

Blog、News、Content Category 与 Inspiration Category 的已发布 slug 可以在运营过程中修改。旧公开 URL 必须继续把搜索权重与外部链接单跳 301 到当前 canonical，但同一个旧 slug 若又被另一个资源用作 canonical，就会同时代表“新页面”和“旧页面重定向”，无法得到确定结果。

草稿保存也存在并发竞争：两个操作者可以同时检查到 slug 尚未使用，再分别保存相同值。只在 Sync 阶段发现冲突会把问题延迟到发布时，而普通的应用层预检查无法阻止并发写入。

Site Runtime 的公开请求不能实时访问 OES，也不能在每次请求时扫描全部 public view JSON 寻找 historical slug。与此同时，本能力只需要治理 OES-owned 动态资源自身的 URL 历史，不应扩展成全站任意 Redirect Manager。

## Decision

### Site Service ownership

- Site Service 内部建立关系型 slug reservation / history ledger，作为 OES-owned 动态资源 slug 所有权真相；不新建跨服务 `slug-service`。
- P1 namespace 为 `blog`、`news`、`article-category` 与 `inspiration-category`。Blog 与 News 共用 Article 对象和一套 Content Category，但其详情 URL 属于不同 namespace；Content Category 使用独立 `article-category` namespace；Inspiration Category 使用独立 `inspiration-category` namespace。
- 唯一范围为 `site + namespace + locale + normalized slug`。同一文本可以跨 site、locale 或 namespace 使用。
- Product 与 Collection 只保留未来复用方向；其 namespace、owner 与 lifecycle 等待对应设计冻结，本期不实现。

### Reservation lifecycle

- 当前 draft slug 在保存时预占。新值若属于其他资源的 draft、canonical 或 historical slug，保存失败。
- 从未发布的资源修改 slug 时，在同一事务中取得新占用并释放旧 draft-only 占用；旧值不进入历史。
- 已发布资源保存新 draft slug 时，线上 canonical 继续保留且可访问，新 draft slug 同时预占。
- 正式 Sync 成功后，新 slug 成为 canonical，旧 canonical 永久成为该稳定资源的 historical slug。所有曾正式发布的 slug 在 P1 都不得转让给其他资源。
- 同一资源可以选择自己的 historical slug 作为新 draft；Sync 后该值重新成为 canonical，原 canonical 转为 historical。不同资源不得交换已发布 slug。
- 草稿删除可以释放从未发布的 draft-only 占用；已发布资源 unpublish 或 delete 后，已发布 slug 所有权继续保留。

### Concurrent writes

- Slug 规范化、占用变更、locale version 保存与审计在同一数据库事务中完成。
- 数据库唯一约束是并发申请的最终裁决者。管理端或应用层预检查可以改善错误提示，但不能作为唯一性保证。
- canonical 与 historical slug 使用同一唯一空间；不能先删除历史记录再插入新 canonical 来绕过所有权。
- 冲突必须以稳定、可读的业务失败返回，不得重试为另一个 slug 或静默覆盖原 owner。

### Publication and Runtime resolution

- 正式 public view 继续只输出当前 canonical slug 与 `historical_slugs[]`；draft reservation 是 Site Service 内部状态，不进入 proto、sync API、snapshot 或 Runtime store。
- Slug history 变化随资源 public view 和目标 publishVersion 原子发布。Unpublish、delete 或 locale disable 同样随版本传播，不能留下仍可重定向到不可公开目标的本地 alias。
- Runtime 在本地 published store 中物化 historical alias index，按 `namespace + locale + normalized slug` 直接解析稳定资源身份，再读取该资源当前 canonical 与公开状态；正常请求不扫描所有 JSON history，也不访问 OES。
- 当前 canonical 命中返回 200；historical alias 只有在目标资源当前为 published 且 locale 有效时才产生 server-side 301；目标 unpublish、delete、disabled 或不存在时 P1 返回 404。
- Storefront 拥有最终 URL 模式。Runtime 返回资源身份与当前 canonical，Storefront 在原 route family 中组合跳转目标；例如同一 `article-category` alias 在 Blog archive 与 News archive 中各自跳到对应复数 `categories` canonical 路径，`inspiration-category` alias 则组合为 `/inspirations/category/{currentSlug}`。
- Alias 不指向另一个 alias。每个 historical slug 都通过稳定资源身份直接得到当前 canonical，所以多次改名或换回仍保持单跳，不形成 redirect chain。
- Historical URLs 不进入 sitemap、hreflang 或 canonical 输出。

### Explicit non-goals

- 不管理静态页、营销页、campaign、域名、协议、locale 前缀或 trailing-slash redirect。
- 不提供手工创建、正则匹配、批量导入、跨域目标或任意状态码的 Redirect Manager。
- 不把开发期废弃的 Topic / singular Category namespace 视为历史 slug。Meilong 的这些路由保持 terminal 404。

## Consequences

- 已公开 URL 的所有权确定且不会被后续内容抢占，301 可以长期稳定存在。
- 草稿阶段能尽早发现冲突，同时数据库约束覆盖多实例与并发保存。
- 已发布资源删除后仍保留少量 slug ownership tombstone；这是防止旧 URL 被错误复用的必要成本，不复制正文或版本内容。
- Runtime 增加一个小型本地 alias 索引，但请求路径从全量扫描收敛为确定性索引查询。
- 现有 `slug + historical_slugs[]` 外部 shape 足以承载发布结果，不新增 proto 或 webhook 字段。

## Alternatives Considered

### 只检查当前 canonical slug

拒绝。它允许新资源抢占其他资源的 historical slug，使同一 URL 同时具有页面与重定向语义。

### 只在发布时检查冲突

拒绝。它把可发现的问题推迟到 Sync，并允许多个草稿长期争用同一个未来 URL。

### 应用层先查后写

拒绝。两个并发请求可以同时读到“未占用”，数据库唯一约束仍是必要的最终防线。

### 所有保存过的草稿 slug 永久保留

拒绝。从未公开的旧草稿没有 SEO 或外链价值，永久占用会无意义地消耗命名空间。

### 删除或下架后释放已发布 slug

拒绝。旧 URL 可能仍被搜索引擎、外链或用户收藏使用，复用后会把旧页面信号错误导向无关资源。

### 维护 alias-to-alias redirect chain

拒绝。它增加循环与多跳风险；通过稳定资源身份解析当前 canonical 可以始终单跳。

## Supersedes

- 本 ADR 与 `site-service` 真相源中“retired Topic / singular Category namespace terminal 404”的冻结结论，替代 ADR 0009 中关于 legacy Topic 路径 301 到 singular Category 路径的早期迁移决定。ADR 0009 的 Content Category 对象与多分类决策仍然有效。

## Related Documents

- [site-service.md](../architecture/services/site-service.md)
- [site-runtime-kit.md](../architecture/platforms/site-runtime-kit.md)
- [admin-bff.md](../contracts/site-service/admin-bff.md)
- [public-views.md](../contracts/site-service/public-views.md)
- [sync-api.md](../contracts/site-service/sync-api.md)
