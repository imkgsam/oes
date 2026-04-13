# Identity Service 文档索引

更新时间：2026-03-24 12:40:00 +09:00

本文档是 `identity-service/doc/` 的导航入口，只负责说明文档职责、阅读顺序和当前有效文档入口，不承载完整设计正文。

## 文档定位

`identity-service` 当前按“身份主数据中心”的方向设计，负责承载：

- 自然人全局身份
- 租户内业务账户
- 租户主数据
- 组织结构
- 企业联系方式资产
- 机器身份主数据预留

## 推荐阅读顺序

1. [overview.md](./overview.md)
2. [requirements.md](./requirements.md)
3. [roadmap.md](./roadmap.md)
4. [design/identity-center.md](./design/identity-center.md)
5. 各专题 `design/*.md`
6. 对应最小分片 `tasks/*.md`
7. 最近全局审核记录

## 当前进度摘要

- `Phase 1` 已完成
- `Phase 2` 中组织结构分片已完成：
  - `4.1` 查询租户组织树
  - `4.2` 账户主组织绑定
  - `4.3` 账户多组织归属
- `Phase 2` 中联系方式资产分片部分已完成：
  - `5.1` 企业邮箱资产绑定
  - `5.2` 企业手机资产绑定
- 当前建议下一步进入 `6.1` 机器身份主体模型

## 基础文档入口

- [overview.md](./overview.md)
- [requirements.md](./requirements.md)
- [roadmap.md](./roadmap.md)

## 设计文档入口

- [design/identity-center.md](./design/identity-center.md)
- [design/human-identity.md](./design/human-identity.md)
- [design/account-identity.md](./design/account-identity.md)
- [design/tenant-identity.md](./design/tenant-identity.md)
- [design/organization-structure.md](./design/organization-structure.md)
- [design/contact-asset.md](./design/contact-asset.md)
- [design/machine-identity.md](./design/machine-identity.md)

## 任务文档入口

### 0 服务基线

- [0.1 gRPC 与 CQRS 基线](./tasks/idn-foundation-01-grpc-cqrs-baseline.md)

### 1 Human Identity

- [1.1 按个人邮箱查询用户](./tasks/idn-user-01-get-user-by-email.md)
- [1.2 按个人手机查询用户](./tasks/idn-user-02-get-user-by-phone.md)
- [1.3 按用户 ID 查询用户](./tasks/idn-user-03-get-user-by-id.md)

### 2 Account Identity

- [2.1 按用户查询账户候选列表](./tasks/idn-account-01-get-accounts-by-user-id.md)
- [2.2 按账户 ID 查询账户](./tasks/idn-account-02-get-account-by-id.md)

### 3 Tenant Identity

- [3.1 按租户 ID 查询租户](./tasks/idn-tenant-01-get-tenant-by-id.md)

### 4 Organization Structure

- [4.1 查询租户组织树](./tasks/idn-org-01-org-tree-query.md)
- [4.2 账户主组织绑定](./tasks/idn-org-02-account-primary-org-binding.md)
- [4.3 账户多组织归属](./tasks/idn-org-03-account-multi-org-membership.md)

### 5 Contact Asset

- [5.1 企业邮箱资产绑定](./tasks/idn-contact-01-account-work-email-asset.md)
- [5.2 企业手机资产绑定](./tasks/idn-contact-02-account-work-phone-asset.md)

### 6 Machine Identity

- [6.1 机器身份主体模型](./tasks/idn-machine-01-service-account-model.md)
- [6.2 机器凭据模型](./tasks/idn-machine-02-api-key-model.md)

## 历史文档入口

- [history/identity-center.history.md](./history/identity-center.history.md)
- [history/doc-foundation.history.md](./history/doc-foundation.history.md)
- [history/minimum-closure-global-review.history.md](./history/minimum-closure-global-review.history.md)
- [history/2.2-get-account-by-id.history.md](./history/2.2-get-account-by-id.history.md)

## 关联规范

- 仓库级协作与架构约束：[AGENTS.md](../../../../../AGENTS.md)
- 项目级治理规则：[docs/architecture/05-governance.md](../../../../../docs/architecture/05-governance.md)
- 多线程协作规则：[docs/governance/codex-threading-rules.md](../../../../../docs/governance/codex-threading-rules.md)

## 当前有效主文档

`identity-service` 当前完整设计方案以 [design/identity-center.md](./design/identity-center.md) 为准。最近一次全局审核记录以 [history/minimum-closure-global-review.history.md](./history/minimum-closure-global-review.history.md) 为准。
