# OES Gateway / BFF 架构设计

> `permission-service` 的服务设计唯一真相源为 [permission-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/permission-service.md)。本文只定义 Gateway / BFF 如何消费权限、授权摘要与导航授权结果，不重新定义 permission-service 的核心对象、owner 边界或授权模型。

## 1. 文档目的

本文档用于冻结 OES 项目中入口治理层、应用聚合层与下游系统服务之间的职责边界，作为后续 `api-gateway` 重设计与 APISIX 接入的项目级依据。

本文档回答的问题包括：

- OES 为什么需要同时存在 APISIX 与 NestJS `api-gateway`
- Gateway / BFF 在 OES 中的长期定位是什么
- 它与 `auth-service`、`identity-service`、`permission-service`、业务域服务如何协作
- HTTP contract 与下游 gRPC contract 为什么必须分离
- 哪些能力应放在 APISIX，哪些能力必须保留在 Gateway / BFF
- 第一阶段应优先冻结哪些前端消费契约

## 2. 设计结论

OES 应采用双层入口模型，而不是让单一网关同时承担所有基础设施职责与应用聚合职责。

推荐分层如下：

- APISIX：入口治理层
- NestJS `api-gateway`：应用聚合层 / BFF

其核心结论是：

- APISIX 负责流量入口治理
- Gateway / BFF 负责面向客户端的聚合编排与应用级接入
- 外部 HTTP contract 与内部 gRPC contract 必须显式分离
- Gateway 允许少量薄代理接口作为过渡
- Gateway 的长期目标应是场景型 BFF，而不是机械转发层

## 3. 为什么采用双层入口模型

### 3.1 从问题类型看

入口层需要同时解决两类问题：

- 基础设施型入口治理问题
- 面向产品场景的应用聚合问题

这两类问题的变化频率、治理方式与责任主体并不相同。

基础设施型问题包括：

- TLS / HTTPS
- 路由转发
- 负载均衡
- 限流
- 安全头
- request id
- 访问日志
- 灰度与流量分流

应用聚合问题包括：

- 登录后初始化上下文
- 当前操作者信息聚合
- 菜单与权限码装配
- 不同前端端型需要的接口形状
- 下游多个服务的响应编排
- 面向客户端的错误模型

如果将两类问题混在同一层，会导致：

- Gateway 既像基础设施，又像应用服务
- 接口契约被下游服务结构反向驱动
- 流量治理难以统一迁移或替换
- 前端场景接口逐渐失控

### 3.2 从大型项目最佳实践看

在中大型系统中，更稳定的方式通常是：

- 用现成网关产品承接标准化入口治理能力
- 用应用网关 / BFF 承接客户端语义、上下文聚合与应用编排

对 OES 而言：

- APISIX 不是 BFF
- NestJS `api-gateway` 不是纯反向代理

二者各自承担一层稳定职责，才能让后续业务域接入、前端演进与平台治理同时保持可控。

## 4. 分层职责设计

### 4.1 APISIX 负责什么

APISIX 负责通用入口治理能力，包括：

- 外部统一入口
- TLS / HTTPS 终止
- 域名、路径与上游路由
- request id 注入与透传
- 基础限流
- CORS
- 安全头
- 基础访问日志
- 负载均衡
- 健康探测转发
- 可选的灰度、金丝雀与流量分流

第一阶段不要求 APISIX 承担复杂业务鉴权语义，但应为后续扩展预留统一入口位置。

### 4.2 Gateway / BFF 负责什么

Gateway / BFF 负责应用接入与场景聚合能力，包括：

- 面向外部客户端暴露 HTTP API
- 入口 DTO 校验与参数归一化
- JWT / session 接入与认证失败前置处理
- operator context、tenant context、trace context 组装与向下传播
- 调用下游 gRPC 服务
- 面向前端的聚合接口
- 网关层粗粒度权限门禁
- 统一 HTTP 错误模型
- OpenAPI / Swagger
- 与前端约定的稳定消费契约

### 4.3 Gateway / BFF 不负责什么

Gateway / BFF 不应承担以下职责：

- 核心业务规则判断
- 领域状态真相
- 数据库存取
- 复杂授权决策真相
- 跨上下文业务真相裁决
- 长事务状态持久化
- 将下游服务内部 DTO 直接暴露给前端

### 4.4 职责矩阵

| 能力 | APISIX | Gateway / BFF | 下游服务 |
| --- | --- | --- | --- |
| HTTPS/TLS | 主责 | 不负责 | 不负责 |
| 入口路由 | 主责 | 辅助 | 不负责 |
| request id | 主责 | 继承与补充 | 透传 |
| 基础限流 | 主责 | 可保留少量应用级保护 | 不负责 |
| CORS / 安全头 | 主责 | 可兼容过渡 | 不负责 |
| HTTP DTO 校验 | 不负责 | 主责 | 不负责 |
| JWT 接入 | 可选前置 | 主责 | 认证真相由 `auth-service` 提供 |
| operator / tenant context 传播 | 不负责 | 主责 | 消费与校验 |
| 面向前端聚合接口 | 不负责 | 主责 | 提供能力真相 |
| gRPC 同步协作 | 不负责 | 主责 | 主责 |
| 授权决策真相 | 不负责 | 不负责 | `permission-service` 主责 |
| 统一 HTTP 错误模型 | 不负责 | 主责 | 输出内部错误 |
| OpenAPI | 不负责 | 主责 | 不负责 |

### 4.5 第一阶段细化职责矩阵

为避免 APISIX 与 Gateway 在第一阶段互相抢职责，当前建议按以下更细粒度方式拆分：

| 能力项 | 第一阶段建议归属 | 说明 |
| --- | --- | --- |
| 域名接入 | APISIX | 统一入口域名与证书管理 |
| `/api/*` 路由转发 | APISIX | 转发到 Gateway 上游 |
| `/health` 探针入口 | APISIX + Gateway | APISIX 转发，Gateway 返回应用健康状态 |
| `x-request-id` 生成 | APISIX | 优先在入口层生成 |
| `x-request-id` 透传与补全 | Gateway | 若入口未生成则补齐 |
| CORS | APISIX | 统一外部入口策略 |
| 安全头 | APISIX | 统一入口安全策略 |
| 基础限流 | APISIX | 如登录限流、公共接口限流 |
| 应用级防御保护 | Gateway | 仅保留极少量兜底保护 |
| HTTP body/query/path 校验 | Gateway | 只能由应用层理解 DTO 语义 |
| 登录态恢复 | Gateway | 需要理解 OES token / operator 语义 |
| operator context 组装 | Gateway | 需要结合认证态与项目级上下文规则 |
| 粗粒度权限门禁 | Gateway + `permission-service` | Gateway 发起，真相在下游 |
| `me/context` 聚合 | Gateway | 典型场景型 BFF |
| OpenAPI 文档 | Gateway | 面向客户端契约文档 |

