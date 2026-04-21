# Browser Prospecting Workspace Design

## 1. 目标

- 建立 Chrome 插件作为 OES 浏览器销售背调入口的设计工作台。
- 冻结第一阶段“读取 OES 状态、展示可见摘要、围绕目标持久化研究信息”的核心边界。
- 明确插件必须通过 `api-gateway / BFF` 接入 OES，不能直接调用未来 CRM 或其他业务服务。
- 在 CRM 服务尚未设计前，先定义 `Prospecting Research` 能力边界，避免插件反向污染未来 CRM 主模型。
- 第一阶段不实现 AI 自动化，但数据结构和事件模型必须 AI-ready，避免后续推翻重做。

## 2. 当前范围

本 workspace 负责：

- Chrome 插件的产品边界与第一阶段交互主线。
- `Target Workspace`、`Research Timeline`、`Research Event`、`Lead Draft` 的概念边界。
- 多目标 workspace 的切换、归属和轻关系规则。
- 插件读取 OES 既有状态、展示页面信息卡与 side panel 的最小模型。
- 插件写回 OES 时的持久化事件模型。
- 粗粒度协同可见性策略。
- AI-ready 预留边界。
- CRM 未设计前的防腐边界。

本 workspace 不负责：

- 直接实现 Chrome 插件代码。
- 直接新增 `prospecting-service`、`crm-service` 或其他服务。
- 冻结 CRM 的正式 lead、account、contact、opportunity 模型。
- 冻结 Prospecting Research 最终服务归属。
- 设计完整 AI agent、AI 自动标注、AI 多工具编排或自动落库能力。
- 设计完整字段级权限矩阵。
- 设计外部网站抓取、反爬处理或自动化采集策略。

## 3. 涉及对象

- services:
  - `api-gateway`
  - future `crm-service`
  - future Prospecting Research implementation owner, not yet frozen
  - `permission-service`
  - `identity-service`
- features:
  - browser prospecting workspace
  - sales research capture
  - lead draft handoff
  - future CRM lead intake
  - future AI-assisted prospecting
- collaborations:
  - Gateway / BFF external client access
  - authorization decision flow
  - future CRM collaboration
  - future AI tool and suggestion collaboration

## 4. 推荐代码目录

插件应放在 `app/web` 前端 monorepo 下，作为独立 frontend app，而不是放入后端 `src/services`，也不应直接塞进 `app/web/apps/tenant-web` 内部。

推荐目录：

```text
app/web/apps/browser-extension
```

推荐原因：

- Chrome 插件是 OES 的浏览器前端入口，生命周期、构建产物、manifest 权限和发布方式都不同于 `tenant-web`。
- 插件需要复用前端 workspace 的 TypeScript、lint、构建和共享包能力，因此应留在 `app/web`。
- 插件不应成为 `tenant-web` 的页面子模块，否则会把普通租户 Web App 的路由、运行时和浏览器扩展运行时混在一起。
- 插件可以复用 `app/web/packages/*` 中适合复用的 request、types、utils、constants，但不能通过复用前端包绕过 BFF 或权限边界。
- 后续如果有插件专用共享能力，可以在 `app/web/packages/browser-extension-*` 或更明确的 package 中沉淀，但第一阶段不应提前抽象。

候选结构：

```text
app/web/apps/browser-extension
├── package.json
├── vite.config.ts
├── tsconfig.json
├── manifest.config.ts
├── public
├── src
│   ├── background
│   ├── content
│   ├── side-panel
│   ├── popup
│   ├── context-menu
│   ├── commands
│   ├── api
│   ├── domain
│   └── shared
└── README.md
```

目录职责建议：

- `background`: Chrome extension background service worker，负责生命周期、context menu、commands、tab 消息和轻量状态协调。
- `content`: 注入页面的 content scripts，只做轻量识别、页面标记和用户动作桥接，不能承载重业务逻辑。
- `side-panel`: 插件主工作区，承载 target workspace、OES 摘要、timeline 和输入动作。
- `popup`: 可选轻入口，不作为主工作区。
- `context-menu`: 右键菜单动作注册和选中文本入口。
- `commands`: 快捷键动作映射。
- `api`: 调用 `api-gateway / BFF` 的插件专用客户端。
- `domain`: 插件本地 target workspace、research event draft、visibility view 等前端模型。
- `shared`: 插件内部共享工具，不承载跨 OES 的业务真相。

不推荐目录：

- `src/services/**`
  - 这里是后端服务区域，Chrome 插件不属于后端服务。
