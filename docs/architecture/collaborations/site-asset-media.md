# Site–Asset Media 协同蓝图

> `asset-service` 的服务边界以 [asset-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/asset-service.md) 为准；`site-service` 的服务边界以 [site-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/site-service.md) 为准。本文只冻结两者与 API Gateway / BFF、Runtime / Storefront 的协同方式，不重新定义任一服务的领域对象或 schema。

## 1. Goal

定义 OES Site Media 在受控上传、选择、发布期解析、公开 CDN delivery、versioned Site publication 引用保护、下架与可用性恢复上的长期协同方式。

当前直接消费者是 Inspiration Item 图片和 Inspiration Category 可选 SEO / OG 图片。Site Media 的图片 / 视频能力可以被未来另行冻结的 Site consumer 使用，但不把当前 Inspiration P1 扩展成视频内容、页面构建器或全域 DAM。

## 2. Participants And Ownership

| Participant                         | Owns                                                                                                                                                                                    |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `asset-service`                     | Asset binary、技术元数据、validation、storage origin、CDN delivery、`SiteMediaDeliveryBinding`、迁移、Asset lifecycle、publication protection 与 Asset audit。                          |
| `site-service`                      | Site、媒体域名与 local / remote 激活意图、Inspiration Item / Category、Asset reference、locale alt、SEO use semantics、rank、Hotspot、public view、publishVersion、sync 与 Site audit。 |
| `api-gateway` / Site Management BFF | tenant-bound 外部 HTTP、authenticated operator / permission / trace propagation、文件流与下游编排。                                                                                     |
| Site Runtime / Storefront           | 只读取本地完整 public publication 并从 CDN 请求已解析媒体；不拥有 Asset 或 request-time 解析 Asset。                                                                                    |

Asset 不拥有 Site 页面或内容语义；Site 不拥有二进制、storage key、CDN / DNS provider credential、媒体尺寸真相或 Asset lifecycle。

P1 的远端 provider 是 `oes-managed-cloudflare`（Cloudflare R2 + Cloudflare CDN）。Site 管理端只配置 `mediaHost` 和单向的 local-to-remote 激活意图；DNS / TLS 由平台手工完成并由 Asset 验证，不能在 OES UI 中收集 provider credential。多租户 profile 扩展与客户自带 provider 以后续独立能力实现，不属于 P1。

## 3. Authoring And Selection

```text
Site Admin
  -> API Gateway / Site Management BFF
  -> asset-service: upload candidate or list authorized Site Media
  -> Site Admin selects stable assetId
  -> site-service persists only the asset reference and Site-owned usage semantics
```

- 外部客户端不直接调用对象存储、CDN control plane 或 Asset 内部 gRPC。
- BFF 完成 authenticated tenant target binding、permission 与 DTO / stream 编排；Asset 再次校验 tenant、scope、Asset state 与操作资格。
- Site Admin BFF 只把稳定 `assetId` 提交给 Site Service，不接受外链 URL 或 object key。
- Asset default alt 不会自动写入或覆盖 Site-owned locale alt。

## 4. Publication And Runtime Delivery

```text
Site formal Sync
  -> site-service resolves assetId + siteId with asset-service
  -> asset-service returns public-safe delivery facts
  -> site-service establishes publication protection
  -> site-service commits one target publishVersion public output
  -> Runtime syncs the target and atomically updates local publication
  -> Storefront reads local public view and requests CDN URL
```

- Inspiration Item 只可解析 image Asset。Category SEO / OG image 使用同一受控 image boundary；video 不适用于这些当前用途。
- Site public view 固定 Asset identity、delivery URL、原始 width / height 与 Site-owned locale alt。技术事实来自 Asset，alt 来自 Site。
- 同一 Asset identity 不得静默指向另一份二进制。替换图片必须改为新 Asset reference，随后由 Site 发布新 version；Hotspot geometry 与历史 public output 因而可重放。
- Runtime / Storefront 正常请求不实时调用 Asset Service，也不依赖短期签名 URL refresh。Runtime sync 失败时仍可读取 last complete Site publication，Asset 保护不得提前清理该 publication 的媒体。
- 对象存储是 Asset 管理的 origin，CDN 是 edge delivery；静态页面可以直接使用 CDN URL，但 OES 不因此管理其页面设计、源码或构建。
- Site 处于 `LOCAL_ONLY`、`REMOTE_CONFIGURING` 或 `MIGRATING` 时，正式 Sync 必须拒绝把 Site Media 写入公网 publication；本地 MinIO URL 只能用于草稿 / 预览。
- `REMOTE_READY` 只表示 DNS、TLS、origin isolation 与精确 purge 已验证；Site 明确激活后由 Asset 迁移未公开二进制，成功进入 `REMOTE_ACTIVE`。该迁移不可逆，不得把已公开 output 回退为本地 URL。
- resolver 必须带 `siteId`，以便 Asset 为对应 `SiteMediaDeliveryBinding` 返回 public-safe delivery URL。相同 Asset 如被多个 active Site 使用，Asset 管理每个 delivery mapping；下架需对全部 mapping 完成 origin block 与 purge。

