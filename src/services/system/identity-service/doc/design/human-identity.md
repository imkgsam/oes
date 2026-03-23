# Human Identity 设计

更新时间：2026-03-23 15:20:00 +08:00

## 文档定位

本文档描述 `identity-service` 中自然人全局身份 `User` 的设计边界、字段归属和查询职责。

## 1. 目标

建立跨租户统一的自然人身份模型，作为认证登录标识和账户归属关系的上游事实源。

## 2. 核心规则

- 同一个自然人跨租户保持统一身份
- 个人邮箱、个人手机属于 `User`
- 企业邮箱、企业手机不属于 `User`
- 企业邮箱、企业手机不允许作为登录入口

## 3. 建议字段方向

- `id`
- `username`
- `personalEmail`
- `personalPhone`
- `status`
- `createdAt`
- `updatedAt`

## 4. 查询职责

第一阶段最小查询能力：

- 按个人邮箱查 `User`
- 按个人手机查 `User`
- 按 `userId` 查 `User`

## 5. 与其他子域关系

- `User` 通过 `UserAccount` 关联到 `Tenant`
- `User` 不承载租户内职位、工号、组织、状态差异

## 6. 关联任务完成情况

全局审核记录：[minimum-closure-global-review.history.md](../history/minimum-closure-global-review.history.md)

| 序号 | 任务编号 | 任务文档                                                                   | 描述                     | 当前状态 | 最后一次全局审核时间 | 备注             |
| ---- | -------- | -------------------------------------------------------------------------- | ------------------------ | -------- | -------------------- | ---------------- |
| 1    | 1.1      | [idn-user-01-get-user-by-email.md](../tasks/idn-user-01-get-user-by-email.md) | 按个人邮箱查询自然人身份 | 未开始   | 2026-03-23           | 支撑邮箱登录链路 |
| 2    | 1.2      | [idn-user-02-get-user-by-phone.md](../tasks/idn-user-02-get-user-by-phone.md) | 按个人手机查询自然人身份 | 未开始   | 2026-03-23           | 支撑手机登录链路 |
| 3    | 1.3      | [idn-user-03-get-user-by-id.md](../tasks/idn-user-03-get-user-by-id.md)       | 按用户 ID 查询自然人身份 | 未开始   | 2026-03-23           | 支撑上下游引用   |
