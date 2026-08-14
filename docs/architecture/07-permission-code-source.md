# OES 统一 Permission Code 语义源

```text
status: FROZEN_PERMISSION_CODE_SOURCE
decisionAdr: docs/adr/0015-workload-identity-and-execution-token.md
```

> `permission-service` 的服务职责、Role、Grant 与 Policy 以 [permission-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/permission-service.md) 为准。本文只冻结 Permission Code 的代码语义源、metadata 与运行时同步方向。

## 1. 冻结结论

Permission Code 的唯一静态语义源固定为：

```text
src/common/src/authorization/permission-codes/**
```

依赖方向固定为：

```text
Common definitions
  -> Gateway / Auth-STS / all business services
  -> Permission Service runtime catalog sync
```

Collaboration Task P1 uses `collaboration.task.create` as the base HUMAN create capability alongside `collaboration.task.assign`. The base Code admits the unified `CreateTask` RPC; Collaboration still checks `collaboration.task.assign` in its application layer when the requested assignee differs from the verified operator. The canonical Common definition and Permission runtime catalog must be updated together by the future Collaboration implementation lease; no Code is granted to MACHINE, DELEGATED or ActionGrant callers in this inbound cutover.

禁止：

- Permission Service 私有脚本定义全项目业务域 Permission Code，再反向生成 Common。
- 业务服务手写散落字符串。
- 建立独立 Scope 表、Scope 目录或 Permission-to-Scope 转换规则。
- 把仅用于前端显示、尚无真实受保护入口或纯计划中的名称同步为 active runtime Permission。

ExecutionToken 的标准 `scope` claim 直接携带本次获准的 Permission Code 子集。

## 2. 当前漂移与根因

当前实现由 `permission-service/src/scripts/permission-catalog.ts` 定义约 256 个 active Code，再由 `generate-common-permission-codes.ts` 生成 Common string 常量。

该实现有以下问题：

- 反转了稳定架构规定的依赖方向。
- Permission Service 私有脚本被迫理解所有 bounded context 的业务能力。
- generator 只输出 string，丢失 owner、kind、assignability 与 scope-level metadata。
- generator 自身仍手工维护 import、path 和 export 清单。
- 生成机制没有运行时性能或安全收益。
- active catalog 中存在只在 seed、test 或 UI 出现而无真实服务端安全入口的 Code。

因此，`permission-catalog.ts -> common` 生成链必须在实现迁移中删除；Permission Service 改为消费 Common definitions 并 upsert 自己的运行时数据库。

## 3. 定义形态

不引入公共 `definePermissionGroup` helper。每个 bounded context 使用普通 TypeScript `const`、metadata `const` 与 `satisfies`：

```ts
export const SITE_MANAGEMENT_PERMISSION_CODES = {
  SYNC: 'site.management.sync'
} as const

export const SITE_MANAGEMENT_PERMISSION_DEFINITIONS = {
  ownerService: 'site-service',
  permissions: {
    [SITE_MANAGEMENT_PERMISSION_CODES.SYNC]: {
      description: '执行站点 public view 同步',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['TENANT']
    }
  }
} as const satisfies PermissionDefinitionGroup
```

公共类型最小字段：

```ts
type PermissionKind = 'BUSINESS' | 'INTERNAL'
type PermissionAssignee = 'HUMAN' | 'MACHINE' | 'WORKLOAD_POLICY'
type PermissionScopeLevel = 'SYSTEM' | 'TENANT'

interface PermissionDefinition {
  description: string
  kind: PermissionKind
  assignableTo: PermissionAssignee[]
  allowedScopeLevels: PermissionScopeLevel[]
  externalApiEligible?: boolean
}

interface PermissionDefinitionGroup {
  ownerService: string
  permissions: Record<string, PermissionDefinition>
}
```

字段语义：

- `ownerService`：Permission 语义 owner，不表示该 Code 只能在 owner 的一个 RPC 使用。
- `kind=BUSINESS`：可进入角色 / principal grant，承载业务能力。
- `kind=INTERNAL`：只可由 STS workload issuance policy 授予，不得加入人类或租户机器业务角色。
- `assignableTo`：静态阻止把 INTERNAL Code 或不适配主体的 Code 绑定到角色。
- `allowedScopeLevels`：阻止 SYSTEM / TENANT scope 错配，不替代运行时 tenant isolation。
- `externalApiEligible`：仅允许在 `kind=BUSINESS` 时为 true，表示该稳定 Permission Code 可以安全出现在 Auth 签发的短期 Gateway-only external JWT 中。它不声明 Gateway route、不授予任何 principal、不建立第二套 scope 目录；未标记或标记为 false 的 Code 不得进入外部 JWT。

不在第一版 metadata 中加入 speculative risk score、UI route、菜单、审批流或资源 schema。

