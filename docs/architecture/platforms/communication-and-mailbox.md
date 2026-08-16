# OES Communication And Mailbox 架构设计

## 1. 文档目的

本文档用于冻结 OES 项目中“共享邮箱 / 外部通信工作台”能力的项目级边界。

本文档重点回答：

- 什么能力不应继续塞进 `notification-service`
- CRM / SRM / ERP 面向客户、供应商的外部沟通应如何建模
- 共享邮箱为什么不能只停留在“多人都能看见”
- 线程视图、责任制、处理状态、SLA、业务关联、通信归档和 AI 辅助如何形成一个真正可工作的邮件工作台

## 2. 设计结论

OES 需要区分两层能力：

- `notification-service`
  - 统一外发通知与投递平台
- `communication / mailbox capability`
  - 统一共享邮箱与外部通信工作台

两者关系是：

- `communication / mailbox` 负责“把通信过程管理起来”
- `notification-service` 负责“把消息送出去”

因此：

- OTP、审批提醒、系统告警等可直接走 `notification-service`
- CRM 给客户发产品推荐、ERP 给供应商发对账说明、财务共享邮箱处理对账争议，这类场景应进入 `communication / mailbox` 工作台，再由其调用 `notification-service`

## 3. 为什么不能只靠普通邮箱或普通通知平台

传统邮箱的常见问题：

- 一封一封独立查看
- 线程通过层层引用原文展示，越往来越臃肿
- 多人共享邮箱时，大家都看到了，但没人真正负责
- 邮件只和邮箱文件夹有关，不和业务对象有关
- 沟通历史散落在个人收件箱，难审计、难交接、难检索

传统通知平台的局限：

- 它只负责外发与投递
- 它不负责把通信当作工作项、责任项和业务过程管理起来

因此 OES 需要单独的 `communication / mailbox` 边界。

## 4. 核心场景

### 4.1 CRM 对客户沟通

例子：

- 客户咨询产品
- 销售回复报价
- 产品补充技术说明
- 后续继续围绕同一客户需求来回沟通

这里重点不是“发出一封邮件”，而是“管理一段客户沟通过程”。

### 4.2 SRM / ERP 对供应商沟通

例子：

- ERP 发对账单
- 供应商回复金额差异
- 财务或采购团队继续澄清
- 最终关闭该对账争议线程

这里重点也不是“投递出去”，而是“围绕对账单或供应商协同形成可追踪的通信闭环”。

### 4.3 共享职能邮箱

例子：

- `finance@company.com`
- `support@company.com`
- `sales@company.com`

这些共享邮箱必须具备责任制、状态和 SLA，而不是仅仅让所有成员都能同时看到邮件。

## 5. 核心能力模型

### 5.1 线程 / 会话视图

必须采用“消息化线程视图”，而不是继续沿用传统邮件层层嵌套引用的展示方式。

设计要求：

- 用户看到的不是一封一封孤立邮件
- 用户看到的是一条时间顺序的通信线
- 每一轮默认展示“本轮新增内容”
- 历史引用内容默认折叠
- 需要时可展开查看原始引用和原始 RFC 内容

这意味着：

- 存储层必须保留原始邮件内容
- 展示层必须做消息化重组

### 5.2 共享邮箱责任制

共享邮箱必须有正式责任制模型，否则一定会出现“大家都看到了，但没人处理”。

最小责任模型：

- `UNASSIGNED`
- `ASSIGNED`
- `IN_PROGRESS`
- `WAITING_INTERNAL`
- `WAITING_EXTERNAL`
- `RESOLVED`
- `CLOSED`

每个线程或工作项必须至少有：

- 当前负责人
- 最后处理人
- 最后动作时间
- 当前处理状态

### 5.3 认领 / 转派

认领 / 转派不是基于“每个成员邮箱里各有一份状态”，而是基于“共享邮箱中的统一工作项状态”。

也就是说：

- 邮件内容是共享可见的
- 处理状态是统一共享的
- 负责人是唯一明确的

因此可以支持：

- 认领
- 转派
- 升级
- 协助处理

### 5.4 处理状态

