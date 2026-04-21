# API Gateway Contracts

## 1. 目的

本目录用于提供 `api-gateway` / BFF 面向前端与外部客户端的黑盒契约入口。

这里主要回答三类问题：

- 哪些 HTTP 能力已经形成可依赖契约
- 每组能力的职责边界是什么
- 具体应该去看哪份正式文档

本 README 只承担导航与边界说明职责，不重复正文契约细节。

## 2. 阅读规则

- 稳定接口语义以对应黑盒契约文档为准。
- 具体字段与错误细节，以 controller、DTO、ViewModel 与 Swagger 为准。
- 如果文档与代码实现冲突，应以代码为准，并回写修正文档。
- 阶段性执行状态、前端改造进度、临时跟进事项，不应堆叠到本 README。

## 3. 当前契约入口

- [auth-bff-login.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/api-gateway/auth-bff-login.md)
  - 登录主流程与登录后初始化上下文
- [auth-bff-extension-connect.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/api-gateway/auth-bff-extension-connect.md)
  - 浏览器插件显式连接授权与扩展端 session 建立契约
- [navigation-summary.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/api-gateway/navigation-summary.md)
  - 登录后导航可见性摘要契约
- [access-summary.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/api-gateway/access-summary.md)
  - 登录后权限摘要与 `actionCodes` 契约
- [auth-bff-self-service.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/api-gateway/auth-bff-self-service.md)
  - 已登录用户自助安全管理接口
- [auth-bff-admin-security.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/api-gateway/auth-bff-admin-security.md)
  - 管理员安全管理接口
- [permission-management.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/api-gateway/permission-management.md)
  - 权限管理后台接口
- [browser-prospecting-workspace.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/api-gateway/browser-prospecting-workspace.md)
  - Chrome 插件销售背调工作区 BFF 契约草案；当前为设计对齐用，尚未实现

## 4. 真相源位置

前端或调用方在阅读黑盒文档之外，还应同时参考当前代码中的契约实现：

- controller
- DTO
- ViewModel / presenter
- Swagger

其中 `auth-bff` 当前主要真相源位于：

- [auth.controller.ts](/Users/acehood/Documents/GitHub/oes/src/services/api-gateway/src/modules/auth-bff/interfaces/http/controllers/auth.controller.ts)
- [login.dto.ts](/Users/acehood/Documents/GitHub/oes/src/services/api-gateway/src/modules/auth-bff/interfaces/http/dtos/login.dto.ts)
- [auth-response.view-model.ts](/Users/acehood/Documents/GitHub/oes/src/services/api-gateway/src/modules/auth-bff/interfaces/http/view-models/auth-response.view-model.ts)
- [session-context.view-model.ts](/Users/acehood/Documents/GitHub/oes/src/services/api-gateway/src/modules/auth-bff/interfaces/http/view-models/session-context.view-model.ts)

## 5. 目录边界

- 本目录保留“调用方可依赖的 HTTP 契约”。
- 稳定设计原则与跨域边界，应回到 `docs/architecture/`。
- 阶段实施路径、执行步骤、线程分工，应回到 `docs/plans/`。
- 尚未冻结的认证后续项，应记录到 `docs/plans/candidates.md` 或对应 feature packet，而不是保留在 `contracts/`。
