# Auth Flow 设计

更新时间：2026-03-22 18:35:00 +08:00

## 文档定位

本文档描述 `auth-service` 的认证流程编排设计，是 [auth-center.md](./auth-center.md) 的专题拆分文档。

## 目标

- 统一不同登录方式的认证入口
- 将“认证成功”和“进入某个 account”拆成两个明确阶段
- 为 MFA、风控和后续扩展保留标准 challenge 机制

## 边界

本文档负责：

- 登录流程状态机
- challenge 机制
- 账户选择流程

本文档不负责：

- 凭据存储细节
- token 与 session 存储细节
- 前端权限展示接口细节

## 核心流程

### 流程一：主认证

1. 前端提交登录方式与凭据
2. `auth-service` 校验主凭据
3. 执行基础风控
4. 判断是否需要补 MFA
5. 若不需要补 MFA，则进入账户选择阶段

### 流程二：MFA challenge

1. 若主认证未满足目标认证强度，则返回 `MFA_REQUIRED`
2. `auth-service` 生成 `challengeId`
3. 前端提交 challenge 响应
4. 验证通过后进入账户选择阶段

### 流程三：账户选择

1. 查询 `identity-service` 中该 `user` 可进入的全部有效 `account`
2. 若仅有一个有效 `account`，自动进入
3. 若有多个有效 `account`，返回 `ACCOUNT_SELECTION_REQUIRED`
4. 用户确认后建立最终认证上下文

### 流程四：签发

1. 创建 session
2. 生成 access token / refresh token
3. 返回最终登录结果

## 标准结果状态

- `SUCCESS`
- `MFA_REQUIRED`
- `ACCOUNT_SELECTION_REQUIRED`
- `DENIED`

## Challenge 模型

建议增加 `AuthChallenge` 或等价模型，至少包含：

- `challengeId`
- `flowType`
- `userId`
- `candidateAccountIds`
- `status`
- `expiresAt`
- `context`

当前主要支持：

- `MFA_VERIFY`
- `ACCOUNT_SELECT`

## 设计规则

- controller 不直接拼接复杂流程状态
- 所有中间态均通过 challenge 显式建模
- 账户选择在 session 建立之前完成
- 无可用账户时，认证不能进入最终成功态

## 关联设计

- 上游总设计：[auth-center.md](./auth-center.md)

## 关联任务完成情况

全局审核记录：[minimum-closure-global-review.history.md](../history/minimum-closure-global-review.history.md)

| 序号 | 任务编号 | 任务文档 | 描述 | 当前状态 | 最后一次全局审核时间 | 备注 |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | AUTH-01 | [auth-01-email-password-login.md](../tasks/auth-01-email-password-login.md) | 邮箱密码主认证闭环 | 部分实现 | 2026-03-23 | 已切到 command/handler，并可返回 `ACCOUNT_SELECTION_REQUIRED + accounts` |
| 2 | AUTH-02 | [auth-02-email-otp-login.md](../tasks/auth-02-email-otp-login.md) | 邮箱 OTP 主认证闭环 | 未开始 | 2026-03-22 | OTP 登录链路尚未进入实现 |
| 3 | AUTH-03 | [auth-03-phone-password-login.md](../tasks/auth-03-phone-password-login.md) | 手机密码主认证闭环 | 未开始 | 2026-03-22 | 手机密码主认证尚未实现 |
| 4 | AUTH-04 | [auth-04-phone-otp-login.md](../tasks/auth-04-phone-otp-login.md) | 手机 OTP 主认证闭环 | 未开始 | 2026-03-22 | 手机 OTP 主认证尚未实现 |
| 5 | AUTH-05 | [auth-05-account-selection.md](../tasks/auth-05-account-selection.md) | 登录后账户选择闭环 | 部分实现 | 2026-03-23 | `auth-service` 已可承载候选账户列表，`identity-service` 真实查询仍未就绪 |
| 6 | SESS-01 | [sess-01-session-and-token-issuance.md](../tasks/sess-01-session-and-token-issuance.md) | 主认证后会话签发闭环 | 部分实现 | 2026-03-22 | Session 聚合已恢复编译，业务签发闭环未完成 |
