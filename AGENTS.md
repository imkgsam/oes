# OES 全局协作与架构执行约束

## 1. 文档目的

本文件用于约束 OES 项目中所有人工开发者与 Codex 线程的协作方式、架构边界与变更纪律。

OES 是一个面向企业经营、制造、供应链与智能协同场景的企业级 monorepo，目标不是堆叠多个系统模块，而是在统一架构下整合 ERP、MES、WMS、CRM、SRM、CMS、BI、APS、Ecom、IM、Email 自动化与 AI 增强能力。

本文件是项目级协作基线，不替代详细架构文档；若与 `docs/architecture`、`docs/adr` 中更明确的设计发生冲突，以后者为准。

## 2. 核心原则

- 边界优先于实现。
- 先设计边界，再做跨模块编码。
- 优先保证 bounded context 清晰，而不是追求表面复用。
- 微服务拆分必须节制，先粗粒度，再按证据拆分。
- AI 是平台增强能力，不是绕过业务规则的捷径。
- 共享库只承载基础设施能力，不承载业务语义归属。
- 所有重要变更都必须保持可审计、可追踪、可治理。

## 3. 全局架构约束

- 禁止跨服务共享数据库。
- 禁止在 controller、gateway、DTO、Prisma schema 中编写核心业务规则。
- 禁止让 `src/common` 演变为跨域业务逻辑堆放区。
- 禁止通过直接引用他域内部类型形成隐式契约。
- 跨上下文协作必须通过显式机制完成：
  - 内部同步调用走 gRPC 契约。
  - 跨域事实传播走事件总线。
  - 语义不一致时必须建立防腐层。

## 4. 服务内部标准结构

除非有 ADR 明确说明例外，每个服务应优先采用以下结构：

- `application/`
- `domain/`
- `infrastructure/`
- `interfaces/`
- `modules/`

分层职责约束：

- `domain` 定义聚合、实体、值对象、领域服务、仓储抽象。
- `application` 负责用例编排、命令与查询处理。
- `infrastructure` 实现仓储、持久化、外部适配器。
- `interfaces` 只做协议映射与入出参转换。
- `modules` 负责能力装配与依赖注入。

依赖方向约束：

- `interfaces -> application -> domain`
- `infrastructure -> domain`
- `modules` 装配 `interfaces/application/infrastructure`
- `domain` 不依赖 `NestJS`、`Prisma`、`gRPC`

## 5. DDD 与 CQRS 约束

- 命令用于状态变更。
- 查询用于读取模型。
- 不是所有简单功能都必须强行复杂化为重型 CQRS。
- 写路径复杂、审计要求高、跨模块影响大的场景，应显式使用 command handler。
- 查询模型可以独立优化，但不得破坏领域边界。

## 6. 通信与集成约束

外部入口：

- 外部客户端统一通过 API Gateway / BFF 进入。

内部同步：

- 内部服务间强契约同步调用统一走 gRPC。

内部异步：

- 跨上下文状态扩散、通知、索引、BI、AI 后处理走事件总线。

明确禁止：

- 服务之间直接查对方数据库。
- 通过复制对方内部数据结构形成事实上的耦合。

## 7. 多租户、安全与身份平台约束

所有面向业务与 AI 的调用链，都必须显式携带以下上下文：

- `tenantId`
- `orgId`，如果场景适用
- `operator context`
- `trace context`
- 审计元数据

系统职责划分基线：

- `auth-service`：认证、会话、令牌
- `identity-service`：账号、身份映射
- `permission-service`：角色、范围、策略、授权判定
- `party-service`：现实世界主体抽象与租户主体引用
- 租户/组织能力：隔离边界与组织结构

## 8. AI 使用约束

- AI 不拥有业务主数据真相。
- AI 不得直接写入业务核心表。
- AI 只能通过受控工具、应用服务、审批流程与知识检索访问业务能力。
- 任何会改变业务状态的 AI 输出必须：
  - 可审计
  - 可追踪
  - 可鉴权
  - 可回放关键决策过程

每个 AI 场景必须明确：

- 谁在触发
- 可访问哪些数据
- 可调用哪些工具
- 是否需要人工确认
- 如何记录审计
- 如何控制成本

## 9. 文档规则

项目级架构主文档位于：

- `docs/architecture/`
- `docs/adr/`
- `docs/plans/`
- `docs/contracts/`
- `docs/governance/`

文档职责：

- `index.md`：导航，不承载大段设计正文
- architecture 文档：稳定设计
- ADR：关键架构决策与取舍
- plans：阶段实施路径
- contracts：黑盒接口契约
- governance：协作流程、线程边界与变更纪律

补充文档约束：

- `docs/architecture/services/*.md`：单个服务职责真相
- `docs/architecture/collaborations/*.md`：跨服务协同真相
- `docs/plans/designs/*.md`：长周期设计过程工作台，只在大服务、长设计、多轮切换或尚不能直接进入 feature packet 时使用；只记录未冻结设计过程、开放问题、决策日志与回写目标，不替代稳定真相源

### 9.1 服务真相源唯一性

