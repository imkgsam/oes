# auth-service Login API

> 服务设计唯一真相源：[auth-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/auth-service.md)。本文只描述黑盒 gRPC 登录接口语义，不重新定义 `auth-service` 的长期职责、核心对象或 owner 边界。
> `Tenant` lifecycle 与 tenant status 语义以 [tenant-org-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/tenant-org-service.md) 为准；本文只描述登录与账号选择流程如何消费该事实。
> Terminal Access Policy 与 permission 侧授权边界以 [permission-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/permission-service.md) 为准；本文只描述登录 / refresh 链路如何消费该事实。

## 1. 接口范围

`AuthService` 的登录与认证流程接口负责提供：

- 邮箱 / 手机密码登录
- 邮箱 / 手机 OTP 登录
- 员工码 + 现场终端 PIN 登录
- MFA challenge 提交
- 多账户选择
- refresh token 续期
- Terminal Access Policy 登录 / refresh 准入消费

这些接口共同组成认证协议与会话建立流程，而不是管理员资源访问模型。

调用约束：

- 接口类型：gRPC
- 服务：`AuthService`
- 调用方：内部服务
- Proto 契约来源：
  - [auth.proto](/Users/acehood/Documents/GitHub/oes/src/common/src/contracts/auth_service/auth.proto)

## 2. 登录入口

### `LoginWithEmailPassword`

- 作用：使用邮箱与密码发起登录
- 使用场景：
  - 标准邮箱密码登录入口
- 适用调用方：
  - 未登录用户
  - 登录流程编排方
- 请求关键字段：
  - `email`
  - `password`
  - `device_name`，可选
  - `user_agent`，可选
  - `ip_address`，可选
  - `terminal`，由可信 BFF 入口归一化后传入
- 响应关键字段：
  - `status`
  - `user_id`
  - `challenge_id`
  - `accounts[]`
- 账户候选语义：
  - `accounts[]` 只携带 `account_id / tenant_id / scope_level / display_name`
  - 若调用方仍需要 tenant 名称，应在 gateway / BFF 通过 `tenant-org-service` 按 `tenant_id` 聚合补水
  - 候选列表不把 tenant lifecycle 作为本地 truth；最终账号选择必须由 `auth-service` 通过 `tenant-org-service.GetTenantById` 校验 `TENANT` scope account 的 tenant status
- 权限与上下文要求：
  - 不采用 `checkPermission`
  - 不采用 `buildQueryScope`
  - 不采用 `checkResource`
  - 不在 primary credential 阶段做 terminal access 判定
  - 依赖凭证校验、登录限流、MFA 分支逻辑与认证流程状态机
  - 密码登录失败时，`device_name / user_agent / ip_address` 会进入本地 audit，用于自助登录历史展示

### `RequestEmailOtpLoginChallenge`

- 作用：为邮箱 OTP 登录创建 challenge 并发码
- 使用场景：
  - 用户选择邮箱验证码登录
- 适用调用方：
  - 未登录用户
  - 登录流程编排方
- 请求关键字段：
  - `email`
- 响应关键字段：
  - `challenge_id`
  - `expires_at`
  - `destination`
- 权限与上下文要求：
  - 不采用资源授权模型
  - 依赖标识校验、发码频控与 challenge 生成规则

### `LoginWithEmailOtp`

- 作用：提交邮箱 OTP 并继续登录流程
- 使用场景：
  - 邮箱 OTP 登录第二步
- 适用调用方：
  - 未登录用户
  - 登录流程编排方
- 请求关键字段：
  - `email`
  - `otp`
- 响应关键字段：
  - `status`
  - `user_id`
  - `challenge_id`
  - `accounts[]`
- 账户候选语义：
  - `accounts[]` 只携带 `account_id / tenant_id / scope_level / display_name`
  - 若调用方仍需要 tenant 名称，应在 gateway / BFF 通过 `tenant-org-service` 按 `tenant_id` 聚合补水
- 权限与上下文要求：
  - 不采用资源授权模型
  - 依赖 OTP 校验与认证流程状态机

### `LoginWithPhonePassword`

- 作用：使用手机号与密码发起登录
- 使用场景：
  - 标准手机号密码登录入口