第一阶段的关键原则是：

- 不追求 APISIX 一次吃掉所有入口能力
- 但要从设计上明确哪些能力最终应上移到 APISIX
- Gateway 不再继续沉淀本可平台化的基础设施逻辑

### 4.6 当前代码推进状态

截至 `2026-03-31`，`api-gateway` 已完成与本设计直接相关的第一批基础收敛：

- 已统一成功响应 envelope，并附带 `traceId / requestId / timestamp`
- 已统一失败响应 envelope，HTTP body 中的 `code` 已固定为稳定业务码
- 已将下游 gRPC 业务异常与基础设施异常映射到统一 HTTP 错误模型
- 已补定向单测验证 Gateway 的成功包装与异常映射行为
- 已将 Gateway 首跳 metadata 创建切换到 `common` 中统一的 propagation factory
- 已删除 Gateway 私有长期 metadata factory 方向，当前仅保留 Gateway HTTP source mapper

这意味着 Gateway 现阶段虽然仍未完成全部 BFF 接口，但其“对外返回与异常基线”已经开始与 `13-response-and-exception-architecture.md` 对齐。

同时，Gateway 首跳的 request / trace / operator-context 传播，已开始与 `14-grpc-metadata-and-service-trust-architecture.md` 对齐。

## 5. Contract 分离原则

### 5.1 为什么必须分离

Gateway 对外服务的对象是客户端，对内协作的对象是下游服务，因此必须显式分离：

- HTTP contract：客户端消费契约
- gRPC contract：内部服务协作契约

如果二者直接复用同一套类型，将导致：

- 下游 proto 变更直接冲击前端
- 页面需求反向污染内部服务契约
- Gateway 丧失 BFF 的场景聚合价值
- 接口长期退化为机械转发

### 5.2 分离规则

Gateway 应遵循以下规则：

- HTTP 入参与 gRPC 入参分开定义
- HTTP 出参与 gRPC 出参分开定义
- Gateway 内显式保留 mapping 层
- 前端响应模型以页面/场景消费友好为目标
- 下游 gRPC 请求模型以下游服务能力语义为目标

### 5.3 校验边界

Gateway 必须承担入口校验职责，但不承担业务真相校验职责。

Gateway 负责：

- 字段必填校验
- 格式校验
- 长度与枚举校验
- query/path/body 基础合法性校验
- 分页、排序、过滤条件的归一化

下游服务负责：

- 业务规则校验
- 状态合法性校验
- 领域不变量校验
- 权限与策略真相判断

应遵循的原则是：

- Gateway 负责入口合法性
- 下游服务负责业务正确性

## 6. 与系统服务的协作边界

### 6.1 与 `auth-service` 的协作

`auth-service` 的登录链路、token / session、刷新、登出、挑战、验证码、OTP 与安全审计边界以 [auth-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/auth-service.md) 为准。

Gateway / BFF 负责：

- 接收客户端登录、刷新、登出请求
- 做 HTTP DTO 校验
- 归一化设备、请求与上下文信息
- 将前端友好的认证响应模型返回给客户端

明确禁止：

- Gateway 重复实现认证业务规则
- Gateway 自行定义会话真相
- 前端直接绑定 `auth-service` 内部 gRPC message

### 6.2 与 `identity-service` 的协作

`identity-service` 的账号、身份映射、联系资产、机器主体与展示摘要边界以 [identity-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/identity-service.md) 为准。

Gateway / BFF 负责：

- 按前端场景查询并聚合当前操作者资料
- 为前端输出稳定的 user profile / operator profile 视图

明确禁止：

- 让前端直接依赖 `identity-service` 内部结构
- 将历史占位接口误当作稳定契约

### 6.3 与 `permission-service` 的协作

`permission-service` 负责：

- 角色真相
- 权限码真相
- policy 真相
- 授权决策真相

Gateway / BFF 负责：

- 入口级粗粒度门禁
- 菜单、权限码等前端消费信息聚合
- 将内部错误语义转换成统一 HTTP 错误模型

明确禁止：

- 在 Gateway 内复制复杂授权决策逻辑
- 让 Gateway 成为权限语义真相源

### 6.4 与业务域服务的协作

业务域服务负责：

- 自己领域内的业务真相
- 自己领域内的用例执行

Gateway / BFF 负责：

- 面向客户端组织接口形状
- 在必要时做轻量多服务编排

这里应遵循：

- 单服务能力可通过薄代理过渡
- 跨服务页面场景优先设计场景型 BFF 接口

## 7. 薄代理与场景型 BFF 的关系

### 7.1 什么是薄代理

薄代理接口是指 Gateway 主要承担以下工作：

- 认证
- 粗粒度授权
- HTTP 校验
- 协议转换
- 错误映射

然后将请求转发给单一下游服务能力。

这类接口适合：

- 权限管理后台
- 角色管理后台
- 单服务主导的管理型接口

### 7.2 什么是场景型 BFF

场景型 BFF 接口是指 Gateway 按前端页面或用户任务设计接口，通常会：

- 聚合多个下游服务
- 输出前端可直接消费的数据形状
- 隐藏下游服务的内部边界细节

这类接口适合：

- 登录结果装配
- 初始化上下文
- 导航菜单
- 当前操作者工作台引导信息

### 7.3 OES 的设计倾向

OES 允许少量薄代理作为过渡，但长期目标应明确为：

- 核心前端场景使用场景型 BFF
- 单服务管理能力允许保留薄代理

这能避免前端继续直接拼接多个内部服务接口，也能避免 Gateway 被完全重构成机械转发层。

## 8. 第一阶段优先冻结的 HTTP 契约

当前阶段建议优先冻结 IAM 与前端初始化相关契约，而不是一次性展开所有业务域接口。

第一阶段建议冻结：

