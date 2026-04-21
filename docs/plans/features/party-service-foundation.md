# Party Service Foundation

## 1. 目标

- 将已冻结的 `party-service` 架构结论转成可执行 feature packet，作为后续契约设计、迁移设计与实现线程的主线入口。
- 建立 `party-service` 第一阶段最小闭环：`Party`、`TenantParty`、`PartyIdentifier`、少量稳定 `PartyRelationship`。
- 明确业务域第一阶段以 `tenantPartyId` 作为主体引用入口，而不是直接依赖裸 `partyId` 或复制主体主数据。
- 明确从旧 `entity-service` 实现状态迁移到目标 `party-service` 架构的执行护栏。
- 为 CRM、SRM、订单、合同、会计、`identity-service`、`tenant-org-service`、`hr-service` 后续依赖 party 主数据提供稳定边界。

## 2. 不做什么

- 不直接实现代码、proto、Prisma schema 或 runtime service rename。
- 不把旧 `entity-service` 泛化模型继续扩展为长期边界。
- 不做完整 MDM 平台、外部工商数据同步或复杂主数据治理平台。
- 不做客户、供应商、员工、联系人、组织树或业务单据状态模型。
- 不做 CRM / SRM contact 模型；联系人语义由对应业务域承接。
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
  - future party registration / tenant binding collaboration
  - future party usage from CRM / SRM / transaction documents
  - future party merge governance collaboration
- contracts:
  - future [party-service/README.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/party-service/README.md)
  - future party registration / tenant binding / query / merge contracts
- adr:
  - [0003-party-master-service-and-tenant-party-binding.md](/Users/acehood/Documents/GitHub/oes/docs/adr/0003-party-master-service-and-tenant-party-binding.md)

## 4. 当前结论

- `party-service` 是交易与法律主体主数据服务，不再沿用泛化 `entity-service` 作为长期服务边界。
- `Party` 表示 canonical 自然人或组织主体。
- `TenantParty` 表示租户对某个 `Party` 的拥有 / 引用关系，是第一阶段业务域默认主体引用入口。
- `PartyIdentifier` 承接税号、注册号、身份证号、护照号等稳定标识，并支撑强匹配、候选查重与后续去重治理。
- `PartyRelationship` 第一阶段只承接少量稳定主体关系，例如母子公司、分支机构、法定代表人、股东或受益所有人。
- CRM / SRM 拥有 customer / supplier 与 contact 语义；contact 不进入 `party-service`。
- `tenant-org-service` 拥有组织树、组织成员与 org scope；`OrgUnit` 可选关联 organization party，但不等于 party。
- `hr-service` 拥有员工与任职关系；员工不是 party 类型，而是租户内人力语义。
- 业务单据第一阶段引用 `tenantPartyId`，并保存交易时名称、税号、地址、联系人等关键快照。
- 当前仓库仍可能存在旧 `entity-service` 代码、契约、包名、Prisma schema 或运行时配置；这些属于迁移前实现状态，不代表长期边界。

## 5. 契约真相位置

- 当前稳定架构真相：
  - [party-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/party-service.md)
  - [ADR 0003](/Users/acehood/Documents/GitHub/oes/docs/adr/0003-party-master-service-and-tenant-party-binding.md)
- 本 feature 后续应新增正式 contract 目录：
  - `docs/contracts/party-service/README.md`
  - `docs/contracts/party-service/registration.md`
  - `docs/contracts/party-service/query.md`
  - `docs/contracts/party-service/merge.md`
- 第一阶段 contract 应至少覆盖：
  - `RegisterPersonParty`
  - `RegisterOrganizationParty`
  - `SearchPartyCandidates`
  - `BindExistingPartyToTenant`
  - `GetPartyById`
  - `GetTenantPartyById`
  - `MergeParties`
  - `DeactivateTenantParty`
- contract 冻结前不得进入 proto / generated client / downstream caller 实现。

## 6. 线程分工

| Thread / Owner | 职责 | 允许修改路径 | 输入 | 输出 | 状态 |
| --- | --- | --- | --- | --- | --- |
| design owner | 将本轮 party 主线结论收口为 feature packet，并维护主线范围与风险护栏 | `docs/plans/features/party-service-foundation.md` | party-service 职责卡、ADR 0003、用户确认的设计结论 | 当前 feature packet | completed |
| contract owner | 设计 party-service 黑盒契约、错误语义、上下文要求与事件草案 | `docs/contracts/party-service/**`, 必要时 `docs/contracts/index.md` | 当前 feature packet、ADR 0003、服务职责卡 | 可实现 contract 草案与正式契约文档 | pending |
| migration owner | 设计从当前 `entity-service` 实现状态到 `party-service` 的迁移路径 | `docs/plans/features/party-service-foundation.md`, future implementation plan | 当前 feature packet、现有代码骨架、contract 草案 | 迁移策略、兼容策略、实现顺序与风险清单 | pending |
| implementation owner | 在 contract 与迁移策略冻结后实现 party-service 第一阶段最小闭环 | `src/services/system/party-service/**` 或明确迁移路径下的旧 `entity-service` 相关路径, `src/common/src/contracts/party_service/**` | contract、迁移策略、implementation plan | 可运行服务、测试、生成物与验证结果 | pending |
| review / integration owner | 检查实现是否越界进入 contact、HR、tenant-org、CRM/SRM 角色语义，并验证 tenantParty 引用链路 | 只读全局，必要时最小文档收口 | feature packet、contract、实现结果、验证结果 | review 结论与关闭判断 | pending |

## 7. 当前 slice

- slice:
  - `party-service-foundation` feature packet 冻结
- status:
  - design-packet-created
