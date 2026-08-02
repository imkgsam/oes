# Employee Official Photo Asset Contract

## Scope

本文档定义 `asset-service` 为员工公开展示头像提供的受控文件资产契约。员工公开展示头像的业务 owner 是 [hr-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/hr-service.md)；`asset-service` 只拥有文件资产元数据、对象存储、URL 生成与资产生命周期。

## Product Flow Constraints

- 员工公开展示头像必须进入受控对象存储，不允许前端、API Gateway 或 HR 直接保存任意外链 URL 作为业务真相。
- 上传文件资产不等于员工公开头像已生效；HR command 成功保存 `officialPhotoAssetId` / `officialPhotoUrl` 后，才视为员工公开展示头像变更成功。
- 员工公开展示头像不得复用账号头像 owner 语义，也不得绑定到 `ownerAccountId`。
- HR 移除员工公开展示头像时，只移除 HR 引用；Asset 文件是否清理由资产生命周期策略处理。

## Trusted Execution Contract

- `UploadEmployeeOfficialPhoto` 与 `BindEmployeeOfficialPhoto` 固定为 `BUSINESS`，精确要求 `all: [hr.employee.create]`。这是当前 HR 管理入口已经使用的 active BUSINESS Code；Gateway 与 Asset 使用同一个稳定 Code，不建立 Permission-to-Scope 转换。
- 唯一 audience 是 `urn:oes:service:asset-service`；当前唯一直接 workload 是环境注册的 `spiffe://<trust-domain>/ns/oes/sa/api-gateway`，Token 的 `client_id` / `cnf.x5t#S256` 必须绑定当前 Gateway mTLS 叶证书。
- Gateway HTTP `RequirePermissions({ all: [hr.employee.create] })` 与 Asset gRPC BUSINESS authorization 是两道边界。Asset 仍校验 trusted tenant、Asset owner/category/status，不把 Gateway 已检查视为资源授权替代品。
- HUMAN、具备该 BUSINESS grant 的 MACHINE 与满足 delegation / tool upper bound 的 DELEGATED 适用统一 BUSINESS 规则；本 RPC 不额外创造 workload INTERNAL grant。
- Token 或 metadata 验证失败时直接拒绝；不得从 body 中恢复 tenant、scope 或 operator，也不得接受 shared signed operator context。

## Operations

### `UploadEmployeeOfficialPhoto`

- Purpose: upload one image asset candidate for an Employee official public display photo.
- Current caller: `api-gateway` 的 `HrManagementController -> HrManagementService -> EmployeeOfficialPhotoAssetGrpcAdapter`。
- Control model: `BUSINESS all: [hr.employee.create]` with one tenant-scoped Employee target.
- Input semantics:
  - `employeeId`
  - `file`
  - `fileName`
  - `contentType`
- Trusted context semantics:
  - `scopeLevel = TENANT` 与 `tenantId` 来自 verified ExecutionToken
  - operator / delegated actor / audit attribution 来自 trusted execution context
  - `category = EMPLOYEE_OFFICIAL_PHOTO` 由 RPC 固定，不接受 caller 选择
- Ownership constraints:
  - a trusted TENANT context and exact tenant are required.
  - `employeeId` is required.
  - `employeeId` remains a legitimate HR-owned business target; it cannot establish principal or tenant identity.
  - the uploaded asset must be owned by trusted `tenantId + employeeId`.
  - account avatar assets cannot be reused as employee official photo assets.
  - request body 中不得保留或兼容读取 `scopeLevel`、`tenantId`、`operatorId`；`employeeId` 必须保留。
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
- Current caller: `api-gateway` 的 `HrManagementService -> EmployeeOfficialPhotoAssetGrpcAdapter`。
- Control model: `BUSINESS all: [hr.employee.create]`。
- Input semantics:
  - `employeeId`
  - `newAssetId`
  - optional `previousAssetId`
- Behavior constraints:
  - `newAssetId` must belong to the same trusted `tenantId + employeeId`.
  - assets owned by account avatar flows must be rejected.
  - the previous active employee official photo asset, if any, is marked `REPLACED`.
  - replaced assets enter controlled cleanup flow instead of immediate blind hard-delete.
  - request body 中不得保留或兼容读取 `scopeLevel`、`tenantId`、`operatorId`；`employeeId` 必须保留为业务目标。
- Response fields:
  - `activeAssetId`
  - `publicUrl`
  - optional `replacedAssetId`

### `ResolveAssetPublicUrl`

- Purpose: resolve one employee photo asset display URL from a controlled asset reference.
- Current caller inventory: 当前没有 HR / public-entry service 直接调用；唯一 production-code caller 是 `api-gateway` 的 account-oriented read model，完整 policy 以 [avatar.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/asset-service/avatar.md) 为准。
- Control model: `INTERNAL asset.internal.avatar.resolve_public_url`；未来 HR / public display direct caller 不能因本段描述自动获得 workload issuance。
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

## Caller And Fixture Migration

- Gateway HR adapter replaces `GrpcMetadataPropagationFactory` / signed operator metadata with the common trusted execution metadata provider and requests `aud=urn:oes:service:asset-service` plus exact BUSINESS scope `hr.employee.create`.
- 两个 employee request 删除 `scopeLevel`、`tenantId`、`operatorId`，保留 `employeeId`、Asset id 与文件字段；Gateway service、generated caller 与 Asset Controller 在同一 service cutover 编译修复。
- `hr-management.service.spec.ts`、HR Controller specs 与 `asset-service/test/l1/asset-grpc.controller.spec.ts` 必须改用可信 metadata / execution-context fixtures，并新增 missing Code、wrong tenant、body injection、wrong audience 与 wrong `cnf` 负向验收。
- 当前静态扫描没有发现另一个 OES service、Cron、AI、Robot 或 worker 直接调用这两个 RPC；新增 caller 不得复用旧 body identity 或获得 wildcard policy。
