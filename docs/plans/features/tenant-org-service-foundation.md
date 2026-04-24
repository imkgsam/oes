# Tenant-Org Service Foundation

## 1. 目标

- 将已冻结的 `tenant-org-service` 设计结论转成可执行 feature packet，作为后续 contracts、迁移计划与实现线程的主线入口。
- 建立 `tenant-org-service` 第一阶段最小闭环：
  - `Tenant`
  - `OrgUnit`
  - org tree
  - org hierarchy
  - org reference validation
- 明确 `Tenant` 与 org tree 从 `identity-service` 一次迁移到 `tenant-org-service` 的目标态边界。
- 为 future `hr-service` 预留稳定 `OrgUnit` 真相，而不提前混入人员归属语义。

## 2. 不做什么

- 不在本 packet 中引入 `AccountOrgMembership`
- 不在本 packet 中引入 `account -> org` 归属真相
- 不在本 packet 中引入 `Employee / Employment`
- 不在本 packet 中引入完整 `OrgScope` 人员范围解析
- 不在本 packet 中引入 org 子树管理员、组织负责人体系或 workflow 深度规则
- 不在本 packet 中把 `OrgUnit` 与 `organization party` 混成一个模型

## 3. 上游依赖

- architecture:
  - [02-bounded-contexts.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/02-bounded-contexts.md)
  - [03-technical-architecture.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/03-technical-architecture.md)
- services:
  - [tenant-org-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/tenant-org-service.md)
  - [identity-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/identity-service.md)
  - [hr-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/hr-service.md)
  - [party-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/party-service.md)
- collaborations:
  - [tenant-org-and-identity.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/collaborations/tenant-org-and-identity.md)
  - [tenant-org-and-hr.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/collaborations/tenant-org-and-hr.md)
- contracts:
  - [tenant-org-service/README.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/tenant-org-service/README.md)
  - [query.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/tenant-org-service/query.md)
  - [management.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/tenant-org-service/management.md)

## 4. 当前结论

- `tenant-org-service` 的目标职责是统一管理 `Tenant + OrgUnit`，不是 org 的辅助模块。
- `Tenant` owner 目标态直接迁入 `tenant-org-service`。
- `identity-service` 保留 `User / UserAccount / available account contexts / contact assets`。
- `tenant-org-service` 不拥有 `account -> org` 或 `employee -> org` 的长期归属真相。
- future `hr-service` 才拥有 `Employee / Employment -> OrgUnit` 的正式人员归属真相。
- 第一阶段只冻结 tenant、org tree、org hierarchy 与 org reference，不提前混入人员归属。
- `tenant-web` 已形成平台侧 `Tenant` 管理入口 `/admin/tenant-management`，当前只作为 `api-gateway/BFF -> tenant-org-service` 的消费面，不改变 owner 边界。
- `tenant-web` 已形成共享 org 管理入口 `/admin/org-management` 与租户侧 `组织与人员 > 部门` Tab：
  - 租户侧主路径为 `/settings/organization-people/departments`
  - 旧 `/settings/org-structure` 仅保留兼容跳转，并继续挂在原 `entryKey`
  - 二者都只消费 `Tenant + OrgUnit` 真相，不引入人员归属 owner。

## 5. 契约真相位置

- 稳定服务职责：
  - [tenant-org-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/tenant-org-service.md)
- 稳定协同蓝图：
  - [tenant-org-and-identity.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/collaborations/tenant-org-and-identity.md)
  - [tenant-org-and-hr.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/collaborations/tenant-org-and-hr.md)
- 当前 contract：
  - `docs/contracts/tenant-org-service/**`

## 6. 线程分工

| Thread / Owner | 职责 | 允许修改路径 | 输入 | 输出 | 状态 |
| --- | --- | --- | --- | --- | --- |
| design owner | 维护本 feature packet 与稳定设计收口 | `docs/plans/features/tenant-org-service-foundation.md`, 必要时 `docs/architecture/**` | 当前设计结论、协同边界 | feature packet 与回写后的真相源 | completed |
| contract owner | 冻结 tenant-org 黑盒契约 | `docs/contracts/tenant-org-service/**`, `docs/contracts/index.md` | feature packet、服务职责、协同蓝图 | query / management 契约文档 | completed |
| migration owner | 设计从 `identity-service` 迁出 tenant / org 的切换顺序 | `docs/plans/tenant-org-service-migration-plan.md`, 必要时本 packet | feature packet、现有 identity 契约与实现状态 | 迁移阶段、切换顺序、风险护栏 | completed |
| implementation owner | 按已冻结边界实现 `tenant-org-service` 第一阶段能力 | `src/services/system/tenant-org-service/**`, 必要时调用方服务 | feature packet、contracts、迁移计划 | 可运行服务、测试与调用链切换 | completed |
| review / integration owner | 检查实现是否越界进入 account-org / HR 任职语义，并验证调用方切换 | 只读全局，必要时最小文档收口 | feature packet、contracts、实现结果 | review 结论与关闭判断 | completed |

## 7. 当前 slice

- slice:
  - `tenant-org-service` 第一阶段实现前冻结
