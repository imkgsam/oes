# Minimum Closure Global Review

更新时间：2026-03-28 23:15 +09:00

## 最近一次全局验证

- proto 生成命令：`pnpm proto:gen`
- common 构建命令：`pnpm --filter @oes/common build`
- auth-service Prisma Client 生成：`pnpm --filter auth-service prisma:generate`
- auth-service 构建命令：`pnpm --filter auth-service build`
- identifier 扫描命令：`node -r ts-node/register -r tsconfig-paths/register .\src\scripts\identifier-backfill-scan.ts --limit=10`
- 审核日期：2026-03-25
- 结果：通过

## 全局审核结论

| 审核项 | 结论 | 说明 |
| --- | --- | --- |
| contract / proto | 部分实现 | P0 人类认证主链、MFA challenge、账户选择、refresh、logout、session query、设备管理、管理员最小 session 管理与 `TOTP / Recovery Codes` 所需 gRPC 接口已接入，`SESS-05` session 查询现返回 `loginMethod / platform / browser / accessRemainingSeconds / refreshRemainingSeconds / sessionAgeSeconds / idleSeconds / isAccessExpired / isRefreshExpired / isRevoked` |
| application | 部分实现 | 邮箱/手机密码与 OTP 登录、`EMAIL_OTP / SMS_OTP / TOTP / Recovery Codes` MFA、账户选择、session/token 签发、refresh、logout、session query、设备管理、风控、审计已形成连续链路；`SESS-03 / RISK-01 / AUD-01` 已在 `auth-service` 边界内收口到完成态 |
| domain | 部分实现 | `Session` 聚合已完成当前阶段结构收口，支持 create / refresh / query / logout / device rename / keep-current-device / admin revoke，并已统一规范化 `deviceInfo` |
| infrastructure | 部分实现 | `identity-service` gRPC adaptor、Redis session repository、Redis 登录风险仓储、Redis OTP 频控仓储、认证审计 listener 已接入；session 索引更新与 refresh replay 检测已形成一致闭环 |
| interface | 部分实现 | 登录、MFA challenge 提交、账户选择、刷新会话、session 查询、登出、退出其他设备、管理员 session 查询与单撤销均已有 gRPC 入口；session 视图已返回更完整设备提示、运行态与运行统计 |
| doc | 部分实现 | 本次已将 `SESS-05` 收口到完成态，并同步任务、设计、总览与全局审核状态 |

## 最小闭环任务总览

| 任务编号 | 状态 | 审核结论 |
| --- | --- | --- |
| AUTH-01 | 部分实现 | 已完成 domain + CQRS + gRPC 接入，并能返回账户候选前置状态 |
| AUTH-02 | 部分实现 | 已完成邮箱 OTP challenge 与邮箱 OTP 登录闭环，仍待真实邮件通道收口 |
| AUTH-03 | 部分实现 | 已完成手机密码登录闭环，仍待真实手机号标识治理收口 |
| AUTH-04 | 部分实现 | 已完成手机 OTP challenge 与手机 OTP 登录闭环，仍待真实短信通道收口 |
| AUTH-05 | 部分实现 | 已接通真实账户候选查询、账户选择提交与归属校验 |
| SESS-01 | 部分实现 | 账户选择成功后可建立 session 并签发 access / refresh token |
| SESS-02 | 已实现 | 已移除 access token 文本持久化，活跃 session 链路已回到 CQRS handler，完成设备上下文规范化与 Redis 索引一致性收口 |
| SESS-03 | 已实现 | 已实现 refresh token rotation、索引一致性、refresh replay 检测与 session 撤销；当前完成态以 latest-refresh-token 模型为边界 |
| SESS-04 | 部分实现 | 已实现 logout / logoutAll 最小闭环，并接入审计事件 |
| SESS-05 | 已实现 | 已实现 session 列表、设备重命名、保留当前设备退出其他设备、管理员 session 列表与单 session 撤销，并返回 `loginMethod / platform / browser / accessRemainingSeconds / refreshRemainingSeconds / sessionAgeSeconds / idleSeconds / isAccessExpired / isRefreshExpired / isRevoked`；相关审计已带统一上下文 |
| CRED-01 | 已完成 | 已完成治理方案、扫描脚本、数据库 schema push、目标库验证与 repository 兼容双查清理；当前库内 `LoginMethod` 数据量为 `0` |
| MFA-04 | 已实现 | 已完成 challenge 触发、challenge 提交与恢复到账户选择链路 |
| MFA-05 | 已实现 | 已完成手机 OTP MFA challenge 接入 |
| MFA-06 | 已实现 | 已完成 OTP MFA 绑定查询、启用、停用管理面 |
| MFA-07 | 已实现 | 已完成 `TOTP` 初始化、激活、停用、登录 challenge 与 challenge 提交验证 |
| MFA-08 | 已实现 | 已完成 `Recovery Codes` 初始化、轮换、停用与 `TOTP` challenge 下一次性消费 |
| RISK-01 | 已实现 | 已完成规范化标识驱动的密码登录失败限制、临时锁定与锁定审计闭环 |
| RISK-02 | 部分实现 | 已完成 OTP 发码频控与 OTP 失败次数持久化 |
| AUD-01 | 已实现 | 已完成统一审计事件模型、关键认证节点事件输出，并补齐 `LOGIN_BLOCKED / REFRESH_TOKEN_REPLAY_DETECTED` 与统一会话/设备上下文 |

