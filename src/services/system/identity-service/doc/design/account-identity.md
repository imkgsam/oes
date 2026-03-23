# Account Identity 设计

更新时间：2026-03-23 18:15:00 +08:00

## 文档定位

本文档描述 `UserAccount` 的模型、约束和账户查询职责。

## 1. 目标

建立租户内业务账户模型，作为用户进入系统后的直接业务主体。

## 2. 核心规则

- 一个 `User` 可属于多个 `Tenant`
- 同一个 `User` 在同一个 `Tenant` 下只能有一个 `UserAccount`
- 登录后进入系统必须落到某个有效 `UserAccount`
- `UserAccount` 承载租户内差异信息

## 3. 建议字段方向

- `id`
- `userId`
- `tenantId`
- `displayName`
- `employeeCode`
- `status`
- `primaryOrgId`
- `createdAt`
- `updatedAt`

## 4. 查询职责

第一阶段最小查询能力：

- `getAccountsByUserId`
- `getAccountById`

## 5. 与其他子域关系

- `UserAccount` 是 `permission-service` 的主要授权主体事实源
- `UserAccount` 后续可关联主组织与多组织归属
- 企业联系方式不直接作为普通字段建模

## 6. 关联任务完成情况

全局审核记录：[minimum-closure-global-review.history.md](../history/minimum-closure-global-review.history.md)

| 序号 | 任务编号 | 任务文档 | 描述 | 当前状态 | 最后一次全局审核时间 | 备注 |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | 2.1 | [idn-account-01-get-accounts-by-user-id.md](../tasks/idn-account-01-get-accounts-by-user-id.md) | 查询用户可用账户候选列表 | 已实现 | 2026-03-23 18:15 +08:00 | 当前以 `Tenant.name` 临时承接展示名 |
| 2 | 2.2 | [idn-account-02-get-account-by-id.md](../tasks/idn-account-02-get-account-by-id.md) | 查询单个账户详情 | 已实现 | 2026-03-23 18:15 +08:00 | 支撑 `auth-service` 账户上下文校验 |