- `app/web/apps/tenant-web/src/**`
  - 插件不是 tenant-web 的一个页面，不能把 extension runtime 混入普通 Web App。
- `app/external/**`
  - 当前语义更像外部应用占位，不如 `app/web/apps/*` 能复用前端 monorepo 体系。

### 4.1 插件前端运行时边界

Chrome 插件前端应按 extension runtime 拆分，而不是按普通 Web 页面拆分。

第一阶段推荐运行时单元：

- `background service worker`
  - 注册 context menu。
  - 注册 commands 快捷键。
  - 监听 tab / message 事件。
  - 维护轻量 workspace runtime cache。
  - 协调 content script、side panel 和 BFF client。
- `content script`
  - 注入到普通网页。
  - 读取当前页面 URL、title、domain、选中文本和轻量实体候选。
  - 渲染页面内轻提示或高亮入口。
  - 将用户在页面上的动作转发给 background 或 side panel。
  - 不直接持久化 OES 数据，不直接做权限判断，不执行重分析。
- `side panel`
  - 第一阶段主工作区。
  - 展示 active target、OES 可见摘要、当前页 capture、timeline 和快捷输入。
  - 触发 BFF 读取和写入动作。
  - 承担复杂交互，不把复杂表单塞进 content script。
- `popup`
  - 可选轻入口。
  - 只做打开 side panel、显示 active target、快速触发常用动作。
  - 不作为第一阶段主工作区。
- `context menu`
  - 承接选中文本保存、识别为邮箱、识别为联系人线索、加入当前 target 等高频动作。
- `commands`
  - 承接快捷键动作，例如打开 side panel、保存当前页、保存选中文本、切换 target。
- `api client`
  - 只调用 `api-gateway / BFF`。
  - 不直接调用 CRM、permission、identity 或未来 Prospecting implementation service。

### 4.2 本地状态模型

插件本地可以维护浏览器体验状态，但不能把本地状态当成 OES 业务真相。

建议本地状态包括：

- `activeTargetId`
- `recentTargets[]`
- `tabTargetHints`
  - tab 到 target 的临时提示关系。
- `pendingPageCapture`
  - 当前页面尚未保存的 URL、title、domain、选中文本和实体候选。
- `sidePanelOpenState`
- `lastResolveResult`
  - 最近一次 BFF resolve 返回的可见摘要缓存。

本地状态规则：

- 所有长期研究数据以 OES 后端为准。
- 本地 `activeTargetId` 只是当前浏览器工作上下文。
- tab id 只能作为插件本地 runtime hint，不得写成业务标识。
- 如果本地状态和 BFF 返回冲突，以 BFF 返回为准。
- 写入成功后，side panel 应以 BFF 返回的 timeline item 或 target detail 刷新展示。

### 4.3 组件通信方向

第一阶段推荐通信方向：

```text
content script -> background -> side panel
side panel -> background -> BFF api client
context menu -> background -> side panel / BFF api client
commands -> background -> side panel / active target action
background -> content script
```

规则：

- content script 不应直接持有复杂业务状态。
- background 可以协调消息和轻量缓存，但不应成为业务规则层。
- side panel 是复杂交互和确认动作的主入口。
- BFF api client 必须统一封装，避免各 runtime 单元散落调用 HTTP。
- 页面内浮层只展示轻量提示；需要更多信息时打开 side panel。

### 4.4 第一阶段关键交互流

#### 打开页面并解析 OES 状态

1. content script 收集 URL、domain、title 和轻量候选。
2. background 合并 active target hint。
3. side panel 或 background 调用 `POST /browser-prospecting/context/resolve`。
4. BFF 返回已裁剪 page card view。
5. content script 渲染轻提示，side panel 渲染详情。

#### 将当前页面加入目标

1. 用户在页面浮层、context menu 或 side panel 触发加入动作。
2. 如果没有 active target，side panel 引导用户选择或创建 target。
3. side panel 调用 `POST /browser-prospecting/targets/:targetId/events`，事件类型为 `page_attached`。
4. BFF 返回 timeline item。
5. side panel 追加展示，background 更新 recent target cache。

#### 保存选中文本为备注或线索

1. content script 获取 selection。
2. context menu 或快捷键触发保存。
3. side panel 确认保存类型：
   - note
   - fact
   - contact clue
4. side panel 调用 append event。
5. BFF 返回已持久化事件摘要。

#### 从页面发现新目标

