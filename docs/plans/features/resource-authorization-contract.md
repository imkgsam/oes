# Resource Authorization Contract

> 服务设计唯一真相源：[permission-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/permission-service.md)。授权分层依据为 [15-authorization-layering-and-resource-policy-architecture.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/15-authorization-layering-and-resource-policy-architecture.md)。本文只记录 `checkResource / buildQueryScope` 的内部 application contract 与调用模式，不重新定义 permission-service 长期 owner 边界。

## 1. 目标

- 在 `permission-service` 内部提供稳定的 `ResourceAuthorizationService` application facade。
- 让调用方通过 `checkResource(request)` 与 `buildQueryScope(request)` 消费资源授权能力，而不是直接依赖 template instance evaluator。
- 保持第一阶段仅内部使用，不开放完整 gRPC / HTTP。
- 为后续业务服务 rollout 或 proto contract 冻结提供调用形状基线。

## 2. 不做什么

- 不接入 CRM/SRM/Procurement/MES/WMS 业务服务。
- 不开放外部 gRPC / HTTP contract。
- 不改变 `CheckPermission` 粗粒度 RBAC 语义。
- 不把 resource facts 或 query scope 放进 decorator。
- 不让 permission-service 查询业务资源数据库。
- 不把业务 domain rule 塞进 policy。

## 3. 内部入口

第一阶段内部入口：

```text
ResourceAuthorizationService:
  checkResource(request: CheckResourceRequest): Promise<CheckResourceResult>
  buildQueryScope(request: BuildQueryScopeRequest): Promise<BuildQueryScopeResult>
```

稳定规则：

- 调用前必须已经通过 `checkPermission` 或等价粗粒度 RBAC 能力入口。
- 调用方负责提供最小 `ResourceFacts`。
- `buildQueryScope` 只返回结构化 `QueryScopeExpression`，不返回 raw SQL。
- `ResourceAuthorizationService` 是 application facade；底层可由 template instance evaluator、未来 profile evaluator 或其他受控策略源组合，但调用方不依赖这些实现细节。

## 4. 当前实现绑定

第一阶段：

```text
ResourceAuthorizationService
  -> PolicyTemplateInstanceAuthorizationService
    -> PolicyInstanceReader
      -> PolicyTemplateInstanceRepository
```

稳定规则：

- evaluator 继续负责 DENY 优先与多 layer 组合规则。
- repository 继续负责 template instance storage mapping。
- facade 不新增业务语义，也不解释业务主数据。

## 5. 验收标准

- `ResourceAuthorizationService.checkResource` 委托当前 policy template instance evaluator。
- `ResourceAuthorizationService.buildQueryScope` 委托当前 policy template instance evaluator。
- `AuthorizationModule` 导出 generic facade，而不是要求未来调用方直接依赖 template-specific service。
- 不新增外部 controller / proto / HTTP API。
- 现有 L1、policy-template-instance L2 与 build 通过。