- `POST /api/v1/auth/login`
- `POST /api/v1/auth/challenges/request`
- `POST /api/v1/auth/challenges/respond`
- `POST /api/v1/auth/account-selection`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
- `GET /api/v1/me/context`
- `GET /api/v1/iam/menu-tree`
- `GET /api/v1/iam/permissions`

说明：

- `login / challenge / account-selection / refresh / logout` 由 Gateway 面向客户端暴露，但认证语义以 [auth-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/auth-service.md) 为准
- `me/context` 是典型场景型 BFF 接口，应聚合 `auth-service`、`identity-service`、`permission-service`
- `menu-tree` 与 `permissions` 面向前端消费，不应简单暴露底层内部 message

## 9. Context 传播模型

所有从 Gateway 向下游服务发起的调用链，都应显式传播以下上下文：

- `tenantId`
- `orgId`，如果场景适用
- operator context
- trace context
- request id
- 审计元数据

### 9.1 Gateway 的职责

Gateway 是外部请求进入内部服务体系的第一层应用入口，因此必须承担：

- 从认证态恢复操作者信息
- 归一化租户与组织上下文
- 将上下文写入下游 gRPC metadata
- 统一缺失或非法上下文的拒绝策略

### 9.2 设计约束

需要特别强调：

- context 传播模型属于跨模块高影响事项
- Gateway 不得随意定义一套临时结构
- 若后续需要细化字段，应通过项目级文档或 ADR 继续治理

补充约束：

- Gateway 下游 metadata 能力不是项目长期唯一传播点
- 多跳 gRPC metadata 传播与服务信任模型以 [14-grpc-metadata-and-service-trust-architecture.md](./14-grpc-metadata-and-service-trust-architecture.md) 为准
- 传输层 mTLS 属于部署层职责，Gateway 与各子服务代码层不再以“临时 TLS 过渡实现”作为目标方向

### 9.3 当前实现与目标状态的关系

截至当前代码状态，Gateway 下游 metadata 工厂仍会携带：

- `operator_roles`
- 旧的预解析权限集合字段

这属于过渡状态，而不是目标状态。

项目级目标状态应以 [09-role-based-permission-resolution.md](./09-role-based-permission-resolution.md) 为准：

- `operator_context` 长期应传播 `operator_roles`
- 旧的预解析权限集合字段不应继续作为标准长期字段扩散

这意味着 Gateway 重构时需要注意：

- 新的 BFF / downstream adapter 不应继续把旧的预解析权限集合字段当作长期设计前提
- 现有兼容逻辑可以保留过渡期兼容，但应明确标记为迁移中
- Gateway 当前的 metadata 工厂实现可继续作为首跳实现，但不应被误认为项目级最终态；后续应由 `common` 中统一的多跳 metadata propagation 能力替代“Gateway 专属工厂即长期方案”的旧方向

## 10. 错误模型与返回语义

Gateway 对外必须输出统一的 HTTP 错误模型，而不能把下游 gRPC 状态码、供应商错误或内部技术细节直接泄漏给前端。

设计要求：

- 下游错误先映射为 OES 统一错误语义
- Gateway 再输出面向 HTTP 客户端的错误响应
- 前端不感知 gRPC status 枚举
- 前端不依赖下游服务内部异常结构

## 11. OES `api-gateway` 的目标代码组织

`api-gateway` 的实现应围绕场景与接口适配组织，而不是围绕“下游服务透传”组织。

推荐至少具备以下结构：

- `interfaces/http`
- `application`
- `infrastructure/downstream`
- `modules`
- `common`

其中：

- `interfaces/http`：HTTP controller、DTO、response models
- `application`：场景型用例编排
- `infrastructure/downstream`：gRPC client、adapter、mapping
- `modules`：按能力装配，例如 `auth-bff`、`iam-bff`
- `common`：网关内部共享的入口适配能力

第一阶段不要求完全重构到最复杂形态，但设计目标必须先冻结，以避免继续按“服务代理目录”无限扩散。

### 11.1 推荐目录结构

结合 OES 当前实现基础，第一阶段推荐目标结构如下：

```text
src/services/api-gateway/src/
  app.module.ts
  main.ts
  config/
  health/
  common/
    filters/
    interceptors/
    middleware/
    grpc/
    auth/
    response/
  modules/
    auth-bff/
      interfaces/http/
        controllers/
        dtos/
        view-models/
      application/
        use-cases/
        mappers/
      infrastructure/downstream/
        auth-service/
      auth-bff.module.ts
    iam-bff/
      interfaces/http/
        controllers/
        dtos/
        view-models/
      application/
        use-cases/
        assemblers/
      infrastructure/downstream/
        identity-service/
        permission-service/
        auth-service/
      iam-bff.module.ts
    management-proxy/
      permission-management/
      management-proxy.module.ts
```

设计说明：

- `auth-bff`：承接登录流程型接口组
- `iam-bff`：承接 `/me/context`、`/iam/menu-tree`、`/iam/permissions`
- `management-proxy`：承接允许保留的薄代理管理接口

### 11.2 模块职责拆分

#### `auth-bff`

负责：

- `POST /auth/login`
- `POST /auth/challenges/request`
- `POST /auth/challenges/respond`
- `POST /auth/account-selection`
- `POST /auth/refresh`
- `POST /auth/logout`

内部关注点：

- HTTP DTO 校验
- 登录流程状态映射
- challenge / account-selection contract 适配
- session 响应模型输出

#### `iam-bff`

负责：

- `GET /me/context`
- `GET /iam/menu-tree`
- `GET /iam/permissions`

内部关注点：

- 聚合 `auth-service`
- 聚合 `identity-service`
- 聚合 `permission-service`
- 输出前端初始化上下文与展示摘要

#### `management-proxy`

负责：

- 当前仍需保留的管理型薄代理接口

适用范围：

- 权限管理
- 角色管理
- 其他第一阶段尚未转为场景型 BFF 的单服务管理入口

设计约束：

- 薄代理模块不得继续无限扩张
- 所有新前端核心场景优先进入 `auth-bff` 或 `iam-bff`

### 11.3 分层职责

#### `interfaces/http`

负责：

- Controller
- Request DTO
- Query DTO
- Response ViewModel
- Swagger 装饰与接口说明

禁止：

- 直接编排多个下游服务
- 直接书写复杂业务映射逻辑

#### `application`

负责：

- 用例编排
- 聚合流程控制
- 场景型响应组装
- HTTP model 与 downstream model 的 mapping 协调

