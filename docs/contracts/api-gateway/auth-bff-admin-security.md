# auth-bff Admin Security API

## 1. 能力定位

本文档描述 `auth-bff` 面向管理员安全管理场景开放的 HTTP 接口。

`auth-service` 的服务设计、session、login method、MFA policy 与认证审计边界只以 [auth-service.md](../../architecture/services/auth-service.md) 为准；本文只描述 `auth-bff` 的 HTTP contract、编排与返回形状。

涉及 permission code、checkPermission、checkResource 或 buildQueryScope 的服务设计边界，以 [permission-service.md](../../architecture/services/permission-service.md) 与项目级授权架构为准。

这组接口覆盖：

- 查看当前管理员可见范围内的在线用户总览
- 搜索当前管理员可见范围内的目标用户摘要
- 查询当前管理员可见范围内的账号目录
- 管理当前租户的登录 MFA 策略
- 管理当前租户的敏感操作 MFA 场景要求
- 查看指定用户的会话列表
- 撤销指定单个会话
- 查询认证域审计事件

适用对象：

- 租户管理员
- 系统管理员
- 其他被授权的安全 / 审计角色

这组接口不属于认证流程，也不属于当前用户自助安全管理。

## 2. 当前可对接接口

### `GET /auth/admin/online-users`

- 作用：返回当前管理员可见范围内“当前存在活跃 session 的用户”总览
- 使用场景：
  - 系统管理员查看当前全局在线用户概览
  - 租户管理员查看本租户当前在线用户概览
  - 从在线用户列表进入目标用户会话管理
- 权限模型：
  - Gateway 入口需要 `checkPermission`
  - 当前粗粒度 permission code 为 `auth.session.admin.view`
  - 下游查询应按管理员当前 `scope` 收敛可见范围
- 作用域模型：
  - system scope 可见全局在线用户
  - tenant-bound operator 仅可见本 tenant 在线用户
- 第一阶段建议请求查询参数：
  - `query`
    - 可选，轻量文本过滤；用于受控关键词匹配
  - `tenantId`
    - 可选；system scope 可用，tenant-bound operator 只能使用自身 tenant 或忽略该字段
  - `cursor`
    - 可选，分页游标
  - `pageSize`
    - 可选，默认 20
- 第一阶段响应关键字段：
  - `items[].userId`
  - `items[].displayName`
  - `items[].tenantId`
  - `items[].tenantName`
  - `items[].tenantNames`
  - `items[].visibleTenantCount`
  - `items[].activeAccountCount`
  - `items[].activeSessionCount`
  - `items[].lastActiveAt`
  - `nextCursor`
- 语义约束：
  - 该接口返回的是“在线用户总览”，不是原始 session 明细列表
  - 只返回当前至少有一个活跃 session 的用户
  - 当前 BFF 会把下游原始在线数据按 `user` 聚合，系统管理员看到的是“一个 user 一行”的总览，而不是 `user + tenant` 多行展开
  - `activeAccountCount` 表示当前可见范围内、该 user 仍存在活跃 session 的 account 数量
  - `tenantNames / visibleTenantCount` 用于表达该 user 当前在线状态覆盖了哪些 tenant，可供系统管理员在总览层快速判断影响范围
  - 当前阶段不引入完整用户搜索器，不保证支持姓名 / login handle 的高级目录检索
  - 当前阶段不返回会话详情字段；具体 session 明细应通过“查看指定用户会话列表”接口获取

### `GET /auth/admin/users/search`

- 作用：按当前管理员可见范围搜索目标用户摘要
- 使用场景：
  - 管理员已知用户邮箱、手机号或 `userId`，希望快速进入该用户会话排查
  - 目标用户当前不一定在线，但管理员仍需要确认其是否存在活跃 session
  - 替代手动输入 `userId` 的低可用入口
- 权限模型：
  - Gateway 入口需要 `checkPermission`
  - 当前粗粒度 permission code 为 `auth.session.admin.view`
  - BFF 不向前端暴露下游身份服务契约
- 作用域模型：
  - system scope 可搜索当前系统管理员可见范围内的用户
  - tenant-bound operator 仅可搜索当前 tenant 可见用户
  - 前端不传 `scopeLevel`，BFF / 下游基于当前 operator context 裁剪结果
