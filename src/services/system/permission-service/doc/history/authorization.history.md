# 鉴权能力历史

## 2026-04-06 10:30:00 +08:00

### 本次目标

补齐 `permission-service` 服务内 `Policy Explain` 的 AST 节点级命中树。

### 主要改动

- 为 `Policy` 条目 explain 增加条件树级解释输出
- `CheckPermissionWithContext` 现在除了 policy 级 `applicable/matched/reasonCode` 外，还会返回：
  - AST 节点类型
  - 节点路径
  - 节点命中结果
  - 左右值快照
  - 子节点解释树
- 同步更新本服务设计文档与状态文档，将 `4.5.18` 从“部分实现”更新为“已实现”

### 备注

- 本次只补服务内 explain 能力，不处理 gateway 错误响应链
- 本次不改变既有鉴权决策优先级，仍保持 `DENY > ALLOW > default deny`

## 2026-03-31 14:45:00 +09:00

### 本次目标

推进真实上游联调验收，验证 `api-gateway -> permission-service` 管理链路。

### 主要改动

- 为本地联调补齐 `permission-service` 与 `api-gateway` 的运行基线
- 修复真实启动时暴露出的模块装配问题：
  - `permission-service` 的 `ManagementAuthorizationModule` 导出 `AccountAuthorizationService`
  - `api-gateway` 的 `AuthBffModule` 显式装配 `DownstreamGrpcMetadataFactory`
- 为 `api-gateway` 接入本地静态 gRPC URL fallback
- 修正 permission 代理层分页参数，避免上游传入超出服务端校验上限的 `pageSize=1000`
- 完成一条真实成功链验证：
  - gateway JWT
  - operator context 透传
  - `InternalServiceGuard`
  - `AuthenticatedOperatorGuard`
  - `ManagementAuthorizationGuard`
  - `permission.list` 最小权限放行

### 备注

- 成功路径已通过真实 HTTP -> gateway -> gRPC -> permission-service 验证
- 无权限路径在 `permission-service` 侧已正确判定为 `AUTHORIZATION_DENIED`
- 后续已进一步推进拒绝路径转译：
  - HTTP status 已从错误的 `500` 收敛为正确的 `403`
  - 但 `api-gateway` 当前仍把该拒绝响应渲染成 Express HTML error page，而不是统一 JSON 错误体
- 因此这条真实上游联调链当前状态应视为：
  - 成功链已完成
  - 拒绝链 HTTP 语义已完成
  - 拒绝链统一错误响应格式仍待收尾

## 2026-03-31 11:40:00 +09:00

### 本次目标

将 `permission-service` 中不依赖外部支持的鉴权与审计能力推进到完成态。

### 主要改动

- 根模块补齐 `AuthorizationModule`，修复运行时 guard provider 缺失
- 禁用角色不再允许继续分配或出现在当前可选角色列表中
- 新增管理变更审计与鉴权决策记录持久化：
  - 管理写操作写入 `AuditEvent`
  - `CheckPermission / CheckPermissionWithContext` 写入 `DecisionEvent`
- 更新路线与任务文档，将服务内已闭环能力标记为完成，把批量鉴权、Explain 和真实上游联调明确后置

### 备注

- 本次不涉及新的外部 gRPC 契约
- `4.6.6` 与 `4.6.7` 继续后置，因为它们会影响公共契约和上游调用方

## 2026-03-31 12:10:00 +09:00

### 本次目标

推进 `4.6.6`，为 `permission-service` 增加第一阶段批量鉴权能力。

### 主要改动

- 在 `permission_check.proto` 中新增 `BatchCheckPermission`
- 新增批量 RBAC query / handler / gRPC 映射
- 响应按请求顺序返回，并回显调用方传入的 `requestId`
- 批量鉴权结果也会写入 `DecisionEvent`

### 备注

- 第一阶段仅覆盖 `RBAC-only` 批量鉴权
- `BatchCheckPermissionWithContext` 不在本轮范围内

## 2026-03-31 12:35:00 +09:00

### 本次目标

推进 `4.6.7`，为鉴权结果增加轻量 Explain。

### 主要改动

- 在鉴权响应中新增稳定的 `explainCode`
- 增加 `matchedPolicyId`
- 增加 `policyExplainEntries`，可返回本次参与评估的策略解释条目
- `RBAC` 与 `RBAC + ABAC` 决策链都输出机器可读解释码
- 批量鉴权单项结果也同步输出 `explainCode`

