# AUD-01 Auth Audit Events

更新时间：2026-03-28 23:00 +09:00

## 上游设计文档

- [../design/auth-center.md](../design/auth-center.md)
- [../design/login-risk-control.md](../design/login-risk-control.md)
- [../design/auth-flow.md](../design/auth-flow.md)

## 当前承接范围

- 认证域基础审计事件闭环

## 当前状态

- 已实现

## 最小闭环范围

- event model：定义统一的认证审计事件结构
- application：在登录失败、MFA challenge、登录成功、refresh 成功处产出事件
- infrastructure：通过内部事件监听器统一记录日志
- interface：不新增外部接口，但形成内部可消费输出
- doc：同步任务、历史、设计、全局审核

## 不包含范围

- 外部安全运营平台对接
- 高级风险评分事件
- 机器身份审计
- 外部 SIEM / 审计仓集成

## 验收要求

- 至少覆盖登录失败、MFA challenge、登录成功、token refresh 成功
- 审计事件使用统一模型输出
- 监听器对事件进行统一日志记录
- session 相关事件应尽量输出统一的会话与设备上下文
- refresh token replay 与登录锁定命中应进入统一审计链路

## 关联设计文档

- [../design/login-risk-control.md](../design/login-risk-control.md)
- [../design/auth-flow.md](../design/auth-flow.md)

## 当前完成结果

- 当前已形成统一内部事件模型与统一日志监听器输出
- 当前已覆盖登录失败、登录锁定、MFA challenge、MFA 绑定管理、登录成功、refresh 成功、refresh token replay、logout、设备管理与管理员单 session 撤销
- session 相关事件已统一携带会话与设备上下文
- 批量登出事件已统一携带受影响 session 列表或数量

## 后续增强但不计入本任务缺口

- 当前仅落本地内部事件与日志输出，未接外部审计平台

## 2026-03-28 Current Alignment

- 当前已覆盖：
  - `LOGIN_BLOCKED`
  - `LOGIN_FAILED`
  - `MFA_CHALLENGE_CREATED`
  - `MFA_BINDING_ENABLED`
  - `MFA_BINDING_DISABLED`
  - `MFA_BINDING_INITIALIZED`
  - `MFA_BINDING_ROTATED`
  - `LOGIN_SUCCEEDED`
  - `REFRESH_TOKEN_REPLAY_DETECTED`
  - `SESSION_REFRESHED`
  - `SESSION_DEVICE_RENAMED`
  - `LOGOUT_SUCCEEDED`
  - `LOGOUT_OTHER_DEVICES_SUCCEEDED`
  - `LOGOUT_ALL_SUCCEEDED`
  - `ADMIN_SESSION_REVOKED`
- 其中 session 相关事件现在已统一携带最小会话与设备上下文：
  - `sessionId`
  - `userId`
  - `accountId`
  - `tenantId`
  - `loginMethod`
  - `deviceId`
  - `deviceName`
  - `userAgent`
  - `ipAddress`
  - `platform`
  - `browser`
