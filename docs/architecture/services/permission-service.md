# permission-service 职责卡

## 1. Purpose

`permission-service` 是 OES 的授权事实与授权判定服务，负责回答“谁在什么上下文下可以做什么、能看到哪些入口、能从哪些终端进入系统”。

本文是 `permission-service` 的唯一稳定设计真相源。其他文档可以记录契约、协同流程、feature 状态或实现步骤，但不得重新定义本服务的核心对象、边界、命名或长期职责。

## 2. Owns

- `Permission` 运行时 catalog、权限码注册事实、权限引用关系与权限管理审计。
- `Role`、`RoleTemplate`、`PrincipalRoleBinding`、role-permission 绑定与 HUMAN / MACHINE principal grant 真相。
- `Scope`、`Policy`、授权判定、授权决策记录与 policy AST 评估能力。
- `PolicyTemplate`、`PolicyInstance` 资源授权配置事实、资源授权判定与查询范围构造能力。
- workload-to-INTERNAL-Permission issuance policy、发证控制面 bootstrap trust policy 与授权判定；Auth / STS 负责认证 workload、签发和执行该判定结果。
- DELEGATED authorization 的有效上限判定：将 HUMAN grant、有效 delegation、ToolContract 上限、tenant / org、resource policy 与目标 operation 取交集；Auth 负责 delegation credential 与 ActionGrant，Permission 不签发任一凭据。
- 当前 session 的 access summary：effective roles、effective action codes、运行时权限摘要。
- 第一阶段 navigation governance 真相：
  - `NavigationEntry Registry`
  - `RoleNavigationVisibility`
  - `RoleLandingPolicy`
- Terminal Access Policy 真相：
  - role terminal access
  - account terminal access override
  - effective terminal access decision
- onboarding 场景下的初始 role instance ensure 与 account role grant 真相。

## 3. Does Not Own

- 用户或机器认证、API Key credential、内部 `MachineWorkloadSourceCredential`、MFA、OTP、challenge、session、refresh token、access token、STS 或 ExecutionToken 签发语义；这些认证与 credential 真相归 `auth-service`。
- Machine Principal、`MachineWorkloadBinding`、SPIFFE-to-principal resolution 或其 lifecycle；这些身份真相归 `identity-service`。
- `User`、`UserAccount`、账号登录身份、contact asset、machine principal 或 employee binding 真相。
- 租户、组织、员工、Party 或业务资源主数据；员工与任职真相以 [hr-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/hr-service.md) 为准。
- 前端 route、菜单层级、icon、layout、页面文案、terminal-specific UI 呈现配置。
- 用户个人 landing page 偏好。
- 业务聚合生命周期、不变量、流程状态合法性或业务规则。

## 4. Core Objects

### 4.1 Permission

`Permission` 是全局权限 catalog 的运行时事实对象。

稳定规则：

- `Permission.code` 全局唯一，作为运行时持久化和授权判定使用的稳定标识。
- `Permission.code` 不作为常规可编辑字段开放。
- `Permission` 不按租户复制。
- `Permission.module` 与 `description` 是可治理元数据。
- 删除 permission 前必须检查 role / policy 引用关系。

权限码的代码语义源位于 `src/common/src/authorization/permission-codes/**`。`permission-service` 负责将统一权限码定义同步为运行时 catalog，并拥有数据库中的当前注册事实。业务服务不得自行向 permission 数据库散写权限码。

### 4.2 Role

`Role` 分为三类：

- `SYSTEM_TEMPLATE`
  - 全局模板角色。
  - 由系统管理员治理。
  - 用于派生租户角色实例。
  - 不得直接分配给 principal。
- `SYSTEM_INSTANCE`
  - 系统级真实角色。
  - 可分配给不绑定租户的 SYSTEM HUMAN / MACHINE principal。
  - 用于系统管理员 access summary、接口授权与系统导航解析。
