# OES 统一返回与异常架构设计

> 涉及 permission-service 的服务职责、核心对象或 owner 边界时，以 [permission-service.md](../services/permission-service.md) 为准；本文只描述响应、异常与调用错误传播规则。

## 1. 文档目的

本文档用于冻结 OES 项目中 HTTP、gRPC、多层服务调用与第三方依赖接入场景下的统一返回与异常处理模型，作为后续 Gateway 重构、子服务治理与公共异常基线收敛的项目级依据。

本文档回答的问题包括：

- HTTP 成功与失败响应应如何统一
- gRPC 成功与失败响应应如何统一
- 业务异常、校验异常、授权异常、基础设施异常应如何分类
- 多层调用时异常应如何透传、翻译与映射
- adaptor 层何时可以捕获异常，何时不应捕获
- 第三方 provider 异常应如何被包装与暴露
- 权限判定链路在依赖失败时应如何 fail closed 且保持可观测

## 2. 设计结论

OES 应采用“传输状态与业务错误码分离”的统一异常模型。

核心结论如下：

- HTTP body 中的 `code` 永远表示稳定业务码或系统码，不表示 HTTP status
- gRPC transport status 与业务错误码必须显式分离
- Gateway 负责统一 HTTP 外层响应模型
- 微服务 gRPC 成功响应保持原始 proto response，不额外包统一 envelope
- 异常链路必须保留业务语义，禁止在中间层被无差别抹平
- tracing 记录属于观测能力，应由 `tracing/` 下的公共 helper 提供，而不是通过“filter 串 filter”完成
- `safeGrpcCall` 负责技术层分类，adaptor 默认透传异常
- 只有在明确边界翻译或明确降级时，adaptor 才允许选择性捕获异常
- 第三方 provider 异常必须先映射成本系统异常，再向上传递
- 权限判定链路采用 `Fail Closed but Observable`

## 3. 问题背景

当前代码中已经存在一定的统一机制，例如：

- Gateway 对 HTTP 成功响应做统一包装
- 微服务通过共享异常基类表达业务异常
- `safeGrpcCall` 已经开始区分业务异常与基础设施异常

但当前仍存在几个结构性问题：

- `code` 字段在不同层承担了不同语义
- `messageKey` 未沿异常链路稳定传播
- gRPC exception filter 仍存在历史分叉
- 一部分 adaptor 会 catch-all 并抹平下游异常
- 某些权限相关调用会把依赖失败伪装成普通 deny
- 查询型接口在“查不到”场景下仍存在返回空对象与抛异常混用的情况

这些问题会直接导致：

- 前端无法稳定依赖错误码
- 多层调用排障困难
- 上游无法区分业务失败与依赖失败
- Gateway/BFF 无法形成稳定的外部错误契约

## 3.1 当前推进进度

截至 `2026-03-31`，本设计已有第一批实现落地，当前进度如下：

- `common`
  - 已删除历史 `MicroserviceExceptionsFilter`
  - 已统一 `GrpcExceptionFilter` 为 `RpcException(payload)` 风格
  - 已将校验异常从 `domain` 调整为 `application`
  - 已将 HTTP / gRPC 异常 payload 调整为“transport status 与业务码分离”
  - 已删除 `OtelExceptionFilter`，改为由 `tracing/record-exception.ts` 提供公共异常记录 helper
- `api-gateway`
  - 已统一成功响应 envelope，补充 `meta.traceId / requestId / timestamp`
  - 已统一失败响应 envelope，HTTP body 中的 `code` 已固定为稳定业务码
  - 已补定向单测覆盖成功包装、下游业务异常映射、下游基础设施异常映射、HTTP 校验异常映射
- `auth-service`
  - 已清理 `identity-service` / `permission-service` adaptor 中的关键 catch-all 与 `return false`
  - 已将通知链路拆分为：
    - `AUTH_NOTIFICATION_UPSTREAM_UNAVAILABLE`
    - `AUTH_OTP_DELIVERY_REJECTED`
  - 已避免将通知中心依赖故障伪装成普通业务拒绝
  - 已接入 gRPC request context store / interceptor
  - 已将 `auth-service -> identity-service / permission-service / notification-service` 二跳链路统一接到 propagation factory
  - 已补针对性单测验证二跳 `requestId / traceId` 续传，以及 notification source context 写入