建议对象类型：

- `LoginUseCase`
- `RespondChallengeUseCase`
- `SelectAccountUseCase`
- `GetMeContextUseCase`
- `GetMenuTreeUseCase`
- `GetPermissionSummaryUseCase`

#### `infrastructure/downstream`

负责：

- gRPC client 获取
- adapter 封装
- metadata 注入
- safeGrpcCall 复用

禁止：

- 输出前端 ViewModel
- 承担 BFF 级聚合编排

#### `common`

负责：

- Gateway 统一异常过滤
- 统一响应包装
- request logging
- timeout
- downstream metadata factory
- 认证态恢复辅助能力

设计要求：

- `common` 只承载网关内部横切能力
- 不演变为跨模块业务逻辑堆放区

### 11.4 当前代码到目标结构的演进关系

当前 `api-gateway` 代码已具备部分可保留骨架：

- `main.ts`
- `app.module.ts`
- `common/filters`
- `common/interceptors`
- `common/middleware`
- `common/grpc/downstream-grpc-metadata.factory.ts`
- `health`

当前主要问题在于：

- 历史 `modules/auth-service` 未完成代理骨架已清理，后续不再沿旧服务代理路径继续补丁式扩写
- 历史 `modules/identity-service` 过时占位实现已清理，后续如需对外暴露身份能力，应以新的场景型 BFF 重新设计
- `modules/permission-service` 目前更偏管理薄代理，而不是 BFF
- 模块目录以“下游服务名”组织，不利于场景型 BFF 演进

因此第一阶段不建议继续沿着现有模块目录补丁式扩写，而应逐步迁移到：

- 以 `auth-bff` / `iam-bff` 为中心
- 以 `management-proxy` 收纳过渡薄代理

## 12. Gateway 第一阶段实现任务清单

为避免大重构失控，建议将 Gateway 改造拆成可独立推进的实现分片。

### 12.1 Slice A: 基线收口

目标：

- 修复现有入口基础能力中的明显问题
- 为后续 BFF 改造建立稳定底座

建议任务：

- 修复 `GatewayExceptionFilter`
- 清理明显编码异常注释
- 统一 `main.ts` / `app.module.ts` 的当前配置基线
- 明确 Swagger、ValidationPipe、Timeout、RequestLogger 的保留策略
- 明确 readiness 的最小实现策略

交付标准：

- 当前 Gateway 能作为稳定 HTTP 容器运行

### 12.2 Slice B: `auth-bff` 主认证入口

目标：

- 落地 `POST /auth/login`

建议任务：

- 定义登录 HTTP DTO
- 定义统一认证响应 ViewModel
- 建立 `auth-service` downstream adapter
- 实现登录方式到 gRPC 能力映射
- 建立登录状态映射器

交付标准：

- `POST /auth/login` 可对接现有 `auth-service` 主认证能力

### 12.3 Slice C: challenge 流程接口

目标：

- 落地 challenge request / respond

建议任务：

- 定义 `POST /auth/challenges/request`
- 定义 `POST /auth/challenges/respond`
- 对接邮箱/手机 OTP challenge 与 MFA challenge
- 统一 challenge view model

交付标准：

- challenge 流程可通过 Gateway 走通

### 12.4 Slice D: account-selection 流程接口

目标：

- 落地 `POST /auth/account-selection`

建议任务：

- 定义 account-selection DTO
- 对接 `auth-service.selectAccount`
- 衔接 session 建立结果返回
- 明确 `loginMethod` 透传规则
- 明确设备上下文如何通过显式字段进入

交付标准：

- 多账户登录流程可通过 Gateway 闭环

### 12.5 Slice E: 会话接口

目标：

- 落地 refresh / logout

建议任务：

- 定义 `POST /auth/refresh`
- 定义 `POST /auth/logout`
- 对接 refresh rotation 返回模型
- 对接 logout 范围枚举

交付标准：

- 会话刷新与登出通过 Gateway 可稳定使用

### 12.6 Slice F: `iam-bff` 初始化上下文

目标：

- 落地 `GET /me/context`

建议任务：

- 定义 `me/context` ViewModel
- 对接 `auth-service` 当前会话信息
- 对接 `identity-service` 的 user/account/tenant/org 查询
- 对接 `permission-service` 的权限摘要
- 完成聚合 assembler

交付标准：

- 前端可在登录完成后通过单接口获得初始化上下文

### 12.7 Slice G: 导航与权限摘要

目标：

- 落地 `/iam/menu-tree` 与 `/iam/permissions`

建议任务：

- 定义菜单摘要模型
- 定义权限码摘要模型
- 对接 `permission-service`
- 形成第一阶段菜单装配策略

交付标准：

- 前端可不再依赖演示式菜单与权限接口

### 12.8 Slice H: 管理薄代理收纳

目标：

- 整理现有 `permission-service` 管理接口代理

建议任务：

- 将现有权限/角色管理接口收纳到 `management-proxy`
- 补齐分页、过滤、命名、DTO 与控制器结构一致性
- 明确哪些接口未来继续保留薄代理，哪些应迁到 BFF

交付标准：

- 现有管理接口不阻塞使用，同时不干扰 BFF 主线

### 12.9 Slice I: APISIX 最小接入

目标：

- 完成最小入口治理接入

建议任务：

- 接入 Gateway 上游路由
- 接入 request id
- 接入基础限流
- 接入 CORS
- 接入基础健康探针转发

交付标准：

- APISIX 与 Gateway 形成最小可运行双层入口模型

### 12.10 推荐实施顺序

建议顺序如下：

1. Slice A
2. Slice B
3. Slice C
4. Slice D
5. Slice E
6. Slice F
7. Slice G
8. Slice H
9. Slice I

原因：

- 先稳定容器与 contract
- 再闭环认证主线
- 再补初始化上下文
- 最后收纳薄代理并接入 APISIX
## 13. 与 APISIX 的演进关系

OES 推荐在 Gateway 设计阶段就同步考虑 APISIX 接入，而不是等 Gateway 堆积了大量基础设施逻辑后再做迁移。

推荐演进方式：

### 12.1 第一阶段

- 保留 Gateway 当前已有入口能力
- 接入 APISIX 基础路由与限流
- 逐步把 CORS、安全头、request id、部分限流前移

### 12.2 第二阶段

- 将基础入口治理稳定迁移到 APISIX
- Gateway 聚焦 BFF、HTTP contract、context 传播与下游编排

