# party-service 职责卡

## 1. Purpose

`party-service` 是 OES 的交易与法律主体主数据服务，负责回答“这个可被交易、签约、开票、结算或审计的自然人 / 组织主体是谁，以及当前租户如何受控引用它”。

## 2. Owns

- `Party` 主体真相，包括自然人主体与组织主体
- `TenantParty` 租户对主体的拥有 / 引用关系
- `PartyIdentifier` 证照、税号、注册号、护照号等稳定标识
- `PartyRelationship` 中少量稳定主体关系，例如母子公司、分支机构、法定代表人、股东或受益所有人
- 供 CRM、SRM、订单、合同、会计、HR 等上下文受控引用的主体基础事实

## 3. Does Not Own

- 登录认证与会话真相
- 角色、权限、授权判定真相
- 租户内部组织树、部门、小组与组织成员归属真相
- CRM、SRM、ERP 等业务域中的客户、供应商、员工等业务角色语义
- 客户联系人、供应商联系人、员工任职等上下文关系
- 通知、工作流、订单、合同、发票、会计凭证等业务流程状态真相

## 4. Core Responsibilities

- 提供与业务角色无关的 `Party` 主体主数据
- 通过 `TenantParty` 区分平台 canonical 主体与租户本地拥有 / 引用关系
- 通过 `PartyIdentifier` 支撑强匹配、候选查重、去重治理与主体解析
- 通过受控 `PartyRelationship` 表达稳定的法定或主体关系，但不承接 CRM / SRM 联系人关系
- 为业务域提供稳定主体引用基础；第一阶段业务单据优先引用 `tenantPartyId`
- 支撑主体停用、租户绑定停用与受控合并，而不是默认物理删除主体

## 5. External Interfaces

- 当前主要作为平台层边界定义与后续服务演进的事实源。
- 典型上游入口：`api-gateway`、CRM、SRM、订单、合同、会计、`identity-service`、`tenant-org-service`、`hr-service`
- 项目级边界参考：
  - [02-bounded-contexts.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/02-bounded-contexts.md)
- 架构决策参考：
  - [ADR 0003: Party Master Service And Tenant Party Binding](/Users/acehood/Documents/GitHub/oes/docs/adr/0003-party-master-service-and-tenant-party-binding.md)

## 6. Upstream Dependencies

- 无强制上游业务服务依赖；其上游通常是项目级 bounded context 规则、租户上下文与后续业务域需求。
- 在需要授权保护的管理接口中，应通过 `permission-service` 执行授权判定。

## 7. Downstream / Published Facts

- `partyId` 对应的 canonical 主体事实
- `tenantPartyId` 对应的租户主体引用事实
- 自然人 / 组织主体基础摘要
- 主体标识与查重候选结果
- 稳定主体关系摘要
- 主体合并、停用、租户绑定等可审计事实

## 8. Non-goals

- 不直接扮演客户、供应商、员工等业务角色服务
- 不承载身份认证、授权判定、组织上下文或业务交易流程
- 不作为通用联系人服务、HR 服务或组织树服务
- 不让业务域绕过 `TenantParty` 直接复制主体主数据

## 9. Current Stage

当前文档冻结的是目标架构职责边界。仓库中仍可能存在旧 `entity-service` 代码、契约、包名、Prisma schema 或运行时配置；这些属于迁移前实现状态，不代表长期服务边界。

后续线程若触碰现有 `entity-service` 实现，必须明确说明是在做兼容性维护，还是正式启动 `entity-service -> party-service` 迁移。
