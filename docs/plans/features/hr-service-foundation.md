# HR Service Foundation

> 服务设计唯一真相源：[hr-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/hr-service.md)。本文只记录 HR minimum foundation 的 feature 范围、状态、验收与后置问题；`Employee`、`Employment`、员工生命周期、正式 `人 -> org` 归属与 onboarding owner 边界不在本文重新定义。

## 1. 目标

- 将 `hr-service` minimum 第一阶段结论转成可执行 feature packet，作为后续 contracts、协同文档与实现线程的主线入口。
- 建立 `hr-service` 第一阶段最小闭环，具体服务对象与 owner 边界以 [hr-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/hr-service.md) 为准。
- 明确本 feature 不再作为 HR 服务设计入口。

## 2. 不做什么

- 不在本 packet 中扩张到 payroll、attendance、performance、recruiting。
- 不在本 packet 中引入完整岗位体系、汇报线、编制体系。
- 不在本 packet 中把 account-org membership 回升为正式真相。
- 不在本 packet 中把 `OrgUnit` 并入 `hr-service`。
- 不在本 packet 中让 HR 直接拥有账号、角色、权限或 access package owner。

## 3. 上游依赖

- services:
  - [hr-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/hr-service.md)
  - [party-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/party-service.md)
  - [tenant-org-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/tenant-org-service.md)
  - [identity-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/identity-service.md)
  - [permission-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/permission-service.md)
- collaborations:
  - [tenant-org-and-hr.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/collaborations/tenant-org-and-hr.md)
  - [employee-onboarding.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/collaborations/employee-onboarding.md)

## 4. 当前结论

- `hr-service` minimum foundation 已关闭，服务设计已回写到 [hr-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/hr-service.md)。
- `Employee / Employment`、正式 `人 -> org`、onboarding owner、account binding handoff 与 permission grant handoff 均以服务真相源和协同 / contract 文档为准。
- `tenant-web` 已形成租户侧 `组织与人员 > 成员` 主入口：
  - 主路径为 `/settings/organization-people/members`
  - dedicated `entryKey` 为 `tenant-settings.organization-people`
  - 旧 `/settings/employee-employment` 仅保留兼容跳转，并继续挂在原 `entryKey`
- 当前成员详情工作区已收口为 `员工信息 / 当前任职 / 其他任职 / 任职记录 / 账号与访问` 五区块，不改变 HR owner 口径。
- `账号与访问` 当前只进入第一阶段：展示登录接入状态、账号摘要、脱敏登录方式、角色摘要与待处理原因，并只保留 `开通登录 / 继续完成接入 / 前往账号管理` 三类动作。
- 创建成员时“允许登录”当前只进入第一阶段：在创建 `Employee` 与首条 `ACTIVE Employment` 后，受控触发成员登录接入。
- 当前员工入口的 org 选择与摘要只复用 `tenant-org-service` 读模型，不把 org tree 或 account 管理并入 HR 页面。

## 5. 契约真相位置

- 稳定服务职责：
  - [hr-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/hr-service.md)
- 稳定协同蓝图：
  - [tenant-org-and-hr.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/collaborations/tenant-org-and-hr.md)
  - [employee-onboarding.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/collaborations/employee-onboarding.md)
- 当前 contract：
  - `docs/contracts/hr-service/**`
  - `docs/contracts/identity-service/employee-binding.md`
  - `docs/contracts/permission-service/onboarding-grant.md`

## 6. 当前 slice

- slice:
  - `hr-service` minimum foundation
- status:
  - minimum-foundation-closed
- scope:
  - `Employee`
  - `Employment`
  - minimum onboarding orchestration
  - identity binding handoff
  - permission grant handoff
  - tenant-scoped `组织与人员 > 成员` 前端基础入口
- ready definition:
  - 服务职责已回写
  - 协同蓝图已冻结 minimum 口径
  - hr minimum contracts 已建立入口

## 7. 线程分工

| Thread / Owner | 职责 | 允许修改路径 | 输入 | 输出 | 状态 |
| --- | --- | --- | --- | --- | --- |
| design owner | 维护 hr minimum feature packet 与稳定设计收口 | `docs/plans/features/hr-service-foundation.md`, 必要时 `docs/architecture/**` | 当前设计结论、协同蓝图 | feature packet 与回写后的真相源 | completed |
| contract owner | 冻结 hr minimum 黑盒契约 | `docs/contracts/hr-service/**`, 相关 identity / permission 补充 contract | feature packet、服务职责、协同蓝图 | query / management / handoff 契约文档 | completed |
| implementation owner | 在已冻结 minimum 边界内实现 Employee / Employment 与 onboarding handoff | `src/services/system/hr-service/**`, `src/common/src/contracts/hr_service/**` | feature packet、contracts、协同蓝图 | 可运行服务、测试与验证结果 | completed |
| review / integration owner | 检查 HR 实现是否越界回到 account-org 双真相或角色 owner | 只读全局，必要时最小文档收口 | feature packet、contracts、实现结果 | review 结论与关闭判断 | completed |

## 8. 派生问题 Ledger

