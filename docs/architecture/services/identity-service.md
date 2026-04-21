# identity-service 职责卡

## 1. Purpose

`identity-service` 是 OES 的账号与身份映射真相服务，负责回答“这个操作者是谁、有哪些账号、属于哪些租户或组织、可提供哪些身份展示查询”。

## 2. Owns

- 用户、账号与身份映射真相
- 租户、组织、成员关系的受控查询视图
- 联系资产与账号归属关系
- 登录后账号选择、上下文展示所需身份摘要
- 可选登录标识的身份侧语义；当前 `username` 只能按 legacy login handle 理解，不代表真实姓名

## 3. Does Not Own

- 密码、OTP、session 与认证挑战真相
- 权限码、角色、scope、policy 与授权判定真相
- 通知模板与投递真相
- 业务域角色语义真相
- 现实世界自然人的真实姓名、法定姓名、昵称或多语言姓名真相；这些应由 `party-service` 的自然人主体模型承接

## 4. Core Responsibilities

- 提供用户、账号、租户、组织等身份查询能力
- 维护账号与自然人身份、联系资产、组织成员关系的映射
- 为认证链路、上下文切换与前端展示提供身份侧事实源
- 为其他服务提供受控身份摘要，而不是暴露内部实现结构
- 区分登录标识与现实世界姓名：若未来需要用户名登录，应将其明确设计为唯一 login handle，而不是把真实姓名放入 `identity-service`

## 5. External Interfaces

- 典型上游入口：`auth-service`、`api-gateway`、业务服务
- 典型契约位置：
  - [identity-service/query.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/identity-service/query.md)
  - [identity-service/management.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/identity-service/management.md)
  - [identity-service/machine-auth.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/identity-service/machine-auth.md)

## 6. Upstream Dependencies

- `permission-service`
  - 为受保护管理接口提供授权判定真相
- `party-service`
  - 在需要自然人或组织主体抽象时提供上游 party 模型

## 7. Downstream / Published Facts

- 用户与账号归属关系
- 可切换 account context 列表与相关展示摘要
- 租户、组织、联系资产等身份侧展示查询事实
- 面向认证与管理链路的受控身份查询结果
- legacy `user.username` 字段如被读取，只能作为可选 login handle 展示或迁移依据，不得作为真实姓名真相源

## 8. Non-goals

- 不拥有 session、refresh token、认证 challenge 真相
- 不定义权限策略模型
- 不承载业务域客户、供应商、员工等最终业务角色语义
- 不提供真实姓名模糊搜索；如后续需要按姓名发现自然人，应先设计 `party-service` 协同能力
