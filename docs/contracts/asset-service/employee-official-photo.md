# Employee Official Photo Asset Contract

## Scope

本文档定义 `asset-service` 为员工公开展示头像提供的受控文件资产契约。员工公开展示头像的业务 owner 是 [hr-service.md](../../architecture/services/hr-service.md)；`asset-service` 只拥有文件资产元数据、对象存储、URL 生成与资产生命周期。

## Product Flow Constraints

- 员工公开展示头像必须进入受控对象存储，不允许前端、API Gateway 或 HR 直接保存任意外链 URL 作为业务真相。
- 上传文件资产不等于员工公开头像已生效；HR command 成功保存 `officialPhotoAssetId` / `officialPhotoUrl` 后，才视为员工公开展示头像变更成功。
- 员工公开展示头像不得复用账号头像 owner 语义，也不得绑定到 `ownerAccountId`。
- HR 移除员工公开展示头像时，只移除 HR 引用；Asset 文件是否清理由资产生命周期策略处理。

## Trusted Execution Contract

所有本节 RPC 都通过当前 channel 的 mTLS `VerifiedWorkloadIdentity` 与 `aud=urn:oes:service:asset-service` 的 Auth / STS `ExecutionToken` 建立上下文。当前 direct caller 是 `api-gateway` HR management module；Auth / STS 只向已注册的该 workload 发放本节所需的 Token。未来 service / worker 或不同 workload 必须先冻结自己的精确 workload-to-audience issuance policy，不能复用或放宽它。

- 当前 workload 的环境注册 identity 是 `spiffe://<trust-domain>/ns/oes/sa/api-gateway`，Token 的 `client_id` / `cnf.x5t#S256` 绑定当前 Gateway mTLS 叶证书。
- `UploadEmployeeOfficialPhoto` 与 `BindEmployeeOfficialPhoto` 都声明 `BUSINESS all: [hr.employee.create]`。这是当前 Gateway 员工正式照片 HTTP entry 的既有 active Permission Code；Gateway 与 Asset 使用同一个稳定 Code，不建立 Permission-to-Scope 转换，也不能用 INTERNAL 把 Asset lifecycle mutation 变成绕过业务授权的技术调用。HUMAN、拥有该 Code 的 MACHINE，以及通过 delegation / ToolContract 上限取得该 Code 的 DELEGATED 均按项目级 BUSINESS 规则处理。
- Gateway 对两者使用统一 metadata producer 的 `forBusinessCall('urn:oes:service:asset-service', ['hr.employee.create'])`，Asset 重复核验可信 tenant、`employeeId` 业务目标与自身 Asset owner facts；Employee 是否存在及属于该 tenant 的 HR 真相仍由 Gateway 编排调用 HR owner 校验。HTTP `RequirePermissions` 与 Asset gRPC BUSINESS authorization 是两道边界。
- legacy `scopeLevel`、`tenantId` 与 `operatorId` 请求字段在切换时删除：scope 固定为该受控资产类别的 `TENANT`，tenant 从 trusted context 取得，operator / actor / delegation、workload、requestId 与 trace 进入 Asset audit。`employeeId` 保留为业务目标；`newAssetId`、`previousAssetId` 也保留为业务引用，均不建立身份。
- Token 或 metadata 验证失败时直接拒绝；不得从 body 中恢复 tenant、scope 或 operator，也不得接受 shared signed operator context。

## Operations

### `UploadEmployeeOfficialPhoto`

- Purpose: upload one image asset candidate for an Employee official public display photo.
- Current caller: `api-gateway` 的 `HrManagementController -> HrManagementService -> EmployeeOfficialPhotoAssetGrpcAdapter`。
- Control model: `BUSINESS all: [hr.employee.create]` with a tenant-scoped Employee business target.
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
- Control model: `BUSINESS all: [hr.employee.create]` with a tenant-scoped Employee business target.
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
- Current caller inventory: 当前没有 HR / public-entry service 直接调用；唯一 production-code caller 是 `api-gateway` 的 account-oriented read model，完整 policy 以 [avatar.md](./avatar.md) 为准。
- Control model: the shared RPC is `INTERNAL all: [asset.internal.avatar.resolve_public_url]`; only its exact workload issuance policy can request a public-delivery projection，未来 HR / public display direct caller 不能因本段描述自动获得 workload issuance。
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
- `src/services/api-gateway/src/modules/hr-service/hr-management.service.unit.spec.ts`、`src/services/system/hr-service/test/contract/hr-management.grpc.controller.contract.spec.ts`、`src/services/system/hr-service/test/contract/hr-query.grpc.controller.contract.spec.ts` 与 `src/services/system/asset-service/test/contract/asset-grpc.controller.contract.spec.ts` 必须改用可信 metadata / execution-context fixtures，并新增 missing Code、wrong tenant、body injection、wrong audience 与 wrong `cnf` 负向验收。
- 当前静态扫描没有发现另一个 OES service、Cron、AI、Robot 或 worker 直接调用这两个 RPC；新增 caller 不得复用旧 body identity 或获得 wildcard policy。
