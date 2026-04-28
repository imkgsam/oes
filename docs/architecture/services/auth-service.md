# auth-service 职责卡

## 1. Purpose

`auth-service` 是 OES 的认证与会话真相服务，负责回答“操作者如何被认证、当前会话是否有效、认证挑战如何推进”。

## 2. Owns

- 认证方式与认证流程真相
- 登录挑战、OTP、MFA、账户选择续流真相
- 会话建立、刷新、失效与撤销真相
- 认证链路本地审计事件
- 与认证结果直接相关的 token 签发语义

## 3. Does Not Own

- 用户自然人主数据真相
- 账号、租户、组织展示模型真相
- 角色、权限、policy 与授权判定真相
- 联系资产主数据真相
- 业务域状态真相

## 4. Core Responsibilities

- 执行主认证与后续 challenge 流程
- 维护 session 生命周期与 refresh 语义
- 在登录完成或上下文切换后签发新的 token 对
- 为 Gateway / BFF 提供认证链路与会话相关能力
- 记录认证、安全与会话操作的审计事实
- 对账号安全写操作显式区分 self-service 与 admin-management 边界，不允许长期复用同一 gRPC 写接口承载两种权限语义

## 5. External Interfaces

- 典型上游入口：`api-gateway` / BFF
- 典型契约位置：
  - [auth-service/login.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/auth-service/login.md)
  - [auth-service/session.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/auth-service/session.md)
  - [auth-service/mfa.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/auth-service/mfa.md)
  - [auth-service/audit.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/auth-service/audit.md)

## 6. Upstream Dependencies

- `identity-service`
  - 提供用户、账号、租户等身份映射与展示支撑查询
- `notification-service`
  - 提供 OTP / 安全提醒等通知投递能力，但不接管 OTP 真相
- `permission-service`
  - 仅在管理接口或受保护场景中提供授权判定真相

## 7. Downstream / Published Facts

- 会话是否成立、是否可刷新、是否被撤销
- challenge 是否存在、是否已完成、是否过期
- 当前 token 对应的认证结果与会话上下文摘要
- 认证与会话相关审计事实

## 8. Non-goals

- 不直接定义前端聚合返回模型
- 不直接拥有租户、组织、权限、联系资产等平台主数据
- 不通过复制 `identity-service` 或 `permission-service` 内部模型形成事实耦合
