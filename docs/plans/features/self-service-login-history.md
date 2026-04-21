# 自助登录历史

## 1. 目标

- 在“个人账户 > 账户安全”中提供当前用户自己的登录历史查询能力。
- 第一阶段将“登录历史”冻结为“登录尝试历史”，只展示：
  - `LOGIN_SUCCESS`
  - `LOGIN_FAILED`
- 保持“活动会话管理”与“登录历史”分离，不把当前 feature 扩展成安全事件时间线。

## 2. 不做什么

- 不混入 `SESSION_REFRESHED`、`LOGOUT_SUCCEEDED`、`ADMIN_SESSION_REVOKED` 等 session 事件。
- 不做异常登录分析、地理位置解析、风险评分或安全通知联动。
- 不做跨账号、跨租户或管理员视角的登录历史聚合。
- 不让前端直接复用管理员 audit query 能力。

## 3. 当前结论

- 数据真相源采用 `auth-service` 本地 audit，而不是当前活动 session 列表。
- 该能力必须是 self-bound query，只允许当前认证用户查看自己的登录历史。
- “登录历史”在当前设计中属于 `user` 级安全历史，而不是当前 `account` 级会话历史：
  - 登录尝试发生在账号选择之前
  - 同一个自然人下多个 account 不应把同一次登录尝试拆散成多个 account 视图
- BFF 应提供独立黑盒接口，不能复用管理员 `GET /auth/admin/audit-events`。
- 第一阶段返回字段以“用户可读的登录记录”为主，而不是原始 audit envelope：
  - `occurredAt`
  - `outcome`
  - `loginMethod`
  - `ipAddress`
  - `deviceName`
  - `platform`
  - `browser`
  - `failureReason`
  - `traceId`
- 已实现补强：
  - 邮箱 / 手机密码失败登录现在会写入设备快照
  - 设备快照来源为 `deviceName` 与 HTTP `user-agent / ip`
  - 当客户端未显式提供 `deviceName` 时，由 `auth-service` 统一推导默认设备摘要
- 第一阶段允许轻量筛选：
  - `result`
  - `occurredAtFrom`
  - `occurredAtTo`
  - `cursor`
  - `pageSize`

## 4. 契约真相位置

- 下游：
  - `auth-service` 新增 self-bound 登录历史查询 gRPC 契约
- BFF：
  - `GET /auth/login-history`
- 前端：
  - 账户安全页中的独立“登录历史”标签页

## 5. 验收标准

- 用户可以在账户安全页看到独立的“登录历史”标签页。
- 登录历史只显示当前用户自己的 `LOGIN_SUCCESS / LOGIN_FAILED`。
- 活动会话管理与登录历史不会混在同一列表中。
- 用户可以按结果和时间范围做轻量筛选。
- 页面默认按发生时间倒序展示。

## 6. 残余后续项

- `OTP` 失败登录归属补齐后置：
  - 当前仅对邮箱 / 手机密码失败登录补齐 `userId` 归属
  - 邮箱 / 手机 OTP 失败链路尚未进入 self login-history 的完整归属语义
  - 后续应作为独立后置 feature / sidecar work 处理，而不是在当前主线中继续扩张
- 异常登录提示后置。
- IP 归属地解析后置。
- 登录历史与安全通知联动后置。
- 会话事件混入时间线后置。
