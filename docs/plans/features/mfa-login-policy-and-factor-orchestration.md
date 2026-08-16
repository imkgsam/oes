# MFA Login Policy And Factor Orchestration

## 1. 目标

- 为租户提供可落地的登录场景 MFA 策略，而不是继续把 MFA 仅停留在用户自助绑定层。
- 在不引入重型策略引擎的前提下，补齐“登录命中 MFA 后默认展示哪个因子、如何切换其他因子、如何完成验证”的完整续流。
- 将 `EMAIL_OTP / SMS_OTP / TOTP / BACKUP_CODE` 统一纳入同一套 MFA 因子治理模型，并明确恢复码的一次性应急语义。
- 通过清晰边界保留后续从“务实型”升级到“严格型” MFA 的扩展空间，避免本期实现推倒重来。

## 2. 不做什么

- V1A 不支持除 `LOGIN` 以外的 MFA 场景落地；`新设备登录 / 修改密码 / 更换邮箱 / 手机` 已提升为 V1B 主线。
- V1C 之前不开放系统管理员 MFA 策略配置页；平台 MFA 配置已提升为当前主线实现。
- 不在第一期为每个场景单独配置允许因子与因子优先级。
- 不在第一期引入基于风险评分、设备画像或异常行为的动态 MFA 决策。
- 不在第一期实现“严格型”同类因子复用限制，只保留升级所需模型。
- 不在第一期新增“测试认证器”独立流程；TOTP 可用性通过真实登录 MFA 续流验证。

## 3. 上游依赖

- architecture:
  - [gateway-and-bff.md](../../architecture/platforms/gateway-and-bff.md)
  - [authorization-layering-and-resource-policy.md](../../architecture/platforms/authorization-layering-and-resource-policy.md)
  - [unified-web-account-context.md](../../architecture/platforms/unified-web-account-context.md)
- services:
  - [auth-service.md](../../architecture/services/auth-service.md)
- contracts:
  - [auth-bff-login.md](../../contracts/api-gateway/auth-bff-login.md)
  - [auth-bff-self-service.md](../../contracts/api-gateway/auth-bff-self-service.md)
  - [auth-bff-admin-security.md](../../contracts/api-gateway/auth-bff-admin-security.md)
  - [login.md](../../contracts/auth-service/login.md)
  - [mfa.md](../../contracts/auth-service/mfa.md)
- existing feature packets:
  - [login-method-management.md](./login-method-management.md)
  - [personal-center.md](./personal-center.md)

## 4. 问题现象与根因

### 4.1 当前现象

- 用户安全中心已经能绑定和启停部分 MFA 因子，但“登录场景是否必须 MFA”仍没有租户级策略入口。
- 登录续流当前只返回一个通用 `challengeId`，前端无法知道默认该展示哪个 MFA 因子，也无法有序切换其他可用因子。
- 当前产品认知上容易把“登录方式”与“MFA 因子”混在一起，造成用户误以为 `TOTP` 没有作为独立因子进入统一管理。

### 4.2 当前根因

- `auth-service` 当前登录 handler 仍采用硬编码顺序选择 challenge 因子，而不是基于租户策略和用户可用因子做统一编排。
- 系统尚未建立“租户级 MFA 场景策略 + 租户级全局因子优先级”的治理真相。
- 登录续流契约没有表达 `defaultFactor / availableFactors` 等编排语义，导致前端只能渲染单一 MFA 输入页。

### 4.3 正式修复方向

- 建立租户级 MFA 策略真相，只先覆盖 `LOGIN` 场景。
- 将登录命中 MFA 时的默认因子选择、候选因子列表、切换行为统一收敛到 challenge 编排层。
- 保留 `platform defaults + tenant overrides` 的底层模型，但第一期 UI 只开放租户管理员治理。

## 5. 当前结论

- MFA 因子管理与登录方式管理必须分开；登录方式属于主认证能力，MFA 因子属于二次认证能力。
- MFA 因子资产归属 `user`：
  - 邮箱 OTP、手机 OTP、TOTP、恢复码都属于用户自己的长期安全凭证。
- 登录场景是否触发 MFA、允许哪些因子、默认展示哪个因子，归属所选 `account` 对应的 tenant 策略：
  - 因子归属 `user`
  - 策略归属 `account -> tenant`
