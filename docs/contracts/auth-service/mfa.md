# auth-service MFA API

## 1. 模块职责

`AuthService` 的 MFA 相关接口负责提供：

- 当前用户自助查看与维护 MFA 绑定
- 当前用户初始化或轮换 TOTP / Recovery Codes
- 登录流程中的 MFA challenge 提交

调用约束：

- 接口类型：gRPC
- 服务：`AuthService`
- 调用方：内部服务
- 契约真相源：
  - [auth.proto](/Users/acehood/Documents/GitHub/oes/src/common/src/contracts/auth_service/auth.proto)

## 2. 自助安全管理接口

### `ListMfaBindings`

- 作用：列出当前用户的 MFA 绑定状态
- 使用场景：
  - 账号安全页读取当前 MFA 配置
  - 前端据此决定展示哪些启停与初始化动作
- 适用调用方：
  - 当前登录用户本人
- 请求关键字段：
  - `user_id`
- 响应关键字段：
  - `bindings[].binding_id`
  - `bindings[].type`
  - `bindings[].enabled`
  - `bindings[].available`
  - `bindings[].destination`
  - `bindings[].updated_at`
- 权限与上下文要求：
  - 不采用管理员型 `checkPermission`
  - 不采用 `buildQueryScope`
  - 不采用 `checkResource`
  - 依赖 self-bound 自助语义与调用方身份真实性

### `EnableMfaBinding`

- 作用：启用某种 MFA 绑定
- 使用场景：
  - 当前用户开启邮箱 OTP 或短信 OTP 绑定
- 适用调用方：
  - 当前登录用户本人
- 请求关键字段：
  - `user_id`
  - `type`
- 响应关键字段：
  - `success`
  - `binding`
- 权限与上下文要求：
  - 不采用管理员型 `checkPermission`
  - 不采用 `checkResource`
  - 依赖当前用户身份与 MFA 绑定业务规则

### `DisableMfaBinding`

- 作用：关闭某种 MFA 绑定
- 使用场景：
  - 当前用户调整自己的 MFA 策略
- 适用调用方：
  - 当前登录用户本人
- 请求关键字段：
  - `user_id`
  - `type`
- 响应关键字段：
  - `success`
  - `binding`
- 权限与上下文要求：
  - 不采用管理员型 `checkPermission`
  - 不采用 `checkResource`
  - 依赖当前用户身份与 MFA 绑定业务规则

### `InitializeTotpBinding`

- 作用：初始化 TOTP 绑定材料
- 使用场景：
  - 当前用户为认证器 App 准备 secret 与二维码
- 适用调用方：
  - 当前登录用户本人
- 请求关键字段：
  - `user_id`
- 响应关键字段：
  - `binding`
  - `secret`
  - `qr_code_url`
- 权限与上下文要求：
  - 不采用管理员型 `checkPermission`
  - 不采用 `checkResource`
  - 依赖当前用户身份与 TOTP 初始化流程规则

### `ActivateTotpBinding`

- 作用：提交验证码并激活 TOTP 绑定
- 使用场景：
  - 当前用户完成认证器 App 绑定激活
- 适用调用方：
  - 当前登录用户本人
- 请求关键字段：
  - `user_id`
  - `binding_id`
  - `code`
- 响应关键字段：
  - `success`
  - `binding`
- 权限与上下文要求：
  - 不采用管理员型 `checkPermission`
  - 不采用 `checkResource`
  - 依赖当前用户身份、验证码校验与激活流程规则

### `InitializeRecoveryCodes`

- 作用：初始化恢复码集合
- 使用场景：
  - 当前用户首次启用恢复码
- 适用调用方：
  - 当前登录用户本人
- 请求关键字段：
  - `user_id`
- 响应关键字段：
  - `binding`
  - `recovery_codes`
- 权限与上下文要求：
  - 不采用管理员型 `checkPermission`
  - 不采用 `checkResource`
  - 依赖当前用户身份与恢复码生成规则

### `RegenerateRecoveryCodes`

- 作用：重新生成恢复码集合
- 使用场景：
  - 当前用户认为旧恢复码已泄漏并主动轮换
- 适用调用方：
  - 当前登录用户本人
- 请求关键字段：
  - `user_id`
- 响应关键字段：
  - `binding`
  - `recovery_codes`
- 权限与上下文要求：
  - 不采用管理员型 `checkPermission`
  - 不采用 `checkResource`
  - 依赖当前用户身份与恢复码轮换规则

## 3. 认证流程接口

### `SubmitMfaChallenge`

- 作用：在登录流程中提交 MFA challenge
- 使用场景：
  - 用户完成首阶段登录后，根据 challenge 继续提交 MFA 验证码
- 适用调用方：
  - 正在登录的用户
  - 认证流程编排方
- 请求关键字段：
  - `challenge_id`
  - `code`
  - `login_method`
- 响应关键字段：
  - `user_id`
  - `method`
  - `accounts[]`
- 权限与上下文要求：
  - 不采用 `checkPermission`
  - 不采用 `buildQueryScope`
  - 不采用 `checkResource`
  - 依赖 challenge 有效性、验证码校验与登录流程状态机

## 4. 当前授权模型说明

本模块中的接口不按管理员资源访问模型设计。

当前模型分为两类：

- 自助安全管理：
  - 以当前用户本人为边界
  - 不采用管理员型 `checkPermission`
  - 不采用通用 `checkResource`
- 认证流程支撑：
  - 以 challenge / token / 登录状态机为边界
  - 不属于资源授权问题

因此，`mfa` 模块当前不作为 `checkResource` 或 `buildQueryScope` 的首批落点。
