# OES 外部站点运行时架构

## 1. 文档目的

本文用于冻结 OES 与外部网站之间的顶层协作方式。`site-service` 的服务职责与 P1 对象边界以 [site-service.md](../services/site-service.md) 为准。

## 2. 当前冻结结论

OES 外部网站采用以下目标架构：

- OES Core 继续作为内部业务数据与流程真相源。
- `site-service` 负责站点注册、语言、域名、凭证、站点产品发布配置、站点私有 Blog / News、FAQ、Inspiration 使用语义、public view、同步、webhook 与审计。
- 每个外部网站独立部署自己的 Storefront Frontend 与 Site Runtime。
- Site Runtime 必须通过统一 `@oes/site-runtime-kit` 调用 OES 面向站点开放的 BFF / Site API。
- Site Runtime 不直接调用 OES Core 内部 API。
- Storefront Frontend 不直接调用 OES Core API，也不保存高权限凭证。
- 网站页面主要从本地发布数据或本地缓存渲染。
- OES 保存草稿或站点展示配置时只形成待同步状态；显式同步才生成 public view 并通知站点。

## 3. Site / Storefront Ownership Boundary

外部站点运行时边界冻结为：

- OES 不管理主导航、Footer、前台 Logo 使用、页面 component tree、视觉样式或静态页面内容。
- OES 内部 `siteName` 只服务 Admin 识别、检索和审计；Storefront 不得把它自动作为 Header、SEO fallback 或 JSON-LD 输出。
- OES 只输出 OES-owned resources 的 public views、SEO 字段、`indexable/noindex` 信号、canonical eligibility 和 dynamic resource historical slug redirect 数据。
- Inspiration 图片文件与技术元数据由 Asset Service 拥有；Site Sync 只输出已经解析的 public-safe Asset 数据和 Site-owned locale alt / 分类 / 排序等使用语义，Runtime / Storefront 正常请求不实时访问 Asset Service。
- Inspiration Runtime reader 从本地完整 publication 按 locale、Category 与 Item rank 提供分页；分页 cursor 绑定本地 publishVersion，版本切换时 Storefront 重新从第一页读取。同步失败继续提供上一份完整 gallery，禁止静态 fixture 生产回退。
- Storefront 输出 `robots.txt` 和 `sitemap.xml`，并可合并自己拥有的静态 canonical pages。
- `robots.txt` 应阻止 preview、API 与 admin 路径，但 noindex 必须由 preview 页面/head/header 独立输出，不能依赖 robots。
- 静态页面、营销页面、域名、locale route redirect 归 Storefront / Nuxt / Edge；OES 只拥有 dynamic OES-owned resource redirect index。
- Preview 必须通过 OES token + Runtime draft view + Storefront preview route 渲染，且全链路 `noindex`、`nofollow`、`no-store`；Preview 不写正式 Runtime store、不推进 publishVersion、不触发 webhook。
- Storefront 通过 Runtime Kit 声明页面稳定身份与支持的 locale；Runtime 启动时向 OES 幂等注册页面能力。能力注册只用于发现和管理端展示，不自动改变页面公开状态，不包含布局、组件或页面内容。

## 4. OES 与站点的通信方式

OES 与站点之间不采用外部站点直接监听 OES 内部 event topic 的方式。

推荐模型是：

- OES 内部可以使用事件驱动发布流程。
- OES 对外通过 webhook 通知 Site Runtime。
- Site Runtime 收到通知后，通过 `@oes/site-runtime-kit` 调用 OES Site API 拉取 snapshot 或 delta。
- Site Runtime 还应具备 pull fallback，定时检查自己是否落后于 OES 最新发布版本。

页面能力注册是运行时启动阶段的独立控制面协作，不替代正式发布同步：

```text
Storefront 声明 page identity + supported locales
  ↓
Site Runtime 启动
  ↓
Runtime Kit 通过签名 Site API 幂等注册能力
  ↓
OES 管理端显示已发现能力，保留既有公开 / index 配置
  ↓
运营配置并执行正式 Sync
  ↓
SitePage / locale / SEO 治理状态随 publishVersion 原子同步
```

Runtime 离线不删除 OES 已知能力；已启用能力从最新注册清单消失时，OES 标记能力漂移并阻止新的正式同步，避免静默产生线上 404。

整体同步流程：