## 4. 命名与稳定性

- 值使用稳定英文标识，通常采用 `domain.resource.action`。
- INTERNAL Code 必须显式包含 `.internal.`，例如 `asset.internal.site_media.resolve`。
- Principal BUSINESS issuance decision 使用的技术调用 Code 固定为 `permission.internal.principal_authorization.resolve`，只允许准确 `auth-service` workload 通过 `ResolveWorkloadIssuance` 为 `aud=permission-service` 申请，并绑定当前 Auth mTLS certificate；它不进入 HUMAN/MACHINE role、external JWT 或 wildcard workload policy。`ResolveWorkloadIssuance` 本身是 mTLS-only exact-Auth bootstrap authorization primitive，不为自身建立循环依赖的 Permission Code。
- ActionGrant completion 只新增两个 INTERNAL Code：Permission-owned `permission.internal.delegated_authorization.resolve` 映射既有 `PermissionCheckService.ResolveDelegatedAuthorization`，Collaboration-owned `collaboration.internal.ai_action.resolve` 映射 Task owner-action resolver。两者只允许准确 `auth-service` workload 为准确 owner audience 申请并绑定当前 Auth mTLS certificate；都不是 bootstrap primitive，也不进入 HUMAN/MACHINE role、external JWT 或 wildcard workload policy。本设计不新增 BUSINESS Code。
- Common runtime readiness 必须先补齐已冻结但尚未注册的 `permission.internal.principal_authorization.resolve`，并与上述两个 ActionGrant INTERNAL Code 一起通过唯一静态语义源注册。Permission namespace 的最小 lease 是新建 `src/common/src/authorization/permission-codes/permission/internal.permission-codes.ts` 并从现有 `permission/index.ts` 导出；Collaboration Code 对应新建 `collaboration/internal.permission-codes.ts` 并从现有 `collaboration/index.ts` 导出。只有公共 definition 类型确实不足时才允许涉及类型文件；不得借此建立第二套目录或复制 owner risk mapping。
- API Key exchange 使用的技术调用 Code 固定为 `identity.internal.integration_machine.resolve` 与 `permission.internal.external_machine.snapshot.resolve`；Provider compromise remediation 使用 `auth.internal.external_api_key.verifier_version.compromise`。三者只进入各自精确 workload issuance policy，不进入 HUMAN/MACHINE role 或 external JWT。compromise Code 只允许环境注册的 deployment `security-operations-runner` 以 SYSTEM scope、`aud=auth-service` 与 certificate binding 取得，禁止 wildcard workload policy。
- 内部 MACHINE root resolution 已冻结、尚待实现（`FROZEN_PENDING_IMPLEMENTATION`）：独立技术调用 Code `identity.internal.machine_principal.resolve` 将精确映射待新增的 `IdentityQueryService.ResolveMachinePrincipalForAuth`。它只允许准确 `auth-service` workload 通过 `ResolveWorkloadIssuance` 为 `aud=identity-service` 申请并绑定当前 Auth leaf certificate；不进入 HUMAN/MACHINE role、external JWT、API-key exchange 或 wildcard workload policy，也不把 Identity resolver 变成第二个 mTLS-only bootstrap primitive。
- MACHINE binding/credential management 另冻结两个 BUSINESS Code：Identity-owned `identity.machine.workload_binding.manage` 保护 `EnrollMachineWorkloadBinding` / `DisableMachineWorkloadBinding`；Auth-owned `auth.machine_workload_source_credential.revoke` 保护 `RevokeMachineWorkloadSourceCredential`。两者可按 scope 授予 HUMAN 或受控 SYSTEM MACHINE，不进入 external JWT，不替代 internal resolver Code。`IssueMachineWorkloadSourceCredential` 不消费 BUSINESS/INTERNAL Code；它只依赖当前 mTLS 与预先登记的 active Identity binding，不得把 mTLS 自身当成 grant。
- 该 Code 的完整 exact implementation lease 以 `docs/plans/features/trusted-grpc-execution-context.md` 的 “MACHINE root exact implementation lease” manifest 为准；其中逐文件登记 Permission canonical catalog source、generator、tracked Common outputs 与现有 catalog/codegen tests。generated Common 文件不得手工维护；除 manifest 明列路径外不授权其他文件，也不得借此复制 Auth credential profile 或 Identity binding 语义。
- value 是数据库、Token scope、decorator 与审计使用的稳定身份。
- TypeScript key 只负责代码可读性。
- 修改现有 value 视为契约变更；使用新增 + 显式 deprecated / migration，不做静默 rename。
- 描述与 metadata 可治理更新，但不能改变 Code 的业务含义。

## 5. Runtime catalog sync

Permission Service 同步方向：