## 2026-03-28 23:00:00 +09:00 Incremental Review

- Scope: complete `SESS-03 / RISK-01 / AUD-01` inside the `auth-service` boundary
- Result:
  - `RefreshSession` now cross-checks `JWT sid` and refresh-token index ownership before rotation
  - refresh-token index mismatch, missing index, or stale token usage now trigger `AUTH_REFRESH_TOKEN_REPLAY_DETECTED`
  - replay detection now revokes the current session and emits `REFRESH_TOKEN_REPLAY_DETECTED`
  - password-login failure throttling now normalizes identifiers consistently for email/phone before read/write/delete
  - password-login lock hits now emit `LOGIN_BLOCKED`
  - task/design/overview/global-review docs now mark `SESS-03 / RISK-01 / AUD-01` as completed within the current service boundary
- Validation:
  - `pnpm --filter auth-service build`

## 2026-03-28 23:15:00 +09:00 Incremental Review

- Scope: finish `SESS-05` inside the `auth-service` boundary
- Result:
  - `SessionView` and `AdminSessionView` now return `sessionAgeSeconds`
  - `SessionView` and `AdminSessionView` now return `idleSeconds`
  - session runtime statistics now come directly from the session aggregate
  - task/design/overview/global-review docs now mark `SESS-05` as completed within the current service boundary
- Validation:
  - `pnpm proto:gen`
  - `pnpm --filter @oes/common build`
  - `pnpm --filter auth-service build`

## 2026-03-30 23:58:00 +09:00 Incremental Review

- Scope: close the minimal runtime bridge from `auth-service` to the new `notification-service`
- Result:
  - `notification-service` runtime now connects successfully to local PostgreSQL
  - direct gRPC verification confirmed `SendEmail` acceptance, idempotent replay, and persisted `NotificationDispatch`
  - `auth-service` now supports local static gRPC URL fallback for `identity-service / permission-service / notification-service`
  - `auth-service` source-mode startup now resolves gRPC proto files from absolute common contract paths
  - permission-service client loading was aligned to include both `permission_check.proto` and `permission_management.proto`
  - `auth-service` now boots successfully with `AUTH_NOTIFICATION_TRANSPORT=grpc`
- Validation:
  - `pnpm --filter notification-service build`
  - direct `notification-service` gRPC runtime call
  - direct Prisma read of `NotificationDispatch`
  - `pnpm --filter @oes/common build`
  - `pnpm --filter auth-service build`
  - source-mode `auth-service` startup with `AUTH_NOTIFICATION_TRANSPORT=grpc`
