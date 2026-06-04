# Browser Workspace Extension Design

## 0. 文档控制

```text
designKey: browser-workspace-extension
designStatus: ACTIVE_DESIGN_WORKSPACE
lastUpdatedAt: 2026-06-04 00:00:00 Asia/Shanghai
lastUpdatedBy: Codex
supersedes: docs/plans/designs/browser-prospecting-workspace.md
conflictResolution: 当本文与更早浏览器插件讨论或旧 browser prospecting workspace 冲突时，以本文 lastUpdatedAt 之后的冻结结论为准；稳定 architecture / ADR / contracts 明确覆盖本文时，以稳定真相源为准。
```

## 1. 目标

- 将浏览器插件重新定义为 OES 的统一浏览器工作台插件，而不是只服务销售背调的单一插件。
- 明确插件本身只承担浏览器端入口、workspace 容器和 role-aware capability 入口职责，不拥有业务真相。
- 支持不同 role 在同一插件中看到不同的 workspace、动作和可见数据。
- 为后续继续扩展更多 role 和 capability 预留稳定边界，避免重复推翻插件壳层设计。

## 2. 当前范围

- 本 workspace 负责：
  - 统一浏览器工作台插件的产品边界。
  - 插件壳层、workspace 容器和 capability 接入边界。
  - role、actionCodes、terminal access、navigation / launcher 在插件中的职责划分。
  - 销售类 workspace 与设计类 workspace 的边界隔离原则。
  - 旧 sales prospecting 插件设计中哪些结论保留、改写、丢弃。
- 本 workspace 不负责：
  - 直接冻结某个具体业务 capability 的正式后端契约。
  - 直接实现插件代码。
  - 直接定义 CRM、设计、商品、采购等正式业务主模型。
  - 直接把插件升级为租户级模块 / plugin enablement 平台。

## 3. 涉及对象

- services:
  - `api-gateway`
  - `permission-service`
  - `auth-service`
  - `identity-service`
  - future capability owners such as `crm-service`
- features:
  - unified browser workspace extension
  - role-aware browser workspaces
  - future sales workspace
  - future designer workspace
- collaborations:
  - browser extension access and session establishment
  - permission / access summary driven capability gating
  - future browser workspace to business capability collaborations

## 4. 当前已确认方向

| 日期 | 决定 | 影响范围 | 回写目标 |
| --- | --- | --- | --- |
| 2026-06-04 | 新插件主轴采用“统一浏览器工作台插件”，不是只面向销售 prospecting 的单一业务插件。 | product boundary / plugin positioning | 当前 workspace；后续 feature packet / contracts |
| 2026-06-04 | 插件首屏采用 launcher 首页，先展示当前 operator 可用的 workspace / capability 入口，而不是默认直接进入销售或其他单一 workspace。 | plugin shell / navigation / role-aware UX | 当前 workspace；后续 feature packet / contracts |
| 2026-06-04 | 插件 launcher 的一级入口单位采用 workspace，而不是直接暴露零散 capability 列表。 | launcher IA / terminal UX | 当前 workspace；后续 feature packet |
| 2026-06-04 | `browser-extension` 作为独立 terminal 参与入口可见性治理，而不是只作为 tenant-web 附属页面或前端本地插件能力。 | terminal boundary / permission integration | 当前 workspace；后续 permission / navigation write-back if needed |
| 2026-06-04 | 插件中“能不能看到某个 workspace”由后端 entry visibility 控制；“进入 workspace 后能做什么”由 actionCodes 控制。 | entry / action authorization split | 当前 workspace；后续 contracts |
| 2026-06-04 | extension terminal 下的 workspace entries 默认只服务 `browser-extension`，不默认给其他 terminal 复用。 | terminal-scoped entry governance | 当前 workspace；后续 navigation governance write-back if needed |
| 2026-06-04 | 插件应支持插件内登录，登录必须走 OES auth-bff / auth-service 链路，并由 BFF 固定可信 `browser-extension` terminal。 | auth flow / terminal session | 当前 workspace；后续 auth-bff contract |
| 2026-06-04 | 插件登录入口采用 terminal-specific BFF prefix，例如 `/extension/auth/*`，不复用 Web `/auth/*` 入口让客户端自报 terminal。 | auth-bff HTTP boundary / terminal normalization | 当前 workspace；后续 auth-bff contract |
| 2026-06-04 | 插件登录允许 account selection，但 `/extension/auth/login` 返回的 account options 应只包含允许 `browser-extension` terminal 登录的账号。 | account selection / terminal access | 当前 workspace；后续 terminal-access-policy 与 auth-bff-login contract 回写 |
| 2026-06-04 | 插件登录后的账号 / 租户切换应复用现有 account context switch / selectAccount 重签 session 语义，并固定 `terminal=browser-extension`。 | session switch / account context | 当前 workspace；后续 extension auth-bff contract |
| 2026-06-04 | extension demo 第一版登录方式先默认使用 `EMAIL_PASSWORD`，OTP / MFA 只按现有 auth flow 兼容，不作为首版重点扩展。 | login method / demo scope | 当前 workspace；后续 extension auth-bff contract |
| 2026-06-04 | 插件登录成功后的 shell 初始化复用现有 session context 与 access summary 语义：`navigation.visibleEntries` 驱动 launcher，`actionCodes` 驱动 workspace 内动作。 | session bootstrap / launcher / authorization | 当前 workspace；后续 extension auth-bff contract |