- 适用调用方：
  - 未登录用户
  - 登录流程编排方
- 请求关键字段：
  - `phone`
  - `password`
  - `device_name`，可选
  - `user_agent`，可选
  - `ip_address`，可选
  - `terminal`，由可信 BFF 入口归一化后传入
- 响应关键字段：
  - `status`
  - `user_id`
  - `challenge_id`
  - `accounts[]`
- 账户候选语义：
  - `accounts[]` 只携带 `account_id / tenant_id / scope_level / display_name`
  - 若调用方仍需要 tenant 名称，应在 gateway / BFF 通过 `tenant-org-service` 按 `tenant_id` 聚合补水
- 权限与上下文要求：
  - 不采用资源授权模型
  - 不在 primary credential 阶段做 terminal access 判定
  - 依赖凭证校验、登录限流、MFA 分支逻辑与认证流程状态机
  - 密码登录失败时，`device_name / user_agent / ip_address` 会进入本地 audit，用于自助登录历史展示

### `RequestPhoneOtpLoginChallenge`

- 作用：为手机 OTP 登录创建 challenge 并发码
- 使用场景：
  - 用户选择短信验证码登录
- 适用调用方：
  - 未登录用户
  - 登录流程编排方
- 请求关键字段：
  - `phone`
- 响应关键字段：
  - `challenge_id`
  - `expires_at`
  - `destination`
- 权限与上下文要求：
  - 不采用资源授权模型
  - 依赖标识校验、发码频控与 challenge 生成规则

### `LoginWithPhoneOtp`

- 作用：提交手机 OTP 并继续登录流程
- 使用场景：
  - 手机 OTP 登录第二步
- 适用调用方：
  - 未登录用户
  - 登录流程编排方
- 请求关键字段：
  - `phone`
  - `otp`
- 响应关键字段：
  - `status`
  - `user_id`
  - `challenge_id`
  - `accounts[]`
- 账户候选语义：
  - `accounts[]` 只携带 `account_id / tenant_id / scope_level / display_name`
  - 若调用方仍需要 tenant 名称，应在 gateway / BFF 通过 `tenant-org-service` 按 `tenant_id` 聚合补水
- 权限与上下文要求：
  - 不采用资源授权模型
  - 依赖 OTP 校验与认证流程状态机

### `LoginWithEmployeeCodePin`

- 作用：使用租户内员工编号与 user-scoped `TERMINAL_PIN` 发起现场终端登录
- 使用场景：
  - PDA 默认员工码 + PIN 登录
  - future KIOSK / 触摸屏员工码 + PIN 登录
- 适用调用方：
  - terminal-specific BFF
  - 未登录现场终端用户
- 请求关键字段：
  - `tenant_id` 或 `device_bound_tenant_id`，由受信 BFF 从受管终端设备绑定解析后传入
  - `employee_code`
  - `pin`
  - `terminal`，由可信 BFF 入口归一化后传入
  - `terminal_device_id`，受管终端必填
  - `device_name`，可选
  - `user_agent`，可选
  - `ip_address`，可选
  - `login_flow = EMPLOYEE_CODE_PIN`
- 响应关键字段：
  - `status`
  - `user_id`
  - `account_id`
  - `tenant_id`
  - `session`
  - `terminal`
  - `terminal_device_id`
  - `device_bound_tenant_id`
- 稳定流程：
  - `auth-service` 在 credential 校验前检查 Terminal Entry Login Policy 是否允许当前 terminal 使用 `EMPLOYEE_CODE_PIN`
  - `auth-service` 调用 `hr-service.ResolveActiveEmployeeByCode`，按 `device_bound_tenant_id + employee_code` 获取 active employee 与 active employment
  - `auth-service` 调用 `identity-service.ResolveEmployeeLoginAccount`，按 `tenant_id + employee_id` 获取唯一 enabled account 与 user
  - `auth-service` 校验该 user 的 `TERMINAL_PIN`
  - `auth-service` 执行 Terminal Access Policy 准入
  - 成功后建立 terminal-aware session，记录 `terminal / loginFlow / terminalDeviceId / deviceBoundTenantId`
