# Party Service Foundation

## 1. 目标

- 将已冻结的 `party-service` 架构结论转成可执行 feature packet，作为后续契约设计、能力补齐与实现线程的主线入口。
- 建立 `party-service` 第一阶段最小闭环；服务核心对象与 owner 边界只以 [party-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/party-service.md) 为准。
- 明确业务域第一阶段以 `tenantPartyId` 作为主体引用入口，不再依赖旧 system-wide `partyId` 或复制主体主数据。
- 为 CRM、SRM、订单、合同、会计、`identity-service`、`tenant-org-service`、`hr-service` 后续依赖 party 主数据提供稳定边界。

## 2. 不做什么

- 不在本 packet 中发起一次性全域切换。
- 不做完整 MDM 平台、外部工商数据同步或复杂主数据治理平台。
- 不做客户、供应商、员工、联系人、组织树或业务单据状态模型。
- 不做 CRM / SRM usage 模型；联系人与地址正文的 owner 边界以 [party-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/party-service.md) 为准，CRM / SRM 仅承接各自 usage。
- 不让业务域绕过 `TenantParty` 直接复制或持有 party 主数据。
- 不在本 feature 中冻结 HR、tenant-org、CRM、SRM 的详细实现模型。

## 3. 上游依赖

- architecture:
  - [00-vision-and-scope.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/00-vision-and-scope.md)
  - [02-bounded-contexts.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/02-bounded-contexts.md)
  - [03-technical-architecture.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/03-technical-architecture.md)
- services:
  - [party-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/party-service.md)
  - [identity-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/identity-service.md)
  - [tenant-org-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/tenant-org-service.md)
  - [hr-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/hr-service.md)
  - [crm-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/crm-service.md)
- collaborations:
  - [party-identity-and-tenant-org.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/collaborations/party-identity-and-tenant-org.md)
  - future party usage from CRM / SRM / transaction documents
  - future party merge governance collaboration
- contracts:
  - [party-service/README.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/party-service/README.md)
  - [registration.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/party-service/registration.md)
  - [query.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/party-service/query.md)
  - [merge.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/party-service/merge.md)（ADR 0003 历史契约，仅作 superseded 记录）
- adr:
  - [0008-tenant-scoped-tenant-party-primary-party-model.md](/Users/acehood/Documents/GitHub/oes/docs/adr/0008-tenant-scoped-tenant-party-primary-party-model.md)
  - [0003-party-master-service-and-tenant-party-binding.md](/Users/acehood/Documents/GitHub/oes/docs/adr/0003-party-master-service-and-tenant-party-binding.md)（superseded）

## 4. 当前结论

服务长期职责、核心对象、地址 / 联系人正文归属、业务 usage 边界、交易 snapshot 边界与 non-goals 均以 [party-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/party-service.md) 为唯一真相源。

本 feature packet 只记录执行状态与能力补齐护栏：

- `party-service` 已按 ADR 0008 改造为 tenant-scoped `TenantParty` 主体模型，当前阶段不再是纯设计态。
- 当前主源码目录、service name 与 proto package 已采用 `party-service` / `party_service` 命名。
- `identity-service` 不再让 `User` 持有 `partyId`；租户内 `UserAccount` 通过 `tenantPartyId` 关联当前租户的 `PERSON` TenantParty。
- `api-gateway` 已开始通过 `party-service` 查询主体显示名，用于管理员展示聚合。
- 当前适合在既有 contract 边界内继续补齐调用方协同与治理能力，而不是继续停留在 contract / implementation 未开始的表述。
- 若后续需要扩展 `PartyOfficialAddress / TenantPartyAddress / TenantPartyContact` contract / runtime，必须先补 `docs/contracts/party-service/**` 或独立 feature packet。

## 5. 契约真相位置

- 当前稳定架构真相：
  - [party-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/party-service.md)
  - [ADR 0008](/Users/acehood/Documents/GitHub/oes/docs/adr/0008-tenant-scoped-tenant-party-primary-party-model.md)
- 历史 ADR：
  - [ADR 0003](/Users/acehood/Documents/GitHub/oes/docs/adr/0003-party-master-service-and-tenant-party-binding.md) 已被 ADR 0008 supersede，不再作为运行时实现依据
