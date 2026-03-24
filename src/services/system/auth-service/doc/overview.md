# Auth Service 概览

更新时间：2026-03-24 14:20 +08:00

## 服务定位

`auth-service` 是 `oes` 的认证中心与会话安全中心。

当前阶段目标：

- 为人类用户提供统一认证入口
- 建立登录后账户选择模型
- 管理 session、access token、refresh token
- 提供基础 MFA、风控与认证审计

长期阶段目标：

- 演进为平台级账号安全中心
- 预留开放 API、机器身份与 AI 代理相关能力

## 当前状态

- `gRPC` 已作为唯一对外接口方向
- 活跃认证链路已按 `CQRS` 推进
- 四个 P0 人类认证方式已接入统一主链
- 登录成功后可进入账户候选与账户选择
- session 建立、refresh rotation、logout、logoutAll 已接入主链
- 邮箱 OTP MFA 与手机 OTP MFA challenge 已接入
- 登录失败限流、OTP 发码频控、认证审计已接入
- 遗留大 service 已基本退出活跃主链

## 已完成能力

- 邮箱密码登录
- 邮箱 OTP 登录
- 手机密码登录
- 手机 OTP 登录
- 登录后账户选择
- session 建立与 token 签发
- refresh token rotation
- logout / logoutAll
- 邮箱 OTP MFA
- 手机 OTP MFA challenge
- 登录失败限流
- OTP 发码频控
- 认证审计事件

## 当前关键约束

- `identity-service` 负责 `user/account/tenant` 主数据
- `permission-service` 负责授权决策
- token 仅承载最小身份上下文，不承载完整权限事实
- 当前邮件/短信仍偏开发通道，尚未收口到真实生产通道
- identifier 兼容查询仍保留，是否做 backfill 仍待决策

## 推荐下一步

1. 明确并收口真实邮件/短信通道
2. 明确 identifier backfill / 清洗策略
3. 继续 session 族能力前，优先用最小闭环方式推进 `SESS-05`