- 失败语义：
  - PDA / KIOSK 等现场终端展示可以对凭据类失败统一显示“员工码或 PIN 错误”
  - 本地 auth audit 必须记录真实 reason code，例如 `EMPLOYEE_CODE_NOT_FOUND / EMPLOYEE_INACTIVE / TERMINAL_PIN_NOT_SET / INVALID_TERMINAL_PIN / TERMINAL_ACCESS_DENIED`
  - 不得在审计、日志或响应中记录 PIN 明文
- account selection：
  - `EMPLOYEE_CODE_PIN` 不进入 PDA account selection
  - 员工必须通过 `identity-service` 解析出唯一 enabled account；无绑定、disabled 或治理冲突时拒绝登录

### `SelectAccount`

- 作用：在一个自然人存在多个账号上下文时选择目标账号并建立 session，或进入登录 MFA。
- 请求关键字段：
  - `user_id`
  - `account_id`
  - `login_method`
  - `terminal`
- tenant lifecycle 准入：
  - `TENANT` scope account 必须通过 `tenant-org-service.GetTenantById` 查询目标 `tenant_id`
  - 只有 `tenant.status = ACTIVE` 时才允许继续 MFA challenge 或建立 session
  - `SYSTEM` scope account 不读取也不受 tenant status 影响
  - 同一用户存在多个 tenant account 时，只阻断被停用或归档 tenant 下的账号，不影响其他 `ACTIVE` tenant account
- terminal access 准入：
  - account 选择完成后、MFA challenge 创建前，`auth-service` 必须调用 `permission-service.PermissionTerminalAccessService.ResolveAccountTerminalAccess`
  - 若当前 account 不允许请求 terminal，返回稳定 `TERMINAL_ACCESS_DENIED`
  - 不允许时不得创建 MFA challenge，也不得建立 session 或签发 token

### `SubmitMfaChallenge`

- 作用：提交登录 MFA 结果并在验证成功后建立 session。
- 请求关键字段：
  - `challenge_id`
  - `factor`
  - `code`
  - pending MFA flow 中携带的 `terminal`
- tenant lifecycle 准入：
  - MFA challenge 发起后，管理员可能停用或归档租户，因此 session 建立前必须再次按 `tenant-org-service.GetTenantById` 校验 `TENANT` scope account
  - 若 tenant 不再是 `ACTIVE`，不得建立 session；调用方应要求用户重新选择可用账号或重新登录
- terminal access 准入：
  - MFA challenge 验证成功后、session 建立前，`auth-service` 必须再次使用 flow 中的 terminal 重查 terminal access
  - 若不允许，返回 `TERMINAL_ACCESS_DENIED`，不得签发 session / token

### `RequestPasswordRecoveryChallenge`

- 作用：为忘记密码流程创建一个找回 challenge，并在可恢复时触发 OTP 投递。
- 使用场景：
  - 登录页自助找回密码第一步
- 适用调用方：
  - 未登录用户
  - 登录流程编排方
- 请求关键字段：
  - `channel`
  - `identifier`
- 响应关键字段：
  - `accepted`
  - `challenge_id`
  - `expires_at`
  - `masked_destination`
- 稳定语义：
  - 返回通用 accepted 语义，避免暴露账号存在性
  - OTP challenge 与校验语义以 `auth-service` 唯一真相源为准
  - `notification-service` 只负责通知 dispatch；production 与普通 local development 均通过 trusted gRPC boundary，只有 isolated unit test 可以注入不修改 OTP 的 fake port

### `InspectPasswordRecoveryChannels`

- 作用：根据已提交的一个登录标识，解析当前账号可用的已验证找回通道。
- 使用场景：
  - 登录页在验证码发送前，需要判断是默认单通道还是让用户选择邮箱 / 手机
- 适用调用方：
  - 未登录用户
  - 登录流程编排方
- 请求关键字段：
  - `identifier`
- 响应关键字段：
  - `channels[]`
  - `default_channel`
- 稳定语义：
  - 先通过已提交标识匹配当前用户，再回看该用户已验证且启用的邮箱 / 手机登录方式
  - 仅当只有一个可用通道时返回 `default_channel`
  - 不负责发码，只负责恢复方式判定

### `VerifyPasswordRecoveryChallenge`

