# 企业知识与 AI 能力平台

```text
status: DESIGNING
role: DA
designKey: enterprise-knowledge-and-skill-platform
truthBaseline: 42ee5897bf1dc2a82cddc857de7282908f17bde7
```

## Objective

为 OES 设计一个能够长期演进的企业知识与 AI 能力平台。平台应把业务实时事实、企业知识、业务语义、专业 Agent、受控 Tool 和可治理 Skill 组合成可复用能力，支撑智能客服、智能助手及后续业务场景，同时不形成第二业务真相、不绕过业务 owner，也不形成拥有全局权限的超级 Agent。

本 Workspace 是 DA 维护的未冻结设计讨论面，不是 canonical truth、Proposal、Delivery Package 或实现任务。

## Scope

本设计覆盖：

- AI 产品组合、主流业务场景及其共用能力；
- Knowledge、Ontology、Analytics 的边界和协同；
- 专业 Agent、Router、Orchestrator、Skill、ToolContract 的关系；
- Multi-Agent 的身份、权限、委派、上下文与结果汇总边界；
- 企业知识和可复用 Skill 的采集、治理、评测、发布、监控及回滚；
- 外部客户、内部员工、SYSTEM HUMAN、TENANT HUMAN 与 MACHINE Agent 的身份和资源访问边界；
- 权限感知检索、引用溯源、生命周期、安全与审计原则；
- 能力建设顺序、依赖、阶段验收指标和退出条件；
- 未来可能进入 architecture、ADR 和 contract 的稳定结论。

当前不包含：服务数量和部署拓扑、proto/schema、具体模型或基础设施供应商、Agent 框架选型、模型参数级蒸馏、代码实现、delivery activation、DP/ADP、PR 或 CI。

## Protected scope

- 不修改现有 architecture、ADR、contract、governance、runbook 或产品代码；
- 不改变业务 owner、业务状态机、权限码、租户模型、ToolContract 或现有 AI runtime gate；
- 不把业务数据库、业务 read model、向量索引、图投影或模型记忆升级为业务真相；
- 不把 Workspace 中的建议表述为已冻结设计；
- 不提交 Proposal，不调用 UD，不创建 DO/CO/RV/helper 或其他任务；
- 不创建、更新或合并 PR，不执行 delivery、cleanup 或资源迁移；
- 保留当前 same-id DA、既有 worktree、分支、提交历史和 active locator。

## Current truth baseline

### Truth references

- [OES execution baseline](../../../AGENTS.md)
- [OES Collaboration Framework V2](../../governance/codex-execution-model.md)
- [OES document governance](../../governance/document-governance.md)
- [AI Platform Architecture](../../architecture/platforms/ai-platform.md)
- [Task Assistant Collaboration](../../architecture/collaborations/task-assistant.md)
- [Delegated Execution and ActionGrant](../../architecture/collaborations/delegated-execution-and-action-grant.md)
- [Authorization layering and resource policy](../../architecture/platforms/authorization-layering-and-resource-policy.md)
- [gRPC metadata and service trust](../../architecture/platforms/grpc-metadata-and-service-trust.md)
- [Workload identity and ExecutionToken ADR](../../adr/0015-workload-identity-and-execution-token.md)
- [Identity Service](../../architecture/services/identity-service.md)
- [Auth Service](../../architecture/services/auth-service.md)
- [Permission Service](../../architecture/services/permission-service.md)
- [Observability and audit](../../architecture/platforms/observability-and-audit.md)
- [Event bus and outbox](../../architecture/platforms/event-bus-and-outbox.md)
- [Asset Service](../../architecture/services/asset-service.md)
- [Task Assistant ToolContract](../../contracts/ai-platform/task-assistant-tool-contract.md)

### Frozen constraints consumed by this design