普通邮箱的“已读 / 未读”不足以支撑业务协作。

工作台必须支持业务处理状态，例如：

- `NEW`
- `UNASSIGNED`
- `ASSIGNED`
- `IN_PROGRESS`
- `WAITING_INTERNAL`
- `WAITING_EXTERNAL`
- `RESOLVED`
- `CLOSED`

展示层可以将其映射为更易懂的中文状态，如：

- 待处理
- 已认领
- 处理中
- 等待外部回复
- 已解决
- 已关闭

### 5.5 SLA 与超时提醒

SLA 不是高级扩展功能，而是共享邮箱和外部通信工作台的基础能力。

至少需要支持：

- 首次响应超时
- 长时间未认领
- 长时间无更新
- 已等待外部回复但未继续跟进

这类提醒可以用于：

- 客服
- 财务
- 销售
- 采购 / 供应商协同

### 5.6 标签与视图

这里不建议再走“无限创建文件夹”的传统方式。

更推荐使用：

- 系统标签
  - 例如 `高优先级`、`待法务确认`、`投诉`、`对账争议`
- 业务标签
  - 例如 `客户A`、`供应商B`、`订单异常`
- AI 建议标签
  - 自动分类出的标签

标签的意义不是替代文件夹，而是让通信线程能从业务角度被组织和筛选。

### 5.7 业务关联

业务关联是基础功能，不是扩展功能。

这里的设计结论是：

- 每条通信线程或邮件记录应支持与业务对象建立关联
- 业务对象页面应支持反查关联的通信记录

推荐采用“弱关联优先”的方式：

- `entityType`
- `entityId`

例如：

- `CUSTOMER: customer_123`
- `SUPPLIER: supplier_456`
- `ORDER: order_789`
- `AR_STATEMENT: statement_222`
- `TICKET: ticket_333`

这样做的好处是：

- 可以尽早落地
- 不需要一开始就把通信域与各业务域做深耦合
- 业务对象和通信对象之间可以双向检索

### 5.8 全量通信持久化与归档

所有对外通信记录都应被持久化。

这是：

- 业务需求
- 审核需求
- 交接需求
- 审计需求

因此它属于基础功能，而不是拓展功能。

最小要求：

- 收到的通信记录要保存
- 发出的通信记录要保存
- 与线程相关的处理动作要保存
- 负责人、状态变化、SLA 事件要保存
- 与业务对象的关联要保存

### 5.9 工作台视图

“统一收件箱工作台”应当是一个明确的操作界面模型，而不是模糊概念。

典型视图可包括：

- 线程列表
- 当前线程消息视图
- 当前负责人
- 处理状态
- SLA 截止时间
- 标签
- 关联业务对象
- 统计面板
  - 待办
  - 紧急
  - 超时
  - 我负责
  - 团队总量

这类工作台适合：

- 财务共享邮箱
- 客服共享邮箱
- 销售共享邮箱
- 采购 / 供应商共享邮箱

## 6. AI 接入原则

AI 不是最后附加的“总结按钮”，而应作为通信工作台中的受控增强能力。

### 6.1 第一层：阅读辅助

第一阶段优先支持：

- 摘要
- 翻译
- 关键信息提取
- 风险点提取
- 下一步建议

这是当前最有价值、风险也最低的 AI 接入层。

### 6.2 第二层：处理辅助

第二阶段建议支持：

- 自动分类
- 自动标签建议
- 负责人建议
- 优先级建议
- SLA 建议

### 6.3 第三层：回复辅助

第三阶段建议支持：

- 回复建议
- 说辞优化
- 基于往来历史生成草稿
- 基于关联业务对象生成草稿

重要原则：

- 默认输出草稿，不自动发送
- 人工确认仍是默认前提

### 6.4 第四层：风险与审查辅助

更高阶 AI 可用于：

- 敏感内容检查
- 外发风险提示
- 附件风险提示
- 是否需要审批的建议

## 7. 与 `notification-service` 的关系

`communication / mailbox` 不负责底层渠道投递。

它应将最终外发动作下沉给 `notification-service`。

推荐关系如下：

