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
- 响应关键字段：
  - `status`
  - `user_id`
  - `challenge_id`
  - `accounts[]`
- 权限与上下文要求：
  - 不采用 `checkPermission`
  - 不采用 `buildQueryScope`
  - 不采用 `checkResource`
  - 依赖凭证校验、登录限流、MFA 分支逻辑与认证流程状态机

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
- 响应关键字段：
  - `status`
  - `user_id`
  - `challenge_id`
  - `accounts[]`
- 权限与上下文要求：
  - 不采用资源授权模型
  - 依赖凭证校验、登录限流、MFA 分支逻辑与认证流程状态机

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
- 权限与上下文要求：
  - 不采用资源授权模型
  - 依赖 OTP 校验与认证流程状态机

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
  - `session_id`
  - `access_token`
  - `refresh_token`
- 权限与上下文要求：
  - 不采用资源授权模型
  - 依赖账户归属校验、账户可用性校验与会话建立流程

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
  - `expires_in`
- 权限与上下文要求：
  - 不采用资源授权模型
  - 依赖 refresh token 校验、replay 检测与 session 状态机

## 5. 当前授权模型说明

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
