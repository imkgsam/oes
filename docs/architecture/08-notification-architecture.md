# OES Notification Service 架构设计

## 1. 文档目的

本文档用于冻结 OES 项目中 `notification-service` 的项目级架构边界、职责模型、交互方式与实施约束。

本文档回答的问题包括：

- 为什么 OES 需要独立的 `notification-service`
- 它与 `auth-service`、`identity-service`、`api-gateway`、业务域之间如何协作
- Email、SMS、IM、Push、Webhook 等渠道如何在统一边界下演进
- 如何同时支持第三方供应商接入与后续自建发送基础设施
- 哪些场景应走同步契约，哪些应走事件总线

## 2. 设计结论

OES 应建立独立的 `notification-service`，而不是让各业务服务分别直连邮件或短信供应商。

其核心定位是：

- 统一通知发送平台
- 统一模板、渠道、投递、回执、重试与成本治理平台
- 统一承接 Email、SMS、IM、Push、Webhook 等外发通道
- 为未来的邮件接收处理、消息分类、AI 辅助回复建议预留稳定边界

`auth-service`、业务服务、Workflow、AI 平台都可以依赖它，但不应将供应商耦合和发送规则散落在各个调用方内部。

这里需要特别强调：

- `notification-service` 是“统一外发通知与投递平台”
- 它不是“邮件工作台”本身
- 也不是 CRM / SRM / ERP 的完整外部通信中心

如果后续需要像飞书邮箱那样建设共享邮箱、线程工作台、责任制处理、SLA、业务关联、AI 阅读辅助与回复辅助，则应在 `communication / mailbox` 能力中承接，再由其调用 `notification-service` 完成最终外发投递。

## 3. 为什么必须独立成服务

### 3.1 从 OES 全局边界看

通知不是单一业务模块的局部工具，而是多个上下文共同依赖的平台能力：

- `auth-service` 需要 OTP、登录提醒、安全告警
- `workflow-service` 需要审批提醒、催办、超时通知
- CRM / SRM / Sales / Procurement 需要客户、供应商、内部协同通知
- AI 平台未来需要草拟消息、提取消息、建议回复
- 审计与运维需要观察消息投递、失败率、成本与告警

如果这些能力分散在各服务中，系统会快速出现：

- 供应商接入重复
- 模板规则分散
- 重试和幂等策略不一致
- 成本和回执无法统一治理
- 后续切换第三方或切换自建方案时返工面过大

### 3.2 从长期演进看

你当前尚未决定：

- 邮件走第三方 API、SMTP 中继，还是未来自建邮件服务器
- 短信走哪家供应商，是否需要双供应商容灾

这说明“发送提供方”本身就是变化边界。

在大型项目里，变化边界应被隔离在基础设施适配层之后，而不是直接暴露到认证或业务服务内部。

## 4. 领域边界

### 4.1 `notification-service` 负责什么

- 通知命令接收
- 通知模板管理与渲染
- 渠道路由
- 发送任务创建
- 供应商适配
- 重试、限速、退避、死信
- 投递状态追踪
- 回执、失败原因、统计与成本记录
- 通知审计与可观测性

### 4.2 `notification-service` 不负责什么

- 不负责认证语义真相
- 不负责 OTP 真相与校验
- 不负责账号、邮箱、手机号主数据真相
- 不负责租户、组织、权限主数据真相
- 不负责业务域中的审批、订单、工单等业务状态真相

### 4.3 与其他服务的边界

`auth-service`

- 负责生成 OTP、频控、挑战、认证审计语义
- 调用 `notification-service` 发出 OTP 类通知
- 不直接对接 Email/SMS 供应商

`identity-service`

- 负责人、账号、联系资产的主数据真相
- `notification-service` 不维护邮箱、手机号的主数据归属
- `notification-service` 仅在发送记录中保存目标地址快照

`api-gateway`

- 仍是外部入口
- 不承载通知模板、发送规则与投递逻辑

业务域服务

- 负责决定“为什么要通知”
- 不负责“怎么投递到外部渠道”

`communication / mailbox capability`

- 负责共享收件箱、外部通信线程、负责人认领、处理状态、SLA、业务关联、通信归档、AI 阅读与回复辅助
- 负责“如何把外部沟通当作业务过程管理”
- 最终仍调用 `notification-service` 完成 Email / SMS / IM 等渠道投递

## 5. 目标场景

### 5.1 第一阶段必须承接的场景

- Auth OTP Email
- Auth OTP SMS
- 登录锁定、安全提醒
- 审批提醒
- 订单 / 履约状态通知

### 5.2 第二阶段建议承接的场景

- 站内信 / IM 通道
- Push
- Webhook
- 批量通知
- 定时发送
- 通知偏好与退订治理

### 5.3 更后续场景