- `communication / mailbox`
  - 负责线程、工作项、负责人、状态、SLA、业务关联、归档、AI 辅助
- `notification-service`
  - 负责模板、渠道、provider、重试、回执、投递状态、成本与投递审计

### 7.1 CRM 场景

- CRM 选择客户与业务上下文
- `communication / mailbox` 建立线程、负责人、状态、草稿和业务关联
- `notification-service` 完成最终 Email / SMS 投递

### 7.2 ERP / SRM 场景

- ERP / SRM 选择供应商、单据与业务上下文
- `communication / mailbox` 管理对账或协同线程
- `notification-service` 完成外发投递

## 8. 与邮件基础设施的职责分层

`communication-service` 不应承担完整邮件基础设施职责。

应明确区分三层：

- 邮件基础设施层
- `notification-service`
- `communication-service`

### 8.1 邮件基础设施层负责什么

更适合由第三方服务或成熟开源组件承接的能力：

- SMTP / Submission
- IMAP / POP3 / JMAP 等访问协议
- 原始邮件收发
- 邮件原文存储
- 反垃圾邮件
- 病毒扫描
- DKIM / SPF / DMARC / MTA-STS 等邮件域安全能力
- 发信信誉与送达率相关能力
- Webmail 基础能力
- 底层邮箱规则和协议兼容

这些能力不应优先在 OES 中自研。

### 8.2 `notification-service` 负责什么

`notification-service` 负责“统一外发投递平台”，而不是完整邮箱产品。

典型职责：

- 模板渲染
- 渠道选择
- provider 路由
- 幂等
- 重试
- 投递状态
- 发送审计
- 与 Email/SMS/IM provider 或自建 SMTP 的适配

### 8.3 `communication-service` 负责什么

`communication-service` 负责“把外部通信当作业务过程管理起来”。

典型职责：

- 线程工作台
- 认领 / 转派
- 处理状态
- SLA
- 业务关联
- 通信归档
- AI 阅读辅助与回复辅助
- 业务与合规语义上的审核和风控

### 8.4 典型混淆项的归类

更偏邮件基础设施：

- IMAP
- POP3
- SMTP
- 垃圾邮件过滤
- 病毒扫描
- Webmail 基础能力

更偏 `communication-service`：

- 线程视图
- 共享邮箱责任制
- 认领 / 转派
- 处理状态
- SLA
- 业务关联
- 工作台统计
- 全量通信归档
- AI 摘要、翻译、提取、建议、回复草稿

两边都可能涉及，但职责不同：

- 黑名单 / 白名单
  - 投递安全层：更偏基础设施或 `notification-service`
  - 业务沟通对象限制：更偏 `communication-service`
- 搜索
  - 原始邮件全文索引：更偏基础设施
  - 按客户 / 供应商 / 状态 / SLA / 负责人检索：更偏 `communication-service`
- 联系人
  - 主数据真相：不归 `communication-service`
  - 通信视角引用与快捷操作：可在 `communication-service`

### 8.5 直接可执行的职责矩阵

| 能力 | 应落在 `communication-service` | 应落在 `notification-service` | 应交给基础设施 / 第三方 |
| --- | --- | --- | --- |
| 共享邮箱工作台 | 是 | 否 | 否 |
| 线程消息化展示 | 是 | 否 | 否 |
| 认领 / 转派 / 负责人 | 是 | 否 | 否 |
| 处理状态 / SLA | 是 | 否 | 否 |
| 业务关联 / 业务反查 | 是 | 否 | 否 |
| 通信归档 / 业务审计 | 是 | 否 | 部分原始邮件保留可由基础设施承担 |
| AI 摘要 / 翻译 / 提取 / 回复草稿 | 是 | 否 | 否 |
| 业务风控 / 内容审核 / 外发审批 | 是 | 否 | 底层安全扫描可协同基础设施 |
| Email / SMS 外发投递 | 否 | 是 | provider / SMTP / SMS 网关实际承接 |
| 模板渲染 / 渠道路由 / 重试 / 回执 | 否 | 是 | 否 |
| SMTP / Submission | 否 | 否 | 是 |
| IMAP / POP3 / JMAP | 否 | 否 | 是 |
| 反垃圾 / 病毒扫描 | 否 | 否 | 是 |
| DKIM / SPF / DMARC / MTA-STS | 否 | 否 | 是 |
| Webmail 基础能力 | 否 | 否 | 是 |

