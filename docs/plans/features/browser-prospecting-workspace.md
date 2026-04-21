# Browser Prospecting Workspace

## 1. 目标

- 建立 OES Chrome 插件第一阶段销售背调工作区。
- 让销售在浏览器内围绕多个目标 workspace 读取 OES 已有状态、保存研究信息、避免重复开发。
- 第一阶段打通插件到 `api-gateway / BFF` 的黑盒读写链路。
- 第一阶段沉淀 target、timeline、research event 和 lead draft，不直接创建正式 CRM lead。
- 第一阶段保持 AI-ready 数据结构，但不实现 AI 自动化。

## 2. 不做什么

- 不直接实现正式 CRM lead、account、contact、opportunity 模型。
- 不让插件直接调用 CRM、permission、identity 或未来 Prospecting implementation service。
- 不把 `Prospecting Research` 冻结为独立服务。
- 不实现 AI 页面总结、AI 自动标注、AI 多工具编排或 AI 自动落库。
- 不实现邮箱 SMTP 深度验证。
- 不实现自动 ImportYeti 抓取、自动证书联查或外部网站自动采集。
- 不把截图上传作为第一阶段核心优先项。
- 不实现页面复杂共享批注和页面改版后的批注恢复。
- 不做字段级自由权限矩阵。

## 3. 上游依赖

- architecture:
  - [11-gateway-and-bff-architecture.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/11-gateway-and-bff-architecture.md)
  - [15-authorization-layering-and-resource-policy-architecture.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/15-authorization-layering-and-resource-policy-architecture.md)
  - [04-ai-architecture.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/04-ai-architecture.md)
- services:
  - [permission-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/permission-service.md)
  - [crm-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/crm-service.md)
- collaborations:
  - authorization decision flow
  - future CRM lead draft handoff collaboration
  - future AI suggestion review collaboration
- contracts:
  - [auth-bff-extension-connect.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/api-gateway/auth-bff-extension-connect.md)
  - [browser-prospecting-workspace.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/api-gateway/browser-prospecting-workspace.md)
- design workspace:
  - [browser-prospecting-workspace.md](/Users/acehood/Documents/GitHub/oes/docs/plans/designs/browser-prospecting-workspace.md)
  - [crm-service-design.md](/Users/acehood/Documents/GitHub/oes/docs/plans/designs/crm-service-design.md)
- implementation plan:
  - [browser-prospecting-workspace-implementation-plan.md](/Users/acehood/Documents/GitHub/oes/docs/plans/browser-prospecting-workspace-implementation-plan.md)

## 4. 当前结论

- 插件是 OES 浏览器前端入口，不是独立 CRM，也不拥有业务真相。
- 插件代码推荐放在 `app/web/apps/browser-extension`，作为 `app/web` monorepo 下的独立 frontend app。
- 插件必须通过 `api-gateway / BFF` 接入 OES。
- `api-gateway` 应通过内部 gRPC contract 调用 future `crm-service/prospecting`，而不是 HTTP-to-HTTP 转发。
- 当前 `tenant-web` 使用 bearer token 模式；插件第一阶段不应读取或抓取 `tenant-web` localStorage，应通过 `auth-bff` 的显式“连接插件”流程获得扩展端认证材料。
- 插件前端按 Chrome extension runtime 拆分为 background、content、side panel、popup、context menu、commands 和统一 BFF api client。
- Side panel 是第一阶段主工作区；popup 只做可选轻入口。
- Chrome manifest 第一阶段应采用最小权限：优先 `activeTab + scripting` 用户触发采集，不默认申请 `<all_urls>` 常驻注入。
- 用户只感知 `Target Workspace`，不感知 session。
- 系统通过 `Research Timeline / Research Event` 隐式记录研究过程。
- 插件支持多个 target workspace，任意时刻只有一个 active target。
- 所有保存、提取、备注、跳转等输入都必须归属到 target workspace。
- 页面信息展示由后端按权限、team 关系、manager scope 和策略裁剪。
- 第一阶段采用 self / same_team / manager_scope / cross_team / admin_policy 粗粒度关系模型。
- 第一阶段采用 Presence / Ownership / Research Summary / Sensitive Detail 信息包裁剪。
- CRM 未设计前，`Lead Draft` 是 Prospecting 到未来 CRM 的防腐层。
- `Prospecting Research` 当前只是能力边界，不代表立即新建独立服务。
- 第一阶段后端持久化推荐优先落在 future `crm-service` 内部 `prospecting` slice，而不是让 BFF 长期持有业务真相或立即新建独立 `prospecting-service`。
- AI 后置实现，但 Evidence / Fact / Timeline / Suggestion / Decision 边界必须保留。

