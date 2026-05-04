# identity-service 职责卡

## 1. Purpose

`identity-service` 是 OES 的账号与身份映射真相服务，负责回答“这个操作者是谁、有哪些账号、与哪些自然人主体或员工绑定、可提供哪些身份展示查询”。

## 2. Owns

- 用户、账号与身份映射真相
- `User -> Party(Person)` 的身份映射真相
- `UserAccount <-> Employee` 的绑定持久化真相
- 联系资产与账号归属关系
- 登录后账号选择、上下文展示所需身份摘要
- 可选登录标识的身份侧语义；当前 `username` 只能按 legacy login handle 理解，不代表真实姓名

## 3. Does Not Own

- 密码、OTP、session 与认证挑战真相
- 权限码、角色、scope、policy 与授权判定真相
- 通知模板与投递真相
- `Employee / Employment` 真相
- `Tenant / OrgUnit` 真相
- org tree 与 org hierarchy 真相
- 正式 `人 -> org` 任职真相
- 业务域角色语义真相
- 现实世界自然人的真实姓名、法定姓名、昵称或多语言姓名真相；这些应由 `party-service` 的自然人主体模型承接

## 4. Core Responsibilities

- 提供用户、账号、联系资产、机器身份等身份查询能力
- 维护账号与自然人身份、联系资产的映射
- 维护 `User.partyId` 到 `party-service` 自然人主体的受控关联
- 维护 `UserAccount <-> Employee` 绑定结果，并校验绑定双方在同 tenant、同自然人主体约束下的一致性
- 为认证链路、上下文切换与前端展示提供身份侧事实源
- 为其他服务提供受控身份摘要，而不是暴露内部实现结构
- 区分登录标识与现实世界姓名：若未来需要用户名登录，应将其明确设计为唯一 login handle，而不是把真实姓名放入 `identity-service`
- 对当前账号自助资料修改与管理员资料管理使用显式分离的接口边界，不允许通过复用 management 写接口来承载 self-service 语义

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
  - 当前已用于 `User.partyId` 映射与部分管理端展示聚合
- `tenant-org-service`
  - 为 tenant-scope service account 创建提供 tenant 引用校验
  - 为 auth / gateway 聚合 account context 时提供 tenant 生命周期与 tenant 展示真相

## 6.1 Collaboration References

- [party-identity-and-tenant-org.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/collaborations/party-identity-and-tenant-org.md)

## 7. Downstream / Published Facts

- 用户与账号归属关系
- `UserAccount <-> Employee` 绑定摘要
- 可切换 account context 列表与相关展示摘要
- 联系资产等身份侧展示查询事实
- 面向认证与管理链路的受控身份查询结果
- legacy `user.username` 字段如被读取，只能作为可选 login handle 展示或迁移依据，不得作为真实姓名真相源

## 8. Non-goals

- 不拥有 session、refresh token、认证 challenge 真相
- 不定义权限策略模型
- 不承载业务域客户、供应商、员工等最终业务角色语义
- 不拥有 `Employee / Employment -> OrgUnit` 的正式归属真相
- 不提供真实姓名模糊搜索；如后续需要按姓名发现自然人，应先设计 `party-service` 协同能力
