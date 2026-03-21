# Auth Service 文档索引

更新时间：2026-03-21 17:20:00 +08:00

本文档作为 `auth-service` 的主索引文档，定义认证中心在 `oes` 项目中的职责边界、功能集合、优先级、落地阶段与后续分片实现方向。详细实现时，后续应按本索引继续拆分到 `doc/func/*.md` 与对应 history 文档中。

## 1. 模块定位

`auth-service` 是 `oes` 的认证中心，负责“证明你是谁、当前能以什么身份进入系统、这次登录会话是否仍然可信”。

它应重点负责以下能力：

- 统一登录入口与认证编排
- 凭据校验与登录方式管理
- 会话生命周期管理
- 访问令牌与刷新令牌签发、轮换、撤销
- MFA 多因子认证
- 风险控制与登录安全策略
- 认证事件审计与安全运营支持

它不应直接承担以下职责：

- 用户主数据管理：归属 `identity-service`
- 角色、权限、策略判定：归属 `permission-service`
- 业务资源访问控制：由网关与业务服务配合完成
- 完整用户画像、组织关系、租户资料维护：归属 `entity-service` / `identity-service`

## 2. 设计目标

面向大型主流项目，`auth-service` 的设计目标应为：

- 高安全：最小暴露、默认拒绝、敏感操作可追踪
- 可扩展：支持密码、OTP、OAuth/OIDC、设备信任等多认证方式
- 可运营：支持风控、审计、封禁、会话治理、告警
- 可集成：对接 API Gateway、Identity、Permission、通知服务
- 可演进：先完成核心认证闭环，再逐步扩展高级安全能力
- 多端友好：支持 Web、移动端、小程序、桌面端、PDA
- 多租户兼容：认证归一，身份上下文与授权上下文解耦

## 3. 核心边界与协作

### 3.1 与 `identity-service` 的边界

`identity-service` 负责：

- 用户、账号、租户成员关系
- 账号启用/停用状态
- 用户是否存在、账号是否可用

`auth-service` 负责：

- 对登录凭据进行校验
- 校验通过后选择进入哪一个账号上下文
- 为用户和账号签发会话与令牌

结论：

- `userId` / `accountId` 应继续以 `identity-service` 为事实源
- `auth-service` 只保存认证域内数据，不复制用户主档

### 3.2 与 `permission-service` 的边界

`permission-service` 负责：

- 权限模型
- 角色模型
- 鉴权决策

`auth-service` 负责：

- 在令牌中携带最小必要身份上下文
- 向外提供会话可信度、认证等级、MFA 状态等安全上下文

结论：

- 认证成功不等于有权限
- 令牌中不应塞入大而全的权限快照，避免过期权限和超大 token

### 3.3 与 `api-gateway` 的边界

`api-gateway` 负责：

- 统一 HTTP 接入
- access token 基础校验
- 将认证后的用户上下文透传给后端服务

`auth-service` 负责：

- 提供登录、刷新、登出、会话查询、MFA 等接口
- 提供 token introspection / session validation 能力

## 4. 当前现状判断

结合当前仓库实现，`auth-service` 已有以下基础：

- 登录方式模型：`LoginMethod`
- 凭据模型：`Credential`
- OTP 模型：`OTP`
- 用户会话模型：`UserSession`
- 应用服务骨架：`AuthService`、`SessionService`、`MfaService`
- Redis / Prisma 基础设施雏形

当前主要缺口：

- 缺少正式索引文档与分层能力地图
- 对外 contract 过于简化，仅覆盖邮箱密码登录
- 风控、审计、设备信任、账号恢复等未系统设计
- 会话与 token 模型仍偏基础，缺少标准化安全策略
- MFA 模型与 schema 尚未完全闭环

当前状态建议标记为：`部分实现`

## 5. 已确认的全局设计决策

以下方案建议作为当前阶段的全局基线：

