# OES 项目执行基线

## 1. 适用范围与优先级

本文件是 OES 仓库中人工开发者与 Codex task 的最小强制入口。

规则优先级：

1. `docs/architecture/` 与 `docs/adr/` 中更具体的稳定设计；
2. 本文件；
3. `docs/governance/` 中的执行与文档治理细则；
4. active Design Workspace 与 Feature Packet。

过程记录、旧计划、已完成 Feature Packet 和 task 历史均不构成稳定设计依据。

## 2. 架构硬约束

- 边界优先于实现；涉及新服务、跨服务契约、事件、权限、租户、共享抽象、AI 工具协议或 operator context 时，先冻结设计。
- 每个服务独占自身数据与业务真相，禁止跨服务共享数据库或直接读取其他服务数据库。
- 外部客户端经 API Gateway / BFF 进入；内部同步调用使用 gRPC；跨上下文事实传播使用事件总线。
- 语义不一致的上下文之间建立防腐层，不通过复制内部类型形成隐式契约。
- `src/common` 只承载基础设施与明确共享契约，不承载跨域业务逻辑。
- 核心业务规则不得放入 controller、gateway、DTO、Prisma schema 或协议映射层。
- 服务优先采用 `interfaces -> application -> domain`、`infrastructure -> domain` 的依赖方向；`domain` 不依赖 NestJS、Prisma 或 gRPC。
- AI 不拥有业务主数据，不直接写业务核心表；状态变化只能通过受控工具、应用服务、鉴权、确认与审计链完成。
- 所有业务与 AI 调用链显式携带适用的 `tenantId`、`orgId`、operator、trace 与审计上下文。

## 3. 文档入口

- 系统与平台稳定设计：`docs/architecture/`
- 单服务唯一稳定真相：`docs/architecture/services/<service-name>.md`
- 跨服务协同真相：`docs/architecture/collaborations/`
- 关键架构取舍：`docs/adr/`
- 黑盒业务契约：`docs/contracts/`
- 当前运维步骤：`docs/runbooks/`
- 当前设计工作台：`docs/plans/designs/`
- 当前阶段协调包：`docs/plans/stages/`
- 当前执行包：`docs/plans/features/`
- 执行模型：`docs/governance/codex-execution-model.md`
- 文档治理：`docs/governance/document-governance.md`

`index.md` 只导航，不承载设计结论、实现状态、迁移历史或长篇阅读顺序。Git 保存历史，不另建文档 archive、线程账本或迁移账本。

## 4. 唯一真相与写入规则

- 一个稳定事实只在一个规范文件中定义，其他文件只引用。
- 单服务职责、核心对象、拥有与不拥有的真相，只写入对应 `services/<service-name>.md`。
- `docs/contracts/` 定义规范性的黑盒业务语义；Proto、OpenAPI 与 schema 是可执行表达。两者不一致即为缺陷。
- Design Workspace 只保存当前未冻结设计和开放问题；结论冻结后回写规范真相并从 Workspace 移除。
- Stage Packet 只存在于 SL 的本地协调分支和 worktree，保存一个有界阶段的当前协调状态；阶段清理后删除，禁止 push 或合入 `main`。
- Feature Packet 只保存当前 feature 的 slices、验收条件与候选状态；完成并经 Human 确认清理后删除。
- ADR 只解释仍有价值的高影响决策、取舍与后果；完全被取代且已无当前解释价值的 ADR 删除，历史由 Git 保留。
- 文档链接使用仓库相对路径，禁止写入本机绝对路径。

## 5. Task 执行入口

OES 默认从普通讨论开始，不要求 Human 选择讨论角色。只有开始有状态写入后才建立 owner：

