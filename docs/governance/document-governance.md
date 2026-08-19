# OES 文档治理

## 1. 目标

OES 文档只保存当前有效的设计、契约、操作方法和活跃工作面。Git 保存历史；项目文档不保存线程记录、迁移过程、完成账本或庞大的阶段流水。

核心原则：

- 一个事实，一个规范真相源；
- stable truth 与 active work 分离；
- Index 只导航；
- 当前状态原位更新；
- 已被完整吸收的过程文件及时删除；
- 删除前验证仍有效的唯一内容已进入正确真相源。

## 2. 目标结构

```text
docs/
├── index.md
├── architecture/
│   ├── index.md
│   ├── system/
│   ├── services/
│   ├── platforms/
│   ├── collaborations/
│   ├── frontends/
│   └── terminals/
├── contracts/
├── adr/
├── governance/
├── runbooks/
└── plans/
    ├── index.md
    ├── intake.md
    ├── backlog.md
    ├── designs/
    ├── stages/
    └── features/
```

不建立 `archive/`、history、migration ledger 或 task ledger。目录结构本身表达 stable/active 分类。

## 3. 稳定真相源

### 3.1 Architecture

- `architecture/system/`：系统愿景、上下文、bounded contexts 与整体技术结构。
- `architecture/services/<service-name>.md`：单服务职责、核心对象、拥有/不拥有的真相和主要协同引用；每个服务仅一份。
- `architecture/platforms/`：身份、权限、信任、租户、事件、审计、AI 等跨域平台设计。
- `architecture/collaborations/`：可复用的跨服务业务旅程与协同边界。
- `architecture/frontends/`：稳定前端边界。
- `architecture/terminals/`：PDA、kiosk 等终端边界。

其他文件只能引用服务真相，不重复定义服务对象、边界或命名。

### 3.2 Contracts

`docs/contracts/` 是规范性的黑盒业务语义，包括行为、输入输出含义、错误、权限、租户和兼容性边界。

Proto、OpenAPI、schema 与生成类型是可执行契约表达。文档语义与机器契约发生差异时，视为契约缺陷并同步修正；实现代码不是另一个独立设计真相。

索引只列当前受支持契约版本。服务目录 README 只做局部导航，不重复契约正文。

### 3.3 ADR

ADR 解释“为什么选择当前高影响方案”，而 architecture 解释“当前方案是什么”。

适用范围：

- bounded context 或新服务；
- 跨服务通信模式；
- 身份、权限、安全与租户模型；
- 高成本、反直觉或未来难以撤销的选择。

普通 feature、UI、内部重构、测试步骤和实现清单不建立 ADR。完全被取代且已无当前解释价值的 ADR 在更新引用后删除；Git 保留历史。

### 3.4 Governance 与 Runbook

- Governance 只定义当前协作、执行和文档纪律。
- `AGENTS.md`、`docs/governance/**` 及其他规范真相只由 UD 写入。UD 只有两个 Human-confirmed 入口：Design Owner 提交且携带exact Preview/root-confirmation/scope/transition binding的语义 Proposal，以及精确分类为语义影响 `NONE` 的 `CANONICAL_EDITORIAL_PATCH`；UD 不自行发起 canonical 改写。Design Owner 与 source Direct owner 都不直接成为 canonical writer。
- Runbook 只保存当前可执行的运维、故障处理与恢复步骤。
- 已完成治理项目、优化收尾、线程经验和一次性复盘不作为长期治理文件。

### 3.5 Direct 文档维护

非规范语义的单一文档 Change Set 默认使用 Direct，不创建 Design Owner、SL、FL、IT、RI、Workspace 或 FP。Direct owner 只在精确允许路径内修改，使用短期 owner branch、focused verification、PR、required CI、Human merge gate 和合并后精确清理。

适用范围：

- 拼写、标点、排版和明确断链；
- README、index 或导航的非语义修正；
- 不改变运行行为、操作结果、owner、scope、contract 或约束等级的说明修正。

Architecture、ADR、Contract、`AGENTS.md` 或 Governance 的语义变化始终进入 Design Owner → UD。上述规范文件的纯编辑修正可使用 `CANONICAL_EDITORIAL_PATCH`：不创建 Design Owner/Workspace/FP；source Direct owner 只拥有 classification、精确 scope/protected scope、evidence 和 source notice target，UD 独占短期 design branch/worktree、修改、验证、design PR、merge、main validation 与自己的 Git cleanup。任何 `must/should/may`、owner、scope、权限、租户、事件、API、生命周期、默认值或行为含义变化都使 editorial classification 失效，UD以`EDITORIAL_CLASSIFICATION_INVALID`返回exact source Direct owner，由其重新展示 Collaborative 或继续讨论选项；该入口不隐式转换为Proposal。Editorial main CI通过后，UD只发送`CANONICAL_EDITORIAL_MERGED`给exact source用于coverage和无Git Change Set closure，并单独进入自己的cleanup gate；不存在Design Owner或delivery activation。

