# OES 精简协同执行模型

## 1. 目标与非目标

本模型用于让 OES 的讨论、设计、并行实现、审核、合并和清理保持高效、可见、可恢复。

核心目标：

1. 普通讨论与小修改保持轻量；
2. 稳定设计只由 exact Global Unified Design（UD）写入 canonical truth；
3. 多 feature 交付可以由一个 Stage Lead（SL）协调多个 Feature Lead（FL）并行推进；
4. Human 能在正常 Codex 项目任务列表中看到所有 owner 与独立 reviewer；
5. 已确认范围内的权限、环境、测试、Git 和恢复动作自动执行；
6. main 继续使用 PR、required CI、Human merge 与精确清理保护；
7. 框架运行成本必须显著低于被交付工作的成本。

本模型不建立全局调度中心、task registry、watchdog、heartbeat、pull inbox、历史状态账本或长期过程档案。异常优先修复 exact current owner，不通过新增协调角色掩盖运行时缺陷。

## 2. 最小角色与专业标准

### 2.1 Human Decision Owner（HDO）

Human 负责确认有状态工作的根范围、Proposal Preview、每次 main merge、真正的 scope/protected scope/capability 扩大、cleanup、abandonment 和不可自动消解的业务语义。Human 不选择内部角色、不复述 task id/SHA/fingerprint，也不批准已确认范围内的普通命令。

### 2.2 Design Owner

Design Owner 以 Principal Architect 级标准研究一个稳定设计主题，读取最新 canonical truth，明确边界、契约、失败模式、兼容和演进，先展示完整只读 Proposal Preview，Human 确认后才形成 local-only Proposal并只提交 exact global UD。

Design Owner 不 push、不创建或更新 Design PR、不 merge、不替代 UD 写 canonical truth。

### 2.3 Global Unified Design（UD）

UD 是全局唯一、长期存在的 Chief/Enterprise Architect 级 canonical writer、串行设计审核者和 Design remote owner。UD只接受 Human-confirmed semantic Proposal 或语义影响为 `NONE` 的 canonical editorial patch，负责 Design PR、Human-confirmed Merge Commit、main CI，以及设计合并后的正确delivery路由。

任何 subagent、临时 task、同名 task 或普通父会话都不得代替 exact global UD。

### 2.4 Direct

Direct 由一个 Senior/Principal Engineer 级 owner 闭合一个无稳定设计变化的有界 Change Set。它不创建 SL、FL 或 RI。修改repository时使用独立branch、PR、required CI、Human merge与cleanup；只操作host-local资源时使用local执行载体，不创建Git交付资源。

### 2.5 Stage Lead（SL）

SL 是一个多 feature Delivery Stage 的 Technical Delivery Lead。`REPOSITORY_DELIVERY` 中，SL建立一个本地 Stage Packet，按独立交付物拆分FL，管理依赖、WIP、moving-main、Stage Review和状态汇总，只在本地verification worktree组合exact candidates；`HOST_LOCAL_OPERATION` 中，SL只使用task-local current evidence协调同等范围，不创建Stage Packet、branch或worktree。SL不写feature产品代码，不建立remote stage product branch、总PR或stage merge。

### 2.6 Feature Lead（FL）

FL 是一个独立 feature 结果的 Staff/Principal Engineer 级 owner。`REPOSITORY_DELIVERY` FL拥有一个active Feature Packet、owner-exclusive branch/worktree、完整feature candidate、Feature RI、Draft PR及自己的merge/main验证/cleanup结果；`HOST_LOCAL_OPERATION` FL拥有精确本地资源范围、current operation evidence、按风险需要的Feature RI和验收结果，但默认不拥有Feature Packet、branch/worktree、Git candidate或PR。

### 2.7 Implementation Task（IT）

IT实现一个frozen slice，通常是FL的bounded subagent。IT不push、不创建PR、不merge、不清理owner资源。只有长期运行、需要独立恢复或Human需要直接跟踪的IT才升级为可见role task。

### 2.8 Review & Integration（RI）

RI以Principal Reviewer/SDET标准规划不重复、风险驱动、可复现的验证，默认只读exact candidate：

- Feature RI：独立验收一个FL；
- Stage RI：验收多个FL的组合和Stage exit criteria；
- System Review：仅Human明确绑定全系统范围时创建。