- 作用：校验找回密码 OTP，并签发一次性 reset grant token。
- 使用场景：
  - 登录页自助找回密码第二步
- 适用调用方：
  - 未登录用户
  - 登录流程编排方
- 请求关键字段：
  - `challenge_id`
  - `otp`
- 响应关键字段：
  - `verified`
  - `reset_token`
- 稳定语义：
  - 仅校验 `RESET_PASSWORD` usage 的 challenge
  - 成功后签发一次性 reset grant token

### `CompletePasswordRecovery`

- 作用：使用已验证的 reset grant token 设置新密码并吊销全部既有 session。
- 使用场景：
  - 登录页自助找回密码最后一步
- 适用调用方：
  - 未登录用户
  - 登录流程编排方
- 请求关键字段：
  - `reset_token`
  - `new_password`
- 响应关键字段：
  - `success`
  - `sessions_revoked`
- 稳定语义：
  - 必须消费一次性 reset grant token
  - 成功后必须吊销该 user 的全部现有 session

### `BootstrapOwnLoginMethods`

- 作用：在当前认证用户完成自助邮箱 / 手机绑定后，为该用户补齐对应登录方式
- 使用场景：
  - 已登录用户完成联系方式绑定后的自助安全后置流程
- 适用调用方：
  - `auth-bff` self-service 链路
- 请求关键字段：
  - `user_id`
  - `account_id`
  - `email` 或 `phone`
- 权限与上下文要求：
  - 必须带 authenticated operator context
  - 不采用管理员型 permission code
  - controller 必须校验 `operator_id == account_id`
- 稳定语义：
  - 这是 self-service 专用写接口
  - 仅补齐 OTP-ready login method，不附带管理员开通语义

### `BootstrapUserLoginMethods`

- 作用：为管理员创建 / 修复账号时补齐目标用户登录方式
- 使用场景：
  - 管理员开通账号
  - 管理端修复账号登录入口
- 适用调用方：
  - 管理接口编排方
- 请求关键字段：
  - `user_id`
  - `account_id`
  - `email` 或 `phone`
- 权限与上下文要求：
  - 需要 `auth.account_credentials.bootstrap`
- 稳定语义：
  - 这是 admin-management 专用写接口
  - self-service 链路不得再复用该接口

## 3. MFA 与账户选择桥接

### `SubmitMfaChallenge`

- 作用：在登录流程中提交 MFA challenge
- 使用场景：
  - 用户完成主登录后，被要求继续提交 MFA 验证码
- 适用调用方：
  - 正在登录的用户
  - 登录流程编排方
- 请求关键字段：
  - `challenge_id`
  - `factor`
  - `code`
  - `factor_challenge_id`，仅 `EMAIL_OTP / SMS_OTP` 必填
  - `login_method`
- 响应关键字段：
  - `user_id`
  - `method`
  - `accounts[]`
- 账户候选语义：
  - `accounts[]` 只携带 `account_id / tenant_id / scope_level / display_name`
  - 若调用方仍需要 tenant 名称，应在 gateway / BFF 通过 `tenant-org-service` 按 `tenant_id` 聚合补水
- 权限与上下文要求：
  - 不采用 `checkPermission`
  - 不采用 `buildQueryScope`
  - 不采用 `checkResource`
  - 依赖 challenge 有效性、验证码校验与登录流程状态机
- 关联说明：
  - 该能力同时也是 `mfa` 模块中的认证流程接口，MFA 绑定与自助安全管理边界见 [mfa.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/auth-service/mfa.md)
  - `challenge_id` 是登录 MFA flow token，当前实现允许 JWT 长度，调用方不得按短 ID 校验。
  - `factor` 必须属于当前登录 MFA flow 所属 tenant policy 与当前 user 可用绑定的交集。
  - `BACKUP_CODE` 验证成功后必须停用当前恢复码绑定并使旧恢复码集合整体失效。

### `RequestLoginMfaFactorChallenge`

- 作用：在已存在的登录 MFA flow 中，为用户主动选择的 OTP 因子创建 factor-specific challenge。
- 使用场景：
  - 用户进入 MFA 页面后主动点击发送邮箱验证码或短信验证码
  - 用户在冷却结束后主动重新发送邮箱验证码或短信验证码
