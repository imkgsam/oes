# auth-service Login API

## 1. 模块职责

`AuthService` 的登录与认证流程接口负责提供：

- 邮箱 / 手机密码登录
- 邮箱 / 手机 OTP 登录
- MFA challenge 提交
- 多账户选择
- refresh token 续期

这些接口共同组成认证协议与会话建立流程，而不是管理员资源访问模型。

调用约束：

- 接口类型：gRPC
- 服务：`AuthService`
- 调用方：内部服务
- 契约真相源：
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
- 响应关键字段：
  - `status`
  - `user_id`
  - `challenge_id`
  - `accounts[]`
- 账户候选语义：
  - `accounts[]` 只携带 `account_id / tenant_id / scope_level / display_name`
  - 若调用方仍需要 tenant 名称，应在 gateway / BFF 通过 `tenant-org-service` 按 `tenant_id` 聚合补水
- 权限与上下文要求：
  - 不采用 `checkPermission`
  - 不采用 `buildQueryScope`
  - 不采用 `checkResource`
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
  - OTP 真相归 `auth-service`
  - Notification 仅负责模拟投递

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
  - 依赖 self-bound `user_id` 语义与本地 audit 真相源
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
