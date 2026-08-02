# asset-service 职责卡

## 1. Purpose

`asset-service` 是 OES 的受控资产与对象存储编排服务，负责回答“平台受控文件资产如何上传、持久化、绑定、交付、下架与对外暴露”。

当前已冻结账号头像、员工公开展示照片与 tenant-scoped Site Media 三个受控切片。服务边界按长期资产服务方向建立，不把头像上传临时塞回 `auth-bff`、`identity-service` 或 `hr-service`，也不把 Site 图片 / 视频文件真相塞回 `site-service`。

## 2. Owns

- 受控文件资产元数据真相
- 对象存储写入、备份 / 容灾策略、删除与 CDN public delivery 生成语义
- 资产归属、分类、scope、状态与替换生命周期
- 资产上传校验基线：
  - MIME 白名单
  - 按受控媒体类型的文件大小、像素 / 时长等容量限制
  - 文件头与实际图片 / 视频解析校验
- 资产公开交付、归档、下架 / 隔离、物理删除与 CDN purge 生命周期
- 已知业务消费者的 published reference protection 与保留期释放
- 资产上传、选择、绑定、交付状态与生命周期相关审计事实

## 3. Does Not Own

- 登录、认证、会话与安全挑战真相
- 用户、账号与身份映射真相
- 个人中心前端聚合返回模型
- 任意业务域对象的展示资料真相
- Site 的 Inspiration Item / Category、locale alt、SEO、排序、Hotspot、发布版本或同步真相
- 前端可直接信任的任意外链 URL
- 当前不拥有全域 DAM taxonomy、跨域媒体语义搜索，或 IM / 邮件 / 质检等业务对象的可见性真相；这些是独立后续设计主题

## 4. Core Responsibilities

- 为内部调用方提供受控资产上传能力
- 维护资产元数据记录与对象存储 key 映射
- 以 `scopeLevel + tenantId? + ownerAccountId / ownerEmployeeId` 表达资产归属，而不是把所有头像资产都硬绑定到 tenant 或 account
- 为 tenant-scoped Site Media 表达受控站点交付资格；它可以被获授权的同 tenant Site 使用，但不因此拥有 Site 或页面内容
- 生成稳定 `assetId` 与不可静默换二进制的 CDN public delivery URL；替换媒体必须产生或选择另一个 `assetId`
- 在发布期解析 public-safe 技术事实。图片至少提供稳定身份、图片 URL、媒体类型、状态与原始宽高；视频额外提供经校验的时长与编码事实
- 在资产绑定完成后执行旧资产替换与清理编排
- 对已知 published consumer 在其当前、last-complete 与仍受支持的历史 publication 中保持的引用实施删除保护
- 以归档、下架 / 隔离、物理删除区分“停止新选择”“停止公开交付”和“移除二进制”；下架由 Asset 编排 origin block 与 CDN purge，不由业务服务直连 CDN 或对象存储
- 以 S3-compatible 抽象隔离底层对象存储厂商差异

## 5. External Interfaces

- 典型上游入口：
  - `api-gateway` / `auth-bff`
  - `api-gateway` / HR management BFF
  - `api-gateway` / Site Management BFF
  - 未来其他需要受控文件资产的系统服务
- 典型契约位置：
  - [avatar.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/asset-service/avatar.md)
  - [employee-official-photo.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/asset-service/employee-official-photo.md)
  - [site-media.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/asset-service/site-media.md)

## 6. Upstream Dependencies

- `identity-service`
  - 提供账号与操作者上下文中的绑定目标语义，但不拥有资产元数据
- `auth-bff`
  - 为 web / app 客户端编排头像上传与资料更新流程
- S3-compatible object storage
  - 例如本地 `MinIO`、生产 `S3 / OSS / COS`
- CDN / delivery provider
  - P1 远端交付冻结为 OES 管理的 `Cloudflare R2 + Cloudflare CDN`；公开 delivery 从受控对象存储 origin 分发，CDN 是缓存与边缘交付层，不是资产二进制真相或唯一备份

