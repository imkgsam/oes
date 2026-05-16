# party-service 职责卡

Last Updated: 2026-05-13

## 1. Purpose

`party-service` 是 OES 的交易与法律主体主数据服务，负责回答“这个可被交易、签约、开票、结算或审计的自然人 / 组织主体是谁，以及当前租户如何受控引用它”。

涉及 HR `Employee / Employment`、员工生命周期或正式 `人 -> org` 归属时，以 [hr-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/hr-service.md) 为准；本文只定义 Party 主体与租户主体引用边界。

## 2. Owns

- `Party` canonical 主体真相，包括 `PersonParty` 与 `OrganizationParty`
- `TenantParty` 租户对主体的拥有 / 引用关系
- `PartyIdentifier` 证照、税号、注册号、护照号等稳定标识
- `PartyOfficialAddress` 现实主体的官方 / 注册地址摘要
- `TenantPartyAddress` 租户视角的主体地址簿
- `TenantPartyContact` 租户视角的主体联系人簿
- `PartyRelationship` 中少量稳定主体关系，例如母子公司、分支机构、法定代表人、股东或受益所有人
- 供 CRM、SRM、订单、合同、会计、HR 等上下文受控引用的主体基础事实

## 3. Does Not Own

- 登录认证与会话真相
- 角色、权限、授权判定真相
- 租户内部组织树、部门、小组与组织成员归属真相
- CRM、SRM、ERP 等业务域中的客户、供应商、员工等业务角色语义；员工与任职语义以 [hr-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/hr-service.md) 为准
- 客户 / 供应商联系人 usage、地址 usage、员工任职等上下文关系；员工任职以 [hr-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/hr-service.md) 为准
- 通知、工作流、订单、合同、发票、会计凭证等业务流程状态真相
- 销售、采购、收发货、开票、收付款等交易单据地址 / 联系人 snapshot

## 4. Core Responsibilities

- 提供与业务角色无关的 `Party` 主体主数据，其中 `PersonParty` 回答“这个自然人是谁”，`OrganizationParty` 回答“这个现实世界组织主体是谁”
- 通过 `TenantParty` 区分平台 canonical 主体与租户本地拥有 / 引用关系
- 通过 `PartyIdentifier` 支撑强匹配、候选查重、去重治理与主体解析
- 第一阶段创建组织主体时必须采集官方注册号 / 税号 / 统一社会信用代码等强标识，并以 `countryCode + identifierType + normalizedValue` 作为强匹配基础
- 精确强匹配命中既有 `Party` 时，当前租户应复用该 `Party` 并创建 / 采用自己的 `TenantParty`；普通 CRM / SRM 用户不能看到其他租户的业务数据
- Party 去重、merge 与 unmerge 属于系统级 master-data governance，普通租户用户不拥有全局主体合并权限
- 维护 `PartyOfficialAddress` 作为官方注册地址摘要；首个创建租户可以提交该地址，但不因此获得全局官方地址所有权，后续维护应由系统级 data steward 治理
- 维护 `TenantPartyAddress / TenantPartyContact` 作为租户本地可见的主体地址簿与联系人簿；CRM / SRM 只在各自上下文维护 usage、默认值、状态与备注
- 通过受控 `PartyRelationship` 表达稳定的法定或主体关系，但不承接 CRM / SRM 联系人关系
- 为 `hr-service` 提供可被正式员工主档引用的自然人主体真相，但不拥有员工、任职或组织归属语义；HR 边界以 [hr-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/hr-service.md) 为准
- 为业务域提供稳定主体引用基础；第一阶段业务单据优先引用 `tenantPartyId`
- 支撑主体停用、租户绑定停用与受控合并，而不是默认物理删除主体

## 5. Core Object Rules

### 5.1 Party

`Party` 表达跨业务上下文可复用的现实主体，只回答“这个自然人或组织主体是谁”。

- `PersonParty` 表达自然人主体，不表达员工、账号、联系人 usage 或登录身份。
- `OrganizationParty` 表达现实世界组织主体，不表达租户内部组织树、部门、小组或业务客户 / 供应商角色。
- 主体名称不是全局唯一键；强匹配必须依赖受控标识，而不是只按名称判定同一主体。

### 5.2 TenantParty

`TenantParty` 表达某个 tenant 对 canonical `Party` 的受控拥有 / 引用关系。

- 第一阶段 HR、CRM、SRM、销售、采购、合同、会计等业务上下文默认引用 `tenantPartyId`。
- 业务域不得绕过 `TenantParty` 直接以裸 `partyId` 作为租户内业务主体主引用。
- 不同租户可以引用同一个 canonical `Party`，但各自业务数据、地址 usage、联系人 usage、客户 / 供应商状态必须隔离。

### 5.3 PartyIdentifier

`PartyIdentifier` 表达官方主体识别号与稳定证照标识。

- 组织主体第一阶段必须采集官方注册号 / 税号 / 统一社会信用代码等强标识。
- 强匹配基础为 `countryCode + identifierType + normalizedValue`。
- 精确强匹配命中既有 `Party` 时，应复用 canonical `Party`，再为当前租户创建或采用自己的 `TenantParty`。
- 候选查重、人工确认复用、外部工商数据校验与更复杂 MDM 治理属于后续增强，不应被调用方当作当前自动完成能力。

### 5.4 Party Address / Contact

`party-service` 拥有主体地址和联系人正文，但不拥有业务 usage。

