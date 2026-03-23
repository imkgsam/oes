# Identity Service 身份主数据中心设计

更新时间：2026-03-24 10:52:00 +09:00

## 文档定位

本文档是 `identity-service` 当前有效的完整设计正文，描述服务目标、边界、核心模型、阶段性实施方向和功能集合拆分。

## 1. 目标

`identity-service` 的设计目标不是“做一张用户表”，而是建立 `oes` 的身份主数据中心，为认证、授权和业务服务提供稳定的身份事实源。

当前阶段要求满足：

- 跨租户自然人统一身份
- 租户内业务账户建模
- 租户和组织边界建模
- 企业联系方式资产建模
- 后续机器身份建模预留

## 2. 边界

### 本服务负责

- `User`
- `UserAccount`
- `Tenant`
- `Org`
- `AccountContactAsset`
- `ServiceAccount / APIKey` 主数据预留

### 本服务不负责

- 登录认证
- 凭据校验
- MFA
- token / session
- 角色权限决策

## 3. 核心设计判断

### 3.1 `User`

表示自然人全局身份，跨租户统一。

### 3.2 `UserAccount`

表示自然人在某个租户下的业务账户，是进入系统后的直接业务主体。

约束：

- 同一个 `User` 可属于多个 `Tenant`
- 同一个 `User` 在同一个 `Tenant` 下只能有一个 `UserAccount`

### 3.3 `Tenant`

表示公司/租户边界，是正式主数据对象，不只是辅助上下文字段。

### 3.4 `Org`

表示租户内部组织结构，可表达子公司、部门、小组。

### 3.5 `AccountContactAsset`

企业邮箱、企业手机等联系方式应作为租户资产型绑定管理，而不是简单作为账户普通字段。

### 3.6 `ServiceAccount / APIKey`

机器身份主数据保留在 `identity-service` 内，但第一阶段不落实现。

## 4. 功能集合

### 1 Human Identity

- 自然人全局身份
- 个人登录标识归属

### 2 Account Identity

- 租户内业务账户
- 账户候选查询

### 3 Tenant Identity

- 租户主数据
- 账户归属边界

### 4 Organization Structure

- 组织树
- 主组织与多组织归属

### 5 Contact Asset

- 企业邮箱资产
- 企业手机资产

### 6 Machine Identity

- `ServiceAccount`
- `APIKey`

## 5. 分阶段落地

### Phase 1

- `0.1` gRPC + CQRS 基线
- `1.1` `User` 按个人邮箱查询
- `1.2` `User` 按个人手机查询
- `1.3` `User` 按 ID 查询
- `2.1` 按用户查询账户候选列表
- `2.2` 按账户 ID 查询账户
- `3.1` 租户最小查询

### Phase 2

- `4.1` 组织树查询
- `4.2` 主组织绑定
- `4.3` 多组织归属
- `5.1` 企业邮箱资产绑定
- `5.2` 企业手机资产绑定

### Phase 3

- `6.1` `ServiceAccount`
- `6.2` `APIKey`

## 6. 关联专题设计

- [human-identity.md](./human-identity.md)
- [account-identity.md](./account-identity.md)
- [tenant-identity.md](./tenant-identity.md)
- [organization-structure.md](./organization-structure.md)
- [contact-asset.md](./contact-asset.md)
- [machine-identity.md](./machine-identity.md)

## 7. 关联任务完成情况

全局审核记录：[minimum-closure-global-review.history.md](../history/minimum-closure-global-review.history.md)

| 序号 | 分类 | 任务编号 | 任务文档 | 描述 | 当前状态 | 最后一次全局审核时间 | 备注 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 服务基线 | 0.1 | [idn-foundation-01-grpc-cqrs-baseline.md](../tasks/idn-foundation-01-grpc-cqrs-baseline.md) | 建立 gRPC + CQRS 结构基线并标记 TCP 过时代码 | 已实现 | 2026-03-23 18:15 +08:00 | 结构基线已建立 |
| 2 | Human Identity | 1.1 | [idn-user-01-get-user-by-email.md](../tasks/idn-user-01-get-user-by-email.md) | 提供按个人邮箱查询自然人身份 | 已实现 | 2026-03-23 21:00 +08:00 | 当前以 `User.email` 承接个人邮箱语义 |
| 3 | Human Identity | 1.2 | [idn-user-02-get-user-by-phone.md](../tasks/idn-user-02-get-user-by-phone.md) | 提供按个人手机查询自然人身份 | 已实现 | 2026-03-23 21:00 +08:00 | 支撑后续手机登录链 |
| 4 | Human Identity | 1.3 | [idn-user-03-get-user-by-id.md](../tasks/idn-user-03-get-user-by-id.md) | 提供按用户 ID 查询自然人身份 | 已实现 | 2026-03-23 21:00 +08:00 | 支撑上下游关联查询 |
| 5 | Account Identity | 2.1 | [idn-account-01-get-accounts-by-user-id.md](../tasks/idn-account-01-get-accounts-by-user-id.md) | 查询用户可用账户候选列表 | 已实现 | 2026-03-24 10:18 +09:00 | `displayName` 已正式回归 `UserAccount` |
| 6 | Account Identity | 2.2 | [idn-account-02-get-account-by-id.md](../tasks/idn-account-02-get-account-by-id.md) | 查询单个账户详情 | 已实现 | 2026-03-24 10:18 +09:00 | 支撑 `auth-service` 账户上下文校验 |
| 7 | Tenant Identity | 3.1 | [idn-tenant-01-get-tenant-by-id.md](../tasks/idn-tenant-01-get-tenant-by-id.md) | 查询租户最小信息 | 已实现 | 2026-03-23 21:00 +08:00 | 支撑账户上下文展示 |
| 8 | Organization Structure | 4.1 | [idn-org-01-org-tree-query.md](../tasks/idn-org-01-org-tree-query.md) | 查询租户组织树 | 已实现 | 2026-03-23 21:00 +08:00 | 组织树查询已落地 |
| 9 | Organization Structure | 4.2 | [idn-org-02-account-primary-org-binding.md](../tasks/idn-org-02-account-primary-org-binding.md) | 账户主组织绑定能力 | 已实现 | 2026-03-23 21:00 +08:00 | schema 已按 membership 方向落地 |
| 10 | Organization Structure | 4.3 | [idn-org-03-account-multi-org-membership.md](../tasks/idn-org-03-account-multi-org-membership.md) | 账户多组织归属能力 | 已实现 | 2026-03-24 10:52 +09:00 | membership 增删查已落地 |
| 11 | Contact Asset | 5.1 | [idn-contact-01-account-work-email-asset.md](../tasks/idn-contact-01-account-work-email-asset.md) | 企业邮箱资产绑定 | 未开始 | 2026-03-23 18:15 +08:00 | 先在本服务内建子域 |
| 12 | Contact Asset | 5.2 | [idn-contact-02-account-work-phone-asset.md](../tasks/idn-contact-02-account-work-phone-asset.md) | 企业手机资产绑定 | 未开始 | 2026-03-23 18:15 +08:00 | 先在本服务内建子域 |
| 13 | Machine Identity | 6.1 | [idn-machine-01-service-account-model.md](../tasks/idn-machine-01-service-account-model.md) | 机器身份主体模型 | 未开始 | 2026-03-23 18:15 +08:00 | Phase 3 |
| 14 | Machine Identity | 6.2 | [idn-machine-02-api-key-model.md](../tasks/idn-machine-02-api-key-model.md) | 机器凭据模型 | 未开始 | 2026-03-23 18:15 +08:00 | Phase 3 |
