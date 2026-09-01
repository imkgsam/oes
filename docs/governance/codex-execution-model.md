# OES 精简协同执行模型

## 1. 目标与非目标

本模型用于让 OES 的讨论、设计、并行实现、审核、合并和清理保持高效、可见、可恢复。

核心目标：

1. 普通讨论与小修改保持轻量；
2. 稳定设计只由 exact Global Unified Design（UD）写入 canonical truth；
3. 多 feature 交付可以由一个 Stage Lead（SL）协调多个 Feature Lead（FL）并行推进；
4. Human 能在正常 Codex 项目任务列表中看到所有 owner 与独立 reviewer；
5. 已确认范围内的权限、环境、测试、Git 和恢复动作自动执行；
6. main 继续使用独立PR、required CI、Human merge与精确清理保护，多Feature Stage只需要一张绑定全部exact heads、集合和顺序的merge确认；
7. authoritative candidate CI保持完整但并行，main只重复无法由exact-equivalence证明覆盖的工作；
8. 框架运行成本必须显著低于被交付工作的成本。

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

SL 是一个多 feature Delivery Stage 的 Technical Delivery Lead。`REPOSITORY_DELIVERY` 中，SL建立一个本地 Stage Packet，按独立交付物拆分FL，管理依赖、WIP、moving-main、Stage Review、一次Stage merge确认、逐PR串行admission、全Stage cleanup和状态汇总，只在本地verification worktree组合exact candidates；`HOST_LOCAL_OPERATION` 中，SL只使用task-local current evidence协调同等范围，不创建Stage Packet、branch或worktree。SL不写feature产品代码，不建立remote stage product branch、总PR或stage merge commit。

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

创建Direct、SL、FL、独立IT或RI前，creating owner必须通过支持原子profile注入的启动路径准备最小充分能力。每个profile只接受一个closed `approvalMode` discriminant，renderer和launcher必须从它原子派生以下唯一合法pair，不接受两个独立可写字段：

```text
ON_REQUEST_AUTO_REVIEW -> on-request / auto_review
NEVER_USER            -> never      / user
```

`REPOSITORY_DELIVERY` profile覆盖owner workspace和Git metadata、标准build/test、task-owned service/database、localhost与approved network、credential reference和task evidence root；`HOST_LOCAL_OPERATION` profile只加入本次精确需要的Docker socket/CLI、数据库、模拟器、本地服务、localhost和task evidence能力，repository保持只读。两个mode除派生pair、mode标识和相应完整性摘要外的filesystem、network、credential、resource topology及其他permission bytes必须一致；mode不授予额外authority。installed profile和launch receipt同时绑定mode、完整profile SHA-256，以及预期effective permission/sandbox fingerprint。

Full Access不得作为普通owner profile的回退；实际session出现`disabled`、`danger-full-access`或任何不受installed profile管理的permission/sandbox状态时，不得用手工生成的profile artifact替代实际session证明。

### 6.2 一次目标会话验证

target task在第一次role-owned写入前从自己的实际session读取profile，并完成所选执行形态必要的file、Git、toolchain、local service/network smoke。preflight必须扫描该task本次rollout的全部`turn_context`，证明每个context的approval pair和effective permission/sandbox fingerprint都唯一、稳定、等于installed profile与launch receipt；只读取最后一个context或采用last-write-wins不构成证明。`HOST_LOCAL_OPERATION`不执行无关Git remote/network smoke，并必须证明未创建worktree且执行前后的repository状态完全一致；既有dirty/untracked内容只作为protected scope保留，不要求清除。creator复核一次真实结果即可转移ownership。

只有上述两个完整pair可接受。cross pair、unknown或missing mode、context间漂移、installed/launch/effective不一致，以及实际session为`disabled`或`danger-full-access`都fail closed。两个mode的`normalPermissionPromptCount`都必须为零；`NEVER_USER`还必须证明`approvalEventCount=0`，`ON_REQUEST_AUTO_REVIEW`的低风险平台审核只可由`auto_review`处理。