- scope:
  - tenant / org tree / org reference
  - `Tenant` owner 迁移出 `identity-service`
  - org tree 查询 owner 迁移出 `identity-service`
  - tenant / org 前端基础入口已落地为当前 BFF consumer surface
- ready definition:
  - 服务职责已按新边界回写
  - 协同蓝图已冻结
  - contracts 已冻结
  - 迁移顺序已写明

## 8. 主线范围

- 本线程主线：
  - 维护 `tenant-org-service` 第一阶段稳定边界
  - 明确迁移切换顺序与风险护栏
  - 为实现线程提供唯一执行入口
- 本线程不做：
  - account-org membership
  - employee / employment
  - 完整 OrgScope 人员范围解析
  - workflow / reporting 深度特化
- 偏移返回条件：
  - 需要把人员归属语义放回 `tenant-org-service`
  - 需要继续让 `identity-service` 拥有 tenant / org 真相
  - 需要引入新的共享契约或跨服务 owner 改变

## 9. 阻塞 / 依赖

- `identity-service` 当前仍暴露 `GetTenantById / GetOrgTreeByTenantId` 等旧 owner 接口，实现线程需要按迁移计划切换。
- future `hr-service` 还未进入主线，因此第一阶段不能依赖 `Employment` 真相。
- `organizationPartyId` 与 `party-service` 的正式协作仍后置，不阻塞第一阶段主线。

## 10. 派生问题 Ledger

| 时间 | 问题 | 分类 | 当前影响 | 处理策略 | 目标落点 | 状态 |
| --- | --- | --- | --- | --- | --- | --- |
| 2026-04-22 | `identity-service` 仍拥有 tenant / org 旧查询能力 | Blocker-Now | 若不切换 owner，会继续形成双真相 | 按迁移计划一次切换 owner，不保留长期双 owner | 迁移计划 + 实现线程 | open |
| 2026-04-22 | 人员归属真相是否先落到 `tenant-org-service` | Blocker-Now | 若误落进去，future `hr-service` 会被迫推倒重做 | 已冻结为 future `hr-service` owner，当前主线不实现 | 当前 feature packet | closed |
| 2026-04-22 | `organizationPartyId` 与 `party-service` 正式关联链 | Blocker-Later | 影响组织节点如何受控引用现实世界组织主体 | 后续独立补充 contracts / collaboration | future tenant-org / party design | open |
| 2026-04-22 | future `OrgScope` 如何由 `Employment` 真相驱动 | Blocker-Later | 影响 reporting / workflow 的长期组织范围来源 | 在 `hr-service` 进入主线后再冻结 | future hr / org scope design | open |
| 2026-04-23 | gateway 活跃路径上的 `GetTenantById / ListTenants` 已切到 `tenant-org-service`，但 foundation slice 仍被 tenantName leakage 与 identity 旧 tenant surfaces 阻塞 | Blocker-Now | 若现在关闭 slice，会误判 tenant truth 已经彻底收口 | 进入 cleanup 阶段，继续处理 `identity-service.GetAccountsByUserId / ListAccounts` 的 tenantName 泄漏，并在调用方稳定后废弃 `identity.GetTenantById / ListTenants` | migration cleanup | open |
| 2026-04-23 | cleanup 与 shared-env closure 完成后，foundation slice 关闭判断 | Closure | 若 cleanup 未闭环，会导致本地联调与关闭条件判断失真 | cleanup 已收口 tenantName leakage、identity 旧 owner surface 与 shared-env seed/runbook，当前 foundation slice 可关闭 | cleanup + 总控线程 | closed |
| 2026-04-24 | `tenant.admin` 是否应直接拿到 tenant boundary 管理入口 | Resolved | 若把 `admin.tenant-management` 发给租户管理员，会混淆平台 tenant boundary 治理与租户内 org 自治 | 已收口为 `admin.tenant-management` 仅 system-scope 可见；tenant admin 当前通过 `tenant-settings.organization-people` 进入统一工作台，并在 `部门` Tab 消费 org 管理；旧 `tenant-settings.org-structure` 只保留兼容跳转 | frontend foundation writeback | closed |

## 11. 验收标准

- `tenant-org-service` 第一阶段范围已经明确写成 feature packet
- services / collaborations / contracts 已对齐同一口径
- 明确 `Tenant` 与 org tree owner 迁入 `tenant-org-service`
- 明确 future `hr-service` 才拥有正式人员归属真相
- 明确第一阶段不做 account-org membership
- 明确 tenant / org 前端基础入口只消费当前 packet 已冻结真相，不反向扩张服务边界

## 12. 关闭条件

- `tenant-org-service` 第一阶段实现与测试完成
- `identity-service` 不再拥有 tenant / org 真相接口
- `auth-service / api-gateway` 已切到新的 tenant / org 查询 owner
- review 结论确认未越界进入人员归属语义
- tenant / org 前端基础入口已按 system-scope 与 tenant-scope 分工收口

## 13. 备注

- 本 feature packet 是当前实现主线入口，不替代服务职责卡、协同蓝图或正式 contracts。
- 当前 packet 明确采用“目标态一次迁移到位”口径，不保留长期兼容双 owner。
- 截至 `2026-04-23`，`tenant-org-service foundation slice` 已关闭；后续事项转入独立治理项，不再阻塞本主线。
