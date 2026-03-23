# Organization Structure 设计

更新时间：2026-03-23 15:20:00 +08:00

## 文档定位

本文档描述 `Org` 组织树和账户组织归属的设计方向。

## 1. 目标

支持租户内部组织结构表达，并为后续账户主组织、多组织归属提供模型基础。

## 2. 核心规则

- `Org` 属于某个 `Tenant`
- 可表达子公司、部门、小组等层级结构
- 一个 `UserAccount` 可有一个主组织
- 一个 `UserAccount` 后续可有多个组织归属

## 3. 建议模型

### `Org`

- `id`
- `tenantId`
- `parentId`
- `name`
- `code`
- `type`
- `status`
- `sortOrder`

### `UserAccountOrgMembership`

- `id`
- `accountId`
- `orgId`
- `relationType`
- `isPrimary`

## 4. 当前阶段取舍

- 第一阶段先不实现账户组织归属管理
- 设计和 schema 应预留扩展能力

## 5. 关联任务完成情况

全局审核记录：[minimum-closure-global-review.history.md](../history/minimum-closure-global-review.history.md)

| 序号 | 任务编号 | 任务文档                                                                                       | 描述               | 当前状态 | 最后一次全局审核时间 | 备注                 |
| ---- | -------- | ---------------------------------------------------------------------------------------------- | ------------------ | -------- | -------------------- | -------------------- |
| 1    | 4.1      | [idn-org-01-org-tree-query.md](../tasks/idn-org-01-org-tree-query.md)                             | 查询租户组织树     | 未开始   | 2026-03-23           | 先做组织树，再做归属 |
| 2    | 4.2      | [idn-org-02-account-primary-org-binding.md](../tasks/idn-org-02-account-primary-org-binding.md)   | 建立账户主组织绑定 | 未开始   | 2026-03-23           | Phase 2              |
| 3    | 4.3      | [idn-org-03-account-multi-org-membership.md](../tasks/idn-org-03-account-multi-org-membership.md) | 建立账户多组织归属 | 未开始   | 2026-03-23           | Phase 2              |
