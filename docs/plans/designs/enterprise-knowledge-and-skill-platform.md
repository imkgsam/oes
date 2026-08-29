# 企业知识与 AI 能力平台

```text
status: DESIGNING
designKey: enterprise-knowledge-and-skill-platform
truthBaseline: 1ab29c551017dd4772206918d08e2374eca85182
```

## Objective

为 OES 设计一个能够长期演进的企业知识与 AI 能力平台。它应把业务实时事实、企业知识、业务语义、专业 Agent、受控 Tool 和可治理 Skill 组合成可复用能力，支撑智能客服、智能助手及后续业务场景，同时不形成第二业务真相或拥有全局权限的超级 Agent。

本 Workspace 保存当前尚未冻结的设计。它不构成稳定架构真相，也不启动实现。

## Scope

- AI 产品组合、主流业务场景及其共用能力；
- Knowledge、Ontology、Analytics 的边界和协同；
- 专业 Agent、Router、Orchestrator、Skill、ToolContract 的关系；
- Multi-Agent 的身份、权限、委派、上下文与结果汇总边界；
- 企业知识和可复用 Skill 的采集、治理、评测、发布、监控及回滚；
- 外部客户、内部员工和机器 Agent 的身份与资源访问边界；
- 权限感知检索、引用溯源、生命周期、安全与审计原则；
- 能力建设顺序、依赖、阶段验收指标和退出条件；
- 未来需要写入 architecture、ADR、contract 和 Feature Packet 的稳定结论。

当前不包含：服务数量和部署拓扑、proto/schema、具体模型或基础设施供应商、Agent 框架选型、模型蒸馏、代码实现、Feature Packet 或 delivery 活动。

## Current truth baseline

当前设计必须服从以下已冻结真相：

- [AI Platform Architecture](../../architecture/platforms/ai-platform.md) 已定义统一 Model、Knowledge、Tool Governance、Orchestration 和 Scenario 逻辑层；Task Assistant 是首个验证场景。
- AI 不拥有业务主数据，不直接访问或写入业务数据库；实时业务事实只能通过业务 owner 的公开能力读取或变更。
- `AgentPrincipal` 引用 Identity 持有的机器主体；`AgentProfile` 只定义运行边界，不能授予或扩大权限。
- 有效 AI 操作权限是 HUMAN、AgentPrincipal、DelegationGrant、AgentProfile、ToolContract、tenant/org、目标服务 policy 和业务规则的严格交集。
- `KnowledgeScope` 只能收窄范围；知识 owner 必须在检索时执行真实授权。
- 企业知识需保留来源、版本、tenant/org 和可见性；搜索、图和向量投影是可重建的 derived index，不是业务真相。
- AI 状态变化只能通过版本化 `ToolContract`、业务应用服务、鉴权、适用的确认和审计链完成。
- [Task Assistant Collaboration](../../architecture/collaborations/task-assistant.md) 已冻结人在回路的首个场景边界。
- [Delegated Execution and ActionGrant](../../architecture/collaborations/delegated-execution-and-action-grant.md) 已冻结受控执行和高风险确认边界。
- 当前 canonical AI Platform 明确未冻结长期记忆、多 Agent、无人值守自动化和具体技术产品。

后续设计还必须持续复核身份、授权、资源策略、Asset、事件总线、审计、搜索及相关业务 owner 的最新稳定真相，避免由本 Workspace 重复定义。

## Current proposed design

### 1. 总体逻辑

OES AI 不按“一个场景建设一个 AI 系统”，也不建设“向量数据库加聊天框”。建议形成五个长期协同边界：

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

各层含义：