- AI Platform 已定义统一 Model、Knowledge、Tool Governance、Orchestration 和 Scenario 逻辑层；Task Assistant 是首个验证场景。
- AI 不拥有业务主数据，不直接访问或写入业务数据库；实时事实只能通过业务 owner 的公开能力读取或改变。
- `AgentPrincipal` 引用 Identity 持有的机器主体；`AgentProfile` 只定义运行边界，不能授予或扩大权限。
- 有效 AI 操作权限是 HUMAN、AgentPrincipal、DelegationGrant、AgentProfile、ToolContract、tenant/org、目标服务 policy 和业务规则的严格交集。
- `KnowledgeScope` 只能收窄访问上限；知识 owner 必须在检索时执行真实授权。
- 企业知识必须保留来源、版本、tenant/org 和可见性；全文、向量、图和缓存投影均为可重建 derived index。
- AI 状态变化只能通过版本化 ToolContract、业务应用服务、鉴权、适用确认和审计链完成。
- 当前 canonical truth 尚未冻结长期记忆、多 Agent、无人值守自动化、Ontology owner 或具体技术产品。
- SYSTEM/TENANT HUMAN OBO 使用唯一 scope/tenant 表达：精确非 wildcard `tenant_id` 存在表示 `TENANT`，完全缺席表示 `SYSTEM`；不增加 `scope_level` claim，空值、wildcard、session mismatch 或调用方补交 scope/tenant 均 fail closed。
- HUMAN OBO 保持原 HUMAN subject scope/tenant；直接 actor 是 tenantless SYSTEM MACHINE workload。Permission 的 workload decision 不提供或重解释 HUMAN subject scope/tenant。
- SYSTEM 聚合器跨域读取 owner facts 必须使用 separately named、exact workload/audience/Code 的专用 INTERNAL resolver；request selector 只定位目标，不建立 tenant、principal 或资源 authority。
- Task Assistant ToolContract 最新变化仅把验证载体明确为 static check，没有改变 AI 产品边界或业务操作语义。

## Current proposed design

### 1. 总体逻辑

OES AI 不按“一个场景建设一个 AI 系统”，也不建设“向量数据库加聊天框”。当前建议形成五个长期协同边界：

```text
AI Products / Business Experiences
  -> Professional Agent and Orchestration
      -> Knowledge, Ontology and Analytics
      -> Governed Skill and Tool Catalog
          -> Business Owner Services
  -> Model and AI Runtime Foundation

Identity / Permission / Audit / Evaluation / Lifecycle
贯穿所有边界
```

1. **AI 产品与业务体验**：面向客户或员工交付智能客服、智能助手、研究分析、文档智能、质量追溯等可验收产品，不把聊天作为唯一入口。
2. **专业 Agent 与编排**：按业务责任和权限边界组合 Profile、Principal、KnowledgeScope、Skill 与 Tool；Router 只选择合适能力，Orchestrator 只协调有界步骤。
3. **Knowledge、Ontology 与 Analytics**：Knowledge 提供有来源的内容证据；Ontology 提供业务对象、术语和关系语义；Analytics 通过 owner query 或授权投影完成聚合、指标与探索。
4. **Skill 与 Tool 治理**：Skill 描述可复用目标、适用条件、步骤、知识、工具、检查点和评测；ToolContract 是进入业务 owner 能力的受控入口。Skill 不能创造权限或绕过 ToolContract。
5. **模型与运行基础**：统一模型、embedding、reranker 的路由、回退、成本、延迟、缓存和观测，并保持供应商可替换。

### 2. 产品与共用能力

智能客服和智能助手是已确认的产品方向，但不是产品全集。候选产品应从可验证的业务结果出发，并复用：

- **事实获取**：从 owner service 查询最新业务对象和状态；
- **知识检索**：从有来源、有权限和有生命周期的内容中取得证据；
- **语义探索**：借助 Ontology 连接客户、订单、项目、投诉、批次、会议和人员等对象；
- **分析与报告**：聚合事实和证据，并区分 owner fact、知识内容和模型推断；
- **内容生成**：产生回复、摘要、方案、报告或待确认业务草稿；
- **文档理解**：统一处理文件、OCR、表格、图片、音频和视频内容；
- **受控执行**：通过 ToolContract 请求业务状态变化；
- **知识与 Skill 沉淀**：把经过审核的案例、SOP、Playbook 和成功方法转为可复用资产。