1. content script 或 side panel 识别到与 active target 不一致的公司候选。
2. 页面轻提示或 side panel 提供选择：
   - 继续当前 target。
   - 新建 target。
   - 暂不处理。
3. 用户选择新建 target 后，side panel 调用 `POST /browser-prospecting/targets`。
4. 如来源于当前 target，应写入 relationship，例如 `discovered_from` 或 `peer_company`。

#### 外部工具跳转

1. 用户从 side panel 或 command palette 选择工具。
2. 插件基于 active target 生成搜索 URL。
3. background 打开新 tab。
4. 插件追加 `external_tool_opened` research event。
5. 新 tab 加载后可通过 resolve 提示是否加入当前 target。

### 4.5 性能与体验约束

- content script 默认只做轻扫描，不做全页重解析。
- 只有用户触发或打开 side panel 时才执行较重的 resolve。
- 页面浮层默认保持低干扰，不阻挡页面主体操作。
- BFF resolve 结果应有短时缓存，避免同一 tab 高频请求。
- 外部工具跳转第一阶段只打开页面和记录事件，不自动抓取结果。
- AI、邮箱深度验证、截图上传和页面批注恢复后置，不进入第一阶段运行时主链路。

### 4.6 插件认证边界

当前 `tenant-web` 使用 bearer access token / refresh token，并通过前端持久化 store 保存 token。

插件第一阶段不应通过 content script、injected script 或 localStorage 扫描方式读取 `tenant-web` token。

推荐方向：

- 用户先在 `tenant-web` 完成登录。
- 用户在 OES 可信页面显式触发“连接浏览器插件”。
- BFF 生成短时、一次性 extension connection grant。
- 插件通过受控消息或用户确认流程拿到 grant。
- 插件向 BFF 兑换扩展端可用认证材料。
- 扩展端认证材料存放在 Chrome extension 自身受控 storage 中。

该连接流程的 owner 仍未冻结，可选归属包括：

- 第一阶段已冻结为 `auth-bff`。
- `browser-prospecting` BFF 不承接 grant / redeem。
- 如未来要演化为共享 extension-auth capability，应以 `auth-bff` contract 为迁移起点，而不是把认证桥接下沉到业务 BFF。

禁止方向：

- content script 直接读取 `tenant-web` localStorage。
- 插件从页面 DOM 或 injected script 抽取 access / refresh token。
- 插件让用户手工复制 token。
- 插件信任客户端提交的 `tenantId`、`orgId`、operator identity。

### 4.7 Chrome Manifest 权限边界

第一阶段推荐最小权限策略：

- `storage`
  - 保存 extension 本地 active target、recent targets、短期缓存和扩展端认证材料。
- `sidePanel`
  - 提供主工作区。
- `contextMenus`
  - 支持选中文本右键保存。
- `activeTab`
  - 在用户触发动作后读取当前页面上下文。
- `scripting`
  - 在用户触发后向当前 tab 注入轻量采集脚本。

第一阶段不默认申请：

- `<all_urls>` 常驻 host permissions。
- 全站自动 content script 注入。
- `tabs` 宽权限，除非实现证明 `activeTab` 无法覆盖必要场景。
- `webRequest` / `declarativeNetRequest`。
- cookies 权限。

允许的 host permissions 应优先限制为：

- OES Web / Gateway origin。
- 明确的开发环境 origin。

如果未来需要“打开任意页面自动显示 OES 状态”，再单独评估是否申请更广 host permissions，并配套：

- 用户可见的权限说明。
- 性能预算。
- 站点排除列表。
- 组织策略开关。
- 安全审查。

## 5. 已冻结决定