只要task、host、repository、worktree、toolchain、credential identity、profile bytes和permission policy未变，后续turn复用该profile，不重复生成证明。mode、profile bytes或effective permission/sandbox fingerprint变化时，保持原owner、candidate和resource binding，通过同一task的monotonic successor profile transition重新安装、启动并补做受影响smoke；旧authorization、binding和smoke不得授权successor transition。其他真实漂移同样保持原owner/candidate并自动修复同一个任务。

新报告使用`OES_EFFECTIVE_PROFILE_REPORT` v2并显式携带mode、完整pair、installed/launch/effective fingerprint和全context观测。v1 reader仅冻结兼容既有`on-request/auto_review`报告；v1不得表达或授权`NEVER_USER`，v2 writer不得降级生成v1。

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

### 7.2 Proposal transport、FIFO与receipt

Human确认Preview后，source owner立即把immutable Proposal发送到exact UD；sender不等待UD空闲，transport acceptance后不poll。transport acceptance只证明消息进入exact UD task，不等于admission；平台不能证明pending position时只回执`已投递，等待 UD 确认入队`，禁止推测或编造位置。

每个Proposal必须绑定immutable `proposalId`、`proposalFingerprint`、source task与exact return task。exact UD只以自身task的原生消息历史和收发receipt作为队列事实，按transport arrival严格FIFO、一次admit一个Proposal、不抢占active Proposal；不得把这些receipt复制成global scheduler、task registry、heartbeat、watchdog、pull inbox、queue database或历史账本。

- 相同`proposalId + proposalFingerprint`是idempotent duplicate，只重放已有receipt或terminal result；
- 内容变化必须使用新Proposal ID和fingerprint、重新获得Human确认，并在FIFO尾部supersede旧的尚未开始revision；
- cancellation可终止尚未admit的Proposal；active Proposal只在下一个无remote mutation悬空的safe boundary停止并保留当前证据；
- source task接收自己Proposal的`TRANSPORT_ACCEPTED | UD_ADMITTED | PROCESSING | SUPERSEDED | TERMINAL` receipt；terminal completion只有在typed result送达exact return task后成立；
- terminal return按`proposalId + terminalStatus`至少一次投递且幂等，ack丢失只重放同一result，不产生重复业务动作。

Human可从任一可见OES project task请求`查看 UD 队列`。该只读视图按exact UD task history/receipt即时派生，只显示Proposal ID、简短scope、source role、可证明的顺序和`已投递 | 已入队 | 处理中 | 已取代 | 已取消 | 已终结`；exact UD可见完整队列，其他role task只接收on-demand summary，bounded IT/helper默认不接收完整队列。

### 7.3 UD critical section与恢复

exact UD从admission、审核、integration candidate、Design PR与PR CI，经过Human merge等待、merge、main CI、canonical verification，直到exact return保持一个single-flight critical section。active Proposal等待Human或CI时仍占有该section，UD不admit下一项，也不把多个Proposal异步挂起给callback owner；同一active Proposal内部可用bounded polling和backoff等待CI。

每次external mutation都使用read-before-write、immutable exact binding、read-after-write和既有最小monotonic checkpoint。App/host重启或响应丢失后恢复same Proposal，对照checkpoint与GitHub live truth，只执行缺失动作；checkpoint陈旧时以GitHub live truth为准，但任何不匹配的owner、candidate、PR或scope仍fail closed。

### 7.4 UD审核与Design PR

UD验证Human confirmation、source owner、latest canonical base、exact changed paths和Proposal内容。语义不完整时返回同一Design Owner修订；接受后由exact UD创建integration candidate、Draft Design PR并等待required CI。

Design Owner、请求来源、父task或host helper不得先写远端再让UD复核。host transport只能机械执行UD在mutation前签发的一次性精确动作，结果必须返回UD read-after-write。

### 7.5 Post-merge routing