- 当前已存在正式 contract 目录：
  - `docs/contracts/party-service/README.md`
  - `docs/contracts/party-service/registration.md`
  - `docs/contracts/party-service/query.md`
- 历史 merge contract：
  - `docs/contracts/party-service/merge.md` 属于 ADR 0003 system-wide Party 模型下的 superseded contract，不进入当前 runtime surface
- 后续仍需补齐：
  - address / contact 正文相关 contract
  - 事件契约文档
  - merge governance 协同设计
- 当前 runtime contract 应至少覆盖：
  - `RegisterTenantParty`
  - `SearchTenantPartyCandidates`
  - `GetTenantPartyById`
  - `ResolveTenantPartyByIdentifier`
  - `DeactivateTenantParty`
- 当前已允许继续在既有 contract 边界内推进平台层调用方接入；如需扩大能力面，仍应先补文档再改实现。

## 6. 线程分工

| Thread / Owner | 职责 | 允许修改路径 | 输入 | 输出 | 状态 |
| --- | --- | --- | --- | --- | --- |
| design owner | 将本轮 party 主线结论收口为 feature packet，并维护主线范围与风险护栏 | `docs/plans/features/party-service-foundation.md` | party-service 职责卡、ADR 0003、用户确认的设计结论 | 当前 feature packet | completed |
| contract owner | 维护已落地的 party-service 黑盒契约，并补齐 merge / 事件等未完文档 | `docs/contracts/party-service/**`, 必要时 `docs/contracts/index.md` | 当前 feature packet、ADR 0003、服务职责卡、已实现 proto/runtime | 最新 contract 文档与缺口清单 | in_progress |
| capability owner | 设计 address / contact、事件、merge governance 与审计 enforcement 等后续能力补齐路径 | `docs/plans/features/party-service-foundation.md`, future feature packet | 当前 feature packet、服务职责卡、contract 草案 | 能力补齐顺序、风险清单与回写目标 | pending |
| implementation owner | 继续在既有 contract 边界内推进调用方接入与剩余能力补齐 | `src/services/system/party-service/**`, `src/common/src/contracts/party_service/**`, 必要时调用方服务 | contract、feature packet、服务职责卡 | 可运行服务、测试、生成物与验证结果 | in_progress |
| review / integration owner | 检查实现是否越界进入 contact、HR、tenant-org、CRM/SRM 角色语义，并验证 tenantParty 引用链路 | 只读全局，必要时最小文档收口 | feature packet、contract、实现结果、验证结果 | review 结论与关闭判断 | pending |

## 7. 当前 slice

- slice:
  - `party-service` 第一阶段已落地，进入平台层受控接入与能力补齐阶段
- status:
  - phase-1-runtime-live
- scope:
  - 回写第一阶段已落地能力
  - 明确第二阶段平台层接入入口
  - 为后续业务域接入保留顺序约束
- ready definition:
  - `party-service` 职责卡已冻结
  - ADR 0003 已冻结 `TenantParty` 作为业务主体引用入口
  - `party-service` proto、runtime、Prisma schema 与测试样板已存在
  - `identity-service -> party-service` 人员主体注册链路已落地
  - `api-gateway` 已存在 `party-service` 查询型聚合调用

## 8. 主线范围

- 本线程主线：
  - 维护 `party-service` 第一阶段已落地事实与第二阶段能力补齐护栏。
  - 将 platform-first 接入顺序写成后续线程可消费的执行入口。
  - 明确当前可以开始受控接入，但不允许直接全域切换。
- 本线程不做：
  - 无计划的跨域直接切换
  - CRM / SRM contact 设计
  - tenant-org 或 HR 详细设计
- 偏移返回条件：
  - 需要改变 `TenantParty` 作为第一阶段业务引用入口
  - 需要让 `party-service` 拥有客户、供应商、员工或联系人语义
  - 需要把 `OrgUnit` 等同为 `TenantParty`
  - 需要改动 operator context、租户模型、权限模型或共享契约
  - 需要在 contract 冻结前开始代码实现