| 日期 | 决定 | 影响范围 | 回写目标 |
| --- | --- | --- | --- |
| 2026-04-18 | Chrome 插件是 OES 的浏览器前端入口，不是独立 CRM，也不拥有业务真相。 | product boundary / frontend boundary | feature packet + gateway contract |
| 2026-04-18 | 插件必须通过 `api-gateway / BFF` 调用 OES，不能直接调用 CRM 或其他业务服务。 | integration boundary | gateway architecture + contracts |
| 2026-04-18 | 第一阶段优先设计和实现 OES 读取、可见摘要展示、输入持久化与目标归属，不以 AI 为主链路。 | phase scope | feature packet |
| 2026-04-18 | 第一阶段不实现 AI 自动化，但必须设计 AI-ready 的 Evidence / Fact / Timeline / Suggestion 预留边界。 | data model / future AI | AI architecture + feature packet |
| 2026-04-18 | 用户只感知 `Target Workspace`，不感知 session；系统通过 `Research Timeline / Research Event` 隐式记录过程。 | product model / persistence model | feature packet + contracts |
| 2026-04-18 | 插件支持多个目标 workspace，并且任意时刻只有一个 active target。 | browser workflow | feature packet |
| 2026-04-18 | 所有保存、提取、备注、跳转等输入都必须明确归属到某个 target workspace。 | data integrity | feature packet |
| 2026-04-18 | 页面信息展示由后端按权限和组织关系裁剪，插件不做权限真相判断。 | authorization boundary | gateway contract + permission collaboration |
| 2026-04-18 | 协同可见性第一阶段采用 self / same_team / manager_scope / cross_team / admin_policy 的粗粒度关系模型。 | visibility model | feature packet + authorization design |
| 2026-04-18 | 可见性先按 Presence / Ownership / Research Summary / Sensitive Detail 信息包裁剪，不做字段级自由权限矩阵。 | visibility model | feature packet |
| 2026-04-18 | CRM 服务未设计前，不将插件研究数据直接定义成 CRM lead/contact/account 主模型。 | CRM boundary | future CRM design / ADR if needed |
| 2026-04-18 | `Prospecting Research` 先作为能力边界定义，不代表当前必须新建独立服务。 | service boundary | future architecture / ADR |
| 2026-04-18 | `Lead Draft` 是 Prospecting Research 到未来 CRM 的防腐层，不能由插件直接拼接正式 CRM 字段。 | CRM handoff | future CRM contract |
| 2026-04-18 | 插件推荐作为独立前端 app 放在 `app/web/apps/browser-extension`，不放入 `tenant-web` 内部或后端 `src/services`。 | repo structure / frontend build boundary | feature packet |
| 2026-04-18 | 第一阶段 BFF 契约已在 `docs/contracts/api-gateway/browser-prospecting-workspace.md` 冻结 endpoint prefix、必填字段、action identifiers 与 stable error semantics。 | BFF contract / frontend integration | contract + feature packet |
| 2026-04-18 | 插件前端按 extension runtime 拆分为 background、content、side panel、popup、context menu、commands 和统一 BFF api client；side panel 是主工作区。 | frontend runtime / implementation boundary | feature packet |
| 2026-04-18 | 第一阶段 feature packet 已建立在 `docs/plans/features/browser-prospecting-workspace.md`，后续实现准备以该 packet 和 BFF contract 为主线。 | feature coordination | feature packet |
| 2026-04-18 | 插件认证不通过读取 `tenant-web` localStorage 复用 token；第一阶段显式 extension connection grant 流程归属 `auth-bff`，并通过独立 auth-bff black-box contract 暴露。 | auth boundary / extension security | auth-bff contract + implementation plan |
| 2026-04-18 | Chrome manifest 第一阶段采用最小权限策略，优先 `activeTab + scripting` 用户触发采集，不默认申请 `<all_urls>` 常驻注入。 | extension security / runtime boundary | implementation plan |
| 2026-04-18 | 后端持久化推荐优先落在 future `crm-service` 内部 `prospecting` slice；BFF 不长期持有业务真相，独立 `prospecting-service` 需要 ADR 支撑。 | backend ownership recommendation | CRM design + architecture / ADR |
| 2026-04-18 | `SelectResearchTarget` 只服务浏览器 workspace 连续性，不应写入 durable research timeline；如后续需要跨设备记忆，应单独设计 operator workspace state。 | workspace continuity / persistence boundary | CRM design + implementation plan |
| 2026-04-18 | `api-gateway` 到 future `crm-service/prospecting` 的同步协作应走内部 gRPC contract；browser-prospecting BFF 不应通过 HTTP-to-HTTP 调下游业务真相。 | service collaboration / transport boundary | implementation plan + future contracts |
| 2026-04-18 | 第一阶段 implementation plan 已建立在 `docs/plans/browser-prospecting-workspace-implementation-plan.md`，按 contract、CRM prospecting、BFF、auth bridge、extension、integration review 切片。 | implementation planning | implementation plan |

## 6. 产品概念

### 6.1 Browser Prospecting Workspace

`Browser Prospecting Workspace` 是 OES 面向销售背调场景的浏览器工作入口。

第一阶段重点不是替代 CRM，而是解决销售在浏览器中研究客户时的核心痛点：