v6 truth merge前已经确认或已经创建exact owner/task/Git resource的v5 Direct、UD、IDT/CDT、SL、FL、IT、RI、Proposal、editorial、activation、merge和cleanup继续按frozen v5 binding完成到各自terminal/cleanup边界；设计merge不得重新解释或使active card、owner、parent/callback和资源失效。边界完成后的新意图才进入v6，异常接管遵循执行模型的Human-confirmed Recovery。

Direct 文档验证至少包括 changed-path allowlist、`git diff --check`、相关 Markdown link/UTF-8/绝对路径检查和语义影响声明。发现分类不成立时停止写入，并根据 status 展示 Collaborative 或继续讨论选项。

## 4. Design Workspace

Design Workspace 用于Human确认Proposal Preview后仍需跨多轮维护的当前工作记忆，不是聊天记录、决策历史或第二真相源。Proposal Preview先在会话中只读展示，不因生成Preview而创建或写入Workspace。

一个设计主题最多一个 active Workspace：

```text
docs/plans/designs/<design-key>.md
```

最小内容：

1. objective；
2. scope；
3. current truth baseline references；
4. current proposed design；
5. Human-confirmed items pending UD review；
6. open questions；
7. known conflicts；
8. intended truth-source changes；
9. next discussion point。

每轮直接更新当前内容，不追加轮次、时间线或 task 消息。

需要跨task精确恢复时，可在Git common directory的`codex-runtime/design-targets/<design-key>.json`保存一个active locator，只含repository root、design key、exact owner task、Workspace、branch/worktree和state version。locator不跟踪、不保留历史、不轮询；atomic写入，使用前精确验证，cleanup时compare-and-delete。

生命周期：

- 简单且一次成型的设计直接形成 Proposal/FP，可以省略 Workspace。
- 部分冻结时，UD 将冻结部分写入 canonical truth；Workspace 删除对应正文，只保留真相引用并继续开放部分。
- 全部冻结且已回写后，Workspace 进入 `READY_FOR_CLEANUP`；Human 确认后删除。

`SUPERSEDED_BY_TRUTH_SOURCE` 标签只表示作者声明，不构成单独删除证据。删除前必须重新完成语义覆盖检查：

1. 列出 Workspace 中仍有效的设计结论、开放问题、实施 gate 和回写目标；
2. 对每项找到当前 canonical truth、active FP 或 backlog 的精确承接位置；
3. 检查承接内容没有被后续设计反向修改；
4. 未找到承接位置的内容先迁移到正确文件；
5. 检查引用后再删除 Workspace。

因此，文件名、日期或 superseded 状态本身都不足以触发批量删除。

## 5. Proposal Patch

Proposal Preview是Design Owner基于当前真相在会话中给Human审阅的完整只读方案，不是repository artifact。它至少展示问题、规范结论、状态/typed routes、逐文件变化、保护范围、验证、停止点和preview fingerprint；生成Preview不创建task、branch/worktree、Workspace或commit。

Human确认exact Preview后，Design Owner才基于Preview与当前真相形成真实Git diff/commit形式的Proposal Patch；它不是另一份长期proposal文档。Preview确认同时授权形成Proposal commit、提交UD并由UD推进到`DESIGN_PR_READY`，实际diff或binding偏离Preview时授权失效，不在commit完成后重复请求Proposal提交确认。Revision使用new card、new transition和append-only commit，不amend已审核Proposal。

它至少能确定：

- source Design Owner；
- base commit；
- proposal commit；
- exact `previewFingerprint`；
- exact `rootConfirmationFingerprint`；
- exact `scopeFingerprint`；
- `transitionId`、`expectedState`与`stateVersion`；
- intended canonical files；
- canonical truth domain（architecture、ADR、contract 或 governance）；
- `deliveryHint = UNKNOWN | LIKELY_NONE | LIKELY_DIRECT | LIKELY_FEATURE | LIKELY_STAGE`；
- 可选的 exact decision owner，只用于阻塞性非设计决定。

UD 对Human-confirmed Preview形成的语义Proposal执行设计审核；Proposal及Design Owner→UD envelope必须携带相同的Preview/root-confirmation/scope/transition binding，UD在创建integration资源前验证commit parent/base、diff scope、owner与全部fingerprint。任一缺失或不一致即返回`REVISION_REQUIRED`；相同transition与相同binding只复用原结果，同id不同binding拒绝replay。

一次Preview确认授权Design Owner形成并提交exact Proposal，也授权UD在接受时按intended canonical files集成、验证、push和创建设计PR，停止于`DESIGN_PR_READY`。`deliveryHint`只供参考，不预授权或禁止实现。design PR经Human确认merge且exact main CI通过后，UD必须进入`ACTIVATION_DECISION_READY`并显示恰好一个建议：有实现工作时建议`Direct | SINGLE_FEATURE | DELIVERY_STAGE`，当前无实现工作时建议`NO_EXECUTION`对应的暂不执行；Human选择暂不执行后进入`EXECUTION_DEFERRED`，后续实现意图由UD基于exact truth和new stateVersion重新发卡。Human确认启动后才创建delivery owner并完成两阶段handoff。

