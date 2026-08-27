# OES Codex 执行模型

## 1. 目标

本模型默认让一个 task 直接闭合一个有界 Change Set；只有 Human 主动选择或命中稳定设计、跨 feature、多 owner/资源等升级边界时，才使用“讨论与取舍 → 统一设计 → feature 或交付阶段 → 独立复核 → 合并验收 → 分层清理”的协同拓扑。两种方式共享受保护 main、精确状态、验证和回滚纪律。

核心约束：

- task 先读取真实 status，只展示当前可用的执行方式并标记一个建议项；不默认创建角色拓扑。
- Direct 简化角色、packet 和确认层级，不简化 branch、PR、required CI、Human merge gate、验证或 rollback。
- Human 控制语义决定、阶段授权、合并与清理边界。
- confirmed delivery scope采用scope-bound autonomy：project execution profile必须实际兑现最小充分运行能力，scope内正常用户权限弹窗为零；profile缺陷自动修复，真实扩围才形成一次合并确认。
- 并行work item分离固定语义真相与移动集成基线；`main`正常前进不自动作废Human authorization，只按影响与语义冲突分级刷新candidate和证据。
- remote mutation只使用仓库拥有的版本化driver和可恢复checkpoint；多FL保持独立PR并经latest-main queue/admission，测试证据按精确输入复用，Stage cleanup一次确认后分owner执行。
- 稳定设计只有 UD 一个写者；Design Proposal 只承载稳定设计真相。
- 一个 feature 只有一个临时 FL；一个有界交付阶段最多一个临时 SL。
- 单一不可独立合并的跨服务能力归一个 FL；多个可独立安全合并的 feature 才由 SL 协调多个 FL。
- repository canonical truth 是设计同步媒介；task 路由使用 exact task id。
- active delivery 的 design gap 只开启有界 design subflow；原 SL/FL 保持 exact delivery owner，truth 修复后优先恢复原 owner，不把既有 Stage/Feature 重新解释为新交付。
- 不建立 watcher、heartbeat、Pull inbox、全局执行 registry、线程账本或过程历史。

## 2. 角色

### 2.1 Human Decision Owner（HDO）

HDO 是人，不是 Codex task。Human 负责确认完整Proposal Preview、root delivery owner及其Stage/Feature scope/protected scope、execution capabilities、delegation/WIP ceiling与扩围、每次`main` merge、`NEW_DESIGN`的UD post-merge delivery activation、failed continuation guard的replan以及owner cleanup/abandonment；并处理跨feature业务取舍和阻塞性决定。普通讨论、status/evidence读取、exact existing-delivery resume、exact active-activation revision continuation、相同binding的幂等重试、moving-main自动集成、已确认Stage ceiling内的FL topology adjustment/child owner创建、FL内IT assignment和已声明execution capability的环境修复不重复确认。Codex platform的文件、Git、service、database、network或command approval不是业务决定；正常scope内必须由effective profile与auto-review吸收，不转嫁给HDO。

HDO提供业务目标、优先级、不可违反的业务约束和验收判断，不替代技术角色选择方案。技术角色必须把专业判断转化为Human可理解的取舍与证据，不把实现细节或角色调度负担转嫁给HDO。

### 2.2 Design Owner

普通讨论不是role，不创建repository资源。需要形成稳定设计时，一个聚焦task可以成为Design Owner；只有设计主题独立、需要并行/长期恢复，或当前task已有不兼容责任时才新建Design Task。

Design Owner只维护一个设计主题：刷新相关canonical truth；先在当前会话形成完整只读Proposal Preview；取得Human对exact preview的确认后，按需维护一个active Design Workspace并形成真实Git diff/commit作为Proposal Patch，再向UD发送。Proposal资源严格local-only；Design Owner不写canonical truth，不push、不创建或更新design PR、不merge，也不直接调用credentialed host、其他task或用户执行design remote mutation；它不创建或协调Direct/SL/FL/IT/RI。

Design Owner按Principal Architect级标准工作：以业务目标和系统约束为起点，熟练运用bounded context、领域建模、数据所有权、API/event契约、分布式一致性、权限/租户、安全、可靠性、性能、可观测性、兼容演进和迁移设计。非显然决策必须检查当前代码与truth、研究适用的主流成熟实践、比较可行方案及取舍，并显式给出边界、不变量、失败模式、容量/性能假设、演进路径和可测试性。它在展示Preview前完成反例和跨边界自审，拒绝重复真相、跨库耦合、泄漏内部模型、未经验证的假设、为未来猜测而过度抽象以及只描述happy path的低质量设计。

post-cutover新建或首次激活的Design Owner标题为`[Design] HUMAN_READABLE_TOPIC`；cutover前既有task按2.9保持frozen title。标题只供识别，exact路由使用task id和active design locator。

### 2.3 Global Unified Design（UD）

UD是长期全局设计审查task，也是architecture、ADR、稳定contracts与稳定governance的唯一agent writer。它：

- 串行审核Design Owner的Human-confirmed语义Proposal；
- 接受语义影响为`NONE`且exact files/hunks已绑定的`CANONICAL_EDITORIAL_PATCH`；
- 不自行发起未确认的canonical改写；
- 有blocker时向exact Design Owner返回`REVISION_REQUIRED`；
- editorial分类失效时向exact source Direct owner返回`EDITORIAL_CLASSIFICATION_INVALID`；
- 接受时在自己的design integration branch集成并验证；remote push和design PR由exact UD执行，或由UD在mutation前签发的一次性精确binding交host transport执行；UD read-after-write后发布`DESIGN_PR_READY`；
- Human确认merge后，exact UD重新验证binding并亲自执行Merge Commit；确需host transport时，由UD先签发一次性精确remote execution binding，host按binding执行，UD再read-after-write验证exact remote state与main CI；
- `NEW_DESIGN` Proposal的main CI成功后必须在同一UD task进入`ACTIVATION_DECISION_READY`，重新评估并主动建议`Direct | SINGLE_FEATURE | DELIVERY_STAGE | NO_EXECUTION`；`EXISTING_DELIVERY_DESIGN_GAP`把resolution返回并恢复exact existing delivery owner；`ACTIVE_ACTIVATION_DESIGN_REVISION`只恢复exact原activation owner与pending child并禁止重复activation card；editorial入口通知exact source并进入自身cleanup-ready；
- 只有`NEW_DESIGN`经Human确认启动且pre-create runtime-profile launcher达到`RUNTIME_PROFILE_LAUNCH_READY`后才创建exact delivery owner，并在target-session profile验证与两阶段handoff完成前保持activation owner；existing-delivery resume不得创建replacement owner；
- 发送coverage/cleanup通知不转移workflow或Git ownership。

UD不实现产品代码、不拆slices、不写Feature/Stage Packet，也不在handoff后管理delivery状态。post-cutover新建的UD标题固定为`[UD] Unified Design`；cutover前exact UD及其locator按2.9保持frozen title。

UD按Chief/Enterprise Architect级标准审核全局一致性，而不是格式检查或rubber stamp。它必须验证Proposal与现有architecture/ADR/contracts/governance的语义兼容，检查服务边界、唯一真相、跨服务契约、权限/租户、可靠性、性能、运维、迁移和长期演进，主动寻找局部最优造成的系统级副作用、跨章节矛盾与隐含破坏性变化。事实、仓库证据和明确工程原则优先于个人偏好；存在blocking design gap时必须返回可定位、可验证的finding。

### 2.4 Direct Owner

Direct Owner按Senior/Staff Engineer级标准闭合一个有界Change Set：先定位现象与根因，读取相关设计和邻近代码，选择与仓库一致的最小正式修复，补足风险匹配的测试并证明没有破坏既有行为。它拒绝顺手扩围、隐藏设计变化、特殊判断堆叠、无关重构和用多层fallback掩盖错误边界；一旦发现稳定语义或多owner依赖，立即停止Direct并展示升级选项。

### 2.5 Stage Lead（SL）

SL是一个Human-confirmed有界多feature阶段的临时delivery owner。它维护本地Stage Packet和dependency graph，按WIP容量启动ready且不冲突的FL，安排Stage Review与ordered queue/admission，在latest main执行stage acceptance，并在一次Stage Cleanup确认后协调各FL self-cleanup。SL只在local verification worktree组合exact FL candidates；它无产品branch，不写产品代码或FL的FP，不push产品变更、不创建remote stage product branch或总PR、不合并产品main，也不跨owner清理FL资源。全部terminal FL完成main验证后，SL只可按exact cleanup card建立一个删除终态Feature Packet的cleanup-only branch/PR，该机械例外不授予任何产品写权。

SL按Technical Delivery Lead级标准优化整体交付流，而不是追求task数量。它必须识别critical path、接口/数据依赖、风险集中点、可安全并行边界、集成顺序和阶段级验收，保留review容量并限制WIP。它拒绝无验收价值的拆分、依赖未ready的并行、多个owner写同一范围、以局部测试替代端到端阶段验收，以及为了表面进度制造task fan-out。

SL在创建高风险FL前先做有界Design Risk Scan，检查跨服务事实owner、首次登录前身份、SYSTEM/HUMAN/MACHINE、Permission role/grant provisioning、tenant/org/operator/trace/audit、事件publisher/consumer/durable/DLQ、migration owner与循环依赖；只返回`EXISTING_TRUTH_SUFFICIENT`或`DESIGN_GAP`，不替代正式设计。每个ready lane必须先判定能否独立形成candidate、Feature RI、PR并安全进入`main`；成立才创建平级FL，否则保持一个FL并把实现拆为IT。

### 2.6 Feature Lead（FL）

FL是一个可独立验收feature的临时delivery owner。它从exact truth commit开始，维护一个active FP，拆分1..N个Frozen Slices，创建IT/RI，集成candidates并验证。只有完整feature candidate与feature review通过后，FL才push自己的feature branch并创建Draft PR；无parent SL时独立gates通过可进入merge-ready，有parent SL时必须等待该exact candidate的Stage Review通过。Human确认merge后，FL把exact PR交latest-main merge queue或等价串行admission；FL仍独占自己的candidate、PR、merge验证和自身资源cleanup。有parent SL时只向该SL返回规定里程碑，并在一次Stage Cleanup授权后自清理exact资源。

FL按Staff Engineer/Feature Owner级标准对一个完整业务结果负责。它把设计转换为可独立验证的vertical slices，明确每个slice的输入、输出、不变量、依赖、失败处理和验收证据；持续检查集成后的行为、兼容性、可维护性和用户价值，而不是只汇总child commits。它拒绝按技术层机械拆分导致长期半成品、把核心规则放入错误层、把集成问题推给SL或用局部通过冒充feature完成。

FL发现当前scope仍是一个原子feature但串行slice过多时，在既有delegation ceiling内创建写范围隔离的并行IT并保持一个integration owner、candidate、Feature RI和PR；IT不得直接push或创建PR。若scope已出现多个可独立验收、独立PR和独立安全合入`main`的交付物，FL停止扩写并向exact SL返回`FEATURE_REPLAN_REQUIRED`；SL在root Stage authorization与delegation/WIP ceiling内自动验证并创建sibling FL，FL自身不得创建平级FL。只有scope/protected scope/capability/ceiling扩张、不可消解owner/write冲突或阻塞性业务取舍进入Human gate。

### 2.7 Implementation Task（IT）

IT实现一个Frozen Slice，只使用FL分配的branch/worktree，向唯一parent FL返回candidate SHA、literal验证和blocker；不写FP、不push、不创建PR、不merge或cleanup。小型单slice feature可由FL直接实现。

IT按Senior/Principal Implementation Engineer级标准编码。它必须先理解exact设计、周边代码、语言/框架惯例和真实约束，优先采用经过验证、社区主流、仓库一致且最适合当前问题的实现，而不是盲目使用最新或最复杂技术。实现必须显式处理正确性不变量、边界输入、错误传播、并发/竞态、事务与幂等、安全与租户、资源释放、可观测性和兼容性；复杂分支、状态机或算法先列出truth table/state transition/invariants并以正向、边界、反向和性质测试覆盖；关键算法说明时间/空间复杂度并以真实规模判断是否需要benchmark或优化。它拒绝复制粘贴、魔法值、巨型函数/类、深层分支、静默吞错、隐式共享状态、泄漏抽象、过度通用化、无证据优化和只靠注释解释混乱代码。

### 2.8 Review & Integration（RI）

RI使用clean context审查exact candidate：低风险可由FL self-review，中高风险的单feature验收使用Feature RI，阶段组合使用Stage RI，只有明确绑定全系统范围时才使用System Review。RI默认只读，只向direct execution parent返回findings和结论；不调度下游、不就地修复、不push、merge或cleanup。

RI按Principal Reviewer/SDET级标准独立证明“实现符合设计且不会降低整体code health”。它先按acceptance与风险规划一次验证路线，再按静态检查、focused unit/component、contract/integration、关键journey/E2E以及按风险触发的性能、安全、并发、可靠性和rollback测试分层执行；优先复用仍对exact candidate有效的证据，不重复运行未受影响且输入未变化的测试。RI逐项检查设计、功能、边界/错误路径、复杂度、命名、可维护性、测试有效性、竞态和跨服务影响；finding必须包含严重度、精确位置、复现输入、预期/实际和归类。candidate、依赖或测试输入未变化时禁止以“更放心”为由机械重复全量测试。

### 2.9 Task 角色与标题契约

普通讨论、status和项目评估不是role task，没有强制role前缀；没有exact role binding时不得仅凭prompt或标题自称框架角色。新建或在cutover后首次激活的role task使用以下唯一标题格式：

| role | expected title |
| --- | --- |
| Design Owner | `[Design] HUMAN_READABLE_TOPIC` |
| UD | `[UD] Unified Design` |
| Direct Owner | `[Direct] HUMAN_READABLE_CHANGE_SET` |
| SL | `[SL] HUMAN_READABLE_STAGE` |
| FL | `[FL] HUMAN_READABLE_FEATURE` |
| IT | `[IT] HUMAN_READABLE_FEATURE / HUMAN_READABLE_SLICE` |
| RI | `[RI] HUMAN_READABLE_REVIEW_SCOPE` |

标题只承载Human可读身份，不授予角色，也不参与routing、ownership、authorization或recovery；这些边界只使用exact task id、parent/owner和transition binding。role-specific资格先于标题校验：尤其RI必须有exact candidate、direct execution parent和明确return target；项目整体评估、探索或没有candidate的审计保持普通task。