- Direct execution：一个明确 owner 闭合一个有界 Change Set；使用短期 owner branch、PR、required CI、Human merge gate 与精确清理。
- Human Decision Owner（HDO）：人，负责语义决定、Proposal、执行激活、main merge 和清理确认。
- Design Owner：围绕一个设计主题持续讨论；先在当前会话给出完整只读 Proposal Preview，Human确认后才按需创建active Design Workspace并形成local-only Proposal Patch。它可以由当前聚焦task承担，只有独立、并行或需长期恢复的主题才新建Design Task；不push、不创建或更新design PR、不merge，也不直接委派credentialed host代做remote mutation。
- Global Unified Design（UD）：唯一 canonical writer、串行设计审查者和design remote owner；负责design PR、Human-confirmed merge、main CI、merge后的主动执行建议和两阶段delivery handoff。需要host transport时只能由exact UD在mutation前签发一次性精确binding，结果仍由UD复核并发布。
- Stage Lead（SL）：一个多feature交付阶段的临时owner，按依赖和WIP容量创建FL，只在本地verification worktree组合exact FL candidates并执行Stage Review；不建立remote stage product branch、总PR或stage merge。
- Feature Lead（FL）：一个可独立验收feature的临时owner，写一个active Feature Packet并推进slices；完整feature candidate和feature review通过后才push自己的branch并创建Draft PR，有parent SL时还须exact Stage Review通过后才能进入merge-ready。
- Implementation Task（IT）：实现一个slice；通常是FL的subagent。
- Review & Integration（RI）：按风险执行Focused、Feature、Stage或显式System Review；默认只读精确candidate。单个FL的独立验收称为Feature RI，阶段组合验收称为Stage RI；System Review只用于明确绑定的全系统范围，不属于普通FL流程。

框架role task使用统一标题契约：Design Owner为`[Design] HUMAN_READABLE_TOPIC`，UD为`[UD] Unified Design`，Direct为`[Direct] HUMAN_READABLE_CHANGE_SET`，SL为`[SL] HUMAN_READABLE_STAGE`，FL为`[FL] HUMAN_READABLE_FEATURE`，IT为`[IT] HUMAN_READABLE_FEATURE / HUMAN_READABLE_SLICE`，RI为`[RI] HUMAN_READABLE_REVIEW_SCOPE`。普通讨论、status和项目评估不要求role前缀，也不得在没有exact role binding时自称框架角色。标题只用于Human识别；routing、ownership、authorization与recovery始终使用exact task id和binding。

创建或激活cutover后的role task前，creating owner必须先验证角色资格并绑定`roleType`、`expectedTitle`、`titleRuleVersion`、exact parent与transition；创建后、`HANDOFF_ACCEPTED`或任何role-owned资源写入前，creator与child都要复读task id、role、parent和actual title。任一不匹配返回`TASK_IDENTITY_INVALID`给exact creating parent并fail closed；parent只修正同一新task标题后重验，不为修正标题重复创建task。RI还必须绑定exact candidate与direct execution parent；项目级探索或评估不是RI。

本规则以canonical merge为cutover。cutover前已存在的task、locator和携带exact expected title的task-creation binding继续按frozen identity运行，不改名、不重新分类、不改owner或状态；既有task在cutover后创建没有pre-cutover exact binding的新task时必须使用新规则。不得建立title-based routing、命名迁移账本或批量改名流程。

Human 无需主动触发上述内部角色。task先读取真实status，只显示当前合法动作并标记一项建议：继续讨论、恢复已有Design Owner、形成设计、Direct或常规协同。判断原因只在Human请求时展示。

各角色必须执行`docs/governance/codex-execution-model.md`第2节的专业标准：Design Owner以Principal Architect级能力完成边界、契约、失败模式与演进设计；UD以Chief/Enterprise Architect级能力审查全局一致性；SL/FL分别以Technical Delivery Lead与Staff Engineer级能力优化阶段和feature；Direct/IT以Senior/Principal Engineer级能力实现正确、简洁、主流且适配当前约束的方案；RI以Principal Reviewer/SDET级能力规划不重复、风险驱动且可复现的验证。角色名称本身不构成质量证据。

普通讨论不创建role、branch、Workspace或packet。同一聚焦主题优先在当前task继续；已有Workspace恢复其exact Design Owner；独立、并行、需要长期恢复或当前task已有不兼容责任时才建议新建Design Task。稳定语义变化由Design Owner提交UD；语义影响为`NONE`的canonical纯编辑仍使用`CANONICAL_EDITORIAL_PATCH`。

