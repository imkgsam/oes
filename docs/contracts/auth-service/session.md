# auth-service Session API

> 服务设计唯一真相源：[auth-service.md](../../architecture/services/auth-service.md)。本文只描述黑盒 gRPC session 接口语义，不重新定义 `auth-service` 的长期职责、核心对象或 owner 边界。
> `Tenant` lifecycle 与 tenant status 语义以 [tenant-org-service.md](../../architecture/services/tenant-org-service.md) 为准；本文只描述 session 校验时如何消费该事实。
> 角色、权限、policy、access summary、navigation governance 或 terminal access policy 的服务设计边界，以 [permission-service.md](../../architecture/services/permission-service.md) 为准。

## 1. 接口范围

`AuthService` 的 session 相关接口负责提供：

- 当前用户自助会话查看与登出
- 管理员查看目标用户会话
- 管理员撤销目标单个会话

Terminal-aware Account Security Phase 2 的 session 管理目标契约以 [session-management.md](./session-management.md) 为准；本文保留既有 session API 语义入口。

调用约束：

- 接口类型：gRPC
- 服务：`AuthService`
- 调用方：内部服务
- Proto 契约来源：
  - [auth.proto](../../../src/common/src/contracts/auth_service/auth.proto)

## 2. 自助会话接口

### `ValidateAccessToken`

- 作用：校验 access token 是否仍指向一个有效 session
- 使用场景：
  - API Gateway 在进入受保护接口前确认当前 token 对应的 session 仍未被删除、撤销或过期
  - 单会话退出、退出其他设备、全部退出后，确保旧设备上的后续请求会被真正拦下
- 适用调用方：
  - `api-gateway`
- 请求关键字段：
  - `access_token`
- 响应关键字段：
  - `user_id`
  - `account_id`
  - `tenant_id`
  - `session_id`
  - `scope_level`
  - `role_ids`
- 校验语义：
  - 必须先验证 JWT 本身有效
  - 必须确认 `sid` 指向的 session 仍存在且处于活动状态
  - 必须确认 token 中的 `user/account/tenant/scope` 与 session 真相一致
  - 对 `TENANT` scope session，必须通过 `tenant-org-service.GetTenantById` 确认 `tenant.status = ACTIVE`
  - `SYSTEM` scope session 不读取 tenant status
- 失败语义：
  - 任一校验不成立时返回稳定“access token 无效或已过期”语义
  - tenant 不存在或不再 `ACTIVE` 时返回 `AUTH_TENANT_NOT_ACTIVE`，不得继续使用该 session；实现可执行惰性 session 清理以关闭并发窗口

### `ListSessions`

- 作用：列出当前登录账号下的会话
- 使用场景：
  - 账号安全页查看当前账号在不同设备 / 浏览器 / 地点的登录情况
  - 用户识别当前账号的异常登录并决定是否退出其他设备
- 适用调用方：
  - 当前登录用户本人
- 请求关键字段：
  - `user_id`
  - `current_session_id`
- 响应关键字段：
  - `sessions[].session_id`
  - `sessions[].tenant_id`
  - `sessions[].terminal`
  - `sessions[].login_flow`
  - `sessions[].terminal_device_id`，PDA / KIOSK 等受管终端适用
  - `sessions[].device_name`
  - `sessions[].last_active_at`
  - `sessions[].is_current`
- 权限与上下文要求：
  - 不采用管理员型 `checkPermission`
  - 不采用 `buildQueryScope`
  - 不采用通用 `checkResource`
  - 依赖当前用户自助语义、调用方身份真实性与 `current_session_id` 解析出的当前 `account` 上下文
- tenant / org 要求：
  - Terminal-aware Account Security Phase 2 的自助账号安全页目标是展示当前 user 的 active sessions，并在列表项中显示 account / tenant / terminal 关联信息。

### `Logout`

- 作用：退出当前指定会话
- 使用场景：
  - 当前端设备主动登出
- 适用调用方：
  - 当前登录用户本人