- Known blockers:
  - local Redis is still unavailable on `localhost:6379`
  - full OTP end-to-end dispatch from `auth-service` will still fail before notification dispatch until Redis is available

## 2026-03-25 10:30:00 +08:00 Incremental Review

- Scope: add the minimal `SESS-05` session query / device view slice
- Result:
  - added `ListSessions` gRPC contract
  - added `ListSessionsQuery / Handler`
  - controller now exposes `listSessions(userId, currentSessionId)`
  - session list response now carries device-facing fields and lifecycle timestamps
- Validation:
  - `pnpm proto:gen`
  - `pnpm --filter @oes/common build`
  - `..\..\node_modules\.bin\tsc.cmd -b --force` in `src/common`
  - `pnpm --filter auth-service build`

## 2026-03-25 11:00:00 +08:00 Incremental Review

- Scope: extend `SESS-05` with the minimal keep-current-device flow
- Result:
  - added `LogoutOtherDevices` gRPC contract
  - added `LogoutOtherDevicesCommand / Handler`
  - reused session repository `kickOtherDevices(userId, currentSessionId)`
  - audit events now include `LOGOUT_OTHER_DEVICES_SUCCEEDED`
- Validation:
  - `pnpm proto:gen`
  - `pnpm --filter @oes/common build`
  - `pnpm --filter auth-service build`

## 2026-03-25 12:00:00 +08:00 Incremental Review

- Scope: extend `SESS-05` with minimal device rename support
- Result:
  - added `RenameSessionDevice` gRPC contract
  - added `RenameSessionDeviceCommand / Handler`
  - session aggregate now supports `renameDevice(deviceName)`
  - validation enforces session existence and ownership
  - audit events now include `SESSION_DEVICE_RENAMED`
- Validation:
  - `pnpm proto:gen`
  - `pnpm --filter @oes/common build`
  - `pnpm --filter auth-service build`

## 2026-03-25 12:30:00 +08:00 Incremental Review

- Scope: extend `SESS-05` with admin-side minimal session management
- Result:
  - added `AdminListUserSessions` gRPC contract and query handler
  - added `AdminRevokeSession` gRPC contract and command handler
  - admin session view now includes revoke metadata
  - audit events now include `ADMIN_SESSION_REVOKED`
- Validation:
  - `pnpm proto:gen`
  - `pnpm --filter @oes/common build`
  - `pnpm --filter auth-service build`

## 2026-03-25 13:00:00 +08:00 Governance Review

- Scope: start identifier backfill governance
- Result:
  - added `CRED-01 Identifier Backfill`
  - added dedicated design doc `identifier-backfill.md`
  - froze the current normalization target format
  - recorded repository dual-lookup as temporary compatibility behavior
- Validation:
  - documentation review only

## 2026-03-25 13:15:00 +08:00 Governance Review

- Scope: add executable identifier inventory capability
- Result:
  - added `src/scripts/identifier-backfill-scan.ts`
  - added package script `identifier:scan`
  - verified script execution reaches Prisma query phase
- Validation:
  - `pnpm --filter auth-service build`
  - direct script execution via `node -r ts-node/register -r tsconfig-paths/register`
- Known blockers:
  - `pnpm run` on current Windows environment hits `EPERM: lstat 'C:\\Users\\csp'`

## 2026-03-25 14:20:00 +08:00 Governance Review

- Scope: verify identifier inventory script with local `.env`
- Result:
  - script now loads `.env`
  - direct execution reaches Prisma database access
  - current blocker changed from missing env to database shape mismatch:
    - Prisma error `P2021`
    - table `public.LoginMethod` does not exist
- Validation:
  - `pnpm --filter auth-service build`
  - direct script execution via `node -r ts-node/register -r tsconfig-paths/register`

## 2026-03-25 15:05:00 +08:00 Governance Review