## 5. 待确认保留结论

下列结论来自旧 `browser-prospecting-workspace` 设计，当前尚未在新方案中自动继承，需逐项确认：

### 5.1 倾向保留

- 插件是 OES 浏览器前端入口，不是独立业务系统，也不拥有业务真相。
- 插件代码放在 `app/web/apps/browser-extension`，作为 `app/web` 下独立 frontend app。
- 插件必须通过 `api-gateway / BFF` 接入 OES，不直接调用业务服务。
- 插件前端按 Chrome extension runtime 拆分为 `background`、`content`、`side-panel`、`popup`、`context-menu`、`commands`、统一 `api client`。
- `side panel` 仍应作为复杂交互主工作区，`popup` 只承担轻入口。
- Chrome manifest 第一阶段仍应采用最小权限原则，不默认申请 `<all_urls>` 常驻注入。
- 插件认证不通过 content script 抓取 `tenant-web` token。
- 前端动作控制应消费 `access summary.actionCodes`，而不是前端自己从 role 名称推导权限。
- launcher 只渲染后端返回的可见 workspace entries，前端不根据 role 名硬编码显示工作台。

### 5.2 倾向改写

- 旧 `Target Workspace` 应改写为更通用的 `Browser Workspace` / capability-specific workspace 容器语义，避免把所有角色都绑到 sales target 模型。
- 旧“页面信息卡 + timeline + research event”模式可以保留为某类 capability 的候选交互模式，但不应成为所有 role 的统一数据模型。
- 旧 prospecting / lead draft / contact clue 只应降级为“销售 workspace 示例能力”，不再代表插件主模型。
- 旧 `browser-prospecting` 命名、endpoint prefix、feature packet 命名不再默认延续。

### 5.3 倾向丢弃

- “插件第一阶段即以销售 prospecting 为唯一主线”的产品定位。
- “插件所有保存、提取、备注、跳转等输入都必须归属到 target workspace”的统一规则。
- 任何把 CRM prospecting 防腐层直接当成整个插件核心领域模型的表达。

## 6. 当前开放问题

| 日期 | 问题 | 为什么未冻结 | 下一步 |
| --- | --- | --- | --- |
| 2026-06-04 | role 到 workspace 的映射，是只通过 `actionCodes` 驱动，还是需要额外 capability summary / plugin launcher contract？ | 只靠 actionCodes 可能不足以表达 workspace 级入口组织。 | 先确认接入模型方向，再决定是否需要新 contract。 |
| 2026-06-04 | 设计师 workspace 的最小主线是什么？ | 目前只有“找适合开发的产品并发送到 OES”的方向，还未冻结对象与动作。 | 与用户确认设计师首批能力闭环。 |

## 6.1 首屏模型补充

- `launcher` 是插件壳层首页，不是某个业务 workspace 自己的首页。
- `launcher` 只负责展示“当前 operator 在当前上下文下可以进入哪些 workspace / capability”。
- `launcher` 不拥有业务真相，不替代具体业务 workspace 的读写视图。
- 某个 workspace 是否显示，不能由前端硬编码 role 名决定；当前冻结方向是由后端 entry visibility 返回 workspace entries，前端只负责渲染。
- `launcher` 允许后续继续扩展更多 role / workspace，而不要求推翻插件壳层。

## 6.2 当前冻结的插件可见性模型

- `browser-extension` 是 OES 的一个独立 terminal。
- extension terminal 的首页是 launcher。
- launcher 的一级入口是 workspace。
- 用户是否能看到某个 workspace，取决于后端是否返回该 workspace 对应的 visible entry。
- 一个同时具备多个角色能力的用户，可以同时看到多个 workspace entries。
- 用户进入某个 workspace 后，side panel、context menu、commands / 快捷键和页面动作应切换到该 workspace 的工作语义。
- workspace entry 默认是 terminal-scoped entry，先只服务 extension terminal，不默认给 tenant-web、PDA、KIOSK 复用。
- actionCodes 不负责决定 launcher 上有哪些 workspace entry；actionCodes 负责控制已进入 workspace 后的动作能力。