- `NEW_DESIGN`：main CI通过后UD主动建议`Direct | 单Feature | Delivery Stage | 暂不执行`；
- `EXISTING_DELIVERY_DESIGN_GAP`：自动返回exact原SL/FL，更新latest main后恢复affected lane，不发activation card；
- active activation revision：恢复exact原pending owner，不创建replacement；
- canonical editorial：通知exact source Direct owner，不触发delivery。

UD不把implementation发给Design Owner的祖先、最初请求task或其他generic callback。

exact return完成后，完成remote merge的owner才可按10.4只读检查designated project-root `main`是否可同步；该检查和可选同步不延迟原owner恢复，也不改变任何FL worktree。

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

`REPOSITORY_DELIVERY` Stage中，SL建立本地Stage Packet，按WIP启动sibling FL。每个FL独立拥有candidate、Feature RI和Draft PR。SL只组合exact candidates和latest-main results，不创建总产品分支或大PR。全部FL、Feature RI与Stage RI都完成后，Stage才进入merge-ready并形成一张绑定全部exact PR heads、集合、顺序、scope和risk的Stage merge卡。

纯`HOST_LOCAL_OPERATION` Stage中，SL只在task-local current evidence协调sibling FL、依赖、WIP和exit criteria；每个FL独立拥有精确host资源范围、操作候选和验收结果，不创建Stage/Feature Git资源或产品PR。

FL发现范围实际包含多个独立交付物时返回SL；只要新拓扑仍在confirmed Stage scope、protected scope、capabilities和WIP ceiling内，SL自动调整并只发状态通知。真实扩围或不可消解的owner/write conflict才询问Human。

parent派发child后保存当前checkpoint并结束turn；exact child result到达后恢复。SL或FL等待CI时同样结束当前turn，由CI worker或bounded helper以退避方式等待并返回typed result；helper不成为owner、不建立heartbeat、watchdog、task registry或第二状态库。禁止role task持续polling或占用执行槽等待。

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
3. Authoritative Full Gate：在merge前对latest main上的exact prospective result运行完整validation surface；无native Merge Queue时由已整合latest main的exact PR head承载，有queue时由exact `merge_group`承载。Stage exit确认每个item均有对应authoritative evidence；`push main`只运行9.4定义的exact-equivalence/integrity与快速smoke，只有equivalence证明缺失或不等价时才fail-closed升级Full Gate。

证据只在candidate、依赖、输入、环境或命令版本改变时失效。RI只补验缺失或受影响风险，不重复owner已证明且输入未变的完整矩阵。

### 9.3 最小证据

每个owner最多维护一个current Packet/status、一个current candidate verification、一个final PR/main verification，以及恢复必需的最小manifest/bundle。Git、task history或最终记录能够重建的中间事实不另建长期receipt、ledger或重复manifest。

### 9.4 CI拓扑

required aggregate context保持唯一`Baseline Checks`，且任何事件分层、分片、cache或artifact复用都不得缩减现有validation surface。每个required命令必须被一个非空、可追溯的authoritative shard覆盖；缺失、重复归属、取消、未知选择器、artifact digest不匹配、cleanup residue或aggregate输入不完整都fail closed。

CI按远端能力使用两种事件拓扑：

1. 当前仓库没有active native Merge Queue规则时，`pull_request`是完整authoritative candidate gate；`push main`只执行exact-equivalence/integrity验证和快速smoke。只有main merge commit、两个parent、accepted PR head、validated prospective result tree、workflow/command manifest、lockfile、toolchain与artifact digest全部exact-equivalent时才允许跳过重复full gate；任一证明缺失或不等价时在同一main run fail-closed升级为完整gate。
2. 未来仓库ruleset明确启用且runtime readback验证native Merge Queue后，`pull_request`只运行focused/affected feedback，`merge_group`对GitHub生成的exact prospective merge result运行authoritative full gate；`push main`继续执行exact-equivalence/integrity与快速smoke。不能证明queue capability或`merge_group` identity时回到第一种拓扑，不以仅PR focused checks放行。

authoritative full gate使用受版本控制的deterministic inventory和风险权重并行执行：

