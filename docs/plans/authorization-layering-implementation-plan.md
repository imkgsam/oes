# OES 授权分层实施计划

## 1. 目标

将 OES 当前“粗粒度 `RBAC` 已部分落地、细粒度能力存在但业务接入不完整”的状态，推进到以下目标：

- Gateway 与子服务入口统一采用 `checkPermission`
- 单资源命令与详情查询采用 `checkResource`
- 列表 / 搜索 / 分页采用 `buildQueryScope`
- 业务规则与权限规则明确分离
- `policy` 收敛为 `resource / query scope / security` 三类

## 2. 范围

- `docs/architecture/15-authorization-layering-and-resource-policy-architecture.md`
- Gateway 粗粒度权限门禁收口
- 各业务子服务 application 层资源授权与查询范围构造模式
- `permission-service` 细粒度能力消费方式
- 实施顺序与验收口径

## 3. 非目标

- 本计划不在本阶段改变租户模型语义
- 本计划不在本阶段引入新的全局 policy DSL
- 本计划不在本阶段把领域规则外置为通用规则引擎
- 本计划不在本阶段要求所有列表查询都立即接入统一共享 scope builder

## 4. 当前进度快照

Updated: 2026-04-12 22:30 +08:00

已完成：

- `common` 统一权限码目录与共享 `PermissionGuard`
- `common` 中共享 role-based permission resolver / adaptor
- `common/security` 已整体迁移为 `common/authorization`
- 原 `common/permission` 中用于授权执行的入口已迁移并并入 `common/authorization`
- `authorization` 已成为授权代码的标准目录语义
- `@oes/common` exports 已移除 `security / permission` 授权入口，仅保留 `authorization`
- Gateway 全局 `checkPermission` guard 已在运行态启用
- Gateway 权限 guard 已统一收敛为 `GatewayPermissionGuard`
- `auth-service` 接口级 `RBAC` 基线
- `identity-service` 接口级 `RBAC` 基线
- `permission-service` 的 `CheckPermission`
- `permission-service` 的历史兼容 `CheckPermissionWithContext`
- policy AST 与 explain 基础能力
- 共享 `OperatorContextPayload` 与共享授权实现已移除旧的权限快照字段
- `permission-service` 角色查询链路已落首批 `buildQueryScope` 模式
- `permission-service` 已落 `AuthorizationQueryScopeService + QueryScopeBuilder + DI registry` 第一版代码骨架
- `operator-scope` 已从 `queries/role` 收口到 `application/authorization`
- `permission-service` 中适用的 role 列表查询已完成统一 query scope 门面接入
- `identity-service` 已落首批真实业务域 `buildQueryScope` 试点
- `identity-service` 中 `listAccountOrgMemberships / listAccountWorkEmailAssets / listAccountWorkPhoneAssets / listServiceAccounts / listApiKeysByServiceAccountId / listAuditEvents` 已接入统一 query scope 门面
- `identity-service` 已完成首批 query scope handler 级与仓储级验证
- `identity-service` 已完成首批 `checkResource` detail query 试点
- `identity-service` 中 `getAccountById / getTenantById / getOrgTreeByTenantId / getServiceAccountById / getApiKeyById` 已接入首批 detail query `checkResource`
- `identity-service` 已完成首批单资源命令 `checkResource` 试点
- `identity-service` 中 `revokeApiKey / rotateApiKey / setServiceAccountEnabled` 已接入首批机器身份命令 `checkResource`
- `identity-service` 中 `createApiKey / createServiceAccount` 已接入第二批机器身份创建命令 `checkResource`
- `identity-service` 中 `assignAccountWorkEmailAsset / assignAccountWorkPhoneAsset / revokeAccountWorkEmailAsset / revokeAccountWorkPhoneAsset / setAccountPrimaryWorkEmailAsset / setAccountPrimaryWorkPhoneAsset / setAccountWorkEmailAssetStatus / setAccountWorkPhoneAssetStatus / addAccountOrgMembership / removeAccountOrgMembership / setAccountPrimaryOrg` 已接入第二批 contact / org 命令 `checkResource`
- `auth-service` 已落首批真实业务域 `buildQueryScope` 试点
- `auth-service` 中 `listAuditEvents / adminListUserSessions` 已接入统一 query scope 门面
- `auth-service` 已完成首个管理员命令 `checkResource` 试点
- `auth-service` 中 `adminRevokeSession` 已接入首批命令 `checkResource`
- `auth-bff` 已补齐登录主流程第一批 HTTP 编排接口
- `auth-bff` 已完成 `GET /auth/session/context` 第一阶段交付
- `auth-bff` 已冻结 Navigation Summary 设计：后端返回 `defaultEntry / visibleEntries`，前端负责本端 route / page / screen 映射与呈现
- `auth-bff` 已落地 Access Summary：新增 `GET /auth/session/access-summary`，返回展示用 roles 与控制用 actionCodes
- `permission-service` 已新增专用 access-summary gRPC，不复用 management 语义的 role / permission 管理 RPC
- `tenant-web` 登录 hydration 已改为从 dedicated access-summary endpoint 写入 `accessCodes`
- Gateway 历史 `modules/auth-service` 与 `modules/identity-service` 占位代理已清理
- Gateway `permission` 管理接口首批已完成系统管理员真实联调验证
- Gateway `role` 管理接口首批已完成系统管理员真实联调验证
- Gateway `role-template` 管理接口首批已完成系统管理员真实联调验证
- Gateway `GatewayPermissionGuard` 已补齐 account claim 解析与内部 gRPC metadata 传播

