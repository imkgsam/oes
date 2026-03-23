# Tenant Identity 设计

更新时间：2026-03-24 11:08:00 +09:00

## 文档定位

本文档描述 `Tenant` 的设计边界和最小主数据要求。

## 1. 目标

将 `Tenant` 作为正式主数据对象建模，为账户归属、组织边界和后续平台管理提供稳定基础。

## 2. 核心规则

- `Tenant` 是正式主数据，不只是辅助上下文字段
- 所有 `UserAccount` 必须属于某个 `Tenant`
- `Org` 必须属于某个 `Tenant`

## 3. 建议字段方向

- `id`
- `code`
- `name`
- `status`
- `createdAt`
- `updatedAt`

## 4. 当前阶段取舍

- 第一阶段只实现最小查询
- 不先做完整租户管理后台

## 5. 关联任务完成情况

全局审核记录：[minimum-closure-global-review.history.md](../history/minimum-closure-global-review.history.md)

| 序号 | 任务编号 | 任务文档                                                                     | 描述             | 当前状态 | 最后一次全局审核时间 | 备注    |
| ---- | -------- | ---------------------------------------------------------------------------- | ---------------- | -------- | -------------------- | ------- |
| 1    | 3.1      | [idn-tenant-01-get-tenant-by-id.md](../tasks/idn-tenant-01-get-tenant-by-id.md) | 查询租户最小信息 | 已实现   | 2026-03-24 10:52 +09:00 | Phase 1 |