| 时间 | 问题 | 分类 | 当前影响 | 处理策略 | 目标落点 | 状态 |
| --- | --- | --- | --- | --- | --- | --- |
| 2026-04-23 | access package 仍未冻结 shape | Blocker-Later | 影响是否能在 onboarding 中引入 package 语义 | 当前只冻结 owner，不冻结 package shape | future permission / onboarding design | open |
| 2026-04-23 | account 已创建但 grant 失败时的最终账号状态未冻结 | Resolved | 影响 onboarding failure semantics | 已冻结为“HR 真相不回滚，account/binding 保留但账号不得可用，HR 持有可重试补偿状态” | employee onboarding + identity / permission supplemental contracts | closed |
| 2026-04-23 | party merge / tenant party deactivate 后 Employee 修复链未冻结 | Blocker-Later | 影响 party 与 HR 的长期治理协同 | 后续独立协同设计 | future party / hr collaboration | open |
| 2026-04-23 | identity employee binding 与 permission onboarding grant actual proto 尚未落地 | Resolved | 之前阻塞完整 onboarding integration close | identity / permission handoff actual proto、runtime 与幂等持久化已落地 | identity / permission handoff realization | closed |
| 2026-04-23 | hr-service management contract 与 runtime 的上下文校验口径存在轻度漂移 | Resolved | contract 曾要求 internal-service、operator、tenant、trace 与审计元数据，但 runtime 只强制部分 metadata | 已通过 contract-only 收口到当前 runtime 可证明范围；更强上下文校验后续作为增强议题 | hr contract/runtime alignment | closed |
| 2026-04-23 | hr-service query contract 的 tenant mismatch 语义与当前查询入口不完全一致 | Resolved | 部分 query RPC 只按 employeeId 查询，runtime 当前无法落实 tenant mismatch 语义 | 已明确 tenant mismatch 仅适用于提供 tenant context 的查询入口；tenant-aware query 后续作为增强议题 | hr contract/runtime alignment | closed |
| 2026-04-23 | 多服务真实 onboarding smoke 尚未完成 | Resolved | 之前缺少跨进程共享环境 smoke 证据 | 已完成 success path、binding fail、grant fail 三条 shared-env 复验 | onboarding smoke rerun | closed |
| 2026-04-23 | shared-env 中 identity-service 指向 HR 的 gRPC 地址与实际监听端口不一致，且 hr-service 不在默认必启清单中 | Resolved | 之前阻塞 onboarding success path 与 grant-failure path 的真实联调验证 | 已完成默认编排与默认 gRPC 地址对齐 | identity-hr shared-env wiring | closed |
| 2026-04-23 | 全仓 `pnpm proto:lint` 曾受既有历史债务影响 | Resolved | 曾影响“全仓合同已完全规范化”的口径，但非本次 HR / identity / permission handoff 新回归 | 已完成 notification / identity / permission / auth 四段 proto lint hygiene 与总控 gate 验证 | repo-wide proto lint governance | closed |
| 2026-04-23 | onboarding fail path 的业务错误被 gRPC 异常映射降级成 `INFRA_UNKNOWN_EXCEPTION` / `Internal service is unavailable` | Resolved | 曾经掩盖 `party mismatch` 与 `role not assignable` 等真实业务失败原因 | 已完成错误分类收口与最小 shared-env 复验；HR failureReason 和日志均保留业务语义 | onboarding-fail-path-grpc-error-classification | closed |
| 2026-04-24 | 是否在当前 `员工与任职管理` 入口内混入 account binding / onboarding access 查询与补偿管理面 | Blocker-Later | 若现在混入，会把 HR 真相页扩成账号与授权协同后台，并模糊 `identity-service` / `permission-service` owner | 维持当前页面只处理 `Employee / Employment`；后续单独冻结 BFF query / retry / compensation 管理面 | future onboarding admin surface | open |
| 2026-04-24 | `account-management` 与 `employee-management` 是否合并成长期统一信息架构 | Blocker-Later | 若直接合并，会让账号 owner 与 HR owner 再次缠绕，并诱发 `account -> org` 伪真相回流 | 当前维持双入口；未来只允许在 IA 层冻结 cross-link 或聚合读模型，不把 account 并入 HR | future tenant-web IA / onboarding design | open |

## 9. 验收标准

- 已明确 `Employee / Employment` 是正式人力真相。
- 已明确 `Employment -> OrgUnit` 是正式 `人 -> org` 真相。
- 已明确 `account -> org` 只能作为 compatibility / projection。
- 已明确 onboarding owner 在 `hr-service`，不是 BFF。
- 已明确 account binding 与 permission grant 分别属于 `identity-service`、`permission-service`。
- hr minimum contracts 已提供入口。
- 已明确前端 `员工与任职管理` 入口只收口 HR 真相页，不吸收 account-management 语义。

## 10. 关闭条件

- hr minimum contracts 已冻结。
- employee onboarding 协同蓝图已冻结。
- identity binding 与 permission grant handoff 已形成最小可依赖契约。
- 已决定是否进入 `hr-service minimum implementation`。
- HR implementation review 已确认没有 account-org membership 或 role owner 语义回流。
- HR minimum runtime slice 已通过 review，可视为关闭。
- identity binding 与 permission grant actual proto / runtime handoff 已完成。
- 剩余多服务 smoke 与 repo-wide proto lint 债务不再阻塞 hr-service minimum foundation close。
- `tenant-web` `Employee / Employment` 基础入口已按当前 minimum 边界接入。

## 11. 备注

- 本 feature packet 只覆盖 minimum foundation，不替代未来完整 HR 子域设计。
- 当前 packet 明确禁止把 legacy account-org membership 重新抬升为正式真相。
- 截至 2026-04-23，`hr-service` minimum foundation 已关闭，onboarding 主线已达到 shared-env 闭环。
- 当前后续重点已降级为 future enhancement：更强 HR 上下文校验或 tenant-aware query，不阻塞 foundation closure。