本轮完成明细：

- 完成 `common/security -> common/authorization` 的彻底目录迁移
- 完成原 `common/permission` 中授权 decorator / guard 到 `common/authorization` 的合并
- 完成 Gateway / `auth-service` / `identity-service` / `permission-service` 对 `@oes/common/authorization` 的统一接入
- 完成 `permission-service` 中本地授权模块与共享 `AuthorizationModule` 的命名冲突修正
- 完成 Gateway 权限回归测试文件重命名与通过验证
- 完成共享授权类型与校验链中的旧权限快照字段清理
- 完成 `permission-service` 角色查询链路中的 `buildRoleInstanceQueryScope / buildTenantBoundQueryScope / buildSystemQueryScope`
- 明确 `buildQueryScope` 当前函数式试点不是最终完成态，后续将收敛为统一门面 + interface + DI registry
- 完成 `permission-service` 中 `AuthorizationQueryScopeService`、builder interface、registry provider 与 facade 分发测试
- 完成 `operator-scope` 目录收口，并将 role 列表查询全部接入统一 query scope facade
- 完成 `identity-service` 中 `AuthorizationQueryScopeService + QueryScopeBuilder + DI registry` 首批业务域接入
- 完成 `identity-service` 中 `listAccountOrgMemberships / listAccountWorkEmailAssets / listAccountWorkPhoneAssets / listServiceAccounts / listApiKeysByServiceAccountId / listAuditEvents` 的 query scope 试点改造
- 完成 `identity-service` 中 repository 对 tenant-bound scope 的首批消费接入
- 完成 `identity-service` 中 gRPC query controller 对可选 operator scope 的首批接线
- 完成 `identity-service` 中 query scope facade 分发测试与相关回归验证
- 完成 `identity-service` 中 query scope 到 repository 过滤条件的 handler 级验证
- 完成 `identity-service` 中 account contact asset / account org membership / api key 的 L2 tenant scope 过滤验证
- 完成 `identity-service` 中 audit query 的应用层 query scope 收口与仓储分页/过滤回归验证
- 完成 `identity-service` 中 `CheckResourceService` 首批 application 层落点
- 完成 `identity-service` 中 `getAccountById / getTenantById / getOrgTreeByTenantId / getServiceAccountById / getApiKeyById` 的 detail query `checkResource` 试点改造
- 完成 detail query 跨租户拒绝的 handler 级验证
- 完成 `identity-service` 中 `revokeApiKey / rotateApiKey / setServiceAccountEnabled` 的命令 `checkResource` 试点改造
- 完成单资源命令跨租户拒绝的 handler 级验证
- 完成 `identity-service` 中 `createApiKey / createServiceAccount` 的机器身份创建命令 `checkResource` 试点改造
- 完成机器身份创建命令跨租户与跨范围拒绝的 handler 级验证
- 完成 `identity-service` 中 contact / org 命令的第二批 `checkResource` 试点改造
- 完成 contact / org 命令跨租户拒绝的 handler 级验证
- 完成 `auth-service` 中 `AuthorizationQueryScopeService + QueryScopeBuilder + DI registry` 首批业务域接入
- 完成 `auth-service` 中 `listAuditEvents / adminListUserSessions` 的 query scope 试点改造
- 完成 `auth-service` 中可选 operator scope 的 gRPC query controller 接线
- 完成 `auth-service` 中 audit query tenant-bound 拒绝与 session 列表 tenant-bound 过滤的 handler 级验证
- 完成 `auth-service` 中 `CheckResourceService` 首批 application 层落点
- 完成 `auth-service` 中 `adminRevokeSession` 的命令 `checkResource` 试点改造
- 完成 `auth-service` 中管理员跨租户撤销 session 拒绝的 handler 级验证
- 完成 `auth-bff` 中 `POST /auth/login /auth/challenges/email-otp /auth/challenges/phone-otp /auth/mfa/complete /auth/account-selection /auth/session/refresh` 的第一批 HTTP 编排落地
- 完成 `auth-bff` 登录主流程 DTO / ViewModel / Swagger 的首批收口
- 完成 `auth-bff` 对 `RequestEmailOtpLoginChallenge / RequestPhoneOtpLoginChallenge / SubmitMfaChallenge / SelectAccount / RefreshSession` 的下游 gRPC 适配接入
- 完成 `docs/contracts/api-gateway/auth-bff-login.md` 黑盒接口文档
- 完成 `docs/contracts/api-gateway/README.md` 前端对接索引文档
- 明确 `POST /auth/login` 中 `tenantHint / device` 先保留为预留字段，不在本轮下推到下游认证逻辑
- 完成 `auth-bff` 第二组自助安全管理 HTTP 接口落地
- 完成 `docs/contracts/api-gateway/auth-bff-self-service.md` 黑盒接口文档
- 完成 `auth-bff` 前两组接口的首批自动化测试
- 完成 `auth-bff` 第三组管理员安全管理 HTTP 接口落地
- 完成 `docs/contracts/api-gateway/auth-bff-admin-security.md` 黑盒接口文档
- 完成 `auth-bff` 第三组接口的首批自动化测试
- 完成 `auth-bff` 关键链路的 Gateway HTTP → gRPC downstream 真实联调测试
- 完成 `auth-bff` 中 `GET /auth/session/context` 第一阶段聚合能力
- 完成 `auth-bff` 对 `identity-service` 的最小 session-context 摘要适配接入
- 完成 `auth-bff` session-context 的 use-case / controller / Gateway → gRPC 联调测试
- 完成 OES Navigation Summary 设计收口：后端不返回跨端通用菜单层级或 Web route，前端根据 `visibleEntries` 过滤本端导航结构
- 完成 OES Access Summary 设计收口：前端不从 roles 推导 permissions，后端返回 effective permission codes 作为 `actionCodes`
- 完成 `permission-service.PermissionAccessSummaryService.GetAccountAccessSummary` 专用 gRPC 契约与生成类型
- 完成 `permission-service` access-summary application query / gRPC controller 接入
- 完成 `auth-bff` permission-service access-summary downstream adapter 与 `GET /auth/session/access-summary`
- 完成 `tenant-web` 登录 hydration 从 dedicated access-summary endpoint 获取 actionCodes 并写入 `accessCodes` store
- 完成 Gateway 历史 `auth-service` 与 `identity-service` 占位代理的代码清理与文档收口
- 完成系统管理员 Permission 管理页首批后端接口：
  - `GET /permission`
  - `POST /permission`
  - `GET /permission/:code`
  - `GET /permission/id/:id`
  - `PATCH /permission/:id`
  - `GET /permission/:id/roles`
  - `DELETE /permission/:id`