RI不成为实现owner；发现缺陷后把精确finding返回artifact owner。

### 2.9 Portfolio Planner（Planner）

Planner是长期可见的Principal Portfolio Planner / Principal Architect级只读顾问，持续以latest canonical truth、open `capability-candidate` Issues、正常可见task、PR/CI、阻塞、Human优先级和可用容量为输入，默认使用Plan mode形成月、周、日三级滚动项目组合建议。

Planner不成为work item owner、artifact owner、canonical writer、reviewer、remote owner或全局调度中心；不写设计/代码、不创建branch/worktree/PR、不merge、不cleanup，也不建立task registry、项目状态数据库、watchdog、持续polling或第二真相源。Human选择规划方向只形成新的自然语言工作意图，后续仍由现有Direct、Design、FL或SL入口按本模型确认和执行。

## 3. 默认路由

普通讨论是唯一默认入口，不创建role、branch、worktree、Workspace或Packet。

| 真实情况 | 路由 |
| --- | --- |
| 只读咨询、比较、状态 | 当前task直接回答 |
| 只记录尚未设计、尚未实现的能力想法 | cutover后登记一个`capability-candidate` Issue；不创建role task或Git资源 |
| 跨业务方向、基础能力和时间盒的月/周/日组合规划 | Planner |
| 小而明确、无稳定语义变化 | Direct |
| 单次、有界且不修改repository的Docker、数据库、模拟器或本地服务维护 | Direct + `HOST_LOCAL_OPERATION` |
| 跨turn、多阶段、需要独立验收的一个host-local结果 | FL + `HOST_LOCAL_OPERATION` |
| 两个及以上相互独立的host-local结果 | SL → sibling FLs，均使用`HOST_LOCAL_OPERATION` |
| 新服务、跨服务契约/事件、权限、租户、共享抽象、AI工具协议或canonical gap | Design Owner → UD |
| 一个独立可验收feature | FL |
| 两个及以上独立可交付feature | SL → sibling FLs |
| 同一feature的原子实现slices | 一个FL → bounded ITs |

系统读取真实状态后只显示当前合法选项并标记一个建议。Human不选择IDT/CDT，也不需要主动指定内部reviewer。

### 3.1 Planner规划契约

Planner可由Human手动唤醒，或由Codex标准定时能力在同一个可见Planner task中按约定时间唤醒；定时只触发一次只读刷新，不形成框架heartbeat、后台polling或自动执行授权。

Planner每次从现有真相重新计算，不维护镜像状态。规划只保留三层：

1. 月计划：给出CRM、ERP、基础服务、工程优化等不同方向的有界里程碑、成功指标、依赖和容量比例；
2. 周计划：把已选月度方向转化为本周可验收成果、关键路径、并行关系和风险；
3. 日计划：按Human配置的工作时间盒（默认09:00—18:00）给出可在收工前完成验收的候选组合。

每次通常给出3—5个不同项目方向；不足3个真正可执行方向时只显示有效项，不用低价值工作凑数。每个候选必须包含明确成果、时间估算与缓冲、停止点、验收标准及证据、依赖、风险、置信度、非目标、Human决策点、上层里程碑关联和与其他候选的冲突关系。Planner必须给出至少一个推荐组合；能够并行的方向可同时推荐，写入边界、稳定设计、资源或依赖冲突的方向不得组合。

月度和周度里程碑必须显示`正常 | 有风险 | 阻塞 | 已完成`的规划健康度、当前进度、预测完成时间和偏差原因；这些只是Planner的只读判断，不新增delivery状态或状态转换。

Planner优先收尾、解除阻塞和关键路径，默认保留约20%风险缓冲并限制WIP。未关联周/月目标、设计未冻结、依赖未满足、执行环境未就绪或无法在目标时间盒闭合验收的事项不得进入推荐执行组合。每日只轻量校正，每周重新排序，每月重新选择方向；仅关键阻塞、优先级或依赖变化触发中途重算并向Human提示。

月、周、日计划是带生成时间与有效期的noncanonical task消息：每日计划到期后重新评估，不机械顺延；计划与实际只用于校准后续估时，不形成长期日报、周报、月报、历史账本或repository artifact。Human选择一个或多个方向后，Planner输出简洁执行意图并进入现有路由；该选择不绕过Proposal、任务启动、main merge、scope扩大或cleanup确认。

