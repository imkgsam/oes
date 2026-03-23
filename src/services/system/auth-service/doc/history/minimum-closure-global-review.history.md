# Minimum Closure Global Review

更新时间：2026-03-23 23:05:00 +08:00

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
- 构建命令：`pnpm --filter auth-service build`
- 审核日期：2026-03-23
- 结果：通过

## 全局审核结论

| 审核项 | 结论 | 说明 |
| --- | --- | --- |
| contract / proto | 部分实现 | `AUTH-01`、`AUTH-05`、`SESS-01`、`SESS-03`、`MFA-04` 所需 gRPC 接口已接入，审计当前通过内部事件输出，不新增外部 RPC |
| application | 部分实现 | 邮箱密码登录、邮箱 OTP MFA、登录失败限制、OTP 频控、账户选择、session/token 签发、refresh rotation、认证审计事件已形成连续链路 |
| domain | 部分实现 | `Session` 聚合已用于 token 签发与 refresh rotation，但 session/token 结构已到重构边界 |
| infrastructure | 部分实现 | `identity-service` gRPC adaptor 已接通，Redis session repository、Redis 登录风险仓储、Redis OTP 频控仓储与认证审计 listener 已接入 |
| interface | 部分实现 | 登录、MFA challenge 提交、账户选择、刷新会话均已有 gRPC 入口，登录锁定通过标准错误返回 |
| doc | 部分实现 | `AUTH-05`、`SESS-01`、`SESS-03`、`MFA-04`、`RISK-01`、`RISK-02`、`AUD-01` 已同步任务、历史和设计状态 |

## 最小闭环任务总览

| 任务编号 | 状态 | 审核结论 |
| --- | --- | --- |
| AUTH-01 | 部分实现 | 已完成 domain + CQRS + gRPC 接入，并能返回账户候选前置状态 |
| AUTH-02 | 未开始 | 未进入实现 |
| AUTH-03 | 未开始 | 未进入实现 |
| AUTH-04 | 未开始 | 未进入实现 |
| AUTH-05 | 部分实现 | 已接通真实上游账户候选查询，并补齐账户选择提交与账户归属校验 |
| SESS-01 | 部分实现 | 账户选择成功后已建立 session 并签发 access/refresh token |
| SESS-03 | 部分实现 | 已实现 refresh token rotation、非法 token 拒绝与 replay 检测，token family 独立建模后续再做 |
| MFA-04 | 部分实现 | 已完成 challenge 触发、challenge 提交与恢复到账户选择链路 |
| MFA-05 | 未开始 | 未进入实现 |
| RISK-01 | 部分实现 | 已完成邮箱密码登录的失败次数限制与临时锁定闭环 |
| RISK-02 | 部分实现 | 已完成 MFA OTP 发码频控与失败次数限制闭环，OTP 登录主链尚未复用 |
| AUD-01 | 部分实现 | 已完成统一内部审计事件模型和关键认证节点日志输出 |

## 备注

- 本记录用于承接 `requirements.md` 中“最小闭环全局审核记录”要求
- 后续每完成一个最小闭环切片，都应更新本文档的验证结果和任务状态
- `pnpm --filter auth-service clear:build` 当前受本地 Node/PowerShell 环境影响会报 `EPERM: lstat 'C:\\Users\\csp'`，本次以 `pnpm --filter auth-service build` 作为有效编译验证
## 2026-03-23 23:35:00 +08:00 Incremental Review

- Scope: start shrinking the legacy `MfaService`
- Result: the active MFA-04 login path now uses focused services instead of depending directly on `MfaService`
- Status: passed local build with `pnpm --filter auth-service build`
- Note: `MfaService` is now explicitly marked `OUTDATED`; do not add new MFA-04 flow logic back into it