```text
OES Admin 保存产品站点配置 / Blog / News / FAQ 草稿
  ↓
site-service 标记 pending sync
  ↓
OES Admin 执行 Sync
  ↓
site-service 校验 active locale 完整性
  ↓
site-service 生成 / 更新 public views 与站点 publishVersion
  ↓
OES 调用站点 webhook endpoint
  ↓
Site Runtime 校验 webhook 签名
  ↓
Site Runtime 使用 @oes/site-runtime-kit 拉取 delta / snapshot
  ↓
Site Runtime 更新本地发布数据与缓存
```

OES Core 内部产品主数据变化不会在 P1 自动直接发布到所有站点；它应使相关站点产品配置进入需要复核 / 待同步状态，最终由显式同步动作推进到外部站点。

## 5. Webhook Endpoint 决策

一个站点默认只配置一个主 webhook endpoint。

示例：

```text
POST https://www.example-site.com/api/oes/webhook
```

不为 product、news、blog 等资源分别配置多个 webhook URL。

原因：

- 降低站点注册与运维复杂度。
- 避免重复实现签名校验、重试、审计与安全防护。
- 降低外部攻击面。
- 后续新增资源类型时无需新增 endpoint。

## 6. Webhook Payload 模型

Webhook 只承载通知信息，不直接承载完整业务数据，也不承载 changed resource list。每个站点一次同步批次最多发送一次 `site.publish.available` webhook。

推荐 payload 形态：

```json
{
  "eventId": "evt_01h...",
  "siteId": "brand-us",
  "eventType": "site.publish.available",
  "publishVersion": 108,
  "occurredAt": "2026-06-13T12:00:00Z"
}
```

`publishVersion` 只是提示，Site Runtime 收到后执行 `syncToLatest()`。具体 changed resource list 由 Site Runtime 通过 OES Site API 拉取。

## 7. Webhook 安全模型

OES 调用站点 webhook 时必须携带签名相关 header。

推荐 header：

```text
x-oes-site-id
x-oes-timestamp
x-oes-nonce
x-oes-signature
x-oes-event-id
```

Site Runtime 必须通过 `@oes/site-runtime-kit` 完成：

- siteId 校验
- timestamp 过期校验
- nonce 重放校验
- signature 校验
- eventId 幂等处理

校验失败时，Site Runtime 不得触发同步动作。

## 8. Pull Fallback

Webhook 是快速通知机制，但不能作为唯一同步保障。

Site Runtime 必须支持主动检查最新发布版本：

```text
Site Runtime 当前 publishVersion = 101
  ↓
定时请求 OES Site API 查询 latest publishVersion
  ↓
发现 latest publishVersion = 103
  ↓
固定本轮 target publishVersion = 103
  ↓
所有 delta、batch 与 snapshot page 显式携带 target = 103
  ↓
批量拉取 target 103 的 public views，或在必要时拉取 target 103 snapshot
```

推荐原则：

- 正常情况下通过 webhook 快速感知更新。
- webhook 失败、网络抖动、站点部署中断时，通过 pull fallback 补偿。
- OES 需要记录 webhook 投递状态与失败重试。
- Site Runtime 需要记录本地当前 publishVersion 与最后同步状态。
- 无待同步变更时，OES 不生成新 publishVersion，也不发送 webhook。
- 一次同步运行禁止混合版本；OES 在读取期间发布更高版本时，当前运行继续固定原 target，完成后再自动追赶。
- FAQ 等资源不建立独立传输版本，统一随 Site target publishVersion 同步。

## 9. 明确拒绝的方式

以下方式不作为目标架构：

- 外部站点直接监听 OES 内部 event topic。
- 外部站点直接调用 OES Core 内部 API。
- 为 product、news、blog 等资源分别配置多个默认 webhook endpoint。
- 通过 webhook 直接推送完整产品、内容、价格或库存数据。
- 只依赖 webhook，不提供 pull fallback。
- 每次保存草稿或更新资源字段都立即 webhook 通知站点。

## 10. 后续待冻结主题

后续还需要继续冻结：

- `site-service` contract 与 API 细节。
- Site Publish / Sync 的 snapshot、delta、rollback 细节。
- Site Ingress API 的询盘、草稿订单与最终校验边界。
- Site Runtime 的 SSR / SEO、页面缓存与部署策略。

`@oes/site-runtime-kit` Phase 1 模块结构与公共边界已回写到 [site-runtime-kit.md](./site-runtime-kit.md)。
