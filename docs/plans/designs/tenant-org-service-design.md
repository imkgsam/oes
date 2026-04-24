# tenant-org-service Design

## 1. 目标

- 收敛 `tenant-org-service` 第一阶段实现前冻结设计。
- 明确 `Tenant` 与 `OrgUnit` 的长期 owner 与迁移口径。
- 为后续 contracts、迁移计划与实现线程提供恢复入口。

## 2. 当前范围

- 本 workspace 负责：
  - `Tenant`
  - `OrgUnit`
  - org tree
  - org hierarchy
  - org reference validation
  - 与 `identity-service`、future `hr-service` 的边界
- 本 workspace 不负责：
  - `account -> org` 归属
  - `employee / employment`
  - 完整 `OrgScope` 人员范围解析
  - 审批引擎、BI 页面与 workflow 深度规则

## 3. 已冻结决定

| 日期 | 决定 | 影响范围 | 回写目标 |
| --- | --- | --- | --- |
| 2026-04-22 | `tenant-org-service` 第一版直接接管 `Tenant` owner。 | `identity-service` / `tenant-org-service` 边界 | 服务职责 / contracts / migration plan |
| 2026-04-22 | `identity-service` 保留 `User / UserAccount / available account contexts / contact assets`，不再拥有 tenant / org 真相。 | 身份侧边界 | 协同蓝图 |
| 2026-04-22 | 第一版不落 `AccountOrgMembership`。 | 数据模型与 contracts | 服务职责 / feature packet |
| 2026-04-22 | 第一版不落 `Employee / Employment`；正式人员归属真相归 future `hr-service`。 | `tenant-org-service` / future `hr-service` 边界 | 协同蓝图 |
| 2026-04-22 | 第一版只冻结 `Tenant + OrgUnit + org hierarchy + org reference`。 | 第一阶段范围 | feature packet / contracts |

## 4. 第一阶段最小模型

### 4.1 `Tenant`

- `id`
- `code`
- `name`
- `status`
- `rootOrgId`
- `createdAt / updatedAt`

### 4.2 `OrgUnit`

- `id`
- `tenantId`
- `parentOrgId`
- `name`
- `type`
- `status`
- `path`
- `depth`
- `sortOrder`
- optional `organizationPartyId`

### 4.3 `OrgScope`

- 当前只保留为长期能力名，不在第一阶段落正式人员范围解析
- 第一阶段仅落：
  - ancestor / descendant resolution
  - org reference legality check

## 5. 第一阶段接口面

### 5.1 Query

- `GetTenantById`
- `ListTenants`
- `GetOrgTreeByTenantId`
- `GetOrgUnitById`
- `ValidateOrgReference`
- `GetOrgReferenceSummary`
- `ListAncestorOrgUnits`
- `ListDescendantOrgUnits`

### 5.2 Management

- `CreateTenant`
- `UpdateTenantProfile`
- `SuspendTenant`
- `ReactivateTenant`
- `ArchiveTenant`
- `CreateOrgUnit`
- `UpdateOrgUnit`
- `MoveOrgUnit`
- `ArchiveOrgUnit`

## 6. 关键协同结论

- `identity-service`
  - 拥有 `User / UserAccount`
  - 继续保留 `tenantId` 作为上下文引用字段
  - 不再拥有 tenant / org 真相
- future `hr-service`
  - 拥有 `Employee / Employment -> OrgUnit`
  - 才是正式人员归属真相 owner
- `auth-service / api-gateway`
  - 继续负责组装最终 session context

## 7. 开放问题

| 日期 | 问题 | 为什么未冻结 | 下一步 |
| --- | --- | --- | --- |
| 2026-04-22 | `organizationPartyId` 与 `party-service` 的正式协作链 | 当前不阻塞第一阶段主线，但会影响组织节点如何引用现实世界组织主体 | 后续补充 contracts / collaboration |
| 2026-04-22 | future `OrgScope` 如何由 `Employment` 真相驱动 | 当前 `hr-service` 尚未进入主线 | 在 `hr-service` 设计线程中冻结 |

## 8. 恢复入口

- [tenant-org-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/tenant-org-service.md)
- [tenant-org-and-identity.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/collaborations/tenant-org-and-identity.md)
- [tenant-org-and-hr.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/collaborations/tenant-org-and-hr.md)
- [tenant-org-service-foundation.md](/Users/acehood/Documents/GitHub/oes/docs/plans/features/tenant-org-service-foundation.md)
- [tenant-org-service-migration-plan.md](/Users/acehood/Documents/GitHub/oes/docs/plans/tenant-org-service-migration-plan.md)