- 认证中心采用“认证域独立建模，身份主数据外置”的模式。
- `auth-service` 只维护认证相关聚合，不复制 `identity-service` 的用户主数据。
- Access Token 保持短生命周期，Refresh Token 必须支持轮换与撤销。
- Session 必须成为一等领域对象，不能只把 JWT 当作唯一状态来源。
- MFA 必须作为可编排能力，而不是写死在某一种登录方式中的分支逻辑。
- 登录方式与凭据分离建模是正确方向，应继续保留。
- OAuth/OIDC 应作为后续标准扩展能力预留，而不是先在本阶段强耦合落地。
- 风控策略应以“认证前置判定 + 认证后审计”双通道实现。
- 管理员强制下线、冻结会话、撤销全部 refresh token 必须是平台级标准能力。
- 认证事件必须可审计，并能与后续安全告警系统衔接。

## 6. 功能集合索引

下面的功能集合，是我从大型主流项目最佳实践角度，给 `auth-service` 建议的完整能力版图。后续每次实现建议只选择一个最小功能分片推进。

| 功能集合 | 阶段 | 优先级 | 当前状态 | 说明 |
|---|---|---|---|---|
| 6.1 登录与认证编排 | Phase 1 | P0 | 部分实现 | 统一登录入口、认证流程、账号选择 |
| 6.2 凭据与登录方式管理 | Phase 1 | P0 | 部分实现 | 密码、邮箱、手机号、第三方登录绑定 |
| 6.3 令牌与会话管理 | Phase 1 | P0 | 部分实现 | access/refresh token、会话治理 |
| 6.4 MFA 多因子认证 | Phase 1 | P0 | 部分实现 | TOTP、邮箱 OTP、短信 OTP、恢复码 |
| 6.5 登录安全与风险控制 | Phase 2 | P0 / P1 | 未开始 | 限流、设备识别、异常登录识别 |
| 6.6 认证审计与安全运营 | Phase 2 | P1 | 未开始 | 登录事件、风控事件、管理员操作留痕 |
| 6.7 账号恢复与安全设置 | Phase 2 | P1 | 未开始 | 找回密码、改密、改绑、MFA 恢复 |
| 6.8 联邦认证与开放协议 | Phase 3 | P1 / P2 | 未开始 | OAuth 2.1 / OIDC / 企业身份接入 |
| 6.9 机器身份与内部服务认证 | Phase 3 | P1 | 未开始 | service-to-service token、client credential |

## 6.1 登录与认证编排

功能编号建议：

- `AUTH-01` 邮箱密码登录
- `AUTH-02` 手机号 + OTP 登录
- `AUTH-03` 用户名 / 编号 + 密码登录
- `AUTH-04` 多账号场景下的账号选择登录
- `AUTH-05` 登录后二次校验流程编排
- `AUTH-06` 登录失败统一错误语义与脱敏提示
- `AUTH-07` 登录流程状态机与 challenge 机制

最佳实践要求：

- 登录入口与认证策略解耦，避免 controller 中堆业务逻辑
- 登录结果支持“成功 / 需要 MFA / 需要选择账号 / 被风控拦截 / 需要补充验证”几类标准态
- 对外使用 challengeId / flowId 维持多步骤认证流程，避免前端拼装隐式状态

## 6.2 凭据与登录方式管理

功能编号建议：

- `CRED-01` 登录方式注册
- `CRED-02` 密码凭据创建与更新
- `CRED-03` 邮箱绑定与验证
- `CRED-04` 手机号绑定与验证
- `CRED-05` 第三方登录方式绑定
- `CRED-06` 登录方式启停用
- `CRED-07` 凭据历史与密码复用限制

最佳实践要求：

- 登录标识与凭据分离存储
- 密码必须使用强哈希算法并支持成本参数演进
- 登录标识必须唯一且支持规范化处理，例如邮箱大小写归一、手机号标准化
- 凭据变更必须触发安全事件与可选的全端下线

## 6.3 令牌与会话管理

功能编号建议：

- `SESS-01` 创建登录会话
- `SESS-02` Access Token 签发
- `SESS-03` Refresh Token 轮换
- `SESS-04` 单设备登出
- `SESS-05` 全设备登出
- `SESS-06` 管理员强制下线
- `SESS-07` 会话列表查询
- `SESS-08` 会话冻结与恢复
- `SESS-09` Token 撤销列表 / 黑名单
- `SESS-10` Token introspection / session validation

