# OES gRPC Metadata 与服务信任架构

> 涉及 permission-service 的服务职责、核心对象或 owner 边界时，以 [permission-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/permission-service.md) 为准；本文只描述 gRPC metadata、operator context 与服务信任传播规则。

## 1. 目的

本设计用于明确 OES 内部服务在 gRPC 调用链中的三类问题：

- 服务与服务之间如何建立可信通信边界
- request / trace / operator context 应如何跨多跳传播
- 哪些历史实现只能作为过渡或旧设计，后续应停止扩散

本文是项目级稳定设计，覆盖 Gateway 首跳与服务间多跳调用，不再仅以某个单服务线程中的局部约定作为事实来源。

## 2. 核心结论

### 2.1 传输层信任由部署层负责

OES 的内部服务传输层信任目标状态明确为：

- 内部 gRPC 链路通过 mTLS 建立双向认证与链路加密
- mTLS 属于部署 / 平台层能力
- 代码层不承担长期 TLS / 证书治理职责

当前阶段的实现要求：

- 代码层不为未来 mTLS 做一套临时过渡 TLS 方案
- 代码层只实现不会因 mTLS 上线而返工的能力：
  - metadata 多跳传播
  - signed `operator_context`
  - request / trace continuity
  - internal service 调用语义归一

### 2.2 应用层信任由 signed `operator_context` 负责

mTLS 只解决：

- 当前调用服务是谁
- 这条链路是否来自受信服务

它不解决：

- 当前调用代表哪个操作者
- 当前操作者属于哪个 tenant / org
- 当前操作者带哪些角色

这些业务语义继续由应用层的 signed `operator_context` 负责。

### 2.3 多跳传播是项目级要求，不是 Gateway 专属能力

Gateway 是外部入口的首跳上下文装配点，但不是 metadata 传播的唯一承担者。

项目级要求：

- Gateway 首跳需要写入 metadata
- 子服务在继续调用下游时，也必须按统一规则传播 metadata
- 不允许形成“Gateway 有 metadata 工厂、其他服务靠手写或不传”的长期状态

## 3. 元数据分类

### 3.1 基础内部调用 metadata

以下字段属于内部服务调用基础 metadata，应在绝大多数内部 gRPC 调用中跨跳传播：

- `x-internal-service-name`
- `x-request-id`
- `x-trace-id`
- `traceparent`
- `tracestate`，当存在时

职责：

- 标识当前直接调用方服务
- `x-trace-id` 作为日志、审计与排障的稳定关联键
- `traceparent / tracestate` 作为标准 OTel 分布式追踪上下文
- 支撑观测、日志、审计与排障

### 3.2 业务操作者 metadata

以下字段属于业务语义 metadata，只在下游仍需要操作者语义时传播：

- `x-operator-context`

适用场景：

- 下游接口接入 `AuthenticatedOperatorGuard`
- 下游接口接入 `PermissionGuard`
- 下游需要 operator 归因审计
- 下游需要 tenant / org 作用域校验

实现护栏：

- 仅仅在接口上挂 `AuthenticatedOperatorGuard` 并不等于一定会解析 `x-operator-context`
- 当前 `AuthenticatedOperatorGuard` 只会在接口显式带有 `@RequirePermissions({ all: [...] })` 或 `@RequireAuthenticatedOperator()` 元数据时，才会真正读取 gRPC metadata 并把 operator context 挂到 request context 上
- 因此，凡是 handler 内部会调用 `getRequiredOperatorId(...)`、`getOptionalOperatorScope(...)`、资源边界校验、操作者审计写入等逻辑的 gRPC 管理接口，都必须显式声明：
  - `@RequirePermissions({ all: [...] })`，或
  - `@RequireAuthenticatedOperator()`
- 只写 `@UseGuards(InternalServiceGuard, AuthenticatedOperatorGuard)` 但未声明上述元数据时，接口表面上接入了 guard，实际上不会消费 operator context，后续在 handler 内取 operator id 会得到 `APP_SECURITY_003 / operator context is missing`

不适用场景：

- 纯技术型内部调用
- 无 operator 归因要求的基础设施能力调用

例如：

- `auth-service -> notification-service` 发送 OTP
  - 默认只需要基础内部调用 metadata
- `api-gateway -> permission-service` 管理接口
  - 需要基础 metadata + signed `operator_context`

## 4. `operator_context` 结构

### 4.1 目标结构

