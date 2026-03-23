# OES 架构文档索引

## 1. 目的

本目录用于沉淀 OES 项目的项目级架构主文档，作为后续所有开发线程、设计决策与实现分工的统一依据。

这些文档回答的是：

- OES 要建设成什么样的系统
- 系统边界如何划分
- 领域边界如何定义
- 技术架构如何落地
- AI 如何以平台能力方式接入
- 多线程开发时如何保持一致性

## 2. 推荐阅读顺序

1. `00-vision-and-scope.md`
2. `01-system-context.md`
3. `02-bounded-contexts.md`
4. `03-technical-architecture.md`
5. `04-ai-architecture.md`
6. `05-governance.md`
7. `06-roadmap.md`

## 3. 文档职责

- `00-vision-and-scope.md`
  - 定义项目定位、核心目标、技术目标、AI 目标与非功能目标
- `01-system-context.md`
  - 定义 OES 所处的系统上下文、外部参与方、系统边界
- `02-bounded-contexts.md`
  - 定义领域划分、上下文职责、关系与服务化建议
- `03-technical-architecture.md`
  - 定义 monorepo、微服务、通信、一致性、多租户与横向平台能力
- `04-ai-architecture.md`
  - 定义 AI 作为平台增强能力的接入方式、分层与治理
- `05-governance.md`
  - 定义设计原则、命名规范、文档规则、协作规则与变更纪律
- `06-roadmap.md`
  - 定义阶段路线图、前置条件、依赖关系与交付物

## 4. 配套目录

- `docs/adr/`
  - 用于记录关键架构决策与取舍
- `docs/plans/`
  - 用于记录分阶段实施计划与执行拆分

## 5. 使用规则

- 若实现与本目录下架构文档不一致，应以架构文档为目标状态进行对齐，除非有更新的 ADR 明确覆盖。
- 本目录下文档承载项目级稳定设计，不承载零散实施步骤。
- 项目级设计应优先沉淀到本目录，而不是继续扩散到多个历史文档中。