### 备注

- 当前 Explain 已提供 `explainCode + matchedPolicyId + policyExplainEntries`
- 更重的 AST 逐节点命中树继续后置

## 2026-03-23 13:35:00 +08:00

### 本次目标

纠正上一轮 role 管理拆分方向，恢复单个 generated gRPC controller，同时保留下层 template / instance / account-role 分组。

### 主要改动

- 恢复单个 `PermissionManagementGrpcController` 并继续使用 `@PermissionManagementServiceControllerMethods()`
- 移除手写 `@GrpcMethod(...)` 的多 controller 方案
- 保留 `application/commands/role/index.ts` 与 `application/queries/role/index.ts` 中按 template / instance / account-role 的分组导出

### 备注

- 协议层保持单 controller，避免 generated contract 与源码挂载关系脱节
- 业务分离继续落在 controller 下方的 command / query / handler 聚合层

## 2026-03-23 13:05:00 +08:00

### 本次目标

将 `permission-service` 中 role 相关的 template / instance / account-role 管理入口按层拆开，不再在同一个 gRPC controller 中混放。

### 主要改动

- `PermissionManagementGrpcController` 收缩为仅负责 permission 管理
- 新增 `RoleTemplateManagementGrpcController`、`RoleInstanceManagementGrpcController`、`AccountRoleManagementGrpcController`
- `RoleModule` 接管 role / account-role 相关 gRPC controller
- `application/commands/role/index.ts` 与 `application/queries/role/index.ts` 按 template / instance / account-role 分组导出 handler

### 备注

- 本次是结构收口，不涉及 proto / contract 变更
- 目录层面的进一步拆分仍可后续再做，但当前 controller、module、handler 聚合入口已经分离

## 2026-03-23 12:20:00 +08:00

### 本次目标

继续收口 `SLICE-07`，将剩余“角色实例入口”与模板角色彻底隔开。

### 主要改动

- `UpdateRole`、`SetRoleEnabled`、`DeleteRole` 仅允许操作 `TENANT_INSTANCE`
- 通过实例入口误传模板角色时，统一按实例不存在处理

### 备注

- 本次仍属于模板/实例边界收口
- 操作者级的系统管理员 / 租户管理员差异约束尚未在服务层完全落地

## 2026-03-23 12:05:00 +08:00

### 本次目标

继续收口 `SLICE-07`，将“仅面向角色实例”的接口边界真正落到服务层。

### 主要改动

- `GetRoleById`、`ListRolePermissions`、`ListRoleAccounts` 仅允许访问 `TENANT_INSTANCE`
- `AssignRolePermission`、`RevokeRolePermission` 仅允许操作 `TENANT_INSTANCE`
- 对通过实例入口误操作模板角色的请求，统一在服务层拒绝

### 备注

- 本次只修补模板/实例入口混用问题
- 租户管理员与系统管理员的更细粒度操作者约束仍待后续 `SLICE-07` 继续收口

## 2026-03-23 11:35:00 +08:00

### 本次目标

同步 `SLICE-07` 第一阶段落地后的设计文档状态，消除任务文档、设计文档与代码状态不一致的问题。

### 主要改动

- 将 [../design/account-role-management.md](../design/account-role-management.md) 中 `TODO-4.3-01` 更新为已实现
- 将 [../design/authorization.md](../design/authorization.md) 中 `4.6.5 服务内接口保护` 状态更新为“部分实现”

### 备注

- 本次只做文档收口，不涉及新的代码改动
- `SLICE-07` 其余租户 / 模板 / 资源边界仍待继续推进

## 2026-03-23 11:10:00 +08:00

### 本次目标

落地 `SLICE-07` 的第一步，补齐账号角色分配场景中的租户实例角色边界校验。

### 主要改动

- 在 `AssignAccountRoleHandler` 中补充“仅允许分配当前租户的 `TENANT_INSTANCE` 角色”校验
- 对不满足租户实例约束的角色统一返回 `ROLE_NOT_ASSIGNABLE`
- 更新 [../tasks/internal-service-auth-and-operator-context.md](../tasks/internal-service-auth-and-operator-context.md) 中 `SLICE-07` 的阶段状态

### 备注

- 本次只修补 `AssignAccountRole` 与 `SetAccountRoles` 之间不一致的租户边界
- 其余模板/实例/资源边界仍留在后续 `SLICE-07` 收口