语义影响为`NONE`的Human-confirmed`CANONICAL_EDITORIAL_PATCH`是另一条非Proposal入口，只授权UD在exact files/hunks内编辑并走相同design PR、merge和main validation。它在main CI后发送`CANONICAL_EDITORIAL_MERGED`给exact source Direct owner并进入UD cleanup gate，不进入Proposal activation。两类入口的merge与cleanup均分别确认；Proposal的长期历史由Git提供。

## 6. Stage Packet

一个 SL 对应一个 compact active Stage Packet，逻辑路径为：

```text
docs/plans/stages/<stage-key>.md
```

Stage Packet 只存在于 SL 的本地 stage coordination branch/worktree，不 push、不创建 PR、不合入 `main`。它只记录当前 objective、scope/protected scope、exact decision owner、FL 引用与依赖、exit criteria、blocker 和 current state；状态原位覆盖，不保存聊天、时间线、task/thread registry、watcher 信息或 IT candidate 细节，也不复制 FP 内容。

Stage Packet 是 active work，不是稳定真相或第二状态表。阶段在最新 `main` 完成验收、各 FL 分别完成 Human 确认的 cleanup 后，Human 在 SL task 确认 Stage Cleanup；SL 随即删除 Stage Packet 和精确本地 stage coordination/verification 资源并 archive SL。Git 不保留可达的 stage coordination 历史。

## 7. Feature Packet

一个 FL 对应一个 compact active FP：

```text
docs/plans/features/<feature-key>.md
```

一个 FP 包含 1..N 个相关 slices，仅记录当前范围、依赖、验收、review 方式、candidate 和状态。只有 FL 写 FP；状态原位覆盖，不写执行流水。

FP 完成并满足以下条件后进入 `COMPLETE_AWAITING_CLEANUP`：

- 所有 required slices accepted；
- 集成和 main 验证通过；
- 必要的 architecture/contract/ADR/runbook 已回写；
- 未完成内容进入 backlog 或新 feature。

Human 确认 cleanup 后删除 FP。

## 8. Intake 与 Backlog

- `plans/intake.md`：尚未进入设计的当前候选；Design Owner开始有状态设计后从intake删除。
- `plans/backlog.md`：仍有效但明确延期的事项；完成、取消或失效后删除。

不记录 `PROMOTED`、`CANCELLED` 或完成历史。

## 9. Index

Index 的唯一职责是告诉读者去哪里读取规范文件。

允许内容：

- 一到两句目录用途；
- 当前规范文件名称与仓库相对链接；
- 可选的一行非语义标签。

禁止内容：

- 实现状态、进度和 owner；
- 服务对象或边界摘要；
- `updatedAt` 与冻结阶段；
- 历史清理结论和迁移说明；
- future/designing 服务；
- 长篇阅读顺序。

导航最多两级：

```text
docs/index.md -> category/index.md -> canonical document
```

active Design Workspace、Stage Packet 和 FP 由各自目录中的当前文件表示，不维护第二份状态表。Stage Packet 仅在 SL 本地分支出现，因此 `main` 上的空目录不代表状态。

## 10. 旧文档清理规则

清理采用逐文件语义归位，不做整批文本搬运：

- 已存在于 canonical truth、active Workspace 或 FP：删除重复文件；
- 仅包含 checklist、命令和文件清单：完成后删除；仍是当前操作则提取到 FP/runbook；
- 包含仍有效的唯一稳定事实：提取最小事实到 architecture/contract/ADR/runbook 后删除；
- 未冻结设计仍有价值：提取当前草稿到 active Workspace 后删除；
- 当前 feature 仍在执行：提取 scope/acceptance/current candidate 到 FP 后删除。

工具生成的临时 specs/plans 不进入稳定文档树。只按上述规则提取仍有效的唯一内容，任务完成后删除临时产物。

旧治理文件收敛到 `codex-execution-model.md` 与本文；旧 plans 根目录的 draft、foundation plan、implementation plan 与 checklist 分别归入 canonical truth、Workspace、FP、runbook 或 backlog。

## 11. 轻量验证

Direct 文档维护只运行与 changed paths 和分类风险匹配的 focused checks；规范语义变化继续运行 Proposal/UD 验证。文档重构至少检查：

- 所有 Markdown 相对链接存在；
- 每个稳定服务真相被索引且只出现一次；
- canonical indexes 不含 `DESIGNING`、`DONE`、`HISTORICAL` 等状态；
- 仓库文档不含本机 home 目录等绝对路径；
- plans index 不枚举实现状态；
- Stage Packet 未进入 remote refs 或 `main`，且不含 registry、历史或 IT candidate 细节；
- superseded/closed 文件删除前完成语义覆盖检查；
- `git diff --check` 通过。