- 完成 Gateway 权限 guard 正式修正：
  - 优先从 `holderId / aid / id / sub` 解析当前 account id，适配 auth token 的 `aid` 账号声明
  - 调用 `PermissionCheckService.CheckPermission` 时携带 `api-gateway` 内部服务 metadata，满足 permission-service 内部调用治理要求
- 完成 Permission 管理接口从 HTTP Gateway 到 permission-service gRPC 的真实联调验证
- 完成系统管理员 Role 管理页首批后端接口：
  - `GET /role`
  - `POST /role`
  - `GET /role/:id`
  - `PATCH /role/:id`
  - `PATCH /role/:id/enabled`
  - `GET /role/:id/permissions`
  - `POST /role/:id/permissions`
  - `DELETE /role/:id/permissions/:permissionId`
  - `DELETE /role/:id`
- 完成 permission-service role 用例的 `operatorScope` validation 白名单修正：
  - role command / query 中的 `operatorScope` 是应用层授权上下文，不是外部请求字段
  - 已通过 `@Allow()` 明确标记为合法上下文字段，避免 CQRS whitelist 将其误判为非白名单字段
- 完成 Role 管理接口从 HTTP Gateway 到 permission-service gRPC 的真实联调验证
- 完成系统管理员 Role Template 管理页首批后端接口：
  - `GET /role-template`
  - `POST /role-template`
  - `GET /role-template/:id`
  - `PATCH /role-template/:id`
  - `PATCH /role-template/:id/enabled`
  - `GET /role-template/:id/permissions`
  - `POST /role-template/:id/permissions`
  - `DELETE /role-template/:id/permissions/:permissionId`
  - `POST /role-template/:id/instantiate`
  - `DELETE /role-template/:id`
- 完成 Role Template 管理接口从 HTTP Gateway 到 permission-service gRPC 的真实联调验证
- 完成账号角色管理首批 Gateway 接口：
  - `GET /account/:accountId/roles`
  - `GET /account/:accountId/roles/selection`
  - `POST /account/:accountId/roles`
  - `PUT /account/:accountId/roles`
  - `DELETE /account/:accountId/roles/:roleId`
  - `GET /role/:roleId/accounts`
- 完成 account-role 管理接口从 HTTP Gateway 到 permission-service gRPC 的真实联调验证

本轮验证结果：

