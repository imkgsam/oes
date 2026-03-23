# Organization Structure 设计

更新时间：2026-03-24 10:52:00 +09:00

## 文档定位

本文档描述 `Org` 组织树和账户组织归属的设计方向。

## 1. 目标

支持租户内部组织结构表达，并正式承接账户主组织与多组织归属能力。

## 2. 核心规则

- `Org` 属于某个 `Tenant`
- 可表达子公司、部门、小组等层级结构
- 一个 `UserAccount` 可有一个主组织
- 一个 `UserAccount` 可有多个组织归属
- 主组织与附属组织统一通过 membership 关系表达

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
- `relationType=PRIMARY` 与 `isPrimary=true` 应保持一致
- 非主组织归属使用 `relationType=SECONDARY`

## 4. 当前阶段取舍

- 已完成组织树、主组织绑定和多组织归属最小闭环
- 当前未展开复杂跨组织审批与继承授权规则

## 5. 关联任务完成情况

全局审核记录：[minimum-closure-global-review.history.md](../history/minimum-closure-global-review.history.md)

| 序号 | 任务编号 | 任务文档                                                                                       | 描述               | 当前状态 | 最后一次全局审核时间 | 备注                 |
| ---- | -------- | ---------------------------------------------------------------------------------------------- | ------------------ | -------- | -------------------- | -------------------- |
| 1    | 4.1      | [idn-org-01-org-tree-query.md](../tasks/idn-org-01-org-tree-query.md)                             | 查询租户组织树     | 已实现   | 2026-03-23 20:22 +08:00 | 先做组织树，再做归属 |
| 2    | 4.2      | [idn-org-02-account-primary-org-binding.md](../tasks/idn-org-02-account-primary-org-binding.md)   | 建立账户主组织绑定 | 已实现   | 2026-03-23 21:00 +08:00 | schema 已按 membership 方向落地 |
| 3    | 4.3      | [idn-org-03-account-multi-org-membership.md](../tasks/idn-org-03-account-multi-org-membership.md) | 建立账户多组织归属 | 已实现   | 2026-03-24 10:52 +09:00 | 已开放 membership 增删查 |