- 一个prepare边界只进行一次frozen lockfile安装、Proto/Prisma generation与build，输出content-addressed、digest-verified、只读build artifact；toolchain、lockfile、generator、build command、workflow或source输入任一变化产生新key，禁止使用宽松restore key把不同输入视为命中；
- static、Proto compatibility、design-gap、unit、contract与runtime-risk tests按完整inventory分片；L2按历史耗时平衡分片，每个shard使用独立task-owned Postgres/NATS、端口、volume、network与证据目录，并以`always()`验证和清理；
- cache miss只影响耗时；cache或artifact不可验证时重建或进入legacy full gate，不能转为成功。测试assertion、contract、build或type failure直接失败，不因fallback或retry被遮蔽；
- `Baseline Checks`只聚合本次authoritative topology声明的全部shards、integrity与cleanup结果，任一required输入缺失、取消或失败即失败；旧完整gate保留为workflow cutover fallback，直到新拓扑、inventory和aggregate在同一candidate上证明等价。

`pull_request`使用按PR identity分组的`cancel-in-progress`，新head产生后旧run必须在一分钟内取消；`main`和已admit的`merge_group`不得被无关run取消。CI infrastructure failure只允许same SHA重跑failed job一次；测试结果反转计入flaky rerun而不视为基础设施恢复，重复flaky必须作为阻塞缺陷治理，不允许skip、quarantine或降低assertion代替修复。

以GitHub workflow/check facts和每个run的普通artifact计算性能，不建立repository CI账本或第二状态库。dated baseline与observed result只保存在当前Proposal或implementation verification evidence，不进入canonical Governance。每个观测同时绑定两个相互独立的identity：`workloadFingerprint`只包含changed-path/risk class、Stage PR count/order、适用的accepted source/result identity、command/test inventory、lockfile、toolchain与cache disposition；`executionFingerprint`只包含workflow revision、event topology、`LEGACY_CONTROL`、`OPTIMIZED_SHADOW`或`OPTIMIZED_ACTIVE` mode，以及shard/cache/artifact strategy。workflow、topology或execution mode不进入`workloadFingerprint`；PR与main只通过accepted head和merge parents关联，不能按时间邻近推测配对。

性能cutover前，legacy full gate保持唯一authoritative `Baseline Checks`和唯一merge/main verification授权来源；follow-on implementation candidate只在同一个bound source/result input上运行non-required、无Git/PR/merge mutation的optimized shadow，shadow成功或失败都不能授权merge、替代required context或改变accepted result。一个matched pair或Stage sequence必须具有相同`workloadFingerprint`，并同时具有明确不同且绑定的`LEGACY_CONTROL`与`OPTIMIZED_SHADOW` execution fingerprints；任一侧缺失即为unpaired且不计入达标样本。cutover sample从第一个完整paired shadow observation开始连续收集，到满足全部最小量或30个calendar days为止，不得排除失败、取消、retry或较慢run。最小量为20个accepted PR/main exact pairs、其中至少5个cold-cache authoritative candidates，10个自然或受控的superseded PR run pairs、5个每组至少3个PR的matched Stage sequences，以及50个authoritative test attempts；P95使用nearest-rank，job-minutes包含样本内全部attempt，flaky rerun指source、dependency、environment、command与SHA均未变化时test result反转。matched baseline与optimized observation使用相同`workloadFingerprint`、各自绑定的execution fingerprint和相同统计规则保存在task-local evidence。