1. **AI 产品与业务体验**：面向客户或员工交付智能客服、智能助手、研究分析、文档智能、质量追溯等可验收产品，不把聊天作为唯一入口。
2. **专业 Agent 与编排**：按业务责任和权限边界组合 Profile、Principal、KnowledgeScope、Skill 与 Tool；Router 只选择合适能力，Orchestrator 只协调有界步骤。
3. **Knowledge、Ontology 与 Analytics**：Knowledge 提供有来源的内容证据；Ontology 提供业务对象、术语和关系语义；Analytics 通过 owner query 或授权投影完成聚合、指标与探索。
4. **Skill 与 Tool 治理**：Skill 描述可复用的目标、适用条件、步骤、知识、工具、检查点和评测；ToolContract 是进入业务 owner 能力的受控执行入口。Skill 不能创造权限或绕过 ToolContract。
5. **模型与运行基础**：统一模型、embedding、reranker 的路由、回退、成本、延迟、缓存和观测，保持供应商可替换。

### 2. 产品与共用能力

智能客服和智能助手是已确认方向，但不是产品全集。候选产品应从可验证的业务结果出发，并复用以下共用能力：

- 事实获取：从 owner service 查询最新业务对象和状态；
- 知识检索：从有来源、有权限和有生命周期的内容中取得证据；
- 语义探索：借助 Ontology 连接客户、订单、项目、投诉、批次、会议、人员等对象；
- 分析与报告：聚合事实和证据，明确区分事实、知识内容和模型推断；
- 内容生成：产生回复、摘要、方案、报告或待确认业务草稿；
- 文档理解：统一处理文件、OCR、表格、图片、音频和视频内容；
- 受控执行：通过 ToolContract 请求业务状态变化；
- 知识与 Skill 沉淀：把经过审核的案例、SOP、Playbook 和成功方法转为可复用资产。

### 3. Ontology 的定位

Ontology 应提前设计，因为它直接支撑跨业务对象分析、报告和根因探索，例如从客户投诉追溯产品、订单、批次、质检、供应商、责任团队和相关决策。

当前建议把它视为“企业业务语义与关系能力”，而不是集中复制所有业务数据的知识图谱：

- 业务 owner 继续拥有对象事实和状态；
- Ontology 管理统一术语、实体类型、关系类型和可解释路径；
- 关系投影由 owner facts/event 构建并可重建；
- 每次查询继续执行 tenant/org/resource policy，禁止通过关系边推导未授权对象；
- 图推理结果必须带来源和时间边界，不能被当成 owner truth。

### 4. 专业 Agent 与 Multi-Agent

从架构初期支持多个专业 `AgentProfile` 和必要的独立 `AgentPrincipal`，但区分两类能力：

- **现在需要的基础**：专业职责、独立权限上限、明确 KnowledgeScope、受控 Tool、结果证据和统一 AgentRun；
- **按证据开放的高级能力**：自主规划、动态委派、Agent 间协商、长链路自治和无人值守执行。

Router 或协调 Agent 不自动获得所有专业 Agent 权限。每个子执行必须建立自己的受信上下文和权限交集；协调层只接收允许披露的结构化结果、证据与失败状态。

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

员工能力不应直接“复制员工”。优先沉淀可解释、可审核的工作方法：适用条件、输入、决策点、步骤、使用的知识与工具、检查项、成功标准、失败模式和实例。自然语言可用于起草，但正式 Skill 必须形成结构化、版本化并可评测的受治理定义。

模型参数级蒸馏不在当前范围。未来只有出现明确规模、成本、延迟或专用模型收益证据时再单独评估。

### 6. 贯穿式治理原则

- 事实、企业知识、用户偏好、Agent memory 和模型推断必须分类并分别治理；
- document/section/chunk 级权限不能只靠生成后的过滤，检索候选生成前必须执行授权约束；
- 引用必须能回到来源版本、证据片段、访问时间和适用权限；
- 删除、撤权、过期和密级变化必须传播到全文、向量、图和缓存投影；
- ingestion 和检索链必须抵御 prompt injection、知识污染、秘密泄露和供应链风险；
- 所有 AI 调用显式携带 tenant、适用 org、operator、trace 和 audit context；
- 评测同时覆盖业务结果、检索质量、引用正确性、越权率、工具错误、时延、成本和知识新鲜度。