创建或激活post-cutover role task前，creating owner绑定`roleType`、`expectedTitle`、`titleRuleVersion`、exact task/parent（task创建前为planned task identity）和transition。task创建后、`HANDOFF_ACCEPTED`或任何role-owned repository/runtime资源mutation前，creator与child分别read-after-create，验证exact task id、role、parent和actual title。任一不匹配使用typed result `TASK_IDENTITY_INVALID`返回exact creating parent，保持原owner且禁止handoff与资源创建；parent只可修正同一新task的title并重验，不因title缺陷创建replacement task或按标题搜索其他task。

本契约合入canonical truth是cutover边界。cutover前已创建的task、locator和携带exact expected title的未消费task-creation binding均保持frozen identity：不改名、不重新分类、不重写locator、不改变owner/parent/callback/state，也不使existing resources或card失效。既有task在cutover后创建没有pre-cutover exact binding的新task时使用本契约；post-cutover普通task首次激活role时在role-owned资源创建前完成title normalization。不得扫描或批量迁移旧title，也不建立task registry、title routing或命名历史账本。

### 2.10 跨角色专业基线

“顶级”“最佳”必须由可观察证据体现，不作为自我评价。所有专业task都必须：

- 先读取当前truth、代码、约束和既有证据，再下结论；时效性或专业事实不确定时查阅primary/official sources；
- 对非显然选择比较现实可行方案，选择在正确性、简洁性、可靠性、性能、维护成本和交付风险之间最适合当前约束的方案，而不是追求抽象意义上的“最先进”；
- 明确事实、推断、假设和待验证项；不得把猜测写成结论；
- 在交付前执行角色专属self-review，并用可复现命令、输入、literal结果和失败条件证明结论；
- 发现自身专业能力不足以覆盖security、privacy、concurrency、performance、accessibility等高风险领域时，要求相应qualified review，不以泛化检查代替；
- 每次变更必须改善或至少保持整体architecture/code/test health；无法证明时不得宣称完成。

### 2.11 v5 in-flight 兼容

本v6 truth merge是唯一cutover边界。任何在cutover前已经取得Human-confirmed card/envelope，或已经创建exact owner、task、branch/worktree、candidate、PR、activation、merge或cleanup binding的work item，均为v5 in-flight work。它的exact frozen v5 binding在该work item内优先于v6；v6不得重命名、改派、重建、重新解释或使其active card、owner、parent/callback和资源失效。

以下active v5路径分别保持到自己的terminal/cleanup边界：

- Direct保持原Change Set、artifact owner、PR、merge、main validation和cleanup binding到`CLOSED`；
- IDT/CDT、Proposal、UD design integration和canonical editorial保持原source、parent/callback、`executionIntent`、`executionShape`、activation、merge和各owner cleanup binding；已合并设计不得按v6重新解释其预授权执行或返回目标；
- SL、FL、IT和RI保持原parent/child topology、candidate、finding、PR、ordered merge、stage acceptance和分层cleanup binding，直到对应owner graph终止；
- 已发出的merge、cleanup、abandonment或Recovery卡继续按原v5失效规则执行，不因v6 merge自动换卡。

v5 owner graph完成terminal/cleanup后，后续独立意图从v6 status入口开始。cutover后的新增scope或独立交付物不得嫁接到v5 binding；原owner缺失或资源失配时，只能在保护原证据和资源的前提下使用Human-confirmed Recovery。新普通讨论不创建IDT；新稳定设计只使用Design Owner。兼容规则不建立迁移账本，cutover与exact Git/task/resource binding就是判定依据。

### 2.12 运行可靠性 revision in-flight 兼容

本revision truth merge前已取得Human确认或已创建exact owner/task/ref/worktree/candidate/PR/merge/cleanup binding的v6 work item，继续按其frozen binding到terminal/cleanup边界；moving-main、queue、batch cleanup和remote driver不得重新解释已发出的merge/cleanup卡。相同scope内补齐effective execution profile、auto-review或approval telemetry属于environment repair，可在原binding下自动采用；任何owner、scope、remote action或cleanup resource变化仍使用原v6失效规则或new Human card。

## 3. 主数据流

### 3.1 Status 与入口选择

每次状态变更前读取exact task/owner、active design locator、branch/worktree、candidate、PR、`origin/main`、checks和cleanup status，只显示当前合法动作并标记一个建议项，不默认解释原因。

普通讨论直接继续；同一聚焦主题优先由当前task继续并可在确认后成为Design Owner；已有Workspace恢复exact Design Owner；独立/并行/长期主题才新建Design Task。明确小修改可选择Direct；稳定语义或多feature交付进入Design Owner/UD或常规协同。

### 3.2 Direct 数据流

```text
Human -> status options -> Direct owner -> focused change/verification -> PR_READY
      -> Human merge -> main validation -> owner cleanup
```

Direct owner闭合一个有界Change Set，不创建Design Owner、SL、FL、IT、RI、Workspace或packet。所有main变更仍使用owner branch、PR、required CI与Human merge。

Canonical纯编辑是受控例外：source Direct owner只提供classification、exact files/hunks、evidence和source notice target；UD拥有canonical edit、design branch/PR/merge/main validation与自身cleanup。UD必须在创建integration资源前验证classification；失效时以`EDITORIAL_CLASSIFICATION_INVALID`返回exact source Direct owner，列出invalidating hunk/finding和证据，source重新展示Design或继续讨论，禁止隐式转换为Proposal。若资源创建后因输入变化导致classification失效，UD冻结并只按独立abandonment/cleanup确认处理自己的exact资源。

### 3.3 Design 到 delivery 的唯一正向路径

所有语义Proposal共用相同的Design Owner、UD审核、design PR、Human merge与main CI路径；`proposalEntryType`只在`MAIN_CI_PASSED`后决定合法后继：

```text
ordinary discussion
  -> PROPOSAL_PREVIEW_READY (read-only) -> Human approve
  -> Design Owner writes exact Proposal -> UD_REVIEW -> UD_INTEGRATION_VERIFIED
     -> UD_EXECUTES | UD_BOUND_HOST_EXECUTES -> UD_POST_WRITE_VERIFIED
  -> DESIGN_PR_READY -> Human merge -> UD_PRE_MERGE_REVALIDATED
     -> UD_EXECUTES | UD_BOUND_HOST_EXECUTES -> UD_POST_WRITE_VERIFIED
  -> TRUTH_MERGED -> MAIN_CI_PASSED
     | NEW_DESIGN -> ACTIVATION_DECISION_READY in UD
         | DEFER (recommended when NO_EXECUTION) -> EXECUTION_DEFERRED
         | CONTINUE_DESIGN -> exact Design Owner (new revisionEpoch)
         | START_DIRECT -> HANDOFF_PENDING -> HANDOFF_VERIFIED -> Direct owner
         | START_FEATURE -> HANDOFF_PENDING -> HANDOFF_VERIFIED -> FL
         | START_STAGE -> HANDOFF_PENDING -> HANDOFF_VERIFIED -> SL -> FL
     | EXISTING_DELIVERY_DESIGN_GAP -> DESIGN_GAP_RESOLVED
         -> exact existing delivery owner -> DELIVERY_RESUME_VALIDATED
         -> exact affected owner resumes
         | guard mismatch -> DELIVERY_REPLAN_REQUIRED -> Human
     | ACTIVE_ACTIVATION_DESIGN_REVISION -> ACTIVE_ACTIVATION_REVISION_RESOLVED
         -> exact original activation owner -> EXACT_ACTIVATION_CONTINUATION_VALIDATING
         | guards pass -> same pending child profile repair -> HANDOFF_VERIFIED
         | guards fail -> ACTIVATION_CONTINUATION_INVALID -> ACTIVATION_REPLAN_REQUIRED
```

`NEW_DESIGN`的`MAIN_CI_PASSED`自动进入`ACTIVATION_DECISION_READY`，UD主动显示动态执行建议；Human不需要回到请求来源或Design Owner再次说implement。`EXISTING_DELIVERY_DESIGN_GAP`不进入activation，也不创建Direct/FL/SL：UD把exact resolution binding返回`originDeliveryOwnerTaskId`，原owner验证continuation guards后恢复受影响lane。`ACTIVE_ACTIVATION_DESIGN_REVISION`同样不进入activation card：UD仍是exact activation owner，main CI后创建old truth -> new canonical merge的resolution overlay，复核原root authorization、handoff binding与pending child后只恢复同一handoff；guard失败进入一次`ACTIVATION_REPLAN_REQUIRED`。`CANONICAL_MERGED`仍作为coverage/cleanup通知发送给exact Design Owner；通知不转移delivery ownership。Editorial入口不进入上述任一分支：main CI后UD发送`CANONICAL_EDITORIAL_MERGED`给exact source Direct owner并进入`UD_CLEANUP_READY`。

### 3.4 Typed routing

- `REVISION_REQUIRED`：UD -> exact Design Owner；
- `EDITORIAL_CLASSIFICATION_INVALID`：UD -> exact source Direct owner，仅返回失效分类、invalidating hunks/findings和证据；
- `CANONICAL_MERGED`：UD -> exact Design Owner，仅Proposal coverage和Design Owner cleanup eligibility；
- `CANONICAL_EDITORIAL_MERGED`：UD -> exact source Direct owner，仅editorial coverage和source Change Set closure；
- `ACTIVATION_DECISION_READY`：仅`NEW_DESIGN`保留在UD并询问Human；
- `ACTIVE_ACTIVATION_REVISION_RESOLVED`：UD -> exact original activation owner，绑定old truth -> new canonical merge、main CI、原activation/root/handoff/pending-child fingerprints和resolution fingerprint，不创建新owner或新activation；
- `ACTIVATION_CONTINUATION_INVALID`：continuation validator -> exact activation owner，只列出失效guard和保留资源；
- `ACTIVATION_REPLAN_REQUIRED`：exact activation owner -> Human，仅在active-activation continuation guard失败时显示一次保留原pending child优先的replan卡；
- `DESIGN_GAP_RESOLVED`：UD -> exact `originDeliveryOwnerTaskId`，携带exact canonical merge SHA、main CI结果、old truth SHA -> new truth SHA、`affectedOwnerTaskIds`与resolution fingerprint，不转移delivery owner；
- `DELIVERY_RESUME_VALIDATED`：exact existing delivery owner -> exact `affectedOwnerTaskIds`，只恢复受影响lane；
- `DELIVERY_REPLAN_REQUIRED`：exact existing delivery owner -> Human，仅在continuation guard失败时展示保留原owner优先的replan选项；
- `DESIGN_CONTINUATION_REQUIRED`：UD -> exact Design Owner，开启new revisionEpoch；
- `UD_REMOTE_EXECUTION_RESULT`：一次性host executor -> exact issuing UD，只返回binding id、literal command/result、exit status和remote readback；不转移owner、不自行发布`DESIGN_PR_READY`、`TRUTH_MERGED`或任何canonical状态；
- `ASSIGNMENT_RESULT`：IT/RI/FL -> direct execution parent；
- `FEATURE_REPLAN_REQUIRED`：FL -> exact parent SL，作为`ASSIGNMENT_RESULT`的有界结果；只证明当前scope已经包含多个可独立candidate、Feature RI、PR和安全合入`main`的交付物，保持原FL及其资源并暂停新扩围，由SL在root Stage authorization与delegation/WIP ceiling内自动重划；只有真实扩围或不可自动处理的冲突/业务决定转为相应Human gate；
- `RUNTIME_PROFILE_LAUNCH_UNAVAILABLE`：pre-create bootstrap executor -> exact creating owner，证明bound host/launcher不能为planned child原子注入exact profile；不创建child task或delivery资源，由creating owner选择满足能力的host/launcher并对同一transition幂等恢复；
- `EXECUTION_ENVIRONMENT_NOT_READY`：proposed delivery owner -> exact creating parent，仅报告已声明能力未被执行环境兑现的证据并保留原owner/binding；
- `EXECUTION_PROFILE_DEFECT`：handoff后exact current owner -> exact creating parent/current owner，报告confirmed capability仍触发的platform approval、effective profile与operation category；保持owner/candidate/state并自动修复、迁移或重建profile/host，不转成Human gate；
- `PENDING_CHILD_TERMINATION_REQUIRED`：exact creating owner -> Human，仅用于已经创建、尚未`HANDOFF_ACCEPTED`且平台不支持same-task live profile repair的child；在独立终止/归档确认和无resource readback完成前禁止replacement owner；
- `PERMISSION_EXPANSION_REQUIRED`：root handoff前返回exact activation owner，child accept前返回exact creating delivery parent，handoff后保留在exact current delivery owner；只承载超出confirmed capability/scope的合并请求，不回退祖先task；
- `REMOTE_DRIVER_RESULT`：versioned remote driver -> exact issuing artifact owner，只返回binding、checkpoint、remote receipt/readback和literal result；driver不成为owner，也不自行发布workflow状态；
- `BUSINESS_DECISION_REQUIRED`：SL/FL -> exact decision owner，仅阻塞性非设计决定；
- `DESIGN_GAP`：exact delivery owner -> UD -> exact Design Owner或Human-confirmed Design Revision Task；消息必须保留完整existing-delivery provenance，设计子流程不接管原delivery ownership；
- `STATUS_NOTICE`：只通知explicit informed tasks，永不转移owner。

`requestOriginTaskId`只作provenance；`directParentTaskId`只适用于execution tree。不存在将routine implement、milestone或handoff返回祖先/initiating task的通用callback。

## 4. Proposal、activation 与受控委派

### 4.1 Proposal Preview 与 Proposal schema

形成稳定设计时必须先在当前会话展示完整只读`PROPOSAL_PREVIEW_READY`，此时不创建task、branch/worktree、Workspace、commit或remote资源。Preview至少绑定：

```text
previewFingerprint
baseCommit
objective
problemAndDecisions
stateAndTypedRoutes
intendedCanonicalFilesAndChanges
protectedScope
validationAndStopPoint
```

Human确认exact Preview后，Design Owner才创建已列明资源、按preview写入、验证、形成Proposal commit并提交UD。该一次确认同时是Proposal submission授权；不在commit完成后重复询问。实际diff、base、scope、owner、规范结论或验证结果偏离preview时立即停止，旧确认失效并展示刷新后的完整Preview。