- 入站邮件接收与解析
- 多渠道编排与降级

说明：

- 邮件线程建模、统一收件箱工作台、AI 阅读辅助与回复辅助，不建议继续塞进 `notification-service`
- 这些能力应进入独立的 `communication / mailbox` 架构边界

## 6. 渠道模型

### 6.1 统一渠道抽象

推荐统一定义以下渠道类型：

- `EMAIL`
- `SMS`
- `IM`
- `PUSH`
- `WEBHOOK`

其中：

- `EMAIL / SMS` 是当前第一优先级
- `IM / PUSH / WEBHOOK` 是未来扩展渠道

### 6.2 渠道抽象原则

- 渠道是稳定平台语义
- 供应商不是平台语义
- 模板不是业务服务内部语义

也就是说：

- `EMAIL` 是平台层语义
- `smtp`、`ses`、`resend`、`sendgrid`、`twilio` 等只是基础设施适配器

## 7. Provider 抽象与自建兼容策略

### 7.1 供应商适配层原则

`notification-service` 内部应建立 provider-agnostic 抽象：

- `EmailProviderPort`
- `SmsProviderPort`
- 后续可扩展 `ImProviderPort`、`PushProviderPort`

每个渠道的应用服务只依赖统一端口，不依赖具体厂商 SDK。

### 7.2 Email 兼容策略

Email 渠道必须同时兼容两类实现：

- 第三方 API 型供应商
- SMTP 型发送设施

原因：

- 你当前尚未确定是否采用第三方
- 未来可能切换自建邮件服务器或内部 SMTP Relay

因此 Email provider 抽象不能假设“所有发送都一定基于 HTTP API”。

### 7.3 SMS 兼容策略

SMS 渠道应支持：

- 单供应商模式
- 主备供应商模式
- 按租户或区域路由

第一阶段可以只接单供应商，但抽象层不要写死。

### 7.4 大型项目最佳实践

推荐遵循以下经验：

- 调用方不感知供应商名称
- 供应商密钥与路由策略集中配置
- 失败原因标准化，不将原始厂商错误直接泄漏给调用方
- 发送请求与投递执行分离
- 支持幂等键与消息去重
- 支持 provider fallback，但不在调用链中无限重试

## 8. 模板模型

### 8.1 模板应归属 `notification-service`

模板属于通知平台能力，而不是 `auth-service` 或业务服务的实现细节。

推荐至少区分：

- 模板标识
- 渠道类型
- 模板版本
- 语言 / locale
- 变量定义
- 渲染结果

### 8.2 但业务语义不能被模板吞掉

模板平台不应反过来拥有业务规则真相。

例如 OTP 场景中：

- OTP 的生成、有效期、挑战真相归 `auth-service`
- 模板只负责把 `{code}`、`{ttlMinutes}`、`{maskedDestination}` 渲染为消息内容

### 8.3 推荐模板分类

- `AUTH_OTP_EMAIL`
- `AUTH_OTP_SMS`
- `AUTH_LOGIN_BLOCKED`
- `WORKFLOW_APPROVAL_ASSIGNED`
- `WORKFLOW_APPROVAL_ESCALATED`
- `ORDER_STATUS_CHANGED`

模板命名应稳定，避免使用供应商或界面语义命名。

## 9. 交互模型

### 9.1 总体原则

- 需要即时确认“通知请求是否被平台接受”时，走 gRPC
- 需要跨上下文扩散、可延迟处理、可重试时，走 Event Bus

### 9.2 `auth-service` 与 `notification-service`

对于 OTP 发送，推荐第一阶段使用同步 gRPC 提交通知请求：

- `auth-service` 需要知道通知请求至少已被接受
- 但不应同步等待外部供应商真正投递成功

因此推荐分成两层：

1. `auth-service -> notification-service`：同步 gRPC `SendNotification`
2. `notification-service` 内部：创建发送任务并异步投递到 provider

这是一种常见的大型系统折中：

- 调用方拿到“已受理”结果
- 平台内部保持异步解耦、可重试、可观测

### 9.3 业务域与 `notification-service`

业务域中的大多数通知，更推荐直接通过事件进入通知平台：

- 订单已创建
- 审批已分配
- 供应商已审核通过
- 发货状态已变更

事件到达 `notification-service` 后，再由它决定：

- 是否发送
- 发送给谁
- 用哪个模板
- 用哪个渠道

### 9.4 不推荐的模式

- 每个服务自己接供应商
- Gateway 直接负责发送通知
- 业务事件先渲染完整文案，再把“成品消息”塞给通知平台

## 10. 推荐协议形状

### 10.1 对调用方暴露的平台语义

推荐对外暴露的是平台命令，而不是供应商命令，例如：

- `SendEmail`
- `SendSms`
- 更推荐进一步统一为 `SendNotification`

