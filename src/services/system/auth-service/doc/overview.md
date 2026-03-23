# Auth Service 概览

更新时间：2026-03-23 23:45:00 +08:00

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
- 主认证主线已打通
- 遗留大 service 正在收缩

## 已完成能力

- 邮箱密码登录
- 登录后账户选择
- session 建立与 token 签发
- refresh token rotation
- 邮箱 OTP MFA
- 登录失败限流
- OTP 发码频控
- 认证审计事件

## 当前关键约束

- `identity-service` 负责 `user/account/tenant` 主数据
- `permission-service` 负责授权决策
- 当前 session 结构已达到扩展边界，继续做 logout、device、session query 前必须先重构

## 推荐下一步

- 继续收缩遗留大 service
- 补齐剩余 P0 登录方式
- 在继续 session 族能力前先完成 session 结构重构