- 适用调用方：
  - 正在登录的用户
  - 登录流程编排方
- 请求关键字段：
  - `challenge_id`
  - `factor`
- 响应关键字段：
  - `challenge_id`
  - `destination`
  - `expires_at`
- 权限与上下文要求：
  - 不采用 `checkPermission`
  - 不采用 `buildQueryScope`
  - 不采用 `checkResource`
  - 依赖登录 MFA flow challenge 有效性、因子可用性与 OTP 发码频控
- 契约约束：
  - `MFA_REQUIRED` 响应不得自动调用该能力
  - `EMAIL_OTP / SMS_OTP` 必须由用户主动触发后才创建 factor-specific challenge
  - `TOTP / BACKUP_CODE` 不需要该 factor-specific OTP challenge
  - captcha provider 校验属于外部 HTTP / BFF 边界，`auth-service` 只接收已被 BFF 允许的内部请求

### `SelectAccount`

- 作用：在多账户候选中选择一个账户并建立最终 session
- 使用场景：
  - 一个自然人登录后拥有多个可选账户
- 适用调用方：
  - 已通过主认证与 MFA 的用户
  - 登录流程编排方
- 请求关键字段：
  - `user_id`
  - `account_id`
  - `login_method`
  - `device_id`
  - `device_name`
  - `user_agent`
  - `ip_address`
  - `terminal`
- 响应关键字段：
  - `status`
  - `user_id`
  - `account_id`
  - `tenant_id`
  - `mfa_scenario`
  - `default_mfa_factor`
  - `available_factors[]`
  - `session_id`
  - `access_token`
  - `refresh_token`
- 权限与上下文要求：
  - 不采用资源授权模型
  - 依赖账户归属校验、账户可用性校验与会话建立流程
- Terminal Access Policy 语义：
  - `terminal` 来自可信 BFF 入口，不来自客户端自由声明
  - terminal access 判定发生在 tenant lifecycle 校验之后、MFA 判定之前
  - 不允许时返回 `TERMINAL_ACCESS_DENIED`，不创建 MFA challenge，不签发 session
- MFA 语义：
  - 登录 MFA 判定发生在账号选择之后，因为只有选定 account 后才能确定 tenant policy。
  - 如果所选 tenant 未要求 `LOGIN` MFA，则直接建立 session。
  - 如果所选 tenant 要求 `LOGIN` MFA，则返回 `MFA_REQUIRED`，并携带 `mfa_scenario=LOGIN`、`default_mfa_factor` 与按 tenant priority 排序的 `available_factors[]`。
  - `EMAIL_OTP / SMS_OTP` 不会在返回 `MFA_REQUIRED` 时自动发码；必须由调用方随后显式调用 `RequestLoginMfaFactorChallenge`。

## 4. 会话续期

### `RefreshSession`

- 作用：使用 refresh token 刷新 session
- 使用场景：
  - access token 续期
  - refresh token 轮换
- 适用调用方：
  - 已建立 session 的客户端
  - 登录态续期流程编排方
- 请求关键字段：
  - `refresh_token`
- 响应关键字段：
  - `session_id`
  - `access_token`
  - `refresh_token`
  - `terminal`
  - `expires_in`
- Terminal Access Policy 语义：
  - refresh 不接受客户端重新声明 terminal
  - `auth-service` 必须从当前 session / refresh token claims 读取原 terminal
  - refresh 前重查 terminal access
  - 若当前 terminal 已不再允许，拒绝 refresh，删除或撤销 session，并记录 `SESSION_REFRESH_DENIED_TERMINAL_ACCESS`

## 5. 登录方式管理

### `ListLoginMethods`

- 作用：返回指定 user 的登录方式状态。
- 使用场景：
  - 当前用户自助查看自己的登录方式
  - 管理员查看目标账号对应 user 的登录方式
- 请求关键字段：
  - `user_id`
- 响应关键字段：
  - `login_methods[].method_id`
  - `login_methods[].type`
  - `login_methods[].masked_identifier`
  - `login_methods[].verified`
  - `login_methods[].enabled`
  - `login_methods[].has_password`
  - `password_setup_required`