v6 truth merge前已经取得Human确认，或已经创建exact owner、task、branch/worktree、candidate、PR、activation、merge或cleanup binding的v5 work item，继续按其frozen v5 binding完成到该owner graph的terminal/cleanup边界。v6不得重命名、改派、重新解释或使这些active card、owner和资源失效；边界完成后的新意图才进入v6，异常接管只使用Human-confirmed Recovery。

运行可靠性revision truth merge前已确认或已创建exact v6 owner/resource/binding的work item同样继续到自己的terminal/cleanup边界；新moving-main、queue、batch cleanup或driver规则不重新解释已发出的merge/cleanup卡。相同scope内补齐effective execution profile、auto-review和approval telemetry属于environment repair，可在原binding下自动采用。

完整消息类型、owner转移、并行约束、review返工、locator、Git权限与自动/人工边界以`docs/governance/codex-execution-model.md`为准。

任何remote push、PR、`main` merge、post-merge验证和Git资源清理，必须先读取并遵守该文件第9节。Direct只简化角色和过程文档，不允许direct push `main`、绕过PR/CI/Human merge gate或降低验证。Design remote mutation只能由exact UD发起，或由exact UD在mutation前绑定的一次性host transport执行；Design Owner、请求来源、parent或其他持凭据task先写remote再请UD复核，均不构成合法顺序。

任何有状态work item只有一个当前owner和一个artifact owner。通知不转移owner；只有新owner校验并返回`HANDOFF_ACCEPTED`后才允许写入。SL/FL只协调预确认的有界执行拓扑，不构成长期开销；不得建立全局调度中心、watchdog、heartbeat、Pull inbox、历史thread registry或过程账本。

长期owner资源必须使用稳定存储：owner branch/ref与worktree共享仓库Git common directory，active Packet、candidate bundle和current evidence manifest保存在task稳定artifact root；`/private/tmp`只保存删除后可重建的runtime scratch、隔离测试数据和disposable verification clone。重启或worktree缺失时先按稳定ref/bundle/manifest恢复exact owner，不因临时目录消失创建replacement owner或重做已验证工作。

SL在启动FL前必须区分独立交付物与同一feature的实现slice：可独立candidate、RI、PR和安全合入`main`的结果拆为平级FL；必须共同原子验收的slice保持一个FL并由FL创建有界IT。执行中发现feature已分裂为多个独立交付物时返回`FEATURE_REPLAN_REQUIRED`给exact SL；仍属一个feature时由FL在既有delegation ceiling内调整IT，不新增Human gate。parent派发child后进入`WAITING_ON_CHILD`并结束当前turn，由exact typed result唤醒，禁止持续poll或占用执行槽等待。

active Stage/Feature中发现design gap时，只开启Design Owner/UD设计子流程；原SL/FL继续是exact delivery owner并保留其packet、branch/worktree、PR、candidate与有效证据。truth merge后先校验并恢复该exact owner，不创建replacement SL/FL；只有owner、scope、capabilities、topology或resource binding失效时才向Human显示一次replan卡。`DESIGN_GAP_RESOLVED`后原SL必须fetch latest `origin/main`、验证exact canonical merge是其祖先并刷新Stage `integrationBase`与verification worktree；affected FL必须把该latest main以append-only merge commit合入自己的feature branch后才继续remediation，unaffected candidates/evidence按影响复用。

Human确认delivery scope时同时授权该scope所需的最小充分运行能力。OES task必须使用实际生效的project execution profile，而不是只在消息中声明权限；profile按owner绑定exact worktree、解析后的shared Git metadata、task temp/cache、repository-declared local service/container/test database、localhost和approved network，并保护secret、生产/共享数据、host/system privilege及跨owner资源。`approval_policy=on-request`与`approvals_reviewer=auto_review`接管残余低风险platform approval；正常Direct/UD/SL/FL/IT/RI在confirmed scope内的用户权限弹窗目标值为零。

