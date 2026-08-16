# ADR 0012: Site Media Delivery And Purge

## Status

Accepted — 2026-07-26

## Context

OES 的 Site 可能早于完整 OES 平台上线。开发阶段需要零云成本的本地媒体工作流；一旦 Site Media 进入正式公网 publication，又必须提供长期稳定 URL、私有 origin、全球交付、精确 purge 和可审计的强制下架。

现有 Asset Service 只有 S3-compatible object storage adapter 和本地 MinIO 约定。直接将 MinIO URL、裸 bucket URL、短期签名 URL 或 origin delete 视为生产交付，会破坏 Site Runtime 的离线 public view、历史 publication 可重放和 takedown 完成语义。让租户管理员在业务页面填写任意 DNS、bucket 或 CDN credential 又会把高权限密钥、provider 差异和 purge 可靠性带入业务域。

## Decision

### P1 provider and topology

- P1 远端 Site Media 固定使用 OES 管理的 Cloudflare R2 作为私有 S3-compatible object origin，Cloudflare edge delivery mapping + CDN 作为公开 edge。
- 每个远端 Site 使用经过验证的 `media.<site-domain>`；正式 URL 使用 `https://media.<site-domain>/v1/site-media/<assetId>/<checksum>.<extension>`。
- object storage 保留二进制真相；CDN 只承担公开缓存和交付。Cloudflare edge mapping 将公开 path 映射到内部 origin key，且不在公开请求时调用 Asset Service；浏览器不获得 bucket endpoint、storage key 或 credential。R2 development URL 与原始 bucket endpoint 不得对公网启用。
- P1 单文件远端上限为 512 MiB，cache key 仅包含 host + path，URL 使用 `Cache-Control: public, max-age=31536000, immutable`。query、cookie、authorization、设备和地域不产生额外的同 Asset cache key。

### One-way site binding

- Asset Service 拥有 `SiteMediaDeliveryBinding` 的技术状态、迁移、delivery mapping 与审计；Site Service 拥有该 Site 的媒体域名意图和激活授权。
- binding 只能单向经过 `LOCAL_ONLY -> REMOTE_CONFIGURING -> REMOTE_READY -> MIGRATING -> REMOTE_ACTIVE`。
- `LOCAL_ONLY` 使用 MinIO，只允许草稿、预览、开发和测试，禁止正式公网 publication。
- 平台手工完成 DNS / TLS / R2 配置后，Asset 验证 DNS、TLS、origin isolation 和精确 purge，才进入 `REMOTE_READY`。
- Asset 仅迁移未正式公开的本地媒体；复制后必须验证 checksum。`REMOTE_ACTIVE` 不可回退 local。
- 若同一 Asset 被多个 active Site 引用，Asset 为各 Site 管理 delivery mapping；每一份 mapping 都必须交付相同 checksum 的二进制。

### Takedown and provider confirmation

- 强制下架先阻断每个 active delivery mapping 的 origin，再以 immutable URL 发起精确 Cloudflare purge。
- 只有所有 purge 均获得 provider 成功确认后，Asset 才可将 delivery 标记为 `UNAVAILABLE` 并发布 availability fact。
- timeout 或 provider error 进入持久化的 purge-pending retry；重试保持 operation id 和 audit correlation。origin 已阻断但 purge 未确认不是完成下架。
- 已下载文件和用户 / 第三方客户端缓存不能被收回；ordinary delete 仍受 publication protection、留存与审计约束。

### Operations and cost

- Asset 必须记录每个 mapping 的 provider acknowledgement、retry、failure、confirmation latency 与未完成 operation，并向 Platform 输出相应指标；credential 与 storage key 不进入日志或审计。
- P1 不实现租户自助 provider billing。Platform 以 R2 storage / operation、CDN cache hit 与 purge volume 指标观察成本；R2 的存储与操作按量收费、公开数据 egress 不收费，实际费率以 Cloudflare 当前定价为准。

### Configuration and tenancy

- P1 不实现 DNS provider API、租户自助 provider credential、任意 endpoint 或多 CDN active-active。DNS / TLS 在 Cloudflare 控制台或受控基础设施配置中手工完成。
- 站点管理员只能提交 `mediaHost` 和 local-to-remote 激活意图；Asset / Site 数据库不保存 R2、Cloudflare 或 DNS secret。
- R2 object credential 和 Cloudflare Cache Purge token 只注入持久化 Asset control plane 的运行环境。DNS write credential（若未来使用）只属于独立基础设施流程，不属于 Asset runtime。
- 数据模型预留 `tenantId + siteId -> deliveryProfileId`，P1 唯一可激活 profile 为 `oes-managed-cloudflare`。未来客户自带 R2 / Cloudflare 或 S3 / CloudFront 必须作为平台审核的 profile + adapter 加入，不能由租户管理员直接填 credential。

## Consequences

- Site Media resolver、upload 和 list 操作必须带 `siteId`，以生成和验证正确的 Site delivery mapping。
- Site 可以在完整 OES 上线前使用远端媒体，但 Asset metadata、迁移 operation、takedown audit 和 provider credential 必须运行在持久化的最小 Asset control plane，不能留在开发者电脑。
- Asset domain 新增 delivery/purge port；本地 direct delivery adapter 只能服务 local profile，生产 adapter 不允许 no-op purge、裸 storage URL 或 request-time signing fallback。
- Site / Asset public contract、协同蓝图、API Gateway BFF、Asset / Site 实现和跨服务 acceptance 都需要随之更新；当前 ADR 不授权实施或基础设施 provisioning。

## Alternatives Considered

### 继续使用 MinIO 或裸对象存储 URL 直到完整 OES 上线

Rejected，因为公网访客无法访问开发者 localhost，且后续 URL 迁移会破坏已发布 Site output，无法满足受控下架。

### 让每位租户管理员直接配置任意 bucket、CDN endpoint 与密钥

Rejected，因为平台无法稳定保证 origin isolation、精确 purge、审计和 provider 权限边界；这也会将高权限密钥带入业务配置。

### P1 同时实现 Cloudflare、CloudFront 与多 CDN failover

Rejected，因为当前没有实际流量或合规证据支撑其复杂性。端口隔离保留 portability，但 P1 只实现一种受控 profile。

### 用短期签名 URL 或请求时 Asset resolver 代替长期 delivery URL

Rejected，因为 Runtime / Storefront 的离线 public view、静态产物与历史 publication 不能依赖请求时刷新或 Asset Service 可用性。

## Related Documents

- [asset-service.md](../architecture/services/asset-service.md)
- [site-service.md](../architecture/services/site-service.md)
- [site-media.md](../contracts/asset-service/site-media.md)
- [site-asset-media.md](../architecture/collaborations/site-asset-media.md)
- [Cloudflare R2 custom-domain cache documentation](https://developers.cloudflare.com/cache/interaction-cloudflare-products/r2/)
- [Cloudflare cache purge documentation](https://developers.cloudflare.com/cache/how-to/purge-cache/)
- [Cloudflare R2 pricing documentation](https://developers.cloudflare.com/r2/pricing/)
