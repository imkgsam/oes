# auth-service MFA API

> 服务设计唯一真相源：[auth-service.md](../../architecture/services/auth-service.md)。本文只描述黑盒 gRPC MFA 接口语义，不重新定义 `auth-service` 的长期职责、核心对象或 owner 边界。
> 管理入口涉及的 permission code、checkPermission、checkResource 或 buildQueryScope 语义，以 [permission-service.md](../../architecture/services/permission-service.md) 与项目级授权架构为准；本文只描述 auth-service MFA contract。

## 1. 接口范围

`AuthService` 的 MFA 相关接口负责提供：

- 当前用户自助查看与维护 MFA 绑定
- 当前用户初始化或轮换 TOTP / Recovery Codes
- 登录流程中的 MFA challenge 提交
- 已登录敏感操作的 step-up MFA challenge 与短期授权

调用约束：

- 接口类型：gRPC
- 服务：`AuthService`
- 调用方：内部服务
- Proto 契约来源：
  - [auth.proto](../../../src/common/src/contracts/auth_service/auth.proto)

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
- 稳定语义：
  - 只有当前用户已经完成并启用 `TOTP` 绑定后，才能初始化恢复码。
  - 如果 `TOTP` 未绑定或未启用，应返回明确业务错误，前端提示先绑定认证器 App。
  - 生成后的恢复码只在本次响应中展示，服务端只保存 hash。

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
- 稳定语义：
  - 重新生成恢复码同样要求当前用户已经启用 `TOTP`。
  - 重新生成后旧恢复码集合整体失效。

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
  - `factor`
  - `code`
  - `factor_challenge_id`，仅 OTP 因子必填
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
- 关联说明：
  - 该能力同时属于登录流程桥接接口；完整登录续流语义见 [login.md](./login.md)
  - `BACKUP_CODE` 成功验证后，当前恢复码集合整体作废并停用 `BACKUP_CODE` 绑定。
  - `TOTP` 与 `BACKUP_CODE` 不依赖 factor-specific OTP challenge。
  - `EMAIL_OTP / SMS_OTP` 必须携带由 `RequestLoginMfaFactorChallenge` 生成的 `factor_challenge_id`。

## 4. 租户登录 MFA 策略接口

### `GetTenantMfaPolicy`

- 作用：读取一个租户的登录 MFA 策略快照。
- 使用场景：
  - BFF 管理页加载当前租户登录 MFA 设置
  - 登录 MFA 编排在账号选择后读取所选 tenant 的策略
- 请求关键字段：
  - `tenant_id`
- 响应关键字段：
  - `tenant_id`
  - `login_required`
  - `scenario_requirements[].scenario`
  - `scenario_requirements[].required`
  - `factors[].factor`
  - `factors[].enabled`
  - `factors[].priority`
- 稳定语义：
  - 当前策略模型已支持 `LOGIN / CHANGE_PASSWORD / CHANGE_CONTACT / NEW_DEVICE_LOGIN` 四个场景。
  - 如果没有租户 override，应返回默认策略：`login_required=false`，四种因子按默认 priority 返回。

### `UpdateTenantMfaPolicy`

- 作用：更新一个租户的登录 MFA 策略快照。
- 使用场景：
  - 租户管理员保存登录 MFA 设置页
- 请求关键字段：
  - `tenant_id`
  - `login_required`
  - `scenario_requirements[].scenario`
  - `scenario_requirements[].required`
  - `factors[].factor`
  - `factors[].enabled`
  - `factors[].priority`
  - `operator_id`
- 响应关键字段：
  - 与 `GetTenantMfaPolicy` 相同
- 稳定语义：
  - 请求必须覆盖 `EMAIL_OTP / SMS_OTP / TOTP / BACKUP_CODE` 四个受管因子且每个只出现一次。
  - `login_required` 仍作为 `LOGIN` 场景的兼容镜像字段；正式多场景真相以 `scenario_requirements` 为准。
  - 策略归属 tenant；用户自己的 MFA 绑定资产仍归 user。
  - 系统管理员平台默认 MFA 策略继续后置，不在本接口中表达平台覆盖租户的继承规则。

## 5. 已登录 step-up MFA 接口

### `StartStepUpMfaChallenge`

- 作用：为已登录后的敏感操作创建一个 MFA challenge。
- 使用场景：
  - 修改密码前
  - 更换邮箱 / 手机前
  - 仅保留 `NEW_DEVICE_LOGIN` 契约占位，不作为当前登录新设备识别的正式入口
- 请求关键字段：
  - `user_id`
  - `account_id`
  - `tenant_id`
  - `scenario`
- 响应关键字段：
  - `required`
  - `challenge_id`
  - `scenario`
  - `default_mfa_factor`
  - `available_factors[]`
- 稳定语义：
  - 只有当当前 tenant policy 要求该 `scenario` 进入 MFA 时，才返回 `required=true` 与 challenge 详情。
  - 因子可用性仍由 user 自己已绑定且已启用的 MFA 资产决定。
  - 当前正式的新设备登录命中不通过本接口触发，而是在账号选择后由 trusted-device 判定自动进入登录续流 MFA。

### `CompleteStepUpMfaChallenge`

- 作用：完成 step-up MFA challenge，并换取一个短时 `mfa_grant_token`。
- 使用场景：
  - 前端在敏感操作提交前完成 MFA 验证，然后把 `mfa_grant_token` 带给最终写接口。
- 请求关键字段：
  - `challenge_id`
  - `factor`
  - `code`
  - `factor_challenge_id`
- 响应关键字段：
  - `success`
  - `scenario`
  - `mfa_grant_token`
- 稳定语义：
  - 当前 grant 只面向 `CHANGE_PASSWORD / CHANGE_CONTACT` 这类已登录敏感操作。
  - `NEW_DEVICE_LOGIN` 仍属于登录续流，不复用 step-up grant。

## 6. 新设备登录 trusted-device 语义

- 作用：
  - 在账号选择后，基于显式 trusted-device 真相判断当前设备是否属于该用户在当前租户下已识别设备。
- 命中条件：
  - 当前账号属于 tenant scope
  - 当前 tenant policy 开启 `NEW_DEVICE_LOGIN`
  - 当前请求携带稳定 `deviceId`
  - `auth-service` 的 trusted-device 持久化中不存在 `userId + tenantId + deviceId` 记录
- 明确禁止：
  - 不能以裸 `ipAddress` 相等当作 trusted device
  - 不能以裸 `userAgent` 相等当作 trusted device
- 成功后果：
  - 用户完成本次 `NEW_DEVICE_LOGIN` MFA 后，当前 `userId + tenantId + deviceId` 会写入认证域 trusted-device 记录；长期边界以 [auth-service.md](../../architecture/services/auth-service.md) 为准。
  - 后续同一用户在同一租户、同一 `deviceId` 下再次登录时，不再单独命中 `NEW_DEVICE_LOGIN`。

## 7. 当前授权模型说明

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