- 在当前网页读取 OES 是否已有相关主体、负责人、研究记录或无价值标记。
- 把当前看到的信息快速保存到 OES。
- 避免多个销售重复开发同一个目标。
- 围绕一个或多个研究目标持续沉淀页面、备注、事实、联系人线索和状态判断。
- 信息成熟后生成 `Lead Draft`，等待未来 CRM 正式接收。

### 6.2 Target Workspace

`Target Workspace` 是用户可感知的目标工作区。

它回答：

- 我现在正在研究哪个目标？
- 当前页面保存到哪里？
- 我是否要继续当前目标，还是切换到新目标？

一个 target 可以是：

- 公司候选。
- 已存在客户或 lead。
- 待判断组织。
- 联系人背后的公司主体。
- 从当前目标发现的同行、渠道商、关联公司或潜在客户。

插件可以同时维护多个 target workspace，但任意时刻只有一个 `active target`。

### 6.3 Research Timeline

`Research Timeline` 是用户看到的目标历史沉淀。

用户不需要创建或选择 session。系统按时间隐式记录：

- 保存过哪些页面。
- 选中过哪些文本。
- 添加过哪些备注。
- 提取过哪些邮箱、电话、地址、联系人线索。
- 打开过哪些外部研究工具。
- 做过哪些状态判断。
- 是否生成过 lead draft。

### 6.4 Research Event

`Research Event` 是系统内部的追加式事实记录。

每次用户动作都追加事件，而不是覆盖一条大记录。典型事件包括：

- `target_created`
- `target_selected`
- `target_relation_added`
- `page_attached`
- `note_added`
- `fact_extracted`
- `contact_clue_added`
- `external_tool_opened`
- `target_status_marked`
- `lead_draft_created`

### 6.5 Lead Draft

`Lead Draft` 是从目标工作区整理出的 CRM 候选草稿。

它不是正式 CRM lead。它用于在 CRM 服务尚未设计或正式接收前，承载：

- 目标主体候选信息。
- 来源链。
- 关键证据引用。
- 联系人线索。
- 人工备注和研究摘要。
- 价值判断或不开发原因。

未来 CRM 服务设计完成后，应通过明确应用服务或契约完成：

`Lead Draft -> CRM Lead`

## 7. 多目标 Workspace 规则

- 插件允许多个 target workspace 并行存在。
- 任意时刻只有一个 active target，默认保存动作归属 active target。
- 用户可以从当前页面创建新 target workspace。
- 用户可以把当前页面加入当前 target，也可以新建 target。
- 如果插件识别到当前页面主体和 active target 明显不一致，应轻提示用户选择：
  - 继续归入当前 target。
  - 新建 target。
  - 暂不保存。
- 目标之间可以记录轻关系：
  - `related_company`
  - `peer_company`
  - `channel_partner`
  - `competitor`
  - `discovered_from`
  - `unknown`
- 同时活跃的 target 数量应有软限制；长期未操作的 target 可折叠到最近列表。
- 未命名 target 不应长期存在；保存到 OES 前至少需要目标名或域名。

## 8. 第一阶段 OES 对接边界

### 8.1 接入方向

第一阶段接入方向固定为：

```text
Chrome Plugin -> API Gateway / BFF -> OES backend capability
```

插件不直接访问：

- future `crm-service`
- `permission-service`
- `identity-service`
- 任何业务服务数据库

### 8.2 Prospecting Research 能力边界

`Prospecting Research` 当前只是能力边界，不是服务创建决定。

它负责定义：

- target workspace 的后端表示。
- research timeline 和 research event 的持久化语义。
- 页面证据、事实、备注、联系人线索和状态判断。
- lead draft 到未来 CRM 的防腐交接。
- 未来 AI suggestion 的数据落点和审计边界。

它不负责：

- 正式 CRM lead 真相。
- 正式 customer/account/contact/opportunity 真相。
- 销售漏斗、报价、订单或成交历史真相。
- AI 模型调用和 agent 编排真相。
- 权限判定真相。

### 8.3 服务归属暂不冻结

未来可选归属包括：

- 作为 future `crm-service` 内部 `prospecting` 模块。
- 作为独立 `prospecting-service`。
- 第一阶段以 BFF 契约先行，后端实现归属在 CRM 架构设计时再冻结。

当前决策：

- 先冻结能力模型和 BFF 契约方向。
- 不立即决定新建服务。
- 不让 BFF 长期拥有业务真相。
- 当前推荐优先进入 future `crm-service` 内部 `prospecting` slice，除非后续 ADR 证明独立 `prospecting-service` 更合理。
- 若未来服务拆分、CRM 模型或跨域契约影响面较大，应升级 architecture / ADR。