Proposal至少绑定：

```text
proposalId = designOwnerTaskId + proposalCommit
proposalEntryType = NEW_DESIGN | EXISTING_DELIVERY_DESIGN_GAP | ACTIVE_ACTIVATION_DESIGN_REVISION
designOwnerTaskId
baseCommit
proposalCommit
previewFingerprint
rootConfirmationFingerprint
scopeFingerprint
transitionId
expectedState
stateVersion
intendedCanonicalFiles
canonicalTruthDomains = ARCHITECTURE | ADR | CONTRACT | GOVERNANCE
deliveryHint = UNKNOWN | LIKELY_NONE | NO_EXECUTION | LIKELY_DIRECT | LIKELY_FEATURE | LIKELY_STAGE
decisionOwnerTaskId = OPTIONAL
```

`EXISTING_DELIVERY_DESIGN_GAP`还必须逐字段继承创建该design subflow的SL/FL binding：

```text
originDeliveryOwnerTaskId
directExecutionParentTaskId
stageKey = OPTIONAL
featureKey = OPTIONAL
designGapFingerprint
affectedOwnerTaskIds
preservedOwnerTaskIds
stageStateVersion = OPTIONAL
stagePacketFingerprint = OPTIONAL
originalAuthorizationFingerprint
resourceSetFingerprint
returnTargetTaskId
```

`ACTIVE_ACTIVATION_DESIGN_REVISION`必须逐字段继承尚未完成handoff的原activation binding：

```text
activationOwnerTaskId
directExecutionParentTaskId
activationTransitionId
rootAuthorizationSha256
rootAuthorizationFingerprint
rootAuthorizationStateVersion
handoffBindingSha256
handoffBindingFingerprint
handoffBindingStateVersion
pendingChildTaskId
pendingChildExpectedTitle
pendingChildExpectedState = HANDOFF_PENDING
priorTruthBaseline
activationResourceSet
originalScopeFingerprint
originalCapabilityFingerprint
originalTopologyAndWipFingerprint
```

root authorization、handoff binding与pending child保持immutable；Design Revision使用独立new stateVersion。任何activation owner/parent/transition、两类SHA/fingerprint、各层stateVersion、pending child identity/state/resource、scope/capability/topology/WIP或prior truth漂移均使automatic continuation失效，不能把该entry重解释成`NEW_DESIGN`。

这些字段来自发起design gap时的exact delivery owner，Design Owner只能复读和绑定，不能删除provenance、把原owner降为evidence source、选择replacement owner，或把active Stage/Feature包装成new delivery。design subflow期间原SL/FL保持delivery ownership，Stage/Feature Packets、branches/worktrees、PRs、candidates和仍有效evidence全部保留；只暂停affected lane，未受影响work可按原authorization继续，所有相关cleanup都不合格。

`previewFingerprint`是Human看到的完整Preview exact UTF-8 bytes（LF换行且以一个LF结尾）的SHA-256。`scopeFingerprint`是按key排序、无多余空白的UTF-8 JSON对象`{intendedCanonicalFiles, semanticChanges, protectedScope}`的SHA-256。`rootConfirmationFingerprint`是同样规范化的JSON对象`{issuingTaskId, cardIndex, stateVersion, previewFingerprint, baseCommit, scopeFingerprint, designOwnerTaskId, stopPoint, confirmationResult}`的SHA-256，其中`confirmationResult`必须为`HUMAN_CONFIRMED`。revision必须使用new card index、new transition和new root confirmation fingerprint，并形成append-only Proposal commit。

Design Owner→UD的Proposal envelope必须逐字段携带上述指纹和state/transition binding。UD先验证Proposal commit的parent/base、diff与Preview scope、source owner以及三类fingerprint；任一缺失或不一致即返回`REVISION_REQUIRED`。相同transition与完全相同binding只复用原结果；同一transition出现不同commit、fingerprint、scope、owner或state时拒绝replay，且不创建integration资源。

`deliveryHint`只供post-merge评估，不预授权、禁止或固定实现；本治理Proposal可使用`NO_EXECUTION`明确表示合并本身没有delivery工作。Proposal只承载稳定设计真相；Human确认Preview后，Design Owner形成并提交exact Proposal，UD随即审核。有blocker时返回`REVISION_REQUIRED`；接受时UD拥有canonical integration branch/worktree、验证、push和design PR并停止于`DESIGN_PR_READY`。merge、`NEW_DESIGN` delivery activation、failed continuation guard的replan和cleanup是独立Human边界；exact existing-delivery resume与exact active-activation revision continuation沿用各自原authorization。

### 4.2 Post-merge assessment

Human确认design PR merge且exact main CI成功后，UD先按`proposalEntryType`分流。

`NEW_DESIGN`重新读取final truth、acceptance、依赖、repository status和active resources，并推荐：

- `Direct`：一个owner、一个有界Change Set、无独立feature协调；
- `SINGLE_FEATURE`：一个独立验收结果和一个FL integration lane；
- `DELIVERY_STAGE`：两个或更多独立feature，存在依赖/order或stage acceptance；
- `NO_EXECUTION`：当前无实现工作。

`NO_EXECUTION`是UD的assessment/recommendation，不是transition state。每次card恰好标记一个建议：推荐实现时建议`START(shape)`；当前无实现工作时建议`DEFER`。Human选择暂不执行后才进入`EXECUTION_DEFERRED`；后续在UD提出implementation时，UD从exact truth、最新repository status和new stateVersion重新进入`ACTIVATION_DECISION_READY`并发new card，旧card不得复用。其他task只把该意图定向给UD，不自行执行。即使`deliveryHint=LIKELY_NONE`或`NO_EXECUTION`，UD也必须显示dynamic post-merge card。

`EXISTING_DELIVERY_DESIGN_GAP`跳过shape assessment和activation card。UD发布`DESIGN_GAP_RESOLVED`给exact `originDeliveryOwnerTaskId`；原owner只在以下guards全部成立时自动compare-and-set到`DELIVERY_RESUME_VALIDATED`：

- exact owner、parent/return target和task identity仍匹配，Stage/Feature未terminal、未cleanup；
- objective、protected scope、execution capabilities与owner topology和原authorization完全相同；
- Stage/Feature Packets及bound branch/worktree/PR/candidate/resource set精确存在；
- design-gap resolution已Human-confirmed merge，exact canonical main CI通过，resolution覆盖`designGapFingerprint`；
- Human没有对该delivery发出pause、defer、abandon或replacement指令。

上述guards成立后，原SL必须fetch latest `origin/main`，验证resolution canonical merge是当前remote main的祖先，将Stage `integrationBase`更新到latest main，重新读取冻结truth，并从latest main刷新Stage verification worktree后形成affected-test matrix。affected FL必须fetch同一latest main，以append-only merge commit合入自己的feature branch、更新`integrationBase`并追加remediation candidate后才能继续；禁止rebase或改写旧candidate。unaffected FL不机械合并或重复测试，其candidate/evidence在exact evidence key仍有效时保留，最终merge admission仍验证latest main。

全部成立时，该动作是既有Human authorization的continuation，不新增Human gate。任一失败进入`DELIVERY_REPLAN_REQUIRED`，禁止静默创建新SL/FL；Human只选择继续原owner、明确终止旧owner后创建replacement、暂缓或查看证据。

`ACTIVE_ACTIVATION_DESIGN_REVISION`跳过shape assessment和activation card。UD在exact design merge与main CI后创建`ACTIVATION_REVISION_RESOLUTION` overlay，保持原root authorization与handoff binding不可变，只绑定`priorTruthBaseline -> newCanonicalMerge`、exact changed canonical files、main CI、resolution fingerprint与new continuation state/version。只有以下guards全部成立时，才发布`ACTIVE_ACTIVATION_REVISION_RESOLVED`并恢复exact pending child：

- exact activation owner与direct parent仍匹配，原activation transition未变；
- root authorization与handoff binding的SHA/fingerprint/stateVersion完全匹配；
- pending child task/title/parent仍精确，保持`HANDOFF_PENDING`，未接受、未验证、未成为delivery owner；
- 没有Stage Packet、Stage/Feature branch/worktree、FL/IT/RI、candidate或其他role-owned resource，pending child worktree clean；
- prior truth是new canonical main祖先，new canonical merge精确包含该Proposal且main CI通过；
- 原objective、scope/protected scope、capabilities、topology、delegation/WIP ceiling、allowed resources与Human activation fingerprint未变；
- Human未pause、defer、abandon、terminate、archive或authorize replacement。

guards通过后，same-task live profile repair优先，且fresh target turn必须完成4.5的target-session readback/smoke；不支持时只进入`PENDING_CHILD_TERMINATION_REQUIRED`，在Human独立确认与`PENDING_CHILD_TERMINATED_VERIFIED`前禁止replacement。任一guard失败返回`ACTIVATION_CONTINUATION_INVALID -> ACTIVATION_REPLAN_REQUIRED`，保留exact pending child和可识别资源，不重新发`ACTIVATION_DECISION_READY`。

### 4.3 Authorization envelope 与 parent assignment

Human确认只绑定发卡task的exact state和card fingerprint。跨task分为：

1. Human authorization envelope：Design Owner -> UD、Direct editorial source -> UD、UD -> Direct/FL/SL、decision owner -> Recovery Design/FL；
2. parent assignment：SL -> FL/Stage RI、FL -> IT/Feature RI，仅在已确认拓扑内收窄scope；System Review只使用显式全系统scope和exact direct parent。

每个Human authorization envelope至少绑定：source task、target task/role、objective、scope/protected scope、固定语义`truthBaseline`、移动`integrationBasePolicy`、candidate、allowed resources、`executionCapabilities = NONE | BOUNDED_SET`、expected state、state version、root confirmation fingerprint、transition id、stop point和typed result。Design Owner→UD Proposal envelope还必须绑定exact `proposalEntryType`、`previewFingerprint`、`scopeFingerprint`、base/proposal commit和intended canonical files；`EXISTING_DELIVERY_DESIGN_GAP`还必须携带4.1列明的完整existing-delivery provenance；`ACTIVE_ACTIVATION_DESIGN_REVISION`必须携带4.1列明的exact activation/root/handoff/pending-child binding、各层stateVersion、prior truth与resource set；Direct editorial source→UD必须绑定classification fingerprint、exact files/hunks和source notice target。非delivery Proposal/editorial envelope使用`NONE`；UD→Direct/FL/SL和Recovery delivery envelope使用完成stop point所需的`BOUNDED_SET`。Stage root envelope还绑定child role topology policy、delegation/WIP ceiling与自动partition条件；parent assignment至少绑定其root envelope fingerprint及收窄后的同类字段。envelope不转发，assignment不扩权；child的effective set必须落在Human-confirmed root topology policy为该child role绑定的delegation/WIP ceiling内，而不是继承creating parent自身的effective set。

`UD_REMOTE_EXECUTION_BINDING`只用于exact UD需要独立host transport执行design remote mutation的情形，且必须在任何remote mutation前由issuing UD创建。它至少绑定issuing UD task、entry type、exact PR或待创建PR、base ref/SHA、head ref/SHA、允许的单一action、merge method、required checks、expected remote state、transition id、single-use nonce、invalidation conditions、stop point和`UD_REMOTE_EXECUTION_RESULT`返回目标。只有issuing UD可创建或替换binding；Design Owner、request origin、parent、其他task或Human转述确认均不生成remote authority。host只执行exact binding并返回literal result；issuing UD必须read-after-write后才能发布状态。缺少pre-binding、SHA/state漂移、nonce复用或先执行后补binding均属于owner-boundary violation，立即停止；事后review不修复该顺序。

### 4.4 Scope-bound execution capabilities

`executionCapabilities`是authorization envelope内的有界运行能力集合，分为owner实际可用的`ownerEffective`与只供confirmed child assignment取子集的`delegationCeiling`；后者不把child权限授予parent。它不是新role、命令层、长期permission service或逐条shell allowlist。创建owner的UD/SL/FL根据objective、acceptance、validation和repository标准自动选择最小充分集合；Human只在启动卡看到一行摘要，不逐项配置。声明集合必须由一个实际生效的project execution profile兑现；prompt、delegation message或`AGENTS.md`文字本身不产生OS、sandbox、network或credential权限。两部分至少按适用项绑定：

```text
filesystem = read roots, owner write roots, executable-bit paths, task temp roots
git = repository, owner refs/worktrees, allowed local actions, exact remote branch/PR actions
runtime = package/build/test commands, task-local processes, repository-declared services/containers
data = task-owned local/test databases, schemas, migrations and fixtures
network = approved destinations and purposes
credentials = bound secret references, never secret values
approval = profile name/fingerprint, reviewer mode, event source and zero-prompt acceptance
delegationCeiling = allowed child roles, topology, WIP and per-role capability ceilings
```

OES默认project profile必须按exact owner至少覆盖：当前worktree及解析后的Git common directory/worktree metadata、task temp和验证输出、必要package/build cache、repository-declared service/container/test database、localhost及批准域名；敏感文件、secret values、生产/共享数据、其他owner refs/worktrees、host/system privilege和destructive operations继续保护。残余interactive approval使用`approval_policy=on-request`与`approvals_reviewer=auto_review`；profile名称、effective roots/destinations和reviewer mode必须由target task从自己的当前session/turn读回验证。普通owner不得以全局unrestricted profile代替精确集合；prompt、静态profile/report、其他task telemetry或parent声明均不构成effective evidence。

该effective profile是`OWNER_SESSION_PROFILE`：在exact task、host、repository、owner worktree、toolchain、credential identity与permission profile未变化时持续复用，不为同一owner的每个build、service start、publish或verify重新安装、挂载或跑完整capability smoke。上述任一输入变化，或approval telemetry证明实际能力漂移时才使session profile失效并重建；action自身的SHA/ref/PR/main变化只使action binding失效，不使owner profile失效。

默认能力按owner边界解析：