### 3.2 执行载体选择

角色、Human可见性和执行载体相互独立。创建有状态owner前，creator必须根据真实工作回答：是否写repository、是否形成Git candidate/PR、是否操作host-local资源、是否跨turn、是否需要独立review与Human跟踪。

只允许两种owner执行形态：

| 形态 | 适用范围 | task与资源 |
| --- | --- | --- |
| `REPOSITORY_DELIVERY` | 修改repository并形成可合并结果 | Human-visible project task；owner-exclusive branch/worktree；按角色使用Packet、candidate、RI和PR |
| `HOST_LOCAL_OPERATION` | Docker、数据库、模拟器、本地服务等不修改repository的本机操作 | Human-visible project-associated local task；task-local current evidence；默认无worktree、branch、Packet、Git candidate和PR |

task identity/Human可见性验收与owner Git资源准备是两个独立判断，不要求平台拆成两个创建调用。`REPOSITORY_DELIVERY`可以在task创建时或创建后准备owner-exclusive branch/worktree，但在task可见性与Git资源都验证通过前不得开始role-owned repository写入；`HOST_LOCAL_OPERATION`始终不得为task创建或后续执行准备worktree。可见task不等于worktree task，worktree也不得代替可见性验收。

`HOST_LOCAL_OPERATION` task创建时不得传Git `startingState`，不得调用worktree provisioner，也不得因task创建隐式fetch/pull。若creator已经验证一个本地canonical commit，可把exact SHA作为只读truth binding传给child；child只验证本地object与规范内容，不重复联网。只有任务结果依赖尚未在本地证明的remote truth时，creator才在创建前显式完成一次remote freshness检查。

`REPOSITORY_DELIVERY`仍在worktree创建前验证latest remote main；provisioner必须继承与creator一致的approved network/proxy profile。真实需要remote的创建因profile不一致而失败属于runtime transport defect，不得通过把无关host-local任务强制联网来掩盖。

host-local owner发现必须写repository时，保持host资源和证据不变，停止repository写入并使用既有scope/capability扩大边界重新路由；不得在local task中静默开始Git交付。

### 3.3 能力候选登记

能力候选只表示“值得保留、尚未设计、尚未实现”的项目想法，不是缺陷状态、Design Workspace、Backlog、roadmap承诺或执行授权。cutover完成后，带`capability-candidate` label的open GitHub Issue是唯一intake真相；Human看到的名称统一为“能力候选”。

每个候选使用标题`[Capability] HUMAN_READABLE_CAPABILITY`，正文只保留能力、业务价值/目标、当前问题和`暂不设计、暂不实现`。Console或当前对话只是一键触发入口，不成为owner：Human确认精确候选后，先搜索同名同义的open候选；命中则返回既有链接，未命中才创建一个Issue并返回链接，然后停止。登记不创建Codex task、worktree、branch、Packet、PR或CI。

GitHub不可用时保留本次Human确认的输入并报告阻塞，不写本地影子清单。Planner直接读取open候选，不复制为repository roadmap或第二数据库。候选被取消、判定重复或失效时关闭；Human选择进入Design或Direct时，只有在exact owner task完成创建与接受后才关闭原Issue，避免意图丢失。

本路由在一次性迁移完成前保持inactive：既有`docs/plans/intake.md`继续是唯一可写intake，不并行创建候选Issue。迁移必须在独立Human-confirmed Direct中幂等创建label和全部既有候选、逐项验证唯一链接，并仅在全部成功后通过一个PR删除旧文件及其Index链接；该PR合入且main CI通过后才激活Issue入口。中断或失败时保留旧文件，不形成双写真相。

## 4. Human可见状态与复杂度预算

### 4.1 Human可见状态

普通状态只使用：`讨论中`、`设计审核中`、`实现中`、`审核中`、`等待合并`、`已完成`、`阻塞`。

状态提示最多包含当前、范围、进度、阻塞、下一步。SHA、nonce、fingerprint、CAS、checkpoint、typed result与内部恢复细节只在“查看证据”时展示。

### 4.2 复杂度预算