## 9. 读取接口方向草案

> 这里不是最终 contract 正文；冻结后应迁入 `docs/contracts/api-gateway/**`。

### 9.1 Resolve Current Context

目的：

- 插件打开页面时，向 OES 解析当前页面是否匹配已有主体、研究目标或状态标记。
- 后端按当前用户权限、team 关系和配置策略返回已裁剪展示模型。

候选请求字段：

- `url`
- `domain`
- `pageTitle`
- `selectedText`
- `companyNameCandidates[]`
- `emailCandidates[]`
- `phoneCandidates[]`
- `activeTargetId`
- `browserContext`
  - `tabId` 仅限插件本地上下文，不应作为后端业务标识
  - `referrerUrl`
  - `sourceType`

候选响应字段：

- `matchedEntities[]`
  - `entityId`
  - `entityType`
  - `displayName`
  - `matchReason`
  - `confidence`
- `targetSuggestions[]`
  - `targetId`
  - `displayName`
  - `relationshipToActiveTarget`
  - `suggestedAction`
- `visibility`
  - `relationship`
  - `packs[]`
- `statusBadges[]`
- `ownershipHint`
- `researchSummary`
- `counts`
  - `notes`
  - `facts`
  - `contactClues`
  - `evidence`
- `actions[]`
- `maskedFields[]`

### 9.2 Target Detail For Plugin

目的：

- 打开 side panel 或切换 target 时，获取当前用户可见的目标详情。

候选响应内容：

- target 摘要。
- 可见归属信息。
- 当前状态。
- 可见研究摘要。
- 最近 timeline events。
- 当前用户可执行动作。
- 可见的相关 target。

## 10. 写入接口方向草案

> 这里不是最终 contract 正文；冻结后应迁入 `docs/contracts/api-gateway/**`。

### 10.1 Create Or Select Target

目的：

- 从当前页面或手工输入创建 target workspace。
- 或将当前插件 active target 绑定到 OES 已存在 target。

候选请求字段：

- `displayName`
- `domain`
- `sourceUrl`
- `sourceTitle`
- `initialType`
- `relatedTargetId`
- `relationshipToRelatedTarget`

### 10.2 Append Research Event

目的：

- 统一向目标追加研究事件，避免多个零散写入路径。

候选请求字段：

- `targetId`
- `eventType`
- `source`
  - `manual`
  - `page_extract`
  - `tool_jump`
  - `tool_result`
  - `ai_suggestion`
- `sourceUrl`
- `sourceTitle`
- `capturedText`
- `structuredPayload`
- `evidenceRefs[]`
- `visibilityScope`
- `clientContext`

候选事件类型：

- `page_attached`
- `note_added`
- `fact_extracted`
- `contact_clue_added`
- `external_tool_opened`
- `target_status_marked`
- `target_relation_added`
- `lead_draft_created`

### 10.3 Create Lead Draft

目的：

- 从 target workspace 创建 CRM 候选草稿，而不是直接创建正式 CRM lead。

候选输入：

- `targetId`
- `selectedFactIds[]`
- `selectedContactClueIds[]`
- `selectedEvidenceIds[]`
- `summary`
- `qualificationStatus`
- `qualificationReason`

候选输出：

- `leadDraftId`
- `targetId`
- `status`
- `nextActions[]`

## 11. 页面信息卡

页面信息卡只承载轻量提醒和快捷入口，避免打断浏览。

建议显示：

- 当前页面是否匹配 OES 既有主体。
- 是否已有负责人或 team。
- 是否已有研究记录。
- 是否低价值、非目标、竞争对手或已关闭。
- 是否已有验证邮箱、联系人线索或证据数量。
- 当前页面是否已归入 active target。
- 可执行动作：
  - 加入当前 target。
  - 新建 target。
  - 切换 target。
  - 保存选中文本。
  - 打开 side panel。

页面信息卡不直接展示：

- 大段备注正文。
- 完整联系人详情。
- 截图内容。
- 报价、成交、深度跟进等敏感信息。

## 12. Side Panel

Side panel 是第一阶段主工作区。

建议结构：

- `Target Switcher`
  - active target。
  - 最近 target 列表。
  - 新建 target。
  - target 关系提示。
- `Target Summary`
  - target 名称。
  - 类型候选。
  - 状态。
  - 归属提示。
- `OES Match View`
  - 后端裁剪后的可见摘要。
  - 状态标签。
  - 可执行动作。