- `TENANT_INSTANCE`
  - 租户级真实角色。
  - 必须属于具体 tenant。
  - 可分配给同租户的 TENANT HUMAN / MACHINE principal。
  - 用于租户管理员与租户成员 access summary、接口授权与租户导航解析。

稳定规则：

- role template 与 role instance 必须通过 `roleKind` / `scopeLevel` 显式区分。
- 从 template 派生 tenant role instance 时，实例继承 template code，可覆盖 `name / description`，并复制 template 当前 permission 集合。
- tenant role instance 的后续 permission 绑定与 template permission 绑定彼此独立，不做运行时继承。
- disabled role 不参与 access summary、terminal access 或授权判定。

详细 role kind 与 account-role scope 决策见 [0002-system-role-instance-and-account-role-scope.md](/Users/acehood/Documents/GitHub/oes/docs/adr/0002-system-role-instance-and-account-role-scope.md)。

### 4.3 PrincipalRoleBinding / Grant

`PrincipalRoleBinding` 是 HUMAN / MACHINE principal 与 role instance 的通用绑定事实。HUMAN principal 可引用现有 account identity；MACHINE principal 引用 Identity 拥有的 Machine Principal。机器不得通过创建伪 `UserAccount` 复用授权表。

稳定规则：

- binding 显式记录 `principalType = HUMAN | MACHINE` 与 `principalId`。
- 系统级绑定：`scopeLevel = SYSTEM`，`tenantId = null`，role 必须是 `SYSTEM_INSTANCE`。
- 租户级绑定：`scopeLevel = TENANT`，`tenantId` 必填，role 必须是同 tenant 的 `TENANT_INSTANCE`。
- `SYSTEM_TEMPLATE` 不得绑定 principal。
- `bindingId` 是不可变 grant identity。一次成功授予只创建一个 binding；不得通过修改既有 binding 的 principal、role、scope、tenant 或时间窗口表达另一笔授权。
- `bindingId` 是对外可引用的授权事实标识：grant 结果和 binding 查询必须返回它，revoke 必须以它精确定位目标 binding。`accountId + roleId` 只能在 legacy AccountRole 兼容窗口内标识旧记录，绝不作为 canonical revoke 的推断或回退选择器。
- 同一 `(principalType, principalId, roleId, scopeLevel, tenantId)` 的有效窗口不得重叠。窗口采用 `[effectiveAt, endAt)`：`effectiveAt = null` 表示无下界，`endAt` 是较早的 `expiresAt` 与 `revokedAt`，两端相等不重叠。该规则必须同时由写入事务与持久化唯一性/排他约束保护，不能只依赖先查后写。
- `effectiveAt < expiresAt` 是有 expiry binding 的前置条件；已过期、已撤销或尚未生效的 binding 都保留历史。授权解析只消费已生效、未撤销、未过期且 role enabled 的 binding。
- HUMAN binding 的 `principalId` 必须是与 scope / tenant 相符的已验证 `UserAccount`；MACHINE binding 的 `principalId` 必须是 Identity Service 中与 scope / tenant 相符的 active Machine Principal。Permission Service 通过受控 identity 协作校验引用，不复制其主体真相。
- 人类账号继续参与 access summary、navigation 与 terminal access；机器 grant 不生成 UI navigation，也不进入人类 terminal access 计算。
- Permission metadata 必须允许对应 principal type 与 scopeLevel；INTERNAL kind Permission Code 不得绑定到 HUMAN / MACHINE role，只能由 Auth / STS workload issuance policy 授予。现有 BUSINESS Code 可额外标记 `externalApiEligible`，表示该 Code 的稳定名称可安全出现在短期外部 Token 中；该标记不开放 HTTP route、不授予 Machine 权限、不建立第二套 scope 词汇，也不替代 Gateway 的外部 route 声明。
- revoke 只将目标 binding 关闭并记录首次 `revokedAt`、可信操作者、原因与审计关联，绝不物理删除。对同一 `bindingId` 的重复 revoke 返回原撤销结果，不重写时间、操作者或重复产生撤销审计事实。
- 已撤销 binding 的后续 regrant 必须创建新的 `bindingId`；不得复活、覆盖或改写旧授权。只有新窗口不与仍有效的同一逻辑 binding 重叠时才允许 regrant。
- checkbox list 类 principal 角色设置使用按 scope 全量替换语义：省略的当前 binding 被 revoke，新增项创建新 binding，历史 binding 不被删除或改写；单条授予可支持有效期窗口。
- grant、revoke、迁移与兼容投影都必须产生可关联 `bindingId`、principal / role / scope / tenant、时间窗口、可信 operator、request / trace 与原因类别的不可变审计事实；审计输入不得信任调用 DTO 自报的 operator 或 tenant。