### 3. Ontology 的定位

Ontology 应提前设计，因为它支撑跨业务对象分析、报告和根因探索，例如从客户投诉追溯产品、订单、批次、质检、供应商、责任团队和相关决策。

当前建议把 Ontology 定位为“企业业务语义与关系能力”，而不是集中复制全部业务数据的知识图谱：

- 业务 owner 继续拥有对象事实和状态；
- Ontology 管理统一术语、实体类型、关系类型和可解释路径；
- 关系投影由 owner facts/event 构建并可重建；
- 每次查询执行 HUMAN subject、MACHINE actor、tenant/org 和目标 resource 的完整授权；
- SYSTEM 查询必须使用专用 owner-fact 能力，不得把 tenant 缺席解释为 tenant wildcard；
- 图路径不能通过已授权节点泄露未授权相邻对象；
- 图推理结果必须携带来源、时间边界和授权上下文，不能成为 owner truth。

### 4. 专业 Agent 与 Multi-Agent

从架构初期支持多个专业 `AgentProfile` 和必要的独立 `AgentPrincipal`，但区分：

- **现在需要的基础**：专业职责、独立权限上限、明确 KnowledgeScope、受控 Tool、结果证据和统一 AgentRun；
- **按证据开放的能力**：自主规划、动态委派、Agent 间协商、长链路自治和无人值守执行。

Router 或协调 Agent 不自动获得所有专业 Agent 权限。每个子执行都必须建立独立、可验证的 subject/actor/delegation/tenant/resource 交集；协调层只接收当前调用者可见的结构化结果、证据与失败状态。不同 SYSTEM/TENANT subject、不同 tenant 或不同 delegation 的缓存和记忆不得混用。

### 5. 企业知识与 Skill 沉淀

业务历史只有经过治理后才成为长期资产：

```text
原始业务事实/文档/交互
  -> 候选案例或候选做法
  -> 去敏、归因、去噪、失败分析和证据补齐
  -> 领域专家审核
  -> 发布为 Knowledge / Case / Playbook / Skill
  -> 离线与在线评测
  -> 版本化使用、监控、Canary、回滚和弃用
```

员工能力不应直接“复制员工”。优先沉淀可解释、可审核的工作方法：适用条件、输入、决策点、步骤、知识、工具、检查项、成功标准、失败模式和实例。自然语言可以起草，但正式 Skill 必须形成结构化、版本化、可评测并受权限治理的定义。

模型参数级蒸馏不在当前范围。未来只有出现明确规模、成本、延迟或专用模型收益证据时再单独评估。

### 6. 贯穿式治理原则

- 事实、企业知识、用户偏好、Agent memory 和模型推断分别分类和治理；
- document/section/chunk 级权限不能只靠生成后过滤，检索候选产生前必须执行授权约束；
- 引用能够回到来源版本、证据片段、访问时间和适用权限；
- 删除、撤权、过期和密级变化传播到全文、向量、图和缓存投影；
- ingestion 和检索链抵御 prompt injection、知识污染、秘密泄露与供应链风险；
- 所有 AI 调用显式携带适用的 tenant、org、operator、trace 和 audit context；
- 评测同时覆盖业务结果、检索质量、引用正确性、越权率、工具错误、时延、成本和知识新鲜度。

## Human-confirmed Proposal boundary

```text
proposalState: NOT_CONFIRMED
canonicalWriteAuthorized: false
udSubmissionAuthorized: false
```

Human 当前只确认：将 same-id 任务原位映射为 DA，按 V2 结构更新本 Workspace，形成并推送一个 DA checkpoint。该确认不构成 Proposal 确认，不授权修改 canonical truth、调用 UD、创建设计 PR 或激活 delivery。

以下是已经确认可继续研究的方向，而不是已确认 Proposal：