- `identity-service`
  - 已确认 query handler 采用 optional result 风格
  - 已补定向测试锁定 `getUserById / getAccountById` 查不到时返回空对象
  - 已接入 gRPC request context interceptor，用于承接管理入口的多跳传播上下文
  - 已将 `identity-service -> permission-service` 这条共享权限解析二跳链路接到 propagation factory
  - 已补定向测试验证共享 `permission-service` 读取 adaptor 的行为未回归
  - `test:unit` 已通过，用于验证 optional result 与 `Fail Closed but Observable` 未引入回归

当前仍未完成的部分包括：

- 将同一套异常传播规则继续推广到更多 Gateway / BFF 接口
- 继续收敛更多服务中的 adaptor 异常边界
- 为更多多层调用链补充端到端或集成级测试
- 审查并继续收敛其他确有二跳 / 三跳调用的服务

## 4. 设计原则

统一返回与异常模型必须遵循以下原则：

- 业务错误码稳定优先于传输层细节
- 传输状态与业务语义必须分离
- 成功路径与失败路径都必须可观测
- 业务异常尽量透传语义，不在中间层随意改写
- 基础设施异常允许在边界处翻译为“本服务依赖不可用”
- 不允许把依赖失败伪装成正常业务结果
- 不允许把第三方原始错误结构直接暴露给前端
- 所有对外错误都应能关联 traceId / requestId

## 5. 统一返回模型

### 5.1 HTTP 成功响应

Gateway 对外成功响应统一采用如下结构：

```json
{
  "code": "SYS_000000",
  "message": "Success",
  "messageKey": "common.success",
  "data": {},
  "meta": {
    "traceId": "6b7c8d9e0f",
    "requestId": "req-123",
    "timestamp": "2026-03-31T10:00:00.000Z"
  }
}
```

约束如下：

- `code` 为稳定字符串码
- 成功固定为 `SYS_000000`
- `messageKey` 可供前端国际化使用
- `data` 承载业务响应体
- `meta` 承载追踪元数据

### 5.2 HTTP 失败响应

Gateway 对外失败响应统一采用如下结构：

```json
{
  "code": "AUTH_INVALID_CREDENTIALS",
  "message": "Invalid credentials",
  "messageKey": "auth.invalid_credentials",
  "details": {
    "field": "credential"
  },
  "meta": {
    "traceId": "6b7c8d9e0f",
    "requestId": "req-123",
    "timestamp": "2026-03-31T10:00:00.000Z"
  }
}
```

约束如下：

- HTTP status 仅通过响应状态表达，不进入 body 的 `code`
- `code` 永远表示稳定业务码或系统码
- `details` 仅允许放安全可暴露信息
- 禁止把 stack、SQL、第三方原始响应、敏感配置直接透给前端

### 5.3 gRPC 成功响应

gRPC 成功响应不做统一 envelope，继续采用 proto response 原始结构。

原因如下：

- gRPC 本身已具备稳定 schema
- 成功 envelope 会污染 proto 设计
- 下游服务更应聚焦能力语义，而不是 HTTP 风格外壳

### 5.4 gRPC 失败响应

gRPC 失败响应应同时表达：

- transport status
- 业务错误码
- 国际化 key
- 可观测元数据

推荐内部载荷结构如下：

```ts
interface RpcErrorPayload {
  grpcStatus: number
  code: string
  message: string
  messageKey?: string
  details?: Record<string, any>
  meta: {
    service: string
    timestamp: string
    traceId?: string
  }
}
```

约束如下：

- `grpcStatus` 表达 transport status
- `code` 表达稳定业务码或系统码
- 二者禁止混用

## 6. 异常分类标准

### 6.1 Validation / Input Error

适用场景：

- DTO 字段缺失
- 格式非法
- 枚举值非法
- query / command 校验失败

归类规则：

- 归类为 `ApplicationException`
- HTTP 映射为 `400 Bad Request`
- gRPC 映射为 `INVALID_ARGUMENT`