### 12.3 长期目标

- APISIX 成为统一入口治理层
- NestJS `api-gateway` 成为应用聚合层

## 14. IAM 协作时序

第一阶段 Gateway / BFF 的核心价值，主要体现在 IAM 场景的协作编排上。

### 13.1 登录

登录场景推荐时序如下：

1. 客户端调用 `POST /api/v1/auth/login`
2. APISIX 完成入口路由、基础限流、request id 注入后转发到 Gateway
3. Gateway 校验 HTTP DTO，并根据登录方式映射到 `auth-service` 的对应 gRPC 请求
4. `auth-service` 按唯一真相源返回登录结果：
   - 登录成功
   - 需要 MFA
   - 需要账号选择
5. Gateway 将结果转换为前端友好的 HTTP 响应模型
6. 若结果为登录成功，Gateway 可在后续由前端显式调用 `GET /api/v1/me/context` 获取初始化上下文
7. 若结果为 `MFA_REQUIRED` 或 `ACCOUNT_SELECTION_REQUIRED`，前端必须继续调用对应流程接口，而不是把 `login` 视为最终成功

设计约束：

- 登录结果语义以 [auth-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/auth-service.md) 为准
- Gateway 负责入口 contract、mapping 与返回模型
- 不要求 `auth-service` 直接面向前端暴露其 gRPC message 结构

### 13.1.1 Challenge 请求

对于 OTP 主认证或 MFA challenge 发起类场景，Gateway 应支持独立的 challenge request 接口。

推荐时序如下：

1. 客户端调用 `POST /api/v1/auth/challenges/request`
2. Gateway 根据 `flowType` 与 `method` 映射到 `auth-service` 的 challenge issuance 能力
3. `auth-service` 按唯一真相源返回 `challengeId / expiresAt / destination`
4. Gateway 返回前端可消费的 challenge 摘要

说明：

- 该接口主要适用于邮箱 OTP 登录、手机 OTP 登录、MFA OTP challenge 等需要“先发码后提交”的场景
- 并非所有登录方式都必须经过该接口

### 13.1.2 Challenge 响应提交

对于需要补 MFA 或 challenge 验证的流程，Gateway 应支持统一的 challenge response 接口。

推荐时序如下：

1. 客户端调用 `POST /api/v1/auth/challenges/respond`
2. Gateway 校验 `challengeId / response / method` 等 HTTP 字段
3. Gateway 调用 `auth-service` challenge submit 能力
4. `auth-service` 按唯一真相源返回后续状态：
   - 进入账户选择
   - 或直接最终成功
5. Gateway 返回统一认证响应模型

设计约束：

- `challengeId` 是流程状态标识，不应由前端自行伪造流程语义
- Gateway 只负责 contract 与 mapping，不定义 challenge 真相

### 13.1.3 账户选择

对于多账户用户，Gateway 应支持正式的 account-selection 流程接口。

推荐时序如下：

1. 客户端调用 `POST /api/v1/auth/account-selection`
2. Gateway 校验 `userId / accountId / loginMethod` 等必要字段
3. Gateway 调用 `auth-service.selectAccount`
4. `auth-service` 按唯一真相源执行 account selection、session 建立与 token 签发
5. Gateway 返回最终登录成功响应

说明：

- account selection 是正式流程节点，不应被浏览器本地逻辑吞掉
- 当前 `auth-service` 唯一真相源已明确存在 `SelectAccount` 能力，Gateway 应以正式接口承接

### 13.2 刷新会话

刷新场景推荐时序如下：

1. 客户端调用 `POST /api/v1/auth/refresh`
2. Gateway 校验 refresh token 相关 HTTP 请求结构
3. Gateway 调用 `auth-service.refreshSession`
4. `auth-service` 按唯一真相源返回新的会话结果
5. Gateway 输出统一的 session response

设计约束：

- refresh token 的有效期与轮换策略以 [auth-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/auth-service.md) 为准
- Gateway 不定义自己的 refresh 状态机

### 13.3 登出

登出场景推荐时序如下：

1. 客户端调用 `POST /api/v1/auth/logout`
2. Gateway 从认证态与请求体中恢复会话上下文
3. Gateway 调用 `auth-service.logout`
4. `auth-service` 按唯一真相源执行会话失效
5. Gateway 返回统一成功响应

### 13.4 初始化上下文

`GET /api/v1/me/context` 应作为第一阶段最重要的场景型 BFF 接口。

推荐时序如下：

1. 客户端携带 access token 调用 `GET /api/v1/me/context`
2. Gateway 完成登录态恢复
3. Gateway 从 token / session 中恢复最小操作者上下文
4. Gateway 并行或分阶段调用：
   - `auth-service`：确认会话 / 当前登录信息
   - `identity-service`：获取 user、account、tenant、org memberships 等展示信息
   - `permission-service`：获取前端消费所需权限码、菜单装配所需授权信息
5. Gateway 聚合响应，输出前端初始化所需视图模型

设计目标：

- 前端只消费一个聚合好的初始化接口
- 不再自行拼接多个 IAM 服务接口

### 13.5 菜单与权限码

第一阶段建议拆成两个可独立缓存与演进的接口：

- `GET /api/v1/iam/menu-tree`
- `GET /api/v1/iam/permissions`

推荐协作方式：

- `permission-service` 提供权限与授权真相
- Gateway 负责按前端消费语义装配返回模型
- 若菜单需要与租户、产品配置、功能开关联动，Gateway 可以在后续叠加其他来源

## 15. 第一批 HTTP Contract 草案

本节仅冻结第一阶段推荐的外部 HTTP contract 形状，用于指导 Gateway 重构；并不要求当前立即修改全部下游 gRPC 契约。

### 14.0 通用 contract 规则

第一阶段 6 个接口应统一遵循以下规则：

- 所有接口统一挂在 `/api/v1`
- 写接口使用 JSON body
- 读接口使用 query/path + Bearer token
- 成功响应使用统一网关响应包装时，业务 payload 应保持稳定语义
- 错误响应遵循 Gateway 统一 HTTP 错误模型

通用请求头：

- `Authorization: Bearer <access-token>`，适用于受保护接口
- `X-Request-Id`，可选；若客户端未传，由入口层生成

通用错误分类建议：

- `400 Bad Request`
  - DTO 校验失败
