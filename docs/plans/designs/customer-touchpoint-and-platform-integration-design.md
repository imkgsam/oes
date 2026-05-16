# Customer Touchpoint And Platform Integration Design

> 涉及 permission-service 的服务职责、核心对象或 owner 边界时，以 [permission-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/permission-service.md) 为准；本文只记录客户触点与平台集成设计过程。

## 1. 目标

- 为 OES 的“对外客户触点 / 第三方平台接入”建立长期设计工作台。
- 收敛公司官网、品牌官网、小程序、APP、经销商门户、售后入口、Amazon / 抖音 / 京东 / Shopify 等平台账号与 OES 的协同骨架。
- 冻结当前已经比较明确的对象边界、集成方向与第一阶段价值点。
- 为后续继续讨论 capability、connector、CRM / 订单 / 售后回流与实现顺序提供恢复入口。

## 2. 当前范围

本 workspace 负责：

- 品牌 / 公司档案与客户触点的对象边界。
- 自有客户触点与第三方平台账号的区分。
- OES 与不同触点 / 平台的通信方向与接入模式。
- 发布目录、动态、询盘、在线客服、报价请求、订单回流、售后入口等高价值场景的设计草稿。
- 第一阶段最小落地方向与未来扩展约束。

本 workspace 不负责：

- 直接建立新服务或实现代码。
- 冻结 CRM / OMS / 售后 / 内容管理的正式服务归属。
- 冻结完整品牌管理域模型。
- 冻结完整商城交易、支付、履约、会员模型。
- 冻结完整客服 IM 系统或社媒运营系统。
- 替代 `docs/architecture/**`、`docs/contracts/**` 中的稳定真相源。

## 3. 涉及对象

- services:
  - future external touchpoint / connector governance owner, not yet frozen
  - `product` / future product master owner
  - future CRM lead / inquiry owner
  - future content / CMS owner
  - future order / commerce owner
  - future service / after-sales owner
  - `identity-service`
  - `permission-service`
  - `auth-service`
- external channels / systems:
  - company websites
  - brand websites
  - WeChat mini program
  - mobile app
  - dealer portal
  - service / after-sales mini program
  - Amazon
  - Shopify
  - Taobao / JD / Pinduoduo / Douyin store
  - WeChat official account / video account
  - Xiaohongshu

## 4. 已冻结决定

| 日期 | 决定 | 影响范围 | 回写目标 |
| --- | --- | --- | --- |
| 2026-04-23 | 当前设计主题不是“建站器”，而是 OES 的对外客户触点与平台接入框架。 | 产品定位 | future architecture / feature packet |
| 2026-04-23 | 需要区分“品牌 / 公司档案”和“客户触点”；前者表达谁在对外经营，后者表达客户从哪里接触。 | 核心对象边界 | future architecture |
| 2026-04-23 | 需要区分“自有客户触点”和“第三方平台账号”；二者的底层集成方式不同。 | 集成边界 | future architecture / integration design |
| 2026-04-23 | 自有客户触点的默认主路是 `API first`，第三方平台账号的默认主路是 `connector first`。 | 接入模式 | future contracts / connector design |
| 2026-04-23 | 自有客户触点可采用混合模式：实时能力走 API，异步同步可走 webhook / push / callback。 | 自有触点集成方式 | future contracts |
| 2026-04-23 | 第三方平台账号通常需要专用 connector；webhook / polling / platform API 由 connector 统一适配，再映射成 OES 内部对象。 | 平台接入模式 | future integration design |
| 2026-04-23 | OES 应作为产品唯一真相源，但外部触点消费的应是“发布目录 / 对外版本”，不是内部产品主数据原样暴露。 | 产品与发布边界 | future product / content / channel contracts |
| 2026-04-23 | 触点与 OES 的协同程度应分级，而不是所有触点都一口气支持全功能。 | 功能规划方式 | future feature packet |
| 2026-04-23 | 在线客服、表单询盘、报价请求、售后申请等“互动入口”具有高价值，应作为第一阶段重点能力。 | 第一阶段价值判断 | future feature packet |

