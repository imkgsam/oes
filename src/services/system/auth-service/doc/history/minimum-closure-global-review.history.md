# Minimum Closure Global Review

更新时间：2026-03-25 15:40 +08:00

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
| contract / proto | 部分实现 | P0 人类认证主链、MFA challenge、账户选择、refresh、logout、session query、设备管理、管理员最小 session 管理所需 gRPC 接口已接入，`SESS-05` admin 请求体已移除显式 `adminId` |
| application | 部分实现 | 邮箱/手机密码与 OTP 登录、MFA challenge 提交、账户选择、session/token 签发、refresh、logout、session query、设备管理、风控、审计已形成连续链路 |
| domain | 部分实现 | `Session` 聚合已完成当前阶段结构收口，支持 create / refresh / query / logout / device rename / keep-current-device / admin revoke |
| infrastructure | 部分实现 | `identity-service` gRPC adaptor、Redis session repository、Redis 登录风险仓储、Redis OTP 频控仓储、认证审计 listener 已接入 |
| interface | 部分实现 | 登录、MFA challenge 提交、账户选择、刷新会话、session 查询、登出、退出其他设备、管理员 session 查询与单撤销均已有 gRPC 入口；admin 入口已接入既有 operator context |
| doc | 部分实现 | 本次已将 `SESS-05`、`CRED-01` 与 operator context admin 接入口收口到顶层索引、路线图、总设计与全局审核 |

## 最小闭环任务总览

| 任务编号 | 状态 | 审核结论 |
| --- | --- | --- |
| AUTH-01 | 部分实现 | 已完成 domain + CQRS + gRPC 接入，并能返回账户候选前置状态 |
| AUTH-02 | 部分实现 | 已完成邮箱 OTP challenge 与邮箱 OTP 登录闭环，仍待真实邮件通道收口 |
| AUTH-03 | 部分实现 | 已完成手机密码登录闭环，仍待真实手机号标识治理收口 |
| AUTH-04 | 部分实现 | 已完成手机 OTP challenge 与手机 OTP 登录闭环，仍待真实短信通道收口 |
| AUTH-05 | 部分实现 | 已接通真实账户候选查询、账户选择提交与归属校验 |
| SESS-01 | 部分实现 | 账户选择成功后可建立 session 并签发 access / refresh token |
| SESS-02 | 部分实现 | 已移除 access token 文本持久化，活跃 session 链路已回到 CQRS handler，并删除遗留 SessionService / SessionModule |
| SESS-03 | 部分实现 | 已实现 refresh token rotation、非法 token 拒绝与 replay 检测，仍为 latest-refresh-token 模型 |
| SESS-04 | 部分实现 | 已实现 logout / logoutAll 最小闭环，并接入审计事件 |
| SESS-05 | 部分实现 | 已实现 session 列表、设备重命名、保留当前设备退出其他设备、管理员 session 列表与单 session 撤销；admin 操作者来自既有 operator context |
| MFA-04 | 部分实现 | 已完成 challenge 触发、challenge 提交与恢复到账户选择链路 |
| MFA-05 | 部分实现 | 已完成手机 OTP MFA challenge 接入 |
| RISK-01 | 部分实现 | 已完成登录失败次数限制与临时锁定闭环 |
| RISK-02 | 部分实现 | 已完成 OTP 发码频控与 OTP 失败次数持久化 |
| AUD-01 | 部分实现 | 已完成统一审计事件模型与关键认证节点事件输出 |
| CRED-01 | 已完成 | 已完成治理方案、扫描脚本、数据库 schema push、目标库验证与 repository 兼容双查清理；当前库内 `LoginMethod` 数据量为 `0` |

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