- `401 Unauthorized`
  - 未登录、token 无效、refresh token 无效
- `403 Forbidden`
  - 已登录但无权限访问该入口
- `409 Conflict`
  - 当前流程状态不允许
- `503 Service Unavailable`
  - 下游关键服务不可用

### 14.0.1 统一认证响应模型

除 `logout` 与 challenge request 外，认证相关接口建议共用统一响应结构，避免前端为不同登录方式维护多套解析逻辑。

建议结构：

```json
{
  "status": "SUCCESS",
  "nextStep": "NONE",
  "session": {
    "accessToken": "jwt",
    "refreshToken": "token",
    "expiresIn": 3600
  },
  "operator": {
    "userId": "user-id",
    "accountId": "account-id",
    "tenantId": "tenant-id",
    "displayName": "name"
  },
  "challenge": null,
  "accountOptions": []
}
```

字段说明：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `status` | enum | 是 | 当前认证结果状态 |
| `nextStep` | enum | 是 | 前端下一步动作 |
| `session` | object \| null | 否 | 登录成功或 refresh 成功时返回 |
| `operator` | object \| null | 否 | 当前确认的操作者上下文摘要 |
| `challenge` | object \| null | 否 | 需要继续挑战时返回 |
| `accountOptions` | array | 是 | 需要账号选择时返回，否则为空数组 |

建议枚举：

`status`

- `SUCCESS`
- `MFA_REQUIRED`
- `ACCOUNT_SELECTION_REQUIRED`
- `CHALLENGE_REQUIRED`

`nextStep`

- `NONE`
- `COMPLETE_MFA`
- `SELECT_ACCOUNT`
- `COMPLETE_CHALLENGE`

### 14.1 `POST /api/v1/auth/login`

定位：

- 对外统一主认证入口
- 内部根据登录方式映射到 `auth-service` 的具体主认证 gRPC 能力
- 该接口不是完整登录闭环的唯一接口

建议请求模型：

```json
{
  "method": "EMAIL_PASSWORD",
  "identifier": "user@example.com",
  "credential": "plain-or-otp",
  "tenantHint": "optional-tenant-code",
  "device": {
    "deviceId": "optional",
    "deviceName": "optional"
  }
}
```

说明：

- `method` 是 HTTP 入口级统一字段
- `identifier` 与 `credential` 是客户端友好语义
- Gateway 在内部把它映射到不同 gRPC request
- 当返回 `MFA_REQUIRED` 或 `ACCOUNT_SELECTION_REQUIRED` 时，前端应继续调用流程接口

字段定义：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `method` | enum | 是 | 登录方式 |
| `identifier` | string | 是 | 邮箱、手机号或后续扩展登录标识 |
| `credential` | string | 是 | 密码、OTP 或挑战凭证 |
| `tenantHint` | string | 否 | 客户端给出的租户提示值，不代表最终租户真相 |
| `device.deviceId` | string | 否 | 客户端设备标识 |
| `device.deviceName` | string | 否 | 客户端设备名称 |

建议登录方式枚举：

- `EMAIL_PASSWORD`
- `EMAIL_OTP`
- `PHONE_PASSWORD`
- `PHONE_OTP`

字段校验建议：

| 字段 | 校验建议 |
| --- | --- |
| `method` | 必须属于允许枚举 |
| `identifier` | 去首尾空格；长度限制；按 `method` 决定邮箱或手机号格式校验 |
| `credential` | 非空；长度上限限制 |
| `tenantHint` | 可选；非空时去首尾空格 |
| `device.*` | 可选；长度限制；不进入业务规则判断 |

下游映射原则：

- `EMAIL_PASSWORD` -> `auth-service.loginWithEmailPassword`
- `EMAIL_OTP` -> `auth-service.loginWithEmailOtp`
- `PHONE_PASSWORD` -> `auth-service.loginWithPhonePassword`
- `PHONE_OTP` -> `auth-service.loginWithPhoneOtp`

建议响应模型：

```json
{
  "status": "SUCCESS",
  "nextStep": "NONE",
  "session": {
    "accessToken": "jwt",
    "refreshToken": "token",
    "expiresIn": 3600
  },
  "operator": {
    "userId": "user-id",
    "accountId": "account-id",
    "tenantId": "tenant-id",
    "displayName": "name"
  }
}
```

成功分支字段要求：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `session.accessToken` | string | 是 | 访问令牌 |
| `session.refreshToken` | string | 是 | 刷新令牌 |
| `session.expiresIn` | number | 是 | 访问令牌剩余秒数 |
| `operator.userId` | string | 是 | 用户 ID |
| `operator.accountId` | string | 是 | 当前选定账号 ID |
| `operator.tenantId` | string | 是 | 当前租户 ID |
| `operator.displayName` | string | 否 | 展示名 |

对于需要下一步动作的情况：

- `MFA_REQUIRED`
- `ACCOUNT_SELECTION_REQUIRED`

应继续使用同一个 HTTP contract，通过 `status` / `nextStep` 返回，而不是把下游多种 gRPC message 直接暴露给前端。

`MFA_REQUIRED` 分支建议：

```json
{
  "status": "MFA_REQUIRED",
  "nextStep": "COMPLETE_MFA",
  "session": null,
  "operator": {
    "userId": "user-id"
  },
  "challenge": {
    "challengeId": "challenge-id"
  },
  "accountOptions": []
}
```

`ACCOUNT_SELECTION_REQUIRED` 分支建议：

```json
{
  "status": "ACCOUNT_SELECTION_REQUIRED",
  "nextStep": "SELECT_ACCOUNT",
  "session": null,
  "operator": {
    "userId": "user-id"
  },
  "challenge": null,
  "accountOptions": [
    {
      "accountId": "account-id",
      "tenantId": "tenant-id",
      "displayName": "Account Name"
    }
  ]
}
```

错误语义建议：

| 场景 | HTTP | 说明 |
| --- | --- | --- |
| DTO 不合法 | `400` | 入口参数错误 |
| 认证失败 | `401` | 账号、密码、OTP 不正确 |
| 登录流程状态不支持 | `409` | 当前登录流程不允许 |
| 下游 `auth-service` 不可用 | `503` | 入口应快速失败 |

### 14.1.1 `POST /api/v1/auth/challenges/request`

定位：

- 统一 challenge 发起入口
- 适用于 OTP 登录、MFA challenge 发起等需要先获取 challenge 的场景