1. 聚合 Common definitions。
2. 验证 Code 唯一、metadata 完整、owner 合法。
3. upsert `Permission` 运行时 catalog。
4. 输出新增、已存在、metadata 变化、deprecated 与引用冲突报告。
5. 默认不自动物理删除数据库记录；删除由显式治理流程处理。

数据库是当前环境运行时注册事实，Common 是允许存在的代码语义源。业务服务不能直接写 Permission 数据库。

## 6. all / any 与 application policy

Decorator 使用：

```ts
@AuthorizeBusinessRpc({ all: [A, B] })
@AuthorizeBusinessRpc({ any: [A, B] })
```

- `all`：同一操作必须同时具备全部能力。
- `any`：多个 Code 对完全相同的操作均构成充分授权。
- 如果 body 中不同值选择不同状态跃迁，不能把对应 Code 放入一个 `any`；必须拆分命令或在 application 层按目标动作检查对应 Code。
- 条件授权如“操作自己的备注无需 manage，删除他人备注需要 manage”继续由 application/resource policy 判断；入口仍标为 BUSINESS。

## 7. 当前 catalog 审计决定

当前 256 个 active Code 的冻结治理方向：

### 7.1 从 active catalog 退出

以下 22 个 Code 类别退出 active runtime catalog；未来真实接口冻结后可以重新以新证据引入：

- 7 个把基础 self-service 伪装为岗位 RBAC 的 Code：
  - `auth.login_method.self.list`
  - `auth.login_method.self.manage`
  - `auth.session.self.list`
  - `auth.session.self.revoke`
  - `identity.account.self.read`
  - `identity.account.self.update_profile`
  - `permission.account.self.get_roles`
- 5 个与已存在工作邮箱 / 手机细分能力重复且当前没有独立真实入口的 generic Contact Asset Code：
  - `identity.contact.asset.assign`
  - `identity.contact.asset.update`
  - `identity.contact.asset.set_status`
  - `identity.contact.asset.set_primary`
  - `identity.contact.asset.release`
- 5 个尚无真实受保护入口的 CRM future Code：
  - `crm.duplicate.viewRestricted`
  - `crm.contact.manage`
  - `crm.source.manage`
  - `crm.activity.create`
  - `crm.opportunity.manage`
- 3 个只控制浏览器本地工作区、没有受保护 resource server action 的 Extension Code：
  - `extension.designer.project.create`
  - `extension.designer.product.collect`
  - `extension.designer.submit_to_oes`
- `permission.policy.delete`：当前 Policy 治理冻结为 readonly，不存在开放删除能力。
- `item_master.item.set_composition`：当前没有真实执行入口。

### 7.2 保留并接入真实入口

- Identity 工作邮箱 / 手机 8 个细分 Code 接入对应 RPC，替换 generic Contact Asset Code。
- Site 的 locale、product、content、credential、audit 五个细分 Code 替换当前过粗的 READ / MANAGE 使用。
- `item_master.item.set_primary_category` 接入对应 Item Master command。
- `sales.order.set_commercial_gate` 接入现有 Sales BUSINESS RPC。
- Collaboration annotation/task Code 保留，用于 application 层条件授权。
- `terminal-device.sensitive.read` 保留，用于敏感字段 projection 条件授权。

### 7.3 修正 metadata owner

- Browser Activity Code 的 owner/module 改为 `browser-activity-service`，不再归 `permission-service`。
- Party 的六个真实 proto RPC 现已形成 exact INTERNAL Code set；其 definitions、workload allowlists and generated Common exports must be updated together by the Party implementation lease. Identifier resolution and candidate search remain with an empty current workload allowlist until a real caller is frozen; no speculative caller is granted.

Party's frozen Code definitions are all `kind=INTERNAL`, `assignableTo=[WORKLOAD_POLICY]`, `allowedScopeLevels=[SYSTEM]` and `externalApiEligible=false`: `party.internal.register_tenant_party`, `party.internal.deactivate_tenant_party`, `party.internal.get_tenant_party_by_id`, `party.internal.resolve_tenant_party_by_identifier`, `party.internal.resolve_tenant_party_for_consumer` and `party.internal.search_tenant_party_candidates`. The exact caller/workload allowlist is owned by the Party trusted-gRPC packet; an empty allowlist means no current issuance, not a wildcard grant.

### 7.4 Notification Auth dispatch

`notification.internal.auth.dispatch` 是 Notification-owned `kind=INTERNAL` Code，精确映射 `NotificationService.SendEmail` / `SendSms` 的 Auth-only SYSTEM dispatch。它只允许环境注册的准确 `auth-service` workload 通过 `ResolveWorkloadIssuance` 为 `aud=notification-service` 申请，`assignableTo=WORKLOAD_POLICY`、`allowedScopeLevels=[SYSTEM]`、`externalApiEligible=false`；不得进入 HUMAN/MACHINE 业务角色、external token、wildcard workload policy 或 Collaboration Task event consumer。