三项wall-clock边界固定且必须覆盖完整aggregate，不得选择较快sub-job：candidate full gate从bound prospective input的workflow run `created_at`开始，到该run全部required-equivalent prepare、shard、integrity与cleanup聚合完成时结束；main smoke从exact Merge Commit的`push main` run（shadow使用同一输入的无mutation synthetic event）`created_at`开始，到equivalence/integrity、smoke以及触发时的full fallback聚合完成时结束；多PR Stage从全部bound heads、Feature RI、Stage RI就绪且Human merge确认被记录、ordered Stage可以执行时开始，到最后一个ordered PR的post-merge main验证完成时结束，并包含serial admission、latest-main refresh、CI queue/runtime、merge response与post-merge validation。shadow Stage使用同一开始时间和同序exact prospective commits执行无mutation replay，以最后一个synthetic result的完整main aggregate结束，不读写PR或main。follow-on implementation只有在上述sample同时证明optimized candidate full-gate P95不超过5分钟、optimized main smoke P95不超过2分钟、重复完整main gate为0、superseded PR CI一分钟内取消、PR加main总job-minutes较matched legacy control至少降低35%、matched optimized Stage duration较legacy control至少降低50%，且flaky rerun率低于2%时才完成性能cutover。30天内样本不足或任一目标未满足时继续legacy full gate并报告当前样本，不以推算值、选择性窗口、局部job或未配对run宣告cutover。

### 9.5 Collaboration runtime最小不变量

collaboration-runtime变更的fast automatic set至少覆盖：FIFO与exact return binding、duplicate与superseded idempotency、remote truth恢复决策、latest-main revalidation、本地main同步确认guard。真实PR/CI/merge interruption等昂贵场景只在collaboration-framework变更和对应Feature RI执行，不加入每个无关产品change；Human real-use继续作为usability acceptance。

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

远端mutation使用repository-owned、versioned、tested、idempotent driver。publish、pre-merge、merge和verify-main是可恢复的机器内部阶段，不形成额外Human gate。每次mutation前后读取exact remote truth并写最小monotonic checkpoint；响应丢失或恢复时先对照GitHub live truth，远端已满足postcondition则复用成功，否则只补执行缺失动作。Human只看到`等待合并`、一张merge卡和最终`已完成/阻塞`。

### 10.3 PR和merge

每个FL在完整candidate和Feature RI通过后才push并创建Draft PR。standalone Direct/FL在candidate已整合latest main后进入merge-ready；有parent SL时，必须等待全部Stage FL、全部Feature RI和Stage RI完成，任何单项提前完成都不产生单PR merge卡。

standalone Human确认一个exact PR/head；Stage Human只确认一张有序Stage merge卡。Stage卡绑定stage、全部feature/owner、exact PR number/head、集合、顺序、candidate content、scope、risk、required checks与stop point；一项缺失即fail closed。一次Stage确认授权driver按卡内顺序逐个执行独立Merge Commit、逐项main验证并在每项成功后继续，不授权新增PR、换序、扩scope或修改candidate内容。每个FL仍保留自己的PR、merge SHA、CI/审计证据、main验证、失败与回退边界，SL不生成总产品branch、总PR或总merge commit。

每个实际mutation边界都重新读取base/head/checks/reviews和latest remote `main`。当前没有native Merge Queue时使用有界`serial-latest-main` admission；未来只有ruleset和API readback都证明native Merge Queue可用时才逐项使用queue。无论哪种模式，都必须在latest main上的exact prospective result通过本拓扑authoritative `Baseline Checks`后才能Merge Commit。Stage一次最多admit一个item，因此失败时没有尚未验证的同Stage后续item留在queue。串行lock只保护当前mutation/recovery临界区，完成或安全失败即释放，不形成持久调度中心、全局任务状态或后台queue owner。

main漂移但PR patch/content、Stage集合与顺序、confirmed scope和risk均未变化时，drift/affected matrix只用于证明原Stage confirmation仍可沿用，不能代替authoritative gate。当前无native Merge Queue时，owner在bounded serial admission内以append-only merge commit把latest main整合进candidate，证明相对各自base的patch/content fingerprint不变，fast-forward更新同一PR head，并等待完整`pull_request` `Baseline Checks`在该exact refreshed head成功；mutation前main再次变化则从新的latest main重新执行本过程。新的exact head/base通过technical equivalence revision绑定原Stage confirmation。native Merge Queue启用时由exact `merge_group` Full Gate完成同一prospective证明。PR业务内容、Stage集合、顺序、scope或risk任一变化时整张旧Stage卡失效，所有尚未合并items准备完成后只刷新一张Stage卡；已合并健康前缀保持原审计与授权，不重新确认或回滚。