## 7. Downstream / Published Facts

- 资产是否存在、属于谁、当前处于什么生命周期状态
- 当前资产属于 `SYSTEM` 还是 `TENANT` scope，以及对应的 tenant 归属
- 当前资产的 `publicUrl`
- 当前归属对象的头像替换结果
- Site Media 的 authorized resolve / selection summary、公开交付状态与技术事实
- [asset.site-media.availability.changed](../../contracts/events/asset-service.md) 等可供已知 consumer 消费的 Asset lifecycle facts
- 资产上传、绑定、替换、归档、下架与删除相关审计事实

## 8. Non-goals

- 不在第一版直接做通用附件中心
- 不在本切片承接文档、合同、聊天附件等通用附件平台语义
- 不把图片处理、裁剪、转码、多码率、流媒体、封面抽取或复杂变体流水线一次性做全
- 不让业务服务直接依赖具体云厂商 SDK 细节

## 9. Scope-aware Avatar Boundary

- 当前第一版头像资产服务采用 `scope-aware` 归属模型，而不是 `tenant-only` 模型。
- `TENANT` scope 头像资产必须携带：
  - `scopeLevel = TENANT`
  - `tenantId`
  - `ownerAccountId`
- `SYSTEM` scope 头像资产必须携带：
  - `scopeLevel = SYSTEM`
  - `tenantId = null`
  - `ownerAccountId`
- 当前账号头像上传是“当前 account 自助编辑当前 account profile”的一部分，因此系统账号与租户账号都应支持头像上传与绑定；差异只体现在资产归属 scope，而不是体现在是否允许使用该功能。
- 员工公开展示头像上传是“HR / 租户管理员维护 Employee 正式公开照片”的一部分，因此必须使用员工维度 owner，不得复用账号头像 owner 语义。
- 对象存储 key 也必须按 scope 分层，避免把 system 账号头像硬塞进 tenant 路径：
  - tenant avatar: `avatar/tenant/<tenantId>/<accountId>/...`
  - system avatar: `avatar/system/<accountId>/...`
  - employee official photo: `avatar/tenant/<tenantId>/employee/<employeeId>/official/...`

## 10. Site Media Boundary

Site Media 是 `asset-service` 内可由 Site consumer 使用的 tenant-scoped 图片 / 视频资产切片，不是 `site-service` 的文件能力，也不是全域附件平台。

- Site 管理客户端只能通过 API Gateway / BFF 使用 Asset 能力；Gateway、Site Service 与其他内部 caller 必须通过可信 gRPC metadata 携带 mTLS workload identity、ExecutionToken、request / trace 与 audit context。Asset 在服务端再次校验 RPC mode、audience、Permission Code、tenant、资产状态与操作资格。
- Site consumer 可以上传新的 Site Media candidate，或在其 tenant 内选择已授权的 Site Media；不得提交任意外链 URL、对象存储 key 或伪造的技术元数据。
- 当前 Site Inspiration 只可引用受控图片；未来静态页面或其他已冻结 Site consumer 可以使用受控图片或视频，但 Asset 不拥有页面设计、构建产物或页面发布真相。
- P1 图片只接受 `JPEG / PNG / WebP`；P1 视频只接受浏览器可直接播放的 `MP4` / `H.264` / `AAC` 组合。服务端必须解析实际二进制，而不是相信扩展名或声明 MIME。数值容量限制是 Asset 的可配置治理策略，不是 Site 页面规则。
- Site Media public delivery 是长期可访问、内容不可静默替换的 CDN URL。公开站点可以直接请求该 URL，不在 request-time 调用 Asset Service；对象存储 key、credential 与内部 provider 细节不得泄漏。
- 受控对象存储保存二进制真相，CDN 负责缓存和边缘分发。备份、对象版本与跨区域容灾属于 Asset 的存储治理，不要求 OES 应用数据库保存第二份文件二进制。
- 已公开 Site Media 不做自动物理删除，因为外部静态页面可以直接保留 CDN URL 且 OES 不拥有这些页面。Asset 可以归档它以阻止新选择；物理删除是高权限、可审计的治理动作。
- 已被 OES 已知 publication 引用的媒体，在 consumer 正式释放其当前、last-complete 与仍受支持的历史 publication 引用前，普通删除必须拒绝。该规则不依赖 CDN request log 推断引用关系。
- 下架 / 隔离用于侵权、敏感内容或安全事件。Asset 必须阻断 origin delivery、请求精确 CDN purge，并在 provider 确认后发布可用性变化事实。已下载副本和客户侧缓存不属于 Asset 可收回的控制范围。
- 已知 consumer 必须把下架 / 隔离 / 删除作为明确事实处理；Asset 不返回任意占位 URL 伪装为原资产，也不替 Site 自动替换业务内容。

