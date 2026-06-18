# identity-service Contracts

## 1. 目的

本目录用于提供 `identity-service` 的黑盒接口文档。

`identity-service` 的唯一稳定服务设计真相源是 [identity-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/identity-service.md)。本目录只描述黑盒接口、字段、错误与调用语义，不重新定义服务职责、核心对象或长期边界。

涉及角色、权限、policy、terminal access、access summary 或 navigation governance 的服务设计边界，以 [permission-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/permission-service.md) 为准。

涉及 HR `Employee / Employment`、员工生命周期或正式 `人 -> org` 归属时，以 [hr-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/hr-service.md) 为准；本目录只描述 identity contract 如何关联或消费这些外部事实。

这些文档面向：

- `auth-service`
- `api-gateway`
- 未来其他依赖 `identity-service` 的系统服务

阅读目标：

- 理解 `identity-service` 暴露了哪些能力
- 明确每个接口的请求/响应语义
- 明确上下文、权限、副作用与错误边界

这些文档不是 proto 副本。

Proto 契约来源仍然是：

- [identity_query.proto](/Users/acehood/Documents/GitHub/oes/src/common/src/contracts/identity_service/identity_query.proto)

## 2. 模块划分

- [query.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/identity-service/query.md)
  - 身份查询接口与 Contact Asset public-safe 解析接口
- [management.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/identity-service/management.md)
  - 管理型写接口与 Contact Asset 统一治理语义
- [machine-auth.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/identity-service/machine-auth.md)
  - API Key 机器认证接口
- [employee-binding.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/identity-service/employee-binding.md)
  - `UserAccount <-> Employee` 绑定补充契约

## 3. 全局调用约束

- 所有接口均为内部 gRPC 接口，不对外部客户端直接开放
- 所有调用方都应把 `identity-service` 当作 black box，不依赖其内部实现
- 查询接口默认要求 internal service 调用上下文
- 管理接口要求：
  - internal service 上下文
  - authenticated operator context
  - 对应 permission code
- `tenantId / orgId / operator context / trace context` 是否必需，以具体接口文档为准

## 4. 当前能力范围

截至当前，`identity-service` 已开放四类能力：

- 人类身份与账户查询
- 兼容性组织归属查询 / 管理与 Contact Asset 查询、公开解析、治理管理
- 机器身份与 API Key 管理 / 认证
- `UserAccount <-> Employee` 绑定管理
- tenant account 创建时可通过 `CreateUserAccountRequest.tenant_party_id` 显式复用上游已解析的当前租户 `TenantParty`

说明：

- 组织归属相关接口当前仅保留为 legacy compatibility / projection 能力
- 它们不是正式 `Employee -> OrgUnit` 真相源；该口径以 [hr-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/hr-service.md) 为准
- 新的 HR / onboarding 主线不得再把这些接口当作人员归属 owner 使用

## 5. Contact Asset contract 约束

Contact Asset contract 仅描述 `identity-service` 对账号工作上下文联系方式资产的黑盒能力。

稳定约束：

- Contact Asset owner、类型、状态、归属口径以 [identity-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/identity-service.md) 为准。
- BusinessCard / Public Entry 只能通过 query contract 解析 Contact Asset 引用，不能保存 phone、email、WeChat、WhatsApp、handle、externalRef 或其他联系方式正文。
- `auth-service` 仍拥有 login method、credential、OTP、MFA、session 与认证审计；Contact Asset 字段不得被调用方当作登录可用性或认证凭据。
- Phase 1 的 BusinessCard public render 使用 [query.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/identity-service/query.md) 中的 `ResolveContactActionTargets` 获取 `publicValueSummary`。
- 管理端统一使用 [management.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/identity-service/management.md) 中的 Contact Asset management 语义；旧 work email / work phone 接口只作为兼容口径理解。
