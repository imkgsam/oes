# auth-service Session API

## 1. 模块职责

`AuthService` 的 session 相关接口负责提供：

- 当前用户自助会话查看与登出
- 管理员查看目标用户会话
- 管理员撤销目标单个会话

调用约束：

- 接口类型：gRPC
- 服务：`AuthService`
- 调用方：内部服务
- 契约真相源：
  - [auth.proto](/Users/acehood/Documents/GitHub/oes/src/common/src/contracts/auth_service/auth.proto)

## 2. 自助会话接口

### `ListSessions`

- 作用：列出当前用户自己的全部会话
- 使用场景：
  - 账号安全页查看登录设备
  - 用户识别异常登录并决定是否退出其他设备
- 适用调用方：
  - 当前登录用户本人
- 请求关键字段：
  - `user_id`
  - `current_session_id`
- 响应关键字段：
  - `sessions[].session_id`
  - `sessions[].tenant_id`
  - `sessions[].device_name`
  - `sessions[].last_active_at`
  - `sessions[].is_current`
- 权限与上下文要求：
  - 不采用管理员型 `checkPermission`
  - 不采用 `buildQueryScope`
  - 不采用通用 `checkResource`
  - 依赖当前用户自助语义与调用方身份真实性
- tenant / org 要求：
  - 返回的会话以当前用户自身资源为边界

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

### `LogoutOtherDevices`

- 作用：保留当前会话，退出同一用户的其他设备
- 使用场景：
  - 用户发现异常登录后保留当前设备并清退其他终端
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
  - 依赖 self-bound 自助语义
- 副作用：
  - 删除当前用户除当前会话外的其他 session

### `LogoutAll`

- 作用：退出当前用户的全部会话
- 使用场景：
  - 用户主动清空全部登录状态
  - 用户在安全事件后要求全端重新登录
- 适用调用方：
  - 当前登录用户本人
- 请求关键字段：
  - `user_id`
- 响应关键字段：
  - `success`
  - `session_count`
- 权限与上下文要求：
  - 不采用管理员型 `checkPermission`
  - 不采用 `checkResource`
  - 依赖 self-bound 自助语义
- 副作用：
  - 删除当前用户的全部 session

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

## 4. 当前不再保留的接口

### `RenameSessionDevice`

- 当前已从活跃契约中移除
- 原因：
  - 业务价值低
  - 不属于当前认证 / 会话主线最小必要能力

## 5. 主要错误与返回约束

- 管理员越租户访问或操作会话时：
  - 返回统一 `ACCESS_DENIED`
- 查询对象不存在时：
  - 依具体接口语义返回空列表或成功空结果，调用方不应依赖内部异常细节推断流程
- 调用方应优先依赖接口语义与稳定错误码，而不是内部实现细节
