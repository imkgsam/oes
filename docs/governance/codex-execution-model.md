# OES Codex 执行模型

## 1. 目标

本模型默认让一个 task 直接闭合一个有界 Change Set；只有 Human 主动选择或命中稳定设计、跨 feature、多 owner/资源等升级边界时，才使用“讨论与取舍 → 统一设计 → feature 或交付阶段 → 独立复核 → 合并验收 → 分层清理”的协同拓扑。两种方式共享受保护 main、精确状态、验证和回滚纪律。

核心约束：

- task 先读取真实 status，只展示当前可用的执行方式并标记一个建议项；不默认创建角色拓扑。
- Direct 简化角色、packet 和确认层级，不简化 branch、PR、required CI、Human merge gate、验证或 rollback。
- Human 控制语义决定、阶段授权、合并与清理边界。
- 稳定设计只有 UD 一个写者；Design Proposal 只承载稳定设计真相。
- 一个 feature 只有一个临时 FL；一个有界交付阶段最多一个临时 SL。
- 单一不可独立合并的跨服务能力归一个 FL；多个可独立安全合并的 feature 才由 SL 协调多个 FL。
- repository canonical truth 是设计同步媒介；task 路由使用 exact task id。
- 不建立 watcher、heartbeat、Pull inbox、全局执行 registry、线程账本或过程历史。

## 2. 角色

### 2.1 Human Decision Owner（HDO）

HDO 是人，不是 Codex task。Human 负责确认完整Proposal Preview或其他有状态owner/resource创建与扩围、每次`main` merge、UD post-merge delivery activation以及owner cleanup/abandonment；并处理跨feature业务取舍和阻塞性决定。普通讨论、status/evidence读取、exact resume、相同binding的幂等重试和预授权拓扑内的child assignment不重复确认。

HDO提供业务目标、优先级、不可违反的业务约束和验收判断，不替代技术角色选择方案。技术角色必须把专业判断转化为Human可理解的取舍与证据，不把实现细节或角色调度负担转嫁给HDO。

### 2.2 Design Owner

普通讨论不是role，不创建repository资源。需要形成稳定设计时，一个聚焦task可以成为Design Owner；只有设计主题独立、需要并行/长期恢复，或当前task已有不兼容责任时才新建Design Task。

Design Owner只维护一个设计主题：刷新相关canonical truth；先在当前会话形成完整只读Proposal Preview；取得Human对exact preview的确认后，按需维护一个active Design Workspace并形成真实Git diff/commit作为Proposal Patch，再向UD发送。它不写canonical truth，不创建或协调Direct/SL/FL/IT/RI。

Design Owner按Principal Architect级标准工作：以业务目标和系统约束为起点，熟练运用bounded context、领域建模、数据所有权、API/event契约、分布式一致性、权限/租户、安全、可靠性、性能、可观测性、兼容演进和迁移设计。非显然决策必须检查当前代码与truth、研究适用的主流成熟实践、比较可行方案及取舍，并显式给出边界、不变量、失败模式、容量/性能假设、演进路径和可测试性。它在展示Preview前完成反例和跨边界自审，拒绝重复真相、跨库耦合、泄漏内部模型、未经验证的假设、为未来猜测而过度抽象以及只描述happy path的低质量设计。

Design Owner标题为`[Design] HUMAN_READABLE_TOPIC`。标题只供识别，exact路由使用task id和active design locator。

### 2.3 Global Unified Design（UD）

UD是长期全局设计审查task，也是architecture、ADR、稳定contracts与稳定governance的唯一agent writer。它：

- 串行审核Design Owner的Human-confirmed语义Proposal；
- 接受语义影响为`NONE`且exact files/hunks已绑定的`CANONICAL_EDITORIAL_PATCH`；
- 不自行发起未确认的canonical改写；
- 有blocker时向exact Design Owner返回`REVISION_REQUIRED`；
- 接受时在自己的design integration branch集成、验证、push并创建design PR，停止于`DESIGN_PR_READY`；
- Human确认merge后执行Merge Commit并验证exact main CI；
- main CI成功后必须在同一UD task进入`ACTIVATION_DECISION_READY`，重新评估并主动建议`Direct | SINGLE_FEATURE | DELIVERY_STAGE | NO_EXECUTION`；
- Human确认启动后创建exact delivery owner，并在两阶段handoff完成前保持activation owner；
- 发送coverage/cleanup通知不转移workflow或Git ownership。

