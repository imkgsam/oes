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

## Operations

### Trusted Execution Cutover

所有本节 RPC 都通过当前 channel 的 mTLS `VerifiedWorkloadIdentity` 与 `aud=urn:oes:service:asset-service` 的 Auth / STS `ExecutionToken` 建立上下文。legacy signed operator metadata、`scopeLevel`、`tenantId`、`accountId` 与 `operatorId` 请求字段在本切片切换时一并删除；它们不能作为 identity、scope 或授权依据。

- 当前 direct caller 是 `api-gateway` 的 auth-bff module；它只能以已注册的 `api-gateway` workload 取得本服务 audience Token。未来 service / worker 不能复用这一 issuance policy，必须先冻结自己的精确 workload policy。
- `UploadAccountAvatar` 与 `BindAccountAvatar` 均声明 `SELF_SERVICE`，`allowDelegated: true`。当前 account target 固定从可信 ExecutionToken subject（Gateway 已建立的 canonical account principal）派生。DELEGATED 保持该 human account subject，另以 actor / delegation 归因；MACHINE 不可调用。
- 不再请求 BUSINESS Permission Code；调用方使用统一 metadata producer 的 `forSelfServiceCall('urn:oes:service:asset-service')`。Asset 仍校验派生账号、可信 tenant / scope 与自身 Asset ownership facts。
- `ResolveAssetPublicUrl` 声明 `INTERNAL all: [asset.internal.avatar.resolve_public_url]`。调用方使用 `forInternalCall('urn:oes:service:asset-service', ['asset.internal.avatar.resolve_public_url'])`；该 INTERNAL Code 不得进入 HUMAN / MACHINE role，且只有 Auth / STS registry 已明确允许的 `api-gateway` workload 可申请。
- `assetId`、`newAssetId` 与可选 `previousAssetId` 保留为业务引用；Asset 在 server side 加载并验证它们。响应中的 asset scope / tenant / owner 是资源事实，不构成下一次调用的可信输入。审计从 trusted subject、DELEGATED actor / delegation（如有）、direct workload、requestId 与 trace 取得。

### `UploadAccountAvatar`

- Purpose: upload one avatar candidate asset for the current authenticated account.
- Callers: `api-gateway` auth-bff module through its registered workload identity.
- Control model: `SELF_SERVICE` (`allowDelegated: true`); current account binding target is derived from trusted context.
- Input semantics:
  - `category = ACCOUNT_AVATAR`
  - `file`
  - `fileName`
  - `contentType`
- Ownership constraints:
  - `TENANT` / `SYSTEM` scope is derived from trusted context and verified account facts, not a request field
  - the uploaded asset must be owned by the trusted current account under that derived scope
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
- Callers: `api-gateway` auth-bff module through its registered workload identity.
- Control model: `SELF_SERVICE` (`allowDelegated: true`); current account binding target is derived from trusted context.
- Input semantics:
  - `newAssetId`
  - `previousAssetId` optional
- Behavior constraints:
  - `newAssetId` must belong to the same trusted derived scope, tenant and current account
  - `SYSTEM` binding must not reuse a tenant-owned asset
  - `TENANT` binding must not reuse a system-owned asset or an asset from another tenant
  - the previous active avatar asset, if any, is marked `REPLACED`
  - replaced assets enter controlled cleanup flow instead of immediate blind hard-delete
- Response fields:
  - `activeAssetId`
  - `publicUrl`
  - `replacedAssetId` optional

### `ResolveAssetPublicUrl`

- Purpose: resolve one asset display URL from a controlled asset reference.
- Callers: `api-gateway` account-oriented read models through the exact INTERNAL issuance policy.
- Control model: `INTERNAL all: [asset.internal.avatar.resolve_public_url]`; it does not grant a business role or accept a caller-selected tenant / account.
- Input semantics:
  - `assetId`
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
