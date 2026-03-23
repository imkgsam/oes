# 内部服务认证与可验签操作者上下文历史

## 2026-03-23 12:05:00 +08:00

### 本次目标

补充主设计文档对多级内部调用链路的约束说明，明确该方案不只面向单跳 `gateway -> 子服务`。

### 修改范围

- [../cross-service/internal-service-auth-and-operator-context.md](../cross-service/internal-service-auth-and-operator-context.md)

### 主要改动

- 新增多级内部调用链路规则说明
- 明确：
  - `x-internal-service-name` 是逐跳语义，必须反映当前直接调用方
  - `x-operator-context` 是跨跳语义，表达最终操作者身份声明
- 补充中间服务在继续调用下游时的推荐基线：
  - 覆盖本跳 `x-internal-service-name`
  - 默认透传已验签通过的 `x-operator-context`
  - 继续透传 `x-request-id` / `x-trace-id`

### 备注

- 本次只更新设计，不实现中间服务自动透传逻辑
- 是否引入中间服务重签发策略，留待后续阶段再评估

## 2026-03-23 11:35:00 +08:00

### 本次目标

落地 `SLICE-03 api-gateway`，将 gateway 到下游的安全 metadata 生成逻辑从局部 adapter 实现收敛为统一可复用能力。

### 修改范围

- [../../src/services/api-gateway/src/common/grpc/downstream-grpc-metadata.factory.ts](../../src/services/api-gateway/src/common/grpc/downstream-grpc-metadata.factory.ts)
- [../../src/services/api-gateway/src/modules/permission-service/adapters/permission-management-grpc.adapter.ts](../../src/services/api-gateway/src/modules/permission-service/adapters/permission-management-grpc.adapter.ts)
- [../../src/services/api-gateway/src/modules/permission-service/permission-service.module.ts](../../src/services/api-gateway/src/modules/permission-service/permission-service.module.ts)
- [../../src/services/api-gateway/src/modules/permission-service/permission-service.service.ts](../../src/services/api-gateway/src/modules/permission-service/permission-service.service.ts)

### 主要改动

- 新增 gateway 通用 `DownstreamGrpcMetadataFactory`
- 统一封装：
  - `x-internal-service-name`
  - `x-operator-context`
  - `x-request-id`
  - `x-trace-id`
- 为后续其他下游 gRPC adapter 预留两种复用入口：
  - `createManagementMetadata(...)`
  - `createInternalServiceMetadata(...)`
- 让 `permission-service` 管理类 adapter 改用通用工厂，不再持有模块私有实现

### 备注

- 本次是治理收敛，不改变已有行为
- 当前只有 `permission-service` adapter 接入该统一层，其他下游模块待后续接入

## 2026-03-23 11:10:00 +08:00

### 本次目标

落地 `SLICE-02 api-gateway` 的第一阶段，在 gateway 发起 permission 管理类 gRPC 调用前生成并附带可验签的操作者上下文。

### 修改范围

- [../../src/services/api-gateway/src/app.module.ts](../../src/services/api-gateway/src/app.module.ts)
- [../../src/services/api-gateway/src/modules/permission-service/permission-service.module.ts](../../src/services/api-gateway/src/modules/permission-service/permission-service.module.ts)
- [../../src/services/api-gateway/src/modules/permission-service/permission-service.service.ts](../../src/services/api-gateway/src/modules/permission-service/permission-service.service.ts)
- [../../src/services/api-gateway/src/modules/permission-service/adapters/permission-management-grpc.adapter.ts](../../src/services/api-gateway/src/modules/permission-service/adapters/permission-management-grpc.adapter.ts)
- [../../src/services/api-gateway/src/modules/permission-service/adapters/operator-context.factory.ts](../../src/services/api-gateway/src/modules/permission-service/adapters/operator-context.factory.ts)
- [../../src/services/api-gateway/src/modules/permission-service/interface/http/controllers/permission.controller.ts](../../src/services/api-gateway/src/modules/permission-service/interface/http/controllers/permission.controller.ts)
- [../../src/services/api-gateway/src/modules/permission-service/interface/http/controllers/role.controller.ts](../../src/services/api-gateway/src/modules/permission-service/interface/http/controllers/role.controller.ts)

### 主要改动

- 为 permission 管理调用新增 gateway 侧 `OperatorContextFactory`
- 基于 `req.user` 构造 `OperatorContextPayload`，并用 `OperatorContextCryptoService` 完成签名
- 在 gateway 到 `permission-service` 的管理类 gRPC 调用上统一附带：
  - `x-internal-service-name`
  - `x-operator-context`
  - 可选 `x-request-id`
  - 可选 `x-trace-id`