1. 新增一个常规状态，必须删除或合并一个旧状态；
2. 新增一个Human gate，必须证明无法由exact owner自动处理；
3. 新增一个角色，必须证明现有角色存在不可消解的职责冲突；
4. Direct不得创建SL、FL或RI；
5. 一个FL同时最多一个Feature RI；
6. 一个异常优先修复原owner；
7. Human应在30秒内理解当前状态；
8. 证据数量不得随内部状态数量线性增长；
9. 技术绑定只能服务机器校验，不得成为Human日常流程；
10. 一个active runtime cutover未完成前，不启用新的常规协同能力；即使目标设计已经冻结，也不得创建role task、定时触发或运行资源。

## 5. Task身份、标题与可见性

### 5.1 标题

可见role task使用：

- `[Design] HUMAN_READABLE_TOPIC`
- `[Planner] OES Portfolio Planning`
- `[UD] Unified Design`
- `[Direct] HUMAN_READABLE_CHANGE_SET`
- `[SL] HUMAN_READABLE_STAGE`
- `[FL] HUMAN_READABLE_FEATURE`
- `[IT] HUMAN_READABLE_FEATURE / HUMAN_READABLE_SLICE`
- `[RI] HUMAN_READABLE_REVIEW_SCOPE`

标题只供Human识别；routing、ownership和authorization始终使用exact task id与direct parent binding。

### 5.2 必须可见的role task

Planner、Design、Direct、SL、FL、Feature RI和Stage RI必须通过Human-visible、project-associated的task transport创建。`source=exec`或其他不进入正常Codex项目任务列表的transport只能用于bounded IT、helper和短期只读分析，不得创建owner或独立reviewer。

role task只有在creator read-after-create同时证明以下事实后才算创建成功：

1. exact task id、role、title和direct parent正确；
2. project association正确；
3. 出现在正常项目任务列表；
4. Human可打开和读取；
5. creator可发送assignment；
6. child可返回typed result。

任一失败即为`TASK_VISIBILITY_DEFECT`：保持creating owner、暂停该lane、不创建replacement、不允许新task写role-owned资源。

provisioning在正式task id和worktree产生前失败时，只保留一份creation receipt并视为owner尚未创建；同一intent重试必须幂等，不得产生duplicate task、partial worktree或残留owner binding。

### 5.3 单一owner

任何有状态work item同时只有一个current owner和一个artifact owner。通知不转移ownership；新owner接受且creating parent read-after-accept之前，旧owner保持current。不得静默替换、按标题猜测或创建双owner。

### 5.4 Exact UD locator

UD只通过repository Git common directory中的`codex-runtime/ud-target.json`定位。该pointer只保存schema、repository root、exact task/host和expected title，atomic更新；每次使用前验证repository、task、cwd和title。locator缺失或无效时fail closed并报告，不按标题搜索、不创建第二个UD、不使用subagent替代。Design Owner的active locator同样只保存当前exact owner和Workspace，不建立历史registry。

## 6. Execution profile与精简handoff

### 6.1 Profile bootstrap

创建Direct、SL、FL、独立IT或RI前，creating owner必须通过支持原子profile注入的启动路径准备最小充分能力。`REPOSITORY_DELIVERY` profile覆盖owner workspace和Git metadata、标准build/test、task-owned service/database、localhost与approved network、credential reference、task evidence root，以及`on-request + auto_review`的剩余低风险平台审核。`HOST_LOCAL_OPERATION` profile只加入本次精确需要的Docker socket/CLI、数据库、模拟器、本地服务、localhost和task evidence能力；repository保持只读且不以Full Access代替精确能力。

Full Access不得作为普通owner profile的回退。

### 6.2 一次目标会话验证

target task在第一次role-owned写入前从自己的实际session读取profile，并完成所选执行形态必要的file、Git、toolchain、local service/network smoke。`HOST_LOCAL_OPERATION`不执行无关Git remote/network smoke，并必须证明未创建worktree且执行前后的repository状态完全一致；既有dirty/untracked内容只作为protected scope保留，不要求清除。creator复核一次真实结果即可转移ownership。

只要task、host、repository、worktree、toolchain、credential identity和permission policy未变，后续turn复用该profile，不重复生成证明。发生真实漂移时保持原owner/candidate，自动修复同一个任务并补做一次受影响smoke。

已确认范围内的普通用户permission prompt目标值为零。只有生产或共享资源、新secret、付费外部系统、host/system privilege、cross-owner/destructive operation或真实scope/capability扩大才询问Human。

