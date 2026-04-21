# srm-service 职责卡

## 1. Purpose

`srm-service` 是 OES 的供应商关系与供应侧协同真相服务，负责回答“这个主体作为供应商在当前租户内处于什么合作状态、应由谁协作、当前表现如何、有哪些需要关注的供应商分析结论”。

当前职责卡冻结的是 SRM 的独立服务边界；完整实施顺序、契约和分析指标口径仍需在后续 design / feature / contract 中继续细化。

## 2. Owns

- 供应商业务档案：
  - `Supplier`
- 供应商联系人业务语义：
  - `SupplierContact`
- 供应商在 SRM 语义下的业务角色、分类、服务范围和合作状态
- 供应商关系中的协作入口、联系人健康度和主联系人缺失等关系事实
- 面向供应商分析页的聚合读模型：
  - `SupplierAnalysisView`
- SRM 自身的人工风险备注、分析结论摘要与供应商治理辅助事实

## 3. Does Not Own

- `party-service` 的主体主数据真相：
  - `Party`
  - `TenantParty`
  - `PartyIdentifier`
  - `PartyRelationship`
- 认证、会话、令牌：
  - `auth-service`
- 身份映射与 operator context 真相：
  - `identity-service`
- 角色、权限、scope、policy 与授权判定真相：
  - `permission-service`
- 组织树、部门、小组、成员归属真相：
  - `tenant-org-service`
- 采购申请、采购订单、履约状态与采购执行规则真相：
  - `procurement-service`
- 来料检验、批次质量判定、拒收与质量处理真相：
  - future `quality-service` / `inventory` / `mes-service`
- 邮件线程、共享邮箱工作台、原始通信归档：
  - `communication / mailbox`
- Email / SMS / IM 投递平台：
  - `notification-service`
- AI 模型调用、AI agent 编排或 AI 工具协议真相

## 4. Core Responsibilities

- 管理供应商业务角色语义，而不是复制 `party-service` 主体主数据。
- 承接供应商在当前租户内的合作关系、基础状态、服务范围与分类治理。
- 管理供应商联系人在 SRM 语义下的业务角色、联络偏好和可联络状态。
- 对外提供统一供应商查询入口，供 Procurement、Communication、Workflow 和后续业务域受控引用。
- 为供应商分析页聚合 SRM 自有事实、人工备注以及其他业务域发布的供应商分析相关事实。
- 为权限层提供资源 owner、team、协作可见性和供应商状态所需的业务事实。

## 5. External Interfaces

- 典型上游入口：
  - `api-gateway`
  - future tenant-web SRM pages
  - future workflow / collaboration entrypoints through BFF or gateway
- 当前设计工作台：
  - [srm-service-design.md](../../plans/designs/srm-service-design.md)
- 项目级边界参考：
  - [02-bounded-contexts.md](../02-bounded-contexts.md)

## 6. Upstream Dependencies

- `party-service`
  - 提供组织主体、自然人主体及 `tenantPartyId` / `partyId` 引用基础。
  - SRM 不应复制主体主数据真相。
- `permission-service`
  - 提供接口权限、资源授权、查询范围与协同可见性判定能力。
- `identity-service`
  - 提供 operator account / tenant / team 相关身份上下文事实。
- `tenant-org-service`
  - 提供组织树、责任组织与 org scope 基础事实。
- future business services
  - `procurement-service`、future `quality-service`、`communication / mailbox`、future ERP/Finance 等可向 SRM 提供供应商分析相关事实或事件。

## 7. Downstream / Published Facts

- 供应商业务档案与状态摘要
- 供应商联系人业务角色、联络状态和主联系人缺失等关系事实
- 可供 Procurement / Workflow / Communication 查询的供应商合作状态与范围摘要
- 供应商分析页所需的聚合结果与人工风险备注
- 供应商侧 owner、team、状态、协作可见性等业务事实

## 8. Non-goals

- 不作为通用主体主数据服务
- 不直接拥有采购交易、质量检验、财务结算或通信线程真相
- 不在第一阶段强行冻结完整准入 / 资质 / 整改闭环模块
- 不让 AI 直接写正式供应商主数据或越过应用服务执行状态变更
- 不让前端直接拼接多个下游服务替代 SRM 分析视图

## 9. Current Stage

当前阶段只冻结第一版 SRM 的最小独立服务边界：

- `Supplier` 和 `SupplierContact` 是第一版优先冻结的核心业务对象。
- `SupplierAnalysisView` 是第一版优先冻结的分析读模型。
- `SupplierQualification` 与 `SupplierImprovementPlan` 当前后置，不进入第一版核心范围。
- 其他业务域事实如何在 SRM 内部落为分析证据模型，目前仍是待定事项；本轮只冻结“原始真相归原服务拥有，SRM 只消费和沉淀面向供应商分析的派生结果”。