## 5. Publication Reference Protection

- Site 在公开包含 Asset 的新 public view 前，为该 Asset 建立针对对应 publication 的保护。
- 保护覆盖当前 publication、Runtime last-complete 与 Site 支持保留窗口中仍可 target-addressable 的历史 publication。
- Site 只在某个 publication 不再被承诺读取后释放其保护。Site 草稿更改、latest 引用替换或 CDN request log 都不是提前释放依据。
- Asset 拒绝仍受保护 Asset 的 ordinary physical delete；服务间协调的具体 gRPC / event / outbox 细节需在 shared contract 阶段实现，但不得破坏上述不变量。

## 6. Archive, Takedown And Failure Reaction

| Asset action / fact                     | Asset behavior                                                                             | Site behavior                                                 |
| --------------------------------------- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------- |
| Archive                                 | 停止新选择，保持已公开 delivery                                                            | 既有 publication 正常；不绑定到新内容。                       |
| Resolve unavailable before publication  | 显式失败，不给 placeholder                                                                 | 完整性检查失败；资源不得进入新版本。                          |
| Takedown / quarantine                   | 对所有 active delivery mappings 先阻断 origin，再精确 CDN purge；确认后发布 lifecycle fact | 将受影响内容标记待处理 / degraded；运营员明确替换或取消发布。 |
| Ordinary delete request with protection | 拒绝                                                                                       | 先处理 / 释放已知引用。                                       |
| Forced physical delete                  | 记录高风险审计；可能使未知静态页面 URL 失效                                                | 处理已知受影响资源；不自动替换为其他媒体。                    |

- 合规、安全或侵权下架是 Asset Service 的受控动作，不是 Site 直接删 CDN 或对象存储。
- P1 Cloudflare adapter 将单个 immutable delivery URL 作为精确 purge 单位。provider 成功确认是 `UNAVAILABLE` 的必要条件，但已经下载或客户侧缓存的副本不能由 OES 收回。
- 对未知的静态页面直接引用，Asset 不能推断其仍在使用，因此已公开 Site Media 不自动物理删除；手动物理删除必须显示外部 404 风险并保留审计。

## 7. Availability Facts And Audit

- Asset 向已知 consumer 传播 [asset.site-media.availability.changed](../../contracts/events/asset-service.md) `eventVersion = 1`；其 `availabilityVersion` 是 Site 去重与拒绝过期事实的唯一 owner ordering，具体 CloudEvents envelope 与 payload 以 Asset event contract 为准。
- Site 在自身范围内记录 Item / Category / publication audit；Asset 记录 Asset lifecycle、delivery purge 与保护 / 释放 audit。任一服务不得写对方数据库。
- 调用和事实传播必须携带 tenant、operator（适用时）、trace 与审计关联；跨 tenant 或 scope mismatch 一律 fail closed。

## 8. Implementation Sequencing

1. Global Command 先关闭三个平台前置条件：shared gRPC generator / metadata consumption、跨服务 Event Bus + outbox delivery、`oes-managed-cloudflare` delivery / purge provider。当前进程内 EventEmitter、request body tenant / operator 与 S3 delete 不能替代这些能力。
2. Asset owner 先在 Asset truth source 与 [site-media.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/asset-service/site-media.md) 冻结可消费能力。
3. shared gRPC / event wire contract 已在 [site-media.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/asset-service/site-media.md#8-shared-grpc-and-event-wire-contract) 冻结；Capability owner 以此生成 types，并实现 Gateway/BFF adapter，不得从 avatar contract 临时复制字段。
4. Asset lane 实现 validation、local MinIO 与 Cloudflare R2 storage / delivery adaptor、单向 delivery binding migration、provider confirmation、reference protection 与 audit。
5. Site / Admin BFF lane 实现媒体域名意图、远端验证 / 激活入口、Asset selection、带 `siteId` 的 pre-publication resolution、publication protection / release 与 availability handling。
6. Runtime / Storefront lane 只消费同步后的 public-safe Asset projection；不得增加 request-time Asset fallback。
7. 按 Asset contract 的黑盒 acceptance 和 Site Inspiration P1 acceptance 执行跨端验收。

## 9. Deferred

- 全域 Asset Library / DAM taxonomy、跨业务统一媒体搜索与语义检索。
- IM、邮件、产品、生产、质检等来源的媒体可见性、promote-to-reusable 规则与跨域授权。
- 视频转码、多码率、流媒体、封面 / thumbnail pipeline。
- Site 静态页面的设计、页面生成、源码和构建治理。
- 自动 DNS provisioning、DNS provider credential 托管、租户自助接入任意存储 / CDN，以及多 CDN active-active。