### 8.6 必须自研的部分

下面这些能力即使第三方邮箱或邮件基础设施提供了相近功能，也不应把 OES 的业务真相完全外包出去：

- 共享邮箱责任制
- 线程工作台
- 处理状态与 SLA
- 业务关联
- 全量通信归档
- 业务语义风控
- 内容审核与审批流
- AI 阅读辅助与回复辅助

原因：

- 这些能力直接绑定 OES 的业务对象、租户边界、权限与审计模型
- 即便第三方提供类似界面，也很难直接映射 CRM / SRM / ERP 的业务语义

### 8.7 优先复用而不是自建的部分

下面这些能力当前阶段更适合采用第三方或成熟开源软件：

- SMTP / Submission
- IMAP / POP3 / JMAP
- 反垃圾邮件
- 病毒扫描
- 邮件域名安全能力
- 原始邮件访问协议兼容
- 完整通用 Webmail

原因：

- 这些能力运维复杂度高
- 协议兼容、送达率与安全治理门槛高
- 不是 OES 当前最有差异化价值的部分

## 9. 技术选型建议

### 9.1 当前推荐路线

当前阶段最推荐的路线是：

- 底层邮箱基础设施优先使用第三方或成熟开源方案
- `notification-service` 和 `communication-service` 由 OES 自研

原因：

- OES 的核心价值不在于重写 SMTP / IMAP / 垃圾邮件过滤
- OES 的核心价值在于业务通信工作台、责任制、SLA、业务关联、AI 与审查控制

### 9.2 主线 MVP 推荐选型

对于当前主线，最推荐：

- `notification-service`
  - 先接第三方邮件发送服务和第三方短信服务
- `communication-service`
  - 先做工作台与归档模型
- 不先自建完整邮件基础设施

推荐原因：

- 能最快解除 `auth-service` 的真实邮件发送阻塞
- 能把工程重心放在业务工作台能力，而不是邮件协议和运维上

### 9.3 OES 当前推荐技术栈

为减少与现有系统风格分裂，当前推荐如下：

| 层级 | 当前推荐 |
| --- | --- |
| `communication-service` 服务框架 | `NestJS + CQRS + DDD`，与现有 system services 一致 |
| 内部同步契约 | gRPC |
| 持久化主库 | PostgreSQL + Prisma |
| 缓存 / SLA 计时 / 轻量工作状态 | Redis |
| 原始邮件正文 / 大附件归档 | S3 兼容对象存储 |
| 工作台查询增强 | 第一阶段先基于 PostgreSQL；全文检索量上来后再评估 OpenSearch |
| 外发投递 | 始终通过 `notification-service` |

说明：

- 第一阶段不建议为了搜索而先引入 OpenSearch
- 第一阶段也不建议让 `communication-service` 自己维护 SMTP / IMAP 客户端
- 先把线程、归档、责任制和 SLA 做稳，比先上复杂邮件底层更重要

### 9.4 Email / SMS 当前推荐 provider 方向

在尚未冻结最终供应商前，当前推荐方向是：

