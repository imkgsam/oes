# Permission Service 架构复用总结

## 1. 结论先说

`permission-service` 的核心价值，不只是“权限业务做得全”，而是它已经形成了一套可以复用到其他系统子服务的服务骨架：

1. 以 `DDD 分层` 管理职责边界。
2. 以 `CQRS` 区分读写路径。
3. 以 `gRPC Controller -> Command/Query Bus -> Handler -> Domain -> Repository` 形成统一调用链。
4. 以 `Repository Interface + Prisma Repository` 隔离领域层和持久化层。
5. 以 `模块级装配` 组织业务能力，而不是把全部依赖堆在 `AppModule`。

如果你想复制到其他子服务，真正应该复制的是这套“结构约束”和“依赖方向”，不是权限领域对象本身。

## 2. 它的实际架构长什么样

服务目录位于 `src/services/system/permission-service`，顶层分层如下：

```text
src/
  application/      # 用例层，Commands / Queries / Handlers
  common/           # 服务内局部常量、symbols、错误码
  domain/           # 聚合、值对象、领域服务、仓储接口
  infrastructure/   # Prisma、Mapper、Repository 实现
  interfaces/       # gRPC 控制器、请求映射
  modules/          # 按业务能力装配 provider/controller
  app.module.ts     # 组合根
  main.ts           # 微服务启动入口
```

这不是“按技术类型切文件夹”的简单分组，而是明显按照依赖方向来切层。

### 2.1 启动层

入口文件是 `src/main.ts`，当前已经是标准 gRPC 微服务启动方式：

- 初始化 OpenTelemetry。
- 使用 `NestFactory.createMicroservice` 启动。
- 加载 `permission_service` 相关 proto。
- 使用统一的 `AppLogger`。

这意味着其他子服务也可以直接复用这一启动模型，只需要替换：

- 服务名
- proto 包名
- proto 文件
- 监听端口

### 2.2 组合根

`src/app.module.ts` 负责组装全局能力和业务模块：

- `ConfigModule`
- `LoggingModule`
- `RegistryModule`
- `NacosConfigModule`
- `PermissionModule`
- `RoleModule`
- `PolicyModule`
- `AuthorizationModule`

这里体现出一个很重要的设计原则：

全局基础能力放在 `AppModule`，具体业务依赖放进各自 `xxx.module.ts`，避免所有仓储、handler、controller 全挤在根模块里。

### 2.3 模块层

`modules` 目录不是“业务逻辑层”，而是“装配层”。  
例如 `permission.module.ts` 主要做这些事：

- 引入 `CqrsModule` 与 `PrismaModule`
- 绑定仓储接口 token 到 Prisma 实现
- 注册 `ValidatingCommandBus` / `ValidatingQueryBus`
- 注册 command handlers / query handlers
- 暴露 gRPC controller

也就是说，每个模块的职责是：

把某个业务能力需要的接口实现、handler 和控制器装配起来。

这个模式非常适合复制，因为它天然支持按能力拆子服务。

## 3. 分层职责拆解

### 3.1 Interface 层

位置：

- `src/interfaces/grpc/*.controller.ts`

职责：

- 接收 gRPC 请求
- 把请求 DTO 转换成 Command / Query
- 调用 `ValidatingCommandBus` 或 `ValidatingQueryBus`
- 把返回结果映射成 proto response
- 用统一异常过滤器做错误转换

这一层非常薄，基本不承载业务规则。  
这是值得复制的，因为接口层越薄，未来切 HTTP / gRPC / MQ 就越容易。

### 3.2 Application 层

位置：

- `src/application/commands/**`
- `src/application/queries/**`

职责：

- 表达用例
- 做应用层编排
- 调用仓储接口和领域对象
- 处理读写分离

典型调用形态：

```text
Controller
  -> CommandBus / QueryBus
  -> Handler
  -> Repository / Domain Service
  -> Aggregate
```

这里的关键不是用了 CQRS 这个名词，而是：

- 写操作有独立 command handler
- 读操作有独立 query handler
- handler 是“一个用例一个入口”

这非常适合中大型系统复制，因为用例边界很清晰。

### 3.3 Domain 层

位置：

- `src/domain/aggregates`
- `src/domain/vo`
- `src/domain/services`
- `src/domain/repositories`
- `src/domain/enums`

职责：

- 聚合根承载核心状态与规则
- 值对象承载关联关系和不可变语义
- 领域服务承载跨聚合或高业务含义逻辑
- Repository Interface 定义持久化需求

`permission-service` 里比较典型的领域建模有：

- `Permission`
- `Role`
- `Policy`
- `RolePermission`
- `AccountRole`
- `AccountAuthorizationService`
- `PolicyEngine`