UD不实现产品代码、不拆slices、不写Feature/Stage Packet，也不在handoff后管理delivery状态。标题固定为`[UD] Unified Design`。

UD按Chief/Enterprise Architect级标准审核全局一致性，而不是格式检查或rubber stamp。它必须验证Proposal与现有architecture/ADR/contracts/governance的语义兼容，检查服务边界、唯一真相、跨服务契约、权限/租户、可靠性、性能、运维、迁移和长期演进，主动寻找局部最优造成的系统级副作用、跨章节矛盾与隐含破坏性变化。事实、仓库证据和明确工程原则优先于个人偏好；存在blocking design gap时必须返回可定位、可验证的finding。

### 2.4 Direct Owner

Direct Owner按Senior/Staff Engineer级标准闭合一个有界Change Set：先定位现象与根因，读取相关设计和邻近代码，选择与仓库一致的最小正式修复，补足风险匹配的测试并证明没有破坏既有行为。它拒绝顺手扩围、隐藏设计变化、特殊判断堆叠、无关重构和用多层fallback掩盖错误边界；一旦发现稳定语义或多owner依赖，立即停止Direct并展示升级选项。

### 2.5 Stage Lead（SL）

SL是一个Human-confirmed有界多feature阶段的临时delivery owner。它维护本地Stage Packet和dependency graph，按WIP容量启动ready且不冲突的FL，安排Stage Review与ordered merge，在latest main执行stage acceptance，并在所有FL分别cleanup后清理自身资源。SL无产品branch，不写产品代码或FL的FP，不push、不合并main，也不清理FL资源。

SL按Technical Delivery Lead级标准优化整体交付流，而不是追求task数量。它必须识别critical path、接口/数据依赖、风险集中点、可安全并行边界、集成顺序和阶段级验收，保留review容量并限制WIP。它拒绝无验收价值的拆分、依赖未ready的并行、多个owner写同一范围、以局部测试替代端到端阶段验收，以及为了表面进度制造task fan-out。

### 2.6 Feature Lead（FL）

FL是一个可独立验收feature的临时delivery owner。它从exact truth commit开始，维护一个active FP，拆分1..N个Frozen Slices，创建IT/RI，集成candidates并验证，独占feature remote push、PR、Human-confirmed Merge Commit、main验证和自身cleanup。有parent SL时只向该SL返回规定里程碑。

FL按Staff Engineer/Feature Owner级标准对一个完整业务结果负责。它把设计转换为可独立验证的vertical slices，明确每个slice的输入、输出、不变量、依赖、失败处理和验收证据；持续检查集成后的行为、兼容性、可维护性和用户价值，而不是只汇总child commits。它拒绝按技术层机械拆分导致长期半成品、把核心规则放入错误层、把集成问题推给SL或用局部通过冒充feature完成。

### 2.7 Implementation Task（IT）

IT实现一个Frozen Slice，只使用FL分配的branch/worktree，向唯一parent FL返回candidate SHA、literal验证和blocker；不写FP、不push、不创建PR、不merge或cleanup。小型单slice feature可由FL直接实现。

IT按Senior/Principal Implementation Engineer级标准编码。它必须先理解exact设计、周边代码、语言/框架惯例和真实约束，优先采用经过验证、社区主流、仓库一致且最适合当前问题的实现，而不是盲目使用最新或最复杂技术。实现必须显式处理正确性不变量、边界输入、错误传播、并发/竞态、事务与幂等、安全与租户、资源释放、可观测性和兼容性；复杂分支、状态机或算法先列出truth table/state transition/invariants并以正向、边界、反向和性质测试覆盖；关键算法说明时间/空间复杂度并以真实规模判断是否需要benchmark或优化。它拒绝复制粘贴、魔法值、巨型函数/类、深层分支、静默吞错、隐式共享状态、泄漏抽象、过度通用化、无证据优化和只靠注释解释混乱代码。

### 2.8 Review & Integration（RI）

RI使用clean context审查exact candidate：低风险可由FL自审，中高风险使用local/global RI，阶段组合使用Stage RI。RI默认只读，只向direct execution parent返回findings和结论；不调度下游、不就地修复、不push、merge或cleanup。

RI按Principal Reviewer/SDET级标准独立证明“实现符合设计且不会降低整体code health”。它先按acceptance与风险规划一次验证路线，再按静态检查、focused unit/component、contract/integration、关键journey/E2E以及按风险触发的性能、安全、并发、可靠性和rollback测试分层执行；优先复用仍对exact candidate有效的证据，不重复运行未受影响且输入未变化的测试。RI逐项检查设计、功能、边界/错误路径、复杂度、命名、可维护性、测试有效性、竞态和跨服务影响；finding必须包含严重度、精确位置、复现输入、预期/实际和归类。candidate、依赖或测试输入未变化时禁止以“更放心”为由机械重复全量测试。

