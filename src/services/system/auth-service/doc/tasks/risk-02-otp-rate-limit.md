# RISK-02 OTP Rate Limit

更新时间：2026-03-23 23:05:00 +08:00

## 上游设计文档

- [../design/auth-center.md](../design/auth-center.md)
- [../design/login-risk-control.md](../design/login-risk-control.md)
- [../design/mfa-management.md](../design/mfa-management.md)

## 当前承接范围

- OTP 发码频控
- OTP 校验失败次数限制

## 当前状态

- 部分实现

## 最小闭环范围

- contract：通过标准错误码承接发码超限与校验超限
- domain：修正 OTP 尝试次数规则，达到阈值前不提前失效
- infrastructure：独立建模 OTP 发码频控状态并使用 Redis 持久化
- application：发码前检查频控，发码后记录；校验失败时持久化尝试次数
- interface：现有 MFA challenge / resend 链路复用统一错误语义
- doc：同步任务、历史、设计、全局审核

## 不包含范围

- 登录失败锁定
- 人机验证
- 复杂风险评分
- OTP 登录主链

## 验收要求

- OTP 不能被无限请求
- OTP 不能被无限尝试
- 登录 OTP 与 MFA OTP 可复用同一基础设施，但按 usage 分流
- OTP 在达到最大尝试次数前不会因为一次输错直接失效

## 关联设计文档

- [../design/login-risk-control.md](../design/login-risk-control.md)
- [../design/mfa-management.md](../design/mfa-management.md)

## 阻塞项

- 当前只在 MFA 发码和验证链路中接入
- OTP 登录主链后续需要复用同一套频控与尝试次数规则