## 5. 契约真相位置

- 当前 BFF 契约：
  - [browser-prospecting-workspace.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/api-gateway/browser-prospecting-workspace.md)
- 第一阶段冻结接口：
  - `POST /browser-prospecting/context/resolve`
  - `GET /browser-prospecting/targets/:targetId`
  - `POST /browser-prospecting/targets`
  - `POST /browser-prospecting/targets/:targetId/select`
  - `POST /browser-prospecting/targets/:targetId/events`
  - `POST /browser-prospecting/targets/:targetId/lead-drafts`
- 第一阶段已冻结：
  - endpoint prefix: `/browser-prospecting`
  - DTO 必填字段
  - stable error code
  - action code 名称
- 契约仍需实现前确认：
  - downstream implementation owner wiring
  - extension auth grant / redeem DTO、错误语义与 token-model mapping

## 6. 线程分工

| Thread / Owner | 职责 | 允许修改路径 | 输入 | 输出 | 状态 |
| --- | --- | --- | --- | --- | --- |
| design owner | 冻结插件产品边界、BFF contract、前端 runtime 结构和第一阶段 feature packet | `docs/plans/designs/**`, `docs/contracts/api-gateway/**`, `docs/plans/features/**` | 用户设计共识、OES 架构约束 | 当前 feature packet + contract | completed |
| BFF contract owner | 将 contract 草案收敛为实现级 DTO、ViewModel、错误语义和 action 语义 | `docs/contracts/api-gateway/**`, later `src/services/api-gateway/**` | 当前 feature packet + contract 草案 | 可实现 BFF contract | completed |
| backend capability owner | 冻结 future `crm-service` 最小 service card 与 `prospecting` slice，或提出需要独立 `prospecting-service` 的 ADR 理由；实现 BFF 下游能力 | 待实现计划冻结；不得越界改 CRM 正式模型 | contract + feature packet + CRM design workspace | 后端读写能力与测试 | pending |
| extension owner | 在 `app/web/apps/browser-extension` 实现插件 app、runtime 单元、side panel 和基础交互 | `app/web/apps/browser-extension/**`, 必要时 `app/web/packages/**` 中插件明确依赖包 | BFF contract + feature packet | 可加载 Chrome 插件第一阶段体验 | pending |
| review / integration owner | 审核权限裁剪、BFF 边界、插件运行时边界和后置范围未混入 | 只读全局，必要时最小文档修正 | producer / consumer 输出 | 集成验证结论 | pending |

## 7. 当前 slice

- slice:
  - Browser Prospecting Workspace 第一阶段基础链路。
- status:
  - persistence-boundary-frozen-for-first-stage
- scope:
  - 独立 Chrome 插件 app 目录。
  - 多 target workspace 和 active target。
  - BFF resolve 当前页面上下文。
  - 后端裁剪的页面信息卡。
  - side panel 主工作区。
  - 选中文本保存为备注、fact 或 contact clue。
  - 当前页面加入 target。
  - 外部工具带参数跳转并记录 `external_tool_opened`。
  - append research event。
  - create lead draft。