- Scope: finish auth-service database baseline verification for `CRED-01`
- Result:
  - confirmed `auth-service` has `prisma:generate` and `prisma:push` scripts
  - executed Prisma schema push successfully against the target database
  - reran `identifier-backfill-scan`
  - target database now matches current auth-service schema
  - current scan result:
    - `total_login_methods=0`
    - `drift_count=0`
    - `collision_group_count=0`
- Validation:
  - `pnpm --filter auth-service prisma:generate`
  - `prisma db push`
  - direct script execution via `node -r ts-node/register -r tsconfig-paths/register`

## 2026-03-25 15:20:00 +08:00 Governance Review

- Scope: close `CRED-01` cleanup on the current target database
- Result:
  - removed repository compatibility dual-lookup from `prisma.loginmethod.repository.ts`
  - repository now queries normalized identifiers directly
  - current target database still contains `0` `LoginMethod` rows
- Validation:
  - `pnpm --filter auth-service build`

## 2026-03-25 15:40:00 +08:00 Incremental Review

- Scope: align `SESS-05` admin session interfaces to existing operator context
- Result:
  - removed `adminId` from `AdminListUserSessionsRequest`
  - removed `adminId` from `AdminRevokeSessionRequest`
  - `AuthGrpcController` now resolves operator identity from authenticated operator context
  - admin session interfaces now use `RequireAuthenticatedOperator + InternalServiceGuard + AuthenticatedOperatorGuard`
- Validation:
  - `pnpm proto:gen`
  - `pnpm --filter @oes/common build`
  - `pnpm --filter auth-service build`

## 2026-03-27 12:55:00 +09:00 Incremental Review

- Scope: continue `SESS-02` by making device context enter the session main path through `SelectAccount`
- Result:
  - updated session design to define `SelectAccount` as the formal device-context entry point
  - extended `SelectAccountRequest` with optional `deviceId / deviceName / userAgent / ipAddress`
  - extended `SelectAccountCommand` to carry device context
  - `SelectAccountHandler` now builds session device info from request input instead of always using `unknown/grpc`
  - backward compatibility is preserved when callers still omit device context
- Validation:
  - `pnpm proto:gen`
  - `cd src/common && pnpm exec tsc -b --force`
  - `pnpm --filter auth-service build`

## 2026-03-27 13:20:00 +09:00 Incremental Review

- Scope: improve session query readability by surfacing session login method
- Result:
  - `SelectAccount` now stores `loginMethod` in session metadata
  - `SessionView` now returns `loginMethod`
  - `AdminSessionView` now returns `loginMethod`
  - user-side and admin-side session lists can now distinguish the authentication source of each session
- Validation:
  - `pnpm proto:gen`
  - `cd src/common && pnpm exec tsc -b --force`
  - `pnpm --filter auth-service build`

## 2026-03-27 13:45:00 +09:00 Governance Review

- Scope: freeze the current boundary for session device-context ingress
- Result:
  - confirmed current shared authenticated gRPC context does not yet define device-context propagation
  - confirmed `api-gateway` downstream metadata factory only standardizes internal-service, operator-context, request-id, and trace-id metadata
  - froze the current phase on explicit `SelectAccountRequest` device-context fields
  - documented that any future shared metadata propagation for device context must be treated as a cross-module / architecture change
- Validation:
  - code and design review only

## 2026-03-27 14:05:00 +09:00 Governance Review

- Scope: record the deferred cross-module follow-up for device-context auto propagation
- Result:
  - added the deferred item to roadmap, index, and auth-center design

## 2026-03-28 11:05:00 +09:00 Incremental Review

- Scope: finish `MFA-07` by closing the `TOTP` MFA management and login challenge path
- Result:
  - added `InitializeTotpBinding` and `ActivateTotpBinding` gRPC contracts
  - `ListMfaBindings` now returns `TOTP`
  - users can initialize a `TOTP` binding and receive `secret / qrCodeUrl`
  - users can activate and disable `TOTP` binding through the formal management surface
  - login handlers now prioritize active `TOTP` bindings before OTP-based MFA factors
  - `SubmitMfaChallenge` now verifies `TOTP` by active binding id
  - audit events now include `MFA_BINDING_INITIALIZED` and `TOTP` binding enable / disable coverage
