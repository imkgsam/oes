# identity-service Query API

## 1. 模块职责

`IdentityQueryService` 负责提供只读身份查询能力，不修改状态。

适用场景：

- 登录后账户候选查询
- 按邮箱 / 手机 / 用户 ID 查询自然人身份
- 按账户 ID 查询账号摘要
- 按租户 ID 查询租户摘要
- 查询组织树、账户组织归属
- 查询联系方式资产
- 查询机器身份与 API Key 摘要

调用约束：

- 接口类型：gRPC
- 服务：`IdentityQueryService`
- 调用方：内部服务
- 权限要求：当前无细粒度 permission guard
- operator context：查询侧当前不强制要求

## 2. 用户与账户查询

### 用户标识语义

- `user.id` 是 identity 用户的稳定技术标识。
- `user.username` 是历史字段，当前只能按可选 login handle 理解。
- `user.username` 不是真实姓名、法定姓名、昵称或展示名真相源。
- 如后续需要唯一用户名登录，应先冻结 login handle 语义，再新增或调整契约。
- 如后续需要真实姓名搜索，应通过 `party-service` 的自然人主体模型协同设计，不在 `identity-service` query 中直接扩展姓名模糊搜索。

### `GetUserById`

- 作用：按 `userId` 查询自然人身份摘要
- 请求关键字段：
  - `user_id`
- 响应关键字段：
  - `user.id`
  - `user.username`
  - `user.personal_email`
  - `user.personal_phone`
  - `user.is_active`
- 返回空语义：
  - 用户不存在时返回空响应对象

### `GetUserByEmail`

- 作用：按个人邮箱查询自然人身份摘要
- 请求关键字段：
  - `email`
- 响应关键字段：同 `GetUserById`
- 返回空语义：
  - 未匹配时返回空响应对象

### `GetUserByPhone`

- 作用：按个人手机号查询自然人身份摘要
- 请求关键字段：
  - `phone`
- 响应关键字段：同 `GetUserById`
- 返回空语义：
  - 未匹配时返回空响应对象

### `GetAccountsByUserId`

- 作用：查询某个自然人可选择的账户列表
- 请求关键字段：
  - `user_id`
- 响应关键字段：
  - `accounts[].account_id`
  - `accounts[].tenant_id`
  - `accounts[].display_name`
- 说明：
  - 适合 `auth-service` 登录后账户选择场景

### `GetAccountById`

- 作用：按账户 ID 查询账户摘要
- 请求关键字段：
  - `account_id`
- 响应关键字段：
  - `account.id`
  - `account.user_id`
  - `account.tenant_id`
  - `account.display_name`
  - `account.is_enabled`
- 返回空语义：
  - 未匹配时返回空响应对象

### `ListAccounts`

- 作用：按当前操作者可见范围列出分页账号目录
- 请求关键字段：
  - `keyword`
  - `scope_level`
  - `status`
  - `page`
  - `page_size`
- 响应关键字段：
  - `accounts[].account_id`
  - `accounts[].user_id`
  - `accounts[].tenant_id`
  - `accounts[].tenant_name`
  - `accounts[].scope_level`
  - `accounts[].display_name`
  - `accounts[].is_enabled`
  - `total`
- 过滤语义：
  - `keyword` 可匹配账号 ID、用户 ID、显示名、用户名、邮箱、手机号与租户名
  - `scope_level` 当前支持 `SYSTEM / TENANT`
  - `status` 当前支持 `ENABLED / DISABLED`
- 作用域约束：
  - system scope 可列出全局可见账号
  - tenant-bound operator 仅列出本 tenant 可见账号
  - tenant 边界由 query scope builder 收敛，不依赖调用方自行传 `tenant_id`
- 排序与分页：
  - 当前实现按 `createdAt desc, id desc`
  - `page` 为 1-based；`page_size` 默认 20，最大 100
- 第一阶段边界：
  - 当前只覆盖 `USER` account 目录
  - 不返回角色、组织归属、会话状态等详情

## 3. 租户与组织查询

### `GetTenantById`

- 作用：按租户 ID 查询租户最小摘要
- 请求关键字段：
  - `tenant_id`
- 响应关键字段：
  - `tenant.id`
  - `tenant.code`
  - `tenant.name`
  - `tenant.is_active`
- 返回空语义：
  - 未匹配时返回空响应对象

### `GetOrgTreeByTenantId`

- 作用：查询租户组织树
- 请求关键字段：
  - `tenant_id`
- 响应关键字段：
  - `roots[]`
  - `OrgNode.children[]`
- 排序语义：
  - 当前实现按稳定树结构返回

### `ListAccountOrgMemberships`

- 作用：列出账户全部组织归属
- 请求关键字段：
  - `account_id`
- 响应关键字段：
  - `memberships[].id`
  - `memberships[].account_id`
  - `memberships[].org_id`
  - `memberships[].org_name`
  - `memberships[].org_type`
  - `memberships[].relation_type`
  - `memberships[].is_primary`

## 4. 联系方式资产查询

### `ListAccountWorkEmailAssets`

- 作用：列出账户全部工作邮箱资产
- 请求关键字段：
  - `account_id`
- 响应关键字段：
  - `assets[].id`
  - `assets[].type`
  - `assets[].value`
  - `assets[].status`
  - `assets[].is_primary`
  - `assets[].assigned_at`
  - `assets[].revoked_at`

### `ListAccountWorkPhoneAssets`

- 作用：列出账户全部工作手机号资产
- 请求关键字段：
  - `account_id`
- 响应关键字段：同 `ListAccountWorkEmailAssets`

## 5. 机器身份查询

### `GetServiceAccountById`

- 作用：按 ID 查询机器账号摘要
- 请求关键字段：
  - `service_account_id`
- 响应关键字段：
  - `account.id`
  - `account.tenant_id`
  - `account.scope_level`
  - `account.type`
  - `account.name`
  - `account.status`

### `ListServiceAccounts`

- 作用：按条件列出机器账号
- 请求关键字段：
  - `tenant_id`
  - `scope_level`
  - `type`
  - `status`
- 说明：
  - 以上过滤字段均可选

### `GetApiKeyById`

- 作用：按 ID 查询 API Key 摘要
- 请求关键字段：
  - `api_key_id`
- 响应关键字段：
  - `api_key.id`
  - `api_key.service_account_id`
  - `api_key.key_code`
  - `api_key.status`
  - `api_key.expires_at`
  - `api_key.last_used_at`
- 敏感信息约束：
  - 不返回 secret 明文

### `ListApiKeysByServiceAccountId`

- 作用：列出某个机器账号下的全部 API Key 摘要
- 请求关键字段：
  - `service_account_id`
- 响应关键字段：
  - `api_keys[]`
- 敏感信息约束：
  - 不返回 secret 明文

## 6. 主要错误与返回约束

- 输入参数非法时：
  - 返回统一 validation failure
- 查询对象不存在时：
  - 多数查询接口返回空响应对象，而不是抛业务异常
- 调用方不应依赖下游内部异常结构来推断业务流程