`AccountRole` 在迁移期是 HUMAN binding 的 legacy storage / projection 名称，不是第二个可写授权真相。迁移必须将每一行无损变为 `principalType = HUMAN` 的 `PrincipalRoleBinding`，并保留原 grant id 作为 `bindingId`、role、scope、tenant、`effectiveAt / expiresAt` 与可获得的历史审计关联；迁移不是重新授权。迁移完成后的 canonical write path 只能写 `PrincipalRoleBinding`，旧名称如需兼容只能是其可重建的单向 HUMAN projection，禁止双向同步或双写。

迁移与回滚纪律：

- 先新增 target storage 并执行可重复的 id-preserving backfill；在每个切换阶段比较 binding 数、有效授权集合、access summary 与审计关联，任何不一致都停止切换。
- 在 canonical cutover 前，`AccountRole` 仍是旧版本的唯一写入面；在 canonical cutover 后，旧版本回退前必须冻结新授权写入、从 canonical HUMAN bindings 重建兼容 projection 并完成 parity 验证。
- legacy AccountRole mutation 只在其兼容窗口内运行；canonical `bindingId` revoke 启用后，缺少精确 binding identity 的旧 selector 不得静默映射到“当前”或“最近”授权，以免延迟重试误撤销 regrant。
- 旧 `AccountRole` 无法表示 MACHINE binding 或同一 logical binding 的多段历史。因此 rollback window 内不得启用这两类新写入语义；一旦启用，回退只能回到已支持 `PrincipalRoleBinding` 的版本，不能伪造或丢弃授权历史。
- 只有 rollback window 结束、所有读写方都已切至 canonical binding 且迁移审计可验证后，才可删除 legacy projection。HR、Identity、TenantOrg、BFF 或其他服务只能请求授权 grant，不能直接写 binding。

## 5. Authorization Model

### 5.1 checkPermission

`CheckPermission` 是入口级、能力级、粗粒度 RBAC 判定能力，主要供 Gateway guard 与内部服务接口 guard 使用。

稳定规则：

- 用于回答“当前 operator 是否能进入某类能力”。
- 默认基于 effective roles 与 permission codes。
- 不负责业务资源本体授权。
- 不替代 domain rule。
- subject identity、tenant、principal type 与 delegation 只能从已验证执行上下文或服务拥有的 identity facts 派生；调用方提交的 subject facts 不能提升授权。

ExecutionToken 使用同一 Permission Code 词汇：Permission Service 提供有效 HUMAN / MACHINE grant 与 policy 判定，Auth / STS 取其允许子集签发目标 audience Token。Permission Service 不签发 Token，也不建立独立 Permission-to-Scope 映射。

External API Key exchange 有一个额外的窄用途消费者：Auth 独立验证 Integration Machine 与 tenant 后，通过受信任的 machine-authorization contract 取得该 Machine 当前有效且 `externalApiEligible` 的 BUSINESS Code 快照与 `authzVersion`。Permission Service 不返回 Gateway route catalogue、credential fact、secret、Token 或 resource authorization result；Gateway 仍独占外部 HTTP route 是否开放的判断，目标业务服务仍执行 resource 与 domain authorization。

