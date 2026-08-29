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
- `REPOSITORY_DELIVERY` 的 Stage Packet 只存在于 SL 的本地协调分支和 worktree，保存一个有界阶段的当前协调状态；阶段清理后删除，禁止 push 或合入 `main`。纯 `HOST_LOCAL_OPERATION` Stage 只在 task-local current evidence 中维护同等精简状态，不创建 repository Packet。
- `REPOSITORY_DELIVERY` 的 Feature Packet 只保存当前 feature 的 slices、验收条件与候选状态；完成并经 Human 确认清理后删除。`HOST_LOCAL_OPERATION` FL 不为状态记录创建 repository Packet。
- ADR 只解释仍有价值的高影响决策、取舍与后果；完全被取代且已无当前解释价值的 ADR 删除，历史由 Git 保留。
- 文档链接使用仓库相对路径，禁止写入本机绝对路径。

## 5. Task 执行入口

OES 默认从普通讨论开始；只读讨论不创建角色或资源。有状态修改按真实范围自动建议：

- Portfolio Planner（Planner）：长期可见的只读项目组合规划顾问，默认使用 Plan mode，按月、周、日提供跨方向候选、里程碑、冲突与验收建议；不成为owner、canonical writer或执行总控；
- Direct：一个 owner 闭合一个无稳定设计变化的小型 Change Set；根据实际写入对象选择 repository delivery 或 host-local operation；
- Design Owner：研究稳定设计，先展示完整只读 Proposal Preview，Human确认后形成local-only Proposal并提交exact global UD；
- Global Unified Design（UD）：全局唯一canonical writer、串行设计审核者和Design remote owner；
- Stage Lead（SL）：协调多个独立FL、依赖、WIP、moving-main和Stage Review，不写feature产品代码、不建立总产品PR；纯本地运维Stage不为协调本身创建Git资源；
- Feature Lead（FL）：独立拥有一个feature结果；repository delivery拥有Packet、branch/worktree、candidate、Feature RI和Draft PR，host-local operation拥有精确本地资源范围、当前操作证据和验收结果但默认没有Git交付资源；
- Implementation Task（IT）：实现一个slice，通常是FL的bounded subagent；
- Review & Integration（RI）：执行Feature或Stage的独立风险审核，默认只读exact candidate。

新服务、跨服务契约/事件、权限、租户、共享抽象、AI工具协议或canonical gap先进入Design Owner → exact UD。一个独立交付物使用FL；两个及以上独立交付物使用SL拆分sibling FL；必须共同原子验收的slices保持一个FL并由IT并行实现。

角色职责、Human可见性和执行载体是三个独立判断。修改repository并形成candidate/PR时使用`REPOSITORY_DELIVERY`；Docker、数据库、模拟器、本地服务等不修改repository的维护使用`HOST_LOCAL_OPERATION`。后者仍创建Human-visible、project-associated的local task，但不创建worktree、不传Git starting state、不因task provisioning隐式fetch/pull。可见project task不等于worktree task。

Planner、Design、Direct、SL、FL、Feature RI和Stage RI必须是Human在正常Codex项目任务列表中可发现、可打开、可继续的project-associated task。`source=exec`等隐藏transport只允许bounded IT、helper和短期只读分析，不得创建owner或独立reviewer。role task在title、parent、project、正常列表可见性和双向消息均read-after-create通过前不得写role-owned资源；失败时修复same task，不创建重复owner。

创建任何delivery/review owner前，系统自动准备最小充分execution profile并由target session完成一次真实smoke。task、host、repository、worktree、toolchain、credential identity和permission policy未变时后续直接复用；漂移时保持原owner/candidate并自动修复。已确认范围内的普通文件、Git、测试、本地服务、task-owned数据库、localhost和approved network不向Human逐项请求许可。

Human默认只看到`讨论中、设计审核中、实现中、审核中、等待合并、已完成、阻塞`及范围、进度、阻塞、下一步。SHA、fingerprint、nonce、CAS、checkpoint和typed result只在查看证据时展开。新增常规状态、Human gate或角色必须同时证明无法由现有owner自动处理并收敛等量旧复杂度。

完整owner转移、Design/UD、moving-main、三层验证、remote driver、merge、cleanup、failure recovery和Human命令以`docs/governance/codex-execution-model.md`为准。

任何remote push、PR、`main` merge、post-merge验证和Git资源清理必须遵循该文件。禁止direct push `main`；Design remote mutation只由exact UD发起或由UD预先绑定的机械host transport执行；每次main merge继续使用Merge Commit、required CI和Human确认。

任何有状态work item同时只有一个current owner和artifact owner。通知不转移owner；replacement必须在旧owner终止并验证后创建。不得恢复全局调度中心、task registry、watchdog、heartbeat、pull inbox或历史状态账本。

Planner只重读现有canonical truth、可见task与GitHub状态生成非canonical建议；Human选择方向后仍由既有Direct、Design、FL或SL入口形成有状态确认，Planner不创建第二套调度、监控或授权链。

## 6. 讨论、冻结与写入

- 用户表达“还在讨论”“先聊想法”或同等语义时，只分析和比较，不修改项目文件。
- 普通讨论不创建role、branch、Workspace或Packet；小而明确且无稳定语义变化的修改建议Direct。
- 用户要求形成设计时，Design Owner先基于latest truth展示完整只读Proposal Preview，包含问题、结论、流程、文件范围、protected scope、迁移、验证和停止点。
- 创建有状态task前先独立判断是否写repository、是否需要candidate/PR、是否操作host-local资源以及是否需跨turn可见owner；只有repository写入才允许worktree provisioning。纯host-local任务默认先只读盘点，任何破坏性host操作必须通过绑定精确资源和保护清单的Human确认。
- Human确认exact Preview后才形成Proposal并提交exact global UD；该确认授权UD推进到`DESIGN_PR_READY`，Design PR merge、NEW_DESIGN delivery activation和cleanup分别确认。
- delivery中发现design gap时只暂停affected lane并保留原SL/FL资源；truth merge后UD自动返回exact original owner，原owner更新latest `origin/main`、只重验受影响范围并继续，不创建replacement或把实现路由到祖先task。
- Planner的月、周、日规划默认只保存在Planner task消息中；日计划必须关联周目标、周目标必须关联月度里程碑，未满足依赖或无法在时间盒内验收的事项不进入推荐组合。
- Proposal、Packet和验证只保存当前必要状态；Git、task history或最终记录可重建的中间事实不另建长期receipt、ledger或重复manifest。
- canonical cutover前已存在的合法task、owner和资源保持exact binding到terminal/cleanup；新规则只约束cutover后新建role。当前Collaboration Runtime Cutover及其现有FL/RI保持暂停和资源不变，设计合并后优先same-id恢复Human可见性，再由原SL继续。

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