- ready definition:
  - BFF contract 字段和错误语义冻结。
  - 第一阶段 durable prospecting facts 归属已冻结为 future `crm-service` 的 `prospecting` slice；若改为独立服务必须新增 ADR。
  - CRM service card 最小职责版本已冻结。
  - extension auth bridge owner 已冻结为 `auth-bff`，并有独立 black-box contract。
  - 插件 app 构建方式和 Chrome manifest 权限冻结。
  - 第一阶段不依赖 CRM 正式模型。

## 8. 主线范围

- 本 feature 主线：
  - 建立插件第一阶段 OES 读、显、写闭环。
  - 建立 target workspace 和 timeline 体验。
  - 建立 BFF contract 与后端裁剪展示模型。
  - 建立第一阶段插件 app runtime 架构。
- 本 feature 不做：
  - 正式 CRM 服务设计。
  - AI 自动化。
  - 外部站点自动抓取。
  - 邮箱深度验证。
  - 截图核心链路。
  - 复杂页面批注。
  - 精细字段级权限矩阵。
- 偏移返回条件：
  - 如果实现需要冻结正式 CRM lead/contact/account 模型，暂停并进入 CRM 架构设计。
  - 如果实现需要新建独立 Prospecting 服务，暂停并新增 architecture / ADR。
  - 如果实现需要修改权限、tenant、operator context 或 AI 工具协议语义，暂停并回写 architecture / ADR。
  - 如果插件需要绕过 BFF 直接调用业务服务，暂停并回到 contract。

## 9. 阻塞 / 依赖

- CRM 服务尚未设计，`Lead Draft -> CRM Lead` 不能冻结为正式契约。
- 第一阶段 durable prospecting facts 已冻结为 future `crm-service` 内部 `prospecting` slice；实现时仍需确认具体 service skeleton 与 downstream wiring。
- BFF contract endpoint prefix、DTO、action code 和 stable error code 已冻结；实现前仍需确认 downstream wiring。
- 插件登录态采用 `auth-bff` 显式 web-to-extension connection grant；实现前仍需冻结 grant / redeem DTO、错误语义和 token-model mapping。
- 第一阶段 server-side 是否需要额外持久化 operator workspace continuity state 尚未冻结；该状态不能混入 prospecting durable business tables。

## 10. 派生问题 Ledger