- `pnpm --dir src/common build`
- `pnpm --dir src/services/api-gateway build`
- `pnpm --dir src/services/api-gateway exec jest src/modules/auth-bff/application/use-cases/login.use-case.spec.ts src/modules/auth-bff/application/use-cases/session-self-service.use-case.spec.ts src/modules/auth-bff/application/use-cases/mfa-self-service.use-case.spec.ts src/modules/auth-bff/interfaces/http/controllers/auth.controller.spec.ts`
- `pnpm --dir src/services/system/auth-service build`
- `pnpm --dir src/services/system/auth-service exec jest src/application/authorization/query-scope/authorization-query-scope.service.spec.ts src/application/queries/audit/list-audit-events.handler.spec.ts src/application/queries/session/admin-list-user-sessions.handler.spec.ts src/interfaces/grpc/auth.grpc.controller.spec.ts`
- `pnpm --dir src/services/system/auth-service exec jest src/application/commands/auth/admin-revoke-session.handler.spec.ts src/application/authorization/query-scope/authorization-query-scope.service.spec.ts src/application/queries/audit/list-audit-events.handler.spec.ts src/application/queries/session/admin-list-user-sessions.handler.spec.ts src/interfaces/grpc/auth.grpc.controller.spec.ts`
- `pnpm --dir src/services/api-gateway build`
- `pnpm --dir src/services/system/identity-service build`
- `pnpm --dir src/services/system/permission-service build`
- `pnpm --dir src/services/api-gateway exec jest src/common/guards/gateway-permission.guard.spec.ts`
- `pnpm --dir src/services/api-gateway exec jest src/modules/auth-bff/application/use-cases/login.use-case.spec.ts src/modules/auth-bff/application/use-cases/session-self-service.use-case.spec.ts src/modules/auth-bff/application/use-cases/mfa-self-service.use-case.spec.ts src/modules/auth-bff/application/use-cases/admin-security.use-case.spec.ts src/modules/auth-bff/interfaces/http/controllers/auth.controller.spec.ts`
- `pnpm --dir src/services/api-gateway exec jest src/modules/auth-bff/interfaces/http/controllers/auth.integration.spec.ts --runInBand`
- `pnpm --dir src/services/api-gateway exec jest src/modules/auth-bff/application/use-cases/session-context.use-case.spec.ts src/modules/auth-bff/interfaces/http/controllers/auth.controller.spec.ts src/modules/auth-bff/interfaces/http/controllers/auth.integration.spec.ts --runInBand`
- `pnpm --dir src/services/system/identity-service exec jest test/l1/role-based-operator-permission-resolver.spec.ts test/l1/permission-guard-role-resolution.spec.ts`
- `pnpm --dir src/services/system/identity-service exec jest test/l1/authorization-query-scope.service.spec.ts test/l1/contact-query-validation.spec.ts test/l1/grpc-controller-input-validation.spec.ts`
- `pnpm --dir src/services/system/identity-service exec jest test/l1/identity-query-scope-handler.spec.ts test/l1/authorization-query-scope.service.spec.ts`
- `pnpm --dir src/services/system/identity-service exec jest test/l1/identity-query-scope-handler.spec.ts test/l1/authorization-query-scope.service.spec.ts test/l1/identity-audit-query-controller.spec.ts test/l1/grpc-controller-input-validation.spec.ts test/l1/contact-query-validation.spec.ts`
- `pnpm --dir src/services/system/identity-service exec jest --config jest.config.js --runInBand test/l2/prisma.account-contact-asset.repository.spec.ts test/l2/prisma.account-org-membership.repository.spec.ts`
- `pnpm --dir src/services/system/identity-service exec jest --config jest.config.js --runInBand test/l2/prisma.api-key.repository.spec.ts`
- `pnpm --dir src/services/system/identity-service exec jest --config jest.config.js --runInBand test/l2/prisma.identity-audit-query.repository.spec.ts`
- `pnpm --dir src/services/system/identity-service exec jest test/l1/check-resource.service.spec.ts test/l1/service-account-check-resource.handler.spec.ts test/l1/identity-query-optional-result.spec.ts test/l1/grpc-controller-input-validation.spec.ts`
- `pnpm --dir src/services/system/identity-service exec jest test/l1/api-key-guards.handler.spec.ts test/l1/service-account-guards.handler.spec.ts test/l1/grpc-controller-input-validation.spec.ts`
- `pnpm --dir src/services/system/identity-service exec jest test/l1/assign-account-work-email.handler.spec.ts test/l1/contact-asset-guards.handler.spec.ts test/l1/org-membership-guards.handler.spec.ts test/l1/set-account-primary-org.handler.spec.ts test/l1/grpc-controller-input-validation.spec.ts`
- `pnpm --dir src/services/system/identity-service exec jest test/l1/api-key-guards.handler.spec.ts test/l1/service-account-guards.handler.spec.ts test/l1/grpc-controller-input-validation.spec.ts test/l1/api-key-validation.spec.ts test/l1/service-account-validation.spec.ts`
- `pnpm --dir src/services/system/permission-service exec jest --config jest.config.js test/l1/role-scope-boundary.spec.ts`
- `pnpm --dir src/services/system/permission-service exec jest --config jest.config.js test/l1/authorization-query-scope.service.spec.ts test/l1/role-scope-boundary.spec.ts`
- `pnpm --dir src/services/system/permission-service exec jest --config jest.config.js --no-cache test/l1/authorization-query-scope.service.spec.ts test/l1/role-scope-boundary.spec.ts`
- `pnpm proto:gen`
- `pnpm --filter @oes/common build`
- `pnpm --filter permission-service exec jest --config jest.config.js --runInBand test/l1/get-account-access-summary.handler.spec.ts`
- `pnpm --filter api-gateway exec jest --runInBand src/modules/auth-bff/application/use-cases/session-context.use-case.spec.ts src/modules/auth-bff/application/use-cases/session-access-summary.use-case.spec.ts src/modules/auth-bff/interfaces/http/controllers/auth.controller.spec.ts`
- `pnpm --filter api-gateway exec jest --runInBand src/modules/auth-bff/interfaces/http/controllers/auth.integration.spec.ts`
- `pnpm --filter permission-service build`
- `pnpm --filter api-gateway build`
- `pnpm --dir app/web --filter @oes/tenant-web typecheck`
- `pnpm --filter @oes/common build`
- `pnpm --filter api-gateway build`
- `pnpm --filter api-gateway exec jest --runInBand src/common/guards/gateway-permission.guard.spec.ts src/modules/permission-service/interface/http/controllers/permission.controller.spec.ts`
- `pnpm --filter permission-service build`
- `pnpm --filter permission-service exec jest --config jest.config.js --runInBand test/l1/role-scope-boundary.spec.ts test/l1/authorization-query-scope.service.spec.ts test/l1/role-permission.handlers.spec.ts`
- `pnpm --filter api-gateway exec jest --runInBand src/modules/permission-service/interface/http/controllers/role.controller.spec.ts src/modules/permission-service/interface/http/controllers/permission.controller.spec.ts`
- `pnpm --filter api-gateway exec jest --runInBand src/modules/permission-service/interface/http/controllers/role-template.controller.spec.ts src/modules/permission-service/interface/http/controllers/role.controller.spec.ts src/modules/permission-service/interface/http/controllers/permission.controller.spec.ts`
- `pnpm --filter api-gateway exec jest --runInBand src/modules/permission-service/interface/http/controllers/account-role.controller.spec.ts src/modules/permission-service/interface/http/controllers/role-template.controller.spec.ts src/modules/permission-service/interface/http/controllers/role.controller.spec.ts src/modules/permission-service/interface/http/controllers/permission.controller.spec.ts`
- 真实 HTTP 联调：
  - 使用 `ui.tester@oes.local` 登录并选择 `scopeLevel = SYSTEM` 的系统账号
  - 验证 `GET /permission?page=1&pageSize=5&keyword=permission` 返回分页结构
  - 验证临时 permission 的 create / get by code / get by id / update / list roles / delete 全链路成功
  - 验证临时 system role 的 list / create / get by id / update / enable-disable / assign permission / list permissions / revoke permission / delete 全链路成功
  - 验证临时 role template 的 list / create / get by id / update / enable-disable / assign permission / list permissions / instantiate tenant role / revoke permission / delete 全链路成功
  - 验证临时 tenant role 的 assign account role / list account roles / role selection / list role accounts / revoke / set account roles 全链路成功

