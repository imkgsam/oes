# OES Feature / Design Candidates

## 1. 目的

本文档用于记录已经明确值得推进，但尚未完成设计、还不能直接进入实现的候选功能与候选设计议题。

它位于：

- `ideas.md` 之后
- `feature packet` 与正式 `plan` 之前

## 2. 使用规则

- 当一个点已经不只是灵感，但边界、契约、实施方式尚未冻结时，记录到这里
- 如果某条候选议题涉及高影响边界，应先升级到 architecture / ADR
- 如果某条候选议题已经完成设计并进入执行，应迁出为独立 feature packet 或正式 plan

## 3. 候选条目

| 日期 | 名称 | 类型 | 当前判断 | 下一步 |
| --- | --- | --- | --- | --- |
| 2026-04-12 | 系统内 Robot / 自动化执行服务 | Architecture Candidate | 当前已有 machine principal、AI 工具治理、内部服务信任、权限与审计底座，但尚无完整 Robot / Automation 执行主体设计；历史草稿里的执行主体、触发、执行实例、动作语义、补偿、重试、超时、ActionRegistry 等思路可以作为候选素材，但服务拆分、身份模型、工作流关系、动态扩展边界均未冻结 | 后续单独讨论并决定是否升级到 architecture / ADR |
| 2026-04-12 | AI Decision Context 模型 | Architecture Candidate | `docs/architecture/04-ai-architecture.md` 已记录参考方向，但 `DecisionType / ContextDefinition / ContextBuilder / ContextPackage / Suggestion` 是否作为正式对象模型尚未冻结 | 后续单独讨论是否升级为 architecture / ADR |
| 2026-06-02 | OES AI 业务操作入口 / 多职能 AI 助手 | Architecture Candidate | 当前想法是让员工通过飞书、OES App、Web、企业微信等渠道，以语音、文字、文件或图片持续交互，并在授权与审计约束下查询、草拟、确认或触发 OES 内部业务能力。当前只确认候选方向：用户体验层可以呈现报价助手、报销助手、采购助手、CRM 助手、报表助手等多个职能助手，但底层不应做成多套独立 AI 系统，而应倾向统一 AI 平台 + 多职能 / 岗位 / 场景 Agent Profile；远程大模型只作为语言理解与推理引擎，不能直接访问数据库或业务服务；AI 控制室 / 编排层需要负责身份、权限、工具、风险、确认、审计、成本与会话业务状态。该议题仍属于候选级，不冻结为 design workspace，也不进入实现方案。 | 后续继续讨论是否升级为 design workspace 或 architecture / ADR；优先澄清 Agent Profile、ToolContract、业务状态摘要、风险分级、远程模型数据边界与首批 pilot 是否成立 |
| 2026-06-08 | Employee Digital Business Card / 员工数字名片 | Feature / Capability Candidate | 已确认从 ideas 升级为候选设计议题，并建立 `docs/plans/designs/employee-digital-business-card-design.md` 作为 BusinessCard module design workspace。当前判断：该能力属于 future `public-entry-service` 下的 `business-card` module；BusinessCard 只拥有名片公开展示配置、Contact Action 编排、vCard 输出规则、主 Public Entry 绑定引用与管理审计，不拥有员工、任职、联系方式资产、ShortLink 生命周期或 CRM 回流真相。第一阶段聚焦一员工一张主名片、统一租户模板、Web 公开名片、实时组装 PublicBusinessCardView、一个主二维码、管理员管理、员工只读、基础访问摘要与离职自动不可公开；CRM 回流、Brand 名片、多名片、Published Snapshot、小程序 renderer、Contact Asset 细节与 ShortLink 通用模型均不作为第一阶段实现前置。已于 2026-06-08 建立 `docs/plans/features/employee-digital-business-card.md` 作为 Phase 1 feature packet。 | 在 feature packet 中继续推进 contracts、权限码、readiness reason 与 public render API；Contact Asset、ShortLink / Public Entry 与 CRM LeadDraft 回流分别由独立线程或协同设计推进 |
| 2026-04-12 | 优化 tenant-web 锁屏：取消每次锁屏前输入临时密码，并支持自动锁屏 | Feature Candidate | 当前问题已经明确，但锁屏目的、安全语义、解锁凭据、独立锁屏密码与自动锁屏策略仍未冻结，暂时还不能直接进入实现 | 后续先做 feature design，再决定是否拆成独立 feature packet |
| 2026-04-14 | QR Code Login | Feature Candidate | 当前只允许前端保留受控占位入口，不能伪造真实扫码登录；是否纳入当前阶段、确认终端、二维码生成/轮询/过期语义，以及 `auth-service` 的挑战态、重放保护与审计模型都尚未冻结 | 后续先做认证 feature design，再决定是否补正式 BFF 契约 |
| 2026-04-14 | Forgot Password | Feature Candidate | 当前只适合保留受控提示页；是否允许用户自助找回、还是仅允许管理员重置，以及 BFF 挑战语义、通知投递、滥用防护与审计边界都尚未冻结 | 后续先做认证 feature design，再决定是否补正式 BFF 契约 |
| 2026-04-14 | Self-service Registration | Feature Candidate | 当前只适合保留受控提示页；OES 是否允许自助注册、邀请接受与租户初始化边界、以及 `auth-service` / `identity-service` 的身份绑定模型都尚未冻结 | 后续先做认证 feature design，再决定是否补正式 BFF 契约 |
| 2026-04-14 | Third-party Login | Feature Candidate | 当前第三方入口只能作为受控占位；支持哪些身份提供者、租户级还是平台级、回调续流与外部身份绑定边界都尚未冻结 | 后续先做认证 feature design，再决定是否补正式 BFF 契约 |
| 2026-04-14 | Slider Verification 升级为服务端安全挑战 | Feature Candidate | 当前滑块仅属于前端受控交互，不能作为真实安全校验；若未来需要升级为安全能力，服务端 challenge 契约、时效与审计模型仍需单独设计 | 后续视安全需求决定是否进入正式 feature design |