说明：

- 这类错误表示“入口输入不满足契约”
- 不应被归类为领域规则失败

### 6.2 Domain Error

适用场景：

- 账户禁用
- 刷新令牌重放
- 账户归属不匹配
- 资源状态不允许当前操作

归类规则：

- 归类为 `DomainException`
- 应尽量保持业务语义稳定透传

### 6.3 Authentication / Authorization Error

适用场景：

- 未认证
- token 无效
- scope 不匹配
- 权限不足

归类规则：

- 按认证或授权失败表达
- HTTP 映射为 `401` 或 `403`
- gRPC 映射为 `UNAUTHENTICATED` 或 `PERMISSION_DENIED`

### 6.4 Infrastructure / Dependency Error

适用场景：

- gRPC unavailable
- 超时
- 数据库连接失败
- 第三方 provider 故障
- 下游资源耗尽

归类规则：

- 归类为 `InfrastructureException`
- 允许在边界处翻译为“本服务依赖不可用”

## 7. 多层调用异常传播规则

### 7.1 总体规则

多层调用应遵循以下传播规则：

1. 业务异常尽量透传
2. 基础设施异常允许在边界翻译
3. 不允许把依赖失败伪装成正常业务返回值
4. 不允许在不理解异常语义的层级做 catch-all 改写

### 7.2 `safeGrpcCall` 的职责

`safeGrpcCall` 只负责技术层分类，包括：

- 下游业务 `RpcException` 透传
- 超时包装为 infra 异常
- unavailable / internal / resource exhausted 包装为 infra 异常
- 未知连接类错误包装为 infra 异常

它不负责：

- 业务语义翻译
- 前端错误映射
- 权限决策

### 7.3 adaptor 的默认规则

adaptor 默认应：

- 发起下游调用
- 做 metadata 透传
- 做 request / response mapping
- 让 `safeGrpcCall` 的分类结果继续向上抛出

即：

- 若 adaptor 没有额外语义可加，则不应捕获异常

### 7.4 adaptor 可以捕获异常的场景

只有以下两类场景可以捕获异常：

- 明确边界翻译
- 明确降级策略

#### 明确边界翻译

示例：

- `auth-service` 不希望把“identity-service unavailable”作为上层公共语义
- 可以在明确识别 infra 异常后，翻译为 `AUTH_IDENTITY_UPSTREAM_UNAVAILABLE`

规则：

- 只翻译明确识别的异常类型
- 不得 catch-all 后统一改写所有异常

#### 明确降级策略

示例：

- 非关键推荐内容
- 次要统计信息
- 可延迟刷新挂件

规则：

- 必须在设计文档中显式声明
- 必须保留日志与观测信号
- 不适用于认证、授权、会话、主数据真相等核心链路

### 7.5 禁止的行为

以下行为明确禁止：

- 依赖失败时直接返回 `false`
- 依赖失败时返回 `null` 伪装成“查不到”
- catch 所有异常后统一改写为同一个 application error
- 将第三方 SDK 原始 error 原样暴露给上游

### 7.6 Tracing 与异常映射协同规则

异常 tracing 与协议映射必须解耦。

统一规则如下：

- `recordExceptionToActiveSpan()` 归属 `src/common/src/tracing/`
- `GatewayExceptionFilter` 负责 HTTP 异常 body 和 status 映射
- `GrpcExceptionFilter` 负责 gRPC `RpcException(payload)` 映射
- 协议专属 filter 在输出最终响应前调用 tracing helper
- 禁止再使用一个全量 `@Catch()` filter 先记录异常，再依赖重新 `throw` 交给下一个 filter

原因如下：

- Nest exception filter 不是 middleware 风格的稳定链式传递模型
- “先记录再 throw 给后续 filter” 在 HTTP 和 gRPC 上都可能产生不可预期行为
- tracing 属于横切观测能力，应以 helper 复用，而不是通过 filter 串联表达

## 8. 查询与命令的 not-found 语义

### 8.1 查询接口

查询接口建议采用 optional result 风格。

即：

- 查到则返回对象
- 查不到则返回空对象或 optional 字段为空
- 不将“查不到”视为系统异常