未完成：

- 业务服务 application 层 `checkResource` 模式在更多业务域中的推广
- 列表类 `buildQueryScope` 模式在更多业务域服务中的推广
- 派生内部协作授权规范的代码化落实
- Access Summary 的 tenant feature / plugin enablement 过滤仍未接入，需在模块化/插件启用模型冻结后实现
- 历史 `CheckPermissionWithContext` deprecated 兼容链路后续需要走契约治理清理：
  - 先确认无真实业务调用方
  - 再标记 proto / controller 为 no-new-callers
  - 最后删除 proto RPC、controller method、query、handler、domain compatibility method 与对应测试

下一步计划：

- `listApiKeysByServiceAccountId` 与 `listAuditEvents` 已完成，`getAccountById / getTenantById / getOrgTreeByTenantId / getServiceAccountById / getApiKeyById` 的首批 `checkResource` 试点也已完成
- `revokeApiKey / rotateApiKey / setServiceAccountEnabled` 的首批机器身份命令 `checkResource` 试点已完成
- `createApiKey / createServiceAccount` 的第二批机器身份创建命令 `checkResource` 试点已完成
- `assignAccountWorkEmailAsset / assignAccountWorkPhoneAsset / revokeAccountWorkEmailAsset / revokeAccountWorkPhoneAsset / setAccountPrimaryWorkEmailAsset / setAccountPrimaryWorkPhoneAsset / setAccountWorkEmailAssetStatus / setAccountWorkPhoneAssetStatus / addAccountOrgMembership / removeAccountOrgMembership / setAccountPrimaryOrg` 的第二批 contact / org 命令 `checkResource` 试点已完成
- `getUserByEmail / getUserByPhone / getUserById / getAccountsByUserId` 被明确归类为登录与认证支撑查询，不纳入首批 `checkResource` 范围
- `authenticateApiKey` 被明确归类为机器身份认证支撑命令，不纳入当前 `checkResource` 范围
- 当前 `identity-service` 剩余未纳入项已主要收敛为登录 / 认证支撑链路，不继续在本服务内机械扩展 `checkResource`
- 下一步从“纯子服务试点”切换为“BFF 驱动冻结对外能力，再反推下游接口”的推进方式
- 继续补服务级与仓储级验证，优先证明 query scope 会稳定进入 repository 查询条件
- 暂不以 Gateway 作为 `buildQueryScope` 的首要验证面；优先在子服务内部完成行为验证后，再补 Gateway 端到端联调
- `auth-bff` 当前已完成登录主流程、自助安全管理、管理员安全管理三组核心 HTTP 入口
- 系统级账号 access-summary 已从空返回改为基于 `scopeLevel = SYSTEM` 解析 `SYSTEM_INSTANCE` role
- Role CRUD / assignment 已支持 `SYSTEM_INSTANCE` 与作用域化 `AccountRole`：
  - `RoleKind` 已增加系统级真实 role
  - `AccountRole.tenantId` 已改为系统范围可空，并新增 `scopeLevel`
  - create/list/detail/update/delete role 已区分 template、system instance、tenant instance
  - account-role 分配命令已允许系统账号绑定系统级 role，并禁止 template 直接绑定账号