- Validation:
  - `pnpm proto:gen`
  - `cd src/common && pnpm exec tsc -b --force`
  - `pnpm --filter auth-service build`

## 2026-03-28 12:00:00 +09:00 Incremental Review

- Scope: finish `MFA-08` by closing `Recovery Codes` as the fallback factor for `TOTP`
- Result:
  - added `InitializeRecoveryCodes` and `RegenerateRecoveryCodes` gRPC contracts
  - `ListMfaBindings` now returns `BACKUP_CODE`
  - recovery code issuance now requires an active `TOTP` binding
  - `DisableMfaBinding` now formally supports `BACKUP_CODE`
  - `SubmitMfaChallenge` can now consume recovery codes under a `TOTP` challenge
  - consumed recovery codes are removed from the active binding and the binding is disabled when exhausted
  - audit events now cover `BACKUP_CODE` initialization and rotation
- Validation:
  - `pnpm proto:gen`
  - `cd src/common && pnpm exec tsc -b --force`
  - `pnpm --filter auth-service build`

## 2026-03-28 12:25:00 +09:00 Incremental Review

- Scope: finish the remaining `SESS-02` closure inside `auth-service`
- Result:
  - session device context is now normalized both on ingress and when reading historical session records
  - `SelectAccount` now derives minimal `platform / browser` hints from `userAgent`
  - default device naming is no longer tied to the old `grpc` placeholder
  - Redis session repository now updates refresh-token/device/IP indexes in the same transaction
  - cross-module device-context auto propagation remains deferred by design and is no longer treated as an in-scope `SESS-02` gap
- Validation:
  - `pnpm --filter auth-service build`
  - explicitly recorded that gateway-to-auth-service device-context auto propagation remains a future governance item
  - clarified that this item should re-enter through a cross-module design thread instead of being rediscovered ad hoc later
- Validation:
  - documentation review only

## 2026-03-28 12:40:00 +09:00 Incremental Review

- Scope: improve `SESS-05` device-view readability without adding new session-management actions
- Result:
  - `SessionView` now returns `platform` and `browser`
  - `AdminSessionView` now returns `platform` and `browser`
  - user-side and admin-side session lists now surface normalized device hints derived from session `deviceInfo`
- Validation:
  - `pnpm proto:gen`
  - `pnpm --filter @oes/common build`
  - `pnpm --filter auth-service build`

## 2026-03-28 12:55:00 +09:00 Incremental Review

- Scope: enrich session-related audit events with a unified session/device context
- Result:
  - `LOGIN_SUCCEEDED`, `SESSION_REFRESHED`, `SESSION_DEVICE_RENAMED`, `LOGOUT_SUCCEEDED`, and `ADMIN_SESSION_REVOKED` now carry a shared session context
  - batch logout events now include affected session ids/counts
  - the shared session context now includes:
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
- Validation:
  - `pnpm --filter auth-service build`

## 2026-03-28 13:05:00 +09:00 Incremental Review

- Scope: enrich `SESS-05` session queries with minimal runtime-state fields
- Result:
  - `SessionView` now returns `accessRemainingSeconds`
  - `SessionView` now returns `refreshRemainingSeconds`
  - `AdminSessionView` now returns `accessRemainingSeconds`
  - `AdminSessionView` now returns `refreshRemainingSeconds`
  - current values now come directly from the session aggregate instead of forcing clients to derive them from timestamps
- Validation:
  - `pnpm proto:gen`
  - `pnpm --filter @oes/common build`
  - `pnpm --filter auth-service build`

## 2026-03-28 13:20:00 +09:00 Incremental Review