UD、SL或FL在handoff接受前必须对effective capabilities执行真实smoke，包括owner file write、Git switch/add/commit、标准build/test、task-owned service/database、localhost/network和evidence root。已声明能力仍产生用户approval时属于`EXECUTION_PROFILE_DEFECT`：保持owner、candidate、state和原authorization，由creating parent或current owner自动修复、重建或迁移execution profile/host并幂等恢复，不形成Human gate。只有scope/protected scope扩大、生产或共享资源、新secret或付费外部系统、host/system privilege、cross-owner/destructive operation以及既有main merge和cleanup gate才合并请求一次Human确认。child只从Human-confirmed topology为该role绑定的delegation ceiling取得完成assignment所需的更窄能力。

并行work item必须分离固定的`truthBaseline`、可自动刷新的`integrationBase`和candidate冻结时的`candidateBase`。`main`前进本身不使既有Human authorization失效：无关变化自动集成并复用仍有效证据，相关变化运行affected tests，普通冲突由artifact owner解决，只有冻结语义冲突进入`DESIGN_GAP`。candidate冻结或发布后不改写历史，只追加merge/fix commit。

远端Git/GitHub mutation统一通过仓库拥有、版本化、经过测试且幂等可恢复的remote driver执行；不得为每个task临时生成新的长Shell runner。多FL仍保持独立完整PR；Stage Review与Human merge authorization通过后使用latest-main merge queue或等价串行admission。测试证据按candidate、依赖、输入、环境和命令版本复用。同一Stage cleanup只向Human展示一张精确批量卡，各FL仍清理自己的资源，SL只可为终态Feature Packet建立cleanup-only聚合PR，不获得产品remote branch或产品代码写权。

effective execution profile按owner session建立并在task、host、repository、worktree、toolchain、credential identity与permission profile未变时复用；每次remote mutation只签发引用该profile fingerprint的single-use action binding。验证按focused development、candidate affected matrix、PR/Stage full gate三层规划，完整输入fingerprint未变的证据直接复用；RI只补验缺失或已失效风险，不重复owner已证明且输入未变的完整矩阵。

## 6. 讨论、冻结与写入

- 用户表达“还在讨论”“先聊想法”或同等语义时，只分析和比较，不修改项目文件。
- 普通讨论是默认入口，不创建IDT/CDT；同一主题不因从探索进入设计而自动换线程。
- 用户明确要求形成设计后，task先基于当前truth在会话中展示完整只读Proposal Preview，至少包含问题、结论、状态/路由、影响文件、保持不变项、验证和停止点；此时不创建task、branch/worktree、Workspace或commit。
- Human确认的是exact Proposal Preview；确认后当前聚焦task无冲突时成为Design Owner，否则创建一个独立Design Task，并在已确认范围内创建资源、写入、验证、形成Proposal commit并提交UD。Proposal及Design Owner→UD envelope必须携带exact `proposalEntryType`、`previewFingerprint`、`rootConfirmationFingerprint`、`scopeFingerprint`、`transitionId`和state binding；existing-delivery design gap还必须完整继承原SL/FL、parent/return target、Stage/Feature、affected/preserved owners、authorization、resource set和gap fingerprints；其中任一指纹、base、scope、owner或规范结论变化时必须重新展示Preview。
- 一个设计主题最多一个active Workspace和一个active Proposal；继续已有Workspace时恢复exact Design Owner，不按标题猜测或重复创建。
- Design Owner展示Proposal Preview前必须刷新canonical truth；Proposal只承载稳定设计真相并始终提交UD。
- Human对exact Proposal Preview的一次确认同时授权Design Owner按preview形成Proposal commit并提交UD，以及UD审核、集成、验证、push和创建design PR；停止于`DESIGN_PR_READY`。写入后的diff或验证结果偏离preview即停止并重新展示，merge、`NEW_DESIGN` post-merge执行激活、failed continuation guard的replan和cleanup分别确认；exact existing-delivery resume不重复确认。
- `NEW_DESIGN`的design PR合入`main`且exact main CI通过后，UD必须在同一task主动展示动态执行建议；`NO_EXECUTION`为建议结论，Human选择暂不执行后进入`EXECUTION_DEFERRED`。`EXISTING_DELIVERY_DESIGN_GAP`则将resolution返回exact original SL/FL并在guard通过时自动恢复affected lane；不得进入activation或创建replacement owner。UD不得把implement发给请求来源、Design Owner或祖先task。
- `NEW_DESIGN`只有在Human确认暂不执行，或Direct/FL/SL完成两阶段handoff后，UD才进入自身cleanup-ready；`EXISTING_DELIVERY_DESIGN_GAP`在exact original owner确认resume binding或进入replan后使UD cleanup-ready，UD不接管或清理原delivery资源；editorial入口在main CI和exact source notice后直接进入UD cleanup-ready。
- `CANONICAL_MERGED`只通知exact Design Owner验证Proposal coverage和处理自身cleanup；`CANONICAL_EDITORIAL_MERGED`只通知exact source Direct owner验证editorial coverage并关闭无Git Change Set；两者都不转移delivery owner或Git ownership。
- `CANONICAL_EDITORIAL_PATCH`由source Direct owner确认精确files/hunks、语义影响`NONE`和source通知目标后交UD；classification失效时UD发送`EDITORIAL_CLASSIFICATION_INVALID`给exact source，保留entry-specific资源边界且不转为隐式Proposal。
- Direct适用于同一Change Set的明确小修改；同一目标继续修改时恢复exact owner和现场。稳定设计、新服务、跨服务契约/事件、权限/租户、共享API/抽象、AI工具协议或多feature交付必须先使用Design Owner/UD或常规协同。
- 涉及上述稳定语义的实现，必须以exact merged truth SHA为输入；并行work item还必须满足独立验收、依赖ready和写范围不冲突。