每个服务只能有一个稳定设计真相源文件：

- 位置固定为 `docs/architecture/services/<service-name>.md`
- 该文件负责定义服务长期边界、核心对象、对象命名、拥有与不拥有的真相、主要协同引用
- 其他 architecture、collaboration、plan、feature packet、design workspace、contract 或实现文档只能引用该服务真相源，不得重新定义该服务的核心对象、边界或命名
- 若其他文档需要描述“如何使用某服务能力”，必须写成引用关系，例如“以 `docs/architecture/services/<service-name>.md` 为准”
- 若发现其他文档与服务真相源冲突，默认以服务真相源为准，并应清理冲突文档或改成引用
- 若服务设计需要变更，必须先更新对应服务真相源；涉及跨服务协同或关键架构取舍时，再同步更新 collaboration 或 ADR
- design workspace 只能记录未冻结讨论、开放问题与回写目标；结论一旦冻结，必须回写到服务真相源，不能长期滞留为第二份设计

旧的根目录 `doc/` 不再作为项目级设计入口；新的项目级设计、治理与契约必须沉淀到 `docs/`。

## 10. 编码与语言规范

为避免多线程协作时出现乱码、编码噪音、错误转码与不可读 diff，项目统一采用以下强制规则：

- 所有新增与修改的文档、代码、配置文件统一使用 `UTF-8` 编码。
- 禁止新增 `GBK`、`ANSI`、系统默认编码文件。
- 文档正文允许使用中文。
- 代码标识符、目录名、文件名、proto 字段名、事件名、权限码统一使用英文。
- 如发现历史文档出现乱码，不得在乱码状态下直接续写或整篇重写，应先标记为编码问题并安排转码修复。
- 线程在读取旧文档时，如怀疑存在编码异常，必须明确说明“该文档可能存在编码问题，不能直接把乱码内容当作稳定设计依据”。
- 不得因为本地终端显示异常而擅自重写整份文档，避免把可恢复内容写坏。
- PowerShell、编辑器、格式化工具与后续自动化流程都应以 UTF-8 为默认编码前提。

### 10.1 代码总结性注释规则

为降低多线程协作时的理解成本，所有新增或重写的代码单元都应补一条总结性注释，用一句话直接说明该代码块整体负责什么。

适用对象包括但不限于：

- `class`
- `function`
- `interceptor`
- `guard`
- `service`
- `handler`
- `repository`

约束如下：

- 注释应概括“整体职责”，而不是逐行解释实现细节。
- 不要求对每一行代码写注释。
- 如果代码块本身已经有同等清晰、准确的总结性注释，可保留并继续遵循，不必重复堆叠。
- 注释应帮助后来人快速判断“这段代码是做什么的”，而不是写成无信息量的废话。

## 11. 哪些内容必须先设计后编码

下列内容属于必须先设计后编码：

- bounded context 划分
- 新服务建立
- gRPC/proto 契约
- 领域事件模型
- 租户隔离模型
- 权限模型
- scope / policy 模型
- `src/common` 公共抽象
- AI 工具协议
- operator context 传播
- 审计模型

## 12. Codex 线程协作规则

每个 Codex 线程必须只拥有一个清晰职责范围，例如：

- 一个服务
- 一组架构文档
- 一个 ADR
- 一个跨服务契约
- 一个平台能力

如果线程承担的是“持续设计而非立即实现”，也必须只对应一个清晰设计主题，例如：

- 一个新服务
- 一个跨服务协同能力
- 一个待冻结的 feature design

禁止一个设计线程同时长期承载多个无直接关系的服务设计、feature 设计与协同议题，避免上下文污染。

线程不得单独决定以下内容：

- 公共契约变更
- 事件模型变更
- 权限语义变更
- 租户模型变更
- `src/common` 对外 API 变更
- AI 工具接口变更
- operator context 结构变更

一旦涉及上述事项，必须先更新 architecture 文档或新增 ADR，再进入实现。

### 12.1 设计线程与设计工作台纪律

当任务属于长周期设计、需要多轮讨论、可能中途切换上下文，或尚未形成稳定真相且暂时不能直接转成 `feature packet` 时，必须建立对应的 design workspace：

- 位置：`docs/plans/designs/<design-key>.md`
- 一个 design workspace 只服务一个设计主题
- 一个设计线程默认只维护一个 design workspace

如果一个设计已经足够清晰、范围可控、可以直接转成执行主线，则默认直接进入 `docs/plans/features/<feature-key>.md`，不要求为了形式额外建立 design workspace。

design workspace 的职责是：

- 记录当前设计目标与范围
- 记录本轮涉及的服务 / feature / 协同议题
- 记录已确认决定与尚未冻结的开放问题
- 记录未来要回写到哪些真相源
- 提供线程切换后的恢复入口

design workspace 明确不负责：

- 替代 `docs/architecture/services/*.md` 记录服务职责真相
- 替代 `docs/architecture/collaborations/*.md` 记录协同真相
- 替代 `docs/contracts/**` 记录契约正文
- 替代 `docs/plans/features/*.md` 记录 feature 执行状态
- 替代任意服务的唯一稳定设计真相源；每个服务的稳定设计只能回写到 `docs/architecture/services/<service-name>.md`