建议请求模型：

```json
{
  "flowType": "LOGIN",
  "method": "EMAIL_OTP",
  "identifier": "user@example.com"
}
```

建议字段定义：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `flowType` | enum | 是 | challenge 所属流程 |
| `method` | enum | 是 | challenge 使用方式 |
| `identifier` | string | 是 | 邮箱、手机号等标识 |

建议枚举：

`flowType`

- `LOGIN`
- `MFA`

`method`

- `EMAIL_OTP`
- `PHONE_OTP`
- `TOTP`

建议响应模型：

```json
{
  "challenge": {
    "challengeId": "challenge-id",
    "flowType": "LOGIN",
    "method": "EMAIL_OTP",
    "expiresAt": "2026-03-30T12:00:00.000Z",
    "destination": "u***@example.com"
  }
}
```

错误语义建议：

| 场景 | HTTP | 说明 |
| --- | --- | --- |
| DTO 不合法 | `400` | 请求字段错误 |
| 当前流程不允许发起 challenge | `409` | 状态冲突 |
| 下游不可用 | `503` | challenge 发起失败 |

### 14.1.2 `POST /api/v1/auth/challenges/respond`

定位：

- 统一 challenge 提交入口
- 用于 MFA challenge 或 OTP challenge 的结果提交

建议请求模型：

```json
{
  "challengeId": "challenge-id",
  "method": "EMAIL_OTP",
  "response": "123456"
}
```

建议字段定义：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `challengeId` | string | 是 | challenge 标识 |
| `method` | enum | 是 | 当前 challenge 验证方式 |
| `response` | string | 是 | OTP、TOTP 或恢复码等 |

建议响应模型：

- 使用统一认证响应模型

设计要求：

- 允许返回 `SUCCESS`
- 允许返回 `ACCOUNT_SELECTION_REQUIRED`
- 不要求 Gateway 在本地推断 challenge 后续状态

错误语义建议：

| 场景 | HTTP | 说明 |
| --- | --- | --- |
| DTO 不合法 | `400` | 请求字段错误 |
| challenge 无效或已过期 | `401` | challenge 校验失败 |
| challenge 状态冲突 | `409` | 例如重复提交 |
| 下游不可用 | `503` | challenge 提交失败 |

### 14.1.3 `POST /api/v1/auth/account-selection`

定位：

- 正式承接多账户登录后的账户选择流程

建议请求模型：

```json
{
  "userId": "user-id",
  "accountId": "account-id",
  "loginMethod": "EMAIL_PASSWORD"
}
```

建议字段定义：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `userId` | string | 是 | 当前认证用户 ID |
| `accountId` | string | 是 | 选定的账户 ID |
| `loginMethod` | enum | 是 | 原始主认证方式 |
| `device.deviceId` | string | 否 | 设备标识 |
| `device.deviceName` | string | 否 | 设备名称 |

说明：

- 当前 `auth-service` 已要求调用方显式携带原始 `loginMethod`
- 设备上下文可继续沿用 Gateway 入口输入，但不应在文档中假定已经通过共享 metadata 自动透传

建议响应模型：

- 使用统一认证响应模型
- 成功时返回最终 `session + operator`

错误语义建议：

| 场景 | HTTP | 说明 |
| --- | --- | --- |
| DTO 不合法 | `400` | 请求字段错误 |
| 账户不属于该用户或不可进入 | `403` | 账户归属 / 启用状态校验失败 |
| 认证流程状态冲突 | `409` | 无法进入账户选择完成态 |
| 下游不可用 | `503` | 账户选择提交失败 |

### 14.2 `POST /api/v1/auth/refresh`

建议请求模型：

```json
{
  "refreshToken": "refresh-token"
}
```

字段定义：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `refreshToken` | string | 是 | 由先前登录或刷新返回的 refresh token |

字段校验建议：

- 非空
- 长度上限限制
- 不在 Gateway 层解析 token 内部业务语义

建议响应模型：

```json
{
  "session": {
    "accessToken": "jwt",
    "refreshToken": "new-refresh-token",
    "expiresIn": 3600
  }
}
```

字段定义：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `session.accessToken` | string | 是 | 新 access token |
| `session.refreshToken` | string | 是 | 若采用轮换则返回新 refresh token |
| `session.expiresIn` | number | 是 | 新 access token 剩余秒数 |

错误语义建议：

| 场景 | HTTP | 说明 |
| --- | --- | --- |
| DTO 不合法 | `400` | body 错误 |
| refresh token 无效或已过期 | `401` | 不区分过细内部原因 |
| 下游不可用 | `503` | 刷新链路失败 |

### 14.3 `POST /api/v1/auth/logout`

建议请求模型：

```json
{
  "scope": "CURRENT_SESSION"
}
```

可扩展值包括：

- `CURRENT_SESSION`
- `OTHER_DEVICES`
- `ALL_SESSIONS`

第一阶段可先只实现 `CURRENT_SESSION`，但 contract 设计上应预留枚举空间。

字段定义：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `scope` | enum | 否 | 登出范围，默认 `CURRENT_SESSION` |

校验建议：

- 若未传则默认 `CURRENT_SESSION`
- 非法枚举值直接 `400`

建议响应模型：

```json
{
  "success": true
}
```

错误语义建议：

| 场景 | HTTP | 说明 |
| --- | --- | --- |
| 未登录 | `401` | 需要有效 access token |
| scope 非法 | `400` | DTO 校验失败 |
| 下游不可用 | `503` | `auth-service` 不可用 |

### 14.4 `GET /api/v1/me/context`

定位：

- 第一阶段核心 BFF 接口

建议响应模型：

```json
{
  "operator": {
    "userId": "user-id",
    "accountId": "account-id",
    "displayName": "name"
  },
  "tenant": {
    "id": "tenant-id",
    "code": "tenant-code",
    "name": "tenant-name"
  },
  "org": {
    "currentOrgId": "org-id"
  },
  "authorization": {
    "roles": ["role-id-1"],
    "permissions": ["iam.user.read", "iam.role.read"]
  },
  "navigation": {
    "defaultHome": "/workbench"
  }
}
```

说明：

- 此响应是前端消费模型，不应与任一下游服务单独返回结构一一对应
- `authorization.permissions` 对前端是消费视图，不等价于要求 `operator_context` 长期传播完整权限

