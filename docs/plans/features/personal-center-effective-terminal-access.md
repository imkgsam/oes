# Personal Center Effective Terminal Access Feature Packet

> 所属设计主题：Terminal-aware Account Security。本文只冻结“个人中心实时展示当前 account 的最终终端准入”这一补充闭环项，不承接 PDA Device Management、设备 registry、设备状态、PDA 版本策略或 PDA 页面联调。

## 状态校准

Status, 2026-06-07:

- 本 feature 已冻结推荐实现与验收标准，但尚未形成关闭记录。
- 本次源码核对发现 tenant-web 个人中心仍存在使用 `authContextStore.sessionContext?.allowedTerminals` 展示终端准入的痕迹。
- 因此当前状态校准为 `frozen / implementation-pending-or-incomplete`。
- 后续实现应以本文第 6-8 节为准，完成 BFF 动态查询 effective terminal access、tenant-web 改用 `summary.accountContext.allowedTerminals`，并补 fresh verification。

## 1. 目标

让 tenant-web 个人中心中的“终端准入”显示当前 account 的实时有效 terminal access，而不是显示登录时写入 token / session context 的旧快照。

## 2. 背景

当前个人中心通过 `authContextStore.sessionContext.allowedTerminals` 展示终端准入。该字段来自当前 access token / session validation 的 `allowedTerminals` 快照。

当管理员修改当前 account 所绑定 role instance 的终端准入，例如给 system admin 的 role instance 增加 `PDA` 后，permission-service 的事实已经更新，但当前浏览器里的 session context 仍可能保持旧值，例如只显示 `WEB`。

这会造成产品认知问题：

- 管理端 role terminal access 已保存成功。
- 个人中心仍显示旧 terminal set。
- 用户容易误以为 role terminal access 未生效。

## 3. 范围

包含：

- personal-center BFF 在生成 summary 时读取当前 account 的 effective terminal access。
- personal-center payload 在 `accountContext` 中返回 `allowedTerminals`。
- tenant-web 个人中心改为展示 `summary.accountContext.allowedTerminals`。
- 保留 `sessionContext.allowedTerminals` 作为登录安全快照，不再作为个人中心配置展示真相。
- 补充 BFF 与 tenant-web 测试，覆盖 role terminal access 改动后重新加载个人中心可见新值。

不包含：

- 修改 PDA Device Management Phase 2 的任何设备治理能力。
- 修改 `terminal-device-service`。
- 修改 PDA 设备绑定租户、设备状态、version policy、heartbeat 或 enrollment。
- 改造 auth-service token validation 为每次动态查询 permission-service。
- 设计租户级 primary login method policy。
- 改变 Terminal Access Policy 的解析规则。
- 实现 role terminal access 保存后的全局 session 推送刷新。

## 4. 职责边界

`permission-service` owns：

- role terminal access facts。
- account terminal access override facts。
- effective terminal access 解析规则。
- `account override` 覆盖 `role union` 的规则。

`auth-service` owns：

- 登录、refresh 与 session continuation 时的 terminal access enforcement。
- token / session 中的 `allowedTerminals` 快照。
- 不拥有个人中心展示用的 terminal access 配置真相。

`api-gateway` / `auth-bff` owns：

- personal-center summary 聚合。
- 面向 tenant-web 的黑盒 payload。
- 通过 permission-service 查询当前 account effective terminal access。

`tenant-web` owns：

- 个人中心展示。
- 使用 personal-center summary 中的 `accountContext.allowedTerminals` 渲染“终端准入”。

## 5. 冻结规则

1. 个人中心“终端准入”是配置展示语义，必须展示当前 account 的 effective terminal access。
2. `GET /auth/session/context` 的 `allowedTerminals` 仍是当前 session 的安全上下文快照，不作为个人中心配置展示真相。
3. `GET /auth/personal-center` 应返回：

```ts
accountContext: {
  accountId: string
  scopeLevel: 'SYSTEM' | 'TENANT'
  tenantId?: string
  roles: Role[]
  allowedTerminals: string[]
}
```

4. 如果当前 account 存在 account-level terminal access override，个人中心展示 override 结果。
5. 如果当前 account 不存在 override，个人中心展示当前绑定 role terminal access 的 union 结果。
6. 如果管理员修改 role terminal access 后用户重新打开或刷新个人中心，应看到最新值。
7. 不要求当前已打开页面自动推送更新；本 feature 的实时含义是“每次加载 personal-center summary 动态查询当前事实”。
8. role terminal access 保存成功后可以继续调用 `authStore.refreshCurrentSessionAccess()` 作为当前操作者导航/权限同步辅助，但个人中心展示不得依赖它。

## 6. 推荐实现

### 6.1 API Gateway / BFF

修改 personal-center 聚合链路，使其通过 permission-service 查询当前 account 的 effective terminal access。

推荐新增或复用现有 adapter：

