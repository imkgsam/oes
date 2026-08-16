# auth-service Terminal-aware Session Management API

> 服务设计唯一真相源：[auth-service.md](../../architecture/services/auth-service.md)。本文只描述 terminal-aware session 管理黑盒接口语义，不重新定义 session owner 边界。

## 1. 能力定位

Terminal-aware session management 覆盖：

- 用户查看自己的 active sessions
- 用户退出全部或指定 session
- 管理员筛选目标 sessions
- 管理员清退指定 session 或指定 user 的全部 sessions
- 受管终端设备状态事件触发的 session cleanup

`auth-service` owns active session truth。其他服务不得直接写 auth session 存储。

## 2. Session Read Model

session 列表项应至少包含：

- `session_id`
- `user_id`
- `account_id`
- `tenant_id`
- `terminal`
- `login_flow`
- `status`
- `issued_at`
- `expires_at`
- `last_seen_at`
- `revoked_at`
- `revoke_reason`

PDA / KIOSK 等受管终端 session 可包含：

- `terminal_device_id`
- `device_bound_tenant_id`
- `terminal_device_summary`

Web / Mobile session 可包含：

- `client_device_summary`
- `browser_summary`
- `ip_summary`
- `risk_summary`

这些 summary 仅用于展示和诊断，不是设备、浏览器、IP 或地理位置主数据真相。

## 3. Self-service APIs

### `ListOwnSessions`

- 作用：查询当前登录 user 的 active sessions。
- 权限：
  - self-service，不要求管理员 permission code。
  - target user 必须从当前 operator context 派生。

### `RevokeOwnSession`

- 作用：退出当前 user 的指定 session。
- 请求关键字段：
  - `session_id`
  - `operator_context`

稳定语义：

- 只能清退当前 user 自己的 session。
- 成功后记录认证安全审计。

### `RevokeOwnAllSessions`

- 作用：退出当前 user 的全部 sessions。
- 稳定语义：
  - 可选择保留当前 session 或连当前 session 一起退出，具体产品行为由 BFF contract 固定。
  - 必须记录认证安全审计。

## 4. Admin APIs

### `AdminListSessions`

- 作用：管理员筛选 active sessions。
- 权限：
  - 建议 permission code：`auth.session.admin.view`

支持筛选字段：

- `user_id`
- `account_id`
- `tenant_id`
- `terminal`
- `terminal_device_id`
- `status`
- `last_seen_from`
- `last_seen_to`
- `cursor`
- `page_size`

稳定语义：

- 读侧可以按 terminal / user / device 等筛选。
- 查询结果必须按 operator scope 收敛。
- tenant-bound operator 只能查看可见租户范围内的 sessions。

### `AdminListTerminalDeviceSessions`

- 作用：管理员按受管终端设备 ID 查询当前 active sessions，用于 PDA / KIOSK 设备详情聚合展示。
- 输入：
  - `terminal_device_id`
  - `terminal` 可选，用于进一步限制 PDA / KIOSK 等 terminal 类型
- 稳定语义：
  - 只读取 `auth-service` 自己持有的 session metadata。
  - 必须按 operator scope 收敛 tenant 可见性。
  - 不能反查或复制 `terminal-device-service` 的设备 registry 真相。
  - 该查询不执行 revoke；设备不可用清退仍走 `HandleTerminalDeviceUnavailable` 或显式 session revoke。

### `AdminRevokeSession`

- 作用：管理员清退指定 session。
- 权限：
  - 建议 permission code：`auth.session.admin.revoke`

### `AdminRevokeUserSessions`

- 作用：管理员清退指定 user 的全部 sessions。
- 权限：
  - 建议 permission code：`auth.session.admin.revoke`

明确不提供：

- 按筛选结果批量清退
- 按 terminal 批量清退
- 按 terminalDeviceId 批量清退的管理员按钮
- 按 tenant 批量清退

## 5. Managed Terminal Device Cleanup

### `HandleTerminalDeviceUnavailable`

- 作用：消费受管终端设备不可登录状态事件，并按 `terminal_device_id` 清退相关 active sessions。
- 触发方：
  - `terminal-device-service` 发布设备状态事件
- 事件场景：
  - disabled
  - lost
  - unbound
  - retired

稳定语义：

- `auth-service` 幂等处理事件。
- 真正 session revoke 由 `auth-service` 执行。
- 清退结果记录认证安全审计。
- PDA login / refresh / bootstrap 仍要重查设备状态作为兜底。

该能力不是管理员 session 页面上的任意批量清退能力。

## 6. 明确禁止

- 禁止 terminal-device-service 直接写 auth session。
- 禁止管理员在 Phase 2 按筛选条件任意批量清退。
- 禁止 session 复制完整 terminal-device registry 真相。
- 禁止 BFF 自行维护 session 状态。

## 7. 关联文档

- [session.md](./session.md)
- [terminal-aware-account-security.md](../../architecture/collaborations/terminal-aware-account-security.md)
- [managed-terminal-device-management.md](../../architecture/collaborations/managed-terminal-device-management.md)
