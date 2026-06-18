# Employee Official Photo Asset Contract

## Scope

本文档定义 `asset-service` 为员工公开展示头像提供的受控文件资产契约。员工公开展示头像的业务 owner 是 [hr-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/hr-service.md)；`asset-service` 只拥有文件资产元数据、对象存储、URL 生成与资产生命周期。

## Product Flow Constraints

- 员工公开展示头像必须进入受控对象存储，不允许前端、API Gateway 或 HR 直接保存任意外链 URL 作为业务真相。
- 上传文件资产不等于员工公开头像已生效；HR command 成功保存 `officialPhotoAssetId` / `officialPhotoUrl` 后，才视为员工公开展示头像变更成功。
- 员工公开展示头像不得复用账号头像 owner 语义，也不得绑定到 `ownerAccountId`。
- HR 移除员工公开展示头像时，只移除 HR 引用；Asset 文件是否清理由资产生命周期策略处理。

## Operations

### `UploadEmployeeOfficialPhoto`

- Purpose: upload one image asset candidate for an Employee official public display photo.
- Callers: trusted internal services such as `api-gateway` HR management BFF.
- Control model: internal service call with authenticated operator context and tenant-scoped Employee target.
- Input semantics:
  - `scopeLevel = TENANT`
  - `tenantId`
  - `employeeId`
  - `operatorId`
  - `category = EMPLOYEE_OFFICIAL_PHOTO`
  - `file`
  - `fileName`
  - `contentType`
- Ownership constraints:
  - `tenantId` is required.
  - `employeeId` is required.
  - the uploaded asset must be owned by `tenantId + employeeId`.
  - account avatar assets cannot be reused as employee official photo assets.
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

### `BindEmployeeOfficialPhoto`

- Purpose: finalize one uploaded employee photo asset after HR successfully updates the Employee official photo reference.
- Callers: trusted internal services such as `api-gateway` HR management BFF.
- Control model: internal service call with authenticated operator context.
- Input semantics:
  - `scopeLevel = TENANT`
  - `tenantId`
  - `employeeId`
  - `operatorId`
  - `newAssetId`
  - optional `previousAssetId`
- Behavior constraints:
  - `newAssetId` must belong to the same `tenantId + employeeId`.
  - assets owned by account avatar flows must be rejected.
  - the previous active employee official photo asset, if any, is marked `REPLACED`.
  - replaced assets enter controlled cleanup flow instead of immediate blind hard-delete.
- Response fields:
  - `activeAssetId`
  - `publicUrl`
  - optional `replacedAssetId`

### `ResolveAssetPublicUrl`

- Purpose: resolve one employee photo asset display URL from a controlled asset reference.
- Callers: trusted internal services building HR or public display read models.
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
  - `category = EMPLOYEE_OFFICIAL_PHOTO`
  - `scopeLevel = TENANT`
  - `tenantId`
  - `ownerEmployeeId`
  - `status`
  - `publicUrl`
- `hr-service` owns:
  - `Employee.officialPhotoAssetId`
  - `Employee.officialPhotoUrl`
- `api-gateway` owns:
  - external HTTP orchestration only

## Storage Constraints

- 底层对象存储实现必须通过 S3-compatible 抽象接入。
- 存储 key 必须使用 employee official photo 路径：
  - `avatar/tenant/<tenantId>/employee/<employeeId>/official/<file>`
- 不得把员工公开展示头像存入账号头像路径：
  - forbidden: `avatar/tenant/<tenantId>/<accountId>/<file>`