最佳实践要求：

- Refresh Token 必须“一次一换”，防止重放
- Access Token 短期有效，避免长期信任
- Session 与 Token 要分层建模，JWT 不是数据库替代品
- 会话需要关联设备、IP、UA、最近活动时间、认证等级、风险状态

## 6.4 MFA 多因子认证

功能编号建议：

- `MFA-01` MFA 状态查询
- `MFA-02` TOTP 绑定初始化
- `MFA-03` TOTP 绑定确认
- `MFA-04` 邮箱 OTP 作为 MFA
- `MFA-05` 短信 OTP 作为 MFA
- `MFA-06` 恢复码生成与使用
- `MFA-07` MFA 方式停用
- `MFA-08` 敏感操作二次认证
- `MFA-09` 可信设备跳过策略

最佳实践要求：

- 优先支持 TOTP，邮箱/SMS 作为兼容补充
- 必须预留恢复码，否则用户极易被锁死
- MFA 不只用于登录，也应用于改密、改绑、导出敏感数据等高风险动作

## 6.5 登录安全与风险控制

功能编号建议：

- `RISK-01` 登录失败次数限制
- `RISK-02` OTP 发送频控与日限额
- `RISK-03` IP / 设备指纹识别
- `RISK-04` 异地登录 / 异常时间段检测
- `RISK-05` 新设备首登强化校验
- `RISK-06` 高风险登录拦截或降级
- `RISK-07` 验证码 / 人机校验挂载点
- `RISK-08` 暴力破解与撞库防护

最佳实践要求：

- 风控规则必须可配置，不要硬编码在 service 里
- 风险结论应输出为结构化标签，例如 `ALLOW`、`CHALLENGE`、`DENY`
- OTP 发送和登录校验都要限流，防止短信轰炸与撞库

## 6.6 认证审计与安全运营

功能编号建议：

- `AUD-01` 登录成功事件
- `AUD-02` 登录失败事件
- `AUD-03` Token 刷新事件
- `AUD-04` MFA 启用 / 停用事件
- `AUD-05` 密码修改事件
- `AUD-06` 管理员强制下线事件
- `AUD-07` 风险拦截事件
- `AUD-08` 安全报表与查询接口

最佳实践要求：

- 审计事件至少包含操作者、目标用户、设备、IP、结果、原因、时间、traceId
- 审计日志应支持异步投递，不阻塞主认证链路

## 6.7 账号恢复与安全设置

功能编号建议：

- `REC-01` 忘记密码申请
- `REC-02` 忘记密码确认
- `REC-03` 登录后修改密码
- `REC-04` 修改邮箱
- `REC-05` 修改手机号
- `REC-06` 风险验证后重置 MFA
- `REC-07` 查看安全设置总览

最佳实践要求：

- 账号恢复链路比普通登录更敏感，必须加风控和审计
- 改密、改绑、重置 MFA 后，应默认撤销高风险旧会话

## 6.8 联邦认证与开放协议

功能编号建议：

- `FED-01` OAuth 2.1 标准登录接入
- `FED-02` OIDC ID Token 校验
- `FED-03` 企业微信 / 钉钉 / 飞书接入
- `FED-04` 第三方账号绑定与解绑
- `FED-05` 首次联邦登录账号映射

说明：

- 本阶段不建议先做复杂协议实现，但必须在模型和文档层预留边界

## 6.9 机器身份与内部服务认证

功能编号建议：

- `S2S-01` 内部服务 client credential
- `S2S-02` 服务级 token 签发与校验
- `S2S-03` 内部 token scope / audience 约束
- `S2S-04` 密钥轮换与吊销

说明：

- 如果后续 `oes` 微服务之间统一收口认证，这部分能力会非常关键

## 7. 建议的数据模型补充

在当前 Prisma 模型基础上，建议后续逐步补强以下对象：