复制到其他服务时，不需要复用这些具体对象，但一定要复用下面这个原则：

领域层只能依赖领域概念，不依赖 Prisma、Nest、gRPC。

### 3.4 Infrastructure 层

位置：

- `src/infrastructure/prisma`
- `src/infrastructure/repositories/prisma`
- `src/infrastructure/mappers`

职责：

- 提供 Prisma 连接
- 实现 Repository Interface
- 在数据库记录与领域对象之间做映射

这一层是整个架构里最容易被忽略、但最应该复制的部分。  
因为它保证了：

- 领域模型不被 ORM 模型污染
- 数据库字段调整时，不会波及 controller / handler / domain 全层
- 持久化方案可替换

## 4. 这套架构最值得复制的 8 个点

### 4.1 复制“依赖方向”，不是复制文件名

正确方向是：

```text
interfaces -> application -> domain
infrastructure -> domain
modules -> interfaces/application/infrastructure
app.module -> modules
main.ts -> app.module
```

反过来不应该出现：

- domain 依赖 prisma
- domain 依赖 nest controller
- application 直接操作数据库模型
- controller 写业务规则

### 4.2 每个用例一个 handler

这里不是“大 service + 一堆方法”的组织方式，而是：

- `create-xxx.command.ts`
- `create-xxx.handler.ts`
- `get-xxx.query.ts`
- `get-xxx.handler.ts`

优点：

- 易测试
- 易查找
- 易扩展
- 用例边界天然清晰

### 4.3 仓储接口定义在 domain，实现放在 infrastructure

这使得 application / domain 面向的是抽象，不是 Prisma。

这是最应该直接照搬的结构，因为一旦其他服务也这么做，整个仓库的服务风格会统一。

### 4.4 module 只负责装配

`permission.module.ts`、`role.module.ts`、`policy.module.ts` 本质都不是业务层，而是 IoC 组装层。  
这一点值得保留，否则每个服务最后都会退化成一个超大 `AppModule`。

### 4.5 interface 层只做协议转换

controller 负责：

- request -> command/query
- result -> response

不负责：

- 核心规则
- 复杂校验
- 持久化操作

这个边界一旦守住，后面加 HTTP 网关、消息消费端都很轻松。

### 4.6 统一基础能力从 common 注入

目前已经复用的基础能力包括：

- logging
- tracing
- registry
- config
- validating command/query bus
- grpc 异常过滤

这说明复制时不需要每个子服务重新发明一遍基础设施，而是应该遵循统一的 `@oes/common` 接入方式。

### 4.7 业务模块和领域模块是两回事

`modules/permission` 这种模块是“装配单元”。  
`domain/aggregates/permission.aggregate.ts` 才是“业务建模单元”。

把这两类概念分开，是这份设计里很成熟的一点。

### 4.8 文档与代码是对应的

`permission-service` 不只是有代码，还有：

- `README.md`
- `doc/INDEX.md`
- `doc/design/*.md`

复制到其他服务时，建议把“服务骨架说明”和“功能设计文档”一起复制，不然最后只剩代码结构，没有团队共识。

### 4.9 文档必须按范围和类型拆开

这次在根目录 `doc` 和 `permission-service/doc` 中已经验证了一套更稳定的文档架构，其他子服务应直接遵循。

完整文档规范见：

- [doc-architecture-requirements.md](./doc-architecture-requirements.md)

核心原则：

- 按范围分层：
  - 根目录 `doc` 负责项目级、跨服务级、全局约束
  - 子服务 `doc` 负责服务级设计和本服务实施
- 按类型分槽：
  - `INDEX.md` 只做导航
  - `overview.md` 只讲定位、边界、依赖
  - `design/*.md` 只讲稳定设计
  - `tasks/*.md` 只讲实施步骤和状态
  - `history/*.history.md` 只讲历史演进
- 一个主题只能有一个主文档，不能在多个地方重复承载同一份正文

这条规则非常重要，因为真正增加维护成本的不是文档多，而是：

- 一个文档同时承担索引、设计、计划、进度、注意事项
- 同一主题在根目录和子服务里重复展开
- 历史记录和当前有效设计混在一起
- 设计结论和实施步骤混在一起

## 5. 可复制到其他子服务的代码与文档骨架

建议新服务统一成下面的目录模板：

```text
src/services/system/<target-service>/
  prisma/
    schema.prisma
  src/
    application/
      commands/
      queries/
    common/
      constants/
    domain/
      aggregates/
      entities/
      enums/
      repositories/
      services/
      vo/
    infrastructure/
      mappers/
      prisma/
      repositories/
    interfaces/
      grpc/
      mappers/
    modules/
      <capability-a>/
      <capability-b>/
    app.module.ts
    main.ts
  doc/
    INDEX.md
    overview.md
    requirements.md
    roadmap.md
    design/
    tasks/
    history/
  README.md
  package.json
  tsconfig.json
```

