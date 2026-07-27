# OES Capability Collaboration Framework v1

## 1. 定位与启用规则

本文档是 OES 能力级协同框架的项目治理真相源。它定义设计、总控、实现与验收线程如何协同，不定义任何具体业务能力的领域模型、字段、API 或数据库结构。

框架默认关闭，按能力域显式启用。只有用户明确表示“使用/启用 OES 协同框架”并给出能力域时，才能创建配对线程或派发子线程。普通的“设计某能力”“继续实现”“修复问题”“新建讨论线程”不得推断为启用框架。

框架只对当前明确的 `capabilityKey` 生效；不会自动扩展到其他能力域。用户可以明确停用某能力域的框架，停用后不再自动创建新的实现或验收线程。

Skill 是本框架的执行器，不是真相源。Skill 必须读取本文档及其引用的治理规则；若 Skill 与本文档冲突，以项目治理文档、`AGENTS.md`、架构文档和 ADR 为准。

## 2. 线程层级

```text
Project Global Command
        ├─ Design Thread A
        │      └─ Capability Command A
        │             ├─ Implementation Threads
        │             ├─ Acceptance Thread
        │             └─ Focused Review（仅高风险时）
        └─ Design Thread B
               └─ Capability Command B
                      ├─ Implementation Threads
                      └─ Acceptance Thread
```

- 一个 Design Thread 只负责一个持续设计主题。
- 一个 Design Thread 只对应一个 Capability Command，二者一对一。
- 多个 Design Thread 可以并行存在；每个 Design Thread 都必须有自己的 Capability Command。
- Project Global Command 可以协调多个设计域，但不得替代 Design Thread 做服务级/功能级设计或实现。

## 3. 角色职责与回传路径

### 3.1 Project Global Command

负责跨能力域的优先级、依赖、ownership 冲突、共享文件冲突和全局调度。只产出项目级分类与调度信息，不决定最终领域归属、工作流、契约或 schema，也不直接修改业务实现。

### 3.2 Design Thread

与用户持续讨论单一能力设计，维护母分支与讨论分支，识别遗漏和冲突，冻结业务/架构结论，并将冻结结果回写到唯一真相源。发现设计不充分时，继续与用户讨论，不派发实现绕过未决设计。

### 3.3 Capability Command

消费已冻结设计，按实际 ownership 拆分垂直任务，分配允许修改路径，管理实现线程的依赖、返工与收口，并按相近能力批次安排统一验收。实现缺陷回 Capability Command；设计缺口回 Design Thread；跨域冲突回 Project Global Command。

### 3.4 Implementation Thread

只在冻结设计和明确任务边界内修改授权路径，完成定向自测并提交结构化 handoff。不得自行改变冻结设计、公共契约、权限、租户或共享边界。

### 3.5 Acceptance Thread

针对完整用户流程或相近能力批次做统一验收，不为每个实现任务重复创建完整验收。只在并发、事务、安全、迁移、权限、公共契约等高风险场景创建额外 Focused Review。

## 4. 标准生命周期

1. **Explicit intake**：确认用户明确启用框架，记录 `capabilityKey`、目标、优先级和疑似依赖。
2. **Pairing**：创建一个 Design Thread 和一个同域 Capability Command，并锁定双方 ownership。
3. **Design**：Design Thread 与用户讨论，解决母分支下的分支问题；开放问题未冻结前不得派发实现。
4. **Freeze**：将结论回写架构、ADR、contract 或 feature packet 等唯一真相源，形成下游可执行输入。
5. **Dispatch**：Capability Command 按垂直切片创建 Implementation Threads；只有确有必要时才创建额外 review。
6. **Batch acceptance**：相近实现完成后交由 Acceptance Thread 统一验证，发现实现问题回 Command。
7. **Integration and close**：Command 收口冲突与验收结果，提交 handoff；不再复用的实现、验收和临时 review 线程必须 archive/关闭。若子线程派生子线程，父线程负责确认所有子子线程先完成并关闭。

## 5. 任务边界与 handoff

每个实现或验收任务必须明确：范围、允许修改路径、依赖、输出、验收标准和关闭条件。正式 handoff 至少包含：Thread、Type、Parent、Return target、Branch、Worktree、Scope、Changed files、Design/Contract/Data/Permission impact、Tenant/operator/audit impact、Dependencies unlocked、New blockers、Conflicts detected、Verification、Recommended next tasks。

共享契约、事件、`src/common`、权限、租户、operator context、网关公共入口或架构真相源发生变化时，线程必须停止并回传，不得私自绕过。

## 6. 文档归位

- 稳定服务边界：`docs/architecture/services/`
- 跨服务协同：`docs/architecture/collaborations/`
- 关键取舍：`docs/adr/`
- 黑盒契约：`docs/contracts/`
- 长周期未冻结设计：`docs/plans/designs/`
- 可执行 feature 状态：`docs/plans/features/`
- 项目级调度：由 Project Global Command 独占 `docs/plans/oes-*` 共享计划文件

Design workspace 只记录未冻结过程；结论冻结并回写真相源后，应标记退出 active 或归档，不得形成第二份长期设计真相。

## 7. 与其他治理文档的关系

- 顶层 Global Command 红线：`codex-global-command-model.md`
- 线程类型与路径 ownership：`codex-threading-rules.md`
- feature 拆分与验收：`codex-feature-threading.md`
- 标准执行步骤与失败升级：`codex-workflow.md`
- 共享计划单写者：`docs/plans/oes-thread-control-board.md`

本文件补充上述文档的“能力级 Design Thread—Capability Command 配对、显式启用和批量验收”规则；若发生冲突，以 `AGENTS.md` 和更高优先级架构/ADR 为准。

## 8. 自动任务命名规范

框架自动创建的任务统一使用以下格式：

```text
A/<Role>/<CapabilityKey>[/<Sequence>] · <Task Name>
```

- `A` 表示由 OES 协同框架自动创建；人工创建的任务不使用该前缀。
- `D` 表示 Design，`C` 表示 Capability Command，`I` 表示 Implementation，`V` 表示 Verification/Acceptance，`R` 表示高风险 Focused Review。
- `CapabilityKey` 使用稳定的大写短码，例如 `SITE`、`CRM`、`ITEM`。
- Design 与 Capability Command 通常不需要序号；临时实现、验收和复审任务必须由 Capability Command 分配序号。
- 子任务继承同一能力域和父任务序号，例如 `A/I/SITE/01.1`。
- Bugfix 归入 `I`，不额外创建 Debug 类型。
- 标题不包含状态、日期或模型名；任务状态由会话系统维护，关闭或 archive 后标题保持不变。

示例：

```text
A/D/SITE · Site Management Design
A/C/SITE · Site Management Command
A/I/SITE/01 · Runtime Presence
A/V/SITE/01 · Status and Onboarding Acceptance
A/R/SITE/01 · Sync Concurrency Review
```