- 当前纳入统一管理的 MFA 因子固定为：
  - `EMAIL_OTP`
  - `SMS_OTP`
  - `TOTP`
  - `BACKUP_CODE`
- `TOTP` 不是补充说明项，而是和邮箱 / 手机 OTP 同级的独立可启停 MFA 因子。
- 第一期开关只覆盖 `LOGIN` 场景；其他场景作为后续增量扩展。
- 第一阶段采用“务实型” MFA：
  - 登录成功后如果命中 MFA，允许继续使用同类 OTP 信道完成第二步验证。
- “严格型” MFA 作为后置任务：
  - 后续可根据本次 challenge 的 `primaryFactorFamily` 过滤同类因子复用。
- 恢复码参与全局 priority 排序，但一旦验证成功：
  - 当前 `BACKUP_CODE` 绑定立即停用
  - 当前恢复码集合整体作废
  - 仅能在重新生成并重新启用后再次参与 MFA

## 6. 契约真相位置

- 登录场景 MFA 续流的 HTTP 黑盒契约应回写到 [auth-bff-login.md](../../contracts/api-gateway/auth-bff-login.md)。
- 用户自助 MFA 因子管理契约应继续回写到 [auth-bff-self-service.md](../../contracts/api-gateway/auth-bff-self-service.md)。
- 租户管理员 MFA 策略治理契约应新增或回写到 [auth-bff-admin-security.md](../../contracts/api-gateway/auth-bff-admin-security.md)。
- `auth-service` 内部登录 / MFA 编排契约应回写到 [login.md](../../contracts/auth-service/login.md) 与 [mfa.md](../../contracts/auth-service/mfa.md)。

## 7. 线程分工

| Thread / Owner | 职责 | 允许修改路径 | 输入 | 输出 | 状态 |
| --- | --- | --- | --- | --- | --- |
| design owner | 冻结登录场景 MFA 策略、因子优先级模型、恢复码语义与后续升级边界 | `docs/plans/features/**`, 必要时 `docs/contracts/**` | 当前讨论结论、现有登录与安全中心能力 | 当前 feature packet | completed |
| contract owner | 冻结登录续流 `defaultFactor / availableFactors` 契约与租户管理员治理契约 | `docs/contracts/**`, `src/common/src/contracts/**` | 当前 feature packet | 契约文档与 proto 变更计划 | completed |
| auth-service owner | 实现租户 MFA 策略 read/write、challenge 编排、因子切换与恢复码消费规则 | `src/services/system/auth-service/**` | 当前 feature packet / contracts | 可测试认证编排能力 | completed |
| api-gateway owner | 暴露登录续流 HTTP 编排与租户管理员策略管理 API | `src/services/api-gateway/src/modules/**` | auth-service contracts | BFF 黑盒能力 | completed |
| tenant-web owner | 实现登录 MFA 续流 UI、用户安全中心收口与租户管理员配置页 | `app/web/apps/tenant-web/**` | BFF 契约 | 用户侧与管理员侧页面 | completed |
| review / integration owner | 聚焦验证登录主链、恢复码失效规则与策略生效范围 | 只读全局，必要时最小修正 | 各实现输出 | 验证结论与关闭判断 | in_progress |

## 8. 当前 slice

- slice:
  - V1A: 登录场景 MFA 策略 + 全局因子启停与 priority + 登录续流因子编排
- scope:
  - 用户级 MFA 因子资产与账号级策略分层
  - 租户级 `LOGIN` 场景开关
  - 租户级全局 MFA 因子启停
  - 租户级全局 MFA priority 排序
  - 登录命中 MFA 时返回默认因子与候选因子列表
  - 登录页因子切换与任一因子完成验证
  - `BACKUP_CODE` 一次性整组消费与自动停用
- ready definition:
  - 租户管理员能控制“登录是否要求 MFA”
  - 租户管理员能维护四种 MFA 因子的全局启停和优先级
  - 登录页默认展示最高优先级可用因子
  - 用户可切换到其他可用因子
  - 任一因子成功通过即可完成本次 2FA

## 8.1 下一阶段 slice

- slice:
  - V1B: 高风险自助场景 MFA
- scope:
  - 新设备登录
  - 修改密码
  - 更换邮箱 / 手机
- rules:
  - 继续复用 V1A 的用户级 MFA 因子资产与租户级 priority
  - 不引入严格型同类因子排除
  - 不引入系统管理员平台默认 MFA 策略
  - 不把每个场景扩展成独立因子白名单；场景只控制是否要求 MFA