`operator_context` 的目标字段如下：

- `operator_id`
- `operator_type`
- `tenant_id`
- `org_id`，当场景适用
- `issued_at`
- `expires_at`
- `issuer`
- `operator_roles`
- `request_id`
- `trace_id`
- `signature`

### 4.2 明确废弃项

以下字段不再作为长期标准传播设计：

- 旧的预解析权限集合字段

其在当前代码中的存在仅视为过渡兼容，不得继续作为新实现的长期前提。

该要求与 [09-role-based-permission-resolution.md](./09-role-based-permission-resolution.md) 保持一致。

## 5. 多跳传播规则

### 5.1 基础规则

所有内部 gRPC 多跳调用应遵循：

1. 保持 `request_id` 连续
2. 保持 `trace_id` 连续
3. 保持 `traceparent / tracestate` 连续
4. 当前直接调用方服务名写入 `x-internal-service-name`
5. 仅在业务需要时继续传播 `x-operator-context`

说明：

- `x-trace-id` 继续保留，用于日志、审计与手工排障关联
- `traceparent / tracestate` 负责真实的 OTel 分布式追踪传播
- 新实现不得再把“只有 `x-trace-id` 连续”视为 tracing 已闭环

### 5.2 `operator_context` 逐跳策略

项目目标状态采用逐跳重签策略：

1. 当前服务接收上游 `operator_context`
2. 当前服务先完成验签与有效性校验
3. 若继续调用下游且仍需要 operator 语义：
   - 基于已验证 payload 生成新的 `operator_context`
   - `issuer` 写当前调用服务名
   - 重新签名
   - 保持短 TTL

这样做的目的：

- 明确每一跳的调用责任
- 避免长期把 Gateway 作为唯一 issuer
- 便于 trusted issuer 治理
- 便于跨服务审计归因

### 5.3 不允许的做法

以下做法应视为不符合目标架构：

- 只在 Gateway 首跳写 metadata，二跳以后任由 metadata 丢失
- 无差别把 `operator_context` 透传到所有技术型内部调用
- 继续把旧的预解析权限集合字段作为长期标准字段扩散
- 用 `x-internal-service-name` 伪装为完整服务身份信任根

## 6. 服务信任模型

### 6.1 目标职责分层

OES 内部服务信任模型分为两层：

- 传输层：
  - 由部署层 mTLS 负责
- 应用层：
  - 由 signed `operator_context` 与 request / trace metadata 负责

### 6.2 `InternalServiceGuard` 的定位

在目标状态下：

- `InternalServiceGuard` 继续保留
- 但它的语义应理解为：
  - 应用层调用方声明校验
  - 辅助审计与治理能力
- 它不是长期唯一的服务可信根

长期可信根应来自部署层 mTLS / service identity 体系。

## 7. 当前代码状态评估

### 7.1 已实现部分

当前代码已具备：

- Gateway 首跳 metadata 工厂
- `operator_context` RSA 签名与验签
- `InternalServiceGuard`
- `AuthenticatedOperatorGuard`
- request / trace metadata 基础字段
- 标准 `traceparent / tracestate` 的 gRPC metadata 生成

### 7.2 当前缺口

当前代码仍存在以下项目级缺口：

- 多个子服务 adaptor 在二跳调用中未继续传 metadata
- `operator_context` 仍带过渡期的权限快照字段
- `org_id` 尚未成为标准传播字段
- 传输层 mTLS 尚未实现
- HTTP / gRPC / 事件总线的全链路 tracing 联调仍未完整验证

因此，当前代码应被理解为：

- 首跳设计已存在
- gRPC 标准 trace metadata 已进入 `common`
- 全链路 trace propagation 仍未完全收口
- 服务信任模型仍未达到目标状态

## 8. 历史老旧设计删除与废弃

以下设计或实现方向，后续应明确停止扩散，并逐步从活跃实现与活跃设计中退出。

### 8.1 删除“代码层临时 mTLS 过渡方案”作为目标方向

本项目不再采用：

- 在各业务服务代码中临时接入 TLS credentials
- 把证书加载、轮换、client / server cert 配置分散进各服务代码

原因：

- 这会形成明显返工
- 与部署层 mTLS 的最终职责分工不一致
- 会让业务代码承担本不应承担的证书治理责任

### 8.2 废弃“Gateway 专属 metadata 工厂即项目长期方案”