- FL可写自己的FP、feature integration和assigned slice worktrees；可执行普通local Git操作、把latest `main` merge进owner branch、push exact feature branch并创建/更新自己的PR；可执行仓库标准package/generate/lint/build/test/E2E，启停repository-declared或task-isolated process/container，以及创建、迁移、seed和清理task-owned local/test database或schema；
- SL可写自己的Stage Packet和coordination resources，在confirmed root topology policy与delegation/WIP ceiling内自动创建或重划FL/Stage RI，读取exact FL candidates，并为stage acceptance运行相同类型的本地build/test、task-owned service/container和isolated test data；其capability set不授予产品代码写入、产品remote branch、PR或`main` merge；
- IT只继承一个Frozen Slice所需的worktree、commands、services、test data和network；RI默认继承read-only candidate，加上验证输出、task-owned test dependencies和evidence所需的更窄能力；
- repository标准服务优先使用project-local compose/script或隔离实例。共享开发、staging、production数据库和host-global service不归入默认集合。

scope内已绑定的能力自动执行，不产生逐文件、逐命令、逐次service start、逐次package/build/test或逐次owner Git/PR用户授权。handoff smoke必须实际执行并复读：owner file write、Git switch/add/commit或等价无害probe、标准build/test、task-owned service/database、localhost/network和evidence root；只检查配置文本不构成`HANDOFF_ACCEPTED`。正常路径`normalPermissionPromptCount=0`；计数使用Codex app/runtime approval event telemetry，不从task对话或parent消息推断。Unix executable bit只可在bound repository paths内调整。force-push、published history rewrite、其他owner资源、host/system privilege、protected directory、new secret、paid/irreversible external action、共享或真实业务数据，以及任何scope/protected scope扩大保持Human边界。

执行中发现多个真实缺口时先去重并形成一张`PERMISSION_EXPANSION_REQUIRED`卡；确认后使用new stateVersion替换capability binding。若操作已经在声明集合内却产生blocked operation或用户approval，归类为`EXECUTION_PROFILE_DEFECT`：立即记录event id/category/profile、保持owner/candidate/state/logs，由creating parent或current owner自动修复、重建或迁移profile/host并对同一transition幂等恢复。相同缺口不得再次展示给Human；平台仍未兑现时保持原状并选择满足集合的execution profile/host，不以全局unrestricted权限替代精确能力。

### 4.5 Pre-create profile 与 Two-phase handoff

1. 对`NEW_DESIGN`，UD冻结exact truth SHA、objective、scope/protected scope、recommended shape、acceptance、resources、execution capabilities、`roleType`、`expectedTitle`、`titleRuleVersion`、planned child identity和transition id；SL→FL/Stage RI、FL→IT/Feature RI按root envelope收窄同类字段；
2. Human确认root activation后，或parent形成无需新增Human gate的合法child assignment后，exact creating owner进入`RUNTIME_PROFILE_BOOTSTRAP_PENDING`，绑定planned child、exact host/launcher、repository/worktree、toolchain、credential identity、profile fingerprint、approval policy/reviewer、telemetry source、state/version与single-use create nonce；
3. launcher必须在task创建前证明支持把该exact profile原子注入planned child且禁止Full Access fallback，随后进入`RUNTIME_PROFILE_LAUNCH_READY`。不能证明时返回`RUNTIME_PROFILE_LAUNCH_UNAVAILABLE -> EXECUTION_ENVIRONMENT_NOT_READY`，保持creating owner且不创建task/resource；
4. 只有`RUNTIME_PROFILE_LAUNCH_READY`可按2.9创建exact Direct/FL/SL/IT/RI task。创建receipt必须绑定planned identity、实际task id、role/title、parent与nonce；创建结果不明确时先read-after-create，禁止第二次创建；
5. 新task进入`HANDOFF_PENDING`，在任何delivery写入前独立复读task identity/title与自己的当前session/turn profile，再验证binding、truth baseline、moving integration policy、owner、resource availability和allowed topology，并用无害smoke实际预检filesystem、Git metadata/remote、runtime/service、test data、network、credential references、approval reviewer和event telemetry；
6. target-session profile与声明集合精确匹配且`normalPermissionPromptCount=0`时记录`TARGET_SESSION_PROFILE_VERIFIED`并返回`HANDOFF_ACCEPTED`；identity不匹配返回`TASK_IDENTITY_INVALID`，effective profile或smoke不匹配返回`EXECUTION_ENVIRONMENT_NOT_READY`；
7. exact creating owner复核task identity、target-session profile fingerprint、literal smoke、approval telemetry与create receipt后compare-and-set `HANDOFF_PENDING -> HANDOFF_VERIFIED`并转移delivery ownership；只有此后新owner才可写文件或创建delivery Git资源。

pre-create launcher、create receipt或target-session验证中断时，相同transition与相同binding从最后read-after-write checkpoint恢复；planned/actual task、host、launcher、profile、worktree、toolchain、credential identity、nonce或state不匹配时fail closed。handoff前能力未兑现时creating owner选择满足集合的profile/host并幂等重试，不以全局unrestricted权限替代精确能力；已经创建但未接受的child只在平台支持same-task live profile应用且新turn实际读回成功时继续同一task。平台不支持same-task repair时返回`PENDING_CHILD_TERMINATION_REQUIRED`，Human单独确认终止/归档并验证无role-owned资源后才允许重新bootstrap replacement；不得静默创建duplicate owner。handoff后confirmed operation仍触发platform approval时使用`EXECUTION_PROFILE_DEFECT`并保持current owner。真实capability/scope扩大改用一张`PERMISSION_EXPANSION_REQUIRED`卡与new stateVersion。merge和cleanup不属于handoff授权；`EXISTING_DELIVERY_DESIGN_GAP`恢复原owner时不得进入该创建流程。

### 4.6 Transition protocol

每次mutation绑定`transitionId`、`expectedState`、`stateVersion`、`ownerTaskId`、`rootConfirmationFingerprint`、固定`truthBaseline`、当前`integrationBase`、冻结时`candidateBase`、candidate SHA、scope fingerprint、resource set和postcondition；Proposal mutation还绑定preview fingerprint。existing-delivery resume额外绑定`designGapFingerprint`、resolution transition/state、`originDeliveryOwnerTaskId`、`affectedOwnerTaskIds`、canonical merge SHA、原authorization与resource-set fingerprints及resume postcondition。`main`前进只刷新integration binding并按影响重验，不单独作废Human-confirmed objective/scope；truth或scope语义变化才换卡。执行前compare-and-set，执行后read-after-write。remote driver每个动作还原子记录`REMOTE_PREFLIGHT_VERIFIED -> REMOTE_MUTATION_RECORDED -> REMOTE_VERIFICATION_PENDING -> REMOTE_VERIFIED`，恢复时先读remote truth再决定下一步。相同transition与相同binding只复用原结果；同id不同binding或state/owner/scope/fingerprint不符时fail closed。

### 4.7 Execution profile 与 remote driver bootstrap

运行可靠性truth合并后的首个实现不能依赖尚未交付的profile/driver。4.5的pre-create bootstrap适用于任何新Direct、SL、FL、IT或RI，而不是只在创建FL前执行：exact creating owner先使用已存在的credentialed host/launcher准备OES project profile、auto-review与approval telemetry，只有launcher达到`RUNTIME_PROFILE_LAUNCH_READY`后才创建task；task创建后仍必须用自身当前session完成`TARGET_SESSION_PROFILE_VERIFIED`与actual smoke。pre-create readiness只证明launcher可原子注入，不能用静态文件或无关telemetry替代target-session evidence。该bootstrap只兑现已确认capability set，不扩大产品scope或remote authority，也不形成长期profile service或registry。

平台启动路径不能注入exact profile时以`RUNTIME_PROFILE_LAUNCH_UNAVAILABLE`证据进入`EXECUTION_ENVIRONMENT_NOT_READY`，不创建普通Full Access owner；creating owner可在同一binding下选择满足集合的host/launcher。已存在但未接受的pending child保持exact task、clean worktree与无resource状态；canonical修复后优先same-task live repair，unsupported时必须先通过独立Human termination/archival boundary和无resource readback，记录`PENDING_CHILD_TERMINATED_VERIFIED`后才可创建replacement。

交付versioned remote driver的首个exact feature candidate可使用cutover前已经存在且由artifact owner精确绑定的v6 remote transport完成一次publish/merge；不得为bootstrap新生成另一套长runner，也不得扩展action。candidate进入main、main CI和driver self-tests通过后记录`REMOTE_DRIVER_READY`，此后所有新remote mutation必须使用versioned driver。merge-group CI未ready时先使用driver的串行latest-main admission；native queue规则只在workflow/ruleset验证后切换。bootstrap marker只保留当前readiness，不建立历史账本或长期service。

versioned driver的每个`publish-pr | verify-pr | merge-pr | verify-main | cleanup`动作只使用引用exact `OWNER_SESSION_PROFILE` fingerprint的single-use action binding，并绑定candidate/head、expected main、exact branch/PR、nonce、失效条件与stop point。read-only verify不重复owner capability smoke；process/network中断后从最后remote checkpoint继续，已由remote truth证明完成的push、PR create或merge不得再次执行。只有owner session profile输入变化时才重建profile或其不可变载体。

## 5. Active locators

### 5.1 UD Locator

UD只通过仓库局部runtime pointer定位：

```text
$(git rev-parse --path-format=absolute --git-common-dir)/codex-runtime/ud-target.json
```

它只含schema version、repository root、exact thread/host id和expected title。atomic写入；使用前验证repository、task、cwd和title；无效时报告错误，不按标题搜索或创建第二个UD。

### 5.2 Active Design Locator

需要跨task恢复的active Workspace可使用：

```text
$(git rev-parse --path-format=absolute --git-common-dir)/codex-runtime/design-targets/DESIGN_KEY.json
```

它只含repository root、design key、exact owner task、Workspace、branch/worktree和state version；不跟踪、不保留历史、不轮询。atomic create/update，使用前exact验证，cleanup时compare-and-delete。同一design key多个有效owner或locator不匹配时停止；owner缺失时只展示Human-confirmed Recovery Design，不按标题猜测。

## 6. Delivery Stage、Feature 与 active packet

### 6.1 执行形状

- 一个不可独立合并、需要共同原子验收的跨服务能力：一个 FL、多个 slices、一个 Feature RI、一个 PR。
- 多个可独立安全合并且共享阶段目标的 feature：一个 SL 管理多个 FL；每个 FL 独立 branch/worktree/FP/RI/PR/merge。
- 任一 FL PR 必须独立、安全、向后兼容地进入 <code>main</code>。
- feature 写路径或共享 contract scope 重叠时，按依赖顺序执行；无法保持独立安全时合并为一个 FL。
- SL 启动 FL 前检查 active FP、允许写路径、protected scope、contract/shared scope 和依赖，不接管未知或已有 owner 的资源。
- “涉及服务多”本身不决定FL数量；独立验收、candidate、RI、PR与安全合入边界决定FL，内部实现slice决定IT。已有FL运行中不再满足该边界时只通过`FEATURE_REPLAN_REQUIRED`改拓扑，不静默扩大一个FL或由FL创建sibling owner。

### 6.2 Stage Packet

一个 SL 对应一个 Stage Packet，逻辑路径：

~~~text
docs/plans/stages/STAGE_KEY.md
~~~

Stage Packet 只存在于 SL 的本地 stage coordination branch/worktree，只记录：

- objective；
- scope 与 protected scope；
- exact decision owner id（可选，仅用于阻塞性非设计决定）；
- canonical truth baseline；
- FL exact references、允许范围和依赖；
- exit criteria；
- blocker 与 current state。

Stage Packet与task稳定artifact root中的current evidence manifest共同构成恢复入口。manifest只原位覆盖当前owner、role、branch/worktree、truth/integration base、candidate、dependency/resource fingerprints、有效/失效evidence、open findings和next legal action；不保存时间线、聊天或历史结果，cleanup时删除。

字段原位覆盖。它不保存聊天、时间线、task/thread registry、watcher 状态、IT candidate 细节或 FP 副本。Stage Packet 不 push、不创建 PR、不合入 <code>main</code>。

### 6.3 Direct Change Set 与续作

一个 Direct owner 同时只拥有一个 Change Set，内部绑定 `changeSetKey`、objective、scope/protected scope、owner task、artifact owner、branch/worktree、candidate、PR、state 与 scope fingerprint；不创建 repository packet或第二状态表。普通Direct的artifact owner等于Direct owner；`CANONICAL_EDITORIAL_PATCH`的artifact owner固定为UD，source Direct owner的branch/worktree/candidate/PR字段为`NONE`。

同一目标、owner、protected scope 和独立交付物未变化时，任何后续 turn 恢复 exact owner task与现场：PR前继续原 branch；candidate/PR公开后只追加 commit并使旧 review/check失效；post-merge validation失败仍由原 owner创建 corrective PR。成功 merge、main validation和cleanup后的新要求，或 objective/owner/protected scope/独立交付物变化，形成新 Change Set。范围扩大但仍是单一职责时在原 task replacement scope；扩展为多个独立 feature时升级 Collaborative。

### 6.4 Feature Packet 与 slices

一名 FL 对应一个 active FP。feature 级 Git 指针只记录 <code>truthCommit</code>、<code>baseSha</code>、<code>integrationBranch</code>、<code>worktreeKey</code>、<code>pullRequest</code>、<code>mergeSha</code> 与 <code>cleanup</code>；每个 slice 只记录：

- <code>sliceId</code>；
- scope 与 protected scope；
- dependency；
- acceptance；
- review mode；
- current candidate；
- current state。

slice 状态只使用：

~~~text
READY -> RUNNING -> CANDIDATE_READY -> ACCEPTED
~~~

状态原位覆盖，不追加历史。只有 FL 写 FP；IT/RI 只返回 SHA 与结果。超过约 5–8 个 slices、FP 超过约 250–300 行、存在可独立验收波次或长期等待时，应拆为可独立 feature，并在需要共同阶段目标时由 SL 协调。

若超限但所有slice仍必须共同原子验收，FL使用多个bounded IT并行而不拆FL；若至少两个结果可以独立candidate、Feature RI、PR和安全合入`main`，FL返回`FEATURE_REPLAN_REQUIRED`，由SL自动处理。该结果必须绑定exact SL/FL、Stage/Feature key、old topology、建议的每个sibling FL scope/write set/dependency/acceptance、completed slices/commits/candidate/evidence、delegation/WIP ceiling、现有资源、state/version与invalidation conditions；原FL保持owner并只暂停新扩围，不丢弃已完成slice/evidence。SL先复核独立交付物证明：仍成立且全部new scopes、owners、capabilities与WIP落在root Stage authorization/delegation ceiling内时，自动冻结原FL提取范围、创建sibling FL并完成handoff；只有new FL `HANDOFF_ACCEPTED`且exact commit/evidence readback通过后才从原FL scope移除，禁止瞬时双owner。复核证明仍是一个原子feature时，使该typed result失效并由原FL在既有ceiling内自动调整bounded IT。真实扩围使用`PERMISSION_EXPANSION_REQUIRED`，owner/write冲突或阻塞性业务取舍使用既有typed route；均不把常规调度本身转成Human gate。