- 打开 `PermissionServiceProxyModule` 的实际挂载，并让 gRPC client 配置对齐 `permission_management.proto`

### 备注

- 当前只覆盖 gateway 到 `permission-service` 管理接口的调用出口
- 依赖 `req.user` 至少包含可解析的 operator id；若 JWT payload 缺少相关字段，请求会在 gateway 侧被拒绝
- 统一转发治理和更多下游模块接入仍留给后续分片

## 2026-03-23 10:20:00 +08:00

### 本次目标

落地 `SLICE-09 auth-service` 的第一阶段，先将 `auth-service` 从旧 TCP client 依赖中拔出，并接入现有 `permission-service` gRPC 鉴权检查能力。

### 修改范围

- [../../src/services/system/auth-service/src/app.module.ts](../../src/services/system/auth-service/src/app.module.ts)
- [../../src/services/system/auth-service/src/modules/auth/auth.module.ts](../../src/services/system/auth-service/src/modules/auth/auth.module.ts)
- [../../src/services/system/auth-service/src/infrastructure/modules/external-services.module.ts](../../src/services/system/auth-service/src/infrastructure/modules/external-services.module.ts)
- [../../src/services/system/auth-service/src/infrastructure/adaptors/permission-service.adaptor.ts](../../src/services/system/auth-service/src/infrastructure/adaptors/permission-service.adaptor.ts)
- [../../src/services/system/auth-service/src/infrastructure/adaptors/identity-service.adaptor.ts](../../src/services/system/auth-service/src/infrastructure/adaptors/identity-service.adaptor.ts)

### 主要改动

- 为 `auth-service` 根模块接入 `GrpcTransportModule.forRoot(...)`，声明 `permission-service` 的 gRPC 客户端配置
- 将 `ExternalServicesModule` 从 `ClientModule.register(...)` 切换为 `GrpcTransportModule.forFeature(['permission-service'])`
- 将 `PermissionServiceAdaptor` 从 `ClientProxy.send(...)` 改为 `PermissionCheckService.checkPermission(...)`
- 移除 `auth-service` 中对 `PERMISSION_MESSAGES`、`ServiceKeys.PERMISSION_TCP`、`ClientProxy`、`safeRpcCall` 的依赖
- `IdentityServiceAdaptor` 去掉旧 TCP 注入，保留无实现占位，等待后续 identity gRPC contract 落地

### 备注

- 当前只完成了 `permission-service` 鉴权检查调用的 gRPC 迁移
- `getAccountAuthorizationSummary` 仍未落地，因为现有 `permission-service` gRPC contract 尚未提供对应能力
- `identity-service` 侧当前仓库中没有现成的 gRPC generated client contract，因此本次不伪造临时协议

## 2026-03-22 13:25:00 +08:00

### 本次目标

落地 `SLICE-01 common` 的第一版公共安全基础设施，为后续 `gateway` 和 `permission-service` 接入 guard 提供统一契约。

### 修改范围

- [../cross-service/internal-service-auth-and-operator-context.md](../cross-service/internal-service-auth-and-operator-context.md)
- [../../src/common/src/security/index.ts](../../src/common/src/security/index.ts)
- [../../src/common/src/common.module.ts](../../src/common/src/common.module.ts)
- [../../src/common/package.json](../../src/common/package.json)

### 主要改动

- 新增统一 gRPC metadata 常量：`x-internal-service-name`、`x-operator-context`、`x-request-id`、`x-trace-id`
- 新增 `OperatorContextPayload` 类型、上下文编解码与稳定签名原文编码工具
- 新增默认内部服务认证器与 RSA 签名 / 验签服务，并保留 token 级抽象以便后续替换实现
- 新增 `InternalServiceGuard`、`AuthenticatedOperatorGuard` 和配套 decorator：`@PublicInterface()`、`@RequireAuthenticatedOperator()`
- 新增安全异常定义，并将 `SecurityModule` 接入 `CommonModule` 与 `@oes/common` 导出入口

### 备注

- 本次只完成 `common` 侧基础设施，尚未在具体服务 controller 上挂载 guard
- 默认内部服务认证器当前只基于 `x-internal-service-name` 与可选 allowlist 工作；更强的底层服务身份校验仍需后续链路接入
- `SLICE-01` 当前状态应视为“部分实现”，后续仍需结合 `gateway` / `permission-service` 做链路验收

## 2026-03-22 12:00:00 +08:00

### 本次目标

将根目录跨服务文档从旧的 `doc/func` 结构收敛到新的 `cross-service/`、`history/` 分类，并统一改为仓库相对路径链接。

### 修改范围

- [../INDEX.md](../INDEX.md)
- [../cross-service/internal-service-auth-and-operator-context.md](../cross-service/internal-service-auth-and-operator-context.md)
- [INDEX.md](./INDEX.md)

