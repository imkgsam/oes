# OES 服务职责索引

## 1. 目的

本目录用于沉淀 OES 各服务的职责卡，作为“这个服务长期负责什么、不负责什么、拥有哪些核心能力”的唯一真相源。

这里不承载：

- feature 执行状态
- 详细模块实现方案
- 接口字段与错误码正文
- 可复用的跨服务协同流程正文

## 2. 使用规则

- 每个服务只有一份职责文档；该文件就是该服务唯一稳定设计真相源。
- 本索引是所有服务职责真相源的总入口；涉及服务职责、边界、对象命名或服务级契约前，必须先查看本索引。
- 本索引只记录职责卡位置与状态提示，不承载服务职责正文。
- 服务职责文档应保持短小，优先回答边界问题，而不是展开实现细节。
- 同一条服务职责不应同时散落在 feature packet、plan 与 contract 文档中。
- 若一个 feature 需要说明某服务长期负责什么，应直接引用本目录下对应文档。
- 若一个服务职责变化影响项目级边界，应同步回写 `docs/architecture/**` 或 ADR。
- 任何线程发现其他文档重新定义了某服务的核心对象、边界或对象命名时，应把该内容改成对本目录对应文件的引用；不能保留并列设计。
- 新建服务前必须先确定该服务的 `<service-name>.md` 真相源文件名，避免后续出现多个命名相近的设计入口。

## 3. 状态口径

| Status       | 含义                                                                                                          |
| ------------ | ------------------------------------------------------------------------------------------------------------- |
| `OK`         | 已完成唯一真相元整理；服务长期设计只以本目录对应职责卡为准。                                                  |
| `MISSING`    | 服务已实现、已进入主架构讨论，或被多个服务引用，但还没有职责卡。                                              |
| `DUPLICATED` | 已有职责卡或设计草案，但服务设计仍分散在多个文档中，尚未完成唯一真相元整理。                                  |
| `DESIGNING`  | 仍处于 design workspace / future service 讨论阶段，或虽有职责卡但服务设计尚未完全冻结；不能作为稳定服务引用。 |

`OK` 只表示服务设计真相源已唯一化，不表示 runtime、contract 或 UI 已全部实现。

## 4. 当前服务职责索引