### 7.5 Terminal Device trusted gRPC completion

Terminal Device 新增一个 `kind=BUSINESS` Code：

- `terminal-device.update`：更新非生命周期设备展示字段；

既有 `terminal-device.status.disable`、`mark-lost`、`mark-maintenance`、`restore-active` 在同一 RPC 的 `any` declaration 后，仍必须由 Terminal Device Service 执行 exact target-status-to-Code matching；`DECOMMISSIONED` 复用 `terminal-device.status.disable` 但仍是服务端不可恢复终态，并要求高风险 reason 与审计。持有任一 Code 不能执行另一种 transition。`terminal-device.sensitive.read` 继续作为 `GetTerminalDevice` unmasked projection 的附加 Code，并单独保护 runtime snapshot、heartbeat history 与 diagnostic history。

Terminal Device 新增四个 owner=`terminal-device-service`、`kind=INTERNAL`、`assignableTo=WORKLOAD_POLICY`、`allowedScopeLevels=[SYSTEM]`、`externalApiEligible=false` 的 Code：

- `terminal-device.internal.gateway.enrollment.activate`；
- `terminal-device.internal.gateway.access.resolve`；
- `terminal-device.internal.gateway.heartbeat.record`；
- `terminal-device.internal.gateway.diagnostic_log.record`。

四者只允许环境 registry 中准确 `api-gateway` SPIFFE workload 通过 `ResolveWorkloadIssuance` 为 `aud=urn:oes:service:terminal-device-service` 申请；不得进入 HUMAN/TENANT MACHINE role、external token、DELEGATED grant、wildcard workload policy 或其他 service audience。

### 7.6 Item Master INTERNAL eligibility

Item Master 新增三个 owner=`item-master-service`、`kind=INTERNAL`、`assignableTo=[WORKLOAD_POLICY]`、`allowedScopeLevels=[SYSTEM]`、`externalApiEligible=false` 的技术调用 Code：

- `item_master.internal.manufacturable_item.resolve`：只允许准确 `mes-service` workload；
- `item_master.internal.stockable_item.resolve`：只允许准确 `wms-service` workload；
- `item_master.internal.purchasable_item.resolve`：只允许准确 `procurement-service`、`srm-service` workload。

三者分别映射 `ResolveManufacturableItem`、`ResolveStockableItem`、`ResolvePurchasableItem`，只允许为 `aud=urn:oes:service:item-master-service` 逐跳签发并绑定当前 caller certificate。它们不进入 HUMAN/MACHINE role、external JWT、DELEGATED grant 或 wildcard workload policy；SYSTEM scope 也不构成 tenant wildcard。现有 `item_master.item.get_by_id` 继续只保护 HUMAN `GetItem`，不得作为内部 capability 校验的双模式入口。

## 8. Asset + Site 第一优先链新增 Code

Site Media 第一优先 service slice 至少需要：

BUSINESS：

- `asset.site_media.read`
- `asset.site_media.upload`
- `asset.site_media.archive`
- `asset.site_media.takedown`
- `asset.site_media.delete`
- `asset.site_media.delivery.manage`

INTERNAL：

- `asset.internal.site_media.resolve`
- `asset.internal.site_media.publication.protect`
- `asset.internal.site_media.publication.release`
- `asset.internal.avatar.resolve_public_url`
- `site.internal.runtime.capability.register`
- `site.internal.runtime.publication.read`
- `site.internal.runtime.sync.report`
- `site.internal.runtime.preview.read`

最终 exact Code 与 RPC 映射在 Asset shared contract / implementation packet 中保持一致，不新增 Permission-to-Scope 转换规则。

## 9. 一致性测试

必须提供全局静态测试：

- 所有 Code 全局唯一。
- 每个 Code metadata 完整。
- INTERNAL Code 不能 assign to HUMAN / MACHINE role。
- role foundation 只能引用 active、可分配且 scope-compatible 的 Code。
- decorator 只能引用 active Code。
- Permission Service runtime seed 与 Common definitions 一致。
- 旧反向 generator 与 generated banner 不再存在。
- active Code 不能只被 seed / test / UI 引用而没有明确 contract 或 runtime security consumer。

## 10. 迁移与删除

1. 在 Common 建立人工维护 definitions 与聚合器。
2. 让 Permission Service sync 消费 Common。
3. 迁移 role foundation、Gateway、server decorator 与 STS。
4. 处理本次审计决定的 deprecated / active 变化。
5. 删除 Permission Service `permission-catalog.ts -> common` generator、generated banner 与相关一致性测试。
6. 保留现有 `*_PERMISSION_CODES` export name，减少调用方无意义 churn。

该迁移是单向终态迁移，不长期维护 Common 和 Permission Service 两份定义。