## 7. Stage 生命周期、并行与 review

### 7.1 Stage 生命周期

~~~text
STAGE_AUTHORIZED
  -> FL_COORDINATION
  -> STAGE_REVIEW
  -> ORDERED_QUEUE_ADMISSION
  -> MAIN_STAGE_ACCEPTANCE
  -> STAGE_CLEANUP_AUTHORIZED
  -> FL_CLEANUP_DISPATCHED
  -> FL_CLEANUP_VERIFIED
  -> STAGE_CLEANUP_PR_VERIFIED
  -> CLOSED
~~~

- <code>STAGE_AUTHORIZED</code>：Stage Start 绑定有效，SL 创建本地 Stage Packet。
- <code>FL_COORDINATION</code>：按依赖与运行容量启动 ready FL。
- <code>STAGE_REVIEW</code>：用精确 FL candidate 和 review bundle 做组合验证。
- <code>ORDERED_QUEUE_ADMISSION</code>：每个 FL 分别取得 merge 确认并按依赖顺序进入latest-main merge queue或等价串行admission。
- <code>MAIN_STAGE_ACCEPTANCE</code>：全部合并后，SL 在最新 <code>main</code> 执行 exit criteria。
- <code>STAGE_CLEANUP_AUTHORIZED</code>：SL展示一张绑定全部terminal FL、main验证、删除/保留资源及cleanup-only PR的批量卡，Human确认一次。
- <code>FL_CLEANUP_DISPATCHED</code>：SL向每个exact FL发送同一root binding的收窄`CLEANUP_AUTHORIZED`，各FL只清理自己的exact资源。
- <code>FL_CLEANUP_VERIFIED</code>：SL验证所有`CLEANUP_DONE`；partial failure只保留失败资源并继续同一binding。
- <code>STAGE_CLEANUP_PR_VERIFIED</code>：SL只删除本Stage已terminal的Feature Packets，经一个cleanup-only PR、required CI、卡内已授权Merge Commit和main复测完成。
- <code>CLOSED</code>：SL 本地 Stage Packet、coordination/verification 资源及cleanup-only资源已清理，SL 已 archive。

### 7.2 FL 里程碑与容量

FL 有 parent SL 时只主动返回：

- <code>BLOCKED</code>：阻塞原因、owner 与所需决定；
- <code>PR_READY</code>：完整feature candidate与feature review已通过，owner branch已push，Draft PR的required CI已通过；该状态不授予merge；
- <code>READY_FOR_STAGE_REVIEW</code>：精确accepted candidate和Stage Review bundle已就绪；
- <code>MERGE_READY</code>：无parent SL时独立gates已通过，或有parent SL时该exact candidate的Stage Review已通过；并已集成latest main、复核required CI与remote head，可展示merge卡；
- <code>MERGE_AUTHORIZED</code>：Human已确认exact PR/head的一次Merge Commit；authorization只允许进入latest-main queue/admission，不允许跳过merge-group验证；
- <code>QUEUED</code>：exact PR已进入latest-main merge queue或等价串行admission；该状态不转移candidate/PR ownership；
- <code>MERGE_GROUP_CI_PASSED</code>：包含latest <code>main</code>及全部前序已接纳结果的exact merge group通过required checks；只有该输入可执行已确认的Merge Commit；
- <code>MERGED</code>：merge SHA与main验证结果。

SL 不持续 poll/wait，不创建 watcher 或 registry。subagent 结果自动回唯一 parent；SL 仅在消息到达或 Human 恢复时推进，并按运行容量启动依赖 ready 的 FL。

SL或FL完成child assignment后立即记录`WAITING_ON_CHILD`、当前child、expected typed result和next legal action并结束turn；该marker只是Packet/manifest中的当前状态，不是长期scheduler。child使用`ASSIGNMENT_RESULT`返回exact direct parent后唤醒parent，parent复核binding再推进；不得为了等待结果保持活跃turn、占用执行槽或建立poll loop。多个child并行时，任一结果到达只处理该lane并重新计算WIP。

### 7.3 Review 与返工

FL 在 required slices 达到 <code>CANDIDATE_READY</code> 后按风险创建 Feature RI，并提供：

~~~text
featureKey
baseSha
sliceIds
candidateShas
featurePacket
acceptanceCommands
testEvidenceKeys
directExecutionParentTaskId
returnTargetTaskId
~~~

Feature RI是单个FL对一个exact feature candidate的独立复核，唯一task标题为`[RI] HUMAN_READABLE_FEATURE Feature Review`。每个FL同一时刻最多一个active Feature RI assignment；`FEATURE_RI_PENDING`、`FEATURE_RI_ACCEPTED`和`FEATURE_RI_REVISION_REQUIRED`分别表示等待复核、exact candidate通过和发现需返工。每个round绑定`reviewRound`、exact `candidateSha`、exact FL/RI task、`directExecutionParentTaskId`、`returnTargetTaskId`、dependency/scope fingerprint、test evidence keys、affected-evidence invalidation matrix、transition id与state version；RI结论只用`ASSIGNMENT_RESULT`返回exact FL。

Feature RI按以下唯一序列推进：

~~~text
CANDIDATE_READY[c]
  -> FEATURE_RI_PENDING[reviewRound=r, candidateSha=c]
     | FEATURE_RI_ACCEPTED[c] -> FEATURE_REVIEW_PASSED
     | FEATURE_RI_REVISION_REQUIRED[c] -> FL_REMEDIATION
         -> CANDIDATE_READY[c+1]
         -> FEATURE_RI_PENDING[reviewRound=r+1, candidateSha=c+1]
~~~

被拒candidate的append-only修复继续交给同一Feature RI task并递增`reviewRound`；new candidate使旧acceptance失效，并按affected-evidence matrix只复验受candidate、依赖、literal inputs、profile或command version变化影响的范围。相同task、round、candidate、transition和binding幂等复用原结果；相同transition但binding不同则fail closed；不得为同一FL并行创建duplicate Feature RI。

Feature RI的exact FL、`directExecutionParentTaskId`、feature key和return target在创建前固定，handoff后不得换绑到另一个FL、feature或candidate owner。另一个feature可复用fingerprint仍有效的测试证据，但不得复用Feature RI task身份、parent或typed-result route；跨FL复用RI task始终是`TASK_IDENTITY_INVALID`，不因旧binding或兼容规则变为有效。真正覆盖明确全系统scope的独立复核称为System Review，标题为`[RI] HUMAN_READABLE_SCOPE System Review`，不得作为普通Feature RI的共享替代者。

本命名契约canonical merge前已创建并取得exact binding的`Global RI` task、路径、状态与证据按原binding完成当前owner graph，不批量改名或重写历史；merge后的新Feature RI assignment只使用本节名称和状态。兼容只保护当时有效的同feature binding，不保护跨FL换绑、错误parent或错误return target。

Stage Review bundle 至少包含：

~~~text
stageKey
truthBaseline
orderedFeatureKeys
exactFeatureCandidates
featureReviewResults
dependencyAssumptions
stageAcceptanceCommands
reusableEvidenceKeys
~~~

测试证据key至少绑定`candidateSha`、依赖fingerprint、literal inputs、execution profile fingerprint、command/tool version和结果；这些字段全部相同时才可复用。`main`无关前进只运行基线与影响检查；changed paths、contract/dependency、输入、环境或命令版本变化时只使覆盖该风险所需的证据失效。Stage RI先形成affected-test matrix，再决定复用、focused组合或完整验收，禁止机械重复全量测试。design-gap resolution恢复时exact owner记录old truth -> new truth、fetch latest `origin/main`、验证canonical merge ancestry、刷新Stage `integrationBase`与verification worktree并形成affected-test matrix；unaffected candidates/evidence继续复用，affected evidence失效，affected FL将latest main append-only merge进feature branch、追加remediation candidate后只重跑受影响的Feature RI、CI与Stage Review。

验证固定使用三层路线：开发循环只跑changed package的focused unit/build与直接相关contract；candidate冻结前跑dependency/contract/L2/journey的affected matrix；Feature PR CI或Stage composition才运行一次full gate。evidence key还必须绑定candidate tree、dependency candidate集合、lockfile/toolchain、test config、environment和command version；全部相同即复用。RI先审candidate与key，只补跑缺失或失效风险，不重复owner已经证明且输入未变的full gate；main只改治理文档时不得重跑产品build、database或journey。

SL 可为 Stage Review 创建 clean-context Stage RI；SL 或 Stage RI 只读精确 candidates。失败路由：

- implementation finding：Stage RI → SL → corresponding FL → IT/RI；
- design gap：Stage RI → SL → UD → exact Design Owner/Design Revision Task → UD truth merge → exact original SL验证resume binding、同步latest `origin/main`并刷新Stage verification baseline → affected FL合入同一latest main；原SL及所有既有FL identity/resources在design subflow期间保留，只有affected lane暂停；
- non-design decision：SL → exact decision owner → `DECISION_RESOLVED` → SL；
- candidate 变化：旧 Stage Review 失效，重新验证新 exact candidate；
- 上游 merge 后：下游 FL刷新`integrationBase`并merge最新 <code>main</code>，追加 candidate commit，按affected-test matrix重跑自身 review/CI，并在 Stage Review 依赖受影响时重跑相应阶段验证；无关main前进不作废truth、scope、Human authorization或仍有效证据。

## 8. 自动与人工边界

所有mutation使用同一transition guard：读取exact state/binding，compare-and-set，执行一次，read-after-write并验证postcondition。非法顺序、重复但binding不一致、main/candidate漂移、owner/scope/resource冲突时fail closed并按真实status显示下一步。

自动进行：

- 普通讨论、status/evidence读取和exact resume；
- 已确认Direct scope内的修改、focused verification、push与PR创建，停止于`PR_READY`；
- confirmed Proposal的UD串行review、integration、verification、push和design PR创建，停止于`DESIGN_PR_READY`；
- Proposal design merge/main CI后UD发送`CANONICAL_MERGED`；`NEW_DESIGN`进入`ACTIVATION_DECISION_READY`，`EXISTING_DELIVERY_DESIGN_GAP`自动向exact existing delivery owner发送`DESIGN_GAP_RESOLVED`并验证resume guards，`ACTIVE_ACTIVATION_DESIGN_REVISION`自动向exact原activation owner发送`ACTIVE_ACTIVATION_REVISION_RESOLVED`并验证continuation guards；editorial merge/main CI后发送`CANONICAL_EDITORIAL_MERGED`并进入`UD_CLEANUP_READY`；
- Human确认`NEW_DESIGN` activation后，UD先完成pre-create profile bootstrap，达到`RUNTIME_PROFILE_LAUNCH_READY`才创建recommended Direct/FL/SL并执行target-session验证与两阶段handoff；existing-delivery resolution在原授权不变时不新增Human gate或owner；
- confirmed capability set内且由effective project profile兑现的owner worktree/file写入、owner local Git与允许的remote branch/PR操作、repository标准package/build/test、task-owned process/container/local test database和approved network操作；低风险platform approval由auto-review处理，正常用户权限弹窗为零；
- `main`前进时自动fetch并刷新`integrationBase`，验证已绑定canonical merge仍是latest `origin/main`祖先，按drift/affected-test matrix集成变化并复用仍有效证据；普通代码冲突返回artifact owner，只有新的冻结语义冲突才再次路由`DESIGN_GAP`；
- 所有remote mutation通过versioned remote driver执行并原子记录receipt/checkpoint；恢复先read-after-write，不重复已完成mutation；
- confirmed root topology policy/delegation ceiling内SL -> FL/Stage RI、FL -> IT/Feature RI的收窄assignment与自动topology adjustment；
- IT/RI typed result返回direct execution parent；
- SL/FL只启动dependency-ready、scope不冲突且WIP容量允许的work item；
- 完整feature candidate与feature review通过后，FL push自己的branch并创建Draft PR；无parent SL时独立gates可推进到merge-ready，有parent SL时只有exact Stage Review通过后才推进到merge-ready；Human merge授权后由merge queue或等价串行admission验证latest-main组合；
- Stage main acceptance后SL展示一次批量cleanup卡；确认后各FL self-cleanup，SL验证typed results并只为终态Feature Packets建立一个cleanup-only PR。

Human routine gate仅有四类：

1. 确认完整Proposal Preview，或创建/扩围其他有状态Direct/Feature/Stage owner、资源和execution capabilities；
2. 每个main merge；
3. `NEW_DESIGN`的UD post-merge delivery activation；existing-delivery continuation guard失败时改用一次`DELIVERY_REPLAN_REQUIRED`异常卡，active-activation revision guard失败时改用一次`ACTIVATION_REPLAN_REQUIRED`异常卡；
4. owner cleanup/abandonment；

阻塞性业务/语义决定只在确有选择时请求Human；精确Recovery接管只在原owner缺失或资源失配时请求Human。二者是异常处置，不新增每步process gate。一次Proposal Preview确认覆盖Design Owner写入、Proposal提交和UD创建design PR并停止于`DESIGN_PR_READY`；其他owner启动确认覆盖预列明拓扑、execution capability summary和stop point。ordinary discussion、moving-main无语义刷新、相同binding重试、已声明能力的environment/profile repair以及预授权child assignment不重复确认。任何scope内platform approval先记为`EXECUTION_PROFILE_DEFECT`并自动修复；执行中超出binding的真实需求才合并为一张`PERMISSION_EXPANSION_REQUIRED`卡，避免按命令、文件、service或Git action连续打断。

## 9. Git 资源、PR 与合并协议

本节是 OES task 的 Git 权限与执行唯一真相。GitHub ruleset 是服务端最后防线，task 仍必须执行本节本地前置检查、角色隔离、验证与清理约束。

仓库必须保持以下 server baseline；不一致即为 blocker：