每个merge后验证：`origin/main`等于该项merge SHA、merge具有exact两个parents、accepted candidate为merge祖先、authoritative candidate equivalence与required main workflow成功、protected resources保持不变。验证成功才进入下一项。任一Stage item的admission、CI、merge或main验证失败，立即停止尚未合并的同Stage后续项并返回exact owner；已合并健康前缀保留，其他Design、standalone FL和其他SL继续。修复后只重验失败项及其受影响后缀，不重复健康前缀、完整Feature RI或无关CI。

### 10.4 Local main convergence

remote `main`始终是canonical truth；任何merge、main CI或exact return都不得隐式修改共享project checkout。exact return后，完成remote merge的owner只读检查designated project-root：当前branch是`main`、worktree clean、不处于merge/rebase/cherry-pick/bisect等Git operation、local `main`不领先也不diverge，并且对fresh `origin/main`存在exact `ff-only`路径。条件不满足时保留现场、不显示同步卡。

条件满足时才显示14.6的独立Human选择。Human确认后在mutation boundary重新读取全部preconditions，只允许`git fetch origin main`加`git merge --ff-only origin/main`或语义等价的exact update，再read-after-write验证HEAD、`refs/heads/main`、clean state和remote equality。禁止reset、stash、rebase、force checkout、process termination、background retry或automatic sync；Human选择defer后不保留后台任务，未来显式同步意图重新检查。任何既有或新FL worktree保持原branch/HEAD不变；新repository FL仍从latest `origin/main`启动。

## 11. Cleanup

### 11.1 Repository-delivery standalone Direct/FL

main验证后显示一次cleanup卡。owner只删除卡中exact、clean、merged、SHA-matched的Packet、worktree、local/remote temporary branch、IT/RI和临时验证资源。dirty、未知或不匹配资源保持原状。

### 11.2 Repository-delivery Stage

Human表达cleanup意图时，SL先自动执行一次无mutation的全Stage inventory，不为盘点本身请求确认。inventory从native task parent/child truth、Stage Packet与owner current evidence即时派生created roster，绑定全部FL、IT、Feature RI、Stage-related Design Owner、Stage RI、SL及其exact resource；不创建task registry、历史cleanup ledger或第二状态库。系统把created roster与terminal roster、owner、activity、cleanliness、SHA、共享关系和protected scope逐项核对后，只显示一张exact Stage cleanup卡。

Stage cleanup卡只有在全部owner达到terminal且Stage exit通过时才允许建议执行；仍active、owner不明或roster不完整时保留全部相关资源并显示阻塞项。Human确认一次后：

1. 每个owner只清理卡内属于自己的exact、terminal、clean、unshared、SHA-matched资源并返回typed result，不再分别询问Human；unknown、shared、active、dirty、mismatch或卡外资源保留并报告；
2. 每个resource action保存独立幂等结果；partial success保留，重试只执行失败项，已删除、已缺失或明确保留项不重复；
3. SL只在全部Feature Packet均已绑定terminal owner结果后，通过一个cleanup-only PR删除卡内exact Feature Packets，再删除本地Stage Packet和自己的协调/验证资源；
4. created roster与terminal roster及每个owner cleanup terminal result重新核对后，系统依次archive：IT与Feature RI → FL → Stage-related Design Owner → Stage RI → SL；前序不满足时停止后序archive，只重试失败项；
5. exact global UD是长期canonical owner，不进入Stage archive roster。task archive失败不撤销已验证的资源清理，也不重新执行成功项。

Design Owner与UD分别清理自己的资源，互不代替。

### 11.3 Host-local operation

host操作本身属于已确认work scope，不伪装成Git cleanup。post-check通过后，standalone owner显示一次既有cleanup卡，只列task-local临时证据、scratch和task归档；有parent SL时由Stage批量cleanup卡统一授权。实际host资源、既有repository状态、未知/共享/仍在使用的资源和卡外对象保持原状。