| 时间 | 问题 | 分类 | 当前影响 | 处理策略 | 目标落点 | 状态 |
| --- | --- | --- | --- | --- | --- | --- |
| 2026-04-18 | CRM 服务尚未设计 | Blocker-Later | 影响正式 Lead / Contact / Account 模型和 Lead Draft 交接 | 第一阶段只做 Lead Draft 防腐层，不创建正式 CRM lead | future CRM design / ADR | open |
| 2026-04-18 | Prospecting Research 是否独立成服务 | Blocker-Later | 影响后端实现归属和数据库归属 | 当前推荐优先归入 future `crm-service` 内部 `prospecting` slice；如需独立服务必须升级 architecture / ADR | CRM design / architecture / ADR | open |
| 2026-04-18 | CRM service card 最小版本 | Blocker-Now | 没有最小服务职责，后端实现容易把业务真相落进 BFF | 已新增最小职责卡，后续实现计划以该职责卡为上游约束 | `docs/architecture/services/crm-service.md` | closed |
| 2026-04-18 | 第一阶段 implementation plan | Blocker-Now | 没有执行计划会导致后端、BFF、插件线程边界不清 | 已新增 implementation plan，并按 contract / crm prospecting / BFF / auth bridge / extension / integration review 切片 | `docs/plans/browser-prospecting-workspace-implementation-plan.md` | closed |
| 2026-04-18 | BFF contract freeze | Blocker-Now | 没有 endpoint、DTO、action 和错误语义，后端和插件无法并行实现 | 已冻结第一阶段 BFF contract；后续实现必须以 contract 为准 | `docs/contracts/api-gateway/browser-prospecting-workspace.md` | closed |
| 2026-04-18 | 插件登录态和会话复用 | Blocker-Now | 没有认证方案就无法调用 BFF | 已冻结 owner 为 `auth-bff`，后续继续冻结 grant / redeem DTO、错误语义和 token-model mapping | current feature contract / implementation plan | open |
| 2026-04-18 | Chrome manifest 权限范围 | Blocker-Now | 权限过宽影响安全，过窄影响页面识别和右键菜单 | 已冻结第一阶段最小 permissions / host_permissions 策略，后续实现不得越界扩大 | extension implementation plan | closed |
| 2026-04-18 | 插件连接授权流程归属 | Blocker-Now | 显式 connection grant 需要 BFF owner；不能让插件抓取 tenant-web token | 已冻结为 `auth-bff`，并新增独立 auth-bff extension-connect 契约 | `docs/contracts/api-gateway/auth-bff-extension-connect.md` | closed |
| 2026-04-18 | `SelectResearchTarget` 持久化边界 | Blocker-Now | 若把 active target 选择写进 prospecting timeline，会污染 CRM durable truth | 已冻结为 workspace continuity 状态，不进入 durable prospecting business tables | CRM design / implementation plan | closed |
| 2026-04-18 | 邮箱验证能力 | Sidecar | 有价值但不阻塞第一阶段沉淀链路 | 后置为 email verification capability 设计 | future design workspace / backlog | open |
| 2026-04-18 | AI-assisted prospecting | Sidecar | 数据结构需预留，但实现不进入第一阶段 | 保留 Suggestion / Decision / Evidence 边界，后续独立 feature | future feature packet | open |
| 2026-04-18 | 页面共享批注 | Sidecar | 实现复杂且不是第一阶段效率主链路 | 第一阶段只保存选中文本和备注 | backlog | open |

## 11. 验收标准

- 插件作为独立 app 放在 `app/web/apps/browser-extension` 的设计已冻结。
- 插件第一阶段 runtime 边界明确：background、content、side panel、popup、context menu、commands、api client。
- 插件认证不通过 content script 抓取 tenant-web localStorage；必须有显式连接或授权流程。
- Chrome manifest 第一阶段使用最小权限集合，不默认申请 `<all_urls>` 常驻注入。
- 插件能通过 BFF resolve 当前页面上下文，并展示后端裁剪后的页面信息卡。
- 插件 side panel 能展示 active target、recent targets、OES 可见摘要、当前页 capture 和 timeline。
- 插件支持多个 target workspace，并且任意时刻只有一个 active target。
- 当前页、选中文本、基础实体保存前必须归属 target。
- 插件能追加 `page_attached`、`note_added`、`fact_extracted`、`contact_clue_added`、`external_tool_opened`、`target_status_marked`、`target_relation_added` 事件。
- 插件可以创建 `Lead Draft`，但不会创建正式 CRM lead。
- 页面信息展示由 BFF 返回的 visibility packs 和 actions 控制，前端不自行判断权限真相。
- 第一阶段不包含 AI 自动化、邮箱深度验证、外部自动抓取、截图核心链路和复杂批注。

## 12. 关闭条件

- 设计工作台已记录当前设计过程和开放问题。
- BFF contract 已从草案进入可实现级字段、错误码和 action 语义。
- 第一阶段实现归属已明确，不把业务真相长期留在 BFF；若落 future `crm-service`，最小 service card 已回写。
- 插件 implementation plan 已基于当前 feature packet 产出。
- 后端、插件和 review 线程可按本 packet 分工推进。
- 所有后置项已记录在派生问题 ledger 或 backlog，不混入第一阶段主线。

## 13. 备注

- 本 feature 从 `docs/plans/designs/browser-prospecting-workspace.md` 收口而来。
- 当前稳定消费契约草案在 `docs/contracts/api-gateway/browser-prospecting-workspace.md`。
- 设计工作台继续保留开放问题和未来回写计划；实现推进应以本 feature packet、BFF contract 和后续 implementation plan 为准。