- `permission-service` foundation seed 已完成：
  - `permission-codes:sync` 会同步权限码、内置 `system.admin` 的 `SYSTEM_INSTANCE` role，以及该 role 的全部当前权限
  - 可通过 `OES_SYSTEM_ADMIN_ACCOUNT_IDS` / `SYSTEM_ADMIN_ACCOUNT_IDS` 绑定系统级账号
  - 本地 `seed:tenant-web-auth` 已自动绑定 tenant-web 测试系统账号
- 系统账号真实联调已完成：
  - 使用 `ui.tester@oes.local` 登录后可选择 `scopeLevel = SYSTEM` 的测试系统账号
  - `GET /auth/session/access-summary` 已返回 `system.admin` 与 20 个 `actionCodes`
  - `GET /auth/session/context` 已返回 `tenant = null`、`scopeLevel = SYSTEM` 与 `platform.home`
- `auth-bff` 当前登录主流程已可供前端对接，但前端不得依赖 `tenantHint / device` 已产生实际下游行为
- `auth-bff` 当前三组能力均已完成基础自动化验证
- `auth-bff` 的 `GET /auth/session/context` 已完成第一阶段，可稳定提供进入工作台所需的最小真实上下文
- `auth-bff` 的 Navigation Summary 完成态已明确：
  - BFF 返回 `navigation.defaultEntry`
  - BFF 返回 `navigation.visibleEntries`
  - 前端维护本端菜单层级、route / page / screen 映射与呈现
  - `navigation.defaultHomePath / menus` 只作为当前兼容字段，不作为长期主真相
- `auth-bff` 的 Access Summary 完成态已明确：
  - 已新增 `GET /auth/session/access-summary`
  - 返回 `roles` 用于展示 / 诊断
  - 返回 `actionCodes` 用于按钮级和动作级控制
  - 当前阶段 `actionCodes = 当前上下文下 effective permission codes`
  - 前端不得根据 roles 自行展开 permissions
  - `session/context.access.actionCodes` 只作为当前兼容占位字段
  - 下游已新增专用 `permission-service` access-summary gRPC，不复用 management 语义的 `ListAccountRoles / ListRolePermissions`
  - 系统级账号 access-summary 已按 `SYSTEM_INSTANCE` role 返回有效 roles 与 actionCodes
  - 系统级 role 与 tenant role 的长期治理边界仍需继续通过 Role 管理接口组冻结
- `identity-bff` 的机器身份管理组暂时后置：
  - 当前下游能力已较稳定
  - 但尚无明确前端页面或外部消费场景
  - 在没有真实使用人和对外语义前，不继续提前暴露新的 BFF HTTP 契约
- 当前更适合优先推进的 Gateway / BFF 接口组候选应满足“已有明确业务场景”：
  - `permission-service` 管理接口组：
    - `permission`
    - `permission/:code`
    - `permission` create / delete
    - `role/:id`
    - `role/:id` delete
  - `permission` 组首批已完成黑盒契约、Swagger 收口、权限控制补齐与真实联调验证
  - `role` 组首批已完成黑盒契约、Swagger 收口、权限控制补齐与真实联调验证
  - `role/all` 已完成仓库内调用审查且无依赖，现已从 Gateway 契约中删除
  - `role-template` 组首批已完成黑盒契约、Swagger 收口、权限控制补齐与真实联调验证
  - account-role 组现已完成首批黑盒契约、Swagger 收口、权限控制补齐与真实联调验证
  - `identity-service` 历史 gateway-side placeholder proxy 已清理；后续若重新开放身份能力，应以新的场景组/BFF 重新设计