## 6.3 当前冻结的插件登录方向

- 插件作为独立 terminal，应支持插件内登录。
- 插件内登录不能绕过 OES auth，不引入 Firebase 或独立账号系统。
- 插件内登录应通过 extension-specific BFF 入口进入，当前冻结方向为 `/extension/auth/*`。
- extension demo 第一版默认使用 `EMAIL_PASSWORD`。
- OTP 登录、MFA 完成、factor challenge 等能力若被后端返回为 continuation state，应复用现有 auth flow response shape；首版 demo 不为这些能力新增独立语义。
- BFF 必须固定可信 `terminal=browser-extension`，不能信任客户端 payload 自行声明 terminal。
- `/extension/auth/*` 与现有 Web `/auth/*`、PDA `/pda/auth/*`、KIOSK `/kiosk/auth/*` 一样，属于 terminal-specific BFF auth entry。
- 后端应按 `browser-extension` terminal 执行 terminal login policy、terminal access、MFA、session 建立、refresh 与审计。
- 插件 session 独立于 tenant-web session；tenant-web 切换租户不应静默改变插件当前 session。
- 插件 account / tenant 切换应复用现有 account context switch / selectAccount 重签 session 语义，由 extension-specific endpoint 固定 `terminal=browser-extension`。
- 切换成功后，插件必须重新刷新 session context、access summary 与 navigation visible entries，并回到 launcher 或当前 workspace 的可用状态。
- 系统级账号是否允许 browser-extension 登录应由 terminal access / login policy 决定；当前 demo 倾向不允许系统级账号进入插件 terminal。
- 插件登录允许 account selection，但 account options 应先按 `browser-extension` terminal access 过滤。
- 系统级账号默认不出现在 extension account options 中，除非未来显式开放 browser-extension terminal access。
- 如果过滤后没有可选账号，插件登录应返回稳定 denial，例如 `NO_SELECTABLE_ACCOUNT_FOR_TERMINAL` 或同等语义，而不是返回空列表让前端猜测。
- 该过滤语义是 Web / PDA 之外的 extension terminal 规则：Web 当前仍可保持选中后再判定；PDA Phase 2 仍按设备绑定租户解析唯一账号。
- 插件 account options 的过滤语义需要回写现有 terminal access / auth-bff login 设计，因为旧 terminal access policy 曾记录“不在 account options 阶段过滤 terminal access”。

## 6.4 当前冻结的插件登录后初始化方向

- 登录、账号选择或账号切换成功后，插件应刷新 extension session context。
- extension session context 复用现有 session context 语义，返回 operator、account、tenant、terminal、allowedTerminals、navigation 等 shell 初始化字段。
- extension terminal 下，`navigation.visibleEntries` 是 launcher 可见 workspace entries 的后端真相。
- extension terminal 下，`navigation.defaultEntry` 可作为默认聚焦或默认选中 workspace entry，但不要求插件绕过 launcher 直接进入该 workspace。
- 插件不消费 Web route、menu hierarchy、defaultHomePath 等 Web compatibility 字段作为稳定真相。
- 插件应独立调用 access summary，使用 `actionCodes` 控制 workspace 内按钮、context menu、commands 和提交动作。
- 插件前端不得从 roles 推导 workspace visibility 或 action availability。

## 7. 真相源回写计划

- 服务职责：
  - 如插件登录态、launcher、capability gating 需要改变现有 owner 边界，再回写相应 service truth。
- 协同蓝图：
  - 待冻结“插件壳层 -> BFF -> capability owner”协同后再新增 collaboration 文档。
- contracts：
  - 待冻结统一浏览器工作台插件首批 BFF contract 后新增。
- feature packet：
  - 待新方案范围足够清晰后建立新的 feature packet。
- architecture / ADR：
  - 若需要反转现有 access-summary / navigation / terminal 接入边界，再升级到 architecture / ADR。

## 8. 恢复入口

- 下次继续前先读：
  - `docs/plans/designs/browser-workspace-extension-design.md`
  - `docs/plans/designs/browser-prospecting-workspace.md`
  - `docs/architecture/services/permission-service.md`
  - `docs/contracts/api-gateway/access-summary.md`
  - `docs/contracts/api-gateway/navigation-summary.md`
- 当前推荐下一步：
  - 先冻结统一插件壳层的首屏模型与 capability 接入模型。
  - 再逐项确认第 5 节中的旧结论哪些保留、改写或丢弃。