## 2026-03-22 15:05:00 +08:00

### 本次目标

将 `SLICE-06` 当前实现中的管理权限码定义从遗留 TCP `PERMISSION_MESSAGES` 脱钩。

### 主要改动

- `MANAGEMENT_PERMISSION_CODES` 改为独立的稳定 permission code 常量，不再复用 `PERMISSION_MESSAGES`
- 为 `PERMISSION_MESSAGES` 增加 deprecated 标记，明确其仅用于遗留 TCP 消息模式，等待后续清理

### 备注

- 本次只做命名来源解耦，不改变现有管理接口的 permission code 字符串值
- 因而不会改变当前 `ManagementAuthorizationGuard` 的授权判定行为

## 2026-03-22 14:25:00 +08:00

### 本次目标

落地 `SLICE-06` 的第一阶段，为管理接口增加服务内最终授权收口。

### 主要改动

- 新增 `ManagementAuthorizationGuard`，基于已认证操作者的 `operator_id` 调用本地 RBAC 判断
- 管理接口显式声明所需 permission code，并由 guard 读取 decorator 执行校验
- 更新 `SLICE-06` 状态为“部分实现”

### 备注

- 本次优先按 permission 做最终授权判断，未硬编码 role 名称
- 租户一致性、模板角色与实例角色的细粒度边界仍留给后续 `SLICE-07`

## 2026-03-22 14:00:00 +08:00

### 本次目标

落地 `SLICE-05`，为 `permission-service` 管理接口接入已认证操作者声明校验。

### 主要改动

- 为 `PermissionManagementGrpcController` 接入 `RequireAuthenticatedOperator()` 与 `AuthenticatedOperatorGuard`
- 为 `PolicyManagementGrpcController` 接入 `RequireAuthenticatedOperator()` 与 `AuthenticatedOperatorGuard`
- 保持 `PermissionCheckGrpcController` 仅要求 `InternalServiceGuard`
- 更新 [../tasks/internal-service-auth-and-operator-context.md](../tasks/internal-service-auth-and-operator-context.md) 中 `SLICE-05` 的阶段状态

### 备注

- 本次只处理操作者上下文可信性校验，不包含管理接口最终业务授权
- `SLICE-06` 仍需补齐基于 `permission` 的服务内授权收口

## 2026-03-22 13:45:00 +08:00

### 本次目标

落地 `SLICE-04`，为 `permission-service` 现有全部开放 gRPC 接口建立统一的可信内部调用边界。

### 主要改动

- 为 `PermissionCheckGrpcController` 接入 `InternalServiceGuard`
- 为 `PermissionManagementGrpcController` 接入 `InternalServiceGuard`
- 为 `PolicyManagementGrpcController` 接入 `InternalServiceGuard`
- 更新 [../tasks/internal-service-auth-and-operator-context.md](../tasks/internal-service-auth-and-operator-context.md) 中 `SLICE-04` 的阶段状态

### 备注

- 本次只处理内部服务认证，不包含 `AuthenticatedOperatorGuard`
- 管理接口的操作者上下文验签与最终业务授权仍在后续 `SLICE-05`、`SLICE-06`

## 2026-03-18 17:40:01 +08:00

### 本次目标

将鉴权能力从总 checklist 中拆出，并把服务调用接口与业务管理接口的边界写入独立文档。

### 主要改动

- 新建 [../design/authorization.md](../design/authorization.md)
- 明确服务内接口保护需要两层校验：
  - 可信内部服务认证
  - 业务管理接口的操作者上下文校验

### 备注

- 具体跨模块方案不写在本文件中，统一引用根目录设计文档
## 2026-03-23 16:53:35 +08:00

### 本次目标

继续推进 `SLICE-07`，将 role 查询入口接上操作者范围约束。

### 主要改动

- 为 `GetRoleById`、`GetRoleTemplateById`、`ListRoleInstances`、`ListRoleTemplates` 引入统一 `operatorScope`
- 在 `PermissionManagementGrpcController` 中读取已验签的 `operatorContext`，并将范围信息传入 query
- 租户范围操作者只允许查询本租户实例角色
- 模板角色查询入口仅允许 system scope 访问

### 备注

- 当前 system scope 的临时判定规则为：`operatorContext.tenant_id` 为空时视为 system scope
- 该规则只用于本轮 `SLICE-07` 查询边界收口，正式系统管理员标识可在后续再收敛