### 10.1 Site Media Delivery Binding

每个 Site 的 Site Media 交付使用一个由 Asset 管理的 `SiteMediaDeliveryBinding`。它以 verified `tenantId + siteId` 绑定选择的媒体交付路径、公开媒体 host、当前状态与迁移审计；Site 仅拥有操作者配置的站点归属和公开域名意图，不拥有 provider credential、bucket 或 CDN control plane。

P1 状态只允许单向推进：

```text
LOCAL_ONLY -> REMOTE_CONFIGURING -> REMOTE_READY -> MIGRATING -> REMOTE_ACTIVE
```

- `LOCAL_ONLY` 使用本地 `MinIO`，只可用于草稿、预览、开发和测试；不得生成正式公网 Site publication。
- 远端媒体域名、DNS、TLS、R2 origin 与精确 purge 验证通过前，binding 不能进入 `REMOTE_READY`；验证失败保持或回到 `LOCAL_ONLY`，不产生半切换的公开 URL。
- `MIGRATING` 只复制尚未正式公开的本地 Site Media 到远端对象存储，并以 checksum 验证二进制未改变；成功后才进入 `REMOTE_ACTIVE`。
- `REMOTE_ACTIVE` 不允许回到本地。已经公开的 URL 绝不被改写为 localhost、原始对象存储 endpoint 或另一媒体域名。
- 同一 Asset 可以按 Site delivery binding 获得不同公开 host，但每个 delivery mapping 必须指向 checksum 相同的二进制；下架必须阻断并 purge 该 Asset 的全部 active public delivery mappings。

### 10.2 Provider, Namespace And Cache Policy

P1 只实现 `oes-managed-cloudflare` 远端 profile：Cloudflare R2 是私有 S3-compatible origin，Cloudflare edge delivery mapping + CDN 以该 Site 已验证的 `media.<site-domain>` 交付。edge mapping 只将 immutable public namespace 映射到 Asset 管理的内部 origin key，不在公开请求时调用 Asset Service；R2 development URL 与原始 bucket endpoint 不得对公网启用。DNS provider 集成、租户自助输入第三方 access key、任意 endpoint 和多 CDN active-active 都不属于 P1。

