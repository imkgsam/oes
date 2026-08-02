# Avatar Asset Contract

## Scope

本文档定义 `asset-service` 当前第一版头像资产切片的黑盒契约，描述内部调用方如何上传头像、绑定账号资料、替换旧头像并获取稳定展示地址。

## Product Flow Constraints

- 头像文件本体必须进入受控对象存储，不允许前端或 BFF 直接保存任意外链 URL 作为业务真相。
- 当前账号头像资产引用边界以 [identity-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/identity-service.md) 为准；`identity-service` 不拥有对象存储写入逻辑。
- 头像上传与账号资料更新是两步流程：
  - 先上传头像候选资产
  - 再由资料更新链路绑定到当前账号
- 旧头像替换只能在新头像绑定成功后发生，避免“上传成功但资料未保存”导致当前头像被提前替换。

## Trusted Execution Contract

- 五个既有 Asset RPC 的唯一 audience 是 `urn:oes:service:asset-service`，当前直接 workload 只有环境注册的 `spiffe://<trust-domain>/ns/oes/sa/api-gateway`。
- Gateway 必须使用当前 mTLS workload identity、certificate-bound ExecutionToken、`x-request-id`、`traceparent` / `tracestate` 与统一审计 metadata；不得继续使用 shared signed operator context。
- `UploadAccountAvatar` 与 `BindAccountAvatar` 固定为 `SELF_SERVICE`，`allowDelegated = false`。它们只允许已验证 `HUMAN`，不建立已退出 active catalog 的 self-profile Permission Code。
- `ResolveAssetPublicUrl` 固定为 `INTERNAL asset.internal.avatar.resolve_public_url`。STS 只允许 `api-gateway -> urn:oes:service:asset-service -> asset.internal.avatar.resolve_public_url`；没有 wildcard，也不为未来 caller 预授权。
- Asset 正常验证在本地完成，不在每次 RPC 调 Auth；Token / workload / mode 校验失败时不得读取 request body 或 legacy header 兜底。

## Operations

### `UploadAccountAvatar`

- Purpose: upload one avatar candidate asset for the current authenticated account.
- Current caller: `api-gateway` 的 `AuthController -> AccountAvatarUploadUseCase -> AssetGrpcAdapter`。
- Control model: `SELF_SERVICE`，`allowDelegated = false`；target account 从可信 HUMAN subject 派生。
- Input semantics:
  - `file`
  - `fileName`
  - `contentType`
- Trusted context semantics:
  - `scopeLevel` 与 optional `tenantId` 来自 verified ExecutionToken
  - `accountId` 来自 verified HUMAN subject 对应的当前 `UserAccount`
  - operator / audit attribution 来自 trusted execution context
  - `category = ACCOUNT_AVATAR` 由 RPC 固定，不接受 caller 选择
- Ownership constraints:
  - `TENANT` context must carry a valid `tenantId`
  - `SYSTEM` context must not carry a tenant
  - the uploaded asset must be owned by the current authenticated account under the trusted scope
  - request body 中不得保留或兼容读取 `scopeLevel`、`tenantId`、`accountId`、`operatorId`
- Validation baseline:
  - allowed MIME types: `image/jpeg`, `image/png`, `image/webp`
  - max size: `2MB`
  - server-side file header and image decode validation required
- Response fields:
  - `assetId`
  - `publicUrl`
  - `mimeType`
  - `size`
  - `status = PENDING_BIND`

### `BindAccountAvatar`

- Purpose: finalize one uploaded avatar asset as the current account avatar after profile update succeeds.
- Current caller: `api-gateway` 的 `AuthController -> AccountProfileUseCase -> AssetGrpcAdapter`。
- Control model: `SELF_SERVICE`，`allowDelegated = false`；target account 从可信 HUMAN subject 派生。
- Input semantics:
  - `newAssetId`
  - `previousAssetId` optional
- Behavior constraints:
  - `newAssetId` must belong to the same trusted `scopeLevel`, trusted `tenantId`, and derived current account
  - `SYSTEM` binding must not reuse a tenant-owned asset
  - `TENANT` binding must not reuse a system-owned asset or an asset from another tenant
  - the previous active avatar asset, if any, is marked `REPLACED`
  - replaced assets enter controlled cleanup flow instead of immediate blind hard-delete
  - request body 中不得保留或兼容读取 `scopeLevel`、`tenantId`、`accountId`、`operatorId`
- Response fields:
  - `activeAssetId`
  - `publicUrl`
  - `replacedAssetId` optional

### `ResolveAssetPublicUrl`

- Purpose: resolve one asset display URL from a controlled asset reference.
- Current callers: `api-gateway` 的 `SessionContextUseCase` 与 `PersonalCenterSummaryAdapter`，均经 `AssetGrpcAdapter` 建立 metadata。
- Control model: `INTERNAL asset.internal.avatar.resolve_public_url`；只有精确 Gateway workload issuance policy 可以申请。
- Input semantics:
  - `assetId`
- Behavior constraints:
  - `assetId` is a legitimate business target, not an identity source.
  - Asset loads scope / tenant / owner / status facts and compares them with the trusted context before returning a URL.
  - SYSTEM context cannot resolve a tenant asset; TENANT context cannot resolve another tenant or SYSTEM-owned asset.
- Response fields:
  - `assetId`
  - `publicUrl`
  - `status`

## Data Ownership

- `asset-service` owns:
  - `assetId`
  - `storageKey`
  - `mimeType`
  - `size`
  - `checksum`
  - `category`
  - `scopeLevel`
  - `ownerAccountId`
  - `tenantId` nullable for `SYSTEM`
  - `status`
  - `publicUrl`
- `identity-service` owns:
  - `UserAccount.avatarAssetId`
- `auth-bff` owns:
  - external HTTP orchestration only

## Status Model

- `PENDING_BIND`
  - 上传成功，但尚未绑定到账号资料
- `ACTIVE`
  - 当前正在被账号资料引用
- `REPLACED`
  - 已被新头像替换，等待清理
- `DELETED`
  - 已从对象存储与元数据视图中完成清理

## Storage Constraints

- 底层对象存储实现必须通过 S3-compatible 抽象接入
- 本地开发使用 `MinIO`
- 生产可切换到 `S3 / OSS / COS`，不修改上层契约
- 存储 key 必须按 scope 分层，不能把 `SYSTEM` 账号头像落入 tenant 路径
  - `TENANT`: `avatar/tenant/<tenantId>/<accountId>/<file>`
  - `SYSTEM`: `avatar/system/<accountId>/<file>`

## Caller And Fixture Migration

- Gateway producer replaces `GrpcMetadataPropagationFactory` / signed operator metadata with the common trusted execution metadata provider and requests `aud=urn:oes:service:asset-service`.
- Account upload / bind request DTOs delete `scopeLevel`、`tenantId`、`accountId`、`operatorId`; generated caller, use-case mapping and Asset Controller compile-repair in one Asset cutover.
- `ResolveAssetPublicUrlRequest` retains only `assetId`, but its caller must request the exact INTERNAL Code and preserve trusted subject / tenant / request / trace attribution.
- `auth.integration.spec.ts` 的 fake Asset server、account avatar use-case specs、session-context specs 与 personal-center adapter specs 必须使用可信 metadata / context fixture；不得继续用 body identity 或 legacy signer 让测试通过。
- 当前静态扫描没有发现另一个 OES service、Cron、AI、Robot 或 worker 直接调用这三个 RPC；新增 caller 必须先更新本契约与 STS policy。
