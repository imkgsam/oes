# auth-service Contracts

## 1. 目的

本目录用于提供 `auth-service` 的黑盒接口文档。

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

契约真相源仍然是：

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

## 3. 全局调用约束

- 所有接口均为内部 gRPC 接口，不直接对外开放
- 调用方应将 `auth-service` 视为 black box，而不是依赖其内部实现
- 登录与认证流程接口不以 Swagger 作为主文档
- 管理员接口要求：
  - internal service 上下文
  - authenticated operator context
  - 对应 permission code
- `tenantId / orgId / operator context / trace context` 是否必需，以具体接口文档为准
