# auth-service Audit API

> 服务设计唯一真相源：[auth-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/auth-service.md)。本文只描述黑盒 gRPC audit 查询接口语义，不重新定义 `auth-service` 的长期职责、核心对象或 owner 边界。
> 审计查询入口涉及的 permission code、checkPermission 或 buildQueryScope 语义，以 [permission-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/permission-service.md) 与项目级授权架构为准；本文只描述 auth-service audit contract。

## 1. 接口范围

`AuthService` 的 audit 相关接口负责提供认证域本地审计事件查询能力，不修改状态。

适用场景：

- 租户管理员审查本租户认证与会话事件
- 系统管理员进行全局安全排查
- 安全运营或审计角色检索认证域事件轨迹

调用约束：

- 接口类型：gRPC
- 服务：`AuthService`
- 调用方：内部服务
- Proto 契约来源：
  - [auth.proto](/Users/acehood/Documents/GitHub/oes/src/common/src/contracts/auth_service/auth.proto)

## 2. 审计查询接口

### `ListAuditEvents`

- 作用：列出 `auth-service` 本地认证审计事件
- 使用场景：
  - 排查登录失败与异常认证行为
  - 审查 session 撤销、logout、refresh token replay 等安全事件
  - 按资源、操作者、时间范围检索认证域审计记录
- 适用调用方：
  - 租户管理员
  - 系统管理员
  - 其他被授权的安全 / 审计角色
- 请求关键字段：
  - `service`
  - `module`
  - `event_type`
  - `result`
  - `operator_id`
  - `tenant_id`
  - `org_id`
  - `resource_type`
  - `resource_id`
  - `occurred_at_from`
  - `occurred_at_to`
  - `cursor`
  - `page_size`
- 响应关键字段：
  - `items[].event_id`
  - `items[].module`
  - `items[].event_type`
  - `items[].occurred_at`
  - `items[].result`
  - `items[].operator_id`
  - `items[].tenant_id`
  - `items[].resource_type`
  - `items[].resource_id`
  - `items[].details_json`
  - `next_cursor`
- 权限与上下文要求：
  - 入口需要 `checkPermission`
  - 当前 permission code 为 `AUTH_MANAGEMENT_PERMISSION_CODES.VIEW_AUDIT_EVENT`
  - 查询范围使用 `buildQueryScope`
  - 当前实现按 operator scope 计算 tenant-bound scope
- tenant / org 要求：
  - system scope 可查询全局 audit 记录
  - tenant-bound operator 仅可查询本 tenant audit 记录
  - tenant-bound operator 显式传入其他 tenant 时，当前实现直接拒绝，而不是静默改写
- 错误语义：
  - 越 tenant 查询时返回统一 `ACCESS_DENIED`
  - 过滤条件非法时返回统一 validation failure
- 分页语义：
  - 使用 cursor 分页
  - `page_size` 当前默认值为 `20`

## 3. 当前授权模型说明

`ListAuditEvents` 不按“系统管理员接口”与“租户管理员接口”拆分为两个不同能力。

当前模型是：

- 一个统一的审计查询能力
- 入口用 `checkPermission` 判断是否具备查看审计的能力
- 范围用 `buildQueryScope` 决定是全局可见还是 tenant-bound 可见

因此，角色主要影响可见范围，而不改变接口语义。
