# Auth Service 概览

更新时间：2026-03-30 23:58 +09:00

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
- session 建立、refresh rotation、logout、logoutAll、session query、保留当前设备退出其他设备、管理员单 session 撤销均已接入
- 管理员 session 接口已改为从既有 `operator context` 读取操作者身份
- 邮箱 OTP MFA、手机 OTP MFA challenge、OTP MFA 绑定管理、TOTP MFA 与 Recovery Codes 已接入
- 登录失败限流、OTP 发码频控、认证审计已接入
- `identifier backfill` 在当前目标数据库上已完成治理收口，当前 `LoginMethod` 数据量为 `0`

## 现在做到哪一步了

- 已经做完：人类认证 P0 主链已经打通，可以完成登录、MFA 分支、账户选择、session 签发、refresh、logout 和最小 session 管理
- 还没做完：真实邮件/短信通道、部分更深的上游授权摘要能力、跨模块设备上下文自动透传

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
- 保留当前设备并退出其他设备
- 管理员查看用户 session
- 管理员撤销指定 session
- session 设备视图返回 `loginMethod / platform / browser`
- session 运行态视图返回 `accessRemainingSeconds / refreshRemainingSeconds`
- session 运行统计视图返回 `sessionAgeSeconds / idleSeconds`
- session 运行态视图返回 `isAccessExpired / isRefreshExpired / isRevoked`
- session 审计事件返回统一的会话与设备上下文
- 邮箱 OTP MFA
- 手机 OTP MFA challenge
- OTP MFA 绑定查询 / 启用 / 停用
- TOTP MFA 初始化 / 激活 / 停用 / challenge
- Recovery Codes 初始化 / 轮换 / 停用 / challenge fallback
- 登录失败限流
- OTP 发码频控
- 认证审计事件
- 登录锁定审计事件
- refresh token replay 审计事件

## 当前关键约束

- `identity-service` 负责 `user/account/tenant` 主数据
- `permission-service` 负责授权决策
- token 仅承载最小身份上下文，不承载完整权限事实
- 当前邮件/短信仍是开发或模拟通道，不做真实生产通道接入
- OTP 发码链路已先收敛到 `NotificationDispatchPort`
- 当前 `auth-service` 已同时具备本地 fallback adaptor 与 `notification-service` gRPC adaptor，且本地已验证 `grpc` 模式可运行
- `operator context` 已有项目级设计，`auth-service` 当前只做接入，不在本线程重新定义
- 当前目标数据库无历史 `LoginMethod` 数据，因此 `CRED-01` 已不再是活跃治理阻塞项

## 当前最需要补的缺口

- 邮件和短信仍是模拟发送
- `notification-service` 最小 MVP 代码已落地，且本地 PostgreSQL / gRPC / idempotency / dispatch 落库已完成运行验证
- `auth-service` 已支持本地静态 gRPC URL 直连 `identity-service / permission-service / notification-service`
- 本地 `AUTH_NOTIFICATION_TRANSPORT=grpc` 下的邮箱 OTP 登录主链已完成端到端验证
- 更高阶 MFA 因子已到 `Recovery Codes` 为止；更远端因子尚未启动

## 当前边界判断

- `auth-service` 当前已经能承接设备上下文字段并写入 session
- 但设备上下文的“自动透传”还没有项目级共享机制
- 因此现阶段继续沿用 `SelectAccountRequest` 显式字段是合理边界
- 如果后续要把设备上下文纳入共享 gRPC metadata / common authorization context，需要先走跨模块设计

## 推荐下一步

1. 若要推进“自动设备上下文透传”，先补跨模块设计，不直接在本线程扩 `common`
2. 若继续回到主线功能，优先补 `permission-service` 本地运行基线，再扩更完整的账户授权摘要联调