如果第一阶段为了实现简单，可以先有：

- `SendEmail`
- `SendSms`

但中长期更推荐统一抽象：

- `CreateNotificationDispatch`

其最小输入应包括：

- `tenantId`
- `orgId`，如果适用
- `trace context`
- `source service`
- `notification category`
- `channel`
- `template key`
- `recipient`
- `variables`
- `idempotency key`
- `priority`

### 10.2 返回值设计

返回值建议不是“已送达”，而是：

- `accepted`
- `dispatchId`
- `normalized status`
- `rejected reason`，如果被平台拒绝

原因：

- 真正外部送达常常是异步结果
- 平台同步返回应代表“是否已受理”，而不是伪装成“已成功发送”

## 11. 发送状态模型

推荐至少统一以下状态：

- `ACCEPTED`
- `QUEUED`
- `SENDING`
- `SENT`
- `DELIVERED`
- `FAILED`
- `EXPIRED`
- `CANCELLED`
- `DEAD_LETTER`

说明：

- `SENT` 表示已提交到 provider
- `DELIVERED` 表示拿到明确送达回执
- 某些 provider 无法提供完整回执时，可以停留在 `SENT`

## 12. 数据模型建议

### 12.1 核心对象

建议 `notification-service` 至少拥有以下核心对象：

- `NotificationDispatch`
- `NotificationAttempt`
- `NotificationTemplate`
- `ChannelEndpointSnapshot`
- `ProviderRoute`

### 12.2 所有权要求

`NotificationDispatch`

- 通知请求真相

`NotificationAttempt`

- 每次供应商投递尝试真相

`NotificationTemplate`

- 模板与版本真相

`ChannelEndpointSnapshot`

- 发送目标快照

`ProviderRoute`

- 渠道路由与供应商选择策略

### 12.3 明确不存什么

- 不把 `identity-service` 的联系资产当成本服务主数据复制
- 不把 OTP、审批、订单等业务真相复制进通知库

## 13. 幂等、重试与死信

### 13.1 幂等

所有发送命令都应支持 `idempotencyKey`。

典型构造方式：

- `sourceService + businessType + businessId + recipient + templateKey`

OTP 场景下可以更具体：

- `auth-service + otpChallengeId + channel`

### 13.2 重试

推荐采用：

- 可配置最大重试次数
- 指数退避
- 区分可重试错误与不可重试错误

### 13.3 死信

超过阈值的消息进入 `DEAD_LETTER`，供人工排查或平台恢复。

### 13.4 大型项目经验

不要在调用方同步链路里做多次 provider 重试。

原因：

- 会拉长上游响应
- 会放大级联故障
- 会让调用方误以为通知平台可同步保证投递成功

## 14. 租户、权限与审计

### 14.1 多租户要求

所有通知请求必须显式带：

- `tenantId`
- `orgId`，若适用
- `source service`
- `trace context`

### 14.2 权限边界

通知平台负责“发送执行权限”的平台控制，不负责业务审批真相。

例如：

- 是否允许发送“审批通过通知”由业务服务决定
- 是否允许某个操作员管理模板、重发通知、查看投递明细，由通知平台管理面决定

### 14.3 审计要求

通知平台必须记录：

- 谁触发了发送
- 哪个服务触发
- 用了哪个模板
- 发给了谁
- 走了哪个渠道
- 走了哪个 provider route
- 结果如何
- 失败原因是什么

## 15. 与 `auth-service` 的专门边界

OTP 是通知平台落地时最先会碰到的场景，因此边界必须特别明确。

### 15.1 `auth-service` 负责

- 生成 OTP
- 保存 OTP
- 决定 OTP 用途
- 决定是否允许重发
- 决定挑战是否仍有效

### 15.2 `notification-service` 负责

- 将 OTP 相关变量渲染为 Email/SMS 内容
- 执行发送
- 管理投递状态
- 处理 provider 错误、重试和回执

### 15.3 不允许混淆的边界

- `notification-service` 不校验 OTP
- `auth-service` 不直接依赖供应商 SDK
- OTP 是否送达，不影响 OTP 真相是否存在

## 16. 与 `identity-service` 的专门边界

`identity-service` 拥有联系资产主数据，例如：

- 账号工作邮箱
- 个人邮箱
- 手机号资产

`notification-service` 应遵循：

- 发送时消费目标地址或联系资产引用
- 记录发送时快照
- 不成为联系资产主数据的归属服务

这能避免后续出现“通知平台里也有一份邮箱手机号真相”的双写问题。

## 17. 与未来自建邮件服务器的关系

如果未来自建邮件服务器，推荐将其视为 `notification-service` 的一个 `EmailProviderAdapter`，而不是把 `notification-service` 拆掉。

也就是说：

- 自建 SMTP Relay / Mail Server 是 provider implementation
- `notification-service` 仍然是平台边界