- 若 auth-bff 已能访问 permission-service account terminal access HTTP/gRPC adapter，则复用。
- 若没有，应新增窄接口 port，例如 `AccountTerminalAccessSummaryPort`，只暴露：

```ts
getEffectiveTerminalAccess(input: {
  accountId: string
  tenantId?: string
  scopeLevel: 'SYSTEM' | 'TENANT'
}, source: DownstreamRequestSource): Promise<string[]>
```

实现要求：

- 不直接访问 permission-service 数据库。
- 不在 controller / DTO 中写解析规则。
- 不复制 role union / override 规则。
- BFF 只做聚合和字段映射。

### 6.2 Personal Center View Model

更新：

- `src/services/api-gateway/src/modules/auth-bff/interfaces/http/view-models/personal-center.view-model.ts`
- `src/services/api-gateway/src/modules/auth-bff/application/ports/personal-center-summary.port.ts`
- `src/services/api-gateway/src/modules/auth-bff/application/use-cases/personal-center.use-case.ts`
- `src/services/api-gateway/src/modules/auth-bff/infrastructure/downstream/personal-center/personal-center-summary.adapter.ts`

`accountContext` 增加：

```ts
allowedTerminals: string[]
```

### 6.3 Tenant Web

更新：

- `app/web/apps/tenant-web/src/api/bff/personal-center/index.ts`
- `app/web/apps/tenant-web/src/views/_core/profile/personal-center.vue`
- `app/web/apps/tenant-web/src/views/_core/profile/components/personal-account-section.vue`（如需 label 映射可在此组件内或 helper 中处理）

展示规则：

```ts
summary.accountContext.allowedTerminals ?? []
```

不得继续以以下字段作为个人中心终端准入展示来源：

```ts
authContextStore.sessionContext?.allowedTerminals
```

## 7. 测试要求

### 7.1 API Gateway / BFF Unit Tests

覆盖：

- personal-center summary 调用 permission-service effective terminal access 查询。
- SYSTEM account 查询时不传 tenantId。
- TENANT account 查询时传 tenantId。
- 返回值包含 `accountContext.allowedTerminals`。
- account override 存在时，下游返回的 override 结果原样进入 personal-center payload。
- role union 变化后，重新调用 `GET /auth/personal-center` 能返回新的 terminal list。

### 7.2 Tenant Web Unit Tests

覆盖：

- 个人中心 account section 使用 `summary.accountContext.allowedTerminals` 渲染 terminal tags。
- 当 `sessionContext.allowedTerminals = ['WEB']`，但 `summary.accountContext.allowedTerminals = ['WEB', 'PDA']` 时，页面显示 `WEB` 与 `PDA`。
- 当 `summary.accountContext.allowedTerminals = []` 时显示“当前账号无可登录终端”。

### 7.3 Manual Test

1. 使用 system admin 登录 tenant-web。
2. 打开个人中心，记录“终端准入”当前值。
3. 进入角色管理，找到当前 system admin 绑定的 role instance。
4. 修改该 role instance 的终端准入，增加 `PDA`。
5. 保存。
6. 返回个人中心并刷新页面或点击重新加载。
7. 预期个人中心“终端准入”显示 `WEB` 与 `PDA`。
8. 若仍只显示 `WEB`，检查该 account 是否存在 account-level terminal access override；若 override 只有 `WEB`，则显示 `WEB` 是正确结果。

## 8. 验收标准

- `GET /auth/personal-center` 返回 `accountContext.allowedTerminals`。
- tenant-web 个人中心不再依赖 `authContextStore.sessionContext.allowedTerminals` 展示终端准入。
- role instance terminal access 修改后，重新加载个人中心可看到最新 effective terminal access。
- account-level override 覆盖 role union 的语义保持不变。
- 不修改 PDA Device Management 相关接口或设备治理真相。
- 不引入跨服务共享数据库。

## 9. 建议提交拆分

1. `feat(auth-bff): expose effective terminal access in personal center`
2. `feat(tenant-web): render personal center effective terminal access`

如实现中只涉及少量文件，也可以合并为一个 commit：

```text
feat: show effective terminal access in personal center
```

## 10. 风险与注意事项

- 如果 personal-center summary 每次打开都查询 permission-service，BFF 聚合延迟会略有增加；这是可接受的，因为个人中心不是高频请求路径。
- 不应把该动态查询下沉到每次 `ValidateAccessToken`，否则会让所有受保护请求都依赖 permission-service terminal access 动态解析，扩大运行时耦合。
- 如果 permission-service 不可用，personal-center 可以失败关闭或降级为空列表；推荐失败关闭并提示个人中心加载失败，避免展示错误安全配置。
- 当前 session 的可继续使用性仍由 auth-service 在 refresh / session continuation 时执行 terminal access enforcement。本 feature 只解决“个人中心展示当前配置事实”的问题。