- 请求关键字段：
  - `session_id`
- 响应关键字段：
  - `success`
- 权限与上下文要求：
  - 不采用管理员型 `checkPermission`
  - 不采用 `checkResource`
  - 依赖当前会话上下文与认证流程校验
- 副作用：
  - 删除目标 session

### `LogoutSession`

- 作用：退出当前账号下的指定其他活动会话
- 使用场景：
  - 用户识别异常登录后，精确退出某一个其他设备会话
- 适用调用方：
  - 当前登录用户本人
- 请求关键字段：
  - `user_id`
  - `current_session_id`
  - `target_session_id`
- 响应关键字段：
  - `success`
- 权限与上下文要求：
  - 不采用管理员型 `checkPermission`
  - 不采用 `checkResource`
  - 依赖 self-bound 自助语义与 `current_session_id` 解析出的当前 `account` 上下文
- tenant / org 要求：
  - 只能操作当前账号上下文下的其他活动会话
- 副作用：
  - 删除目标 session
  - 产生自助安全操作审计事件

### `LogoutOtherDevices`

- 作用：保留当前会话，退出当前账号下的其他设备
- 使用场景：
  - 用户发现当前账号存在异常登录后保留当前设备并清退其他终端
- 适用调用方：
  - 当前登录用户本人
- 请求关键字段：
  - `user_id`
  - `current_session_id`
- 响应关键字段：
  - `success`
  - `session_count`
- 权限与上下文要求：
  - 不采用管理员型 `checkPermission`
  - 不采用 `checkResource`
  - 依赖 self-bound 自助语义与 `current_session_id` 解析出的当前 `account` 上下文
- 副作用：
  - 删除当前账号除当前会话外的其他 session

### `LogoutAll`

- 作用：退出当前账号的全部会话
- 使用场景：
  - 用户主动清空当前账号的全部登录状态
  - 用户在安全事件后要求当前账号全端重新登录
- 适用调用方：
  - 当前登录用户本人
- 请求关键字段：
  - `user_id`
  - `current_session_id`
- 响应关键字段：
  - `success`
  - `session_count`
- 权限与上下文要求：
  - 不采用管理员型 `checkPermission`
  - 不采用 `checkResource`
  - 依赖 self-bound 自助语义与 `current_session_id` 解析出的当前 `account` 上下文
- 副作用：
  - 删除当前账号的全部 session

### `RefreshSession`

- 作用：使用 refresh token 轮换访问令牌与刷新令牌。
- 使用场景：
  - 客户端在 access token 过期前后延续当前登录态
- 请求关键字段：
  - `refresh_token`
- 响应关键字段：
  - `session_id`
  - `access_token`
  - `refresh_token`
  - `expires_in`
- tenant lifecycle 准入：
  - 对 `TENANT` scope session，必须通过 `tenant-org-service.GetTenantById` 确认 `tenant.status = ACTIVE`
  - 若 tenant 已 `SUSPENDED` 或 `ARCHIVED`，不得签发新的 access / refresh token
  - tenant 不存在或不再 `ACTIVE` 时返回 `AUTH_TENANT_NOT_ACTIVE`
  - 不能只依赖租户停用时的主动清理，因为清理可能失败或存在并发窗口
  - `SYSTEM` scope session 不读取 tenant status

### 自助账号切换说明

- 当多账号用户执行 `SelectAccount` 切换账号时，当前实现采用“替换当前会话”语义，而不是在同一设备额外保留一条并行自助会话。
- 该行为的目标是让自助安全中心反映“当前账号在不同设备或地点的登录”，而不是暴露内部上下文切换的技术细节。
- 因此自助会话页不应把 `context-switch` 作为主要用户可见登录方式。

## 3. 管理员会话接口

### `AdminListUserSessions`

- 作用：列出指定用户的会话列表
- 使用场景：
  - 租户管理员审查本租户用户登录状态
  - 系统管理员处理全局安全事件