该快照由现有 `PermissionCheckService.ResolveExternalMachineAuthorizationSnapshot` gRPC surface 提供，并在 `permission-check` interface/controller、authorization application query 与现有 PrincipalRoleBinding / Permission catalog repository 边界内实现。它是 Auth-only INTERNAL technical primitive，要求 verified `auth-service` workload、target audience `permission-service`、certificate binding 与 exact issuance Code `permission.internal.external_machine.snapshot.resolve`；Gateway、外部调用者和普通 HUMAN/MACHINE role 不能获得此 Code。输入 machine/tenant 必须来自 Auth 已验证的 Identity 结果，输出显式携带 allowed、machine/tenant echo、Code snapshot、`authzVersion`、decision reference 与 safe reason。空快照、tenant mismatch、未知/不合格 Code、trust failure 或 downstream unavailable 均 fail closed，Permission 不签发 Token。

DELEGATED 判定必须同时受 HUMAN grant、未撤销的 delegation reference、固定 ToolContract / operation upper bound、tenant / org 与 resource policy 约束；任一输入不满足即拒绝。Tool 或 Agent 不能因用户有更高权限而自动获得更高上限，也不能把高风险 operation 重分类为低风险。

### 5.2 checkResource / buildQueryScope

新业务资源授权应优先采用项目级授权分层：

- 单资源命令或详情查询：application 层加载最小 resource facts 后执行 `checkResource`。
- 列表、搜索、分页、导出前范围筛选：application/query 层执行 `buildQueryScope`。

`ResourceAuthorizationService` 是 `permission-service` 的资源授权 application facade。调用方只依赖 `checkResource / buildQueryScope` 语义，不直接依赖底层 template evaluator、Prisma 表结构或组合算法。

长期资源授权主线为 `PolicyTemplate / PolicyInstance`：

- `PolicyTemplate` 定义平台内置、代码版本化、可测试的判断模板。
- `PolicyInstance` 定义某个 tenant 内，某类 subject 在某个 `permissionCode + resourceType` 下的资源范围或安全环境策略。
- `PolicyInstance` 承接资源授权事实职责，不再另建独立 `ResourceGrant` 或 `ResourceScope` 事实模型。

`permission-service` 拥有可被复用的授权事实、policy 能力与授权查询能力，但不拥有业务资源本体。资源事实与业务状态必须由对应业务服务提供。

项目级规则以 [15-authorization-layering-and-resource-policy-architecture.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/15-authorization-layering-and-resource-policy-architecture.md) 为准。

### 5.3 CheckPermissionWithContext

`CheckPermissionWithContext` 只作为历史兼容 RPC 与 policy AST 评估能力载体保留。

稳定规则：

- 不作为新业务资源授权的标准接入方式。
- 不应继续被新业务当作统一资源授权 RPC 扩散。
- 新业务资源授权必须优先落到 application 层 `checkResource / buildQueryScope`。

### 5.4 Auth / STS issuance decisions

Permission Service 在既有 `PermissionCheckService` 上提供两个只服务 Auth / STS 发证控制面的黑盒判定；它们不替代 Gateway 入口门禁、普通 `CheckPermission`、`checkResource / buildQueryScope` 或目标服务领域规则：

- `ResolveWorkloadIssuance` 只判断一个已验证 workload 是否可为指定 target audience 申请精确 INTERNAL Permission Code 集。
- `ResolvePrincipalAuthorization` 只判断 HUMAN、MACHINE 或 DELEGATED principal 在可信 scope / tenant / org 下是否可为指定 target audience 申请精确 BUSINESS Permission Code 集。

