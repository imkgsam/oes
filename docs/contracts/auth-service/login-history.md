# auth-service Login History API

> 服务设计唯一真相源：[auth-service.md](../../architecture/services/auth-service.md)。本文只描述 login history 查询视图语义，不重新定义 `auth-service` 审计 owner 边界。

## 1. 能力定位

Login history 是 `auth-service` 认证域审计事实的产品化、脱敏查询视图。

它不是独立于 audit event 的第二套真相，也不由集中审计平台在 Phase 2 接管 owner。

## 2. Event Coverage

普通 login history 展示用户能理解的登录相关事件：

- login success
- login failure
- login denied
- login MFA success / failure
- new-device login MFA result
- PDA login denied because no PDA account is available
- PDA login denied because multiple PDA accounts require admin resolution
- terminal access denied
- login flow not allowed for terminal

普通 login history 不展示：

- 每次 access token validate
- 每次 refresh token 成功
- PDA heartbeat
- PDA device diagnostics
- 普通设备运行日志

refresh token replay、session revoke、device-state-triggered session cleanup 等进入 security activity 或管理员审计视图。

## 3. Self-service Query

### `ListOwnLoginHistory`

- 作用：当前用户查看自己的登录历史。
- 权限：
  - self-service，不要求管理员 permission code。
  - target user 必须从当前 operator context 派生。

请求关键字段：

- `terminal`
- `result`
- `occurred_at_from`
- `occurred_at_to`
- `cursor`
- `page_size`

响应关键字段：

- `items[].occurred_at`
- `items[].result`
- `items[].terminal`
- `items[].login_flow`
- `items[].account_summary`
- `items[].tenant_summary`
- `items[].location_summary`
- `items[].client_summary`
- `items[].terminal_device_summary`
- `items[].reason_code`
- `next_cursor`

脱敏规则：

- 不返回完整 credential secret、OTP、token、refresh token、browser fingerprint 原始材料。
- IP、user agent、location 只返回展示摘要。

## 4. Admin Query

### `AdminListLoginHistory`

- 作用：管理员按可见范围查询认证登录历史视图。
- 权限：
  - 建议 permission code：`auth.audit.read` 或后续独立 `auth.login_history.admin.view`

支持筛选字段：

- `user_id`
- `account_id`
- `tenant_id`
- `terminal`
- `terminal_device_id`
- `result`
- `reason_code`
- `occurred_at_from`
- `occurred_at_to`
- `cursor`
- `page_size`

稳定语义：

- 查询必须按 operator scope 收敛。
- tenant-bound operator 只能查询当前可见租户范围内记录。
- 管理员视图可比 self-service 返回更多诊断字段，但仍不得暴露 secret、token 或高熵 fingerprint 原始材料。

## 5. Audit Relationship

底层认证域审计事实必须保留：

- `operatorId`
- `userId`
- `accountId`
- `tenantId`
- `terminal`
- `loginFlow`
- `terminalDeviceId`
- `deviceBoundTenantId`
- `sessionId`
- `traceId`
- `reasonCode`
- `policyDecision`
- `riskSummary`

login history 查询视图从这些事实映射而来。

## 6. 关联文档

- [audit.md](./audit.md)
- [terminal-aware-account-security.md](../../architecture/collaborations/terminal-aware-account-security.md)