历史上 metadata 工厂主要存在于 Gateway 内部，这可以作为首跳实现，但不能继续视为项目级终态。

目标状态应为：

- 在 `common` 下沉统一的服务间 metadata propagation 能力
- Gateway 与各子服务复用同一套规则

### 8.3 废弃“`x-internal-service-name` 单独承担服务信任根”

历史实现中，`InternalServiceGuard` 主要基于：

- `x-internal-service-name`
- allowlist

进行内部服务识别。

这可作为当前阶段的应用层控制手段，但不再被视为长期充分条件。

长期目标应以部署层 mTLS 为传输层信任根。

### 8.4 删除“长期传播预解析权限集合”设计方向

以下方向已明确废弃：

- 在 `operator_context` 中长期携带完整权限集合
- 让子服务继续直接依赖旧的权限快照字段作为主要授权来源

后续所有新路径应以：

- `operator_roles`
- `permission-service` 运行时解析权限

作为目标方案。

## 9. 推荐实施顺序

### Phase 1

- 在 `docs/architecture` 冻结本文
- 明确 mTLS 由部署层负责

### Phase 2

- 在 `common` 下沉统一 metadata propagation factory
- 定义内部调用与 operator-scoped 调用两套构造入口

### Phase 3

- Gateway 与各子服务 adaptor 统一接入该 factory
- 打通 request / trace continuity
- 打通业务需要场景下的 `operator_context` 多跳传播

### Phase 4

- 收敛 `operator_context` 到 `operator_roles`
- 逐步移除对旧的权限快照字段的长期依赖

### Phase 5

- 在部署层接入 mTLS
- 完成证书、轮换、服务身份、可信链治理

## 10. `common` 通用 metadata propagation factory 设计

为避免继续沿用“Gateway 专属工厂 + 子服务各自手写”的旧方向，项目下一步应在 `src/common` 下沉统一的 metadata propagation 能力。

### 10.1 目标位置

建议位置：

```text
src/common/src/authorization/
  metadata/
    grpc-metadata-propagation.factory.ts
```

若后续认为更适合放入 `transport/grpc`，也可以迁移，但职责必须保持在“安全上下文传播”边界内，而不是演变成通用杂项工具。

### 10.2 工厂目标职责

该工厂负责：

- 统一创建内部服务调用 metadata
- 在需要时创建带 signed `operator_context` 的 metadata
- 从 HTTP 首跳来源与已认证 gRPC 上下文两类来源归一化输入
- 保持 `request_id` / `trace_id` 连续
- 支持逐跳重签

该工厂不负责：

- 业务权限判断
- 设备上下文扩展
- 任意自定义 metadata 扩散
- mTLS 或证书治理

### 10.3 建议公开入口

建议提供两个显式入口：

- `createInternalCallMetadata(input)`
- `createOperatorScopedMetadata(input)`

语义如下：

- `createInternalCallMetadata`
  - 只生成基础内部调用 metadata
- `createOperatorScopedMetadata`
  - 生成基础 metadata
  - 额外生成 signed `operator_context`

不建议保留语义模糊的单一入口，例如：

- `createMetadata(...)`

因为这会让调用方不清楚自己是否正在向下游传播 operator 语义。

### 10.4 建议输入模型

建议在 `common` 中定义统一输入模型，而不是继续复用 Gateway 私有的 `DownstreamRequestSource`。

建议至少包含：

```ts
interface InternalCallMetadataInput {
  callerServiceName: string
  requestId?: string
  traceId?: string
}

interface OperatorScopedMetadataInput extends InternalCallMetadataInput {
  operatorContext: {
    operatorId: string
    operatorType: string
    tenantId?: string
    orgId?: string
    operatorRoles?: string[]
    requestId?: string
    traceId?: string
  }
}
```

注意：

- `operatorPermissions` 不再作为新模型标准字段
- `orgId` 应在本次公共模型中作为标准可选字段纳入

### 10.5 来源归一化

工厂本身只负责“根据标准输入创建 metadata”，不直接依赖 HTTP 或 NestJS ExecutionContext。

来源归一化建议拆成两个辅助入口：

- HTTP 首跳来源提取器
- gRPC 已认证上下文来源提取器

也就是说：

- Gateway 负责把 HTTP request 归一化成标准输入
- 子服务负责把 `AuthenticatedGrpcRequestContext` 归一化成标准输入
- metadata factory 只消费标准输入

