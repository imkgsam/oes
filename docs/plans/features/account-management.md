# Account Management

> 涉及 AccountRole、Role、Policy、permission code 或授权判定的服务设计边界，以 [permission-service.md](../../architecture/services/permission-service.md) 为准。本文只记录 Account Management feature 的范围、状态与页面接入约束。

## 1. 目标

- 提供管理员账号管理入口，以账号列表与过滤作为第一层工作流。
- 在账号行操作中进入角色配置，让账号相关角色调整归属于账号管理，而不是暴露独立账号角色管理入口。
- 复用已冻结的 Gateway `account-role` contract，不重新定义 AccountRole 语义。
- 系统管理员可以管理 system scope 与 tenant scope 的用户账号角色绑定。
- 租户管理员只能管理当前租户范围内的用户账号角色绑定。

## 2. 不做什么

- 不做完整账号 CRUD、账号删除、重置密码或账号生命周期审批。
- 不做服务账号目录；第一阶段账号目录只覆盖 `USER` account。
- 不做 Policy 管理或 Policy Explain。
- 不做批量有效期编辑；`PUT /account/:accountId/roles` 当前只承接全量 role set。
- 不做手动创建租户；该能力已进入 backlog。
- 不让前端直接调用 `identity-service`。

## 3. 上游依赖

- architecture:
  - [role-based-permission-resolution.md](../../architecture/platforms/role-based-permission-resolution.md)
- adr:
  - [0002-system-role-instance-and-account-role-scope.md](../../adr/0002-system-role-instance-and-account-role-scope.md)
- contracts:
  - [permission-management.md](../../contracts/api-gateway/permission-management.md)
  - [auth-bff-admin-security.md](../../contracts/api-gateway/auth-bff-admin-security.md)
- feature prerequisites:
  - [permission-management.md](./permission-management.md)
  - [role-management.md](./role-management.md)

## 4. 当前结论

- 当前 feature 是账号管理第一阶段，提供管理员可见范围内的账号目录。
- 页面入口为 `/admin/account-management`，navigation entry 为 `admin.account-management`。
- 页面第一层为账号列表与过滤：
  - 关键字：账号 ID、用户 ID、邮箱、手机号。
  - Scope：全部 / 系统账号 / 租户账号。
  - 状态：全部 / 启用 / 停用。
- 页面使用 `GET /auth/admin/accounts` 加载管理员当前可见范围内的分页账号目录，首屏默认加载第一页。
- 账号列表的操作列提供 `角色配置`。
- 账号列表的操作列还提供 `启用账号 / 停用账号`。
- 页面提供 `添加账号` 操作。
- 新账号创建成功后，系统需要发送邀请通知：
  - 优先短信
  - 无手机号时回退邮件
- 邀请通知不发送明文密码。
- 新用户首次登录通过 OTP 完成身份验证：
  - 有手机号时走手机 OTP
  - 无手机号时走邮箱 OTP
- 首次 OTP 登录成功后，如果用户尚无可用密码凭据，系统必须强制进入设置密码流程，再进入正常工作区。
- 点击 `角色配置` 后，页面调用 `GET /account/:accountId/roles/selection` 获取 `availableRoles[]` 与 `selectedRoleIds[]`。
- 保存时统一调用 `PUT /account/:accountId/roles`，采用全量替换语义。
- 第一阶段只支持 `USER` account；服务账号角色管理进入后续独立能力。
- 租户管理员固定当前租户与 `TENANT` scope；系统管理员根据选中的 account summary 管理 `SYSTEM` 或 `TENANT` scope。
- 前端入口可见性仍由 BFF 返回的 visible entries 控制，不在前端 hardcode role。

## 5. 契约真相位置

- 账号列表：
  - `GET /auth/admin/accounts`
- 账号搜索：
  - `GET /auth/admin/users/search`
- 账号角色配置：
  - `GET /account/:accountId/roles/selection`
  - `PUT /account/:accountId/roles`
- 第一阶段页面不直接使用但 API client 可覆盖：
  - `GET /account/:accountId/roles`
  - `POST /account/:accountId/roles`
  - `DELETE /account/:accountId/roles/:roleId`
  - `GET /role/:roleId/accounts`

## 6. 线程分工

| Thread / Owner | 职责 | 允许修改路径 | 输入 | 输出 | 状态 |
| --- | --- | --- | --- | --- | --- |
| design owner | 校正账号管理第一阶段边界 | `docs/plans/features/account-management.md`, `docs/contracts/api-gateway/auth-bff-admin-security.md` | 既有 role / account-role contract | feature packet + contract | completed |
| producer owner | 补齐导航 seed 与内置权限基线 | `src/services/system/permission-service/**`, `src/common/src/authorization/**` | account-management entry | 可见入口与内置角色权限 | completed |
| consumer owner | 接入 tenant-web account-management 页面 | `app/web/apps/tenant-web/src/api/**`, `app/web/apps/tenant-web/src/views/admin/**`, `app/web/apps/tenant-web/src/modules/**` | feature packet + contract | 可手动测试页面 | completed |
| review / integration owner | 验证 scope、安全边界和 UI 可用性 | 只读全局，必要时最小修正 | producer / consumer 输出 | 关闭判断 | in-progress |