- `Current Page Capture`
  - 当前 URL。
  - 页面标题。
  - 域名。
  - 基础实体候选。
- `Quick Input`
  - 保存选中文本为备注。
  - 保存选中文本为联系人线索。
  - 保存邮箱、电话、地址等基础事实。
  - 外部工具带参数跳转。
- `Timeline`
  - 按时间展示 research events。
  - 支持按事件类型折叠。
- `Exit Actions`
  - 生成 lead draft。
  - 标记继续研究。
  - 标记低价值 / 非目标。
  - 关闭 target。

## 13. 第一阶段工具范围

第一阶段纳入：

- 当前页面加入 active target。
- 从当前页面新建 target。
- 多 target 切换。
- 选中文本保存为备注或线索。
- 基础实体提取：
  - 公司名候选。
  - 邮箱。
  - 电话。
  - 地址。
  - URL / domain / page title。
- 外部工具带参数跳转：
  - Google search。
  - LinkedIn search。
  - ImportYeti search。
  - certificate site search。
  - map / address search。
- 页面存在性提示。
- OES 可见摘要展示。
- lead draft 生成入口。

第一阶段后置：

- AI 页面总结。
- AI 自动标注。
- AI 多工具编排。
- 邮箱 SMTP 深度验证。
- 自动 ImportYeti 抓取。
- 自动证书联查。
- 页面复杂共享批注。
- 截图作为核心优先项。
- 字段级权限矩阵。

## 14. 协同与可见性策略

第一阶段采用关系模型：

- `self`
- `same_team`
- `manager_scope`
- `cross_team`
- `admin_policy`

第一阶段采用信息包裁剪：

- `Presence Pack`
  - 是否存在。
  - 是否已有研究。
  - 是否关闭。
  - 是否低价值、非目标或竞争对手。
- `Ownership Pack`
  - 是否已有负责人。
  - 所属 team。
  - 是否允许申请协作。
- `Research Summary Pack`
  - 最近研究时间。
  - 研究结论摘要。
  - 联系人线索数量。
  - 已验证或已记录的联系方式数量。
  - 证据数量。
- `Sensitive Detail Pack`
  - 详细备注。
  - 具体联系人详情。
  - 完整证据内容。
  - 深度跟进内容。

默认策略建议：

- `self`: 可见全部。
- `same_team`: 可见 Presence / Ownership / Research Summary，Sensitive Detail 由策略控制。
- `manager_scope`: 可见管理范围内完整信息。
- `cross_team`: 只看防撞信息和必要归属提示。
- `admin_policy`: 可管理策略，但不默认等于查看所有业务细节。

## 15. AI-ready 预留设计

第一阶段不实现 AI 自动化，但事件模型必须支持后续 AI。

### 15.1 数据分类

研究数据必须区分：

- `Evidence`
  - 页面、URL、截图、选中文本、来源上下文。
- `Fact`
  - 邮箱、电话、地址、公司名、证书号、联系人线索等提取事实。
- `Note`
  - 人工备注。
- `Assessment`
  - 人工判断，例如值得开发、非目标、低价值。
- `Tool Result`
  - 外部工具跳转或工具查询结果。
- `Suggestion`
  - 未来 AI 输出的建议，不是事实。
- `Decision`
  - 人工确认后的正式判断或动作。

### 15.2 Suggestion 边界

未来 AI 输出必须进入 `Suggestion`，不能直接写正式事实或 CRM 主数据。

推荐流程：

```text
AI Suggestion -> Human Review -> Confirmed Research Event / Lead Draft
```

AI 可以建议：

- 页面摘要。
- 字段提取。
- 目标类型判断。
- 是否值得继续研究。
- 下一步动作。
- lead draft 草稿。

AI 不应直接：

- 创建正式 CRM lead。
- 覆盖人工备注。
- 决定客户归属。
- 关闭 target。
- 将未验证信息写成确认事实。

### 15.3 Research Event AI-ready 字段

每条事件建议预留：

- `source`
- `confidence`
- `evidenceRefs[]`
- `structuredPayload`
- `visibilityScope`
- `auditContext`
- `createdBy`
- `createdAt`

当未来接入 AI 时，可以在不推翻事件模型的情况下追加：

- `suggestionId`
- `modelProvider`
- `modelName`
- `promptTemplateVersion`
- `toolCallRefs[]`
- `reviewStatus`

## 16. CRM 防腐边界