如果某些服务没有 `vo`、`entities` 或多模块能力，可以精简，但四层结构最好不要打散；文档结构也应保持同构。

### 5.1 根目录 `doc` 的职责

根目录 `doc` 只放：

- 项目级说明
- 全局执行约束
- 跨服务功能主文档
- 从已实现服务中提炼出来的统一架构规范
- 历史归档

推荐结构：

```text
doc/
  INDEX.md
  overview.md
  requirements.md
  architecture/
  cross-service/
  history/
  archive/
```

其中：

- `architecture/` 放可复用的全局架构规范，例如本文件
- `cross-service/` 放跨服务功能主文档，不是静态协议清单
- `history/` 放根目录文档的历史记录
- `archive/` 放旧方案和历史资料

### 5.2 子服务 `doc` 的职责

每个子服务自己的 `doc/` 只负责：

- 说明本服务是什么、边界是什么
- 承接根目录跨服务功能在本服务内的设计
- 管理本服务内部功能设计
- 管理本服务实施分片与阶段状态
- 记录本服务历史

推荐结构：

```text
doc/
  INDEX.md
  overview.md
  requirements.md
  roadmap.md
  design/
  tasks/
  history/
```

### 5.3 每类文档的固定职责

#### `INDEX.md`

只做导航：

- 阅读顺序
- 当前有效主文档
- 设计 / 任务 / 历史入口

禁止：

- 承载完整设计正文
- 承载待办步骤
- 承载历史流水账

#### `overview.md`

负责高维说明：

- 服务定位
- 职责边界
- 上下游依赖
- 文档分工

#### `requirements.md`

负责实施约束：

- Codex 在本服务中的补充执行规则
- 与仓库级 `doc/standards/requirements.md` 的继承关系

#### `roadmap.md`

负责阶段说明：

- Phase 划分
- 当前优先级
- 当前状态摘要

#### `design/*.md`

负责稳定设计：

- 目标
- 边界
- 设计决策
- 核心模型
- 核心流程
- 长期注意事项

#### `tasks/*.md`

负责实施拆分：

- 当前承接哪些 slice
- 当前状态
- 实施顺序
- 验收要求
- 阻塞项

#### `history/*.history.md`

负责历史记录：

- 某次调整做了什么
- 为什么调整
- 影响了哪些文档

### 5.4 `design` 与 `tasks` 的关系

这是最容易混淆的地方，必须统一：

- `design` 回答“应该怎么设计”
- `tasks` 回答“接下来怎么落地”

关系是：

- `design` 是上游
- `tasks` 是下游

也就是说：

1. 先确定设计结论
2. 再根据设计拆任务
3. 任务推进时主要更新 `tasks`
4. 只有设计本身变化时才更新 `design`

不要把两者混成一个文档，否则会重新回到“一个文档被重复修改”的老问题。

### 5.5 跨服务功能文档如何挂接到子服务

跨服务功能不是协议附件，而是需要分发到多个子服务统一落地的功能主文档。

正确结构是：

```text
doc/
  cross-service/
    <feature>.md        # 根目录跨服务功能主文档

src/services/system/<service>/doc/
  design/
    <service-topic>.md  # 该跨服务功能在本服务内的设计承接文档
  tasks/
    <feature>.md        # 该跨服务功能在本服务内的实施文档
```

例如当前已经落地的关系：

- 根目录主文档：
  `doc/cross-service/internal-service-auth-and-operator-context.md`
- `permission-service` 设计承接文档：
  `src/services/system/permission-service/doc/design/authorization.md`
- `permission-service` 实施文档：
  `src/services/system/permission-service/doc/tasks/internal-service-auth-and-operator-context.md`

要求：

- 根目录主文档负责总设计、总拆分、全局职责边界
- 服务内设计承接文档负责“本服务如何承接这项跨服务功能”
- 服务内实施文档负责“本服务按什么顺序落地这些分片”
- 不能只建任务文档而不建立服务内设计承接关系

### 5.6 链接规则必须跨平台兼容

因为开发环境同时有 Windows 和 macOS，文档链接必须遵循以下规则：

- 一律使用仓库相对路径
- 不在仓库文档中写本机绝对路径
- 索引和主文档都应能在不同系统上打开

这条规则是强约束，不是建议。

## 6. 复制时的落地规则

### 6.1 先复制骨架，再塞业务

推荐顺序：

1. 先建目录和启动入口。
2. 先接入 `LoggingModule`、`ConfigModule`、`RegistryModule`、`NacosConfigModule`。
3. 先定义 domain aggregate 和 repository interface。
4. 再写 Prisma schema / mapper / repository 实现。
5. 再写 command/query handler。
6. 最后补 gRPC controller 和 proto。