## 7. 当前 slice

- slice:
  - 第一阶段账号管理页：账号列表 + 过滤 + 行操作角色配置。
- status:
  - implementation-complete
- scope:
  - 管理员默认查看分页账号目录。
  - 使用关键字、Scope、状态过滤账号列表。
  - 在账号行操作中进入角色配置。
  - 加载该 account 在当前 scope 下可分配角色与已选角色。
  - 勾选角色并全量保存。
  - navigation entry 与内置模板权限基线。

## 8. 主线范围

- 本线程主线：
  - 建立 tenant-web 账号管理第一阶段。
  - 让角色管理成果可以从账号列表中分配给真实账号。
- 本线程不做：
  - 租户创建。
  - 服务账号角色管理。
  - policy 管理。
  - 批量时间窗口授权。
- 偏移返回条件：
  - 需要改变 AccountRole scope 语义。
  - 需要新增服务账号目录契约。
  - 需要前端直接消费 `identity-service`。
  - 需要在页面内解释 policy 决策。

## 9. 派生问题 Ledger

| 时间 | 问题 | 分类 | 当前影响 | 处理策略 | 目标落点 | 状态 |
| --- | --- | --- | --- | --- | --- | --- |
| 2026-04-19 | 服务账号角色分配 | Blocker-Later | 当前账号搜索只返回用户 account summary，不能覆盖 service account | 后置为独立服务账号管理 / service account role assignment 能力 | future feature packet | open |
| 2026-04-19 | 批量授权有效期 | Blocker-Later | `PUT /account/:accountId/roles` 不承接时间窗口字段 | 第一阶段不做；若需要临时授权，后续设计单角色授予入口或扩展 contract | future feature packet / contract | open |

## 10. 验收标准

- 管理员可以进入 `账号管理` 页面。
- 页面以账号列表和过滤作为第一层工作流。
- 页面默认加载当前管理员可见范围内的账号目录第一页。
- 页面可以通过关键字查询目标账号。
- 页面可以按 Scope 与状态过滤账号列表。
- 页面可以启用或停用一个账号。
- 页面可以创建一个新账号。
- 账号列表操作列提供 `角色配置`。
- 新账号创建后会发送邀请通知，优先短信，手机号缺失时回退邮件。
- 被邀请用户可以通过 OTP 首次登录。
- 若首次登录用户尚无密码凭据，则必须先完成密码设置才能进入工作区。
- 点击 `角色配置` 后可以看到可分配角色列表与当前已选角色。
- 页面保存时使用 `PUT /account/:accountId/roles` 一次提交最终 role id 集合。
- 租户管理员只能以当前租户 `TENANT` scope 管理账号角色。
- 系统管理员可以管理 `SYSTEM` account 或 tenant account 的角色绑定。
- 页面不提供 policy、账号 CRUD 或服务账号管理入口。
- 前端不直接调用 `identity-service`。
- 入口可见性由 navigation visible entries 控制。

## 11. 关闭条件

- feature packet 与 implementation plan 已落地。
- navigation foundation seed 包含 `admin.account-management`。
- 内置租户管理员模板包含账号角色查看与分配权限。
- tenant-web account-management 页面已实现。
- `identity-service` `ListAccounts` 与 BFF `GET /auth/admin/accounts` 已实现。
- `identity-service` 创建账号与设置账号启停已实现。
- `auth-service` 邀请引导、首登密码设置与密码门禁已实现。
- 前端测试、permission-service seed 测试、typecheck / build 通过。

## 11.1 验证记录

- `pnpm --dir app/web exec vitest run apps/tenant-web/src/api/bff/account-role-management/index.spec.ts apps/tenant-web/src/views/admin/account-management.helpers.spec.ts apps/tenant-web/src/views/admin/account-management.spec.ts --dom`
- `pnpm --dir src/services/system/permission-service exec jest --config jest.config.js test/l1/navigation-foundation.seed.spec.ts test/l1/role-foundation.seed.spec.ts --runInBand`
- `pnpm --dir src/services/system/permission-service build`
- `pnpm --dir app/web --filter @oes/tenant-web typecheck`
- `pnpm --dir app/web --filter @oes/tenant-web build`
- `pnpm --filter permission-service permission-codes:sync`
- `git diff --check`

## 12. 备注

- 本 feature 是 Role Management 后的账号维度管理主线。
- 账号角色 API client 仍保留为 account-role 能力 client；产品入口不再命名为账号角色管理。