- 第一阶段请求查询参数：
  - `keyword`
    - 必填，非空字符串
    - 用于匹配 `userId`、邮箱或手机号
    - 第一阶段不承诺显示名模糊搜索
    - 第一阶段不承诺 `username` / login handle 搜索
  - `limit`
    - 可选，默认 10
    - 最大 10
- 第一阶段响应关键字段：
  - `items[].userId`
  - `items[].displayName`
  - `items[].emailMasked`
  - `items[].phoneMasked`
  - `items[].accountSummaries[]`
    - `accountId`
    - `accountDisplayName`
    - `tenantId`
    - `tenantName`
    - `scopeLevel`
  - `items[].isOnline`
  - `items[].activeSessionCount`
- 脱敏语义：
  - `emailMasked` 与 `phoneMasked` 默认脱敏返回
  - 第一阶段不返回完整邮箱或完整手机号
  - 如后续需要完整联系方式，应新增明确权限语义，不复用当前搜索契约悄悄放宽
- account / tenant 摘要语义：
  - `accountSummaries[]` 只用于帮助管理员判断搜索结果是否为正确目标
  - 第一阶段不返回角色、权限摘要、组织结构或用户目录详情
  - tenant-bound operator 只能看到当前可见范围内的 account / tenant 摘要
- 在线状态语义：
  - `isOnline` 表示当前管理员可见范围内该用户是否存在活跃 session
  - `activeSessionCount` 表示当前管理员可见范围内该用户的活跃 session 数量
  - 搜索结果允许包含离线用户，离线用户可进入用户会话列表并显示空状态或非活跃会话
- 语义约束：
  - 该接口是管理员会话管理的目标发现能力，不是完整用户目录
  - 结果最多返回 10 条，第一阶段不做分页
  - 前端选中用户后，应继续调用 `GET /auth/admin/users/:userId/sessions` 查看会话列表
  - 该接口不替代 `GET /auth/admin/online-users`
  - 第一阶段不包含租户选择器；系统管理员仍可使用现有在线用户总览中的 `tenantId` 文本筛选能力
  - `identity.username` 暂按 legacy login handle 理解，不作为真实姓名或展示名搜索字段；如未来开放 login handle 搜索，应先冻结 identity-service login handle 语义

### `GET /auth/admin/accounts`

- 作用：返回当前管理员可见范围内的分页账号目录
- 使用场景：
  - `账号管理` 页面首屏默认加载账号列表
  - 管理员按关键字、Scope、状态过滤目标账号
  - 从账号行进入角色配置
- 权限模型：
  - Gateway 入口需要 `checkPermission`
  - 当前粗粒度 permission code 为 `permission.account.get_roles`
  - BFF 不向前端暴露下游 `identity-service` 契约
- 作用域模型：
  - system scope 可查看 system account 与 tenant account
  - tenant-bound operator 仅可查看当前 tenant 下的 tenant account
  - 前端可传 `scopeLevel`，但最终可见范围由 operator context 收敛
- 第一阶段请求查询参数：
  - `keyword`
    - 可选，匹配账号 ID、用户 ID、邮箱、手机号、账号显示名、租户名
  - `scopeLevel`
    - 可选，`SYSTEM / TENANT`
  - `status`
    - 可选，`ENABLED / DISABLED`
  - `page`
    - 可选，默认 1
  - `pageSize`
    - 可选，默认 20，最大 100
- 第一阶段响应关键字段：
  - `items[].accountId`
  - `items[].userId`
  - `items[].accountDisplayName`
  - `items[].tenantId`
  - `items[].tenantName`
  - `items[].scopeLevel`
  - `items[].isEnabled`
  - `page`
  - `pageSize`
  - `total`
- 语义约束：
  - 该接口是管理员账号目录，不替代用户会话排查搜索入口
  - 第一阶段只覆盖 `USER` account，不包含 service account
  - `tenantName` 是展示字段，调用方不得再自行拼装租户显示名
  - tenant-bound operator 不需要传 `tenantId`；BFF / 下游按 operator scope 自动收敛
  - 如后续需要完整账号详情或账号 CRUD，应新增独立能力，不在当前目录接口堆字段

### `GET /auth/admin/accounts/:accountId/deletion-impact`

- 作用：在永久删除账号前返回影响预检。
- 权限模型：Gateway 必须校验 `identity.account.delete`，可见范围继续由可信 operator context 收敛。
- 响应字段：
  - `accountId`
  - `canDelete`
  - `userRetained`
  - `cleanupPlan.willDeleteSessions`
  - `cleanupPlan.willClearRoles`
  - `cleanupPlan.willDeleteContactAssets`
  - `blockingReasons[]`
  - `contactAssetCount`