- 保持当前 `CheckResourceService` 试点 API 现状，后续再统一评估是否收敛为更通用的资源检查入口
- 保持当前 detail query 的“先加载资源再执行 `checkResource`”顺序，后续再评估是否引入最小授权快照查询优化

当前阶段结论：

- `identity-service` 已完成当前阶段的 query scope 与 `checkResource` 主试点目标
- 剩余未纳入接口主要是登录 / 认证支撑链路，按既定原则不继续纳入首批资源级授权
- 后续推进重点应转向下一个业务域，而不是继续在 `identity-service` 内做低收益铺开

本线程收尾状态：

- `permission-service` 管理接口首批 Gateway 能力已完成当前阶段收口：
  - `permission`
  - `role`
  - `role-template`
  - `account-role`
- `role/all` 已完成仓库内调用审查且无依赖，已从 Gateway 契约与控制器中删除
- `docs/contracts/api-gateway/permission-management.md` 已补齐到“前端可按页面接入”的当前完成态：
  - 已包含接口边界
  - 已包含权限控制
  - 已包含 role / role-template / account-role 页面接入建议
  - 已包含按钮级权限建议
- 本线程后续不再继续扩展新的管理接口组，转为由后续线程按新业务场景接续推进

本线程明确后置任务：

- `permission-management` 文档若后续继续完善，可再补：
  - 请求 / 响应示例
  - 页面级错误处理建议
  - 更细的前端刷新 / 回填策略
- Access Summary 的 tenant feature / plugin enablement 过滤
- 历史 `CheckPermissionWithContext` deprecated 链路正式清理
- `CheckResourceService` 更通用统一入口设计
- detail query 的最小授权快照 / 预检查优化
- 机器身份管理组的 BFF / Gateway 对外接口冻结

下一个业务域选择：

- 当前仓库中缺少订单 / 库存等更典型业务域服务时，下一站优先选择 `auth-service`
- `auth-service` 同时具备列表查询、单资源命令、管理员入口与明确租户上下文，适合继续验证 `buildQueryScope + checkResource`
- `notification-service` 更偏基础设施发送，不作为下一批授权分层主试点
- `entity-service` 当前缺少足够的 query / command 面，不作为当前优先候选

`auth-service` 首批接口分层建议：

- `listAuditEvents`
  - 优先归类为列表查询
  - 建议首批接入 `buildQueryScope`
- `adminListUserSessions`
  - 优先归类为管理员列表查询
  - 建议首批接入 `buildQueryScope`
- `adminRevokeSession`
  - 优先归类为单资源管理员命令
  - 建议首批接入 `checkResource`
- `listSessions`
  - 当前更接近用户自助会话查询
  - 暂不作为首批 `buildQueryScope` 目标，后续再评估是否需要 operator-bound query scope
- `listMfaBindings`
  - 当前更接近认证支撑 / 自助安全设置查询
  - 暂不纳入首批资源级授权改造

`auth-service` 当前进度与下一步：

- 已完成 `AuthorizationQueryScopeService + QueryScopeBuilder + DI registry` 首批骨架
- 已完成 `listAuditEvents / adminListUserSessions` 的 query scope 接入与验证
- 已完成 `adminRevokeSession` 的首批 `checkResource` 接入与验证
- 已完成 `auth-service` 中 Session 租户事实的一等化收口
- `listAuditEvents` 当前对 tenant-bound 操作者采用 fail-closed 语义：
  - 未显式传 tenant 时自动收敛到 operator tenant
  - 显式传入不同 tenant 时直接拒绝，而不是静默改写
- `adminListUserSessions` 当前已将 tenant-bound scope 下推到 session 仓储协议：
  - 底层仍基于 Redis 遍历用户会话集合，但过滤责任已从 handler 收口到 repository 层
- `auth-service` 当前已将 Session 的 `tenantId / orgId` 升级为聚合一等事实：
  - `adminRevokeSession`、`adminListUserSessions`、refresh token 续期、audit 上下文与普通会话查询都不再直接依赖 `metadata.tenantId`
- `adminRevokeSession` 当前先在 application 层加载目标 session，再按 Session 聚合上的 `tenantId` 执行首批 tenant-bound `checkResource`
- 下一步优先评估 `auth-service` 中剩余管理员接口是否还有必要继续接入 `checkResource`
- 自助认证链路与 MFA 管理接口暂不混入首批资源授权试点

## 5. 实施切片

### SLICE-01 文档与术语冻结

- 冻结 `checkPermission / checkResource / buildQueryScope / domain rule` 术语
- 冻结 policy 三分类
- 冻结跨服务派生协作授权规则

状态：

- completed

### SLICE-02 Gateway 粗粒度权限收口

- 启用 Gateway 粗粒度权限 guard
- 统一 Gateway controller 的接口级权限声明方式
- 验证 fail-closed 行为
- Gateway / 子服务入口 import 逐步收敛到 `@oes/common/authorization`

状态：

- completed

### SLICE-03 单资源命令接口接入 `checkResource`