- active ruleset <code>protect-main</code> 作用于默认分支 <code>main</code>，bypass 为空；
- 禁止删除和 force-push <code>main</code>，所有变更必须经 PR；
- required check 为 <code>Baseline Checks</code>，普通merge前branch必须更新到最新 <code>main</code>；merge queue启用时则对exact latest merge group运行同名required check，conversations必须解决；
- 仅允许 Merge Commit；Squash、Rebase、普通auto-merge与自动删除head branches关闭。merge queue只在exact Human merge authorization后由remote driver入队，不视为普通auto-merge；
- required approvals 在单一 Human reviewer 阶段为 0；增加 reviewer 时由 HDO 同步调整；
- Actions 默认只读，显式最小权限以 workflow 为准。

### 9.1 角色权限矩阵

| 角色 | Git资源 | 可写范围 | Remote/PR/main | cleanup |
| --- | --- | --- | --- | --- |
| HDO | 无强制资源 | 只作决定和gate确认 | 只作确认 | 只作确认 |
| Direct owner | 一个短期Change Set branch/worktree；editorial source无Git资源 | exact Direct scope；不写稳定语义 | 只push自己的branch/PR；Human确认后Merge Commit | main验证后清理自身资源 |
| Design Owner | 一个proposal branch/worktree和可选Workspace | confirmed Workspace/Proposal范围 | local-only；只交exact Proposal SHA给UD；不push/PR/merge或委派host remote mutation | canonical coverage或abandon后经确认清理自身资源/locator |
| UD | canonical design integration branch/worktree | Human-confirmed Proposal或`CANONICAL_EDITORIAL_PATCH` | design remote唯一owner；只push自己的design branch/PR；Human确认后由UD执行Merge Commit，或预先绑定一次性host transport | Proposal在`EXECUTION_DEFERRED`或`HANDOFF_VERIFIED`后、editorial在main CI与source notice后清理自身integration资源 |
| SL | 本地stage coordination/verification worktrees；terminal后一个cleanup-only branch/worktree | Stage Packet；verification只读candidates；cleanup-only只删本Stage终态FP | 产品delivery保持local-only；只在Stage Cleanup确认后push一个cleanup-only PR并执行卡内Merge Commit | 一张Stage卡触发各FL self-cleanup，之后清理自身与cleanup-only资源 |
| FL | feature integration和分配的slice worktrees | FP、integration lane和feature scope | feature candidate/review通过后push own branch并建Draft PR；merge-ready且Human确认后进入queue/admission并验证Merge Commit | standalone单独确认；有SL时使用Stage Cleanup收窄授权自清理 |
| IT | 使用FL分配资源 | 一个Frozen Slice | 不push/PR/merge | 不独立清理 |
| RI | 使用parent分配的clean context | 默认只读exact SHA | 不push/PR/merge | 不独立清理 |

同一task不兼任相互制衡角色。通知、decision owner或request origin不获得artifact ownership。

Git ownership与runtime capability彼此独立：capability set只让owner在本表既有Git边界内自主执行。FL的ordinary branch/worktree/commit/fetch与本地验证可预授权；exact owner-branch push和Draft PR create/update还必须满足完整feature candidate与feature review gate。SL产品coordination仍保持local-only，唯一remote例外是Human-confirmed terminal FP cleanup-only PR；IT/RI仍保持无remote write。任何capability都不授予direct push `main`、force-push、跨owner ref、未确认Merge Commit或未绑定cleanup。remote driver只执行issuing artifact owner的exact action，不取得ownership。

### 9.2 Branch 与 worktree 创建

普通Direct owner、Design Owner、UD、SL或FL 只能为自己拥有的资源创建 branch/worktree；editorial source Direct owner不创建Git资源，IT/RI资源由parent创建。创建前必须：

1. 读取 <code>git status --short</code>、<code>git worktree list --porcelain</code>、相关 local/remote refs；
2. fetch <code>origin main</code>，分别记录固定语义<code>truthBaseline</code>与初始移动<code>integrationBase</code>；
3. 确认目标 key、owner 和资源状态；未知既有资源列入 protected scope；
4. 列出 dirty worktree、未跟踪文件、未合并 branch 和其他 task commit；
5. 从 exact SHA 创建 owner 约定的 branch/worktree，不从 dirty 目录派生；
6. 重新读取 branch、HEAD、upstream 与 clean status，完全匹配才写入。

长期资源的目标拓扑是稳定task路径中的owner-exclusive clone，不共享其他owner的Git common directory；推荐clone位于`~/.codex/oes/owners/TASK_ID/REPOSITORY_OR_OWNER_KEY`，current evidence、bundle和rollback位于稳定task artifact root，`/private/tmp`只承载runtime scratch、可重建test data/cache与disposable verification clone。该目标拓扑在repository-owned effective profile、versioned driver、cleanup binding/schema及其测试全部合入`main`，并由owner preflight读回`resourceTopologyVersion=stable-owner-exclusive-v1`后才对之后创建的新owner生效；它不是本治理Proposal merge即生效的路径合同。cutover前继续以当前可执行的owner-exclusive clone、`OWNER_GIT_DIRECTORY`和`/private/tmp/oes-*`资源派生规则为权威，禁止新owner进入driver不接受的混合拓扑。

cutover前已存在owner的exact path/ref/resource binding冻结到terminal/cleanup，不迁移、不换clone、不改cleanup identity。其`RESOURCE_DURABILITY_REPAIR`只允许在稳定artifact root新增或刷新exact branch/HEAD/tree/candidate bundle、Packet与current evidence manifest检查点；不得移动worktree或Git directory。原绑定worktree丢失时只能从这些检查点恢复到exact原路径并重新验证owner/profile/resource fingerprint；原路径不可恢复或唯一ref/bundle缺失时保留owner并返回typed resource mismatch，不创建replacement owner。cutover后创建的stable owner worktree丢失时才可在同一owner-exclusive clone contract和exact稳定路径重建。该修复始终不改变task、owner、scope、candidate ancestry、PR或return route，也不触发额外Human gate。

不得用 <code>git clean -fd[x]</code>、<code>git reset --hard</code>、<code>git worktree prune</code>、递归删除、force worktree removal 或 force branch deletion处理未知或既有资源。

SL 的 coordination branch 只提交当前 Stage Packet，永不 push；verification worktree 使用 detached exact candidates 或临时本地 refs，不形成产品 branch。Stage Packet 当前字段原位更新，Git commit 只为本地 crash recovery，不构成状态账本。

### 9.3 Candidate、review 与阶段验证

IT handoff 必须返回：

~~~text
sliceId
baseSha
candidateSha
changedPaths
acceptanceCommands
literalResultsAndExitCodes
remainingRisks
~~~

candidate冻结并交给 FL 或 RI 后不得 amend、rebase 或 force-push；返工与latest-main刷新追加commit。首次候选冻结前的private、unpublished owner branch可rebase/replay到latest <code>main</code>，但必须保持scope/acceptance并重新生成candidate evidence。RI审精确SHA，不以工作区当前内容替代candidate。

多 slice feature 使用 <code>git merge --no-ff ACCEPTED_SLICE_BRANCH</code> 集成，使 accepted candidate 保持祖先；不得用 cherry-pick 替换已记录 candidate。

FL边界必须是可独立、安全、向后兼容进入`main`的完整业务结果；只构成内部技术片段、单层代码或需依赖未完成同批工作才可验收的内容保持为IT slice，不升级为FL。

SL 的 verification worktree 只用于 checkout/merge 精确 FL candidates 和运行 Stage Review。任何临时组合 commit/refs 均保持 local、不得 push、不得成为 FL candidate，也不得形成remote stage product branch或总PR；验证报告记录输入SHA、dependency fingerprint、literal inputs、execution profile、command/tool version、literal result和exit code，形成可复用test evidence key。Stage Review不授予SL修改产品代码或解决FL conflict的权限。

### 9.4 Push、PR 与 required CI

Remote写入只允许Direct owner push自己的Change Set branch、exact UD push design integration branch（或其按`UD_REMOTE_EXECUTION_BINDING`预先绑定的single-use host transport）、满足本节feature gate的FL push feature integration branch，以及Stage Cleanup确认后的SL cleanup-only branch。所有remote mutation使用仓库版本化remote driver；Design PR只能由exact UD创建/更新，driver/host仅按exact binding执行transport，不发布owner workflow状态。每次push前fetch并验证：

- 固定<code>truthBaseline</code>、当前<code>integrationBase=origin/main</code>与candidate关系明确；main前进已按drift matrix处理；
- local head 是 exact candidate；
- remote branch 不存在，或 remote head 等于已记录 head；
- owner worktree clean；
- refspec 只包含 owner branch，不含 <code>main</code>、其他 branches 或 tags。

禁止 direct push 到 <code>main</code> 和 force-push。PR 以 <code>main</code> 为 base，并列出 scope、protected scope、candidate SHAs、精确验证、数据/契约影响、剩余风险和 rollback。

FL首次remote write之前必须同时满足：feature candidate已commit且owner worktree clean；全部feature acceptance通过；风险要求的Feature RI或FL self-review对exact candidate通过；evidence记录test evidence keys、exact SHA、命令、literal result和exit code。满足后FL只push自己的branch并创建Draft PR。有parent SL时Draft保持非merge-ready，直到SL对同一candidate的Stage Review通过；无parent SL时独立PR gates通过即可进入`MERGE_READY`。candidate或dependency变化使对应Stage Review与merge-ready失效；仅integration base前进时按changed path/contract/dependency影响判断，自动merge latest `main`并只重跑受影响的feature review、required CI和Stage Review。push、Draft PR或CI成功本身都不构成merge授权。

remote driver把每个remote action作为可恢复事务：在mutation前写`REMOTE_PREFLIGHT_VERIFIED`，mutation成功或remote readback证明已完成后原子写`REMOTE_MUTATION_RECORDED`及PR/head/base/merge receipt，再进入`REMOTE_VERIFICATION_PENDING`等待CI，最终写`REMOTE_VERIFIED`。本地进程退出、网络中断或result缺失时，按exact owner ref、head/base、PR和merge state查询remote truth；已存在且匹配时继续验证，不重复create/push/merge。binding不匹配时保持资源并返回owner处理。

remote action复用已验证的`OWNER_SESSION_PROFILE`，只对本action的ref/SHA/PR/main/nonce执行preflight；不得为了`VERIFY_PR`或`VERIFY_MAIN`重复安装profile、制作只读载体或运行与本次action无关的build/service/database smoke。session profile输入未变时profile evidence复用，action checkpoint仍保持single-use和exact binding。

merge gate：

- <code>Baseline Checks</code> 成功；
- 普通merge时branch已merge最新 <code>main</code>；queue/admission时exact merge group包含latest <code>main</code>及所有前序队列结果并通过required CI；candidate冻结后不rebase；
- findings、conversations 和 annotations 已处理；
- PR head 与 owner 报告 SHA 一致；
- 只使用 Merge Commit。

CI或merge-group失败时返回exact artifact owner，追加正式修复commit并按affected-test matrix重跑，不降低ruleset、添加bypass、扩大token权限或跳过验证。

### 9.5 Merge 顺序与 main 复测

Direct PR、design PR、单feature或阶段中的每个FL PR都必须由对应owner发独立merge确认。确认只授权exact PR/head进入latest-main admission并最终使用一次Merge Commit，不自动删除branch。仓库启用native merge queue时，单PR也是一项queue entry；未启用或不支持时，remote driver执行等价的串行compare-and-admit。

阶段按依赖顺序逐个进入queue/admission：

1. SL确认相应Stage Review对exact FL candidate有效，并把typed review result返回exact FL；
2. 对应FL fetch并核对latest `main`，刷新`integrationBase`。无关变化复用有效证据；相关变化追加merge/fix commit、重跑affected feature review/CI并返回SL重做受影响Stage Review；只有同一exact head满足全部gate后才将Draft标记ready并进入<code>MERGE_READY</code>；
3. 对应FL展示独立merge卡并取得Human确认，状态为<code>MERGE_AUTHORIZED</code>；
4. remote driver验证卡、owner、PR head、queue/required checks后把exact PR加入queue/admission，状态为<code>QUEUED</code>；
5. native queue在latest `main`加所有前序已排队结果的temporary merge group上运行required checks；等价driver路径在单一串行锁内重新读取latest main、构造和验证exact merge result。通过后记录<code>MERGE_GROUP_CI_PASSED</code>并只执行Merge Commit；失败返回exact FL且不影响其他owner；
6. FL read-after-write验证merge SHA和main CI，返回<code>MERGED</code>。上游merge后，下游只按drift/affected-test matrix刷新candidate与Stage Review；
7. 全部FL merge后，SL在latest <code>main</code>运行stage exit criteria。

每次 merge 后必须验证：

1. fetch 后 <code>origin/main</code> 等于 PR <code>merge_commit_sha</code>；
2. merge commit 有两个 parent，第二 parent 等于 confirmed PR head；
3. accepted candidates 均为 merge SHA 祖先；
4. 普通路径merge tree与通过review/CI且已包含latest main的head一致；queue路径与通过required CI的exact merge-group tree一致，并绑定其base/head输入；
5. exact main merge SHA 触发 required workflow；
6. <code>Baseline Checks</code> 及 required steps 成功；
7. protected resources 保持原状。

PR CI 与 main push CI 是两个独立 gate。

### 9.6 完成、分层清理与 Recovery

普通Direct在PR merge、exact main CI和main validation后进入`CLEANUP_READY`；Human确认后只清理卡中exact clean/merged/SHA-matched资源。Editorial source收到`CANONICAL_EDITORIAL_MERGED`后验证exact files/hunks coverage并关闭自己的无Git Change Set；该closure不清理UD资源，也不触发delivery activation。

Proposal入口：UD在design merge与main CI后立即幂等发送`CANONICAL_MERGED`给exact Design Owner。`NEW_DESIGN`进入`ACTIVATION_DECISION_READY`；Human选择`DEFER`进入`EXECUTION_DEFERRED`，或新delivery owner达到`HANDOFF_VERIFIED`后，UD才进入`UD_CLEANUP_READY`。`EXISTING_DELIVERY_DESIGN_GAP`发送`DESIGN_GAP_RESOLVED`给exact original delivery owner；该owner返回`DELIVERY_RESUME_VALIDATED`或进入`DELIVERY_REPLAN_REQUIRED`后，UD进入自身cleanup-ready。`ACTIVE_ACTIVATION_DESIGN_REVISION`发送`ACTIVE_ACTIVATION_REVISION_RESOLVED`给exact原activation owner；原pending child达到`HANDOFF_VERIFIED`，或guards失败进入`ACTIVATION_REPLAN_REQUIRED`后，UD进入自身cleanup-ready。两类continuation都绝不清理或接管其他owner资源。Editorial入口：main CI后UD幂等发送`CANONICAL_EDITORIAL_MERGED`给exact source Direct owner并直接进入`UD_CLEANUP_READY`；不存在Design Owner或activation card。UD cleanup只移除本次integration branch/worktree/remote branch，长期UD task和locator保留；deferred implementation以后仍可由UD从exact truth重新激活。