这样可以避免把 Gateway/HTTP 语义硬耦合进 `common`。

### 10.6 逐跳重签规则

当调用 `createOperatorScopedMetadata(...)` 时，统一遵循：

1. 当前服务已经拥有可信的 operator 上下文来源
2. 由当前服务名写入 `callerServiceName`
3. `issuer` 取当前服务名
4. 重新生成：
   - `issued_at`
   - `expires_at`
   - `signature`
5. 保持 `request_id` / `trace_id` 连续

这意味着：

- Gateway 首跳会签一次
- 子服务如果继续向下游传播 operator 语义，会再次按当前服务身份重签

### 10.7 当前 Gateway 工厂的去向

当前 [downstream-grpc-metadata.factory.ts](/Users/acehood/Documents/GitHub/oes/src/services/api-gateway/src/common/grpc/downstream-grpc-metadata.factory.ts) 不应继续作为长期唯一实现。

推荐演进方式：

1. 在 `common` 新增统一 factory
2. Gateway 改为复用 `common` factory
3. 旧 Gateway 私有工厂逐步删除

这样可以明确完成以下历史老旧设计删除：

- 删除“Gateway 私有 metadata 工厂即项目长期方案”的旧方向

## 11. 实施切片建议

### Slice A：公共接口冻结

目标：

- 在 `common` 中定义标准输入类型
- 定义通用 factory 接口
- 明确旧的权限快照字段不进入新接口

产出：

- types
- factory interface
- 基础单测

### Slice B：公共实现落地

目标：

- 实现 `createInternalCallMetadata`
- 实现 `createOperatorScopedMetadata`
- 接入 `OperatorContextCryptoService`

产出：

- `grpc-metadata-propagation.factory.ts`
- 签名与字段映射测试

### Slice C：Gateway 首跳迁移

目标：

- 让 Gateway 改为复用 `common` factory
- 保持当前行为兼容

产出：

- Gateway 首跳不再依赖私有长期模型
- 旧工厂进入删除路径

### Slice D：auth-service 二跳接入

目标：

- `identity-service.adaptor`
- `permission-service.adaptor`
- `notification-service.grpc.adaptor`

全部改为使用 `common` factory

产出：

- request / trace continuity
- 业务需要场景下的 operator context 继续传播

### Slice E：其余子服务推广

目标：

- `identity-service`
- `permission-service`
- 后续其他服务

统一接入公共传播机制

### Slice F：历史实现删除

目标：

- 删除 Gateway 私有长期 metadata 模型依赖
- 删除继续扩散旧的权限快照字段的新路径
- 删除“各服务 adaptor 手写 metadata / 不传 metadata”作为默认做法

## 12. 当前推进状态

截至当前阶段：

- 架构边界已冻结
- mTLS 已明确为部署层职责
- 代码层已明确不做 TLS 过渡实现
- `common` 中已落地通用 gRPC metadata propagation factory
- Gateway 首跳已改为复用 `common` factory
- Gateway 私有长期 metadata factory 方向已删除，当前仅保留 Gateway source mapper
- `auth-service` 已接入 gRPC request context store / interceptor
- `auth-service -> identity-service / permission-service / notification-service`
  三条二跳链路已统一接入 propagation factory
- `identity-service` 已接入 gRPC request context interceptor
- `identity-service -> permission-service`
  这条共享权限解析二跳链路已接入 propagation factory
- 已补针对性测试，验证：
  - gRPC 入口 metadata 进入 request context store
  - `auth-service` 二跳 metadata continuity
  - notification source context 的 `request_id / trace_id` 写入
  - `identity-service` 共享权限 adaptor 的定向行为未回归

当前仍未完成：

- `permission-service` 等其他确有二跳 / 三跳调用的服务继续按需推广
- operator-scoped metadata 在多跳管理调用中的进一步推广
- 部署层 mTLS 的实施方案与接入

## 13. 当前结论

截至当前阶段，OES 对内部 gRPC 调用链的稳定目标状态明确为：

- 传输层信任由部署层 mTLS 负责
- 代码层不做临时 TLS 过渡实现
- 应用层继续通过 signed `operator_context` 表达业务操作者身份
- 基础 metadata 与业务 metadata 都必须有统一的多跳传播规则
- 历史上仅靠 Gateway 首跳 metadata、仅靠 `x-internal-service-name` allowlist、或长期传播预解析权限集合的方案，均不再作为目标状态