## 5. 当前对象草稿

### 5.1 品牌 / 公司档案

用于表达“谁在对外经营”。

当前草稿职责：

- 公司名称 / 品牌名称 / 对外展示名
- Logo、简介、联系方式、默认语言
- 对外动态 / 内容 / 品牌介绍归属
- 发布目录归属
- 客服 / 询盘 / 售后默认归属

当前判断：

- 这是高优先级对象，后续不应只从“域名”反推经营主体。
- 第一阶段可先用轻量对象承载，不急着展开成完整 Brand Service。

### 5.2 自有客户触点

指你们自己控制前后端的入口，例如：

- 公司官网
- 品牌官网
- WeChat mini program
- mobile app
- dealer portal
- service / after-sales mini program
- OEM / ODM customer portal

当前草稿属性：

- 触点类型
- 所属品牌 / 公司档案
- 面向客户类型
- 面向市场
- 功能能力包
- 访问标识
  - website: domain / subdomain
  - mini program: appId
  - mobile app: bundleId / packageName
- 接入凭证 / client

### 5.3 第三方平台账号

指你们在外部平台上的经营账号，例如：

- Amazon store
- Shopify store
- Taobao / JD / Pinduoduo / Douyin store
- WeChat official account
- Xiaohongshu account
- video account

当前草稿属性：

- 平台类型
- 账号 / 店铺 ID
- 所属品牌 / 公司档案
- 市场 / 区域
- 允许的同步能力
- 平台授权状态
- webhook / polling / token 配置

### 5.4 发布目录

用于承载外部可见的产品 / 内容版本，而不是内部真相本体。

当前草稿职责：

- 哪些产品允许对外展示 / 销售
- 哪套图片、文案、语言版本
- 是否显示价格
- 用哪套价格
- 是否显示库存摘要
- 面向哪些触点 / 平台 / 市场

### 5.5 能力包

当前不是独立服务设计，而是触点配置方式。

当前草稿能力分类：

- 展示
  - 公司介绍
  - 品牌介绍
  - 资质
  - Blog / 动态
  - 产品目录
- 互动
  - 在线客服
  - 表单询盘
  - 报价请求
  - 样品申请
- 客户账户
  - 注册 / 登录
  - 我的询盘
  - 我的订单
  - 我的售后
- 交易
  - 价格
  - 库存摘要
  - 下单
  - 履约状态
- 售后
  - 扫码识别产品
  - 知识库
  - AI 问答
  - 人工售后
  - 维修 / 换货申请
- 经销
  - 经销商价
  - 补货
  - 渠道政策
  - 物料下载
- 内容分发
  - 内容发布
  - 社媒分发
  - 评论 / 私信回流

## 6. 集成模式草稿

### 6.1 自有客户触点

当前冻结口径：

- 默认采用 `API first`
- 适合实时交互场景：
  - 读取发布目录
  - 提交询盘
  - 提交报价请求
  - 登录后查询订单 / 售后
- 可选采用 webhook / push / callback 做异步同步：
  - 内容 / 产品更新通知
  - 静态站重建
  - 本地缓存刷新
  - 状态更新通知

推荐理解：

```text
自有触点 = API first, webhook optional
```

### 6.2 第三方平台账号

当前冻结口径：

- 默认采用 `connector first`
- OES 需要为平台建立专用 connector
- connector 负责：
  - 调用平台 API
  - 接收平台 webhook
  - 轮询拉取平台数据
  - 验签 / 幂等 / 映射
  - 转换成 OES 内部对象或事件

推荐理解：

```text
第三方平台 = connector / webhook / polling first
```

### 6.3 webhook 与 connector 当前口径

当前冻结口径：

- webhook 是事件发生时，对方系统主动调用预先配置 URL 的通知方式。
- connector 是 OES 内部针对某个平台的专用适配层。
- 不同平台通常需要不同 connector。
- webhook 不是 connector 的替代品，而是 connector 可能采用的一种入站通知手段。

## 7. 当前高价值场景草稿

### 7.1 公司 / 品牌展示型触点

