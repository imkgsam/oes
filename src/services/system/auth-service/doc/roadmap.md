# Auth Service 路线图

更新时间：2026-03-23 23:45:00 +08:00

## 当前阶段判断

- 当前处于 `Phase 1` 中段
- 人类认证主线已打通
- 安全增强能力已进入第二阶段
- session 族能力暂停继续扩展，等待结构重构

## 当前已完成

1. 主认证主线
- `AUTH-01` 邮箱密码登录
- `AUTH-05` 账户候选查询与账户选择

2. 会话与 token
- `SESS-01` session 建立与 token 签发
- `SESS-03` refresh token rotation

3. MFA
- `MFA-04` 邮箱 OTP MFA challenge 与 challenge 提交
- `MfaService` 活跃链路已开始拆分

4. 风控与审计
- `RISK-01` 登录失败限流
- `RISK-02` OTP 发码频控与失败次数持久化
- `AUD-01` 认证审计事件

## 当前未完成但优先级高

1. 认证方式扩展
- `AUTH-02` 邮箱 OTP 登录
- `AUTH-03` 手机密码登录
- `AUTH-04` 手机 OTP 登录

2. MFA 扩展
- `MFA-05` 手机 OTP MFA
- 继续拆分遗留 `MfaService`

3. session 结构
- session 模型重构
- 之后再进入 logout、device、session query、access token validate

## Phase 划分

### Phase 1

目标：
- 完成可落地的人类认证中心

范围：
- 邮箱/手机 + 密码或 OTP 登录
- 登录后账户选择
- access token / refresh token
- refresh token rotation
- 基础 MFA
- 基础风控
- 基础认证审计

### Phase 2

目标：
- 补强平台安全治理能力

范围：
- 更强风控
- 账户恢复与安全处置
- 管理员安全操作
- session 管理增强

### Phase 3

目标：
- 预留并落地外部生态扩展

范围：
- 微信/Google 扩展
- 开放 API
- 机器身份与 AI 扩展

## 当前建议顺序

1. 继续收缩遗留大 service
2. 补 `AUTH-02/03/04`
3. 补 `MFA-05`
4. 在继续任何 session 族能力前，先做 session 结构重构
