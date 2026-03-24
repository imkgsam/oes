# Contact Asset 设计

更新时间：2026-03-24 12:40:00 +09:00

## 文档定位

本文档描述企业邮箱、企业手机等联系方式作为租户资产时的建模方向。

## 1. 目标

将企业邮箱、企业手机从普通账户字段提升为可分配、可回收、可审计的资产型绑定对象。

## 2. 核心设计判断

- 当前阶段不拆独立服务
- 当前阶段在 `identity-service` 内建立独立子域
- 后续若邮件/通信复杂度明显上升，再拆独立服务

## 3. 核心规则

- 个人邮箱、个人手机属于 `User`
- 企业邮箱、企业手机属于 `AccountContactAsset`
- 企业联系方式不作为登录入口
- 支持赋予、收回、启停、主联系方式标记、审计

## 4. 建议模型

### `AccountContactAsset`

- `id`
- `tenantId`
- `accountId`
- `type`
- `value`
- `status`
- `isPrimary`
- `assignedAt`
- `revokedAt`
- `assignedBy`
- `revokedBy`

## 5. 当前阶段取舍

- 当前已完成组织结构分片最小闭环
- 联系方式资产是当前建议优先推进的下一分片
- 机器身份仍后置到 Phase 3

## 6. 关联任务完成情况

全局审核记录：[minimum-closure-global-review.history.md](../history/minimum-closure-global-review.history.md)

| 序号 | 任务编号 | 任务文档                                                                                       | 描述             | 当前状态 | 最后一次全局审核时间 | 备注             |
| ---- | -------- | ---------------------------------------------------------------------------------------------- | ---------------- | -------- | -------------------- | ---------------- |
| 1    | 5.1      | [idn-contact-01-account-work-email-asset.md](../tasks/idn-contact-01-account-work-email-asset.md) | 企业邮箱资产绑定 | 已实现   | 2026-03-24 12:20 +09:00 | 已落最小管理闭环 |
| 2    | 5.2      | [idn-contact-02-account-work-phone-asset.md](../tasks/idn-contact-02-account-work-phone-asset.md) | 企业手机资产绑定 | 已实现   | 2026-03-24 12:40 +09:00 | 已复用资产子域落最小管理闭环 |