适用场景：

- `GetUserByEmail`
- `GetUserByPhone`
- `GetAccountById`

原因如下：

- 这类查询常用于存在性探测
- 对调用方而言，“不存在”往往是业务分支，而不是异常

### 8.2 命令接口

命令接口建议采用 strict not found 风格。

即：

- 操作目标不存在时抛 `NOT_FOUND`
- 不通过空对象表达命令失败

适用场景：

- 更新
- 删除
- 绑定
- 撤销
- 状态变更

原因如下：

- 命令表示显式状态变更
- 若目标不存在，说明变更请求本身无法成立

## 9. 权限判定规则

### 9.1 设计结论

权限判定链路采用：

- `Fail Closed but Observable`

即：

- 权限依赖失败时，请求不放行
- 但不得把依赖失败伪装成普通 deny

### 9.2 为什么不能简单返回 `false`

若权限服务不可用时直接返回 `false`，上层将无法区分：

- 用户真的无权限
- 权限服务本身挂了

这会导致：

- 安全策略虽然收紧，但系统故障被隐藏
- 排障困难
- 监控指标失真

### 9.3 推荐处理方式

推荐流程如下：

- 权限服务调用成功且 `allowed = false`
  - 返回 deny
- 权限服务调用失败
  - 抛出依赖异常
- guard 或上层统一将依赖异常映射为可观测失败

这意味着：

- 逻辑效果上依然 fail closed
- 但监控、日志、告警可以准确识别“是依赖挂了而不是普通拒绝”

## 10. 第三方 provider 异常处理

### 10.1 统一规则

所有第三方 API / SDK 调用必须经由 provider adaptor 封装。

例如：

- `SmsProviderAdaptor`
- `EmailProviderAdaptor`
- `OAuthProviderAdaptor`

这些 adaptor 负责：

- 发起第三方调用
- 识别第三方错误类型
- 将第三方错误翻译为本系统异常

### 10.2 禁止的做法

明确禁止：

- 在 application service 中直接写第三方 SDK 调用
- 将第三方原始 response / error 结构直接向上传递
- 直接将第三方文案暴露给前端

### 10.3 推荐异常映射

第三方 provider 常见错误可映射为：

- `EXTERNAL_TIMEOUT`
- `EXTERNAL_RATE_LIMITED`
- `EXTERNAL_PROVIDER_UNAUTHORIZED`
- `EXTERNAL_PROVIDER_MISCONFIGURED`
- `EXTERNAL_SERVICE_UNAVAILABLE`

随后，应用服务可视业务需要进一步翻译为本域错误，例如：

- `AUTH_OTP_DELIVERY_FAILED`
- `NOTIFICATION_EMAIL_DELIVERY_FAILED`

## 11. Gateway 映射规则

Gateway 负责：

- 统一 HTTP 成功 envelope
- 统一 HTTP 失败 envelope
- 将下游 gRPC transport status 映射为 HTTP status
- 保留稳定业务错误码与 messageKey
- 将 traceId / requestId 暴露给调用方

Gateway 不负责：

- 创造新的业务真相
- 擅自改写下游明确业务异常语义
- 暴露下游实现细节

## 12. 推荐改造顺序

建议按以下顺序推进实现收敛：

1. 删除历史 `MicroserviceExceptionsFilter`
2. 重构共享异常 payload，显式分离 transport status 与业务错误码
3. 统一 `GrpcExceptionFilter`
4. 将校验异常从 `domain` 调整为 `application`
5. 重构 Gateway 的 HTTP 失败 envelope
6. 清理 adaptor 中的 catch-all 与默认值吞异常
7. 收敛查询 / 命令的 not-found 语义
8. 为第三方 provider 建立统一 adaptor 规范

## 13. 与其他文档的关系

本文档与以下文档配套使用：

- `gateway-and-bff.md`
  - 定义 Gateway / BFF 的职责边界与 contract 分离原则
- `observability-and-audit.md`
  - 定义 trace、日志、审计的记录边界

若实现与本文档冲突，应以后续补充的 ADR 或更新版 architecture 文档为准。