`ResolveWorkloadIssuance` 是 ExecutionToken 发证链路唯一的 bootstrap authorization primitive。调用它不预先要求 ExecutionToken；Permission 必须直接消费平台 mTLS / SPIFFE transport 注入的 `VerifiedWorkloadIdentity`，并只接受环境注册的准确 `auth-service` workload 调用这一准确方法。该 bootstrap trust policy 不是 Permission Code、Role grant、Bearer credential 或通用 mTLS 放行规则，不能被其他 workload、其他 Permission RPC、service-name header、网络位置或 wildcard policy 复用。Auth 提交的原始 caller workload、target audience、tenant / org attribution 与 requested INTERNAL Code 必须来自其已验证 exchange context；Permission 仍独立按 workload -> audience -> Code policy 判定。

对于 tenantless SYSTEM workload 调用 Item Master 三个 tenant-scoped INTERNAL 资格查询，Permission 仍只判断准确 workload -> Item Master audience -> exact INTERNAL Code，不提供、推导或背书 tenant authority，也不接收上游 bearer。Auth 独立验证当前上游 HUMAN ET 后，可把其 tenant 组合进本次目标 ET；Permission decision 继续绑定 tenantless SYSTEM Machine owner facts。caller body/local metadata、Permission request echo 或 policy 配置都不能替代该上游 proof。

`ResolvePrincipalAuthorization` 不是 bootstrap primitive。它必须同时验证直接 `auth-service` mTLS identity、`aud=permission-service` 的 certificate-bound ExecutionToken 与精确 INTERNAL Code `permission.internal.principal_authorization.resolve`。该 Code 只能由 `ResolveWorkloadIssuance` 所有的准确 Auth workload -> Permission audience issuance policy 批准，不能进入 HUMAN / MACHINE role。输入只包含已验证 principal typed reference、scope / tenant / org、target audience、非空 requested BUSINESS Code 集以及适用的 session / delegation / AgentPrincipal / ToolContract reference；不接收 role id、admin flag、caller-computed grant、target RPC id、业务 resource facts 或 domain state。SELF_SERVICE 不调用该判定；目标服务从可信 HUMAN principal 派生 self target。

MACHINE source credential/resolver 链当前为 `FROZEN_PENDING_IMPLEMENTATION`。实现完成后，MACHINE 调用进入 `ResolvePrincipalAuthorization` 前，Auth 必须已经验证 Auth-owned `MachineWorkloadSourceCredential` 与当前 mTLS leaf binding，并通过 Identity-owned `ResolveMachinePrincipalForAuth` decision 得到 active principal、scope、tenant/org 与 `MachineWorkloadBinding` reference/version。Permission 只消费这些经过 owner resolution 的 typed facts，并独立计算当前 MACHINE BUSINESS grant；它不接收 raw source credential 或 leaf certificate，不解析 SPIFFE-to-principal mapping，不读取 Identity/Auth storage，也不允许 credential 或 caller 自报的 tenant/grant 扩大授权。Identity resolution 缺失、stale、mismatch 或不可用时 Auth 不得调用本判定或签名。

两个判定都采用全量申请语义：requested Code 必须去重、规范排序且 kind 一致，只有全部获准时 `allowed=true`。未知、不可分配、部分批准、scope / tenant / audience / principal / delegation mismatch、stale decision 或依赖不可用都 fail closed；Permission 返回精确 granted / denied Code、安全 reason category、decision reference 与 `authzVersion`，Auth 不做部分签发。Permission 记录判定审计但不记录 source credential 或 Token 正文，也不签发或存储 ExecutionToken；`ResolvePrincipalAuthorization` 只按受保护 resolver 契约验证随请求提交的 ExecutionToken，不取得其签发或授权真相所有权。

ActionGrant completion 在同一 `PermissionCheckService` 增加受保护的 `ResolveDelegatedAuthorization`，不建立独立 Permission service surface。调用必须同时满足准确 `auth-service` mTLS identity、certificate-bound `aud=permission-service` ExecutionToken 与 `permission.internal.delegated_authorization.resolve`；它不是 bootstrap primitive。Auth 提供的可信 upper bound 必须来自当前 HUMAN/session、Auth-owned DelegationGrant、Identity-owned active AgentPrincipal 与 AI Platform-owned active ToolContract runtime resolution。`ResolvePrincipalAuthorization` 的 DELEGATED issuance 与 `ResolveDelegatedAuthorization` 消费同一 owner-derived upper-bound 语义；Permission 独立解析当前 HUMAN grants 并求交集。

