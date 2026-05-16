# Party、Identity、HR 与 Tenant/Org 协同蓝图

## 1. 目标

定义 OES 中现实世界主体、登录身份、租户边界与组织结构之间的长期协同方式，回答：

- `party-service`、`identity-service`、`tenant-org-service`、`hr-service` 各自拥有哪一层真相
- `User`、`Party`、`TenantParty`、`Employee`、`Employment`、`OrgUnit` 之间如何受控关联
- 哪些入口已经允许接入，哪些入口仍需后置

`identity-service` 的长期职责、核心对象与 owner 语义只以 [identity-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/identity-service.md) 为准；`hr-service` 的 `Employee / Employment` 与正式 `人 -> org` 归属边界只以 [hr-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/hr-service.md) 为准。本文只记录 Party、Identity、Tenant-Org 与 HR 之间的协同方式。

## 2. 参与服务

- `party-service`
- `identity-service`
- `tenant-org-service`
- `hr-service`
- `api-gateway`，在需要聚合主体展示信息时

## 3. 真相归属

- `party-service`
  - Party 主体、租户主体引用、标识、地址 / 联系人正文与稳定主体关系等服务边界以 [party-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/party-service.md) 为准
- `identity-service`
  - `User`、`UserAccount`、`User.partyId -> Party(Person)`、`UserAccount <-> Employee` binding 与联系资产边界以 [identity-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/identity-service.md) 为准
- `tenant-org-service`
  - tenant boundary、org tree 与 `OrgUnit` 到 organization party 的可选受控关联边界以 [tenant-org-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/tenant-org-service.md) 为准
- `hr-service`
  - `Employee / Employment` 与正式 `人 -> org` 任职真相以 [hr-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/hr-service.md) 为准

## 4. 核心边界

- `Party` 与 `TenantParty` 的核心语义以 [party-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/party-service.md) 为准。
- `User` 与 `UserAccount` 的稳定语义以 [identity-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/identity-service.md) 为准。
- `TenantParty` 是业务域第一阶段默认主体引用入口，不是裸 `partyId`。
- HR 对象语义、员工是否成立、员工如何正式任职到 `OrgUnit` 以 [hr-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/hr-service.md) 为准。
- `OrgUnit` 不等于 `Party`；组织节点如需表达现实世界组织主体，应受控关联到 organization party，而不是把 org tree 放进 `party-service`。
- `account -> org` 不是正式真相；若未来存在 account 视角 org 数据，也只能来自 `Employment` 派生投影。

## 5. 当前已落地协同

截至 2026-04-22，以下链路已经正式落地：

1. `identity-service` 创建新用户时，会先调用 `party-service` 注册 `PersonParty`
2. `identity-service.User` 已正式持有 `partyId`
3. `identity-service` query contract 已开始向上游暴露 `partyId / userPartyId`
4. `api-gateway/auth-bff` 管理端展示名已开始优先通过 `party-service` 补水

这些实现说明 `party-service` 已经具备平台层受控接入基础，不再只是目标态设计。

## 6. 当前未落地协同

截至当前，以下能力仍未进入正式接入：

- 业务域统一以 `tenantPartyId` 引用主体的接入

业务域统一 `tenantPartyId` 引用仍不应在当前 platform-first 主线中顺手扩张实现。

## 7. `organizationPartyId` 正式收口

`organizationPartyId` 的字段语义、允许节点类型与必填边界以 [tenant-org-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/tenant-org-service.md) 为准；组织主体边界以 [party-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/party-service.md) 为准。

## 8. 校验责任分工

- `tenant-org-service`
  - 按 [tenant-org-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/tenant-org-service.md) 拥有 `organizationPartyId` 字段的写入、更新、清空、读侧发布与 org type 校验语义
  - 通过 `party-service` 只读 query 校验目标 party 是否存在、是否为可绑定组织主体、是否处于可引用状态
- `party-service`
  - 继续只拥有 [party-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/party-service.md) 中冻结的主体真相
  - 通过 query contract 提供 existence / type / status 事实
  - 不拥有 org tree、OrgUnit 生命周期或节点类型规则
- `api-gateway`
  - 只暴露管理入口和查询入口所需的 `organizationPartyId` 字段
  - 不在 gateway/BFF 层承载 party type、org type 或 owner 语义判断

## 9. 接入护栏

- 当前闭环只做 platform-first 的 `tenant-org-service` 写入口、查询入口与 gateway 暴露。
- 不把 org tree 语义并入 `party-service`。
- 不引入 customer / supplier / employee / contact / external collaborator 角色语义。
- 不把 `organizationPartyId` 扩张为 repo-wide `tenantPartyId` 或裸 `partyId` 统一运动。
- 不顺手做 admin / directory 大面积聚合增强。

## 10. 接入准入规则

当前允许开始的接入类型：

- 平台层服务之间的受控接入
  - `identity-service -> party-service`
  - `api-gateway -> party-service`
  - `tenant-org-service -> party-service`
  - `hr-service` minimum 在既有 `party-service` 边界内受控消费 `Register / Bind / Get / Search`
- 明确只读展示型聚合

当前不允许直接开始的接入类型：

- 业务域在没有独立 feature / contract 的前提下直接改为裸 `partyId`
- 把 `tenant-org-service` 的 org tree 语义并入 `party-service`
- 让前端绕过 BFF / gateway 直接消费 `party-service`

## 11. 入口规则

- 平台管理与展示入口统一通过 `api-gateway` / BFF 暴露
- 内部同步协作统一走 gRPC
- `party-service` 不直接成为前端入口
- 用户与账号相关入口继续由 `identity-service` / `auth-service` 承接，再按需要联动 `party-service`

## 12. 接入顺序

推荐顺序如下：

1. 平台层协同先行
   - `identity-service`
   - `api-gateway`
   - `tenant-org-service`
2. 业务域引用接入
   - CRM / SRM / 订单 / 合同 / 会计
   - 统一按 `tenantPartyId` 进入

## 13. 明确禁止

- 不让 `identity-service` 继续拥有真实姓名真相
- 不让 `party-service` 承担登录、会话、org tree、客户联系人或员工任职语义
- 不让 `identity-service`、`tenant-org-service` 或兼容 membership API 重新拥有正式 `employee -> org` 真相
- 不让业务域绕过 `TenantParty`
- 不让单个实现线程自行决定跨服务接入边界

## 14. 关联文档

- [party-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/party-service.md)
- [identity-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/identity-service.md)
- [tenant-org-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/tenant-org-service.md)
- [hr-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/hr-service.md)
- [0003-party-master-service-and-tenant-party-binding.md](/Users/acehood/Documents/GitHub/oes/docs/adr/0003-party-master-service-and-tenant-party-binding.md)
- [party-service-foundation.md](/Users/acehood/Documents/GitHub/oes/docs/plans/features/party-service-foundation.md)
- [employee-onboarding.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/collaborations/employee-onboarding.md)