设计线程的执行要求：

- 讨论态必须与文档沉淀态严格区分；当用户明确表示“还在讨论”“先聊想法”“不要更新文档”或语义等价表达时，线程只能进行分析、澄清、方案比较与风险提示，不得创建、修改或回写任何设计文档、契约文档、ADR、plan、backlog 或 design workspace。
- 只有在用户明确要求记录、创建文档、更新文档、形成 feature packet，或某项结论已被明确冻结并需要沉淀时，线程才可以进入文档写入动作。
- 若讨论中发现可能需要沉淀的设计结论，线程应先标记为“待确认结论”并向用户确认写入目标，而不是自行更新稳定真相源。
- 已冻结结论必须尽快回写到唯一真相源，而不是长期滞留在 workspace
- 若讨论主题已变为另一个无直接关系的服务、协同能力或 feature，必须新建 workspace，而不是继续混写
- 线程切换时应优先通过 workspace 恢复上下文，而不是重新从多个历史文档中手工拼接

### 12.2 根因优先与实现质量纪律

所有 Codex 线程在修复缺陷或推进功能时，必须遵守以下执行顺序：

- 先复现或定位问题现象，明确受影响的代码路径、运行路径、数据路径或契约路径。
- 再分析根本原因，区分直接症状、触发条件、真实设计缺口与运行环境因素。
- 再提出解决方案，说明为什么该方案是边界清晰、长期可维护且符合项目架构约束的方案。
- 最后再进入代码实现，不允许跳过根因分析直接堆改动。

明确禁止：

- 禁止为了让当前场景短期能跑而写临时补丁式代码。
- 禁止用兜底、硬编码、特殊判断掩盖真实架构或契约问题。
- 禁止在未确认根因时反复试错式修改多个无关文件。
- 禁止交付“现在勉强可用、后期需要推倒重来”的实现。

实现质量要求：

- 优先用最少、最聚焦的改动解决真实问题。
- 优先采用成熟、优雅、可测试、符合最佳实践的实现。
- 优先修正错误的边界、契约、映射或抽象，而不是在调用方层层兜底。
- 如果发现既有设计不合理，应暂停并说明问题，必要时升级到 architecture / ADR / integration 流程，而不是私自绕过。
- 如因生产或联调阻塞必须先做临时止血方案，必须明确标记为临时方案、说明移除条件，并同步记录后续正式修复任务。

### 12.3 Global Command 与 Command Hub 协作纪律

OES 使用 Global Command Thread 与 Codex Command Hub 管理多线程并行协作。详细规则以 `docs/governance/codex-global-command-model.md` 与 `docs/governance/codex-command-hub.md` 为准。

Global Command Thread 只负责项目级规划、任务调度、依赖编排、优先级调整、ownership 冲突协调与 handoff 收口。Global Command Thread 明确禁止做服务级设计、功能级设计讨论、契约字段定义、领域对象定义、数据库 schema 设计、代码实现或具体 debug。

新功能 intake 只能由 Global Command 产出项目级分类信息，包括候选能力域、候选 owner group、疑似依赖、所需 design thread、优先级与冲突风险。最终服务归属、领域模型、workflow、API、event、proto 或 schema 必须交由对应 design thread，在唯一真相源规则下完成。

任何正式 Codex thread 启动时，必须优先通过 Command Hub 恢复身份与任务边界：

- 已有 task 时运行 `node scripts/oes-hub.mjs sync --task <task-id>`
- 已有 thread 时运行 `node scripts/oes-hub.mjs sync --thread <thread-id>`
- 修改任何文件前必须先通过 Hub claim 写路径
- 遇到 ownership 拒绝、跨服务依赖、受保护文件需求或无法继续推进时，必须提交 blocker，不得绕过 Hub 继续修改
- 任务执行中应在关键阶段提交 checkpoint；完成、失败或阻塞时必须提交 handoff / failure / blocker

共享计划文件采用单写者规则。`docs/plans/oes-global-roadmap.md`、`docs/plans/oes-thread-control-board.md`、`docs/plans/oes-capability-dependency-map.md` 只能由 Global Command Thread 写入。其他 thread 只能通过 Hub 或结构化 handoff 回报给 owner。

## 13. 交付输出要求

每次完成一个任务片段后，应明确说明：

- 本次范围
- 修改了哪些文件
- 行为影响
- 契约或数据影响
- 做了哪些验证
- 仍存在哪些风险
- 建议的下一步是什么

如果任务包含缺陷修复，还必须额外说明：

- 问题现象
- 根本原因
- 采用的正式修复方案
- 为什么不是临时补丁
- 如何验证该根因已被修复

## 14. 默认决策倾向

如遇不确定情况，默认遵循以下倾向：

- 优先边界清晰
- 优先少量服务
- 优先稳定契约
- 优先事件解耦
- 优先 AI 辅助而不是 AI 自治
- 只要属于跨模块问题，优先治理而不是图快
