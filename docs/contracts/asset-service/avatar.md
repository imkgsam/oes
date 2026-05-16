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

### `UploadAccountAvatar`

- Purpose: upload one avatar candidate asset for the current authenticated account.
- Callers: trusted internal services such as `auth-bff`.
- Control model: internal service call with authenticated operator context and current account binding target.
- Input semantics:
  - `scopeLevel`
  - `tenantId` optional
  - `accountId`
  - `operatorId`
  - `category = ACCOUNT_AVATAR`
  - `file`
- Ownership constraints:
  - `TENANT` context must carry a valid `tenantId`
  - `SYSTEM` context must send `tenantId = null`
  - the uploaded asset must be owned by the current authenticated `accountId` under the submitted scope
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
- Callers: trusted internal services such as `auth-bff`.
- Control model: internal service call with authenticated operator context.
- Input semantics:
  - `scopeLevel`
  - `tenantId` optional
  - `accountId`
  - `operatorId`
  - `newAssetId`
  - `previousAssetId` optional
- Behavior constraints:
  - `newAssetId` must belong to the same `scopeLevel`, `tenantId`, and `accountId`
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
- Callers: trusted internal services building account-oriented read models.
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