### 6.3 Handoff

内部只保留三个语义步骤：

```text
任务已创建 → 目标任务已接受 → 父任务确认交接完成
```

Human不需要理解或操作中间技术状态。身份、可见性、profile或smoke失败时修复同一个task；不为标题、权限、网络或可见性问题重复创建owner。

### 6.4 Owner资源拓扑

`REPOSITORY_DELIVERY`长期owner的目标拓扑是稳定路径中的owner-exclusive clone和task稳定artifact root；owner之间不共享可写Git common directory，`/private/tmp`只承载可重建scratch。`HOST_LOCAL_OPERATION`使用saved project的local task载体和task稳定artifact root，不创建owner clone/worktree，且不得写repository。repository拓扑目标只有repository-owned profile、driver、cleanup schema与测试合入main且effective profile明确启用后才约束新owner。在cutover完成前，existing owner继续使用其frozen exact path/ref/resource binding；允许把Packet、bundle和current evidence checkpoint复制到稳定artifact root，但不借机迁移或创建replacement owner。

## 7. Design与UD流程

### 7.1 Proposal Preview

Design Owner必须基于最新truth展示完整只读Preview，至少包含问题、结论、流程变化、文件范围、protected scope、迁移、验证和停止点。生成Preview不创建资源。

Human对exact Preview的一次确认授权：

```text
形成local Proposal → 本地验证 → 提交exact UD → UD审核/集成/Design PR → DESIGN_PR_READY
```

merge、`NEW_DESIGN` delivery activation和cleanup分别确认。技术binding由机器在task-local evidence中生成和验证；Human不复述。Preview的语义、文件范围或protected scope变化时必须重新展示完整Preview。

### 7.2 UD审核与Design PR

UD验证Human confirmation、source owner、latest canonical base、exact changed paths和Proposal内容。语义不完整时返回同一Design Owner修订；接受后由exact UD创建integration candidate、Draft Design PR并等待required CI。

Design Owner、请求来源、父task或host helper不得先写远端再让UD复核。host transport只能机械执行UD在mutation前签发的一次性精确动作，结果必须返回UD read-after-write。

### 7.3 Post-merge routing

- `NEW_DESIGN`：main CI通过后UD主动建议`Direct | 单Feature | Delivery Stage | 暂不执行`；
- `EXISTING_DELIVERY_DESIGN_GAP`：自动返回exact原SL/FL，更新latest main后恢复affected lane，不发activation card；
- active activation revision：恢复exact原pending owner，不创建replacement；
- canonical editorial：通知exact source Direct owner，不触发delivery。

UD不把implementation发给Design Owner的祖先、最初请求task或其他generic callback。

## 8. Delivery

### 8.1 Direct

Repository delivery：

```text
Human确认根范围 → 实现 → Focused/Affected验证 → Draft PR → Human merge → main验证 → cleanup
```

Host-local operation：

```text
Human确认根范围 → 可见local task/profile验证 → 只读盘点 → exact操作候选 → 必要的破坏性操作确认 → 执行 → 结果复查 → cleanup
```

### 8.2 Feature

Repository delivery：

```text
FL → Feature Packet → 实现/IT → candidate → Feature RI → Draft PR → Human merge → main验证
```

Host-local operation：

```text
FL → task-local current evidence → 实现/IT → exact操作候选 → 按风险Feature RI → 必要的破坏性操作确认 → 执行 → 结果复查
```

一个independently acceptable、reviewable、publishable、main-safe的结果对应一个FL。必须共同原子验收的slices保持一个FL，由bounded IT并行实现。

### 8.3 Stage

`REPOSITORY_DELIVERY` Stage中，SL建立本地Stage Packet，按WIP启动sibling FL。每个FL独立拥有candidate、Feature RI和Draft PR。SL只组合exact candidates和latest-main results，不创建总产品分支或大PR。

纯`HOST_LOCAL_OPERATION` Stage中，SL只在task-local current evidence协调sibling FL、依赖、WIP和exit criteria；每个FL独立拥有精确host资源范围、操作候选和验收结果，不创建Stage/Feature Git资源或产品PR。