- `AuthChallenge`
  - 用于描述多步骤认证流程状态，例如 MFA challenge、账号选择 challenge、密码重置 challenge
- `RefreshTokenFamily`
  - 用于支持 refresh token 轮换与重放检测
- `DeviceTrust`
  - 用于可信设备、设备指纹、最近验证结果
- `SecurityEvent`
  - 用于结构化审计与风控事件记录
- `RecoveryCode`
  - 用于 MFA 恢复码
- `PasswordHistory`
  - 用于禁止复用历史密码

说明：

- 当前 `UserSession`、`OTP`、`LoginMethod` 模型可继续保留
- 当前被注释掉的 `MfaBinding` 应恢复为正式模型，并补齐 lifecycle 字段

## 8. API / Contract 设计建议

当前 `auth.proto` 只覆盖邮箱密码登录，明显不足以支撑认证中心。

建议后续 contract 按以下类别拆分：

- `AuthFlowService`
  - 登录开始
  - challenge 提交
  - 账号选择确认
- `TokenService`
  - 刷新 token
  - 校验 token
  - 撤销 token
- `SessionService`
  - 查询当前会话
  - 列出用户会话
  - 单会话登出
  - 全端登出
- `MfaService`
  - 查询状态
  - 绑定
  - 验证
  - 解绑
- `SecurityService`
  - 忘记密码
  - 修改密码
  - 安全设置

contract 设计原则：

- 返回值要表达流程状态，不要只返回 token
- 对错误码统一建模，避免字符串错误信息漂移
- 对 challenge 类流程统一使用 `challengeId`

## 9. Phase 划分建议

### Phase 1：认证核心闭环

目标：

- 完成稳定可用的基础认证中心

范围：

- 邮箱密码登录
- 手机 / 邮箱 OTP 登录
- 账号选择
- access / refresh token
- refresh token 轮换
- 基础 session 管理
- TOTP / 邮箱 / 短信 MFA
- 单端 / 全端登出

### Phase 2：安全增强与运营能力

目标：

- 让认证中心具备平台级安全治理能力

范围：

- 风控引擎
- 限流与异常登录检测
- 审计事件
- 找回密码
- 改密 / 改绑 / 重置 MFA
- 管理员安全操作

### Phase 3：开放生态与服务身份

目标：

- 面向更复杂生态演进

范围：

- OAuth/OIDC
- 企业身份提供商对接
- 内部服务身份认证
- 密钥轮换治理

## 10. 实施优先级建议

如果从工程落地角度排序，我建议 `auth-service` 后续分片实现按下面顺序推进：

1. `AUTH-01 + SESS-01/02/03/04/05`
2. `AUTH-04`
3. `MFA-01/02/03/04/05/07`
4. `SESS-06/07/08/10`
5. `RISK-01/02`
6. `REC-01/02/03`
7. `AUD-01` 到 `AUD-07`
8. `MFA-06`
9. `RISK-03` 到 `RISK-08`
10. `FED-*` 与 `S2S-*`

## 11. 本模块后续文档拆分建议

后续建议在 `auth-service/doc/func` 下拆分以下主文档：

- `auth-flow.md`
- `credential-management.md`
- `session-token-management.md`
- `mfa-management.md`
- `login-risk-control.md`
- `security-recovery.md`
- `audit-and-security-ops.md`

并为每个主文档配套：

- `*.history.md`

## 12. 当前结论

从大型主流项目最佳实践角度，`auth-service` 不应该只被设计成“发 JWT 的登录服务”，而应该被设计成 `oes` 的认证与会话安全中心。

当前我们可以先正式确定以下方向：

- 以“认证编排 + 会话中心 + MFA + 风控扩展点”为核心架构
- 以 `identity-service` 为身份事实源
- 以 `permission-service` 为授权事实源
- 以 `session` 为认证后的核心状态对象
- 以 challenge 机制承载多步骤认证流程
- 以分阶段方式推进，优先完成 Phase 1 闭环

以上内容可作为 `auth-service` 后续设计、实现、拆分和评审的统一索引基线。