- Email first choice：Amazon SES
  - 原因：官方同时支持 API 与 SMTP 接入，便于先走托管方案、后续保留 SMTP 兼容路径  
    来源：[Amazon SES](https://aws.amazon.com/ses/), [SES SMTP interface](https://docs.aws.amazon.com/ses/latest/dg/send-email-smtp.html)
- SMS first choice：AWS End User Messaging SMS 或 Twilio
  - AWS 路线更适合想保持 AWS 体系一致、后续承接两步短信 / sender identity / country rules 的场景  
    来源：[AWS End User Messaging SMS](https://docs.aws.amazon.com/sms-voice/latest/userguide/what-is-sms-mms.html), [Getting started](https://docs.aws.amazon.com/sms-voice/latest/userguide/getting-started.html)
  - Twilio 路线更适合希望先快速接全球短信与后续多 messaging channel 扩展的场景  
    来源：[Twilio Programmable Messaging](https://www.twilio.com/docs/sms), [Twilio Messaging Channels](https://www.twilio.com/docs/messaging/channels)

当前默认建议：

1. 若 OES 基础设施整体偏 AWS：优先 `Amazon SES + AWS End User Messaging SMS`
2. 若更强调短信全球覆盖和后续 WhatsApp/RCS 渠道：优先 `Amazon SES + Twilio`

### 9.5 如果后期需要自建邮件基础设施

如果后期确实要走自建路线，推荐优先考虑：

- `mailcow`
  - 官方文档显示其是基于 Docker 的完整邮件套件，包含 Postfix、Dovecot、Rspamd、SOGo、反病毒、黑白名单和基础管理界面  
    来源：[mailcow docs](https://docs.mailcow.email/)
- `Mailu`
  - 官方文档显示其提供 SMTP / Submission、IMAP、Webmail、管理界面、反垃圾、反病毒、DKIM/SPF/DMARC 等完整能力  
    来源：[Mailu features](https://mailu.io/features.html)
- `Stalwart Mail Server`
  - 官方站点显示其支持 SMTP、IMAP、POP3、JMAP 等现代协议；若希望偏现代协议和后续可扩展，可以关注  
    来源：[Stalwart official](https://get.stalw.art/)
- `Bulwark`
  - 若未来选择 Stalwart，并希望搭配现代 Webmail，可作为其前端工作台候选  
    来源：[Bulwark official](https://bulwarkmail.org/)

说明：

- `mailcow` / `Mailu` 更像完整自托管邮箱套件
- `Stalwart + Bulwark` 更像偏现代协议的新路线
- 这些都属于邮件基础设施 / mailbox platform，不替代 OES 的 `communication-service`

### 9.6 如果优先使用第三方发送服务

当前更现实的第一阶段推荐是：

- 先采用托管发送服务承接 `notification-service` 的 Email channel

例如：

- Amazon SES
  - 官方文档明确支持 API 和 SMTP 接入，支持发送与接收，且有投递率、信誉与统计能力  
    来源：[Amazon SES](https://aws.amazon.com/ses/), [SES docs](https://docs.aws.amazon.com/ses/latest/dg/Welcome.html)

选择这类服务的原因：

- 先解决真实发信问题
- 避免当前阶段投入过多到底层邮件运维
- 保留后续切换到自建 SMTP 的空间，因为 `notification-service` 会把 provider 隔离在适配层后面

### 9.7 选型结论

当前推荐优先级：

1. 第三方托管发信服务 + OES 自研 `notification-service`
2. OES 自研 `communication-service`
3. 若未来确实要自建完整邮箱基础设施，再评估 `mailcow` / `Mailu` / `Stalwart`

## 10. 不建议的做法

- 用普通个人邮箱代替共享责任制工作台
- 让所有共享邮箱成员各自维护自己的处理状态
- 只保存“是否投递成功”，不保存完整通信过程
- 把业务关联做成深耦合强依赖再开始实现
- 让 AI 自动发送对外邮件作为默认模式

## 11. 实施优先级

### 第一优先级

- 消息化线程视图
- 共享邮箱责任制
- 认领 / 转派
- 处理状态
- SLA 提醒
- 业务关联
- 全量通信持久化与归档

### 第二优先级

- 标签体系
- 工作台统计面板
- AI 阅读辅助
- AI 分类与标签建议

### 第三优先级

- AI 回复辅助
- 审查与风险辅助
- 更复杂的审批与合规流程

## 12. 当前推荐结论

OES 如果要建设“像飞书但比传统邮箱更适合业务协作”的能力，不应只建设 `notification-service`。

更合理的目标结构是：

1. `notification-service` 作为统一投递平台
2. `communication / mailbox` 作为共享邮箱与业务通信工作台
3. 先把线程、责任制、状态、SLA、业务关联、全量持久化和 AI 阅读辅助做成基础能力
4. 再逐步进入回复辅助、审查与更复杂治理能力
