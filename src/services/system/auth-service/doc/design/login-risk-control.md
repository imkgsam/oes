# Login Risk Control 设计

更新时间：2026-03-28 23:00 +09:00

## 文档定位

本文档说明 `auth-service` 当前阶段的登录安全与风控设计。

## 目标

- 用最低必要复杂度覆盖高收益安全能力
- 在不引入复杂风控引擎的前提下提升登录安全性

## Phase 1 范围

- 登录失败次数限制
- OTP 发码频控
- OTP 校验失败次数限制
- 新设备识别
- 账户临时锁定

## 结果模型

- `ALLOW`
- `CHALLENGE`
- `DENY`

## 规则要求

- 规则应在应用层统一执行，不分散到 controller
- 风控结果必须进入认证审计链路
- OTP 与密码登录都应受到频控与失败限制

## 当前实现选择

- `RISK-01` 独立建模登录失败状态，不把失败计数塞回登录方式或用户主数据
- 当前失败状态以规范化后的登录标识为维度存于 Redis，适合承接临时锁定场景
- 邮箱密码登录和手机密码登录已经复用同一套风险状态仓储
- 锁定命中已进入统一认证审计链路

## 后续增强

- 异地登录检测
- 异常时段检测
- 人机验证挂载点
- 更复杂风险评分

## 关联设计

- 上游总设计：[auth-center.md](./auth-center.md)
- 流程设计：[auth-flow.md](./auth-flow.md)

## 关联任务完成情况

全局审核记录：[minimum-closure-global-review.history.md](../history/minimum-closure-global-review.history.md)

| 序号 | 任务编号 | 任务文档 | 描述 | 当前状态 | 最后一次全局审核时间 | 备注 |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | RISK-01 | [risk-01-login-failure-throttle.md](../tasks/risk-01-login-failure-throttle.md) | 登录失败限制与临时锁定闭环 | 已实现 | 2026-03-28 23:00:00 +09:00 | 当前完成态覆盖邮箱密码登录与手机密码登录，设备/IP 维度增强后续再做 |
| 2 | RISK-02 | [risk-02-otp-rate-limit.md](../tasks/risk-02-otp-rate-limit.md) | OTP 频控与失败次数限制闭环 | 部分实现 | 2026-03-23 23:05:00 +08:00 | MFA OTP 发码频控与失败次数限制已接入，OTP 登录主链尚未复用 |
| 3 | AUD-01 | [aud-01-auth-audit-events.md](../tasks/aud-01-auth-audit-events.md) | 认证审计事件闭环 | 已实现 | 2026-03-28 23:00:00 +09:00 | 当前完成态为统一内部事件与日志输出；外部平台对接后置 |