- Scope: enrich `SESS-05` session queries with direct runtime-state flags
- Result:
  - `SessionView` now returns `isAccessExpired`
  - `SessionView` now returns `isRefreshExpired`
  - `SessionView` now returns `isRevoked`
  - `AdminSessionView` now returns `isAccessExpired`
  - `AdminSessionView` now returns `isRefreshExpired`
  - `AdminSessionView` now returns `isRevoked`
  - current values now come directly from the session aggregate instead of requiring clients to infer state from timestamps/status strings
- Validation:
  - `pnpm proto:gen`
  - `pnpm --filter @oes/common build`
  - `pnpm --filter auth-service build`

## 2026-03-30 16:20:00 +09:00 Incremental Review

- Scope: align OTP issuance inside `auth-service` to the accepted `notification-service` boundary without blocking on full `notification-service` implementation
- Result:
  - introduced `NotificationDispatchPort` as the auth-side outbound notification dependency
  - added `LocalNotificationDispatchAdaptor` as the current fallback implementation over local Email/SMS dev senders
  - email OTP login, phone OTP login, email OTP MFA challenge, and phone OTP MFA challenge no longer depend on `EmailService` / `SmsService` directly
  - current development-mode hardcoded OTP behavior is preserved through the fallback adaptor
- Validation:
  - `pnpm --filter auth-service build`

## 2026-03-30 18:45:00 +09:00 Incremental Review

- Scope: land the minimal `notification-service` MVP and bridge `auth-service` to it without breaking local development flows
- Result:
  - added `notification_service/notification.proto` and generated the first notification contract
  - created `notification-service` under `src/services/system/notification-service`
  - MVP currently supports `SendEmail` and `SendSms` acceptance, idempotency lookup, Prisma-backed dispatch persistence, and local provider adaptors
  - `auth-service` now includes `NotificationServiceGrpcAdaptor`
  - `auth-service` now selects notification dispatch transport by `AUTH_NOTIFICATION_TRANSPORT`, defaulting to `local`
- Validation:
  - `pnpm proto:gen`
  - `pnpm --filter notification-service prisma:generate`
  - `pnpm --filter @oes/common build`
  - `pnpm install`
  - `pnpm --filter notification-service build`
  - `pnpm --filter auth-service build`
- Runtime note:
  - `notification-service prisma:push` still failed because PostgreSQL at `localhost:5432` was unreachable during this round

## 2026-03-31 01:27:00 +09:00 Incremental Review

- Scope: finish the local `AUTH_NOTIFICATION_TRANSPORT=grpc` runtime closure for the email OTP login mainline
- Result:
  - split local PostgreSQL databases per service
  - moved local `auth-service` gRPC port to `50050`
  - aligned `identity-service` source-mode runtime for local static gRPC startup
  - fixed identity query request-field compatibility for `userId/accountId`
  - verified local end-to-end sequence:
    - `RequestEmailOtpLoginChallenge`
    - `LoginWithEmailOtp`
    - `SelectAccount`
    - session / access token / refresh token issuance
- Validation:
  - direct local gRPC verification against `notification-service`
  - direct local gRPC verification against `identity-service`
  - final local `auth-service` end-to-end verification returned:
    - `LOGIN_STATUS_ACCOUNT_SELECTION_REQUIRED` from `LoginWithEmailOtp`
    - `LOGIN_STATUS_SUCCESS` from `SelectAccount`
    - non-empty `sessionId`, `accessToken`, `refreshToken`

## 2026-03-27 15:05:00 +09:00 Incremental Review

- Scope: complete the Phase 1 OTP MFA management surface
- Result:
  - added `ListMfaBindings` query interface
  - added `EnableMfaBinding` and `DisableMfaBinding` commands
  - management now formally supports `EMAIL_OTP` and `SMS_OTP`
  - enabling requires a matching verified and enabled login method
  - audit events now include `MFA_BINDING_ENABLED` and `MFA_BINDING_DISABLED`
  - updated MFA design/task/overview docs to mark the Phase 1 OTP MFA surface as completed
- Validation:
  - `pnpm proto:gen`
  - `cd src/common && pnpm exec tsc -b --force`
  - `pnpm --filter auth-service build`
