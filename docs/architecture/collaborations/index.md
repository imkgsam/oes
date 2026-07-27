# OES 协同蓝图索引

> 涉及 permission-service 的服务职责、核心对象或 owner 边界时，以 [permission-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/permission-service.md) 为准；本索引只导航跨服务协同蓝图。

## 1. 目的

本目录用于沉淀 OES 的关键跨服务协同蓝图，作为“多个服务围绕某项能力如何配合”的唯一真相源。

这里不承载：

- 单个服务长期职责真相
- feature 执行状态
- API / gRPC / event 字段正文
- 具体实现 checklist

## 2. 使用规则

- 每个关键能力只有一份协同蓝图。
- 协同蓝图回答的是服务之间如何配合，不重复定义单个服务职责卡中的边界。
- 若一个 feature 需要解释多个服务的长期协作方式，应直接引用本目录下对应蓝图。
- 若某项协同规则会被多个 feature 复用，就不应继续留在 feature packet 中。

## 3. 当前协同蓝图

1. [authentication-and-identity.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/collaborations/authentication-and-identity.md)
   - 认证与身份映射协同蓝图
2. [authorization-decision-flow.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/collaborations/authorization-decision-flow.md)
   - 授权判定与查询范围协同蓝图
3. [account-context-switch.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/collaborations/account-context-switch.md)
   - 账号上下文切换协同蓝图
4. [party-identity-and-tenant-org.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/collaborations/party-identity-and-tenant-org.md)
   - 主体、身份与租户/组织协同蓝图
5. [tenant-org-and-identity.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/collaborations/tenant-org-and-identity.md)
   - 租户组织与身份边界协同蓝图
6. [tenant-org-and-hr.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/collaborations/tenant-org-and-hr.md)
   - 租户组织与 HR 任职边界协同蓝图；HR 服务设计以 [hr-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/hr-service.md) 为准
7. [employee-onboarding.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/collaborations/employee-onboarding.md)
   - 员工 onboarding 五服务协同蓝图；HR onboarding owner 边界以 [hr-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/hr-service.md) 为准
8. [sales-crm-party-item-master.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/collaborations/sales-crm-party-item-master.md)
   - Sales 与 CRM、Party、Item Master 的交易引用与快照协同蓝图
9. [item-master-sales-mes-wms-srm.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/collaborations/item-master-sales-mes-wms-srm.md)
   - Item 主数据与销售、采购、制造、仓储、SRM 采用边界协同蓝图
10. [srm-procurement-party-item-master.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/collaborations/srm-procurement-party-item-master.md)

- SRM 最小供应商主档与 Procurement、Party、Item Master 的协同蓝图

11. [procurement-srm-item-wms-finance.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/collaborations/procurement-srm-item-wms-finance.md)

- Procurement phase 1 的 PR/PO、收货预期与 SRM、Item Master、WMS、Finance 的协同蓝图

12. [sales-fulfillment-mes-wms-finance.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/collaborations/sales-fulfillment-mes-wms-finance.md)

- 销售订单 handoff、制造放行、仓储执行与财务边界协同蓝图

13. [sales-finance-order-to-cash.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/collaborations/sales-finance-order-to-cash.md)

- Sales 与 Finance 的 order-to-cash、finance release、应收与标准汇率协同蓝图

14. [object-activity-and-timeline.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/collaborations/object-activity-and-timeline.md)

- 平台级 ObjectActivity 与 ObjectTimeline 协同蓝图

15. [terminal-access-policy.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/collaborations/terminal-access-policy.md)

- 终端准入策略在 `permission-service`、`auth-service` 与 terminal-specific BFF 之间的协同蓝图

16. [managed-terminal-device-management.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/collaborations/managed-terminal-device-management.md)

- 企业受管现场交互终端设备在 PDA BFF、Admin BFF、`terminal-device-service`、`auth-service` 与 `permission-service` 之间的入网、登录、禁用、heartbeat、版本策略与审计协同蓝图

17. [terminal-aware-account-security.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/collaborations/terminal-aware-account-security.md)

- Terminal-aware Account Security Phase 2 在 `auth-service`、`permission-service`、`identity-service`、`terminal-device-service` 与 BFF 之间的登录、MFA、session、trusted device、登录历史与设备状态清退协同蓝图

18. [site-asset-media.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/collaborations/site-asset-media.md)

- Site 与 Asset 在 Site Media 选择、发布期解析、public delivery、publication reference protection、下架与可用性事实上的协同蓝图

19. [delegated-execution-and-action-grant.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/collaborations/delegated-execution-and-action-grant.md)

- AI / Robot 代表 HUMAN 执行时的委托、工具上限、step-up、单次高风险 ActionGrant、审计与消费协同蓝图

## 4. 新服务协同准入规则

新增 `erp-service` 这类服务时：

- 若仅新增服务职责而不改变已有协同方式，可先补服务职责卡
- 若引入新的跨服务协同模式，必须补对应协同蓝图后再进入 feature 设计
- 协同蓝图应只沉淀稳定、可复用的规则，不为单个 feature 写一次性长文
