# Auth Service 概览

更新时间：2026-03-25 15:40 +08:00

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

- `gRPC` 已作为唯一对外接口
- 活跃认证链路已按 `CQRS` 推进
- 四个 P0 人类认证方式均已接入统一主链
- 登录成功后可进入账户候选与账户选择
- session 建立、refresh rotation、logout、logoutAll、session query、设备重命名、保留当前设备退出其他设备、管理员单 session 撤销均已接入
- 管理员 session 接口已改为从既有 `operator context` 读取操作者身份
- 邮箱 OTP MFA 与手机 OTP MFA challenge 已接入
- 登录失败限流、OTP 发码频控、认证审计已接入
- `identifier backfill` 在当前目标数据库上已完成治理收口，当前 `LoginMethod` 数据量为 `0`

## 已完成能力

- 邮箱密码登录
- 邮箱 OTP 登录
- 手机密码登录
- 手机 OTP 登录
- 登录后账户选择
- session 建立与 token 签发
- refresh token rotation
- logout / logoutAll
- session 列表查询
- 设备重命名
- 保留当前设备并退出其他设备
- 管理员查看用户 session
- 管理员撤销指定 session
- 邮箱 OTP MFA
- 手机 OTP MFA challenge
- 登录失败限流
- OTP 发码频控
- 认证审计事件

## 当前关键约束

- `identity-service` 负责 `user/account/tenant` 主数据
- `permission-service` 负责授权决策
- token 仅承载最小身份上下文，不承载完整权限事实
- 当前邮件/短信仍是开发或模拟通道，不做真实生产通道接入
- `operator context` 已有项目级设计，`auth-service` 当前只做接入，不在本线程重新定义
- 当前目标数据库无历史 `LoginMethod` 数据，因此 `CRED-01` 已不再是活跃治理阻塞项

## 推荐下一步

1. 继续将其余 admin / management 接口向既有 `operator context` 收敛
2. 仅在接入真实历史数据后，再重新启用 `CRED-01` 的扫描与 backfill 治理
3. 再下一阶段可视需要收口真实邮件 / 短信通道
