# OES 治理文档索引

## 1. 目的

本目录用于沉淀 OES 项目的协作规则、文档规则、线程规则与执行纪律。

这里回答的是：

- 文档应该如何归位
- thread 应该如何拆分与协同
- 哪些路径和边界受保护
- feature 应该如何形成可执行协作面板

本目录不承载 feature 设计正文，也不承载实施状态本身。

## 2. 当前治理文档

1. [docs-architecture.md](/Users/acehood/Documents/GitHub/oes/docs/governance/docs-architecture.md)
   - 文档架构规范与单一真相源规则，包括服务职责卡与协同蓝图落点
2. [codex-workflow.md](/Users/acehood/Documents/GitHub/oes/docs/governance/codex-workflow.md)
   - Codex 标准工作流与执行步骤
3. [codex-feature-threading.md](/Users/acehood/Documents/GitHub/oes/docs/governance/codex-feature-threading.md)
   - feature packet、thread 生命周期与协作方式
4. [codex-threading-rules.md](/Users/acehood/Documents/GitHub/oes/docs/governance/codex-threading-rules.md)
   - 线程分类、路径 ownership 与受保护文件规则
5. [change-boundary-rules.md](/Users/acehood/Documents/GitHub/oes/docs/governance/change-boundary-rules.md)
   - 变更级别判断与升级流程
6. [codex-prompt-templates.md](/Users/acehood/Documents/GitHub/oes/docs/governance/codex-prompt-templates.md)
   - 常用线程 prompt 模板
7. [execution-complexity.md](/Users/acehood/Documents/GitHub/oes/docs/governance/execution-complexity.md)
   - feature 执行复杂度评估与协作模式选择
8. [docs-optimization-closure.md](/Users/acehood/Documents/GitHub/oes/docs/governance/docs-optimization-closure.md)
   - 本轮文档优化主线的收尾结论与后续准入规则
9. [docs-optimization-status.md](/Users/acehood/Documents/GitHub/oes/docs/governance/docs-optimization-status.md)
   - 当前已完成项与剩余少量维护项速览
10. [tricky-bug-knowledge-base.md](/Users/acehood/Documents/GitHub/oes/docs/governance/tricky-bug-knowledge-base.md)
   - 跨线程可复用的疑难 bug 根因总结与防复发规则

## 3. 推荐阅读顺序

1. [docs-architecture.md](/Users/acehood/Documents/GitHub/oes/docs/governance/docs-architecture.md)
2. [codex-feature-threading.md](/Users/acehood/Documents/GitHub/oes/docs/governance/codex-feature-threading.md)
3. [codex-workflow.md](/Users/acehood/Documents/GitHub/oes/docs/governance/codex-workflow.md)
4. [codex-threading-rules.md](/Users/acehood/Documents/GitHub/oes/docs/governance/codex-threading-rules.md)
5. [change-boundary-rules.md](/Users/acehood/Documents/GitHub/oes/docs/governance/change-boundary-rules.md)
6. [tricky-bug-knowledge-base.md](/Users/acehood/Documents/GitHub/oes/docs/governance/tricky-bug-knowledge-base.md)

## 4. 使用规则

- 治理文档只回答“怎么协作、怎么执行、怎么归位”，不替代稳定架构与黑盒契约。
- 如果治理规则与更上层项目约束冲突，以 `AGENTS.md`、`docs/architecture/` 与 ADR 为准。
- 新增治理规则时，应优先更新本目录现有文档，而不是平行新增重复规则文件。
- 已完成根因分析、且具跨线程复用价值的疑难 bug，应优先归档到 `tricky-bug-knowledge-base.md`，而不是散落在多个 thread 回复或单个服务收尾记录里。
