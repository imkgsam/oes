# SESS-01 会话与令牌签发

更新时间：2026-03-23 19:45:00 +08:00

## 上游设计文档

- [../design/auth-center.md](../design/auth-center.md)
- [../design/session-token-management.md](../design/session-token-management.md)
- [../design/frontend-auth-context.md](../design/frontend-auth-context.md)

## 当前承接范围

- 建立 session
- 签发 access token
- 签发 refresh token

## 当前状态

- 部分实现

## 最小闭环范围

- contract：定义登录成功后的 token 返回结构
- schema：确认 session 持久化字段
- domain：Session 建模
- application：Session 创建与 token 签发
- interface：登录成功后返回最终结果
- tests：覆盖 session 建立、access/refresh 签发、登出前有效性
- doc：同步状态与验收结果

## 不包含范围

- refresh token rotation
- access token 验证闭环
- 前端权限初始化聚合接口

## 验收要求

- 账户选择成功后建立正式 session
- access token 包含最小身份上下文
- refresh token 与 session 建立关联

## 本次进展

- `SelectAccount` 成功后已进入 session 创建
- `SessionService` 已接入：
  - `CommonJwtService`
  - `ConfigService`
  - `IUserSessionRepository`
- 已签发正式 `accessToken / refreshToken`
- 已将 session 持久化到 Redis repository
- `SelectAccountResponse` 已补充：
  - `status`
  - `sessionId`
  - `accessToken`
  - `refreshToken`
  - `expiresIn`

## 当前剩余阻塞

- `refresh token rotation` 尚未实现
- `validateAccessToken / refreshTokens` 仍是基线实现
- 设备信息当前仍使用最小默认值，未接真实终端上下文

## 关联设计文档

- [../design/session-token-management.md](../design/session-token-management.md)
- [../design/frontend-auth-context.md](../design/frontend-auth-context.md)