- implementation boundary:
  - 新设备登录需要先冻结设备识别 / trusted-device 语义，不得用 IP 或 user-agent 硬编码当正式设备模型
  - 修改密码、更换邮箱 / 手机属于已登录自助敏感操作，应通过 step-up MFA challenge 保护最终提交动作
- execution plan:

## 8.2 当前新增 slice

- slice:
  - V1C: 平台 MFA 配置
- scope:
  - `SYSTEM` 账号独立的 MFA 策略治理
  - 与租户 MFA 同构但隔离的策略模型
  - `SYSTEM/TENANT` 运行时策略分流
  - 系统账号 `NEW_DEVICE_LOGIN` 的受信设备真相
- execution plan:

## 9. 主线范围

- 本线程主线：
  - 冻结登录场景 MFA 治理模型
  - 冻结登录 challenge 编排语义
  - 明确恢复码的正式产品语义
  - 明确一期与后续扩展边界
- 本线程不做：
  - 直接落地代码
  - 直接修改 proto
  - 直接新增数据库迁移
  - 直接扩展到 `LOGIN` 之外的场景
- 偏移返回条件：
  - 若需要引入平台级强制覆盖或复杂继承规则，暂停并升级到独立治理设计。
  - 若需要为不同场景独立维护因子白名单与 priority，迁出为后续策略增强 feature。
  - 若需要做动态风控驱动的 MFA，迁出为风险策略独立 feature。

## 10. V1 能力设计

### 10.1 管理面边界

- 用户安全中心：
  - 只负责当前用户的 MFA 因子绑定、启停、初始化与恢复码生成。
  - 不负责决定哪些业务场景要求 MFA。
- 租户管理员配置页：
  - 只负责当前租户的 MFA 策略。
  - 第一版页面只提供：
    - `登录时要求 MFA`
    - 四种因子的全局启停
    - 四种因子的 priority 排序
- 系统管理员：
  - 第一版不开放 MFA 策略 UI。
  - 底层保留 `platform defaults + tenant overrides` 的扩展位。

### 10.2 运行时登录续流

- 登录顺序固定为：
  - 主认证
  - 账号选择
  - 按所选 `account` 的 tenant MFA policy 判定是否需要 MFA
  - 若命中 MFA，则完成 challenge
  - 再建立最终 session
- 主登录成功后，不得在账号选择之前提前触发 tenant-scoped MFA：
  - 因为多账号、多租户场景下，只有选定 `account` 后才能知道当前应该采用哪个 tenant 的 MFA 策略。
- 如果所选 `account` 对应 tenant 未开启 `LOGIN` 场景 MFA：
  - 直接建立最终会话。
- 如果所选 `account` 对应 tenant 开启 `LOGIN` 场景 MFA：
  - 创建当前登录专用的 `MFA challenge`。
  - challenge 中保留本次登录上下文。
- 后端在 `MFA_REQUIRED` 响应中返回：
  - `challengeId`
  - `scenario`
  - `defaultFactor`
  - `availableFactors[]`
  - 必要时返回当前选中的 `selectedFactor`
- `MFA_REQUIRED` 响应不得自动创建或投递 `EMAIL_OTP / SMS_OTP` 的 factor-specific OTP challenge：
  - 进入 MFA 页面只代表本次登录需要二次验证
  - 邮箱 / 短信验证码必须由用户在 MFA 页面主动触发发送
  - 当前前端发送入口必须先经过 captcha gate，再调用 factor challenge 接口
  - 后续若引入服务端 captcha token，BFF 必须在调用 `auth-service` 前完成校验
- `defaultFactor` 与 `availableFactors[]` 的顺序必须来自所选 `account` 对应 tenant 的因子 priority：
  - 不是用户绑定顺序
  - 不是前端写死顺序
  - 不是任意后端枚举顺序
- `availableFactors[]` 来源于：
  - 租户全局因子启用状态
  - 租户全局 priority
  - 用户本人已绑定且当前可用的因子
- 前端默认展示最高优先级可用因子。
- 前端中的其他候选因子必须按同一 priority 顺序，依次作为备选项展示。
- 用户可切换到其他更低优先级但可用的因子。
- 任一因子验证成功，即完成本次 MFA 并继续登录续流。

### 10.3 登录页 MFA 交互

