# SESS-01 Select Account Token Issuance History

更新时间：2026-03-23 19:45:00 +08:00

## 本次变更

- `SelectAccount` 成功后接入 `SessionService.createSession`
- `SessionService` 开始使用 `CommonJwtService` 与 `IUserSessionRepository`
- 正式签发 `accessToken / refreshToken`
- `SelectAccountResponse` 返回最终登录成功所需字段

## 约束

- 本次不实现 refresh token rotation
- 本次不实现 access token 验证闭环
- 设备信息仍使用最小默认值

## 验证要求

- `pnpm proto:gen`
- `pnpm --filter auth-service build`