Permission 不读取 AI registration JSON、prompt 或 caller/body-supplied bounds，不查询 Auth storage，也不复制 DelegationGrant、ActionGrant、AgentPrincipal、ToolContract 或 business-owner risk truth。业务 owner 的受保护 resolver 提供 canonical action facts、code baseline、tenant-only tightening 与 policy version；Permission 只消费该可信 owner decision 并执行 HUMAN grant ∩ DelegationGrant ∩ AgentPrincipal ∩ ToolContract ∩ owner action/policy 的 fail-closed 交集。缺失、陈旧、版本不匹配、风险降低或任一 owner 依赖不可用均拒绝；P1 不接受 org、role 或 personal risk override。

## 6. Policy

`Policy` 是围绕 permission 的历史 AST 授权策略事实。

稳定规则：

- Policy 必须绑定明确存在的 `permissionCode`。
- 当前正式持久化条件格式为受限 `conditionAstJson`。
- policy 只表达访问边界、安全边界或查询范围边界，不承载业务聚合生命周期、不变量或流程规则。
- 决策优先级为 `DENY > ALLOW > default deny`。
- 当某 permission 没有启用中的 policy 时，RBAC 通过即可允许。
- 当某 permission 存在启用中的 policy 时，必须进入 policy 评估；未命中允许规则时默认拒绝。

长期定位：

- 旧 `Policy + conditionAstJson` 只作为历史兼容、readonly governance 与 `CheckPermissionWithContext` 的 AST 评估载体保留。
- 旧 `Policy` 不作为新业务资源授权主线。
- `conditionAstJson` 不再作为未来业务资源授权的可编辑配置格式。
- 新业务资源授权必须落到 `PolicyTemplate / PolicyInstance + ResourceAuthorizationService`。

管理端当前阶段只开放 readonly governance。Policy create / update / delete / enable / disable、rule builder、explain / impact preview 必须作为独立 feature 重新冻结后再开放；既有底层 mutation RPC / command 属于 legacy compatibility，不得作为新调用方接入方式扩散。

### 6.1 PolicyTemplate / PolicyInstance

`PolicyTemplate` 是平台内置的受控授权模板，定义“如何判断”。

稳定规则：

- template 由平台代码维护，不由租户管理员创建或编辑。
- template 必须可测试、可审计、可解释。
- template 不执行任意脚本，不开放自由 AST。
- template 不拥有业务主数据真相。

第一阶段稳定 template 包括：

- `resource-field-in-set`
- `resource-field-equals`
- `resource-field-matches-subject-field`
- `own-resource`
- `org-scope`，第一阶段为 experimental
- `working-hours`
- `ip-allowlist`

`PolicyInstance` 是资源授权事实主模型，定义“谁在某个能力下受哪些资源范围或安全环境约束”。

稳定规则：

- `subjectSelector` 第一阶段只支持 `TENANT_WIDE / ROLE / ACCOUNT`。
- `TENANT_WIDE` 表示租户内全员默认收窄或安全策略，不表示 tenant isolation。
- `ROLE` 表示一类角色共同资源范围。
- `ACCOUNT` 表示账号级个性化资源范围。
- `permissionCode` 必须引用已存在的 `Permission.code`。
- `templateCode` 必须引用内置 template registry。
- `params` 保存授权配置引用，不保存业务主数据真相。
- `PolicyInstance` 是 resource grant / resource scope 的唯一长期事实承接模型。

组合规则：