- 安全约束：
  - 不返回 password hash、OTP、credential secret、TOTP secret 或 recovery code 存储值

### `ChangeOwnPassword`

- 作用：在校验当前密码后修改指定 user 的统一登录密码。
- 使用场景：
  - 已登录用户自助修改密码
- 请求关键字段：
  - `user_id`
  - `current_password`
  - `new_password`
- 响应关键字段：
  - `success`
  - `password_setup_required`
- 安全约束：
  - 必须校验当前密码
  - 成功后应清除当前 user 的显式 password setup requirement

### `RequirePasswordSetup`

- 作用：标记指定 user 必须在后续登录后设置新密码。
- 使用场景：
  - 管理员要求用户重设密码
  - 安全策略要求用户重设密码
- 请求关键字段：
  - `user_id`
  - `required_by`
  - `reason`
  - `revoke_sessions`
- 响应关键字段：
  - `success`
  - `password_setup_required`
- 安全约束：
  - 不接收、不生成、不返回明文密码
  - 必须产生认证审计事件

### `SetLoginMethodEnabled`

- 作用：启用或停用指定 user 的一个登录方式。
- 使用场景：
  - 用户自助停用自己的登录方式
  - 管理员治理目标 user 的登录方式
- 请求关键字段：
  - `user_id`
  - `method_id`
  - `enabled`
  - `operator_id`
  - `reason`
- 响应关键字段：
  - `success`
  - `login_method`
- 安全约束：
  - 不得停用最后一个可用登录方式
  - 必须产生认证审计事件
  - `refresh_token`
  - `expires_in`
- 权限与上下文要求：
- 不采用资源授权模型
- 依赖 refresh token 校验、replay 检测与 session 状态机

## 5. 自助登录历史查询

### `ListLoginHistory`

- 作用：查询当前认证用户自己的登录尝试历史
- 使用场景：
  - 个人账户安全中心中的“登录历史”
- 适用调用方：
  - 已登录用户的 BFF
  - 受控自助安全页面
- 请求关键字段：
  - `user_id`
  - `result`
  - `occurred_at_from`
  - `occurred_at_to`
  - `cursor`
  - `page_size`
- 响应关键字段：
  - `occurred_at`
  - `outcome`
  - `login_method`
  - `ip_address`
  - `device_name`
  - `platform`
  - `browser`
  - `failure_reason`
  - `trace_id`
- 权限与上下文要求：
  - 不采用管理员型 `checkPermission`
  - 不采用 `buildQueryScope`
  - 不采用 `checkResource`
  - 依赖 self-bound `user_id` 语义与本地 audit 记录
- 语义说明：
  - 当前只查询 `LOGIN_SUCCEEDED / LOGIN_FAILED`
  - 不混入 session 生命周期事件
  - 该查询是 `user` 级安全历史，不是 `account` 级会话历史

## 6. 当前授权模型说明

本模块中的接口统一归类为认证流程接口，而不是资源授权接口。

因此它们当前都：

- 不采用管理员型 `checkPermission`
- 不采用 `buildQueryScope`
- 不采用 `checkResource`

控制边界主要来自：

- 凭证 / OTP / challenge / token 校验
- 限流 / 风控
- 账户归属校验
- 登录流程状态机
- Terminal Access Policy 判定，其中策略真相归 `permission-service`

## 7. Terminal Access Policy 集成说明

登录准入 terminal 由上游可信 BFF 固定：

- Web auth-bff 固定 `WEB`
- PDA auth-bff 固定 `PDA`
- KIOSK auth-bff 固定 `KIOSK`

`auth-service` 不信任客户端自由声明 terminal，也不拥有 terminal access 策略模型。

Session / token 要求：

- 建立 session 时持久化 terminal。
- access token 和 refresh token claims 携带 terminal。
- `ValidateAccessTokenResponse` 返回 terminal。
- 登录成功审计包含 terminal。

稳定拒绝语义：

- gRPC 层：`LOGIN_STATUS_DENIED + reason_code=TERMINAL_ACCESS_DENIED`
- HTTP 层：由 BFF 映射为业务型 `DENIED` 响应
- 不向登录端返回 `effectiveAllowedTerminals`