FL发现范围实际包含多个独立交付物时返回SL；只要新拓扑仍在confirmed Stage scope、protected scope、capabilities和WIP ceiling内，SL自动调整并只发状态通知。真实扩围或不可消解的owner/write conflict才询问Human。

parent派发child后保存当前checkpoint并结束turn；exact child result到达后恢复。禁止持续polling或占用执行槽等待。

### 8.4 Delivery中的design gap

只暂停affected lane并保留原owner、Packet、branch/worktree、candidate、PR和有效证据。Design truth合并后：

1. UD返回exact original delivery owner；
2. `REPOSITORY_DELIVERY`原owner fetch latest `origin/main`并验证设计merge，affected FL追加集成latest main；
3. `HOST_LOCAL_OPERATION`原owner验证creator已在本地绑定的canonical commit与设计内容；只有结果确实依赖尚未在本地证明的remote truth时才执行一次显式freshness检查，且不得创建worktree、branch或Git candidate；
4. 只运行受影响验证；
5. unaffected candidates/evidence继续复用；
6. 恢复原Stage/Feature。

不得创建新SL/FL、重新执行不受影响工作或把实现路由到祖先task。

## 9. Moving main、测试与证据

### 9.1 三个基线

并行work item区分`truthBaseline`、可自动刷新的`integrationBase`和candidate冻结时的`candidateBase`。

main前进本身不使授权失效。无关变化自动集成并复用证据；相关变化运行affected tests；普通冲突由artifact owner解决；稳定语义冲突进入design gap。candidate冻结后不改写历史，只追加merge/fix commit。

### 9.2 三层验证

1. Focused：changed module、direct unit、lint/typecheck；
2. Affected：受影响依赖、关键集成、兼容与恢复；
3. Full Gate：PR merge前、Stage exit、main merge后。

证据只在candidate、依赖、输入、环境或命令版本改变时失效。RI只补验缺失或受影响风险，不重复owner已证明且输入未变的完整矩阵。

### 9.3 最小证据

每个owner最多维护一个current Packet/status、一个current candidate verification、一个final PR/main verification，以及恢复必需的最小manifest/bundle。Git、task history或最终记录能够重建的中间事实不另建长期receipt、ledger或重复manifest。

## 10. Git、PR与main

本节只约束`REPOSITORY_DELIVERY`。`HOST_LOCAL_OPERATION`不得创建remote branch、PR或main mutation；若需要任何repository写入，必须先按3.2重新路由。

### 10.1 权限边界

- 禁止直接push `main`；
- 产品代码只由Direct/FL owner branch写入；
- Design remote branch/PR只由exact UD拥有；
- SL不拥有产品remote branch或总PR；
- IT/RI不push、不merge；
- 任何main merge必须Human确认；
- 只使用Merge Commit；
- 不force push；
- owner只清理自己的exact资源。

### 10.2 Remote driver

远端mutation使用repository-owned、versioned、tested、idempotent driver。publish、pre-merge、merge和verify-main是可恢复的机器内部阶段，不形成额外Human gate。Human只看到`等待合并`、一张merge卡和最终`已完成/阻塞`。

### 10.3 PR和merge

每个FL在完整candidate和Feature RI通过后才push并创建Draft PR。有parent SL时，Stage Review通过且candidate已整合latest main后进入merge-ready。

Human确认exact PR后，driver在mutation边界重新读取base/head/checks/reviews和latest main；匹配后只执行一次Merge Commit。merge后验证：`origin/main`等于merge SHA、merge具有exact两个parents、accepted candidate为merge祖先、required main workflow成功、protected resources保持不变。

多FL按latest-main串行admission；上游merge后，下游只运行drift/affected matrix，不自动重做完整Feature RI。

## 11. Cleanup

### 11.1 Repository-delivery standalone Direct/FL

main验证后显示一次cleanup卡。owner只删除卡中exact、clean、merged、SHA-matched的Packet、worktree、local/remote temporary branch、IT/RI和临时验证资源。dirty、未知或不匹配资源保持原状。

### 11.2 Repository-delivery Stage

全部FL merge且Stage exit通过后，SL显示一张批量cleanup卡。Human确认一次后：

1. 每个FL清理自己的exact资源并返回结果，不再分别询问Human；
2. 一个FL失败只保留该FL失败资源，已完成项不重复；
3. SL通过一个cleanup-only PR只删除已列明terminal Feature Packets；
4. SL删除本地Stage Packet和自己的协调/验证资源；
5. 最终复核后archive完成的role tasks。