### 2.9 跨角色专业基线

“顶级”“最佳”必须由可观察证据体现，不作为自我评价。所有专业task都必须：

- 先读取当前truth、代码、约束和既有证据，再下结论；时效性或专业事实不确定时查阅primary/official sources；
- 对非显然选择比较现实可行方案，选择在正确性、简洁性、可靠性、性能、维护成本和交付风险之间最适合当前约束的方案，而不是追求抽象意义上的“最先进”；
- 明确事实、推断、假设和待验证项；不得把猜测写成结论；
- 在交付前执行角色专属self-review，并用可复现命令、输入、literal结果和失败条件证明结论；
- 发现自身专业能力不足以覆盖security、privacy、concurrency、performance、accessibility等高风险领域时，要求相应qualified review，不以泛化检查代替；
- 每次变更必须改善或至少保持整体architecture/code/test health；无法证明时不得宣称完成。

现存legacy IDT/CDT task按原binding完成，不批量重命名。新普通讨论不创建IDT；新稳定设计只使用Design Owner。

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

Canonical纯编辑是受控例外：source Direct owner只提供classification、exact files/hunks、evidence和source notice target；UD拥有canonical edit、design branch/PR/merge/main validation与自身cleanup。classification失效即返回source并重新展示Design或继续讨论。

### 3.3 Design 到 delivery 的唯一正向路径

```text
ordinary discussion
  -> PROPOSAL_PREVIEW_READY (read-only) -> Human approve
  -> Design Owner writes exact Proposal -> UD_REVIEW
  -> DESIGN_PR_READY -> Human merge -> TRUTH_MERGED -> MAIN_CI_PASSED
  -> ACTIVATION_DECISION_READY in UD
     | NO_EXECUTION -> EXECUTION_DEFERRED
     | CONTINUE_DESIGN -> exact Design Owner (new revisionEpoch)
     | START_DIRECT -> HANDOFF_PENDING -> HANDOFF_VERIFIED -> Direct owner
     | START_FEATURE -> HANDOFF_PENDING -> HANDOFF_VERIFIED -> FL
     | START_STAGE -> HANDOFF_PENDING -> HANDOFF_VERIFIED -> SL -> FL
```

`MAIN_CI_PASSED`只有一个自动后继：`ACTIVATION_DECISION_READY`。UD必须主动显示执行建议；Human不需要到请求来源或Design Owner再次说implement。`CANONICAL_MERGED`在main CI后作为coverage/cleanup通知发送给Design Owner，但UD保留activation ownership，通知与activation独立推进。

### 3.4 Typed routing

