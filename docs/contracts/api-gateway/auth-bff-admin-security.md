# auth-bff Admin Security API

## 1. 能力定位

本文档描述 `auth-bff` 面向管理员安全管理场景开放的 HTTP 接口。

这组接口覆盖：

- 查看指定用户的会话列表
- 撤销指定单个会话
- 查询认证域审计事件

适用对象：

- 租户管理员
- 系统管理员
- 其他被授权的安全 / 审计角色

这组接口不属于认证流程，也不属于当前用户自助安全管理。

## 2. 当前可对接接口

### `GET /auth/admin/users/:userId/sessions`

- 作用：查看目标用户的会话列表
- 使用场景：
  - 租户管理员查看本租户用户当前有哪些活跃设备
  - 系统管理员排查目标用户登录状态
- 权限模型：
  - Gateway 入口需要 `checkPermission`
  - 当前粗粒度 permission code 为 `auth.session.admin.view`
  - 下游 `auth-service` 使用 `buildQueryScope`
- 作用域模型：
  - system scope 可见全局
  - tenant-bound operator 仅可见本 tenant 会话

### `POST /auth/admin/sessions/:sessionId/revoke`

- 作用：撤销目标单个会话
- 使用场景：
  - 管理员强制下线可疑登录设备
  - 平台安全响应中撤销目标 session
- 权限模型：
  - Gateway 入口需要 `checkPermission`
  - 当前粗粒度 permission code 为 `auth.session.admin.revoke`
  - 下游 `auth-service` 使用 `checkResource`
- 作用域模型：
  - system scope 可跨 tenant
  - tenant-bound operator 仅可撤销本 tenant session

### `GET /auth/admin/audit-events`

- 作用：列出认证域审计事件
- 使用场景：
  - 查看登录失败、MFA、session 撤销、refresh replay 等认证域审计
  - 按时间、资源、操作者筛选 auth 审计
- 权限模型：
  - Gateway 入口需要 `checkPermission`
  - 当前粗粒度 permission code 为 `auth.audit.list`
  - 下游 `auth-service` 使用 `buildQueryScope`
- 作用域模型：
  - system scope 可查询全局
  - tenant-bound operator 仅可查询本 tenant 审计

## 3. 真相源

前端与其他线程在阅读本黑盒文档之外，还应同时参考以下当前真相源：

- BFF controller：
  - [auth.controller.ts](/Users/acehood/Documents/GitHub/oes/src/services/api-gateway/src/modules/auth-bff/interfaces/http/controllers/auth.controller.ts)
- 请求 DTO：
  - [admin-security.dto.ts](/Users/acehood/Documents/GitHub/oes/src/services/api-gateway/src/modules/auth-bff/interfaces/http/dtos/admin-security.dto.ts)
- 响应 ViewModel：
  - [admin-security.view-model.ts](/Users/acehood/Documents/GitHub/oes/src/services/api-gateway/src/modules/auth-bff/interfaces/http/view-models/admin-security.view-model.ts)
- 下游黑盒说明：
  - [auth-service session.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/auth-service/session.md)
  - [auth-service audit.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/auth-service/audit.md)

## 4. 当前边界

- 这组接口是管理员能力，不应给普通自助页面直接调用。
- 角色不会拆成不同 HTTP 接口；不同管理员角色通过 scope 获得不同可见范围。
- 查询与撤销的最终 tenant 边界判定在下游 `auth-service` 中完成。
- 当前契约支持“审计事件筛选”和“按目标 `userId` 查看会话”，但不包含管理员用户搜索器。
- 因此前端当前应通过以下方式进入目标用户会话排查：
  - 从审计事件记录中的 `operatorId` 跳转
  - 手动输入已知 `userId`
- 若需要按邮箱 / 手机号 / 用户名搜索目标用户，必须新增 BFF 黑盒契约，不应让前端直接调用内部 `identity-service`。