- 稳定语义：
  - 删除对象是 `UserAccount`，其背后的 `User` 保留；
  - 系统拥有的 sessions、roles、policy instances 与 contact assets 进入清理计划；
  - 业务服务拥有的关联形成 blocker，不提供强制绕过。

### `DELETE /auth/admin/accounts/:accountId`

- 作用：永久删除一个管理员可见的 `USER` account。
- 权限模型：Gateway 必须校验 `identity.account.delete`，tenant operator 只能操作当前 tenant 可见账号。
- 前置条件：
  - 当前登录账号不能删除自身；
  - deletion impact 必须返回 `canDelete = true`；
  - 业务关联 blocker 必须全部解除。
- 成功语义：
  - 清理 Auth sessions、Permission role/policy relations 与系统拥有的 contact assets；
  - Identity 永久删除目标 `UserAccount`；
  - 返回实际清理数量和 `userRetained = true`；
  - 不删除、停用或隐式合并背后的 `User`。

### `GET /auth/admin/accounts/:accountId/login-methods`

- 作用：查看当前管理员可见账号对应 user 的登录方式状态。
- 权限模型：
  - Gateway 入口需要 `checkPermission`
  - 建议 permission code 为 `auth.login_method.read`
- 作用域模型：
  - BFF 先通过 `identity-service` 查询 `accountId`
  - system scope 可管理全局可见账号
  - tenant-bound operator 只能管理当前 tenant 可见账号
- 响应不包含 password hash、OTP、credential secret、TOTP secret 或 recovery code 存储值。

### `POST /auth/admin/accounts/:accountId/password/setup-required`

- 作用：要求目标账号对应 user 下次登录后必须设置新密码。
- 权限模型：
  - Gateway 入口需要 `checkPermission`
  - 建议 permission code 为 `auth.password.require_setup`
- 管理员不提交、不接收、不生成明文密码。
- 请求可携带：
  - `reason`
  - `revokeSessions`
- 稳定语义：
  - 目标 user 后续 session context 必须返回 `passwordSetupRequired`
  - 是否撤销现有 sessions 由 `revokeSessions` 控制

### `POST /auth/admin/accounts/:accountId/login-methods/:methodId/enable`

- 作用：启用目标 user 的一个登录方式。
- 权限模型：
  - Gateway 入口需要 `checkPermission`
  - 建议 permission code 为 `auth.login_method.manage`

### `POST /auth/admin/accounts/:accountId/login-methods/:methodId/disable`

- 作用：停用目标 user 的一个登录方式。
- 权限模型：
  - Gateway 入口需要 `checkPermission`
  - 建议 permission code 为 `auth.login_method.manage`
- 稳定语义：
  - 不得停用目标 user 最后一个可用登录方式
  - 不返回 credential secret、password hash 或 OTP

### `GET /auth/admin/tenant-mfa-policy`

- 作用：读取当前租户的登录 MFA 策略。
- 使用场景：
  - 租户管理员打开 `登录 MFA` 租户设置页
  - 前端需要展示登录保护开关、四种 MFA 因子的启停与 priority
- 权限模型：
  - Gateway 入口需要 `checkPermission`
  - 当前粗粒度 permission code 为 `auth.mfa_policy.manage`
- 作用域模型：
  - 仅支持 tenant-bound operator
  - BFF 从当前 operator context 解析 `tenantId`，前端不传 `tenantId`
  - 系统管理员平台默认策略 UI 继续后置，不复用本接口绕过租户上下文
- 响应关键字段：
  - `tenantId`
  - `loginRequired`
  - `scenarioRequirements[].scenario`
  - `scenarioRequirements[].required`
  - `factors[].factor`
  - `factors[].enabled`
  - `factors[].priority`
- 语义约束：
  - Terminal-aware Account Security Phase 2 后，租户 MFA 策略目标形态以 [terminal-mfa-policy.md](../auth-service/terminal-mfa-policy.md) 为准：MFA 不再表达为全局登录开关，而是按 terminal 独立配置。
  - 当前 `loginRequired` / `LOGIN` 字段只能作为历史兼容口径；新设计应返回 `terminalPolicies[]` 与每个 terminal 的 effective source。
  - 当前租户设置页已支持 `LOGIN / CHANGE_PASSWORD / CHANGE_CONTACT / NEW_DEVICE_LOGIN`
  - 因子启停与 priority 是当前租户统一设置，场景只决定“是否需要 MFA”，不单独维护每个场景自己的因子表
  - 前端拖拽排序只改变 `priority`，不改变用户自己的 MFA 绑定资产

