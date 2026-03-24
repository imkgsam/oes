# Minimum Closure Global Review

更新时间：2026-03-24 14:20 +08:00

## 审核目标

- 为当前 `auth-service` 最小闭环推进提供统一的全局审核记录
- 明确最近一次工程验证覆盖范围与任务完成状态

## 审核范围

- contract / proto
- application
- domain
- infrastructure
- interface
- doc

## 最近一次全局验证

- proto 生成命令：`pnpm proto:gen`
- common 构建命令：`pnpm --filter @oes/common build`
- prisma 生成命令：`pnpm --filter auth-service prisma:generate`
- 构建命令：`pnpm --filter auth-service build`
- 审核日期：2026-03-24
- 结果：通过

## 全局审核结论

| 审核项 | 结论 | 说明 |
| --- | --- | --- |
| contract / proto | 部分实现 | P0 人类认证主链、MFA challenge、账户选择、refresh、logout、logoutAll 所需 gRPC 接口已接入 |
| application | 部分实现 | 邮箱/手机密码与 OTP 登录、MFA challenge 提交、账户选择、session/token 签发、refresh rotation、logout、logoutAll、风控、审计已形成连续链路 |
| domain | 部分实现 | `Session` 聚合已完成当前阶段结构收口；OTP/MFA/登录方式相关领域模型已可支撑主链 |
| infrastructure | 部分实现 | `identity-service` gRPC adaptor、Redis session repository、Redis 登录风险仓储、Redis OTP 频控仓储、认证审计 listener 已接入 |
| interface | 部分实现 | 登录、MFA challenge 提交、账户选择、刷新会话、登出均已有 gRPC 入口 |
| doc | 部分实现 | 本次已将总设计、路线图、索引和全局审核记录同步到当前实现状态 |

## 最小闭环任务总览

| 任务编号 | 状态 | 审核结论 |
| --- | --- | --- |
| AUTH-01 | 部分实现 | 已完成 domain + CQRS + gRPC 接入，并能返回账户候选前置状态 |
| AUTH-02 | 部分实现 | 已完成邮箱 OTP challenge 与邮箱 OTP 登录闭环，仍待真实邮件通道收口 |
| AUTH-03 | 部分实现 | 已完成手机密码登录闭环，仍待真实手机标识治理收口 |
| AUTH-04 | 部分实现 | 已完成手机 OTP challenge 与手机 OTP 登录闭环，仍待真实短信通道收口 |
| AUTH-05 | 部分实现 | 已接通真实账户候选查询、账户选择提交与归属校验 |
| SESS-01 | 部分实现 | 账户选择成功后可建立 session 并签发 access / refresh token |
| SESS-02 | 部分实现 | 已移除 access token 文本持久化，活跃 session 链路已回到 CQRS handler，并删除遗留 SessionService / SessionModule |
| SESS-03 | 部分实现 | 已实现 refresh token rotation、非法 token 拒绝与 replay 检测，仍为 latest-refresh-token 模型 |
| SESS-04 | 部分实现 | 已实现 logout / logoutAll 最小闭环，并接入审计事件 |
| MFA-04 | 部分实现 | 已完成 challenge 触发、challenge 提交与恢复到账户选择链路 |
| MFA-05 | 部分实现 | 已完成手机 OTP MFA challenge 接入，后续仍可继续完善更多管理与查询能力 |
| RISK-01 | 部分实现 | 已完成登录失败次数限制与临时锁定闭环 |
| RISK-02 | 部分实现 | 已完成 OTP 发码频控与 OTP 失败次数持久化 |
| AUD-01 | 部分实现 | 已完成统一审计事件模型与关键认证节点事件输出 |

## 2026-03-24 12:10:00 +08:00 Incremental Review

- Scope: fix MFA challenge usage boundary and align login audit with the real primary auth method
- Result:
  - `SubmitMfaChallenge` now rejects non-`MFA_VERIFY` OTP usage
  - `SubmitMfaChallenge` and `SelectAccount` now carry `loginMethod` through the active login path
  - login success audit no longer hard-codes `EmailPassword`
- Validation:
  - `pnpm proto:gen`
  - `pnpm --filter @oes/common build`
  - `pnpm --filter auth-service build`

## 2026-03-24 12:35:00 +08:00 Incremental Review

- Scope: register session structure refactor as an explicit task before continuing any session-family work
- Result:
  - added `SESS-02` as the dedicated session-structure-refactor task
  - linked `SESS-02` into `INDEX.md`, `roadmap.md`, and `design/session-token-management.md`
  - clarified that `SESS-02` is the required predecessor to later session-family capabilities
- Validation:
  - doc-only change

## 2026-03-24 12:55:00 +08:00 Incremental Review

- Scope: start `SESS-02` and remove access-token-text persistence from the current session model
- Result:
  - `Session` aggregate no longer persists access token text as session fact
  - Redis session repository no longer maintains access token indexes
  - access token validation path changed to `JWT verify + sessionId lookup + session status/window`
  - current refresh-token rotation behavior remains unchanged
- Validation:
  - `pnpm --filter auth-service prisma:generate`
  - `pnpm proto:gen`
  - `pnpm --filter @oes/common build`
  - `pnpm --filter auth-service build`

## 2026-03-24 13:08:00 +08:00 Incremental Review

- Scope: remove temporary session transition services and return the active session flow to CQRS handlers
- Result:
  - `SelectAccountHandler` now directly orchestrates session creation and token signing
  - `RefreshSessionHandler` now directly orchestrates refresh rotation
  - temporary transition services were removed
- Validation:
  - `pnpm --filter auth-service build`

## 2026-03-24 13:22:00 +08:00 Incremental Review

- Scope: remove the remaining legacy session facade and legacy session module from the codebase
- Result:
  - deleted legacy `src/application/services/session.service.ts`
  - deleted legacy `src/modules/session/session.module.ts`
  - active session flow no longer depends on `SessionService` / `SessionModule`
- Validation:
  - `pnpm --filter auth-service build`

## 2026-03-24 13:40:00 +08:00 Incremental Review

- Scope: align auth-service repository injection tokens with the permission-service repo-symbol style
- Result:
  - added `src/common/constants/symbols/repo.symbols.ts`
  - moved active repository injection from legacy string tokens to `REPO.*` symbols
  - removed the active `USER_REPOSITORY` misuse from MFA flows by switching them to `REPO.LOGIN_METHOD`
  - `AuthModule` repository providers now bind through `REPO.*`
- Validation:
  - `pnpm --filter auth-service build`

## 2026-03-24 13:55:00 +08:00 Incremental Review

- Scope: add the minimal `SESS-04` logout / logoutAll management slice
- Result:
  - added `Logout` and `LogoutAll` gRPC contracts
  - added `LogoutCommand/Handler` and `LogoutAllCommand/Handler`
  - controller now exposes `logout(sessionId)` and `logoutAll(userId)`
  - audit events now include `LOGOUT_SUCCEEDED` and `LOGOUT_ALL_SUCCEEDED`
- Validation:
  - `pnpm proto:gen`
  - `pnpm --filter @oes/common build`
  - `pnpm --filter auth-service build`

## 2026-03-24 14:20:00 +08:00 Incremental Review

- Scope: sync top-level auth-service progress documents to the current implementation baseline
- Result:
  - rewrote `INDEX.md`, `overview.md`, `roadmap.md`, and `design/auth-center.md` in clean UTF-8
  - aligned progress, completed slices, structure state, and next-step guidance with the current codebase
  - refreshed this global review record to match the latest implemented status
- Validation:
  - doc-only change
