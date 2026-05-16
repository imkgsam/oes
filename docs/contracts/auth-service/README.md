# auth-service Contracts

## 1. 目的

本目录用于提供 `auth-service` 的黑盒接口文档。

`auth-service` 的唯一稳定服务设计真相源是 [auth-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/auth-service.md)。本目录只描述黑盒接口、字段、错误与调用语义，不重新定义服务职责、核心对象或长期边界。

涉及角色、权限、policy、access summary、navigation governance 或 terminal access policy 的服务设计边界，以 [permission-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/permission-service.md) 为准。

这些文档面向：

- `api-gateway`
- `auth-bff`
- `identity-service`
- 未来其他依赖认证与会话能力的内部服务

阅读目标：

- 理解 `auth-service` 暴露了哪些能力
- 明确每个接口的请求 / 响应语义
- 明确场景、权限、副作用与上下文要求

这些文档不是 proto 副本。

Proto 契约来源仍然是：

- [auth.proto](/Users/acehood/Documents/GitHub/oes/src/common/src/contracts/auth_service/auth.proto)

## 2. 模块划分

- [session.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/auth-service/session.md)
  - 会话查询、管理员会话管理与自助登出能力
- [audit.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/auth-service/audit.md)
  - 认证与会话审计查询能力
- [mfa.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/auth-service/mfa.md)
  - MFA 自助安全管理与挑战提交流程
- [login.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/auth-service/login.md)
  - 登录、认证挑战、账户选择与会话续期流程
- [terminal-login-policy.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/auth-service/terminal-login-policy.md)
  - 平台级 terminal entry login flow 策略
- [terminal-mfa-policy.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/auth-service/terminal-mfa-policy.md)
  - 平台默认与租户 terminal MFA 策略
- [session-management.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/auth-service/session-management.md)
  - terminal-aware session 列表、筛选与清退语义
- [login-history.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/auth-service/login-history.md)
  - login history 作为 auth audit 脱敏视图的查询语义
- [trusted-login-device.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/auth-service/trusted-login-device.md)
  - Web trusted browser 与 future Mobile remembered device 语义

## 3. 全局调用约束

- 所有接口均为内部 gRPC 接口，不直接对外开放
- 调用方应将 `auth-service` 视为 black box，而不是依赖其内部实现
- 登录与认证流程接口不以 Swagger 作为主文档
- 管理员接口要求：
  - internal service 上下文
  - authenticated operator context
  - 对应 permission code
- `tenantId / orgId / operator context / trace context` 是否必需，以具体接口文档为准