### `PUT /auth/admin/tenant-mfa-policy`

- 作用：更新当前租户的登录 MFA 策略。
- 使用场景：
  - 租户管理员开启或关闭登录时 MFA
  - 租户管理员调整四种 MFA 因子的启停与 priority
- 权限模型：
  - Gateway 入口需要 `checkPermission`
  - 当前粗粒度 permission code 为 `auth.mfa_policy.manage`
- 请求关键字段：
  - `loginRequired`
  - `scenarioRequirements[].scenario`
  - `scenarioRequirements[].required`
  - `factors[].factor`
  - `factors[].enabled`
  - `factors[].priority`
- 稳定语义：
  - Terminal-aware Account Security Phase 2 后，更新目标应迁移到 terminal-aware shape：按 terminal 设置 `loginMfaRequired / newDeviceMfaRequired / allowedFactors / factorPriority`。
  - 租户不配置 primary login method；本接口不得被扩展为租户登录方式开关。
  - 请求必须覆盖 `EMAIL_OTP / SMS_OTP / TOTP / BACKUP_CODE` 四个受管因子且每个因子只出现一次
  - `loginRequired` 仍保留为 `LOGIN` 场景兼容字段；多场景真相以 `scenarioRequirements` 为准
  - priority 必须被服务端归一为当前租户登录 MFA 的最终排序
  - 当租户开启登录 MFA 但用户没有任何可用因子时，登录流程不得绕过 MFA 建立 session
  - `BACKUP_CODE` 可参与普通 priority 排序，但成功使用后当前恢复码集合整体作废并停用该绑定

## 3. 当前用户自助敏感操作 step-up MFA

### `POST /auth/security/mfa/challenges`

- 作用：为当前登录账号的敏感操作创建一个 step-up MFA challenge。
- 请求关键字段：
  - `scenario`
- 响应关键字段：
  - `required`
  - `challenge`
- 稳定语义：
  - 当前 `scenario` 支持 `CHANGE_PASSWORD / CHANGE_CONTACT / NEW_DEVICE_LOGIN`
  - 只有命中当前 tenant policy 时才返回 `required=true`

### `POST /auth/security/mfa/complete`

- 作用：完成 step-up MFA challenge，并返回一个短期 `mfaGrantToken`。
- 请求关键字段：
  - `challengeId`
  - `factor`
  - `code`
  - `factorChallengeId`
- 响应关键字段：
  - `success`
  - `scenario`
  - `mfaGrantToken`
- 稳定语义：
  - 当前 grant 由修改密码、更换邮箱 / 手机等已登录敏感写接口消费
  - `NEW_DEVICE_LOGIN` 继续后置到 trusted-device 流程，不在当前 grant 消费范围内

### `GET /auth/admin/users/:userId/sessions`

- 作用：查看目标用户的会话列表
- 使用场景：
  - 租户管理员查看本租户用户当前有哪些活跃设备
  - 系统管理员排查目标用户登录状态
- 权限模型：
  - Gateway 入口需要 `checkPermission`
  - 当前粗粒度 permission code 为 `auth.session.admin.view`
  - 下游 `auth-service` 使用 `buildQueryScope`
- 作用域模型：
  - system scope 可见全局
  - tenant-bound operator 仅可见本 tenant 会话
- 第一阶段建议请求查询参数：
  - `status`
    - 可选；用于筛选 `ACTIVE / REVOKED / EXPIRED`
  - `deviceQuery`
    - 可选；用于设备名、浏览器、平台等轻量关键词过滤
  - `cursor`
    - 可选，分页游标
  - `pageSize`
    - 可选，默认 20
- 第一阶段默认排序语义：
  - 当前 / 活跃会话优先
  - 其次按 `lastActiveAt` 倒序
- 第一阶段响应关键字段补充：
  - `sessions[].accountId`
  - `sessions[].accountName`
  - `sessions[].tenantId`
  - `sessions[].status`
  - `sessions[].loginMethod`
  - `sessions[].deviceName / platform / browser / ipAddress`
  - `sessions[].lastActiveAt`
  - `sessions[].idleSeconds`
  - `sessions[].isRevoked / isAccessExpired / isAdminControlled`
  - `sessions[].adminRevokeReason / adminRevokeAt / adminRevokeBy`