Design Owner与UD分别清理自己的资源，互不代替。

### 11.3 Host-local operation

host操作本身属于已确认work scope，不伪装成Git cleanup。post-check通过后，standalone owner显示一次既有cleanup卡，只列task-local临时证据、scratch和task归档；有parent SL时由Stage批量cleanup卡统一授权。实际host资源、既有repository状态、未知/共享/仍在使用的资源和卡外对象保持原状。

## 12. 失败恢复

统一使用以下规则：

1. 权限、网络、App/host重启、CI等待中断和scratch丢失优先恢复same owner；
2. 一个FL失败只暂停该lane；
3. duplicate message或driver retry读取已有结果，不重复mutation；
4. ordinary conflict只由artifact owner解决；
5. exact owner不可恢复时才显示一次Human recovery card；
6. unknown、dirty、SHA不匹配或owner仍活动的资源保持原状；
7. replacement必须在旧owner终止并验证后创建，禁止双owner；
8. cleanup partial failure只重试失败项。

## 13. Runtime cutover与in-flight兼容

canonical cutover前已经确认或已创建的合法owner、task、branch/worktree、candidate、PR、Packet、evidence和Human card保持exact binding到terminal/cleanup边界，不批量改名、不重新分类、不迁移。新规则只约束cutover后创建的新角色。已有Delivery中的新design truth按existing-delivery route更新，但不替换owner。

### 13.1 当前隐藏role task修复

当前 Collaboration Runtime Cutover Stage 及其三个FL、三个Feature RI保持暂停和全部资源不变。该Stage是本设计的exact existing delivery return target。

canonical merge后按以下顺序恢复：

1. exact原SL读取latest main和本设计；
2. 优先把现有六个task以same exact task id、history、title、owner和candidate原地纳入正常项目任务列表；
3. creator read-after-adopt验证可见、可打开、可继续和双向消息；
4. 验证通过后恢复原lane，不重新实现或重审输入未变的证据；
5. 平台不支持same-id可见化时，原SL显示一张绑定六个task和全部成果的批量recovery卡；
6. Human确认后逐个创建visible replacement，完成new-owner accept和no-double-owner验证，再把旧隐藏task冻结为只读证据；
7. 全部接管完成后继续原三个FL、Feature RI、Draft PR和Stage验收。

在恢复完成前禁止新的隐藏SL/FL/RI、replacement、remote mutation、cleanup、rename或resource deletion。

### 13.2 Planner启用边界

本角色定义可先进入canonical truth，但当前Collaboration Runtime Cutover达到terminal并完成所需验证前，Planner保持未启用：不创建Planner task、不建立定时触发、不迁移现有task，也不改变当前SL/FL/RI。cutover完成后，Human通过既有任务确认卡一次性确认创建一个可见、project-associated的`[Planner] OES Portfolio Planning` task；可选定时安排与该task绑定，不创建第二个Planner或新的协同状态机。

## 14. Human命令契约

本节是Human意图、确认、merge与cleanup的唯一自然语言契约，版本为`OES-COLLAB-COMMANDS/v7`。

<!-- BEGIN OES_COLLAB_COMMANDS_V7 -->

### 14.1 状态

纯查看、解释、讨论、status读取和暂停保留直接响应。默认只显示：

```text
当前：讨论中 | 设计审核中 | 实现中 | 审核中 | 等待合并 | 已完成 | 阻塞
范围：HUMAN_READABLE_SCOPE
进度：COMPACT_PROGRESS
阻塞：无 | HUMAN_DECISION_OR_EXTERNAL_BLOCKER
下一步：NEXT_ACTION
```

需要选择时只显示当前合法选项和一个建议，不显示技术id、SHA、fingerprint、nonce或内部状态。

明确实现意图使用：

```text
1. Direct（建议项按真实范围决定）
2. 常规协同框架
3. 继续讨论
```

#### 14.1.1 能力候选登记

3.3的cutover完成后，Human表达“只记录想法，暂不设计、不实现”时显示：

```text
记录能力候选：HUMAN_READABLE_CAPABILITY
1. 创建本卡列明的能力候选（建议）
2. 继续修改
3. 暂不记录
```