不要一开始就从 controller 往下写，否则很快会把业务逻辑堆回接口层。

### 6.2 每个子服务优先按“能力模块”拆 module

比如别的服务如果是订单域，可以拆成：

- `order.module.ts`
- `shipment.module.ts`
- `billing.module.ts`
- `authorization.module.ts`

而不是只保留一个总模块。

### 6.3 读写路径都走 bus

如果要统一风格，建议：

- 写操作全部走 `ValidatingCommandBus`
- 读操作全部走 `ValidatingQueryBus`

这样校验、追踪、日志入口都一致。

### 6.4 聚合不直接暴露数据库结构

聚合对象只表达业务语义，例如：

- 改名
- 启用/禁用
- 绑定/解绑
- 校验是否允许某种状态变化

不要让聚合携带 Prisma 风格字段处理逻辑。

### 6.5 mapper 必须保留

哪怕一开始看起来“多写了一层”，也建议保留 `Mapper`，因为它是后续演进时最稳的缓冲层。

### 6.6 文档也要先搭骨架再写正文

推荐顺序：

1. 先建立 `doc/INDEX.md`
2. 再建立 `overview.md`、`requirements.md`、`roadmap.md`
3. 再补 `design/*.md`
4. 最后按需要补 `tasks/*.md` 与 `history/*.history.md`

不要先写一篇“大而全”的功能文档，再把索引、阶段、注意事项、待办都塞进去。

## 7. 哪些能直接照搬，哪些不能

### 7.1 能直接照搬的

- `main.ts` 的微服务启动模式
- `app.module.ts` 的组合根思路
- `modules/*` 的装配模式
- `application/commands + queries + handlers`
- `domain/repositories` 抽象定义方式
- `infrastructure/prisma + repositories + mappers`
- `interfaces/grpc` 的薄控制器模式
- `common/constants/symbols` 的 token 管理方式
- 文档结构

### 7.2 不能机械照搬的

- `Permission / Role / Policy` 这些领域对象
- 仓储方法名
- proto 契约
- Prisma schema
- 领域服务逻辑
- 错误码枚举

这些都必须根据目标子服务的业务语义重命名。

## 8. 一个推荐的复制策略

如果你要把这套方案推广到其他子服务，建议分两层复制：

### 第一层：复制“服务骨架模板”

抽出所有服务通用部分：

- 目录结构
- `main.ts`
- `app.module.ts`
- `prisma.module.ts`
- `prisma.service.ts`
- `modules/<capability>.module.ts` 装配模板
- command/query/handler 模板
- repository interface + implementation 模板
- gRPC controller 模板

### 第二层：在每个服务内替换领域名词

例如把：

- `Permission` 替换成目标领域的 aggregate
- `PermissionRepository` 替换成对应 repository
- `PermissionManagementGrpcController` 替换成该服务自己的协议控制器

这样复制的是“框架”，不是“权限业务”。

## 9. 当前这份架构的一个现实判断

`permission-service` 已经很接近“可复用模板服务”了，但它目前更像“从权限业务中提炼出来的优秀样板”，还不是完全抽象好的脚手架。  
所以更合适的做法不是直接整目录复制，而是：

1. 先把它当参考实现。
2. 提炼一份统一子服务模板。
3. 再让其他服务按模板新建或重构。

否则容易把权限领域特有概念一并带过去。

## 10. 你真正可以沉淀的统一规范

建议把下面这套规范作为团队约定：

1. 所有系统子服务统一使用 `DDD + CQRS + gRPC`。
2. 所有服务统一使用 `application/domain/infrastructure/interfaces/modules` 五层目录。
3. 所有写请求统一进入 command handler。
4. 所有读请求统一进入 query handler。
5. 所有持久化实现统一放 infrastructure，domain 只保留接口。
6. 所有 controller 只做协议转换，不写核心业务。
7. 所有服务都保留 README 和 service-level doc。
8. 所有服务统一遵循 `INDEX + overview + requirements + roadmap + design + tasks + history` 的文档结构。
9. 跨服务功能统一在根目录保留主文档，再在子服务中补“设计承接文档 + 实施文档”。
10. 所有仓库内文档链接统一使用相对路径，确保跨平台可用。

只要这 7 条定下来，后面的服务结构就会越来越整齐。

## 11. 最后给你的建议

如果你的目标是“复制到其他子服务”，下一步最值得做的不是直接搬 `permission-service` 代码，而是新增一个统一模板，例如：

- `doc/service-architecture-template.md`
- 或 `src/services/_templates/system-service-template/`

然后把 `permission-service` 作为第一份参考实现。

这样以后新服务和老服务改造，都会有统一落点。