### 主要改动

- 将跨服务功能主文档移动到 `doc/cross-service`
- 将对应历史文档移动到 `doc/history`
- 新增根目录 [overview.md](../overview.md)
- 将根目录索引中的链接全部改为相对路径，兼容 Windows 和 macOS

### 备注

- 旧结构 `doc/func` 已废弃
- 后续新增根目录跨服务功能主文档时，优先放在 `doc/cross-service`

## 2026-03-22 12:30:00 +09:00

### 本次目标

将跨模块方案从“可执行设计稿”继续升级为“全链路实现蓝图”，用于指导按模块分片实施。

### 修改范围

- [../cross-service/internal-service-auth-and-operator-context.md](../cross-service/internal-service-auth-and-operator-context.md)

### 主要改动

- 补充全链路授权分层说明
- 明确 `CheckPermission` 与 `CheckPermissionWithContext` 的职责分工
- 补充 `gateway` 的入口级粗粒度门禁职责
- 补充 `x-internal-service-name` 与 `x-operator-context` 的推荐编码与约束
- 明确 `Phase 1` 不采用“每请求实时调用 `auth-service` 远程签发”方案
- 为 `common`、`gateway`、`permission-service`、其他子服务、`auth-service` 分别补充详细分片步骤
- 新增跨模块优先级与推荐实现顺序

### 备注

- 当前文档已可作为“全链路 + 按模块”的分片实施蓝图
- 具体代码落地时，仍需分别更新各模块自己的功能文档与历史文档

## 2026-03-19 10:10:03 +08:00

### 本次目标

将根目录跨模块方案文档从“方向性说明”扩充为“可执行设计稿”，使后续在缺少额外上下文时也能按文档直接开始代码改造。

### 修改范围

- [../cross-service/internal-service-auth-and-operator-context.md](../cross-service/internal-service-auth-and-operator-context.md)

### 主要改动

- 补充文档目标，明确其为执行依据
- 补充术语定义
- 补充接口分类与保护要求表
- 补充 metadata / 上下文契约
- 补充 `InternalServiceGuard` 与 `AuthenticatedOperatorGuard` 分层设计
- 补充 `gateway`、`auth-service`、`common`、`permission-service` 的模块级改造清单
- 将 Phase 1 细化为可执行的 5 个步骤
- 为每个步骤补充产出与验收标准
- 补充 Phase 1.5 / Phase 2 增强清单

### 备注

- 当前文档已可作为后续跨模块改造的基线设计稿
- 具体 metadata 编码格式、签名算法、以及某一步的代码实现方式，后续仍需在具体分片中继续细化

## 2026-03-19 09:58:12 +08:00

### 本次目标

将根目录 `doc` 也按“索引在根，协议与历史分目录”的规则收敛。

### 修改范围

- 根目录 `doc`

### 主要改动

- 新建根目录 `doc/func`
- 将当前跨模块功能文档与对应 history 移动到 `doc/func`
- 更新根目录 [INDEX.md](../INDEX.md) 中的链接

### 备注

- `src/common/doc` 与 `src/services/api-gateway/doc` 当前为空目录，暂时无需调整
- 该次历史记录对应旧结构；当前结构已迁移到 `doc/protocols` 与 `doc/history`

## 2026-03-18 17:40:01 +08:00

### 本次目标

将“方案 3：内部服务认证 + 可验签的用户上下文”整理为根目录跨模块设计文档。

### 修改范围

- 仓库根目录 `doc`

### 主要改动

- 新建 [../cross-service/internal-service-auth-and-operator-context.md](../cross-service/internal-service-auth-and-operator-context.md)
- 新建对应历史文档
- 新建根目录 [../INDEX.md](../INDEX.md)
- 明确各模块职责：
  - `gateway`
  - `auth-service`
  - `common`
  - `permission-service`

### 备注

- 当前文档先描述 Phase 1 目标方案
- 具体 metadata 字段、签名格式、guard 实现方式后续再拆成功能分片推进
## 2026-03-23 18:52:59 +08:00

### 本次目标

补齐 `common` 中可复用的接口级 permission 授权基础设施，供各子服务显式声明接口所需 permission。

### 修改范围

- `src/common`

### 主要改动

- 新增 `@RequirePermission(...)`
- 新增 `PermissionGuard`
- 新增 `OperatorPermissionResolver` 公共接口与 token
- 新增安全默认实现 `DenyAllOperatorPermissionResolver`
- 将上述能力接入 `SecurityModule` 并统一导出

### 备注

- 本次只落公共 guard / decorator / resolver 扩展点
- 各子服务后续需要自行提供真实的 `OperatorPermissionResolver` 实现，才能让 `PermissionGuard` 实际放行