- 智能客服和智能助手是产品方向，但不限制未来 AI 产品范围；
- AI 产品复用事实获取、知识检索、分析探索、内容生成、文档理解、受控执行和沉淀能力；
- Ontology 提前设计，用于业务语义、跨域追溯、分析探索和报告；
- 初期支持多个专业 Agent/Profile 与独立权限边界，高级自治按证据开放；
- 客服/质量闭环和业务员成功开发客户案例作为业务历史沉淀样板；
- OCR 和多模态理解属于共享能力；
- 模型参数级蒸馏不进入当前范围。

形成 Proposal 前必须重新读取 latest `origin/main`，展示包含问题、规范结论、替代方案、protected scope、迁移、intended canonical files、验证、rollback 和 stop point 的完整 Preview，并取得独立 Human 确认。

## Open questions

1. 统一知识能力由哪个平台边界拥有，文档、章节、片段 ACL、版本、有效期与删除传播如何划分？
2. OES Ontology 包含语义目录、关系目录、关系投影和分析指标中的哪些部分，各自 owner 是谁？
3. Ontology 查询怎样执行 HUMAN subject、MACHINE actor、tenant/org/resource policy，避免权限并集、tenant wildcard 和关系泄露？
4. 专业 Agent 如何划分 AgentPrincipal，Router/Orchestrator 如何在不获得超级权限的情况下汇总结果？
5. Skill 的正式表达、owner、版本兼容、审核、评测、发布、回滚和弃用如何定义？
6. 外部智能客服中的匿名访问、SYSTEM HUMAN、TENANT HUMAN、经销商、客服员工和机器 Agent 分别使用什么身份与知识/工具范围？
7. Ontology、Analytics 和 Knowledge 在报告、根因分析与探索式查询中的职责如何区分？
8. 除智能客服和智能助手外，哪些产品方向进入正式路线，哪些只保留扩展点？
9. Agent memory 的短期、长期、episodic、semantic 和 procedural 分类中，哪些确有 OES 业务价值，分别由谁拥有和如何删除？
10. 哪些 SYSTEM 聚合查询确有必要建立专用 INTERNAL resolver，哪些必须改为 HUMAN OBO 或业务 owner 侧报告能力？

## Intended canonical changes

尚未形成 exact Proposal，以下仅是候选承载位置：

- 修订 [AI Platform Architecture](../../architecture/platforms/ai-platform.md)；
- 新增或拆分企业知识、Ontology、Skill/Multi-Agent 相关 platform 或 collaboration truth；
- 为高影响且难以撤销的取舍建立必要 ADR；
- 建立权限感知知识检索、Ontology 查询及 Agent/Skill/Tool 的黑盒 contract；
- stable design 合并并经 Human 激活后，再由 DO/CO 规划实现。

候选文件和内容范围必须在未来 Proposal Preview 中明确；本节不构成写入授权。

## Validation and rollback

本 Workspace checkpoint 应满足：

- cumulative diff 只修改本 Workspace；
- UTF-8、Markdown 相对链接和 `git diff --check` 通过；
- 所有 truth reference 在 latest `origin/main` 可重开；
- 当前设计与 canonical truth 的一致项和开放项明确区分；
- 不产生 canonical truth、产品代码、Proposal、UD、delivery、PR、RV 或 CI 变化；
- checkpoint push 只更新现有同名远端设计分支。

若本 checkpoint 内容需要撤回，使用新的 revert commit 恢复前一 checkpoint；不重写已推送历史，不影响 canonical `main`，也不删除 Workspace、分支、worktree 或 locator。设计级 rollback、迁移和兼容方案将在未来 Proposal Preview 中按 exact canonical changes 单独定义。

## Next discussion point

用三个 OES 真实场景反推并冻结一级能力地图：

1. 客服基于历史投诉、制度和当前客户事实生成有引用的可靠答复；
2. 从客户投诉追溯瑕疵批次、质检、供应商、责任团队和近期决策；
3. 智能助手在 HUMAN subject、专业 Agent、ToolContract 和业务 owner 的共同约束下完成查询、草拟和受控执行。

下一轮只确认 Knowledge、Ontology、Analytics、Agent、Skill、Tool 的一句话职责、输入输出和协作关系；暂不进入数据库、schema、模型、Agent 框架或供应商选型。
