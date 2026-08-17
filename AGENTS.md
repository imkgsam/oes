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

OES 使用以下执行入口与最小角色：

- Direct execution：默认执行方式。当前单一职责 task 直接拥有一个有界 Change Set，不创建角色拓扑、Stage Packet 或 Feature Packet；仍使用 owner branch、PR、required CI、Human merge gate 与精确清理。
- Human Decision Owner（HDO）：人，负责语义决定、波次边界和清理确认。
- Initiative Discussion Task（IDT）：讨论跨 feature 的优先级、阶段目标和业务取舍，不写设计或执行 feature。
- Capability Design Task（CDT）：围绕一个设计主题形成 Proposal Patch，只对接 UD。
- Global Unified Design（UD）：全局架构与稳定治理审查者，也是规范真相唯一 agent writer；只接受两类 Human-confirmed 入口：CDT 的语义 Proposal，以及语义影响为 `NONE` 的 `CANONICAL_EDITORIAL_PATCH`。UD 不自行发起 canonical 改写。
- Stage Lead（SL）：一个有界交付阶段的临时 owner，协调多个可独立交付的 FL，并在阶段清理后关闭。
- Feature Lead（FL）：单 feature 临时 owner，写一个 active Feature Packet，拆分并推进 slices。
- Implementation Task（IT）：实现一个 slice；通常是 FL 的 subagent。
- Review & Integration（RI）：按风险执行局部或全局复核；通常是 FL 的 clean-context subagent。

默认先读取真实 task、branch/worktree、candidate、PR、main 与 cleanup status，再只展示当前可用的执行方式并标记一个建议项。一个 owner 可闭合、无稳定设计语义变化、无跨 feature 协调的工作使用 Direct；Human 主动选择协同，或涉及新服务、跨服务契约、事件、权限、租户、共享 API/抽象、AI 工具协议、稳定治理语义、多 owner/feature 或资源冲突时，使用 Collaborative。判断原因仅在 Human 请求时展示。

完整消息流、并发约束、review 返工、UD locator、自动与人工边界以 `docs/governance/codex-execution-model.md` 为准。

任何 remote push、PR、`main` merge、post-merge 验证和 Git 资源清理，必须先读取并遵守该文件第 9 节；Direct 只简化角色与过程文档，不允许 direct push `main`、绕过 PR/CI/Human merge gate 或降低验证。其他文档不得另行定义 Git 角色权限或删除规则。

任何 task 都应保持单一职责。SL 只在已确认的有界阶段内协调列明的 FL，不构成长期全局调度中心；不得恢复旧的全局调度中心、能力命令层、watchdog、heartbeat、Pull inbox、线程 registry 或历史状态账本。

## 6. 讨论、冻结与写入

- 用户表达“还在讨论”“先聊想法”或同等语义时，只分析和比较，不修改项目文件。
- 状态检查后，task 以极简选项展示当前可用的 `Direct`、`常规协同框架` 或 `继续讨论`，只标记建议项；Human 选择后才进入对应写入路径。
- Direct 适用于同一 Change Set 的明确小修改；同一目标继续修改时恢复 exact owner task 与现有现场，不因 turn 结束创建新 task。目标、owner、保护范围或独立交付物变化时形成 replacement scope 或新 Change Set。
- 用户明确确认结论并要求记录、冻结、形成 Workspace/FP 或开始实现后，才写入对应文件。
- CDT 提交 Proposal 前，必须重新读取相关规范真相，并由 Human 明确确认提交；Design Proposal 只承载稳定设计真相并始终提交 UD。
- Proposal 提交确认授权 UD 审核，并在接受时把 exact Proposal 集成到 canonical design branch、验证、push 和创建 design PR，停止于 `DESIGN_PR_READY`；design PR merge 与 cleanup 分别另行确认。
- `CANONICAL_EDITORIAL_PATCH` 由 source Direct owner 确认精确文件、hunks、语义影响 `NONE` 和 callback 后交 UD；UD 独占 design branch、PR、merge、main validation 与自己的 Git cleanup，分类失效即返回 source，不转成隐式 Proposal。
- IDT 在现有 canonical truth 充分且 Human 确认 Stage Start 后可直接启动 SL；发现设计缺口时转入 CDT → UD。
- 涉及公共契约、事件、权限、租户、共享 API、AI 工具协议或 operator context 的实现，必须以已冻结真相为输入。

## 7. 实现质量

- 先复现或定位现象，再区分症状、触发条件、根因、设计缺口与环境因素，最后实施最小正式修复。
- 修正错误边界、契约、映射或抽象，不用硬编码、特殊判断或多层兜底掩盖根因。
- 新增或重写的 class、function、service、handler、repository、guard、interceptor 等代码单元应有一句职责总结注释；已有同等清晰注释时不重复。
- 文档、代码与配置统一使用 UTF-8；代码标识符、目录、文件名、proto 字段、事件名和权限码使用英文。
- 怀疑历史文件编码异常时先标记并安排转码，不在乱码状态下续写或整篇覆盖。

## 8. 交付要求

每次交付说明：

- 本次范围与修改文件；
- 行为、契约与数据影响；
- 执行的验证及结果；
- 剩余风险与下一步。

缺陷修复额外说明现象、根因、正式修复以及根因验证。任何完成声明都必须对应可复现的命令、输入和结果。