场景示例：

- 海外 OEM / ODM 官网
- 公司官网
- 品牌官网
- 展会落地页

高价值能力：

- 公司介绍、品牌介绍、资质、工厂实力
- 产品能力展示
- Blog / 新闻 / 动态
- 多语言、SEO
- 询盘、报价请求、在线客服

### 7.2 零售成交型触点

场景示例：

- 品牌独立站
- WeChat mini program mall
- mobile app mall

高价值能力：

- 产品目录
- 价格
- 库存摘要
- 下单 / 履约状态
- 客服

### 7.3 第三方交易平台账号

场景示例：

- Amazon
- Shopify
- Taobao / JD / Pinduoduo / Douyin store

高价值能力：

- 商品发布 / 更新
- 价格 / 库存同步
- 订单回流
- 评价 / 消息回流

### 7.4 经销 / 批发门户

场景示例：

- dealer portal
- B2B ordering portal

高价值能力：

- 经销商登录
- 分层价格
- 订货 / 补货
- 对账 / 政策 / 物料

当前判断：

- 价值明确，但实现复杂度较高
- 第一阶段可以后置，但模型必须预留

### 7.5 售后服务触点

场景示例：

- 扫码售后 WeChat mini program
- service portal

高价值能力：

- 产品扫码识别
- 使用说明 / 视频知识库
- AI 问答
- 人工售后
- 维修 / 换货 / 质量反馈

当前判断：

- 对陶瓷行业场景有较高价值
- 第一阶段可先预留为服务型触点

## 8. 当前未冻结问题

| 日期 | 问题 | 为什么未冻结 | 下一步 |
| --- | --- | --- | --- |
| 2026-04-23 | 这套能力最终是否沉淀为独立服务，还是先以 feature / module 方式落在现有边界中？ | 服务归属还不清晰，直接定服务容易过早。 | 先继续设计工作台，再决定是否形成 feature packet 或 service proposal。 |
| 2026-04-23 | “品牌 / 公司档案”是否需要上升为正式 brand/company domain object？ | 品牌未来可能很复杂，目前不宜仓促冻结完整 Brand Service。 | 先保持轻量对象草稿。 |
| 2026-04-23 | 互动入口应先落到 CRM、通知、还是 future conversation / service hub？ | 涉及多个 future domain，当前不宜仓促定 owner。 | 后续按 inquiry / chat / after-sales 分开讨论。 |
| 2026-04-23 | 发布目录是否由产品域 owner 直接承接，还是需要单独的 channel / catalog publishing capability？ | 涉及内容、价格、库存摘要与多触点发布协同。 | 后续讨论发布层设计。 |
| 2026-04-23 | 自有触点与第三方平台账号在产品界面上如何命名才最接地气？ | 当前讨论偏架构口径，面向业务用户的产品命名还未冻结。 | 后续做信息架构梳理。 |
| 2026-04-23 | 第一阶段最先落地的是展示型 + 互动型，还是要直接覆盖部分交易能力？ | 依赖产品、订单、库存、CRM 等多个域的 readiness。 | 由总控结合基础模块成熟度再排序。 |

## 9. 真相源回写计划

- services:
  - future service responsibilities once owner is clear
- collaborations:
  - future customer touchpoint / platform integration collaboration doc
- contracts:
  - future self-owned touchpoint capability APIs
  - future platform connector contracts
- feature packet:
  - future first-phase customer touchpoint foundation packet
- architecture / ADR:
  - only after naming, owner, and minimum phase are frozen

## 10. 恢复入口

- 下次继续前先读：
  - 本 workspace
  - `docs/plans/designs/README.md`
  - 与 CRM / product / order / service 相关的后续设计文档（待补）
- 当前推荐下一步：
  - 继续压实“自有触点 vs 第三方平台账号”的第一阶段对象和字段。
  - 讨论互动入口（询盘 / 在线客服 / 报价 / 售后）如何映射到 future CRM / service / notification。
  - 判断该主题是先形成 feature packet，还是继续作为长周期 design workspace 保留。
