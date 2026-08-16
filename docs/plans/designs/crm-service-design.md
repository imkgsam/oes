# CRM Service Design Workspace

> 稳定服务设计唯一真相源：[crm-service.md](../../architecture/services/crm-service.md)。本文只保留历史设计过程、开放问题与回写记录，不再重新定义 `crm-service` 的核心对象、owner 边界或长期命名。

## 1. Workspace Purpose

本文是 CRM 设计工作台，不是稳定架构文档。

允许记录：

- 设计讨论过程。
- 尚未冻结的开放问题。
- 已确认结论的回写记录。
- 后续可能拆分的 feature 方向。

不允许记录：

- 替代 [crm-service.md](../../architecture/services/crm-service.md) 的服务职责。
- 重新定义 `CustomerAccount / Lead / Opportunity / Activity / Prospecting` 等核心对象。
- 重新定义 CRM 与 Party / Sales / Finance / Permission 的 owner 边界。
- 替代 `docs/contracts/crm-service/**` 描述黑盒契约。
- 替代 feature packet 描述执行状态。

若本文与 [crm-service.md](../../architecture/services/crm-service.md) 冲突，以服务真相源为准。

## 2. Current Stable Write-back

2026-05-22 已将 CRM 长期设计收口到唯一真相源：

- CRM bounded context。
- `Intake / Prospecting / Lead / CustomerAccount / CustomerPartyBinding / CustomerContactUsage / CustomerAddressUsage / CustomerTaxProfile / Opportunity / Activity` 的长期边界。
- CRM 与 `party-service / sales-service / finance-service / permission-service / identity-service / tenant-org-service / HR / communication / AI` 的 owner 边界。
- customer master phase 1 当前实现状态。
- 当前 hardening gaps 与 deferred 清单。

稳定内容见：

- [crm-service.md](../../architecture/services/crm-service.md)

## 3. Historical Decisions

以下历史判断已经回写到服务真相源，本文只保留索引：

| 日期 | 判断 | 当前状态 |
| --- | --- | --- |
| 2026-04-18 | CRM 是核心业务域，不应由插件或 BFF 反向定义正式主模型。 | 已回写 |
| 2026-04-18 | Browser Prospecting 的 `ResearchTarget / ContactClue / LeadDraft` 不能直接等同 formal CRM 对象。 | 已回写 |
| 2026-04-18 | Browser Prospecting 持久化优先归属 `crm-service` 内部 `prospecting` slice。 | 已回写 |
| 2026-04-19 | CRM 应支持多渠道客户进入，不只覆盖浏览器网页开发。 | 已回写 |
| 2026-04-19 | CRM 前置入口分为 `Intake` 与 `Prospecting`。 | 已回写 |
| 2026-04-19 | `Account / CustomerAccount` 是客户关系对象，不等于 `party-service` 主体主数据。 | 已回写 |
| 2026-04-19 | `Import` 是 CRM 入口能力，不是一级核心领域对象。 | 已回写 |
| 2026-04-19 | `Opportunity` 以手动创建为主，并且必须绑定 `CustomerAccount`。 | 已回写 |
| 2026-04-19 | 正式报价归 `sales-service`，CRM 不拥有正式报价真相。 | 已回写 |
| 2026-04-19 | `Email` 可以进入 `Activity` 语义，但 CRM 不拥有原始通信真相。 | 已回写 |
| 2026-04-19 | 每个服务都必须自行承担自己的审计责任。 | 已回写 |
| 2026-04-19 | AI 只做建议、总结、工具辅助，不直接写入 CRM 主数据。 | 已回写 |

## 4. Open Questions

以下问题仍开放。任何结论一旦冻结，必须先回写 [crm-service.md](../../architecture/services/crm-service.md)，再更新 contract / feature packet / implementation plan。

- `Intake` 是否需要细分子类型，或先以 source + triage status 承接。
- `LeadDraft -> Lead` 的正式交接契约。
- `Lead -> CustomerAccount` 的转换命令、审计语义与去重流程。
- `CustomerContactUsage` 与 person party 的绑定时机、治理流程与数据最小形态。
- `CustomerAddressUsage` 与 Party 地址簿正文的引用方式。
- primary contact / primary address 是否强制每个 customer 最多一个 active primary，以及 inactive primary 的处理方式。
- `CustomerTaxProfile` 与 finance `PaymentTerm` / tax truth 的 contract 边界。
- `Opportunity` 阶段枚举是否需要按行业场景进一步定制。
- `Activity` 中 `TASK` 长期内聚在 CRM，还是未来拆到更通用任务能力。
- 批量导入默认进入 `Intake`，还是允许部分高质量来源直接进入 `Lead`。
- CRM resource owner / owner team / collaboration facts 与 permission-service query scope 的最小 contract。

## 5. Suggested Feature Split

后续 feature 应基于服务真相源拆分，不应继续在本文中扩写稳定设计。

推荐顺序：

1. `crm-customer-master-hardening`
2. `crm-party-selector-binding`
3. `crm-customer-tax-and-default-terms`
4. `crm-sales-selector-integration`
5. `crm-intake-foundation`
6. `crm-prospecting-foundation`
7. `crm-lead-management-foundation`
8. `crm-opportunity-foundation`
9. `crm-activity-foundation`

## 6. Recovery Entry

恢复 CRM 设计上下文时，优先阅读：

1. [crm-service.md](../../architecture/services/crm-service.md)
2. [sales-crm-party-item-master.md](../../architecture/collaborations/sales-crm-party-item-master.md)
3. [crm-service contracts](../../contracts/crm-service/README.md)
4. 本工作台的开放问题列表