- 公共 namespace 固定为 `https://media.<site-domain>/v1/site-media/<assetId>/<checksum>.<extension>`；该 delivery path 不是 storage key，origin key 保持 Asset 内部映射。
- URL 的 host + path 是唯一 cache key；query、cookie、授权 header、地域或设备类型不得产生同一 Asset 的另一个 cache key。响应使用 `Cache-Control: public, max-age=31536000, immutable`，并保留正确 `Content-Type`、`X-Content-Type-Options: nosniff` 与受控的跨域策略。
- P1 受 Cloudflare 非 Enterprise cacheable object limit 约束，Asset 的远端 Site Media 单文件上限不得超过 `512 MiB`；更高上限必须先重新冻结 provider plan 与容量策略。
- Asset domain 通过 `AssetDeliveryPurgePort` 隔离 URL delivery、origin blocking、精确 purge 与 provider acknowledgement；业务服务、BFF、Runtime 和 Storefront 不得直连 Cloudflare 或 R2 control plane。
- Provider 承认 purge 的成功响应才是 `UNAVAILABLE` 完成前置条件；P1 默认使用精确 URL purge。将来有多个 derivative URL 时可以在相同 port 内加入 cache tag purge，不改变业务契约。
- 下架 operation 以稳定 idempotency key 持久化。origin 已阻断但任一 mapping purge timeout / failure 时保持 `PURGE_PENDING` 并退避重试；全部 mapping 收到 provider acknowledgement 前不得发布 `UNAVAILABLE`。审计记录 mapping、attempt、provider request identifier（如有）、结果、时间与 trace，但不得记录 credential 或 storage key。

### 10.3 Configuration, Secrets And Future Tenant Profiles

P1 不在 OES UI 中管理 DNS 服务商账号。站点管理员只提交 `mediaHost` 与“启用远端媒体”的意图；平台管理员在 Cloudflare 控制台或受控部署配置中完成 DNS / TLS / R2 配置后，由 Asset 执行验证。

- 本地 profile 使用现有 MinIO 配置；远端 profile 使用 R2 S3 endpoint、bucket、public media host、Cloudflare zone id 与 provider profile reference。
- R2 object read/write credential 与 Cloudflare `Cache Purge` token 只注入 Asset Service 的受控运行环境，不能进入 Site / Asset 业务数据库、前端、日志或 Git；DNS write credential 若未来需要，只供独立基础设施流程使用，不能交给 Asset runtime。
- Platform 观察 R2 storage / operation、CDN cache hit、purge request / acknowledgement / retry / failure、确认延迟和未完成下架指标；P1 不实现租户自助 billing 或 provider cost split。
- 远端公开站点可以早于完整 OES 上线，但其 Asset control plane 与 Asset metadata database 必须是持久化的，不能依赖开发者电脑保存公开 Asset identity、下架操作或审计。
- 架构预留 `tenantId + siteId -> deliveryProfileId`，但 P1 唯一可激活的远端 profile 是 `oes-managed-cloudflare`。客户自带 R2 / Cloudflare 或 S3 / CloudFront 仅在未来作为平台审核的 profile 与 adapter 加入；租户管理员不得自助录入凭据。

### 10.4 Trusted RPC Execution Boundary

Asset + Site Media 是可信 gRPC 全仓 capability 的第一个业务优先 service slice；完成本切片不代表全仓迁移关闭。

- Asset Controller 只从公共 server runtime 的不可变 `TrustedExecutionContext` 读取 principal、tenant、org、workload、request 与 trace；request body 中的 `tenantId`、`scopeLevel`、`operatorId` 或同义字段不能建立身份或授权。
- Admin-facing upload、list、archive、takedown、delete 与 delivery management 使用 `BUSINESS` mode 和对应 `asset.site_media.*` Permission Code。
- Site Service 的 publication resolve / protect / release 使用 `INTERNAL` mode 与 `asset.internal.site_media.*` Code；这些技术原语不能独立替代 Site 的业务 Sync 授权。
- 合法 `siteId`、`assetId` 与 `targetTenantId` 可以保留为业务目标。Asset 必须加载自身拥有的归属事实，并把目标 tenant 与可信 context 比较；SYSTEM principal 不获得隐式 tenant wildcard。
- Asset 不接受上游 Site audience Token。Site 调 Asset 前必须通过 Auth / STS 换取 `aud=asset-service`、绑定 Site workload 的 Token。
- cutover 同时删除所有已纳入 Asset/Site 路径的 body identity、legacy signed operator header、controller fallback 与 fixture fallback；不得长期双读。