## Human-confirmed items pending UD review

以下方向已由 Human 在本 Workspace 启动 Preview 中确认，但尚未经过 UD 审核或写入 canonical truth：

1. 智能客服和智能助手是确认方向，但不限制未来 AI 产品范围。
2. AI 产品复用事实获取、知识检索、分析探索、内容生成、文档理解、受控执行和沉淀能力。
3. AI 深度结合业务对象，实时事实继续由 owner service 持有。
4. Ontology 提前设计，用于业务语义、跨域追溯、分析探索和报告。
5. 初期支持多个专业 Agent/Profile 与独立权限边界，高级自治按证据逐步开放。
6. Agent 由 Profile、Principal、KnowledgeScope、Skill、ToolContract 和 AgentRun 组合，不形成超级 Agent。
7. 客服/质量闭环和业务员成功开发客户案例作为业务历史沉淀的重点样板。
8. OCR 和多模态理解属于共享能力，不单独作为 AI 产品方向。
9. 模型蒸馏不进入当前目标范围。
10. 权限、引用、评测、审计、确认、版本、Canary 和回滚贯穿全部能力。

## Open questions

1. 统一知识能力由哪个平台边界拥有，如何定义文档、章节和片段级 ACL、版本、有效期与删除传播？
2. OES Ontology 应由语义目录、关系目录、关系投影和分析指标中的哪些部分组成，各自 owner 是谁？
3. Ontology 查询怎样继承 owner service 的 tenant/org/resource policy，避免权限并集和关系泄露？
4. 专业 Agent 如何划分 AgentPrincipal，Router/Orchestrator 怎样在不获得超级权限的情况下汇总结果？
5. Skill 的正式表达、owner、版本兼容、审核、评测、发布、回滚和弃用如何定义？
6. 外部智能客服的匿名客户、登录客户、经销商和客服员工分别使用什么身份与知识/工具范围？
7. Ontology、Analytics 和 Knowledge 在报告、根因分析与探索式查询中的职责如何区分？
8. 除智能客服和智能助手外，哪些产品方向进入正式路线，哪些只保留扩展点？

## Known conflicts

- 当前提议要求提前建立 Multi-Agent 的身份和权限基础，而 canonical AI Platform 仍将多 Agent 列为未冻结项；后续必须通过 Proposal 明确增量，不能在 Workspace 中覆盖现有真相。
- Ontology 尚无稳定 owner、contract 或授权查询边界；在这些内容冻结前，不应形成跨域业务真相副本。
- Skill 目前是待设计概念；它与 `AgentProfile`、`ToolContract`、SOP、Playbook 和模型 prompt 的边界尚未冻结。
- 最新身份、授权和可信执行设计已经前进，后续所有 Agent/Multi-Agent 方案必须基于最新 Machine Principal、delegation 和 resource policy 真相复核。
- 当前不做模型蒸馏，但保留知识、案例、轨迹和评测数据的治理需求；两者不能混为同一交付范围。

## Intended truth-source changes

设计成熟后再通过新的 Proposal Preview 确定 exact files。当前候选为：

- 修订 [AI Platform Architecture](../../architecture/platforms/ai-platform.md)；
- 新增或拆分企业知识、Ontology、Skill/Multi-Agent 相关 platform 或 collaboration truth；
- 为高影响取舍建立必要 ADR；
- 建立权限感知知识检索、Ontology 查询、Agent/Skill/Tool 的黑盒 contract；
- stable design 合并后再派生相应 Feature Packet。

本列表不是 canonical 写入授权。

## Next discussion point

下次恢复时，先冻结“产品—通用能力—平台边界”的一级能力地图，并逐一确认 Knowledge、Ontology、Analytics、Agent、Skill、Tool 的一句话职责和相互关系；暂不进入数据库、schema、具体框架或供应商选型。
