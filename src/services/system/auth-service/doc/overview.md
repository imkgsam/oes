# Auth Service 概览

更新时间：2026-03-24 00:28:22 +09:00

## 服务定位

`auth-service` 是 `oes` 的认证中心与会话安全中心。

当前阶段目标：

- 为人类用户提供统一认证入口
- 建立登录后账户选择模型
- 管理 session、access token、refresh token
- 提供基础 MFA、风控与认证审计

长期阶段目标：

- 演进为平台级账号安全中心
- 预留开放 API、机器身份、AI 代理等扩展能力

## 当前状态

- `gRPC` 已作为唯一对外接口方向
- 活跃主链已按 `CQRS` 推进
- 四个 P0 人类认证方式已接入统一认证编排
- `MfaBinding` 已正式落到 schema 与数据库
- 标识符规范化已进入收口阶段
- 遗留大 service 收缩已基本完成

## 已完成能力

- 邮箱密码登录
- 邮箱 OTP 登录
- 手机密码登录
- 手机 OTP 登录
- 登录后账户选择
- session 建立与 token 签发
- refresh token rotation
- 邮箱 OTP MFA
- 手机 OTP MFA challenge
- 登录失败限流
- OTP 发码频控
- 认证审计事件

## 当前关键约束

- `identity-service` 负责 `user/account/tenant` 主数据
- `permission-service` 负责授权决策
- 当前 session 结构已达到扩展边界，继续做 logout、device、session query 前必须先重构

## 推荐下一步

- 收口真实邮件/短信通道
- 明确 identifier backfill / 清洗策略
- 在继续 session 族能力前先完成 session 结构重构