完整传输信任规则以 [14-grpc-metadata-and-service-trust-architecture.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/14-grpc-metadata-and-service-trust-architecture.md) 为准，黑盒媒体能力以 [site-media.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/asset-service/site-media.md) 为准。

### 10.5 Avatar And Employee Official Photo Trusted RPC Cutover

头像与员工正式照片是本服务与 Site Media 并列的既有受控资产切片；它们在可信 gRPC 切换中保持各自的业务语义，不因为共享底层 Asset metadata 而合并为同一授权模式。

| RPC                           | 唯一 mode      | 冻结授权 / 目标语义                                                                                                                                                                                    |
| ----------------------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `UploadAccountAvatar`         | `SELF_SERVICE` | `allowDelegated: true`。当前账号只从可信执行主体的 canonical account subject 派生；不得提交或覆盖 `accountId`。这是低风险资料媒体操作，DELEGATED 仍须经过有效的人类、delegation 和 ToolContract 上限。 |
| `BindAccountAvatar`           | `SELF_SERVICE` | `allowDelegated: true`。当前账号同样只从可信 subject 派生；`newAssetId` 和可选 `previousAssetId` 是业务引用，Asset 必须校验其 scope / tenant / owner 与派生账号一致。                                  |
| `UploadEmployeeOfficialPhoto` | `BUSINESS`     | `all: [hr.employee.create]`。该现有 active Code 已是 Gateway 员工正式照片入口的唯一权限门；`employeeId` 保留为业务目标，Asset 以可信 tenant 校验目标 Employee 与候选 Asset。                           |
| `BindEmployeeOfficialPhoto`   | `BUSINESS`     | `all: [hr.employee.create]`。绑定会改变 Asset lifecycle，不能降格为技术旁路；保留 `employeeId`、`newAssetId` 与可选 `previousAssetId` 作为业务引用，并重复 tenant / owner 校验。                       |
| `ResolveAssetPublicUrl`       | `INTERNAL`     | `all: [asset.internal.avatar.resolve_public_url]`。这是已完成上游读路径授权后的受限 public-delivery projection；只由精确获准 workload 申请，不能加入 HUMAN / MACHINE 业务角色。                        |

所有五个 RPC 都只接受 `aud=urn:oes:service:asset-service`、当前 channel mTLS workload identity 与由 Auth / STS 签发且绑定该 workload 的 ExecutionToken。`scopeLevel`、`tenantId` 与 `operatorId` 从请求体删除：scope / tenant 来自可信执行上下文并由 Asset 对已加载的归属事实复核；审计使用可信 subject、DELEGATED actor / delegation（如有）、workload、request 与 trace。`accountId` 从两个账号头像请求体删除；`employeeId` 是 Employee official photo 的合法业务目标而保留。`assetId`、`newAssetId` 与 `previousAssetId` 均为业务引用而不是身份来源。

当前直接调用 workload 是 `api-gateway`（其中包含 auth-bff 与 HR management modules）。它必须对两个账号头像 RPC 使用统一 metadata producer 的 SELF_SERVICE exchange；对两个员工照片 RPC 使用 `BUSINESS` exchange，精确申请 `hr.employee.create`；对 URL resolve 使用 INTERNAL exchange，精确申请 `asset.internal.avatar.resolve_public_url`。Auth / STS 的 deployment registry 只为已注册的 `api-gateway` workload 发放上述 `aud=asset-service` Token；未来新增 direct caller、worker 或 workload 必须先冻结其独立 workload-to-audience issuance policy，不共享或放宽该 policy。

本节是五个 legacy avatar / official-photo RPC 的唯一 Asset mode mapping。切换同时移除 legacy signed operator metadata、request-body identity 信任、controller fallback 与依赖它们的 fixture；不得双读。

Site Media 的完整黑盒交互以 [site-media.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/asset-service/site-media.md) 为准；跨服务发布保护与消费行为以 [site-asset-media.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/collaborations/site-asset-media.md) 为准。