- `DENY` 永远优先。
- 同一 layer、同一 field 的 `ALLOW` 取并集。
- 不同 layer、同一 field 的 `ALLOW` 取交集。
- 不同 field 的 `ALLOW` 取 `AND`。
- `TENANT_WIDE / ROLE / ACCOUNT` 是叠加收窄关系，不是覆盖关系。
- 无启用 `PolicyInstance` 时，RBAC 通过即可允许。
- 有启用 `PolicyInstance` 且进入资源授权评估时，未命中允许规则默认拒绝。
- `buildQueryScope` 无法安全编译时必须 fail closed。

## 7. Access Summary

`permission-service` 拥有当前账号 access summary 的计算真相。

Access summary 包含：

- effective role summaries
- effective action codes

稳定规则：

- `auth-bff` 只消费 `permission-service` 的 dedicated access-summary RPC，不应通过管理 RPC 自行拼接 role 与 permission。
- 前端只消费 `actionCodes` 做按钮、操作和 UI action 控制，不从 `roles` 推导权限。
- `roles` 只用于展示、诊断或解释当前 operator context。
- system-scope 账号解析 `SYSTEM_INSTANCE` roles。
- tenant-scope 账号解析当前 tenant 的 `TENANT_INSTANCE` roles。
- active account-role windows、disabled roles 与 scope 必须参与解析。

黑盒契约见 [permission-service/access-summary.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/permission-service/access-summary.md) 与 [api-gateway/access-summary.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/api-gateway/access-summary.md)。

## 8. Navigation Governance

`permission-service` 第一阶段拥有 navigation governance 的事实与运行时解析能力。

拥有的事实：

- `NavigationEntry Registry`
- `RoleNavigationVisibility`
- `RoleLandingPolicy`

稳定规则：

- 后端跨终端契约只返回 `visibleEntries` 与 `defaultEntry`。
- `defaultEntry` 必须从当前 `visibleEntries` 中选择。
- role landing policy 不授予 entry visibility，只在可见 entry 中选择默认入口。
- 多 role landing 冲突使用 `RoleLandingPolicy.priority`。
- feature / plugin enablement 不进入当前 navigation visibility 主链。
- `api-gateway/auth-bff` 消费解析结果并组成 session context，不拥有导航治理真相。
- 前端拥有 `entryKey -> route / page / screen` 映射、菜单层级、icon、layout 与 terminal-specific rendering。

本服务不把 navigation governance 扩展成后端统一菜单树或 Web route 配置中心。

黑盒契约见 [api-gateway/navigation-summary.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/api-gateway/navigation-summary.md)。

## 9. Terminal Access Policy

Terminal Access Policy 控制账号是否允许从指定人类交互终端建立或继续 session。

`permission-service` 拥有：

- role terminal access facts
- account terminal access override facts
- effective terminal access resolution
- terminal access management audit

稳定规则：

- 终端准入是登录 / refresh 链路的服务端准入能力，不是前端入口隐藏，不是 navigation visibility。
- `auth-service` 在 account selection 后、MFA 前，以及 refresh 时消费 `ResolveAccountTerminalAccess`。
- account override 存在时完全替代 role union。
- role terminal access 使用 active roles 的 allow union。
- 空 override 表示账号级全终端封禁。
- `DEFAULT` 不是合法登录 terminal；`API / MACHINE` 不属于人类账号 terminal access，应走 machine auth / service account。

协同蓝图见 [terminal-access-policy.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/collaborations/terminal-access-policy.md)，黑盒契约见 [terminal-access.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/permission-service/terminal-access.md)。

## 10. Onboarding Grant

`permission-service` 拥有 onboarding 场景中的 role ensure 与 account role grant 真相。

稳定规则：

