# OES 总体技术架构

> 涉及 permission-service 的服务职责、核心对象或 owner 边界时，以 [permission-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/permission-service.md) 为准；本文只描述项目级技术架构。

## 1. 总体风格

OES 采用：

- monorepo 工程组织
- DDD 导向的服务内部结构
- 节制拆分的微服务架构
- gRPC 作为内部同步契约
- Event Bus 作为跨上下文异步传播机制
- CQRS 用于复杂写路径与读写解耦

这个技术风格的核心目标不是“技术栈新”，而是让大型企业系统在多线程并行开发时仍能保持结构可控。

## 2. monorepo 结构建议

建议保持并强化当前结构：

- `src/common`
- `src/services/system`
- `src/services/business`
- `src/services/auxiliary`
- `docs/architecture`
- `docs/adr`
- `docs/plans`

### 2.1 `src/common` 的定位

`src/common` 用于承载：

- 通用基础设施能力
- 公共传输能力
- 公共契约工具
- 认证、日志、追踪、注册发现等横向支撑
- 不含业务语义的基础值对象，例如仅做互联网域名格式规范化的 `InternetDomain`

明确限制：

- 不承载业务域规则
- 不承载跨上下文业务语义
- 不成为“复用方便就往里放”的超级库
- `InternetDomain` 只能表达 URL / hostname 到 canonical host 的格式规范化，不得表达 CRM 查重、Party 识别、客户归属或数据合并规则

### 2.2 `src/services/system` 的定位

用于承载平台级系统服务，例如：

- API Gateway
- Auth
- Identity
- Permission
- Entity
- Tenant / Org

### 2.3 `src/services/business` 的定位

用于承载业务领域服务，例如：

- CRM
- SRM
- ERP
- MES
- WMS
- APS

### 2.4 `src/services/auxiliary` 的定位

用于承载协同与辅助能力，例如：

- IM
- Email
- Notification
- Integration

## 3. NestJS + CQRS + DDD 的落地方式

### 3.1 服务内部结构

每个服务优先采用以下结构：

- `domain`
- `application`
- `infrastructure`
- `interfaces`
- `modules`

原因：

- 保证领域模型不被框架与 ORM 污染
- 保证用例编排与协议映射分离
- 保证持久化方案可演进

### 3.2 CQRS 使用原则

OES 不追求形式上的“全量 CQRS”，而采用“有收益才使用”的原则：

- 状态变更明确走 command handler
- 查询明确走 query handler
- 简单读取不强行复杂化
- 审计重、规则重、集成重的写路径优先使用 CQRS

原因：

- 这样可以保留清晰边界
- 同时避免在简单场景引入不必要复杂度

## 4. 微服务划分原则

微服务划分以业务能力与事务边界为基础，而不是以页面、表或菜单为基础。

必须遵守：

- 不按数据库表拆服务
- 不按前端页面拆服务
- 不按“以后也许会很大”拆服务
- 不为追求微服务而微服务

推荐原则：

- 平台能力优先服务化
- 业务域优先粗粒度服务化
- 只有当边界稳定、负载特征明确、团队协作需要时，才进一步拆细

## 5. Gateway / gRPC / Event Bus 的角色划分

### 5.1 API Gateway / BFF

负责：

- 外部统一入口
- 协议转换
- 鉴权前置处理
- 面向客户端的聚合与编排

不负责：

- 核心业务规则
- 领域状态持久化
- 跨域业务真相判断

### 5.2 Internal gRPC

负责：

- 内部强契约同步调用
- 类型明确的服务协作
- 受控的同步依赖关系

补充要求：

- 每个内部服务在进入“模块完成态”后，必须提供面向调用方的黑盒接口文档
- 调用方应优先阅读接口文档与契约，而不是阅读下游实现代码
- 对内部服务而言，proto 是契约真相源，但仍需要有便于人阅读的接口说明文档

### 5.3 Event Bus

Event Bus 的 CloudEvents envelope、provider、按 service 归属的 common code contract、transactional outbox / consumer inbox、DLQ、replay、tenant 与运行边界，以 [17-event-bus-and-outbox-architecture.md](./17-event-bus-and-outbox-architecture.md) 为准；业务 event type、payload 与版本继续以 `docs/contracts/events/` 为准。

负责：

- 跨上下文事实广播
- 最终一致性扩散
- 通知、索引、BI、AI 后处理
- 长事务的异步阶段切换

## 6. 同步调用与异步事件的边界

### 6.1 适合同步调用的场景

- 读取当前状态
- 提交前的硬校验
- 短路径编排
- 强一致的即时响应需求

### 6.2 适合异步事件的场景

- 跨上下文状态传播
- 审计记录扩散
- 通知发送
- BI 与搜索索引
- AI 后处理与衍生任务
- 长事务的后续节点推进

这样划分的原因是：

- 如果一切都同步，系统会形成高耦合分布式调用链
- 如果一切都异步，关键校验会失去边界控制

### 6.4 接口文档策略

OES 中不同类型接口的文档化策略应区分处理：