| Service                    | Truth Source                                                                                                              | Status      | Note                                                                                                                                                                                                                           |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `auth-service`             | [auth-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/auth-service.md)                         | `OK`        | 认证、认证凭据、challenge、session、token、MFA、OTP、context switch、self-service / admin-management 与认证域审计已收敛到唯一稳定设计入口。                                                                                    |
| `browser-activity-service` | [browser-activity-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/browser-activity-service.md) | `DESIGNING` | 浏览器访问审计策略、已登录插件采集的访问会话汇总、heartbeat、聚合读模型与敏感管理读取审计已冻结边界；runtime 与 contracts 按 P1 推进。                                                                                         |
| `identity-service`         | [identity-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/identity-service.md)                 | `OK`        | User、UserAccount、contact asset、machine principal、employee binding、tenant / org 边界、self-service / admin-management 已收敛到唯一稳定设计入口。                                                                           |
| `permission-service`       | [permission-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/permission-service.md)             | `OK`        | Permission、Role、AccountRole、Policy、access summary、navigation governance、terminal access 与 onboarding grant 已收敛到唯一稳定设计入口；其他文档只保留 contract、ADR、feature 状态或协同引用。                             |
| `terminal-device-service`  | [terminal-device-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/terminal-device-service.md)   | `OK`        | 企业受管现场交互终端设备 registry、enrollment、生命周期、租户绑定、运行快照、版本策略、设备准入决策与设备治理审计已冻结；Phase 2 只正式支持 PDA。                                                                              |
| `party-service`            | [party-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/party-service.md)                       | `OK`        | TenantParty、TenantPartyIdentifier、地址 / 联系人正文、租户主体引用与 owner 边界已收敛到唯一稳定设计入口。                                                                                                                     |
| `tenant-org-service`       | [tenant-org-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/tenant-org-service.md)             | `OK`        | Tenant、OrgUnit、org tree、org hierarchy、org reference validation、onboarding、organizationTenantPartyId 与 owner 边界已收敛到唯一稳定设计入口。                                                                              |
| `hr-service`               | [hr-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/hr-service.md)                             | `OK`        | Employee、Employment、员工生命周期、正式人力任职、onboarding owner 与 party / identity / permission / tenant-org 协同边界已收敛到唯一稳定设计入口；其他文档只保留 contract、feature 状态或协同引用。                           |
| `collaboration-service`    | [collaboration-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/collaboration-service.md)       | `DESIGNING` | 已冻结独立服务边界、`task` module P1 手动待办能力与 `annotation` module P1 CrmAccount 对象备注能力；comment、attachment、team queue、project、business-linked task 等后续协作模块仍在设计中。                                  |
| `crm-service`              | [crm-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/crm-service.md)                           | `OK`        | CRM v2 Phase 1 核心对象模型已冻结；CrmAccount、CrmContact、CrmSourceRecord、Opportunity、CrmActivity 与 TenantParty 绑定规则以该职责卡为准。runtime、contract、Sales handoff、公海、AI 等后续按 feature 单独冻结。             |
| `sales-service`            | [sales-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/sales-service.md)                       | `DESIGNING` | 已有职责卡，但 quote、order、pricing、fulfillment handoff 与 finance 协同设计尚未完全冻结，不能作为稳定服务真相源引用。                                                                                                        |
| `finance-service`          | [finance-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/finance-service.md)                   | `DESIGNING` | 已有职责卡，但 AR、invoice、collection、credit、AP / payment 与 accounting core 边界尚未完全冻结，不能作为稳定服务真相源引用。                                                                                                 |
| `srm-service`              | [srm-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/srm-service.md)                           | `OK`        | SupplierProfile、最小 SupplierOffering、Party / Item Master / Procurement owner 边界与 trusted gRPC contract 已冻结；服务长期边界只以该职责卡为唯一稳定真相源。                                                               |
| `procurement-service`      | [procurement-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/procurement-service.md)           | `OK`        | PR / PO、ReceivingExpectation、discrepancy、SRM / Item Master / WMS owner 边界与 trusted gRPC contract 已冻结；服务长期边界只以该职责卡为唯一稳定真相源。                                                                     |
| `item-master-service`      | [item-master-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/item-master-service.md)           | `OK`        | ItemModel、Item、BOM、Packaging、capability 与 SupplierItemMapping 的唯一稳定设计入口。                                                                                                                                        |
| `wms-service`              | [wms-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/wms-service.md)                           | `OK`        | Warehouse、Location、Receipt、库存 ledger/balance、Item Master/Procurement owner 边界与 trusted gRPC contract 已冻结；服务长期边界只以该职责卡为唯一稳定真相源。                                                               |
| `mes-service`              | [mes-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/mes-service.md)                           | `OK`        | 当前新设计已收敛到唯一架构化入口；旧 design workspace、contract 与 runtime 后续按本文重写对齐。                                                                                                                                |
| `asset-service`            | [asset-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/asset-service.md)                       | `DESIGNING` | 头像、员工正式照片与 Site Media 的受控切片、对象存储 / CDN 交付、发布引用保护与下架边界已冻结；通用附件平台、全域媒体发现与更多业务媒体语义仍待独立设计。                                                                      |
| `public-entry-service`     | [public-entry-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/public-entry-service.md)         | `DESIGNING` | ShortLink 与 BusinessCard 同服务模块边界已冻结；Phase 1 contracts 与 runtime 尚未实现。                                                                                                                                        |
| `site-service`             | [site-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/site-service.md)                         | `OK`        | 自有 / 自控外部站点治理、credential、scope、webhook、public view publishing、publish version、changed resource index、snapshot source、runtime status 与站点审计的唯一稳定设计入口；runtime 与 contracts 后续按 feature 冻结。 |
| `notification-service`     | [notification-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/notification-service.md)       | `DESIGNING` | 服务职责与 Collaboration Task P1 的事件到系统内通知 consumer 已冻结；Auth dispatch、通知中心 API、规则/模板管理与 runtime 仍按独立 feature 推进。                                                                                |

## 5. Future / Designing 服务

| Service               | Truth Source | Status      | Note                                                                                                                                                              |
| --------------------- | ------------ | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `quality-service`     | 待建         | `DESIGNING` | 当前只在 [quality-service-design.md](/Users/acehood/Documents/GitHub/oes/docs/plans/designs/quality-service-design.md) 中讨论，不能作为稳定服务引用。             |
| `after-sales-service` | 待建         | `DESIGNING` | 当前只在 [after-sales-service-design.md](/Users/acehood/Documents/GitHub/oes/docs/plans/designs/after-sales-service-design.md) 中讨论。                           |
| `erp-service`         | 待建         | `DESIGNING` | 当前只在 [erp-service-design.md](/Users/acehood/Documents/GitHub/oes/docs/plans/designs/erp-service-design.md) 中讨论；销售、采购、财务边界已部分回写到独立服务。 |
| `planning-workbench`  | 待定         | `DESIGNING` | 当前只在 [planning-workbench-design.md](/Users/acehood/Documents/GitHub/oes/docs/plans/designs/planning-workbench-design.md) 中讨论，尚未冻结为服务职责卡。       |

## 6. 新服务准入规则

新增 `erp-service` 这类服务时，默认顺序应为：

1. 先判断是否需要更新项目级 architecture 或新增 ADR
2. 再新增本目录中的服务职责文档
3. 再补对应协同蓝图
4. 再补 contracts
5. 最后才进入 `candidates` 或 `feature packet`