- 语义约束：
  - 该接口服务于“用户会话列表”，不是会话详情抽屉
  - `accountName` 是为了支持前端按 `account -> session` 分组展示，调用方应将其视为黑盒展示字段，而不是自行再去拼装 account 显示名
  - 第一阶段允许返回活跃、已撤销、已过期会话，但页面重点仍是管理活跃会话
  - 如后续需要详情抽屉，应另行冻结详情字段与交互，而不是在当前阶段继续堆大列表

### `POST /auth/admin/sessions/:sessionId/revoke`

- 作用：撤销目标单个会话
- 使用场景：
  - 管理员强制下线可疑登录设备
  - 平台安全响应中撤销目标 session
- 权限模型：
  - Gateway 入口需要 `checkPermission`
  - 当前粗粒度 permission code 为 `auth.session.admin.revoke`
  - 下游 `auth-service` 使用 `checkResource`
- 作用域模型：
  - system scope 可跨 tenant
  - tenant-bound operator 仅可撤销本 tenant session
- 额外约束：
  - 管理员不允许撤销自己当前正在使用的会话
  - 该约束应返回稳定错误语义，供前端明确提示，而不是只依赖前端隐藏按钮
- 第一阶段错误语义建议：
  - `ACCESS_DENIED`
    - 越 scope 操作目标 session
  - `SESSION_NOT_FOUND`
    - 目标 session 不存在或当前管理员不可见
  - `CANNOT_REVOKE_CURRENT_SESSION`
    - 目标 session 即当前管理员正在使用的 session

### `GET /auth/admin/audit-events`

- 作用：列出认证域审计事件
- 使用场景：
  - 查看登录失败、MFA、session 撤销、refresh replay 等认证域审计
  - 按时间、资源、操作者筛选 auth 审计
- 权限模型：
  - Gateway 入口需要 `checkPermission`
  - 当前粗粒度 permission code 为 `auth.audit.list`
  - 下游 `auth-service` 使用 `buildQueryScope`
- 作用域模型：
  - system scope 可查询全局
  - tenant-bound operator 仅可查询本 tenant 审计

## 3. 参考入口

前端与其他线程在阅读本黑盒文档之外，还应同时参考以下入口：

- 服务设计唯一真相源：
  - [auth-service.md](../../architecture/services/auth-service.md)
- 黑盒接口说明：
  - [auth-service session.md](../auth-service/session.md)
  - [auth-service audit.md](../auth-service/audit.md)

以下代码文件是当前实现参考，不作为服务设计真相源：

- BFF controller：
  - [auth.controller.ts](../../../src/services/api-gateway/src/modules/auth-bff/interfaces/http/controllers/auth.controller.ts)
- 请求 DTO：
  - [admin-security.dto.ts](../../../src/services/api-gateway/src/modules/auth-bff/interfaces/http/dtos/admin-security.dto.ts)
- 响应 ViewModel：
  - [admin-security.view-model.ts](../../../src/services/api-gateway/src/modules/auth-bff/interfaces/http/view-models/admin-security.view-model.ts)

## 4. 当前边界

- 这组接口是管理员能力，不应给普通自助页面直接调用。
- 角色不会拆成不同 HTTP 接口；不同管理员角色通过 scope 获得不同可见范围。
- 查询与撤销的最终 tenant 边界判定在下游 `auth-service` 中完成。
- 当前契约的第一阶段页面结构应理解为：
  - 在线用户总览
  - 用户搜索入口
  - 点击进入目标用户会话列表
  - 单条撤销
- 当前契约的目标用户发现方式包括：
  - 从在线用户总览点击进入
  - 通过 `GET /auth/admin/users/search` 搜索用户后进入
  - 或在已知 `userId` 情况下直接进入目标用户会话列表
- 当前契约同时提供 `GET /auth/admin/accounts` 作为账号管理页的正式目录查询入口。
- 前端不得绕过 BFF 直接调用内部 `identity-service` 搜索用户。
- 当前契约不包含：
  - 会话详情抽屉
  - 登录历史页面
  - 批量撤销 / 批量操作
  - 租户选择器
  - 显示名模糊搜索