## 12. 失败恢复

统一使用以下规则：

1. 权限、网络、App/host重启、CI等待中断和scratch丢失优先恢复same owner；
2. network timeout、rate limit或GitHub transient failure最多执行三次idempotent retry，使用exponential backoff与jitter；
3. CI infrastructure failure只允许在same SHA重跑failed job一次；build、type、contract或assertion failure不blind rerun，由same owner修复后运行affected/full required gate；
4. permission或credential failure立即返回一个可执行blocker，不循环尝试；
5. lost PR/merge response先读取remote truth，已成功则复用，否则只retry缺失动作；
6. 一个FL失败只暂停该lane；Stage merge期间任一item失败只停止同Stage未合并后缀，健康已合并前缀与其他Stage/FL/Design继续；
7. duplicate message或driver retry读取已有结果，不重复mutation；
8. ordinary conflict只由artifact owner解决；
9. exact owner不可恢复时才显示一次Human recovery card；
10. unknown、dirty、SHA不匹配或owner仍活动的资源保持原状；
11. replacement必须在旧owner终止并验证后创建，禁止双owner；
12. cleanup partial failure只重试失败项；unknown、shared、active、dirty、SHA mismatch与卡外资源保持原状并形成可见preserved result，不以强制删除换取完成；
13. task archive按cleanup依赖序执行，失败只停止依赖它的后序archive，不恢复已完成清理或重复archive。

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

### 13.3 Continuous Optimization cutover

本轮Stage merge、事件分层CI、CI wait handoff与全Stage cleanup/archive的新行为，只约束follow-on collaboration-framework implementation candidate完成Merge Commit、main CI、canonical verification并证明legacy fallback之后获得Human确认的新Stage merge/cleanup卡和新CI run；该implementation merge是本轮exact cutover point。

cutover前已active或已确认的Proposal、owner、PR、Stage/standalone merge卡、cleanup卡、checkpoint与frozen binding继续按原规则到terminal/cleanup，不迁移、不扩展既有确认、不backfill新roster或重写历史。existing-delivery design gap在canonical merge后自动返回exact原owner，只恢复affected lane。required context名称`Baseline Checks`在CI内部拓扑切换前后保持不变；新workflow、inventory、aggregate、equivalence或fallback任一缺失/失败时继续运行legacy full gate并fail closed，禁止以部分新job或main smoke替代完整验证。

approval-mode profile implementation完成Merge Commit、main CI和canonical verification后，只对新建owner或需要profile repair的existing owner签发v2；已经验证且未漂移的v1 `on-request/auto_review` owner保持原binding到terminal/cleanup。existing delivery切换mode时保留exact owner、candidate、receipt和remote truth，通过same-task successor profile transition恢复affected lane，不创建replacement或重做不受影响验证。cutover期间reader同时接受冻结v1和完整v2；operational rollback停止签发新的`NEVER_USER`并恢复新profile默认值为`ON_REQUEST_AUTO_REVIEW`，但保持v2 reader直到所有v2 owner terminal，禁止把既有v2 evidence改写为v1。

## 14. Human命令契约

本节是Human意图、确认、merge、local-main sync与cleanup的唯一自然语言契约，版本为`OES-COLLAB-COMMANDS/v9`。

<!-- BEGIN OES_COLLAB_COMMANDS_V9 -->

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

#### 14.2.1 UD队列查看

Human说`查看 UD 队列`时直接返回只读派生视图，不显示确认卡、不创建资源。只列可证明的Proposal ID、简短scope、source role、顺序和state；不能证明pending position时显示`已投递，等待 UD 确认入队`，不编造编号。

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

Standalone Direct/FL：

```text
PR与required CI已准备完成。
1. Merge Commit合入main（建议）
2. 暂不合并
3. 查看验证结果
```

Stage：