- 对外 HTTP / Gateway / BFF：
  - 使用 OpenAPI / Swagger 作为首选文档形式
  - 适合前端、外部调用方、自测与联调
- 对内 gRPC：
  - proto 仍是契约真相源
  - 但不应要求调用方直接阅读 proto 或实现代码来理解服务能力
  - 每个服务或模块完成后，应补一份按服务 / 模块分类的黑盒接口文档

推荐做法：

- `src/common/src/contracts/**.proto`
  - 作为机器可消费的真相契约
- `docs/contracts/<service-name>/<module-name>.md`
  - 作为人可消费的黑盒接口文档

这类黑盒接口文档至少应包含：

- 接口名称
- 接口类型
  - gRPC / HTTP / Event
- 适用调用方
- 请求字段摘要
- 响应字段摘要
- 关键业务语义
- 权限与 operator context 要求
- tenant / org 上下文要求
- 错误语义与主要异常码
- 幂等性 / 副作用说明

结论：

- Swagger / OpenAPI 很适合 HTTP 接口
- 对内部 gRPC 服务，它不是最佳主文档
- 内部服务更适合采用“proto + 黑盒契约文档”双层结构

### 6.3 Notification 的推荐协作方式

通知平台推荐采用“上游同步受理 + 平台内部异步投递”或“事件驱动摄取 + 平台内部异步投递”两类模式：

- OTP、登录提醒等需要即时确认是否已被平台受理的场景：
  - 上游服务同步调用 `notification-service`
  - `notification-service` 返回 `accepted / rejected`
  - 真正外部投递在平台内部异步执行
- 审批提醒、订单状态提醒、异步业务通知：
  - 业务域优先发布事件
  - `notification-service` 订阅事件并决定模板、渠道与投递

这样设计的原因是：

- 避免上游服务阻塞在第三方供应商响应上
- 保留 OTP 等高即时场景的上游受理确认
- 避免把消息投递复杂度散落到多个业务服务

## 7. 数据一致性策略

### 7.1 服务内一致性

- 服务内部使用本地事务保证一致性

### 7.2 跨服务一致性

- 使用 Outbox
- 使用幂等消费
- 使用 Saga 或流程编排
- 使用补偿而不是分布式数据库事务

### 7.3 禁止事项

- 禁止跨服务共享数据库事务
- 禁止服务 A 直接修改服务 B 数据库

原因：

- 企业级微服务的可演进性来自边界和幂等，而不是跨库强事务

## 8. 多租户隔离思路

OES 必须从平台层面支持多租户隔离。

基线要求：

- 所有业务上下文显式感知 `tenantId`
- 组织级能力感知 `orgId`
- operator context 在调用链中传递
- AI 能力也必须继承租户边界

推荐方案：

- 默认采用逻辑隔离
- 对高价值或高敏租户支持增强隔离策略

取舍说明：

- 逻辑隔离更适合平台早期统一演进
- 物理隔离可以作为后续租户分层策略，而不应成为初期默认形态

## 9. IAM / Auth / Permission / Scope / Policy 的平台定位

### 9.1 Auth

负责认证、会话、令牌与登录链路。

### 9.2 Identity

负责账号、身份映射、认证主体与业务主体的关联。

### 9.3 Permission

负责：

- 角色
- scope
- policy
- 授权判定

### 9.4 Party

负责统一表示交易与法律主体；具体职责、核心对象、`TenantParty` 引用规则与 non-goals 以 [party-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/party-service.md) 为准。

### 9.5 Tenant / Org

负责租户隔离与组织层级。

这样平台化划分的原因是：

- 身份、组织、主体、权限是不同概念
- 如果在系统早期混在一起，后续任何业务域都会被权限语义拖垮

## 10. 横向能力设计

OES 必须平台化提供以下横向能力：

- 审计
- 日志
- 追踪
- 指标与告警
- 配置中心
- 服务发现
- 任务调度
- 文件与搜索支撑

### 10.1 审计

平台级记录关键业务动作、权限决策、AI 工具调用与系统操作。

### 10.2 日志

统一结构化日志格式，并携带 trace 上下文。

### 10.3 追踪

统一 OpenTelemetry 链路追踪，覆盖入口、同步调用、异步传播。

### 10.4 配置中心与服务发现

当前仓库已存在 Nacos 方向的设计和实现雏形，应继续保持平台统一，不允许各服务自行引入不同发现机制。

### 10.5 任务调度

应作为平台能力统一管理，而不是散落在各业务服务中各自实现。

## 11. 当前仓库与目标架构的关系

当前仓库已经具备部分目标架构基础：

- `api-gateway`
- `auth-service`
- `identity-service`
- `permission-service`
- `party-service`
- `src/common` 中已有 transport、registry、logging、auth、contracts 等通用能力

因此当前阶段的首要任务不是继续增加更多业务实现，而是：

- 统一技术架构规则
- 冻结平台边界
- 明确同步与异步边界
- 明确租户与 IAM 基础模型

这是后续业务域和 AI 能力稳定接入的技术前提。
