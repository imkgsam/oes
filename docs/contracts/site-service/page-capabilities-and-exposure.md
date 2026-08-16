# Site Page Capabilities and Exposure Contract

> 本文冻结 Storefront 页面能力发现、OES 页面治理与 Site Runtime 本地公开状态之间的黑盒语义。它不定义页面组件、布局、页面内容、资源实例或前端内部路由。

```text
contractStatus: FROZEN_FOR_SITE_PAGE_LOCALE_GOVERNANCE_P1
serviceTruthSource: docs/architecture/services/site-service.md
runtimeTruthSource: docs/architecture/platforms/site-runtime-kit.md
```

## 1. Boundary

- Storefront 是页面能力的事实来源，声明自己实际实现的稳定页面身份和支持的 locale。
- Runtime Kit 在启动时通过受保护的 Site-facing API 提交完整页面能力声明。
- OES 保存能力发现状态，并由 Admin 管理页面是否公开以及页面级 SEO 意图。
- 能力注册不自动启用页面，不改变 `index`、sitemap 或线上 published 状态。
- SitePage 不拥有页面内容、组件树、布局、资源实例、slug 或前端内部路由。

## 2. Runtime Capability Declaration

一次声明代表当前 Storefront 版本的完整能力清单，而不是增量追加。

每个能力项只表达：

- 稳定页面身份；
- Storefront 实际支持的 locale 集合。

声明不得表达：

- page kind；
- URL 模式或 slug；
- 组件、布局、Block 或视觉样式；
- 页面内容或 SEO 文案；
- Product、Collection、Blog、News 等资源实例。

注册要求：

- 必须使用站点 Runtime 身份和既有签名请求机制；
- 必须按站点与 Runtime 部署边界隔离；
- 相同站点、页面身份和 locale 的重复声明必须幂等；
- 注册不推进站点 publishVersion，不发送 `site.publish.available` webhook；
- 注册成功只更新能力发现状态和审计信息。

### 2.1 Canonical Manifest Hash

`manifest_hash` 只对规范化后的完整能力清单求值，不对 application camelCase 对象、HTTP request wrapper、`idempotency_key`、`runtime_version` 或其他传输元数据求值。

canonical byte sequence 固定为：

1. 每个页面只保留已冻结的稳定页面身份和支持 locale 集合；使用已经通过契约校验的字符串值，不额外执行大小写折叠或 Unicode normalization。
2. 每个 `supported_locales` 按其 UTF-8 无符号字节序升序排列；页面项按 `page_key` 的同一规则升序排列。
3. 序列化为无 wrapper 的顶层 JSON array。每个对象只包含按固定顺序排列的 `page_key`、`supported_locales` 两个 snake_case member；不输出空白、换行或 BOM。字符串使用 JSON 标准转义，非 ASCII 字符直接编码为 UTF-8，不转写为 `\u` escape。
4. 对该 JSON 的 UTF-8 bytes 计算 SHA-256，输出无前缀的 64 字符 lowercase hexadecimal string。

空清单的 canonical JSON 是 `[]`，其 hash 是 `4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945`。

互操作测试向量：

```json
[{"page_key":"HOME","supported_locales":["en-US"]},{"page_key":"PRODUCT_DETAIL","supported_locales":["en-US","zh-CN"]}]
```

对应 hash：

```text
b8760cd0370e7c54852695c1fcfe895daa9f3d130a90ef1c58bdaa17d60ccacb
```

后续协议增加其他能力字段时，不得静默改变本规则的输入；如新字段必须参与内容身份，应另行冻结新的 hash 版本。

### 2.2 Server-side Registration Fencing

Runtime 本地 claim lease 只协调本机并发，不能授权或 fence 已发往 OES 的请求。页面能力注册必须同时使用由 `site-service` 按 signed `siteId + clientId` 维护的单调 `registration_generation`：

线协议最小扩展只有：请求增加 unsigned 64-bit `expected_registration_generation`，响应增加 unsigned 64-bit `registration_generation`；不向 manifest 增加业务字段。

- 新注册请求携带调用方最后确认的 `expected_registration_generation`；`0` 只允许表示服务端尚无已接受注册。
- 对新的 idempotency key，`site-service` 必须在同一事务中比较 expected generation、应用完整 manifest，并把当前 generation 单调推进一次；比较失败时拒绝 stale registration，且不得改变能力发现、运营治理或 published state，但可以记录拒绝审计。
- 成功响应必须返回本次接受的 `registration_generation`。stale compare-and-set 使用正常拒绝响应：`accepted=false`、`manifest_hash` 回显本次请求的 hash、`registration_generation` 返回服务端当前值；其他鉴权或校验错误仍走统一错误模型。
- 同一 idempotency key 的传输重试必须绑定同一 manifest hash 与 expected generation；已经成功的重试返回原 generation 和原结果，不重复应用。相同 key 携带不同 manifest hash 或 expected generation 必须返回 idempotency conflict。
- stale rejection 对旧的本地 claim 是终态；Runtime 不得把旧 manifest 直接 rebased 到返回的当前 generation 后重试。只有重新确认仍是本地当前期望 manifest 的新 claim，才可使用新的 idempotency key 发起下一次 compare-and-set。

崩溃与并发语义：