- MFA 登录页默认只展示一个当前验证方式：
  - 即当前优先级最高且可用的因子。
- 不应在首屏一次性平铺展示所有可用 MFA 因子。
- 页面应提供次级入口：
  - `使用其他验证方式`
- 用户点击该入口后，才展示其余可用因子列表。
- 备选列表必须按所选 `account` 的 tenant priority 顺序排列，并从当前因子之后依次向后作为备选。
- 用户切换验证方式时：
  - 只改变本次 challenge 的当前展示因子
  - 不改变 challenge 所属 user / account / tenant / scenario 上下文
- `EMAIL_OTP / SMS_OTP` 发送或重发时才可申请 factor-specific challenge；
  - `TOTP / BACKUP_CODE` 切换时不需要额外下游 OTP challenge。

### 10.4 恢复码语义

- 恢复码参与普通 priority 排序。
- 恢复码在 UI 中必须被明确标注为“应急备用，一次性使用”。
- 恢复码验证成功后：
  - 本次 `BACKUP_CODE` 绑定立即停用
  - 当前恢复码集合整体作废
  - 下次若要继续使用恢复码，必须重新生成并重新启用

### 10.5 务实型与严格型边界

- 第一版运行时编排采用“务实型”：
  - 不限制与主登录同类因子的二次验证复用。
- 为升级到“严格型”预留 challenge 上下文：
  - `primaryMethod`
  - `primaryFactorFamily`
- 后续启用“严格型”时，仅需在候选因子过滤规则中排除同类因子，无需重做租户策略模型。

## 11. 建议接口草案

### 11.1 租户管理员 BFF API

```http
GET  /api/v1/auth/admin/tenants/:tenantId/mfa-policy
PUT  /api/v1/auth/admin/tenants/:tenantId/mfa-policy/login
PUT  /api/v1/auth/admin/tenants/:tenantId/mfa-policy/factors
```

约束：

- `login` 只管理 `LOGIN` 场景是否要求 MFA。
- `factors` 管理全局因子的启停和 priority，不按场景拆分。

### 11.2 登录 BFF API

在 [auth-bff-login.md](../../contracts/api-gateway/auth-bff-login.md) 现有 `POST /auth/login` 与 `POST /auth/mfa/complete` 基础上扩展：

- `POST /auth/login`
  - `MFA_REQUIRED` 响应补充：
    - `scenario`
    - `defaultFactor`
    - `availableFactors[]`
- `POST /auth/mfa/complete`
  - 请求补充：
    - `factor`
    - `challengeId`
    - `code`

必要时可追加：

```http
POST /api/v1/auth/mfa/select-factor
```

仅用于在同一 challenge 下切换当前展示因子；若实现选择在前端本地切换而后端提交时带 `factor` 即可，则该接口不是第一期硬要求。

### 11.3 Auth Service 能力

- `GetTenantMfaPolicy`
- `UpdateTenantLoginMfaPolicy`
- `UpdateTenantMfaFactorPolicy`
- `ResolveLoginMfaChallenge`
- `SubmitMfaChallenge`

## 12. 数据模型建议

### 12.1 租户 MFA 场景策略

- `tenantId`
- `scenario`
- `required`
- `updatedBy`
- `updatedAt`

第一版场景固定为 `LOGIN`。

### 12.2 租户 MFA 因子策略

- `tenantId`
- `factor`
- `enabled`
- `priority`
- `updatedBy`
- `updatedAt`

### 12.3 MFA challenge 上下文

- `challengeId`
- `tenantId`
- `userId`
- `scenario`
- `primaryMethod`
- `primaryFactorFamily`
- `selectedFactor`
- `status`

这组字段用于：

- 支撑本次登录的默认因子和候选因子编排
- 为未来“严格型”因子过滤保留上下文
- 保持 MFA 决策与用户长期资料解耦

## 13. 权限设计

- 用户自助安全中心：
  - 仍采用 self-bound 控制，不走管理员权限模型。
- 租户管理员策略配置：
  - 应新增或复用明确的租户安全治理权限码，例如：
    - `auth.mfa_policy.read`
    - `auth.mfa_policy.manage`
- 第一版不开放系统管理员 MFA 策略 UI，因此不需要在本 feature packet 中定义复杂的“平台强制覆盖租户配置”规则。

## 14. 安全规则