- `REVISION_REQUIRED`：UD -> exact Design Owner；
- `CANONICAL_MERGED`：UD -> Design Owner，仅coverage和Design Owner cleanup eligibility；
- `ACTIVATION_DECISION_READY`：保留在UD并询问Human；
- `DESIGN_CONTINUATION_REQUIRED`：UD -> exact Design Owner，开启new revisionEpoch；
- `ASSIGNMENT_RESULT`：IT/RI/FL -> direct execution parent；
- `BUSINESS_DECISION_REQUIRED`：SL/FL -> exact decision owner，仅阻塞性非设计决定；
- `DESIGN_GAP`：delivery owner -> UD -> exact Design Owner或Human-confirmed Design Revision Task；
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
designOwnerTaskId
baseCommit
proposalCommit
intendedCanonicalFiles
canonicalTruthDomains = ARCHITECTURE | ADR | CONTRACT | GOVERNANCE
deliveryHint = UNKNOWN | LIKELY_NONE | LIKELY_DIRECT | LIKELY_FEATURE | LIKELY_STAGE
decisionOwnerTaskId = OPTIONAL
```

`deliveryHint`只供post-merge评估，不预授权、禁止或固定实现。Proposal只承载稳定设计真相；Human确认Preview后，Design Owner形成并提交exact Proposal，UD随即审核。有blocker时返回`REVISION_REQUIRED`；接受时UD拥有canonical integration branch/worktree、验证、push和design PR并停止于`DESIGN_PR_READY`。merge、delivery activation和cleanup是独立Human边界。

### 4.2 Post-merge assessment

Human确认design PR merge且exact main CI成功后，UD重新读取final truth、acceptance、依赖、repository status和active resources，并推荐：

- `Direct`：一个owner、一个有界Change Set、无独立feature协调；
- `SINGLE_FEATURE`：一个独立验收结果和一个FL integration lane；
- `DELIVERY_STAGE`：两个或更多独立feature，存在依赖/order或stage acceptance；
- `NO_EXECUTION`：当前无实现工作。

即使`deliveryHint=LIKELY_NONE`，UD也必须显示post-merge card。选择暂不执行后，后续在UD提出implementation会从exact truth重新进入`ACTIVATION_DECISION_READY`；其他task只把该意图定向给UD，不自行执行。

### 4.3 Authorization envelope 与 parent assignment

Human确认只绑定发卡task的exact state和card fingerprint。跨task分为：

1. Human authorization envelope：Design Owner -> UD、Direct editorial source -> UD、UD -> Direct/FL/SL、decision owner -> Recovery Design/FL；
2. parent assignment：SL -> FL/Stage RI、FL -> IT/RI，仅在已确认拓扑内收窄scope。

每个envelope/assignment至少绑定：source task、target task/role、objective、scope/protected scope、truth/candidate、allowed resources、expected state、transition id、stop point和typed result。envelope不转发，assignment不扩权。

### 4.4 Two-phase handoff

1. UD冻结exact truth SHA、objective、scope/protected scope、recommended shape、acceptance、resources和transition id；
2. Human确认后UD创建exact Direct/FL/SL task；
3. 新task验证binding、main、owner、resource availability和allowed topology，返回`HANDOFF_ACCEPTED`；
4. UD compare-and-set `HANDOFF_PENDING -> HANDOFF_VERIFIED`并转移delivery ownership；
5. 只有此后新owner才可写文件或创建delivery Git资源。

创建、网络或校验失败时UD仍是activation owner；相同transition可幂等重试，不接受orphan或duplicate owner。merge和cleanup不属于handoff授权。

### 4.5 Transition protocol

每次mutation绑定`transitionId`、`expectedState`、`stateVersion`、`ownerTaskId`、truth/base/candidate SHA、scope fingerprint、resource set和postcondition。执行前compare-and-set，执行后read-after-write。相同transition与相同binding只复用原结果；同id不同binding或state/SHA/owner/scope不符时fail closed。

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

- 一个不可独立合并、需要共同原子验收的跨服务能力：一个 FL、多个 slices、一个 Global RI、一个 PR。
- 多个可独立安全合并且共享阶段目标的 feature：一个 SL 管理多个 FL；每个 FL 独立 branch/worktree/FP/RI/PR/merge。
- 任一 FL PR 必须独立、安全、向后兼容地进入 <code>main</code>。
- feature 写路径或共享 contract scope 重叠时，按依赖顺序执行；无法保持独立安全时合并为一个 FL。
- SL 启动 FL 前检查 active FP、允许写路径、protected scope、contract/shared scope 和依赖，不接管未知或已有 owner 的资源。

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

## 7. Stage 生命周期、并行与 review

### 7.1 Stage 生命周期

~~~text
STAGE_AUTHORIZED
  -> FL_COORDINATION
  -> STAGE_REVIEW
  -> ORDERED_MERGE
  -> MAIN_STAGE_ACCEPTANCE
  -> FL_CLEANUP
  -> STAGE_AWAITING_CLEANUP
  -> CLOSED
~~~

- <code>STAGE_AUTHORIZED</code>：Stage Start 绑定有效，SL 创建本地 Stage Packet。
- <code>FL_COORDINATION</code>：按依赖与运行容量启动 ready FL。
- <code>STAGE_REVIEW</code>：用精确 FL candidate 和 review bundle 做组合验证。
- <code>ORDERED_MERGE</code>：每个 FL 分别取得 merge 确认并按依赖顺序合并。
- <code>MAIN_STAGE_ACCEPTANCE</code>：全部合并后，SL 在最新 <code>main</code> 执行 exit criteria。
- <code>FL_CLEANUP</code>：各 FL 在各自 task 内分别取得 cleanup 确认并清理。
- <code>STAGE_AWAITING_CLEANUP</code>：所有 FL cleanup 完成，等待 SL task 内 Stage Cleanup 确认。
- <code>CLOSED</code>：SL 本地 Stage Packet、coordination/verification 资源已清理，SL 已 archive。

### 7.2 FL 里程碑与容量

FL 有 parent SL 时只主动返回：

- <code>BLOCKED</code>：阻塞原因、owner 与所需决定；
- <code>PR_READY</code>：独立 PR gates 已满足；
- <code>READY_FOR_STAGE_REVIEW</code>：精确 accepted candidate 和 Stage Review bundle 已就绪；
- <code>MERGED</code>：merge SHA 与 main 验证结果。

SL 不持续 poll/wait，不创建 watcher 或 registry。subagent 结果自动回唯一 parent；SL 仅在消息到达或 Human 恢复时推进，并按运行容量启动依赖 ready 的 FL。

### 7.3 Review 与返工

FL 在 required slices 达到 <code>CANDIDATE_READY</code> 后创建 Global RI，并提供：

~~~text
featureKey
baseSha
sliceIds
candidateShas
featurePacket
acceptanceCommands
~~~

Stage Review bundle 至少包含：

~~~text
stageKey
truthBaseline
orderedFeatureKeys
exactFeatureCandidates
featureReviewResults
dependencyAssumptions
stageAcceptanceCommands
~~~

SL 可为 Stage Review 创建 clean-context Stage RI；SL 或 Stage RI 只读精确 candidates。失败路由：

- implementation finding：Stage RI → SL → corresponding FL → IT/RI；
- design gap：Stage RI → SL → UD → exact Design Owner/Design Revision Task → UD truth merge → affected FL；
- non-design decision：SL → exact decision owner → `DECISION_RESOLVED` → SL；
- candidate 变化：旧 Stage Review 失效，重新验证新 exact candidate；
- 上游 merge 后：下游 FL merge 最新 <code>main</code>，追加 candidate commit，重跑自身 review/CI，并在 Stage Review 依赖受影响时重跑相应阶段验证。

## 8. 自动与人工边界

所有mutation使用同一transition guard：读取exact state/binding，compare-and-set，执行一次，read-after-write并验证postcondition。非法顺序、重复但binding不一致、main/candidate漂移、owner/scope/resource冲突时fail closed并按真实status显示下一步。

自动进行：

- 普通讨论、status/evidence读取和exact resume；
- 已确认Direct scope内的修改、focused verification、push与PR创建，停止于`PR_READY`；
- confirmed Proposal的UD串行review、integration、verification、push和design PR创建，停止于`DESIGN_PR_READY`；
- design merge/main CI后UD发送coverage通知并进入`ACTIVATION_DECISION_READY`；
- Human确认activation后，UD创建recommended Direct/FL/SL并执行两阶段handoff；
- confirmed topology内SL -> FL/Stage RI、FL -> IT/RI的收窄assignment；
- IT/RI typed result返回direct execution parent；
- SL/FL只启动dependency-ready、scope不冲突且WIP容量允许的work item；
- feature candidate/review通过后FL push并创建PR。

Human routine gate仅有四类：

1. 确认完整Proposal Preview，或创建/扩围其他有状态Direct/Feature/Stage owner和资源；
2. 每个main merge；
3. UD post-merge delivery activation；
4. owner cleanup/abandonment；

阻塞性业务/语义决定只在确有选择时请求Human；精确Recovery接管只在原owner缺失或资源失配时请求Human。二者是异常处置，不新增每步process gate。一次Proposal Preview确认覆盖Design Owner写入、Proposal提交和UD创建design PR并停止于`DESIGN_PR_READY`；其他owner启动确认覆盖预列明拓扑到stop point。ordinary discussion、相同binding重试和预授权child assignment不重复确认。

## 9. Git 资源、PR 与合并协议

本节是 OES task 的 Git 权限与执行唯一真相。GitHub ruleset 是服务端最后防线，task 仍必须执行本节本地前置检查、角色隔离、验证与清理约束。

仓库必须保持以下 server baseline；不一致即为 blocker：

- active ruleset <code>protect-main</code> 作用于默认分支 <code>main</code>，bypass 为空；
- 禁止删除和 force-push <code>main</code>，所有变更必须经 PR；
- required check 为 <code>Baseline Checks</code>，合并前 branch 必须更新到最新 <code>main</code>，conversations 必须解决；
- 仅允许 Merge Commit；Squash、Rebase、auto-merge 与自动删除 head branches 关闭；
- required approvals 在单一 Human reviewer 阶段为 0；增加 reviewer 时由 HDO 同步调整；
- Actions 默认只读，显式最小权限以 workflow 为准。

### 9.1 角色权限矩阵

| 角色 | Git资源 | 可写范围 | Remote/PR/main | cleanup |
| --- | --- | --- | --- | --- |
| HDO | 无强制资源 | 只作决定和gate确认 | 只作确认 | 只作确认 |
| Direct owner | 一个短期Change Set branch/worktree；editorial source无Git资源 | exact Direct scope；不写稳定语义 | 只push自己的branch/PR；Human确认后Merge Commit | main验证后清理自身资源 |
| Design Owner | 一个proposal branch/worktree和可选Workspace | confirmed Workspace/Proposal范围 | 默认不push；把exact local Proposal SHA交UD；不merge main | canonical coverage或abandon后经确认清理自身资源/locator |
| UD | canonical design integration branch/worktree | Human-confirmed Proposal或`CANONICAL_EDITORIAL_PATCH` | 只push自己的design branch/PR；Human确认后Merge Commit | `NO_EXECUTION`或`HANDOFF_VERIFIED`后清理自身integration资源 |
| SL | 本地stage coordination/verification worktrees | Stage Packet；verification只读candidates | 不push、不创建PR、不merge main | 全部FL cleanup和stage acceptance后清理自身资源 |
| FL | feature integration和分配的slice worktrees | FP、integration lane和feature scope | 唯一push feature branch/PR；Human确认后Merge Commit | Human确认后清理feature资源 |
| IT | 使用FL分配资源 | 一个Frozen Slice | 不push/PR/merge | 不独立清理 |
| RI | 使用parent分配的clean context | 默认只读exact SHA | 不push/PR/merge | 不独立清理 |

同一task不兼任相互制衡角色。通知、decision owner或request origin不获得artifact ownership。

### 9.2 Branch 与 worktree 创建

普通Direct owner、Design Owner、UD、SL或FL 只能为自己拥有的资源创建 branch/worktree；editorial source Direct owner不创建Git资源，IT/RI资源由parent创建。创建前必须：

1. 读取 <code>git status --short</code>、<code>git worktree list --porcelain</code>、相关 local/remote refs；
2. fetch <code>origin main</code>，记录 exact <code>origin/main</code> 与 truth SHA；
3. 确认目标 key、owner 和资源状态；未知既有资源列入 protected scope；
4. 列出 dirty worktree、未跟踪文件、未合并 branch 和其他 task commit；
5. 从 exact SHA 创建 owner 约定的 branch/worktree，不从 dirty 目录派生；
6. 重新读取 branch、HEAD、upstream 与 clean status，完全匹配才写入。

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

candidate 交给 FL 或 RI 后不得 amend、rebase 或 force-push；返工追加 commit。RI 审精确 SHA，不以工作区当前内容替代 candidate。

多 slice feature 使用 <code>git merge --no-ff ACCEPTED_SLICE_BRANCH</code> 集成，使 accepted candidate 保持祖先；不得用 cherry-pick 替换已记录 candidate。

SL 的 verification worktree 只用于 checkout/merge 精确 FL candidates 和运行 Stage Review。任何临时组合 commit/refs 均保持 local、不得 push、不得成为 FL candidate；验证报告记录输入 SHA、命令、literal result 和 exit code。Stage Review 不授予 SL 修改产品代码或解决 FL conflict 的权限。

### 9.4 Push、PR 与 required CI

Remote 写入只允许 Direct owner push自己的Change Set branch、UD push design integration branch，或 FL push feature integration branch。每次 push 前 fetch 并验证：

- <code>origin/main</code> 与 Change Set/FP/Proposal baseline 关系明确；
- local head 是 exact candidate；
- remote branch 不存在，或 remote head 等于已记录 head；
- owner worktree clean；
- refspec 只包含 owner branch，不含 <code>main</code>、其他 branches 或 tags。

禁止 direct push 到 <code>main</code> 和 force-push。PR 以 <code>main</code> 为 base，并列出 scope、protected scope、candidate SHAs、精确验证、数据/契约影响、剩余风险和 rollback。

merge gate：

- <code>Baseline Checks</code> 成功；
- branch 已 merge 最新 <code>main</code>，不 rebase；
- findings、conversations 和 annotations 已处理；
- PR head 与 owner 报告 SHA 一致；
- 只使用 Merge Commit。

CI 失败时追加正式修复 commit 并重跑，不降低 ruleset、添加 bypass、扩大 token 权限或跳过验证。

### 9.5 Merge 顺序与 main 复测

Direct PR、design PR、单 feature或阶段中的每个FL PR都必须由对应owner发独立merge确认。确认后owner执行一次Merge Commit，不自动删除branch。

阶段按依赖顺序逐个 merge：

1. SL 确认相应 Stage Review 对 exact FL candidate 有效；
2. 对应 FL 展示独立 merge 卡并取得 Human 确认；
3. FL 执行 Merge Commit 和 post-merge main 验证，返回 <code>MERGED</code>；
4. 上游 merge 后，下游 FL merge 最新 <code>main</code>，重新 review、CI 和必要 Stage Review；
5. 全部 FL merge 后，SL 在 latest <code>main</code> 运行 stage exit criteria。

每次 merge 后必须验证：

1. fetch 后 <code>origin/main</code> 等于 PR <code>merge_commit_sha</code>；
2. merge commit 有两个 parent，第二 parent 等于 confirmed PR head；
3. accepted candidates 均为 merge SHA 祖先；
4. merge tree 与通过 review/CI 的 head 一致，或精确解释差异；
5. exact main merge SHA 触发 required workflow；
6. <code>Baseline Checks</code> 及 required steps 成功；
7. protected resources 保持原状。

PR CI 与 main push CI 是两个独立 gate。

### 9.6 完成、分层清理与 Recovery

普通Direct在PR merge、exact main CI和main validation后进入`CLEANUP_READY`；Human确认后只清理卡中exact clean/merged/SHA-matched资源。editorial source收到coverage notice后关闭自己的无Git Change Set，不清理UD资源。

UD在design merge与main CI后立即幂等发送`CANONICAL_MERGED`给Design Owner并进入`ACTIVATION_DECISION_READY`。Human选择`NO_EXECUTION`，或新delivery owner达到`HANDOFF_VERIFIED`后，UD才进入`UD_CLEANUP_READY`。UD cleanup只移除本次integration branch/worktree/remote branch，长期UD task和locator保留；deferred implementation以后仍可由UD从exact truth重新激活。

Design Owner收到`CANONICAL_MERGED`后验证Proposal coverage。Human在Design Owner task确认后清理proposal branch/worktree和active locator；仍有开放问题则保留task/Workspace，全部冻结才删除已承接内容并archive。Design Owner和UD互不清理对方资源。

单独 feature 在 main 复测成功后进入 <code>COMPLETE_AWAITING_CLEANUP</code>。Human 在该 FL task 确认 cleanup 后，由 FL：

1. 从 latest <code>origin/main</code> 创建独立 cleanup branch/worktree；
2. 只删除该 FP，经 cleanup PR、required CI、Merge Commit 和 main 复测；
3. 验证 PR 已 merge、candidates 为 <code>origin/main</code> 祖先、精确资源 clean；
4. 使用无 force 的精确路径移除 worktrees 和已合并 local branches；
5. remote head 仍等于记录 SHA 时删除精确 remote temporary branches并复读 refs；
6. archive FL。

有 SL 时，stage main acceptance 通过后，各 FL 仍在各自 task 内分别取得 Human cleanup 确认并执行上述流程。SL 不清理 FL 资源。全部 FL cleanup 完成后，SL 进入 <code>STAGE_AWAITING_CLEANUP</code> 并展示 Stage Cleanup 卡。Human 确认后，SL：

1. 复核 exact FL cleanup results、Stage Packet scope 与本地资源 owner；
2. 删除 Stage Packet 并提交本地 deletion，使 coordination worktree clean；
3. 精确移除 verification 与 coordination worktrees；
4. 以 expected old SHA 使用 compare-and-delete 删除只属于该 stage 的 local refs；
5. 验证 Stage Packet、worktrees 和 refs 均消失，protected scope 未变；
6. archive SL。

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

明确实现意图显示：

```text
1. Direct（建议项按真实status决定）
2. 常规协同框架
3. 继续讨论
```

#### 9.7.2 有状态执行卡

稳定设计首次写入前，task先展示完整只读Proposal Preview；确认卡绑定该Preview的目的、规范结论、state/typed routes、逐文件变化、scope/protected scope、owner、验证和stop point。task内部绑定preview fingerprint、exact ids、SHAs、resources、state version和transition id。Human确认后才创建资源、写Proposal commit并提交UD；diff与preview一致时不重复询问Proposal提交。

非设计owner的一个确认覆盖列明拓扑到stop point；scope/owner/protected scope或独立交付物变化才换卡。Proposal Preview、每次merge、UD post-merge activation、cleanup/abandonment分别确认。technical ids由task维护，Human无需复述。

#### 9.7.3 UD post-merge card

main CI成功后UD必须在同一task自动展示：

```text
设计已合并，main CI已通过。
1. 按建议开始实现（建议：Direct | 单Feature | Delivery Stage）
2. 暂不实现
3. 继续设计
4. 查看证据
```

选项1同时授权创建recommended delivery owner与两阶段handoff，不授权delivery merge或cleanup。选项2进入`EXECUTION_DEFERRED`并使UD cleanup-eligible；以后在UD提出implementation重新评估。选项3向exact Design Owner发送`DESIGN_CONTINUATION_REQUIRED`并增加revision epoch。UD不得将implementation请求转给initiating/request-origin task。

#### 9.7.4 编号、绑定与失效

卡index在task内单调递增且不复用。只有一张latest有效待确认卡时，单独`1`或`2`执行状态变更；`3/4`按卡语义只读或显式继续设计。新意图、新卡、执行、取消、binding/state变化使旧卡失效。每次执行前后校验expected state/version、owner、truth/candidate、scope fingerprint、resources和postcondition；相同transition重复只复用原结果。

#### 9.7.5 Typed routing

`ASSIGNMENT_RESULT`只返回direct execution parent；`BUSINESS_DECISION_REQUIRED`只到exact decision owner；`REVISION_REQUIRED`和`DESIGN_CONTINUATION_REQUIRED`只到exact Design Owner；`ACTIVATION_DECISION_READY`保留在UD；`STATUS_NOTICE/CANONICAL_MERGED`只通知，不转移owner。不存在generic callback或祖先默认路由。

所有main变更继续使用artifact-owner branch、PR、required CI、Human Merge Commit和main验证。任何owner只清理自己的exact资源。

#### 9.7.6 Shortcut

调用`$oes-collaboration-commands`只读取并展示本小节，不创建资源或推进gate。

<!-- END OES_COLLAB_COMMANDS_V6 -->

### 9.8 失败恢复

- network失败且remote write未验证：保留exact candidate/state；同transition幂等重试；
- push前remote head变化或main前进：停止，fetch并刷新binding/review/CI；
- conflict：只由artifact owner在clean integration worktree解决并追加commit；
- duplicate message：相同transition/binding复用结果，不重复task/ref/PR/merge；
- 新owner在accept前失败：旧owner保持current，delivery禁止写入；
- CI/post-merge验证失败：保留资源与证据，追加正式修复，不改写发布历史；
- Design Owner缺失：UD显示Human-confirmed Recovery Design，不按标题猜测；
- parallel scope/dependency冲突：不启动或串行到唯一integration owner；
- cleanup precondition失败：保持awaiting cleanup，不使用破坏性命令；
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

UD integration与activation：

```text
UD_REVIEW -> DESIGN_PR_READY -> MERGE_CONFIRMED -> TRUTH_MERGED
-> MAIN_CI_PASSED -> ACTIVATION_DECISION_READY
   | NO_EXECUTION -> EXECUTION_DEFERRED -> UD_CLEANUP_READY
   | CONTINUE_DESIGN -> DESIGN_REVISION_REQUESTED -> AWAITING_PROPOSAL[r+1]
   | START -> HANDOFF_PENDING -> HANDOFF_VERIFIED
       | delivery owner: DELIVERY_ACTIVE
       | UD: UD_CLEANUP_READY
```

`CANONICAL_MERGED`只在`MAIN_CI_PASSED`后幂等发送给Design Owner；它与UD的activation分支并行且不转移owner。Routine path无环；只有显式`REVISION_REQUIRED`、`CONTINUE_DESIGN`或delivery `DESIGN_GAP`创建new revision epoch。

Feature与Stage继续使用：

```text
FL: COMPLETE_AWAITING_CLEANUP -> CLEANED
SL: MAIN_STAGE_ACCEPTED -> FL_CLEANUP -> STAGE_AWAITING_CLEANUP -> CLOSED
```

## 11. 明确排除

本模型不引入：

- 长期全局执行控制 task；SL 只是已确认 scope 内的有界临时 owner；
- capability command 层或长期 PC/IV；
- watcher、heartbeat、持续 wait loop、Pull inbox 或历史/全局 thread registry；
- 广播同步；
- task 历史、状态流水、迁移账本或 cleanup archive；
- 由 SL 代替 FL 拥有产品 branch、PR、merge 或 cleanup；
- 把 Stage Start 称为 Proposal，或在 truth merge/main CI 之前启动执行。

canonical repository、exact task id、单一parent回传、status-driven执行方式、受控委派、transition guard和Human gate共同构成执行边界。
