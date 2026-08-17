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
- `AGENTS.md` 与 `docs/governance/**` 的稳定治理和协同契约只由 UD 根据 Human-confirmed Proposal 写入；CDT 只形成 Proposal Patch，不直接成为 canonical writer。
- Runbook 只保存当前可执行的运维、故障处理与恢复步骤。
- 已完成治理项目、优化收尾、线程经验和一次性复盘不作为长期治理文件。

### 3.5 Direct 文档维护

非规范语义的单一文档 Change Set 默认使用 Direct，不创建 CDT、SL、FL、IT、RI、Workspace 或 FP。Direct owner 只在精确允许路径内修改，使用短期 owner branch、focused verification、PR、required CI、Human merge gate 和合并后精确清理。

适用范围：

- 拼写、标点、排版和明确断链；
- README、index 或导航的非语义修正；
- 不改变运行行为、操作结果、owner、scope、contract 或约束等级的说明修正。

Architecture、ADR、Contract、`AGENTS.md` 或 Governance 的语义变化始终进入 CDT → UD。上述规范文件的纯编辑修正可使用 `CANONICAL_EDITORIAL_PATCH`：不创建 CDT/Workspace/FP，由 UD 作为唯一 writer 在短期 design branch 上修改、验证并经 design PR 合入。任何 `must/should/may`、owner、scope、权限、租户、事件、API、生命周期、默认值或行为含义变化都使 editorial classification 失效。

Direct 文档验证至少包括 changed-path allowlist、`git diff --check`、相关 Markdown link/UTF-8/绝对路径检查和语义影响声明。发现分类不成立时停止写入，并根据 status 展示 Collaborative 或继续讨论选项。

## 4. Design Workspace

Design Workspace 用于跨多轮讨论的当前工作记忆，不是聊天记录、决策历史或第二真相源。

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

Proposal Patch 是 Design Task 基于 Workspace 与当前真相形成的真实 Git diff/commit，不是另一份长期 proposal 文档。

它至少能确定：

- source Design Task；
- base commit；
- proposal commit；
- intended canonical files；
- canonical truth domain（architecture、ADR、contract 或 governance）；
- `executionIntent = DESIGN_ONLY | START_AFTER_TRUTH_MERGE`；
- `executionShape = NONE | SINGLE_FEATURE | DELIVERY_STAGE`。
- `DELIVERY_STAGE` 的 exact source decision task。

UD 只处理 Human-confirmed Proposal。一次 Proposal 提交确认授权 UD 审核，并在接受时按 intended canonical files 将 exact Proposal 集成到其唯一写者范围，完成验证、push 和 design PR 创建，停止于 `DESIGN_PR_READY`；design PR merge 与 cleanup 分别另行确认。唯一写者范围包括 architecture、ADR、稳定 contracts、`AGENTS.md`、`docs/governance/**` 与必要导航。Proposal 的长期历史由 Git 提供。

## 6. Stage Packet

一个 SL 对应一个 compact active Stage Packet，逻辑路径为：

```text
docs/plans/stages/<stage-key>.md
```

Stage Packet 只存在于 SL 的本地 stage coordination branch/worktree，不 push、不创建 PR、不合入 `main`。它只记录当前 objective、scope/protected scope、source IDT、FL 引用与依赖、exit criteria、blocker 和 current state；状态原位覆盖，不保存聊天、时间线、task/thread registry、watcher 信息或 IT candidate 细节，也不复制 FP 内容。

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

- `plans/intake.md`：尚未进入设计的当前候选；Design Task 创建后从 intake 删除。
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