- 适用调用方：
  - 租户管理员
  - 系统管理员
  - 其他被授权的管理员角色
- 请求关键字段：
  - `user_id`
- 响应关键字段：
  - `sessions[].session_id`
  - `sessions[].tenant_id`
  - `sessions[].status`
  - `sessions[].device_name`
  - `sessions[].last_active_at`
  - `sessions[].admin_revoke_reason`
- 权限与上下文要求：
  - 入口需要 `checkPermission`
  - 查询范围使用 `buildQueryScope`
  - 当前实现按 operator scope 计算 tenant-bound scope
- tenant / org 要求：
  - system scope 可见全局
  - tenant-bound operator 仅可见本 tenant 会话
- 说明：
  - tenant-bound 过滤责任已收口到 session repository 协议
  - 当前 thread 未修改管理员会话管理默认 UX；管理员能力仍按目标用户调查语义理解，不应与当前账号自助页语义混淆

### `AdminRevokeSession`

- 作用：撤销指定单个会话
- 使用场景：
  - 管理员强制下线可疑设备
  - 平台安全响应中撤销目标会话
- 适用调用方：
  - 租户管理员
  - 系统管理员
  - 其他被授权的管理员角色
- 请求关键字段：
  - `session_id`
  - `reason`
- 响应关键字段：
  - `success`
  - `session_id`
- 权限与上下文要求：
  - 入口需要 `checkPermission`
  - 单资源命令需要 `checkResource`
  - 当前实现先加载目标 session，再按 Session 聚合上的 `tenantId` 做 tenant-bound 授权判断
- tenant / org 要求：
  - system scope 可跨 tenant 操作
  - tenant-bound operator 仅可撤销本 tenant session
- 副作用：
  - 目标 session 被标记为管理员撤销
  - 产生认证审计事件

### `RevokeTenantSessions`

- 作用：撤销某个 tenant 下所有仍 active 的 `TENANT` scope sessions。
- 使用场景：
  - `tenant-org-service` 将 tenant status 变更为 `SUSPENDED`
  - `tenant-org-service` 将 tenant status 变更为 `ARCHIVED`
- 适用调用方：
  - `tenant-org-service`
- 请求关键字段：
  - `tenant_id`
  - `reason`
- 响应关键字段：
  - `success`
  - `revoked_session_count`
- 权限与上下文要求：
  - 仅允许内部服务调用
  - 调用方必须传播 trace / request context
- 作用范围：
  - 只影响目标 `tenant_id`
  - 只影响 `scope_level = TENANT` 且 active 的 session
  - 不影响 `SYSTEM` scope session
  - 不影响同一用户在其他 tenant 下的 session
  - tenant 恢复为 `ACTIVE` 后不恢复旧 session，用户需要重新登录

## 4. 当前不再保留的接口

### `RenameSessionDevice`

- 当前已从活跃契约中移除
- 原因：
  - 业务价值低
  - 不属于当前认证 / 会话主线最小必要能力

## 5. 主要错误与返回约束

- access token 指向的 session 已被删除、已失效、已撤销、已过期，或 token claims 与 session 真相不一致时：
  - 返回稳定“access token 无效或已过期”语义
- tenant-scope session 对应 tenant 已不存在、已停用或已归档时：
  - 返回 `AUTH_TENANT_NOT_ACTIVE`
- 自助单会话退出遇到目标会话不存在、已失效或已不再属于当前账号可见范围时：
  - 返回稳定“目标会话不可操作”语义，调用方不应依赖内部异常细节
- 调用方试图通过自助单会话退出能力操作当前正在使用的会话时：
  - 返回稳定“当前会话不允许通过该接口退出”语义
- 管理员越租户访问或操作会话时：
  - 返回统一 `ACCESS_DENIED`
- 查询对象不存在时：
  - 依具体接口语义返回空列表或成功空结果，调用方不应依赖内部异常细节推断流程
- 调用方应优先依赖接口语义与稳定错误码，而不是内部实现细节