```text
阶段内全部PR、Feature RI与Stage RI已准备完成，合并集合与顺序已冻结。
1. 按本卡顺序逐个Merge Commit合入main（建议）
2. 暂不合并
3. 查看PR heads、顺序与验证结果
```

standalone merge卡只绑定一个exact PR/head。Stage卡绑定全部exact PR heads、集合、顺序、scope和risk；一次确认只授权卡内有序集合，每项仍独立merge、验证、审计和回退。main变化但PR content、集合、顺序、scope和risk不变时机器自动重验并形成exact equivalence revision，不换Human卡；上述任一语义输入变化时整张Stage卡失效，尚未合并集合准备完成后只刷新一张卡。任一item失败停止同Stage未合并后缀，已合并健康前缀保留。

### 14.6 Local main sync

只有10.4全部eligibility checks通过时显示：

```text
远端main已验证，本地项目main可以安全快进。
1. 立即以ff-only同步本地main（建议）
2. 暂不同步
3. 查看检查结果
```

选项1只授权当前卡绑定的designated project-root和exact remote main；执行前重新验证，任何dirty、diverged、branch或Git-operation变化都保留现场并停止。选项2结束本次同步意图，不创建background retry。

### 14.7 Cleanup

Standalone owner：

```text
main验证已通过。
1. 清理本卡列明的owner资源（建议）
2. 保留资源
3. 查看清单
```

Stage：

```text
阶段验收已通过，全部owner、task与终态资源已只读盘点并核对。
1. 清理本卡列明的全部owner资源并按依赖顺序归档任务（建议）
2. 保留资源
3. 查看owner、资源、保留项与归档顺序
```

Human表达cleanup意图即自动触发只读全Stage inventory；inventory不删除、不archive、不另行请求确认。一次选项1授权卡内全部owner执行各自exact cleanup与terminal task archive；partial success保留，重试只处理失败项。unknown、shared、active、dirty、mismatch和卡外资源始终保留并报告；长期UD不归档。

### 14.8 Recovery

same-owner自动恢复失败且replacement确实必要时：

```text
原任务无法继续，但已有成果已保留。
1. 将本卡列明的成果转交给新的可见任务（建议）
2. 暂停并保留
3. 放弃
4. 查看证据
```

旧owner终止并验证前不得创建replacement。任务不可见但same-id可修复时自动原地修复，不显示replacement卡。

### 14.9 编号与失效

只有一张latest有效待确认卡时，单独`1`、`2`等按该卡执行。新的Human条件、scope变化、执行、取消或绑定失效使旧卡失效并展示刷新卡；Stage main纯漂移只产生10.3定义的technical equivalence revision，不形成新Human gate。相同动作重试复用已有结果。

<!-- END OES_COLLAB_COMMANDS_V9 -->

## 15. 完成标准

框架实现只有同时满足以下结果才算完成：

1. 小文档使用Direct且不创建协同角色；
2. 单feature由一个可见FL闭合；
3. 多feature由一个可见SL和多个可见FL并行；
4. Feature RI和Stage RI在正常任务列表可观察；
5. design gap合并后恢复原owner；
6. moving-main只重验受影响范围；
7. host/App重启后恢复same owner和已有成果；
8. execution profile只存在两个closed approval mode，实际session匹配managed/restricted fingerprint，所有mode的普通permission prompt为零且`NEVER_USER`无approval event，任何Full Access或pair/context漂移都fail closed；
9. Human可在30秒内理解状态；
10. 多FL Stage只在全部FL/Feature RI/Stage RI完成后以一张有序卡逐PR合并，失败保留健康前缀并停止后缀；
11. authoritative candidate保持完整validation surface，main不重复已由exact-equivalence证明的full gate；
12. Stage cleanup一次确认覆盖全部owner且只重试失败项，terminal tasks按依赖序archive，长期UD不归档；
13. 不存在隐藏owner、重复owner、全局调度中心或重复完整测试；
14. host-local owner可在无GitHub连接时创建为可见local task，且不会创建worktree或触发Git fetch。
