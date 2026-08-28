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

- Governance只定义当前协作、执行和文档纪律。
- `AGENTS.md`、`docs/governance/**`及其他规范真相只由exact global UD写入。
- UD只有两个Human-confirmed入口：Design Owner提交的semantic Proposal，以及语义影响精确为`NONE`的`CANONICAL_EDITORIAL_PATCH`。
- Design Owner、source Direct、SL、FL、RI、请求来源、父task和host helper都不成为canonical writer。
- Runbook只保存当前可执行的运维、故障处理与恢复步骤。
- 已完成治理项目、一次性复盘、task状态和技术binding不进入长期治理文档。

role task的标题、身份、Human可见性与parent binding遵循执行模型。Planner、Design、Direct、SL、FL、Feature RI和Stage RI必须在正常Codex项目任务列表中可发现、可打开、可继续；文档不得建立task registry、title migration ledger、隐藏owner清单或按标题推断owner的流程。

Planner的月、周、日项目组合建议是带生成时间和有效期的noncanonical task消息，不写入`docs/plans/`，不形成roadmap镜像、日报/周报/月报、task registry或第二状态源。需要冻结的稳定设计进入Design Owner → exact UD；Human选中的实现方向继续使用Direct、FL或SL的Packet和既有确认边界。

### 3.5 Direct文档维护

非规范语义的单一文档Change Set默认使用Direct，不创建Design、SL、FL、IT或RI。适用范围包括拼写、标点、排版、明确断链、导航和不改变行为/约束等级的说明修正。

Architecture、ADR、Contract、`AGENTS.md`或Governance的语义变化始终进入Design Owner → exact UD。上述文件的纯编辑修正可以使用`CANONICAL_EDITORIAL_PATCH`，但任何`must/should/may`、owner、scope、权限、租户、事件、API、生命周期、默认值或行为含义变化都会使editorial分类失效。

Direct文档验证只运行changed-path allowlist、`git diff --check`、相关Markdown link/UTF-8/绝对路径检查和语义影响声明。

## 4. Design Workspace

Design Workspace只用于Human确认Proposal Preview后仍需跨多轮维护的当前设计工作面，不是聊天记录、决策历史、task ledger或第二真相源。一次成型的设计可以不创建Workspace。

一个主题最多一个active Workspace：

```text
docs/plans/designs/<design-key>.md
```

只保存：objective、scope/protected scope、truth references、current proposed design、open questions、intended canonical changes和next discussion point。每轮原位更新，不追加时间线或消息。

需要跨task恢复时可保存一个最小active locator，只含repository、design key、exact owner、Workspace和state。locator不轮询、不保留历史，cleanup时compare-and-delete。

结论冻结后回写canonical truth并从Workspace移除；全部冻结后进入cleanup。删除前逐项证明仍有效内容已经进入canonical truth、active Packet或backlog。

## 5. Proposal Patch

Proposal Preview是Design Owner基于latest truth向Human展示的完整只读方案，不是repository artifact。至少包含：

1. 问题与目标；
2. 规范结论和主要流程；
3. intended canonical files；
4. protected scope；
5. in-flight兼容与post-merge route；
6. 验证；
7. stop point。

Human确认exact Preview后，Design Owner才形成真实Git diff/commit形式的Proposal Patch并提交exact UD。一次确认授权Design Owner形成/验证/提交Proposal，也授权UD在接受时推进到`DESIGN_PR_READY`。Design PR merge、`NEW_DESIGN` delivery activation和cleanup分别确认；existing-delivery design gap合并后自动恢复原owner。

机器必须在task-local evidence中绑定source Design Owner、canonical base、proposal commit、intended files、scope/protected scope、confirmation、entry type、existing-delivery return target和stop point。Human不需要查看或复述SHA、fingerprint、nonce、epoch、CAS或transition。语义、文件范围、protected scope、owner或stop point变化时重新展示完整Preview；纯技术binding重算不单独形成Human gate。

Proposal及UD envelope只保留能独立证明以下事实的一份当前记录：

- Human确认的是当前Preview；
- Proposal parent/base与latest truth一致或明确使用approved moving-main规则；
- cumulative diff只修改intended files；
- source owner与exact UD正确；
- entry-specific return target明确；
- rollback和验证可复现。

同一事实不得同时以多份长期manifest、receipt和binding文件重复表达。Git、task history或最终verification可重建的中间结果不另建过程账本。Revision使用append-only commit，不amend已审核Proposal。

语义影响为`NONE`的`CANONICAL_EDITORIAL_PATCH`不是Proposal。它由source Direct确认exact files/hunks和source notice target后交UD；classification失效时返回source重新选择Design或继续讨论。

## 6. Stage Packet

一个SL对应一个compact active Stage Packet：

```text
docs/plans/stages/<stage-key>.md
```

Stage Packet只存在于SL本地coordination branch/worktree，不push、不创建产品PR、不合入main。只保存当前objective、scope/protected scope、integration base、FL引用与依赖、WIP、exit criteria、blocker和Human可见状态；状态原位覆盖，不保存聊天、时间线、task registry、watcher、technical receipt或IT candidate细节。

Human正常进度以可见SL task为入口，Stage Packet提供可恢复的当前协调状态。全部FL完成和Stage exit通过后，SL展示一张批量cleanup卡；每个FL清理自己的资源，SL只汇总结果并通过一个cleanup-only PR删除卡内terminal Feature Packets，最后清理Stage Packet和自身资源。

## 7. Feature Packet

一个FL对应一个compact active Feature Packet：

```text
docs/plans/features/<feature-key>.md
```

FP只保存当前scope/protected scope、slices、依赖、acceptance、candidate、Feature RI和Human可见状态。只有FL写FP；状态原位覆盖，不写执行流水、重复测试输出或内部task消息。

一个FL同时最多一个Feature RI。IT的进度默认由FL和FP汇总；独立可恢复IT另建可见task。candidate验证只维护一份当前记录，输入未变的focused/affected evidence直接复用。

feature merge和main验证通过后进入cleanup。standalone FL使用自己的cleanup卡；有parent SL时由一张Stage Cleanup卡统一授权，各FL仍只清理自己的exact资源。未terminal、coverage不完整、owner不明、dirty或SHA不匹配的FP和资源保持原状。

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