- `PartyOfficialAddress` 是现实主体的官方 / 注册地址摘要。
- 首个创建租户可以提交官方地址，但不因此获得全局官方地址所有权；后续维护应由系统级 data steward 治理。
- `TenantPartyAddress` 是租户本地可见的主体地址簿正文。
- `TenantPartyContact` 是租户本地可见的主体联系人簿正文。
- `CustomerAddressUsage / CustomerContactUsage` 归 `crm-service`。
- `SupplierAddressUsage / SupplierContactUsage` 归 `srm-service`。
- 销售、采购、收发货、开票、收付款等交易单据必须保存自己的地址 / 联系人 snapshot，不依赖回查当前 Party、CRM 或 SRM 主数据解释历史交易。

### 5.5 PartyRelationship

`PartyRelationship` 只表达少量稳定主体关系。

- 第一阶段关系示例包括母子公司、分支机构、法定代表人、股东或受益所有人。
- CRM 联系人关系、SRM 联系人关系、HR 任职关系、组织树关系都不属于 `PartyRelationship`。

### 5.6 Registration / Query / Merge

当前已落地的第一阶段黑盒能力包括：

- registration / binding：
  - `RegisterPersonParty`
  - `RegisterOrganizationParty`
  - `BindExistingPartyToTenant`
  - `DeactivateTenantParty`
- query：
  - `GetPartyById`
  - `GetTenantPartyById`
  - `ResolvePartyByIdentifier`
  - `SearchPartyCandidates`
  - `ListPartyRelationships`
- merge：
  - `MergeParties`

第一阶段 `MergeParties` 只冻结受控合并入口与基础状态标记；redirect、history traceability、downstream repair、unmerge、审批流、完整事件契约与主数据治理链均后置。

## 6. External Interfaces

- 当前主要作为平台层边界定义与后续服务演进的事实源。
- 典型上游入口：`api-gateway`、CRM、SRM、订单、合同、会计、`identity-service`、`tenant-org-service`、`hr-service`
- `tenant-org-service` 的 `Tenant / OrgUnit / organizationPartyId` 边界以 [tenant-org-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/tenant-org-service.md) 为准，Party 只拥有主体主数据与租户主体引用事实。
- 项目级边界参考：
  - [02-bounded-contexts.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/02-bounded-contexts.md)
- 协同蓝图参考：
  - [party-identity-and-tenant-org.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/collaborations/party-identity-and-tenant-org.md)
- 架构决策参考：
  - [ADR 0003: Party Master Service And Tenant Party Binding](/Users/acehood/Documents/GitHub/oes/docs/adr/0003-party-master-service-and-tenant-party-binding.md)

## 7. Upstream Dependencies

- 无强制上游业务服务依赖；其上游通常是项目级 bounded context 规则、租户上下文与后续业务域需求。
- 在需要授权保护的管理接口中，应通过 `permission-service` 执行授权判定；permission 侧核心对象与 owner 边界以 [permission-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/permission-service.md) 为准。

## 8. Downstream / Published Facts

- `partyId` 对应的 canonical 主体事实
- `tenantPartyId` 对应的租户主体引用事实
- 自然人 / 组织主体基础摘要
- 主体标识与查重候选结果
- 官方地址摘要
- 租户主体地址簿与联系人簿摘要
- 稳定主体关系摘要
- 主体合并、停用、租户绑定等可审计事实

## 9. Non-goals

- 不直接扮演客户、供应商、员工等业务角色服务
- 不承载身份认证、授权判定、组织上下文或业务交易流程
- 不作为通用联系人服务、HR 服务或组织树服务
- 不让业务域绕过 `TenantParty` 直接复制主体主数据
- 不把客户 / 供应商地址 usage、联系人 usage 或交易 snapshot 放回 `party-service`

## 10. Current Contract / Runtime Alignment

本职责卡冻结的是长期服务边界；contract / runtime 可分阶段补齐。

当前已落地：

- `party-service` 主源码目录、proto package 与 generated client 已采用 `party-service / party_service` 命名。
- registration、query、merge 的第一阶段 proto / runtime 已存在。
- `RegisterPersonParty`、`RegisterOrganizationParty` 与 `BindExistingPartyToTenant` 请求已包含 `idempotency_key`。
- `identity-service` 已开始通过 `party-service` 创建 `PersonParty` 并持有 `User.partyId`。
- `api-gateway` 已开始通过 `party-service` 查询主体显示名，用于管理端展示聚合。

当前待补 contract / runtime：

- `PartyOfficialAddress`
- `TenantPartyAddress`
- `TenantPartyContact`
- address / contact 正文的查询、写入、停用与审计 contract
- 官方地址 data steward 治理能力
- 完整 merge governance、事件契约、引用修复链与 unmerge
- internal-service / authenticated-operator / permission guard enforcement
- 统一审计事件落库、outbox 或平台 audit 集成

以上待补项不改变 owner 归属；后续实现前必须先补 `docs/contracts/party-service/**` 或对应 feature packet。

CRM / SRM 客户与供应商主档第一阶段依赖以下 party foundation：

- `Party` 是跨租户可治理的现实主体。
- `TenantParty` 是租户内对 `Party` 的受控引用；不同租户对同一 `Party` 的业务数据完全隔离。
- `PartyIdentifier` 承接官方主体识别号，并支撑创建时强匹配去重。
- `TenantPartyAddress / TenantPartyContact` 承接租户本地地址和联系人正文。
- `CustomerAddressUsage / SupplierAddressUsage`、`CustomerContactUsage / SupplierContactUsage` 分别归 CRM / SRM。