CRM 服务尚未设计前，不能让插件研究模型反向定义 CRM 主模型。

当前边界：

- `ResearchTarget` 不等于 CRM account。
- `ContactClue` 不等于正式 contact。
- `LeadDraft` 不等于正式 lead。
- `ResearchEvent` 不等于 CRM activity。

未来 CRM 设计时需要明确：

- 哪些 Lead Draft 字段可进入正式 lead。
- 哪些 ContactClue 可转正式 contact。
- Research Timeline 与 CRM activity 如何映射。
- 低价值 / 非目标判断属于 CRM、Prospecting，还是跨域共享标签。
- 成交状态、报价、商机阶段等正式销售事实归属 CRM，不归属插件。

## 17. 开放问题

| 日期 | 问题 | 为什么未冻结 | 下一步 |
| --- | --- | --- | --- |
| 2026-04-18 | Prospecting 是否在 CRM 成熟后继续保留为 `crm-service` 内部 slice，还是演化为独立服务？ | 第一阶段归属已冻结为 future `crm-service/prospecting`，但长期拆分仍取决于后续 CRM 与市场情报边界。 | 仅当出现明确拆分证据时，再通过 architecture / ADR 决定。 |
| 2026-04-18 | `Lead Draft -> CRM Lead` 的正式契约是什么？ | CRM lead 模型尚未冻结。 | 待 CRM 服务设计后迁入 contracts。 |
| 2026-04-18 | 低价值、非目标、竞争对手等状态是否属于 Prospecting 事实，还是 CRM / market intelligence 共享事实？ | 这些状态可能被 CRM、市场情报和销售协同共同消费。 | 后续在 CRM / market intelligence 设计时判断是否需要独立标签模型。 |
| 2026-04-18 | 外部工具跳转结果是否需要自动回写？ | 第一阶段只做带参数跳转；自动抓取涉及站点差异、合规、性能和反爬风险。 | 第一阶段只记录 `external_tool_opened`，自动结果回写后置。 |
| 2026-04-18 | 邮箱验证能力属于插件工具、Prospecting、CRM，还是独立 contact intelligence 能力？ | 邮箱验证会被多个业务场景复用，且可能涉及成本、频控和合规。 | 后续单独设计 email verification capability。 |
| 2026-04-18 | 页面共享批注是否进入第一阶段？ | 批注恢复需要文本锚点、DOM 锚点、页面改版容错，复杂度高。 | 第一阶段只保存选中文本和备注，不做页面级批注恢复。 |

## 18. 真相源回写计划

- 服务职责：
  - CRM 服务设计时回写 `docs/architecture/services/crm-service.md`。
  - 若 Prospecting 独立成服务，新增对应 service card。
- 协同蓝图：
  - 插件到 BFF 到 Prospecting / CRM 的协同冻结后，回写 `docs/architecture/collaborations/`。
  - AI suggestion 与人工确认流程冻结后，回写 AI collaboration。
- contracts：
  - BFF 插件契约已建立在 `docs/contracts/api-gateway/browser-prospecting-workspace.md`，第一阶段 endpoint prefix、DTO 必填字段、错误码与 action 语义已冻结。
  - Lead Draft 到 CRM 的契约待 CRM 设计后迁入 `docs/contracts/**`。
- feature packet：
  - 第一阶段 feature packet 已建立在 `docs/plans/features/browser-prospecting-workspace.md`。
- implementation plan：
  - 第一阶段 implementation plan 已建立在 `docs/plans/browser-prospecting-workspace-implementation-plan.md`。
- architecture / ADR：
  - Prospecting 最终服务归属、CRM 边界、AI 工具协议如有跨域影响，应新增或更新 architecture / ADR。

## 19. 恢复入口

下次继续前先读：

- `docs/architecture/04-ai-architecture.md`
- `docs/architecture/11-gateway-and-bff-architecture.md`
- `docs/architecture/15-authorization-layering-and-resource-policy-architecture.md`
- `docs/architecture/services/permission-service.md`
- `docs/plans/designs/README.md`
- `docs/plans/designs/crm-service-design.md`

当前推荐下一步：

- 复核 `docs/plans/browser-prospecting-workspace-implementation-plan.md` 的切片顺序与执行边界。
- 执行前继续冻结 extension auth bridge endpoint DTO / error semantics，并在实现阶段确认与现有 auth-bff token model 的对接方式。
- CRM 服务设计启动时，优先回看本 workspace，决定 Prospecting Research 的最终归属和 Lead Draft 交接边界。