- 服务端提交前崩溃不推进 generation；提交后响应丢失时，Runtime 用原 idempotency key 恢复原结果。
- 本地 lease 到期、进程重启或重复启动不得绕过远端 generation；本地 generation 只 fence 本地 completion。
- 蓝绿实例使用同一 `siteId + clientId` 注册流时由服务端 generation 串行化。被替换实例在收到 stale rejection 后必须停止刷新；若新旧实例都持续用新 claim 抢占，fencing 不能替代部署 promotion authority，也不能防止 manifest 来回覆盖。
- 若同一站点允许多个 clientId 声明同一份权威 manifest，必须先另行冻结跨 client 的 owner 选择；本契约不把多个独立 registration stream 自动合并为站点真相。

## 3. Discovery and Governance Separation

OES 必须分开保存：

1. Storefront 是否声明了该页面能力；
2. 运营是否允许该页面能力公开；
3. 页面级 index 治理意图；
4. 该配置是否已经进入最新正式 publishVersion。

规则：

- 新发现能力默认不公开；
- Runtime 重启或重复声明不得重置运营配置；
- Runtime 暂时离线不代表能力被删除；
- 能力重新出现时沿用原有运营配置；
- 稳定页面身份发生变化时，旧能力与新能力视为不同能力，不自动迁移配置。

## 4. Capability Drift

只有一份新的、完整且成功接收的能力清单，才能判断某个能力从当前 Storefront 消失。

- 未启用能力消失：保留历史和配置，标记不可用，不影响旧版本数据读取；
- 已启用能力消失：形成 capability drift，阻止新的正式 Sync；
- 能力重新声明后：清除对应 drift，沿用原运营配置；
- OES 不因 drift 自动静默下线线上页面，也不生成新的线上 404。

## 5. Site Locale and SitePage Governance

- 站点 locale 是站点级公开开关，由 OES `SiteLocale` 治理；不提供页面 × locale 的独立公开开关。
- SitePage 的 enabled 与 index 意图是页面能力整体治理，适用于站点已启用的 locale；sitemap 不是独立运营开关。
- 静态页面在 locale 激活前必须由 Storefront 声明对应实现；缺少任一已启用静态页面能力时，locale 激活必须失败或保持非公开状态。
- 动态页面只要求模板能力已启用；具体资源是否存在某 locale，由该资源自己的 locale published 状态决定。
- SitePage 关闭时，该页面在所有公开 locale 下都不可访问；它不删除动态资源。

## 6. Published Exposure State

SitePage、站点 locale、页面级 SEO 意图以及受影响的动态资源公开状态必须作为同一个版本化的 Site Exposure Publication 随站点 publishVersion 同步。

该公开状态：

- 是 Runtime 本地的 public-safe governance data；
- 不要求 slug，也不复用要求 slug 的业务 public view envelope；
- 由 Runtime 原子提交后才对 Storefront 可见；
- 不允许 Storefront 在页面请求期间查询 OES。

索引规则：

- 页面 disabled：不可访问，不进入 sitemap / hreflang；
- 页面 enabled 且 index=false：可以访问，但必须 noindex，不进入 sitemap / hreflang；
- 页面 enabled 且 index=true：只有存在有效 canonical、静态页面实现或动态 published 内容时才具备 sitemap 资格；
- 动态资源自身的 noindex / 不存在可以进一步否决页面索引资格。

## 7. Dynamic Resource Locale Behavior

动态资源可以逐个 locale 保存、校验和发布，不要求启用一个站点 locale 时一次性翻译全部历史资源。

- 已发布 locale 版本存在：该资源可在该 locale 展示；
- locale 版本不存在、未完成或未发布：该资源在该 locale 返回 404；
- 不允许回退到默认语言内容；
- 不进入该 locale 的列表、sitemap 或 hreflang；
- 其他 locale 的已发布版本不受影响。

## 8. Storefront Execution

Storefront 根据 Runtime 本地 committed exposure state 执行：

- 默认 locale 无前缀 canonical；默认 locale 带前缀 URL 301 到无前缀；
- 其他有效 locale 使用 locale 前缀；
- 未知、disabled 或不属于站点公开范围的 locale 404；
- disabled SitePage 404；
- 缺失动态资源 locale 404；
- 不做跨语言 fallback；
- canonical、`html lang`、hreflang、robots 与 sitemap 使用同一个已提交版本。

## 9. Sync and Failure Semantics

- SitePage 或站点 locale 治理变更保存后只形成 pending state；
- 显式 Sync 才生成 publishVersion；
- capability drift、静态页面 locale 能力不完整或其他发布前置校验失败时，不生成 publishVersion，也不发送 webhook；
- 正常同步通过已冻结的 Webhook 通知 + Runtime 主动拉取 + 定时 pull fallback 完成；
- Runtime 同步失败时继续提供上一个完整 committed 版本，不暴露半套页面治理状态。

## 10. Admin Semantics

OES Admin 展示：

- Runtime 已声明的页面能力；
- Storefront 支持的 locale；
- 页面是否公开；
- 页面级 index 意图与自动计算的 sitemap 资格；
- capability drift 与发布阻断原因；
- 当前配置是否已同步到 Runtime。

OES Admin 不提供：

- 页面组件编辑；
- 布局或 Block 配置；
- 前端路由编辑；
- 页面内容编辑（除非由其他 OES-owned resource 设计单独规定）。