## 7. 实现质量

- 先复现或定位现象，再区分症状、触发条件、根因、设计缺口与环境因素，最后实施最小正式修复。
- 修正错误边界、契约、映射或抽象，不用硬编码、特殊判断或多层兜底掩盖根因。
- 实现前读取exact merged truth、调用链和邻近代码，优先使用与仓库一致、社区主流、长期维护且适合当前约束的语言/框架模式；“最新”“最复杂”或“理论最快”不自动等于最佳。
- 新增或修改逻辑必须覆盖正确性不变量、边界输入、失败路径、并发/事务/幂等、安全/租户、资源释放、可观测性与兼容性中的适用项；复杂分支、状态机或算法先列truth table/state transition/invariants并用正向、边界、反向和性质测试覆盖，关键算法记录时间/空间复杂度及真实规模依据。
- 不引入复制粘贴、魔法值、巨型函数/类、深层条件、静默吞错、隐式共享状态、泄漏抽象、过度通用化、无证据优化或与本次目标无关的重构。
- 新增或重写的 class、function、service、handler、repository、guard、interceptor 等代码单元应有一句职责总结注释；已有同等清晰注释时不重复。
- 文档、代码与配置统一使用 UTF-8；代码标识符、目录、文件名、proto 字段、事件名和权限码使用英文。
- 怀疑历史文件编码异常时先标记并安排转码，不在乱码状态下续写或整篇覆盖。

验证先由owner/RI根据acceptance与风险形成一次路线，按静态/focused unit、component、contract/integration、关键journey/E2E和按风险触发的性能、安全、并发、可靠性、迁移/rollback分层执行。已有证据只在candidate、依赖、输入与环境未变化且仍覆盖本次风险时复用；禁止机械重复全量测试、用覆盖率数字替代有效断言、用局部测试代替跨边界验收或用flaky结果证明完成。每项验收条件必须映射到至少一项可复现证据。

## 8. 交付要求

每次交付说明：

- 本次范围与修改文件；
- 行为、契约与数据影响；
- 执行的验证及结果；
- 剩余风险与下一步。

缺陷修复额外说明现象、根因、正式修复以及根因验证。任何完成声明都必须对应可复现的命令、输入和结果。
