# RISK-01 Login Failure Throttle

更新时间：2026-03-23 22:25:00 +08:00

## 上游设计文档

- [../design/auth-center.md](../design/auth-center.md)
- [../design/login-risk-control.md](../design/login-risk-control.md)

## 当前承接范围

- 登录失败次数限制
- 临时锁定基础能力

## 当前状态

- 部分实现

## 最小闭环范围

- contract：复用现有登录接口错误返回，不新增专用 RPC
- domain：独立建模登录失败状态与锁定规则
- infrastructure：使用 Redis 持久化失败次数与锁定时间
- application：登录前校验是否允许尝试；失败时累加；成功时清理
- interface：登录接口在锁定状态下返回标准错误
- doc：同步任务、历史、设计和全局审核

## 不包含范围

- 新设备识别
- 异地登录检测
- OTP 频控
- 风险事件审计

## 验收要求

- 连续失败达到阈值后，后续登录请求被拒绝
- 锁定状态使用统一错误码返回
- 登录成功后清理对应失败状态
- 当前闭环先覆盖邮箱密码登录

## 关联设计文档

- [../design/login-risk-control.md](../design/login-risk-control.md)

## 阻塞项

- 当前仅接入邮箱密码登录
- 手机密码登录和 OTP 登录后续需要复用同一套风险状态仓储