## 9. 阻塞 / 依赖

- system-wide Party merge 能力已随 ADR 0003 supersede，不属于当前 runtime surface；若未来需要跨租户主体治理，必须另行设计。
- `party-service` 的授权、审计、operator context、trace context 要求需要在 contract 中显式写明。
- `party.merged`、`tenant_party.bound` 等事件语义尚未冻结，不能先行在业务域消费。

## 10. 派生问题 Ledger

| 时间 | 问题 | 分类 | 当前影响 | 处理策略 | 目标落点 | 状态 |
| --- | --- | --- | --- | --- | --- | --- |
| 2026-04-22 | party-service 基础能力已落地，但 feature packet 状态滞后 | Blocker-Now | 如果继续按旧文档理解，会误判为“仍未开始实现”，影响后续接入决策 | 当前已回写“phase-1-runtime-live”状态，并要求后续线程按平台层受控接入推进 | 当前 feature packet | closed |
| 2026-04-22 | `tenant-org-service` 与 `organizationTenantPartyId` 的正式关联链 | Resolved | 组织节点如何受控引用当前租户内 `ORGANIZATION` TenantParty 已收敛到 tenant-org 真相源与协同文档 | 以 [tenant-org-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/tenant-org-service.md) 和 [party-identity-and-tenant-org.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/collaborations/party-identity-and-tenant-org.md) 为准 | tenant-org truth source + collaboration | closed |
| 2026-04-23 | party-service 文档簇 phase 状态存在漂移 | Resolved | 可能误导后续线程把 phase-1 runtime live 误读为仍未实现 | 已补充 phase-1 contract/runtime available 说明 | current feature packet + ADR 0003 | closed |
| 2026-04-19 | `TenantParty` 与业务单据快照边界 | Blocker-Later | 影响报价、订单、合同、发票如何引用主体与保存历史事实 | 当前先冻结原则：引用 `tenantPartyId` 并保存交易快照；具体单据字段在各业务域 contract 中落地 | future CRM / order / accounting feature | open |
| 2026-04-19 | party merge governance | Blocker-Later | 旧 system-wide Party merge 已随 ADR 0003 supersede；未来如需跨租户主体治理，需重新冻结对象模型、审计、引用重定向、回放与可能的 unmerge | 当前 runtime 不提供 `MergeParties`；后续独立设计 | future party governance design | open |
| 2026-04-19 | 外部工商 / 公共登记数据接入 | Sidecar | 有助于验证 party，但会显著扩大范围 | 第一阶段不做外部数据同步；后续以 integration hub 或 party verification feature 设计 | backlog / future integration feature | open |
| 2026-04-19 | CRM / SRM contact 模型 | Sidecar | 联系人会引用 person party，但语义不属于当前服务 | 后续由 CRM / SRM feature 独立冻结 contact 模型 | CRM / SRM design | open |

## 11. 验收标准

- 当前 feature packet 明确引用 `party-service` 职责卡与 ADR 0008，不重复定义服务边界。
- 当前 feature packet 明确服务职责与核心对象只以 [party-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/party-service.md) 为准。
- 当前 feature packet 明确后续 contract 文档位置与第一阶段必要 API 能力。
- 当前 feature packet 明确：现有第一阶段 contract 已可支撑平台层受控接入，但扩大能力面前仍须先补文档。
- 当前 feature packet 为 contract、capability、implementation、review 线程提供清晰职责和允许修改路径。

## 12. 关闭条件

- `party-service` 第一阶段 runtime 能力已存在并通过对应测试。
- `identity-service`、`tenant-org-service`、`hr-service`、`api-gateway` 已有真实 `TenantParty` 调用链。
- 已补协同蓝图，明确 `party / identity / tenant-org` 的长期边界与接入顺序。
- 第二阶段接入策略已明确采用 platform-first 受控接入，而不是 repo-wide 一次性切换。
- 未把 contact、HR、tenant-org、CRM/SRM 业务角色语义混入 `party-service`。

## 13. 备注

- 当前 feature packet 是执行协作入口，不替代服务职责卡、ADR 或正式 contract。