- scope:
  - 记录第一阶段目标模型
  - 记录 contract 后续落点
  - 记录 `entity-service -> party-service` 迁移护栏
  - 记录多线程分工与偏移返回条件
- ready definition:
  - `party-service` 职责卡已冻结
  - ADR 0003 已冻结 `TenantParty` 作为业务主体引用入口
  - `tenant-org-service` 与 `hr-service` 已有独立职责卡
  - 用户已确认当前主线进入 feature packet 沉淀

## 8. 主线范围

- 本线程主线：
  - 建立 `party-service-foundation` feature packet。
  - 将本轮主线设计转成后续 contract / migration / implementation 线程可消费的执行入口。
  - 明确第一阶段 party-service 最小闭环与不做范围。
  - 明确旧 `entity-service` 运行时状态只是迁移前实现，不代表长期边界。
- 本线程不做：
  - 代码实现
  - proto / generated client
  - Prisma schema
  - 服务目录重命名
  - CRM / SRM contact 设计
  - tenant-org 或 HR 详细设计
- 偏移返回条件：
  - 需要改变 `TenantParty` 作为第一阶段业务引用入口
  - 需要让 `party-service` 拥有客户、供应商、员工或联系人语义
  - 需要把 `OrgUnit` 等同为 `OrganizationParty`
  - 需要改动 operator context、租户模型、权限模型或共享契约
  - 需要在 contract 冻结前开始代码实现

## 9. 阻塞 / 依赖

- 需要新增 `docs/contracts/party-service/**`，冻结黑盒契约后才能进入 proto / implementation。
- 需要先设计迁移路径，避免直接重命名旧 `entity-service` 造成 package、generated contracts、Prisma、service discovery、调用方和测试断裂。
- 当前仓库中旧 `entity-service` 代码仍存在；任何实现线程必须明确是兼容维护还是正式迁移。
- `party-service` 的授权、审计、operator context、trace context 要求需要在 contract 中显式写明。
- `party.merged`、`tenant_party.bound` 等事件语义尚未冻结，不能先行在业务域消费。

## 10. 派生问题 Ledger

| 时间 | 问题 | 分类 | 当前影响 | 处理策略 | 目标落点 | 状态 |
| --- | --- | --- | --- | --- | --- | --- |
| 2026-04-19 | `entity-service` 旧实现与 `party-service` 目标架构并存 | Blocker-Now | 若不标记迁移状态，后续线程可能继续扩展旧 entity 语义 | 已在 ADR 0003 与 party-service 职责卡增加迁移风险与护栏；本 packet 继续要求先设计迁移路径 | 当前 feature packet + ADR 0003 | open |
| 2026-04-19 | party-service contract 尚未冻结 | Blocker-Now | 没有黑盒契约会导致 proto、服务实现和调用方各自猜字段 | 下一 slice 先新增 `docs/contracts/party-service/**` | contract owner | open |
| 2026-04-19 | `TenantParty` 与业务单据快照边界 | Blocker-Later | 影响报价、订单、合同、发票如何引用主体与保存历史事实 | 当前先冻结原则：引用 `tenantPartyId` 并保存交易快照；具体单据字段在各业务域 contract 中落地 | future CRM / order / accounting feature | open |
| 2026-04-19 | party merge governance | Blocker-Later | merge 涉及审计、引用重定向、回放与可能的 unmerge | 第一阶段 contract 可定义受控 `MergeParties`；详细治理流程后续独立设计 | future party merge design | open |
| 2026-04-19 | 外部工商 / 公共登记数据接入 | Sidecar | 有助于验证 party，但会显著扩大范围 | 第一阶段不做外部数据同步；后续以 integration hub 或 party verification feature 设计 | backlog / future integration feature | open |
| 2026-04-19 | CRM / SRM contact 模型 | Sidecar | 联系人会引用 person party，但语义不属于当前服务 | 后续由 CRM / SRM feature 独立冻结 contact 模型 | CRM / SRM design | open |

## 11. 验收标准

- 当前 feature packet 明确引用 `party-service` 职责卡与 ADR 0003。
- 当前 feature packet 明确 `TenantParty` 是第一阶段业务域默认主体引用入口。
- 当前 feature packet 明确 `party-service` 不拥有 customer、supplier、employee、contact、org tree 或 transaction state。
- 当前 feature packet 明确后续 contract 文档位置与第一阶段必要 API 能力。
- 当前 feature packet 明确旧 `entity-service` 是迁移前实现状态，并要求实现线程先声明兼容维护或正式迁移。
- 当前 feature packet 明确 contract 冻结前不得进入 proto / generated client / downstream caller 实现。
- 当前 feature packet 为 contract、migration、implementation、review 线程提供清晰职责和允许修改路径。

## 12. 关闭条件

- `party-service-foundation` feature packet 已创建并被主线确认。
- `docs/contracts/party-service/**` 已新增并冻结第一阶段黑盒契约。
- 迁移策略已明确选择直接重命名、并行新建或兼容包装路径，并记录取舍。
- 基于 contract 与迁移策略产出 implementation plan。
- 第一阶段实现完成 `Party / TenantParty / PartyIdentifier / PartyRelationship` 最小闭环。
- register / bind / search / merge / deactivate / query 能力通过 L1/L2 测试。
- 未把 contact、HR、tenant-org、CRM/SRM 业务角色语义混入 `party-service`。

## 13. 备注

- 本 feature 从 `entity-service` 设计主线收口而来，稳定架构真相已回写到 `party-service` 职责卡与 ADR 0003。
- 当前 feature packet 是执行协作入口，不替代服务职责卡、ADR 或正式 contract。
- 后续如果要直接触碰现有 `src/services/system/entity-service`，必须先在迁移策略中说明是否保留兼容层以及如何处理调用方。