这样做的好处是：

- 上游服务不受影响
- 模板、审计、重试、回执、成本治理模型不变
- 后续可以同时支持自建与第三方双路由

必须进一步明确：

- 自建 SMTP / Mail Server 只应接在 `notification-service` 后面
- 不应让 `communication-service` 直接调用 SMTP / Mail Server

正确关系应为：

- `auth-service -> notification-service -> self-hosted SMTP`
- `communication-service -> notification-service -> self-hosted SMTP`

而不是：

- `auth-service -> self-hosted SMTP`
- `communication-service -> self-hosted SMTP`

## 18. 与现有 `mailbox-service / im-service` 概念的关系

如果项目后续仍需要：

- 入站邮件处理
- 邮件线程管理
- IM 会话与双向消息处理

推荐采用以下思路：

- `notification-service` 负责统一外发通知平台
- 邮件接收、IM 双向交互可作为 notification bounded context 下的后续子能力
- 不建议在当前阶段再分别建设多个彼此重叠的小服务

换句话说，现阶段优先收敛为一个清晰的 `notification-service` 平台边界，而不是同时做：

- `mailbox-service`
- `sms-service`
- `email-service`
- `im-service`

## 19. 职责矩阵与当前推荐栈

### 19.1 与 `communication-service`、基础设施的职责矩阵

| 能力 | `notification-service` | `communication-service` | 第三方 / 自建基础设施 |
| --- | --- | --- | --- |
| Email / SMS 投递受理 | 主责 | 不负责 | 承接真实发送 |
| 模板渲染 / 路由 / 重试 / 回执 | 主责 | 不负责 | 提供底层通道能力 |
| 线程工作台 / 认领 / SLA | 不负责 | 主责 | 不负责 |
| 业务关联 / 通信归档 / 内容审核 | 不负责 | 主责 | 原始邮件保留可协同 |
| SMTP / IMAP / POP3 / JMAP | 不负责 | 不负责 | 主责 |
| 反垃圾 / 病毒扫描 / 域名信誉 | 不负责 | 不负责 | 主责 |

### 19.2 OES 当前推荐技术栈

为保持与现有 system services 一致，当前推荐：

- 服务框架：`NestJS + CQRS + DDD`
- 内部同步契约：gRPC
- 主库：PostgreSQL + Prisma
- 幂等 / 缓冲 / 轻量队列协调：Redis
- 可观测与审计：沿用 OES 统一日志、指标、审计模型

### 19.3 当前推荐 provider 方向

若目标是先快速解除 `auth-service` 的真实发送阻塞，当前推荐：

- Email：Amazon SES
  - 支持 API 与 SMTP，既适合当前托管，也保留后续 SMTP 兼容路径  
    来源：[Amazon SES](https://aws.amazon.com/ses/), [SES docs](https://docs.aws.amazon.com/ses/latest/dg/Welcome.html)
- SMS：AWS End User Messaging SMS 或 Twilio
  - AWS 路线适合与 SES、AWS 账号治理和区域能力保持一致  
    来源：[AWS End User Messaging SMS](https://docs.aws.amazon.com/sms-voice/latest/userguide/what-is-sms-mms.html)
  - Twilio 路线适合更快承接全球短信与后续多消息通道扩展  
    来源：[Twilio SMS](https://www.twilio.com/docs/sms)

当前优先级建议：

1. 若 OES 基础设施偏 AWS：`Amazon SES + AWS End User Messaging SMS`
2. 若短信全球覆盖与多渠道扩展优先：`Amazon SES + Twilio`

## 20. 实施原则

### 20.1 第一阶段不做什么

- 不先接所有渠道
- 不先做完整营销消息平台
- 不先做入站消息解析
- 不先做复杂消息编排引擎

### 20.2 第一阶段最小目标

- 冻结通知平台边界
- 提供 Email / SMS 两个渠道
- 提供模板渲染与 provider 抽象
- 为 `auth-service` 提供 OTP 发送契约
- 建立幂等、重试、状态追踪和审计基线
- 明确与 `communication / mailbox` 工作台能力的职责分界

### 20.3 第二阶段目标

- 接审批和业务通知
- 加入事件驱动通知摄取
- 加入更细模板治理与路由策略

## 21. 当前推荐结论

当前 OES 最合理的方案是：

1. 建立独立 `notification-service`
2. 由其统一承接 Email / SMS 外发平台能力
3. 第一阶段先支撑 `auth-service` OTP 与少量平台通知
4. Provider 层保持可替换，兼容第三方 API 与未来自建 SMTP
5. 普通业务通知优先走事件总线，OTP 等即时场景先走同步 gRPC 受理 + 平台内部异步投递

这是一个兼顾边界清晰、运行现实、供应商可替换性和后续业务扩展能力的折中方案。
