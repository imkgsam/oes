# AUD-01 Auth Audit Events

更新时间：2026-03-23 22:45:00 +08:00

## 上游设计文档

- [../design/auth-center.md](../design/auth-center.md)
- [../design/login-risk-control.md](../design/login-risk-control.md)
- [../design/auth-flow.md](../design/auth-flow.md)

## 当前承接范围

- 认证域基础审计事件闭环

## 当前状态

- 部分实现

## 最小闭环范围

- event model：定义统一的认证审计事件结构
- application：在登录失败、MFA challenge、登录成功、refresh 成功处产出事件
- infrastructure：通过内部事件监听器统一记录日志
- interface：不新增外部接口，但形成内部可消费输出
- doc：同步任务、历史、设计、全局审核

## 不包含范围

- 外部安全运营平台对接
- 高级风险评分事件
- 机器身份审计
- 登出审计

## 验收要求

- 至少覆盖登录失败、MFA challenge、登录成功、token refresh 成功
- 审计事件使用统一模型输出
- 监听器对事件进行统一日志记录

## 关联设计文档

- [../design/login-risk-control.md](../design/login-risk-control.md)
- [../design/auth-flow.md](../design/auth-flow.md)

## 阻塞项

- 当前 `SESS-04` 已接入 `LOGOUT_SUCCEEDED` / `LOGOUT_ALL_SUCCEEDED` 事件
- 当前仅落本地内部事件与日志输出，未接外部审计平台