Design Owner收到`CANONICAL_MERGED`后验证Proposal coverage。Human在Design Owner task确认后清理proposal branch/worktree和active locator；仍有开放问题则保留task/Workspace，全部冻结才删除已承接内容并archive。Design Owner和UD互不清理对方资源。

单独feature在main复测成功后进入<code>COMPLETE_AWAITING_CLEANUP</code>。无parent SL时Human在该FL task确认cleanup后，由FL：

1. 从 latest <code>origin/main</code> 创建独立 cleanup branch/worktree；
2. 只删除该 FP，经 cleanup PR、required CI、Merge Commit 和 main 复测；
3. 验证 PR 已 merge、candidates 为 <code>origin/main</code> 祖先、精确资源 clean；
4. 使用无 force 的精确路径移除 worktrees 和已合并 local branches；
5. remote head 仍等于记录 SHA 时删除精确 remote temporary branches并复读 refs；
6. archive FL。

有SL时，stage main acceptance通过后，SL展示一张且仅一张Stage Cleanup卡。卡片必须绑定全部terminal FL、各自merge/main验证、每个exact local/remote branch/worktree/temp、全部将删除的Feature Packets、保留资源、cleanup-only PR范围、required CI、Merge Commit和partial-failure策略。Human确认一次后：

1. SL向每个exact FL发送从同一root confirmation收窄的`CLEANUP_AUTHORIZED`；FL不再单独询问Human，只按卡清理自己拥有的clean/merged/SHA-matched local worktrees/branches、task temp和exact remote temporary branch，并返回`CLEANUP_DONE`或逐项failure；
2. SL复核所有typed results。一个FL失败只保留该FL失败资源并在相同binding下修复/重试；已完成FL不重复执行，也不重新请求整个批次；
3. 全部terminal FP coverage明确后，SL从latest `main`建立一个cleanup-only branch/worktree，只删除本Stage已列明的终态Feature Packets；不得修改产品代码、稳定truth或其他Stage/Feature资源；
4. SL通过remote driver push cleanup-only branch、创建PR、等待required CI，并使用Stage Cleanup卡已绑定的Human授权执行exact Merge Commit和main复测；该卡不授权其他main mutation；
5. SL删除Stage Packet并提交本地deletion，使coordination worktree clean；精确移除verification、coordination与cleanup-only worktrees/refs/remote branch；
6. SL验证Feature Packets、Stage Packet、worktrees和refs均按卡消失，protected scope未变，然后archive SL。

stage coordination commits 不 push、不合入 <code>main</code>，删除 ref 后不保留可达历史。任何 dirty、SHA 不匹配、owner 不明或未列入确认卡的资源保持原状。

遗留Design Workspace/Proposal或FP只能在原owner不存在且资源exact可识别时Recovery。Human确认exact objective、truth、scope/protected scope、resources、expected state和new owner后创建Recovery Design或Recovery FL；新owner先验证并返回`HANDOFF_ACCEPTED`。未知、dirty、SHA不符或owner仍活动的资源保持原状。Recovery result只使用typed route，不继承祖先作为generic callback。

### 9.7 Human 命令契约

本小节是Human意图、确认、owner handoff、merge与cleanup的唯一自然语言契约，版本为`OES-COLLAB-COMMANDS/v6`。

<!-- BEGIN OES_COLLAB_COMMANDS_V6 -->

#### 9.7.1 Status 与入口

纯查看、解释、讨论、status读取和暂停保留直接响应。系统先读取exact owner/resources/truth，再只显示合法动作并标记一项建议：

```text
1. 继续当前讨论/任务（建议）
2. 恢复已有设计
3. 形成独立设计
4. 查看证据
```

不适用项省略。同一聚焦主题优先当前task；exact Workspace优先恢复owner；独立、并行、长期主题才新建Design Task。用户不选择IDT/CDT。

对Human默认只显示“讨论中、等待设计确认、UD审核中、等待合并、准备执行、实现中、等待验收、已完成”中的当前一项和一个建议；SHAs、nonce、checkpoint、approval telemetry与恢复细节保留为按需证据，不进入普通进度提示。

`FEATURE_REPLAN_REQUIRED`及其ceiling内自动topology adjustment只产生一条只读`STATUS_NOTICE`，不显示编号动作或等待确认；真实扩围或既有Human typed route命中时才显示对应合法卡。

明确实现意图显示：

```text
1. Direct（建议项按真实status决定）
2. 常规协同框架
3. 继续讨论
```

#### 9.7.2 有状态执行卡

稳定设计首次写入前，task先展示完整只读Proposal Preview；确认卡绑定该Preview的目的、规范结论、state/typed routes、逐文件变化、scope/protected scope、owner、验证和stop point。task内部绑定`previewFingerprint`、`rootConfirmationFingerprint`、`scopeFingerprint`、exact ids、SHAs、resources、state version和transition id；Proposal及Design Owner→UD envelope必须携带同一binding。Human确认后才创建local-only Design Owner资源、写Proposal commit并提交UD；diff与preview一致时不重复询问Proposal提交。Design remote mutation只由exact UD执行，或由UD在mutation前签发一次性精确binding的host transport执行；UD read-after-write并发布状态。

非设计root owner的一次确认覆盖列明Stage/Feature scope、protected scope、topology policy、delegation/WIP ceiling与紧凑运行权限摘要到stop point；该ceiling内的FL topology adjustment与child owner/IT assignment自动执行，只有root scope/protected scope/capability/ceiling真实扩大才换卡。摘要格式为“运行权限：owner工作区、owner Git/PR、本地服务、隔离测试数据、构建测试、approved network；越界另行确认”，并按真实role省略不适用项。Proposal Preview、每次merge、`NEW_DESIGN` post-merge activation、failed continuation guard的replan、cleanup/abandonment分别确认；exact existing-delivery resume不重复确认。technical ids由task维护，Human无需复述。

已确认scope内的Codex platform approval不向Human展示。出现时task记录`EXECUTION_PROFILE_DEFECT`并自动修复effective profile/host后恢复；只有真实新增能力使用下列扩围卡。正常任务的`normalPermissionPromptCount`验收值为`0`。

scope外运行能力一次合并展示：

```text
发现超出当前授权范围的运行需求：CAPABILITY_SUMMARY。
1. 批量确认本卡列明的新增能力（建议）
2. 保持当前权限并调整执行方案
3. 查看详细边界
```

该卡使用`PERMISSION_EXPANSION_REQUIRED`和new stateVersion，只绑定列明增量；同一缺口不拆成逐命令确认，未列明能力保持原binding。

`FEATURE_REPLAN_REQUIRED`是SL内部自动调度输入，不显示Human topology card。SL重新验证后只执行当前合法分支：独立交付物证明成立且new topology完全落在root Stage scope/protected scope、execution capabilities、delegation/WIP ceiling内时自动创建sibling FL；原子性成立时使typed result失效并自动继续原FL/bounded IT。每次自动重划绑定exact SL/原FL、Stage/Feature key、old/new topology、每个new FL scope/protected scope/write set/dependency/acceptance、completed slices/commits/candidate/evidence、delegation/WIP ceiling、resources、root authorization/scope fingerprint、state/version、transition与invalidation conditions，并只向Human显示一条只读`STATUS_NOTICE`。只有真实scope/capability/ceiling扩大使用`PERMISSION_EXPANSION_REQUIRED`，不可消解owner/write冲突或阻塞性业务取舍使用既有Human route。

Stage完成后的批量cleanup只显示一张卡：

```text
阶段验收已通过，终态资源已汇总。
1. 清理本卡列明的全部FL与Stage资源（建议）
2. 保留资源
3. 查看清理清单
```

选项1同时授权exact child self-cleanup与一个只删除已列明终态Feature Packets的cleanup-only PR/required CI/Merge Commit；各owner仍只处理自己的资源，partial failure保留失败项并在同一binding下恢复。

#### 9.7.3 UD post-merge card

`NEW_DESIGN` Proposal的main CI成功后，UD必须在同一task按assessment自动展示以下两种card之一；每张card恰好一个建议项。

推荐实现时，`RECOMMENDED_SHAPE`必须解析为`Direct | 单Feature | Delivery Stage`中的exact一项：

```text
设计已合并，main CI已通过。
1. 按 RECOMMENDED_SHAPE 开始实现（建议）
2. 暂不实现
3. 继续设计
4. 查看证据
```

推荐`NO_EXECUTION`时：

```text
设计已合并，main CI已通过。
1. 暂不执行（建议）
2. 仍要实现，由UD重新评估执行形态
3. 继续设计
4. 查看证据
```

实现建议card的选项1同时授权创建recommended delivery owner与两阶段handoff；其选项2、`NO_EXECUTION` card的选项1进入`EXECUTION_DEFERRED`并使UD cleanup-eligible。`NO_EXECUTION` card的选项2只使UD以new stateVersion重新评估并显示new activation card，不创建delivery owner。选项3向exact Design Owner发送`DESIGN_CONTINUATION_REQUIRED`并增加revision epoch。上述选项均不授权delivery merge或cleanup；UD不得将implementation请求转给initiating/request-origin task。

`EXISTING_DELIVERY_DESIGN_GAP`不显示上述activation card。continuation guards全部通过时，UD显示只读结果“设计缺口已合并，正在恢复原交付owner”，exact owner自动恢复affected lane。任一guard失败时由exact existing delivery owner显示：

```text
设计缺口已合并，但原交付绑定发生变化。
1. 更新绑定并继续原 Stage/Feature（身份仍有效时建议）
2. 终止原交付后创建 replacement Stage/Feature
3. 暂缓
4. 查看证据
```

选项1只更新卡中列明的binding并继续exact original owner；选项2必须先完成旧owner的独立终止/cleanup边界，再由UD用new authorization创建replacement；选项3保留全部资源。任何选项都不得把旧owner静默降为evidence source或由UD直接创建新SL/FL。

`ACTIVE_ACTIVATION_DESIGN_REVISION`也不显示上述activation card。guards全部通过时UD只显示只读结果“activation设计修订已合并，正在恢复原pending owner handoff”，并优先same-task live profile repair。guards失败时exact activation owner显示一张`ACTIVATION_REPLAN_REQUIRED`卡：继续exact pending child、独立终止后replacement、暂缓、查看证据；任何选择都不得在`PENDING_CHILD_TERMINATED_VERIFIED`前创建replacement。

#### 9.7.4 编号、绑定与失效

卡index在task内单调递增且不复用。只有一张latest有效待确认卡时，单独`1`或`2`执行状态变更；`3/4`按卡语义只读或显式继续设计。新意图、新卡、执行、取消、binding/state变化使旧卡失效。每次执行前后校验expected state/version、owner、truth/candidate、scope fingerprint、resources和postcondition；相同transition重复只复用原结果。

#### 9.7.5 Typed routing

`ASSIGNMENT_RESULT`只返回direct execution parent；其中`FEATURE_REPLAN_REQUIRED`只由FL返回exact parent SL，SL在root authorization/delegation ceiling内自动处理并只发`STATUS_NOTICE`，不返回UD、request origin、祖先task或Human；真实扩围改走`PERMISSION_EXPANSION_REQUIRED`，不可消解owner/write冲突或阻塞性业务取舍走既有typed route；`UD_REMOTE_EXECUTION_RESULT`只返回exact issuing UD且不发布canonical状态；`REMOTE_DRIVER_RESULT`只返回exact issuing artifact owner；`EXECUTION_ENVIRONMENT_NOT_READY`只返回exact creating parent且不转移owner；`EXECUTION_PROFILE_DEFECT`保留exact current owner并只返回creating/current owner自动修复；`PERMISSION_EXPANSION_REQUIRED`在root handoff前返回exact activation owner、child accept前返回exact creating delivery parent，handoff后保留在exact current delivery owner；`BUSINESS_DECISION_REQUIRED`只到exact decision owner；`REVISION_REQUIRED`和`DESIGN_CONTINUATION_REQUIRED`只到exact Design Owner；`EDITORIAL_CLASSIFICATION_INVALID`与`CANONICAL_EDITORIAL_MERGED`只到exact source Direct owner；`ACTIVATION_DECISION_READY`仅为`NEW_DESIGN`保留在UD；`DESIGN_GAP_RESOLVED`返回exact existing delivery owner，`DELIVERY_RESUME_VALIDATED`只到exact affected owners，`DELIVERY_REPLAN_REQUIRED`只由exact existing delivery owner询问Human；`ACTIVE_ACTIVATION_REVISION_RESOLVED`和`ACTIVATION_CONTINUATION_INVALID`只到exact原activation owner，`ACTIVATION_REPLAN_REQUIRED`只由该owner询问Human；`STATUS_NOTICE/CANONICAL_MERGED/CANONICAL_EDITORIAL_MERGED`只通知，不转移owner。不存在generic callback或祖先默认路由。

所有main变更继续使用artifact-owner branch、PR、required CI、Human Merge Commit和main验证。任何owner只清理自己的exact资源。

#### 9.7.6 Shortcut

调用`$oes-collaboration-commands`只读取并展示本小节，不创建资源或推进gate。

<!-- END OES_COLLAB_COMMANDS_V6 -->

### 9.8 失败恢复

- host reboot、App restart或临时目录清理：先读取effective profile的`resourceTopologyVersion`、exact frozen resource binding、stable checkpoint bundle、Packet与current evidence manifest。cutover前owner只恢复exact原路径与原exclusive Git identity；cutover后owner只在exact stable owner-exclusive clone/path重建；两者都按manifest重建scratch。只要owner/ref/candidate/scope仍匹配即为同一transition的自动恢复，不迁移、不创建replacement owner、不重跑fingerprint仍有效的证据；原绑定路径不可恢复或唯一ref/bundle也缺失才返回typed resource mismatch；

