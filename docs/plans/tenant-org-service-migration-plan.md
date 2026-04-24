# Tenant-Org Service Migration Plan

## 1. 目标

将 `Tenant` 与 org tree owner 从 `identity-service` 一次迁移到 `tenant-org-service`，并让调用方切换到目标态边界，不保留长期双 owner。

## 2. 当前迁移原则

- 目标态一次到位
- 不保留长期双写 / 双 owner
- 允许分阶段准备，但最终合入主线时必须以目标态完成
- 不借迁移之机把人员归属语义落进 `tenant-org-service`

## 3. 迁移范围

从 `identity-service` 迁出的能力：

- `Tenant` 真相
- `GetTenantById`
- `GetOrgTreeByTenantId`
- 与 tenant / org tree 直接绑定的 schema、proto、generated client 与调用方 owner

当前不随本轮迁移进入 `tenant-org-service` 的能力：

- `ListAccountOrgMemberships`
- `AddAccountOrgMembership`
- `RemoveAccountOrgMembership`
- `SetAccountPrimaryOrg`

这些旧能力不应在目标态继续扩展；后续由 future `hr-service` 接管正式人员归属真相后重建正确协作链。

## 4. 推荐阶段

### Phase 1. 文档与契约冻结

- 回写 `tenant-org-service` 职责卡
- 冻结协同蓝图
- 冻结 `tenant-org-service` contracts
- 冻结本迁移计划

### Phase 2. `tenant-org-service` 实现主线

- 建立 `Tenant` 与 `OrgUnit` 最小 schema / repository / application / interface
- 提供 `GetTenantById`
- 提供 `GetOrgTreeByTenantId`
- 提供 org reference 相关查询

### Phase 3. 调用方切换

- `api-gateway` 从 `tenant-org-service` 读取 tenant / org tree 事实
- `auth-service` 如需 tenant 摘要或组织结构相关事实，切到新 owner
- `identity-service` 移除对 tenant / org 真相的长期 owner 假设

### Phase 4. 旧 owner 收口

- 删除或废弃 `identity-service` 中的 tenant / org 真相接口
- 删除或迁移对应 generated client 与调用点
- 复核文档与实现是否仍残留双 owner

### Current Review Note (2026-04-23)

- `api-gateway` 活跃路径上的 `GetTenantById / ListTenants` 已切到 `tenant-org-service`。
- `identity-service.GetOrgTreeByTenantId` 已进入 deprecated compatibility only 状态。
- cleanup 已完成以下收口：
  - `identity-service.GetAccountsByUserId / ListAccounts` 不再继续回传 `tenantName`
  - `auth-service` 不再继续转发 `tenantName`
  - `identity-service.GetTenantById / ListTenants` 旧 owner surface 已清理
  - 本地 shared env 已补齐 `tenantorgdb` seed 与默认 runbook
- 当前迁移主线已满足 foundation close 条件；剩余 `GetOrgTreeByTenantId` compatibility 收尾转入后续治理项，不再阻塞本迁移主线。

## 5. 风险护栏

- 不在迁移过程中扩张范围到人员归属、HR 任职或 account-org membership
- 不让调用方继续把 `tenantId` 引用误当成 tenant 真相 owner
- 不让 `identity-service` 在迁移后继续反向聚合 tenant / org 真相

## 6. 完成判定

以下条件同时成立，才视为迁移完成：

- `tenant-org-service` 已成为 `Tenant` 与 org tree 的唯一 owner
- 调用方已切换到新 owner
- `identity-service` 不再暴露 tenant / org 真相接口
- 服务职责、协同蓝图、contracts 与实现保持一致