- employee onboarding 中，HR 可请求 `GrantInitialAccessForEmployeeAccount`，但不拥有 grant 真相。
- tenant onboarding 中，TenantOrg 可请求 `EnsureTenantRoleInstanceFromTemplate` 与 `GrantInitialAccessForTenantAccount`，但不拥有 role instance 或 grant 真相。
- TenantOrg 的 tenant lifecycle、onboarding 编排与 tenant 引用语义以 [tenant-org-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/tenant-org-service.md) 为准；本文只冻结 permission 侧授权 owner。
- Identity 不直接写角色绑定。
- BFF 不展开角色推导，也不持久化 account-role。
- grant 请求必须幂等，并记录 operator / trace / audit metadata。
- access package 只冻结 owner，不在当前阶段冻结通用 shape。

契约见 [onboarding-grant.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/permission-service/onboarding-grant.md) 与 [tenant-onboarding-grant.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/permission-service/tenant-onboarding-grant.md)。

## 11. External Interfaces

典型上游入口：

- `api-gateway`
- `auth-service`
- `identity-service`
- `tenant-org-service`
- `hr-service`
- 平台服务与业务服务

典型契约位置：

- [permission-service/principal-authorization.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/permission-service/principal-authorization.md)
- [permission-service/access-summary.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/permission-service/access-summary.md)
- [permission-service/terminal-access.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/permission-service/terminal-access.md)
- [permission-service/onboarding-grant.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/permission-service/onboarding-grant.md)
- [permission-service/tenant-onboarding-grant.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/permission-service/tenant-onboarding-grant.md)
- [api-gateway/permission-management.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/api-gateway/permission-management.md)
- [api-gateway/access-summary.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/api-gateway/access-summary.md)
- [api-gateway/navigation-summary.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/api-gateway/navigation-summary.md)

## 12. Upstream Dependencies

- `identity-service`
  - 提供账号存在性、账号 scope、tenant 引用、operator 身份上下文等事实。
- `auth-service`
  - 提供认证链路与 session/token 调用时机，并消费 terminal access 判定。
- `tenant-org-service`
  - 发起 tenant onboarding grant 请求，但不拥有 grant 真相。
  - `Tenant` 与 onboarding 编排边界以 [tenant-org-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/tenant-org-service.md) 为准。
- `hr-service`
  - 发起 employee onboarding grant 请求，但不拥有 grant 真相。
- 业务服务
  - 提供资源归属、业务状态与领域规则事实，供资源授权链路消费。

## 13. Published Facts

- permission catalog 与 permission 引用关系。
- role、role template、role instance 与 account-role grant 事实。
- 授权是否通过及其 reason / explain 语义。
- 当前账号 effective roles 与 action codes。
- 当前 account / scope / terminal 的 terminal access 判定。
- 当前 role / scope / terminal 的 navigation visibility 与 default entry。
- onboarding 初始授权 grant 结果。

## 14. Non-goals

- 不拥有用户、租户、组织、员工、Party、session 或业务资源主数据。
- 不在 Gateway、DTO、前端或其他服务中复制本服务内部 role / policy 模型。
- 不让其他服务直接写 account-role 或 role-permission 绑定。
- 不替代业务域自己的 domain rule。
- 不把 policy 当作业务流程状态机。
- 不把 navigation governance 扩展为菜单树、route、icon、layout 或终端 UI 配置中心。
- 不把 terminal access 与 navigation visibility 混为同一套规则。
- 不把历史 `CheckPermissionWithContext` 扩展为新业务资源授权标准入口。

## 15. Related References

- [07-permission-code-source.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/07-permission-code-source.md)
- [09-role-based-permission-resolution.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/09-role-based-permission-resolution.md)
- [15-authorization-layering-and-resource-policy-architecture.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/15-authorization-layering-and-resource-policy-architecture.md)
- [authorization-decision-flow.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/collaborations/authorization-decision-flow.md)
- [terminal-access-policy.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/collaborations/terminal-access-policy.md)
- [0002-system-role-instance-and-account-role-scope.md](/Users/acehood/Documents/GitHub/oes/docs/adr/0002-system-role-instance-and-account-role-scope.md)
- [0005-terminal-access-policy.md](/Users/acehood/Documents/GitHub/oes/docs/adr/0005-terminal-access-policy.md)