- declared execution capability预检失败：保留exact owner/binding/resources，返回一次性`EXECUTION_ENVIRONMENT_NOT_READY`证据，由creating parent修复execution profile/host并对同transition幂等重试；
- delivery中已声明能力被runtime拒绝或产生用户approval：记录approval event与effective profile并路由`EXECUTION_PROFILE_DEFECT`，保留owner/candidate/state/logs，由creating/current owner自动修复、重建或迁移profile/host后幂等恢复；同一缺口不再次展示Human，真实scope/capability新增才发一张`PERMISSION_EXPANSION_REQUIRED`卡；
- network失败且design remote write未验证：保留exact candidate/state；由exact UD在同transition幂等重试，或在mutation前签发new single-use host binding；无pre-binding的其他task不接管remote write；
- existing-delivery resume的fetch或remote read暂时失败：保留exact original owner、Stage/Feature resources、state和resolution binding，在同一transition幂等重试；该环境失败不进入`DELIVERY_REPLAN_REQUIRED`，不创建replacement owner；
- remote mutation返回后进程退出、result缺失或CI等待中断：remote driver先读取exact ref/PR/head/base/merge/check state；已匹配`REMOTE_MUTATION_RECORDED`时从verification继续，不重复mutation；
- push/merge前main前进：刷新`integrationBase`并执行drift/affected-test matrix；无关变化继续、相关变化追加集成与重验、普通冲突返回artifact owner、冻结语义冲突路由`DESIGN_GAP`，main前进本身不换Human卡；
- conflict：只由artifact owner在clean integration worktree解决并追加commit；
- duplicate message：相同transition/binding复用结果，不重复task/ref/PR/merge；
- 新owner在accept前失败：旧owner保持current，delivery禁止写入；
- CI/post-merge验证失败：保留资源与证据，追加正式修复，不改写发布历史；
- Design Owner缺失：UD显示Human-confirmed Recovery Design，不按标题猜测；
- existing delivery owner缺失、已terminal/cleaned或binding漂移：保持所有可识别资源，进入`DELIVERY_REPLAN_REQUIRED`，不隐式创建replacement owner；
- parallel scope/dependency冲突：不启动或串行到唯一integration owner；
- cleanup precondition失败：保持awaiting cleanup，不使用破坏性命令；
- Stage batch cleanup partial failure：已完成child/result保持幂等完成，只保留失败资源并在同一root binding下重试；cleanup-only PR范围变化才刷新卡；
- unknown/dirty/SHA-mismatched资源：保护并报告；
- illegal transition或同id不同binding：fail closed，复读exact status并显示合法下一步。

## 10. 完成状态

Direct：

```text
REQUESTED -> ACTIVE -> VERIFIED -> PR_READY -> MERGED -> MAIN_VALIDATED
          -> CLEANUP_READY -> CLOSED
```

Design Owner：

```text
DISCUSSING -> PROPOSAL_PREVIEW_READY -> PREVIEW_CONFIRMED
-> DESIGNING[r] -> PROPOSAL_READY -> PROPOSAL_SUBMITTED -> AWAITING_UD
   | REVISION_REQUIRED -> DESIGNING[r+1]
   | CANONICAL_MERGED -> COVERAGE_VERIFIED
       -> DESIGN_OWNER_CLEANUP_READY -> RETAINED | ARCHIVED
```

UD integration与post-merge routing：

```text
UD_REVIEW -> UD_INTEGRATION_VERIFIED
-> UD_EXECUTES | UD_BOUND_HOST_EXECUTES -> UD_POST_WRITE_VERIFIED -> DESIGN_PR_READY
-> MERGE_CONFIRMED -> UD_PRE_MERGE_REVALIDATED
-> UD_EXECUTES | UD_BOUND_HOST_EXECUTES -> UD_POST_WRITE_VERIFIED
-> TRUTH_MERGED -> MAIN_CI_PASSED
   | NEW_DESIGN -> ACTIVATION_DECISION_READY
       | DEFER (recommended by NO_EXECUTION) -> EXECUTION_DEFERRED -> UD_CLEANUP_READY
       | CONTINUE_DESIGN -> DESIGN_REVISION_REQUESTED -> AWAITING_PROPOSAL[r+1]
       | START -> RUNTIME_PROFILE_BOOTSTRAP_PENDING
           | RUNTIME_PROFILE_LAUNCH_UNAVAILABLE -> EXECUTION_ENVIRONMENT_NOT_READY
               -> same activation owner bootstrap retry
           | RUNTIME_PROFILE_LAUNCH_READY -> DELIVERY_OWNER_CREATION
               -> HANDOFF_PENDING -> TARGET_SESSION_PROFILE_VERIFIED
               -> HANDOFF_ACCEPTED -> HANDOFF_VERIFIED
                   | delivery owner: DELIVERY_ACTIVE
                   | UD: UD_CLEANUP_READY
               | same-task profile mismatch -> EXECUTION_ENVIRONMENT_NOT_READY
                   | live repair supported -> TARGET_SESSION_PROFILE_VERIFIED
                   | unsupported -> PENDING_CHILD_TERMINATION_REQUIRED
                       -> TERMINATION_CONFIRMED -> PENDING_CHILD_TERMINATED_VERIFIED
                       -> RUNTIME_PROFILE_BOOTSTRAP_PENDING
   | EXISTING_DELIVERY_DESIGN_GAP -> DESIGN_GAP_RESOLVED
       | guards pass -> exact original owner -> DELIVERY_RESUME_VALIDATED
           -> AFFECTED_DELIVERY_RESUMED
           -> UD_CLEANUP_READY
       | guards fail -> DELIVERY_REPLAN_REQUIRED -> Human decision
   | ACTIVE_ACTIVATION_DESIGN_REVISION -> ACTIVE_ACTIVATION_REVISION_RESOLVED
       -> EXACT_ACTIVATION_CONTINUATION_VALIDATING
       | guards pass -> same pending child -> SAME_TASK_PROFILE_REPAIR_PENDING
           | live repair supported -> TARGET_SESSION_PROFILE_VERIFIED
               -> HANDOFF_ACCEPTED -> HANDOFF_VERIFIED -> UD_CLEANUP_READY
           | unsupported -> PENDING_CHILD_TERMINATION_REQUIRED
               -> TERMINATION_CONFIRMED -> PENDING_CHILD_TERMINATED_VERIFIED
               -> RUNTIME_PROFILE_BOOTSTRAP_PENDING
       | guards fail -> ACTIVATION_CONTINUATION_INVALID
           -> ACTIVATION_REPLAN_REQUIRED -> Human decision -> UD_CLEANUP_READY
```

Editorial integration：

```text
UD_EDITORIAL_REVIEW
   | EDITORIAL_CLASSIFICATION_INVALID -> exact source -> DISCUSSING | PROPOSAL_PREVIEW_READY
   | ACCEPTED -> UD_INTEGRATION_VERIFIED
       -> UD_EXECUTES | UD_BOUND_HOST_EXECUTES -> UD_POST_WRITE_VERIFIED -> DESIGN_PR_READY
       -> MERGE_CONFIRMED -> UD_PRE_MERGE_REVALIDATED
       -> UD_EXECUTES | UD_BOUND_HOST_EXECUTES -> UD_POST_WRITE_VERIFIED -> TRUTH_MERGED
       -> MAIN_CI_PASSED
          | UD -> CANONICAL_EDITORIAL_MERGED -> exact source -> COVERAGE_VERIFIED -> SOURCE_CLOSED
          | UD -> UD_CLEANUP_READY
```

`CANONICAL_MERGED`只在Proposal的`MAIN_CI_PASSED`后幂等发送给exact Design Owner；它与post-merge routing并行且不转移owner。`CANONICAL_EDITORIAL_MERGED`只用于editorial source closure。`EXISTING_DELIVERY_DESIGN_GAP`的same resolution binding重复到达只复用原`DELIVERY_RESUME_VALIDATED`结果；`ACTIVE_ACTIVATION_DESIGN_REVISION`的same resolution binding只复用原activation continuation结果，绝不退回`ACTIVATION_DECISION_READY`。owner、scope、merge、authorization或resource fingerprint不匹配时fail closed。latest main可以前进，但resolution canonical merge必须仍为其祖先；无语义冲突时刷新到latest head并增量验证，新的冻结语义冲突重新进入`DESIGN_GAP`。Routine path无环；只有显式`REVISION_REQUIRED`、`CONTINUE_DESIGN`或delivery `DESIGN_GAP`创建new revision epoch。

Task identity与target-session Capability preflight都是`HANDOFF_ACCEPTED`的guard而非长期owner。`RUNTIME_PROFILE_BOOTSTRAP_PENDING`与`RUNTIME_PROFILE_LAUNCH_READY`是creating owner的transition-local checkpoint，不是全局service/registry；前者不得创建child，后者只允许一次exact create且不替代target-session evidence。`TASK_IDENTITY_INVALID`保持creating parent为owner，禁止role-owned资源mutation，并只允许同一新task的title修正与readback；`EXECUTION_ENVIRONMENT_NOT_READY`保持`HANDOFF_PENDING`和原activation owner；handoff后的`EXECUTION_PROFILE_DEFECT`保持current delivery owner与已授权工作，只暂停受影响operation并自动修复profile/host；`PERMISSION_EXPANSION_REQUIRED`只暂停真实越界操作。

`WAITING_ON_CHILD`是Stage/Feature Packet与current evidence manifest中的可恢复等待marker，不是额外workflow owner或长期状态；exact child result到达即退出。`OWNER_SESSION_PROFILE`是owner capability guard，remote action checkpoint只引用其fingerprint。`RESOURCE_DURABILITY_REPAIR`在cutover前只建立稳定检查点或恢复exact原路径，cutover后才按stable-owner-exclusive-v1重建exact稳定路径；它不迁移in-flight owner。`FEATURE_REPLAN_REQUIRED`保持原FL为owner并只暂停新扩围，SL在root authorization/ceiling内自动选择sibling handoff或invalidate-to-atomic continuation；只有真实扩围或既有Human typed route命中才等待Human。以上均不替代Feature/Stage完成状态。

`resourceTopologyVersion=stable-owner-exclusive-v1` runtime cutover前已存在的tasks、cards、owners和resources保持原binding、原exclusive clone与原`/private/tmp/oes-*` cleanup identity，不改名、不迁移、不自动清理；cutover本身也不迁移in-flight资源。已经创建的replacement owner不自动删除。已创建、仍在`HANDOFF_PENDING`、未接受且无role-owned资源的child保持exact task与clean worktree；profile-boundary truth合并后只允许same-task live repair，或在独立Human终止/归档确认及无resource readback后创建replacement。若错误activation card尚未创建任何owner/resource，exact UD可在readback确认后以`EXISTING_DELIVERY_PROVENANCE_CONFIRMED`使其失效并改走resume；已经形成Human-confirmed或resource-bearing replacement binding时只走显式replan/termination。cutover时正在等待Human的existing Stage/Feature resume card保持原样，不因本规则merge自动执行。

Feature与Stage继续使用：

```text
Feature topology replan:
  FL_RUNNING -> FEATURE_REPLAN_REQUIRED -> SL_REPLAN_VALIDATING
     | INDEPENDENT_WITHIN_CEILING -> SIBLING_HANDOFF_PENDING
         -> HANDOFF_VERIFIED -> FL_RUNNING
     | ATOMIC_PROOF -> FEATURE_REPLAN_INVALIDATED_ATOMIC -> FL_RUNNING
     | REAL_EXPANSION -> PERMISSION_EXPANSION_REQUIRED
     | OWNER_WRITE_CONFLICT | BUSINESS_DECISION -> existing typed Human route

Feature review:
  CANDIDATE_READY[c] -> FEATURE_RI_PENDING[r,c]
     | FEATURE_RI_ACCEPTED[c] -> FEATURE_REVIEW_PASSED
     | FEATURE_RI_REVISION_REQUIRED[c] -> FL_REMEDIATION
         -> CANDIDATE_READY[c+1] -> FEATURE_RI_PENDING[r+1,c+1]
  low risk: FL_SELF_REVIEW_ACCEPTED[c] -> FEATURE_REVIEW_PASSED

FL without SL: FEATURE_REVIEW_PASSED -> PR_READY[draft] -> MERGE_READY
               -> MERGE_AUTHORIZED -> QUEUED -> MERGE_GROUP_CI_PASSED -> MERGED
FL with SL: FEATURE_REVIEW_PASSED -> PR_READY[draft] -> READY_FOR_STAGE_REVIEW
             -> STAGE_REVIEW_PASSED -> MERGE_READY -> MERGE_AUTHORIZED
             -> QUEUED -> MERGE_GROUP_CI_PASSED -> MERGED
FL cleanup: COMPLETE_AWAITING_CLEANUP -> CLEANED
SL: MAIN_STAGE_ACCEPTED -> STAGE_CLEANUP_AUTHORIZED -> FL_CLEANUP_DISPATCHED
    -> FL_CLEANUP_VERIFIED -> STAGE_CLEANUP_PR_VERIFIED -> CLOSED
```

Remote driver checkpoint是每个exact remote action的内部可恢复状态，不替代上述owner workflow：

```text
REMOTE_PREFLIGHT_VERIFIED -> REMOTE_MUTATION_RECORDED
-> REMOTE_VERIFICATION_PENDING -> REMOTE_VERIFIED
```

checkpoint、receipt和approval telemetry默认不进入Human status；owner只在`REMOTE_VERIFIED`后发布对应PR/merge/main状态。

## 11. 明确排除

本模型不引入：

- 长期全局执行控制 task；SL 只是已确认 scope 内的有界临时 owner；
- capability command 层或长期 PC/IV；`executionCapabilities`只作为existing authorization envelope的有界字段和handoff guard；
- watcher、heartbeat、持续 wait loop、Pull inbox 或历史/全局 thread registry；
- 广播同步；
- task 历史、状态流水、迁移账本或 cleanup archive；
- 由SL代替FL拥有产品branch、PR、merge或cleanup，或建立remote stage product branch、总PR；
- 由Design Owner、request origin、parent或其他task先执行design remote mutation，再由UD事后review或补binding；
- 把Stage Start称为Proposal，或在truth merge/main CI之前启动执行。

canonical repository、exact task id、单一parent回传、status-driven执行方式、受控委派、transition guard和Human gate共同构成执行边界。
