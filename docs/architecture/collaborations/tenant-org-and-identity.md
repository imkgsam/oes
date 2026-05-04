# Tenant-Org 与 Identity 协同蓝图

## 1. 目标

定义 OES 中 `identity-service` 与 `tenant-org-service` 的长期边界，回答：

- `User / UserAccount` 与 `Tenant / OrgUnit` 各自由谁拥有
- `tenantId` 在身份侧和租户组织侧分别代表什么
- 登录后 account context、tenant 摘要与组织树应如何被组装

## 2. 参与服务

- `identity-service`
- `tenant-org-service`
- `auth-service`
- `api-gateway`

## 3. 真相归属

- `identity-service`
  - `User`
  - `UserAccount`
  - 登录标识
  - contact assets
  - available account contexts
- `tenant-org-service`
  - `Tenant`
  - `OrgUnit`
  - org tree
  - org hierarchy
  - org reference validation

## 4. 核心边界

- `identity-service` 回答“这个人如何登录、有哪些 account context、account 绑定了哪个 `tenantId` 引用”。
- `tenant-org-service` 回答“这个 `tenantId` 指向哪个 tenant、tenant 内部组织树长什么样、某个 org 引用是否合法”。
- `identity-service` 不长期拥有 tenant / org 真相，也不再拥有 org tree 或人员组织归属真相。
- `tenant-org-service` 不拥有 `User / UserAccount`、contact assets 或 available account contexts。

## 5. 协作方式

1. `auth-service` 主认证成功后，通过 `identity-service` 查询可用 account contexts。
   - `identity-service` 只按账号自身启用状态与 tenantId 引用返回候选。
   - `auth-service` 必须通过 `tenant-org-service` 过滤非 ACTIVE tenant 的 tenant-scope account candidates。
2. `api-gateway` 或 `auth-service` 在需要组装 session context 时：
   - 从 `identity-service` 获取 account identity facts
   - 从 `tenant-org-service` 获取 tenant 摘要与组织结构相关事实
   - `api-gateway` 对 session context 列表展示也应以 `tenant-org-service` 的 tenant 生命周期为准，避免展示不可用 tenant context
3. 前端消费的是聚合结果，不直接跨越 BFF 同时拼装两个下游。

## 6. 一次迁移到位规则

- `Tenant` owner 直接迁入 `tenant-org-service`
- `GetTenantById` owner 直接迁入 `tenant-org-service`
- org tree 相关查询 owner 直接迁入 `tenant-org-service`
- `identity-service` 仅保留 `tenantId` 作为 `UserAccount` 的上下文引用字段
- `identity-service` 可在 contact asset、service account、audit event 中保留 `tenantId / orgId` 引用字段
- 不保留长期双 owner 或长期兼容聚合层

## 7. 明确禁止

- 不让 `identity-service` 继续拥有 tenant / org 真相
- 不让 `tenant-org-service` 继续扩展 `User / UserAccount` 语义
- 不让调用方把 `tenantId` 引用误当成 tenant 真相源
- 不让前端直接绕过 BFF 组装身份与租户组织真相

## 8. 关联文档

- [tenant-org-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/tenant-org-service.md)
- [identity-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/identity-service.md)
- [tenant-org-service-foundation.md](/Users/acehood/Documents/GitHub/oes/docs/plans/features/tenant-org-service-foundation.md)
