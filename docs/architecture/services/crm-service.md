# crm-service 职责卡

## 1. Purpose

`crm-service` 是 OES 的客户关系与销售前置信息服务，负责回答“销售侧如何管理潜在线索、客户关系、联系人、商机以及客户交互过程”。

当前职责卡是最小版本，用于支撑 Browser Prospecting Workspace 第一阶段的后端归属设计；完整 CRM 模型仍需在后续 feature / architecture 中逐步冻结。

## 2. Owns

- CRM 语义下的销售线索、客户关系、联系人角色、商机与销售交互过程。
- `prospecting` 前置研究能力：
  - research target
  - research timeline / event
  - research fact / note
  - contact clue
  - lead draft
  - disqualification / low-value research judgement
- 从 `LeadDraft` 到正式 CRM Lead 的受控交接边界。
- CRM 资源的业务归属、销售协同状态与客户开发状态。

## 3. Does Not Own

- 现实世界 Person / Organization 主体事实；该事实归属 `party-service`。
- 认证、会话、令牌；归属 `auth-service`。
- 账号、身份映射、租户账号事实；归属 `identity-service`。
- 角色、权限、授权判定真相；归属 `permission-service`。
- AI 模型调用、AI agent 编排或 AI 工具协议真相。
- 正式销售订单、报价、财务或履约真相。

## 4. Core Responsibilities

- 承接销售背调和客户开发过程中的可审计研究信息。
- 管理 CRM 业务角色语义，而不是复制 `party-service` 主体主数据。
- 支持从不完整研究资料逐步转为正式 lead / contact / account 的人工确认流程。
- 为 Gateway / BFF 提供面向插件、Web 和未来移动端的稳定业务能力。
- 为权限层提供资源归属、team 协同和可见性裁剪所需的业务事实。

## 5. External Interfaces

- 典型上游入口：
  - `api-gateway`
  - future CRM Web pages
  - browser prospecting extension through BFF only
- 当前契约草案：
  - [browser-prospecting-workspace.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/api-gateway/browser-prospecting-workspace.md)
- 当前设计工作台：
  - [crm-service-design.md](/Users/acehood/Documents/GitHub/oes/docs/plans/designs/crm-service-design.md)
  - [browser-prospecting-workspace.md](/Users/acehood/Documents/GitHub/oes/docs/plans/designs/browser-prospecting-workspace.md)

## 6. Upstream Dependencies

- `party-service`
  - 提供 `TenantParty`、Person / Organization 主体引用。
  - CRM 不应直接复制主体主数据真相。
- `permission-service`
  - 提供接口权限、资源授权、查询范围和协同可见性判定能力。
- `identity-service`
  - 提供 operator account / tenant / team 相关身份上下文事实，具体组织结构 owner 后续需结合 Tenant & Organization 设计冻结。
- AI platform, future
  - 只通过受控 suggestion / review 流程接入，不直接写 CRM 主数据。

## 7. Downstream / Published Facts

- Prospecting research target 和 timeline。
- Lead draft。
- CRM lead / contact / account / opportunity, once future features freeze them.
- CRM 资源归属、跟进状态、协同可见性所需业务事实。
- 低价值、非目标、竞争对手等 CRM / prospecting 判断，后续如升级为共享标签模型需另行设计。

## 8. Non-goals

- 不作为通用实体主数据服务。
- 不绕过 BFF 直接暴露给浏览器插件。
- 不让 AI 直接写正式 lead、contact、account 或 opportunity。
- 不在第一阶段强行冻结完整 CRM 全模块。
- 不把 `ResearchTarget` 直接等同于正式 CRM account。
- 不把 `ContactClue` 直接等同于正式 CRM contact。
- 不把 `LeadDraft` 直接等同于正式 CRM lead。

## 9. Current Stage

当前阶段只冻结最小职责边界：

- Browser Prospecting 第一阶段后端持久化优先归属 `crm-service` 内部 `prospecting` slice。
- `LeadDraft -> CRM Lead` 映射尚未冻结。
- 正式 CRM lead、account、contact、opportunity 模型尚未冻结。
- 如果后续决定将 Prospecting 独立成服务，必须新增 ADR 说明拆分依据、数据所有权和与 CRM 的契约边界。