优先接口类型：

- `update`
- `delete`
- `approve`
- `assign`
- `revoke`

约束：

- 在 application 层执行
- 先加载最小必要 resource facts
- 不把领域状态机约束写成 policy

状态：

- pending

### SLICE-04 单资源详情查询接入 `checkResource`

优先接口类型：

- `getById`
- `detail`

约束：

- 详情类查询仍以单资源布尔授权为主
- 不在接口层前置 guard 强行完成

状态：

- pending

### SLICE-05 列表 / 搜索 / 分页接入 `buildQueryScope`

优先接口类型：

- `list`
- `search`
- `page`

约束：

- 输出 query scope，而不是逐条布尔授权
- 允许按服务先局部实现，不要求首轮统一抽象完全共享

状态：

- in_progress

### SLICE-06 高风险动作接入 `security policy`

优先接口类型：

- `export`
- `approve`
- `grant`
- `rotate`
- `revoke`

约束：

- 区分稳定安全边界与高动态风控能力
- 先做白名单 IP / 工作时间等稳定策略

状态：

- pending

### SLICE-07 派生内部协作链路收口

- 明确主业务动作的最终操作者授权主责服务
- 明确派生内部协作默认不重复同层最终操作者授权
- 明确 operator context 继续传播的规则
- 为需要独立授权的下游入口单独保留授权检查

状态：

- pending

## 6.1 当前执行任务列表

第一优先级：

- 收口历史文档与遗留说明中的旧权限快照字段
- 设计并冻结 `AuthorizationQueryScopeService + QueryScopeBuilder` 目标结构
- 在首个业务域服务中按统一门面模式推广 `buildQueryScope`
- 明确 query scope 到 repository 查询条件的映射方式
- 为首批列表查询补充 scope 收口与越权拒绝测试
- 评估 `identity-service` 剩余列表接口是否仍值得继续推广 `buildQueryScope`
- 扩展 detail query `checkResource` 到更多资源，或开始单资源命令 `checkResource` 试点

第二优先级：

- 在首个业务域服务中落地单资源命令 `checkResource`
- 优先覆盖 `update / delete / approve / assign / revoke`
- 在首个业务域服务中落地详情查询 `checkResource`
- 为首批接口补充 access denied 与 pass-through 用例测试
- 评估 `checkResource` API 是否从多方法试点收敛为统一入口
- 评估 detail query 是否需要引入 auth snapshot / 最小授权事实查询

第三优先级：

- 为高风险动作接入 `security policy`
- 先覆盖白名单 IP、工作时间等稳定安全边界
- 梳理跨服务派生协作中哪些下游入口仍属于独立授权点
- 将 `buildQueryScope` 与 `checkResource` 逐步推广到更多业务域

## 7. 推荐落地顺序

1. `SLICE-02`
2. `SLICE-03`
3. `SLICE-04`
4. `SLICE-05`
5. `SLICE-06`
6. `SLICE-07`

## 8. 服务侧优先级建议

第一批建议优先服务：

- `api-gateway`
- `auth-service`
- `identity-service`
- 首个实际承载业务资源操作的业务域服务

第二批再推广到：

- 订单域
- 库存域
- 出库 / 仓储域
- 其他存在租户 / owner / department 边界的业务域

## 9. 代码组织建议

推荐以“统一门面 + 资源域 builder”组织查询授权代码，而不是“每个接口一个实现”，例如：

```text
application/
  authorization/
    query-scope/
      query-scope-builder.interface.ts
      query-scope.types.ts
      authorization-query-scope.service.ts
      builders/
        order-query-scope.builder.ts
        customer-query-scope.builder.ts
        inventory-query-scope.builder.ts
```

约束：

- 统一门面负责入口与 builder 分发
- builder 按资源域组织，不按接口组织
- repository / query adaptor 只消费 scope，不负责决定授权边界
- 首批试点允许使用函数式 builder，但不应作为最终标准形态继续扩散

## 10. 验收标准

### 10.1 粗粒度权限

- Gateway 与子服务入口权限声明方式统一
- 无权请求在进入用例前被拒绝

### 10.2 单资源细粒度授权

- 单资源命令与详情接口在 application 层完成 `checkResource`
- 资源授权与业务规则边界清晰

### 10.3 查询范围

- 列表类接口优先采用 `buildQueryScope`
- 不以逐条布尔鉴权作为主方案

### 10.4 跨服务派生协作

- 主业务动作完成最终操作者授权
- 派生协作默认不重复同层最终操作者授权
- 审计、租户边界与业务规则仍完整保留

## 11. 风险与注意事项

- 若把业务规则继续塞进 policy，会导致 policy 侵入聚合状态机
- 若把细粒度授权继续强行收敛为 guard，会导致接口前置层承担不应承担的 resource loading 责任
- 若列表查询继续采用逐条布尔鉴权，会带来明显性能与复杂度问题
- 若派生内部协作层层重复做同层最终操作者授权，会导致业务链路权限语义碎裂