建议字段定义：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `operator.userId` | string | 是 | 当前用户 ID |
| `operator.accountId` | string | 是 | 当前账号 ID |
| `operator.displayName` | string | 否 | 当前展示名 |
| `tenant.id` | string | 是 | 当前租户 ID |
| `tenant.code` | string | 否 | 租户编码 |
| `tenant.name` | string | 否 | 租户名称 |
| `org.currentOrgId` | string | 否 | 当前主组织或当前上下文组织 |
| `authorization.roles` | string[] | 是 | 当前角色 ID 摘要 |
| `authorization.permissions` | string[] | 是 | 前端消费的权限码摘要 |
| `navigation.defaultHome` | string | 否 | 默认首页路径 |

后续可扩展字段建议：

- `org.memberships`
- `featureFlags`
- `terminalAccess`
- `workbench`

错误语义建议：

| 场景 | HTTP | 说明 |
| --- | --- | --- |
| 未登录 | `401` | access token 无效 |
| 当前账号上下文不完整 | `409` | 登录成功但上下文尚未确定 |
| 关键下游不可用 | `503` | 无法构造完整上下文 |

### 14.5 `GET /api/v1/iam/menu-tree`

建议响应模型：

```json
{
  "items": [
    {
      "id": "menu-iam",
      "title": "IAM",
      "path": "/iam",
      "children": []
    }
  ]
}
```

设计要求：

- 返回模型服务于前端导航消费
- 不直接暴露 `permission-service` 内部角色或策略模型

建议字段定义：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `items[].id` | string | 是 | 稳定菜单 ID |
| `items[].title` | string | 是 | 菜单显示名称 |
| `items[].path` | string | 是 | 前端路由路径 |
| `items[].icon` | string | 否 | 图标标识 |
| `items[].children` | array | 是 | 子菜单 |
| `items[].order` | number | 否 | 排序权重 |
| `items[].meta` | object | 否 | 前端导航扩展信息 |

设计约束：

- `menu-tree` 是展示摘要，不是权限真相源
- 菜单可见性可以依赖权限摘要，但不应与角色模型硬耦合
- 后续允许叠加租户产品包、终端准入、功能开关等来源

错误语义建议：

| 场景 | HTTP | 说明 |
| --- | --- | --- |
| 未登录 | `401` | access token 无效 |
| 无权限访问导航摘要 | `403` | 少数受限终端可拒绝 |
| 下游不可用 | `503` | 无法装配菜单摘要 |

### 14.6 `GET /api/v1/iam/permissions`

建议响应模型：

```json
{
  "codes": [
    "iam.user.read",
    "iam.role.read"
  ]
}
```

设计要求：

- 面向前端只暴露必要消费视图
- 不直接暴露复杂授权决策细节

建议字段定义：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `codes` | string[] | 是 | 当前前端可消费的权限码摘要 |

设计约束：

- `codes` 是消费摘要，不是长期传播的 operator context 原文
- 不返回策略 AST、资源级 explain、下游判定细节

错误语义建议：

| 场景 | HTTP | 说明 |
| --- | --- | --- |
| 未登录 | `401` | access token 无效 |
| 下游不可用 | `503` | 无法构造权限摘要 |

### 14.7 第一批 contract 与下游能力的映射边界

第一阶段建议保持以下映射策略：

| HTTP 接口 | 主要下游来源 | 说明 |
| --- | --- | --- |
| `POST /auth/login` | `auth-service` | Gateway 按 `method` 分流到不同 gRPC 登录能力 |
| `POST /auth/challenges/request` | `auth-service` | 统一 challenge 发起入口 |
| `POST /auth/challenges/respond` | `auth-service` | 统一 challenge 提交入口 |
| `POST /auth/account-selection` | `auth-service` | 多账户选择后完成最终登录 |
| `POST /auth/refresh` | `auth-service` | 统一 refresh 入口 |
| `POST /auth/logout` | `auth-service` | 统一 logout 入口 |
| `GET /me/context` | `auth-service` + `identity-service` + `permission-service` | 典型聚合接口 |
| `GET /iam/menu-tree` | `permission-service` + Gateway 本地装配 | 第一阶段可由权限摘要驱动菜单装配 |
| `GET /iam/permissions` | `permission-service` | 面向前端的权限码摘要 |

需要特别强调：

- HTTP contract 可以稳定，但下游映射可以逐步演进
- 不要求第一阶段所有 HTTP 字段都在某一个下游接口中天然存在
- Gateway 的职责就是把多个内部能力整理成稳定的客户端契约

## 16. APISIX 第一阶段接入建议

若当前阶段希望尽快接入 APISIX，推荐以“最小闭环”而非“全量替换”方式推进。

### 15.1 第一阶段必须接入的能力

- Gateway 上游转发
- 基础限流
- CORS
- request id
- TLS / HTTPS，若环境已具备证书与域名

### 15.2 第一阶段不建议急于接入的能力

- 复杂认证插件编排
- 深度定制插件
- 过早把 OES 特有 operator 语义挪到 APISIX

原因：

- 这些能力会显著增加调试与治理复杂度
- 当前 OES 的核心问题仍然是 Gateway / BFF 契约与协作边界尚未稳定

### 15.3 第一阶段接入后的实现要求

即使接入 APISIX，Gateway 仍必须保留：

- DTO 校验
- contract mapping
- context 传播
- BFF 聚合
- 统一错误模型

不能因为 APISIX 已经上线，就让 Gateway 退化成“把 proto 直接暴露给前端”的薄层。

## 17. 当前阶段的实施约束

在正式进入 `api-gateway` 重构前，应先完成以下事项：

- 冻结 Gateway / APISIX 职责边界
- 冻结第一批前端消费契约
- 明确与 `auth-service`、`identity-service`、`permission-service` 的协作方式
- 明确 context 传播基线
- 明确哪些现有接口保留为过渡薄代理，哪些接口改造为场景型 BFF

在未完成上述设计前，不建议直接大规模重写 Gateway 实现。

## 18. 当前阶段结论

对 OES 而言，Gateway 的正确长期定位不是“自己写一个万能网关”，也不是“把所有问题都交给 APISIX”，而是：

- 用 APISIX 承担统一入口治理
- 用 NestJS `api-gateway` 承担面向客户端的应用聚合
- 用显式 contract 分离保证前端契约与内部服务契约各自稳定

这应作为 OES 后续 Gateway 重设计与 APISIX 接入的正式基线。