- 如果租户开启 `LOGIN` 场景 MFA，而当前用户没有任何可用因子：
  - 不允许绕过 MFA 直接放行登录。
  - 应直接阻断登录，不发最终 session。
  - 应返回明确状态，提示当前账号要求 MFA，但当前用户没有任何可用验证方式，需要先完成安全设置或联系管理员。
- 恢复码验证成功后必须立即停用当前恢复码绑定，不能继续沿用剩余旧码。
- 用户切换 MFA 因子时，不得改变 challenge 所属用户、租户和登录上下文。
- 第一版允许与主登录同类因子复用，但必须作为显式设计结论记录，不能误判为漏洞修复遗漏。
- 响应体永远不返回 OTP、TOTP secret、recovery code 的持久化存储值。

## 15. 阻塞 / 依赖

- 当前 `auth-bff-login` 契约没有表达默认因子和候选因子列表，必须先补契约。
- 当前登录 handler 仍为硬编码因子顺序，后续实现需统一收敛到 challenge 编排层。
- 当前尚未冻结租户级安全策略持久模型，需要在 contract / implementation 线程中补充。
- 第一版登录页 `mfa.vue` 仍是通用 6 位码输入页，需要根据候选因子能力进行重构。

## 16. 派生问题 Ledger

| 时间 | 问题 | 分类 | 当前影响 | 处理策略 | 目标落点 | 状态 |
| --- | --- | --- | --- | --- | --- | --- |
| 2026-04-20 | 第一版是否要求禁止与主登录同类因子复用 | Blocker-Later | 影响运行时过滤规则 | 第一版采用务实型；后续升级为严格型时基于 challenge 上下文追加过滤 | 当前 feature packet / 后续任务 | closed |
| 2026-04-20 | 恢复码是否只消费单条还是整组失效 | Blocker-Now | 影响产品语义与实现 | 已冻结为“整组一次性应急包”；成功使用一次后绑定停用且旧码整体作废 | 当前 feature packet | closed |
| 2026-04-20 | 系统管理员是否先开放 MFA 策略治理 | Blocker-Later | 会把模型拖入多层继承与强制覆盖 | 第一版不开放系统管理员页，只保留底层模型扩展位 | 当前 feature packet | closed |
| 2026-04-20 | 第一版是否支持除登录外的 MFA 场景 | Sidecar | 会显著扩大策略与联动范围 | V1A 仅支持 `LOGIN`；新设备登录、修改密码、更换邮箱 / 手机已迁入 V1B 主线 | 当前 feature packet / V1B plan | migrated |

## 17. 验收标准

- 租户管理员能查看并修改当前租户“登录是否要求 MFA”。
- 租户管理员能配置四种 MFA 因子的全局启停与 priority。
- 用户命中登录场景 MFA 时，前端能拿到按所选 `account` priority 排序的默认因子与候选因子列表。
- 登录 MFA 页默认只展示一个当前因子，其他因子通过次级入口按顺序切换。
- 任意一个可用因子验证成功，登录续流可继续完成。
- `TOTP` 在安全中心中以独立 MFA 因子身份清晰表达。
- 恢复码成功使用一次后，对应 `BACKUP_CODE` 绑定自动停用，旧恢复码不再可用。

## 18. 后置任务

- `严格型 MFA`
  - 根据 `primaryFactorFamily` 排除与主登录同类的二次验证因子。
- `更多 MFA 场景`
  - 安全中心敏感操作
  - 管理员高危操作
- `平台级安全治理`
  - 开放系统管理员 MFA 策略配置页
  - 明确平台默认值与租户覆盖值冲突规则
- `更强因子要求`
  - 支持未来某些高风险场景只接受 `TOTP`

## 19. 关闭条件

- 当前 feature packet 已冻结为 V1A 的执行真相。
- 登录续流与租户管理员治理契约已回写到 `docs/contracts/**`。
- auth-service / api-gateway / tenant-web 的实现线程已基于此 packet 拆分计划。
- 登录场景 MFA 端到端链路通过聚焦验证。

## 20. 备注

- 本 feature packet 聚焦“登录场景 MFA 策略与续流编排”，不替代现有 `mfa.md` 与 `login.md` 契约正文。
- 当前包的核心价值不是补一个页面，而是把“租户是否要求登录 MFA”与“登录时如何选择因子”收敛成稳定模型。
- 若后续产品希望为每个场景单独配置允许因子与 priority，应新开策略增强 feature，而不是继续无界扩大当前 packet。