选项1只授权幂等查重和创建一个绑定精确标题、正文与`capability-candidate` label的Issue；命中既有候选或创建成功后返回链接并停止。该确认不授权创建role task、Git资源、设计或实现。迁移cutover前不得显示或执行本卡。

### 14.2 Proposal Preview

Design首次写入前展示完整只读Preview。确认卡：

```text
1. 按本Preview形成Proposal并提交exact global UD审核（建议）
2. 继续修改Preview
3. 暂不提交
```

选项1授权到`DESIGN_PR_READY`；Design PR merge、NEW_DESIGN delivery activation和cleanup分别确认。technical binding由task内部维护，Human无需复述。

### 14.3 UD post-merge

`NEW_DESIGN`使用：

```text
设计已合并，main CI已通过。
1. 按 RECOMMENDED_SHAPE 开始实现（建议）
2. 暂不实现
3. 继续设计
4. 查看证据
```

`EXISTING_DELIVERY_DESIGN_GAP`不显示执行卡，只显示：

```text
设计缺口已合并，正在恢复原交付owner。
```

只有原owner身份、scope、capability或资源确实失效时才显示一张recovery卡。

### 14.4 Scope/capability扩大

```text
发现超出当前确认范围的需求：HUMAN_READABLE_DELTA。
1. 批量确认本卡列明的新增范围或能力（建议）
2. 保持当前范围并调整方案
3. 查看详细边界
```

已确认范围内的普通文件、Git、测试、本地服务、task-owned数据库、localhost和approved network不向Human逐项请求许可。

#### 14.4.1 Host-local破坏性操作

该确认是6.2既有destructive-operation边界的具体表达，不新增常规状态。执行前必须绑定精确资源标识、依赖关系、保护清单、预计释放量、不可逆风险、允许命令和post-check；禁止用无边界的泛化prune代替精确动作。

```text
本地资源盘点已完成，精确操作清单已验证。
1. 执行本卡列明的本地资源操作
2. 保留资源
3. 查看清单与风险
```

清单中的目标、依赖和保护范围均确定且风险可接受时标记选项1为建议；存在unknown、共享依赖、活跃使用或不可接受的不可逆风险时标记选项2为建议。每张卡必须且只能标记一个当前可执行建议。

### 14.5 Merge

```text
PR与required CI已准备完成。
1. Merge Commit合入main（建议）
2. 暂不合并
3. 查看验证结果
```

每张merge卡只绑定一个exact PR/head。main变化时机器自动刷新并只在语义或scope失效时换卡。

### 14.6 Cleanup

Standalone owner：

```text
main验证已通过。
1. 清理本卡列明的owner资源（建议）
2. 保留资源
3. 查看清单
```

Stage：

```text
阶段验收已通过，终态资源已汇总。
1. 清理本卡列明的全部FL与Stage资源（建议）
2. 保留资源
3. 查看清单
```

### 14.7 Recovery

same-owner自动恢复失败且replacement确实必要时：

```text
原任务无法继续，但已有成果已保留。
1. 将本卡列明的成果转交给新的可见任务（建议）
2. 暂停并保留
3. 放弃
4. 查看证据
```

旧owner终止并验证前不得创建replacement。任务不可见但same-id可修复时自动原地修复，不显示replacement卡。

### 14.8 编号与失效

只有一张latest有效待确认卡时，单独`1`、`2`等按该卡执行。新的Human条件、scope变化、执行、取消或绑定失效使旧卡失效并展示刷新卡。相同动作重试复用已有结果。

<!-- END OES_COLLAB_COMMANDS_V7 -->

## 15. 完成标准

框架实现只有同时满足以下结果才算完成：

1. 小文档使用Direct且不创建协同角色；
2. 单feature由一个可见FL闭合；
3. 多feature由一个可见SL和多个可见FL并行；
4. Feature RI和Stage RI在正常任务列表可观察；
5. design gap合并后恢复原owner；
6. moving-main只重验受影响范围；
7. host/App重启后恢复same owner和已有成果；
8. 已确认范围内普通permission prompt为零；
9. Human可在30秒内理解状态；
10. 不存在隐藏owner、重复owner、全局调度中心或重复完整测试。
11. host-local owner可在无GitHub连接时创建为可见local task，且不会创建worktree或触发Git fetch。
