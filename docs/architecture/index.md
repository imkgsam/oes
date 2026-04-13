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
8. `07-permission-code-source.md`
9. `08-notification-architecture.md`
10. `09-role-based-permission-resolution.md`
11. `10-communication-and-mailbox-architecture.md`
12. `11-gateway-and-bff-architecture.md`
13. `12-observability-and-audit-architecture.md`
14. `13-response-and-exception-architecture.md`
15. `14-grpc-metadata-and-service-trust-architecture.md`
16. `15-authorization-layering-and-resource-policy-architecture.md`
17. `16-unified-web-account-context-architecture.md`

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
- `07-permission-code-source.md`
  - 定义统一权限码语义源、代码引用方式与数据库同步边界
- `08-notification-architecture.md`
  - 定义通知平台边界、渠道模型、provider 抽象、与 `auth-service` 的协作方式和实施原则
- `09-role-based-permission-resolution.md`
  - 定义 operator context 的角色传播语义，以及子服务通过 `permission-service` 解析权限的共享方案
- `10-communication-and-mailbox-architecture.md`
  - 定义共享邮箱、外部通信线程、责任制、SLA、业务关联、全量持久化与 AI 辅助的项目级边界
- `11-gateway-and-bff-architecture.md`
  - 定义 APISIX 与 Gateway / BFF 的职责边界、contract 分离原则、与 IAM 子服务的协作模型，以及 Gateway 的阶段目标
- `12-observability-and-audit-architecture.md`
  - 定义指标、日志、追踪、审计四类信号的职责边界、推荐技术选型、治理规则与分阶段落地方式
- `13-response-and-exception-architecture.md`
  - 定义 HTTP 与 gRPC 的统一返回模型、异常分类标准、多层调用异常传播规则、第三方 provider 异常包装方式，以及权限判定链路的 fail-closed 策略
- `14-grpc-metadata-and-service-trust-architecture.md`
  - 定义内部 gRPC metadata 的多跳传播规则、signed `operator_context` 的目标结构与逐跳策略、部署层 mTLS 的职责边界，以及历史老旧设计的废弃方向
- `15-authorization-layering-and-resource-policy-architecture.md`
  - 定义粗粒度 `RBAC`、单资源 `checkResource`、列表 `buildQueryScope`、policy 分类、业务规则边界与跨服务派生协作授权规则
- `16-unified-web-account-context-architecture.md`
  - 定义统一 Web Shell、scope-aware `UserAccount`、系统账号与租户账号、登录上下文选择、上下文切换、token 与菜单权限协作模型

## 4. 配套目录

- `docs/adr/`
  - 用于记录关键架构决策与取舍
- `docs/plans/`
  - 用于记录分阶段实施计划与执行拆分
- `docs/contracts/`
  - 用于记录黑盒接口契约、调用语义与前后端 / 服务间对接边界
- `docs/governance/`
  - 用于记录多线程协作、变更边界与执行流程

## 5. 使用规则

- 若实现与本目录下架构文档不一致，应以架构文档为目标状态进行对齐，除非有更新的 ADR 明确覆盖。
- 本目录下文档承载项目级稳定设计，不承载零散实施步骤。
- 项目级设计应优先沉淀到本目录，而不是继续扩散到多个历史文档中。

## 6. 配套计划文档

- `docs/plans/index.md`
  - 计划文档索引
- `docs/plans/frontend-planning-summary.md`
  - 前端高层结论与阅读导航
- `docs/plans/tenant-web-frontend-architecture.md`
  - `tenant-web` 前端工程架构主文档
- `docs/plans/tenant-web-information-architecture.md`
  - `tenant-web` 产品级信息架构主文档
- `docs/plans/tenant-web-code-refactor-checklist.md`
  - `tenant-web` 当前执行状态与验证结果
- `docs/plans/tenant-web-vben-implementation-plan.md`
  - `tenant-web` 底座适配与本地化专项说明
- `docs/plans/authorization-layering-implementation-plan.md`
  - 授权分层与资源策略实施计划
- `docs/plans/ai-platform-foundation-plan.md`
  - AI 平台基础能力实施计划
- `docs/plans/notification-service-foundation-plan.md`
  - Notification Service 平台基础实施计划
- `docs/plans/communication-mailbox-foundation-plan.md`
  - Communication And Mailbox 平台基础实施计划
- `docs/plans/notification-service-contract-draft.md`
  - Notification Service 第一版契约草案
- `docs/plans/communication-service-contract-draft.md`
  - Communication Service 第一版契约草案
