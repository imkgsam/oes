# Machine Principal Resolution For Auth Contract

```text
status: FROZEN
implementationStatus: DESIGN_FROZEN_PENDING_IMPLEMENTATION
decisionAdr: docs/adr/0015-workload-identity-and-execution-token.md
architectureTruthSource: docs/architecture/services/identity-service.md
consumer: auth-service
```

> 本文冻结 Identity 为第一方 MACHINE root execution 提供的黑盒 principal/binding resolution 与固定 SYSTEM inventory provisioning。Identity 的长期 owner 语义以 [identity-service.md](../../architecture/services/identity-service.md) 为准；Auth direct exchange 以 [execution-token.md](../auth-service/execution-token.md) 为准。

## 1. Surface And Purpose

Identity 在既有 `IdentityQueryService` gRPC surface 提供 Auth-only `ResolveMachinePrincipalForAuth`。该 resolver 只回答：Auth 提交的 exact selector 与 transport-derived workload SPIFFE 是否对应当前唯一 active Machine Principal / `MachineWorkloadBinding`，以及哪些 owner facts 可用于建立 `principal_type=MACHINE` 的执行身份。

它不修改或泛化既有 `ResolveIntegrationMachineForAuth`。后者继续只服务 external API-key exchange；两个 resolver 不互为 fallback。

本文冻结黑盒语义、proto wire 与 owner persistence invariants；runtime class 名与具体实现算法仍属 implementation concern。

### 1.1 Frozen query wire

`IdentityQueryService` 新增 `ResolveMachinePrincipalForAuth`。Request 字段与 field number 固定为：

```proto
rpc ResolveMachinePrincipalForAuth(ResolveMachinePrincipalForAuthRequest) returns (ResolveMachinePrincipalForAuthResponse);
```

| Field | Number | Type |
| --- | ---: | --- |
| `machine_principal_id` | 1 | `string` |
| `machine_workload_binding_id` | 2 | `string` |
| `machine_workload_binding_version` | 3 | `int64` |
| `workload_spiffe_id` | 4 | `string` |

Response 字段与 field number 固定为：

| Field | Number | Type |
| --- | ---: | --- |
| `allowed` | 1 | `bool` |
| `machine_principal_id` | 2 | `string` |
| `principal_type` | 3 | `string`，成功时固定 `MACHINE` |
| `machine_type` | 4 | `string` |
| `scope_level` | 5 | `string` |
| `tenant_id` | 6 | `string` |
| `org_id` | 7 | `string` |
| `principal_lifecycle_status` | 8 | `string` |
| `principal_lifecycle_version` | 9 | `string` |
| `machine_workload_binding_id` | 10 | `string` |
| `machine_workload_binding_version` | 11 | `int64` |
| `workload_spiffe_id` | 12 | `string` |
| `decision_reference` | 13 | `string` |
| `reason_code` | 14 | `string` |

denied response 只回显 request principal/binding selector、`allowed=false`、safe decision reference 与 reason category；tenant/org、lifecycle 和其他 owner facts 留空，不允许通过 reason 枚举 principal 或 binding 存在性。

### 1.2 Frozen management wire

`IdentityManagementService` 新增 `EnrollMachineWorkloadBinding` 与 `DisableMachineWorkloadBinding`。两者使用普通 mTLS + target-audience ExecutionToken 和 BUSINESS Code `identity.machine.workload_binding.manage`，不是 bootstrap RPC。

```proto
rpc EnrollMachineWorkloadBinding(EnrollMachineWorkloadBindingRequest) returns (EnrollMachineWorkloadBindingResponse);
rpc DisableMachineWorkloadBinding(DisableMachineWorkloadBindingRequest) returns (DisableMachineWorkloadBindingResponse);
```

`EnrollMachineWorkloadBindingRequest` 固定为 `string machine_principal_id = 1`、`string workload_spiffe_id = 2`、`string idempotency_key = 3`。`DisableMachineWorkloadBindingRequest` 固定为 `string machine_workload_binding_id = 1`、`int64 expected_binding_version = 2`、allowlisted `string reason_code = 3`。

两个 response 都使用 `MachineWorkloadBinding` message：`string binding_id = 1`、`string machine_principal_id = 2`、`string workload_spiffe_id = 3`、`string status = 4`、`int64 binding_version = 5`、`int64 created_at_unix_seconds = 6`、`int64 disabled_at_unix_seconds = 7`、`string disable_reason_code = 8`。Enroll response 为 `MachineWorkloadBinding binding = 1`、`string audit_correlation_id = 2`；Disable response 为 `MachineWorkloadBinding binding = 1`、`bool already_disabled = 2`、`string audit_correlation_id = 3`。

## 2. Identity-owned Facts

Identity owns：

- Machine Principal stable id、type、`SYSTEM | TENANT` scope、tenant reference 与 active/disabled lifecycle；
- 适用时的 org reference，但不拥有 tenant/org tree 或 lifecycle；
- `MachineWorkloadBinding` stable reference、关联 Machine Principal、精确 workload SPIFFE ID、active/disabled lifecycle 与单调 binding version。

`MachineWorkloadBinding` 不保存 mTLS leaf certificate、certificate thumbprint、Auth credential、Permission Code、role/grant 或 ExecutionToken。

一个 SPIFFE workload 可以承载多个受控 machine binding；resolver 的唯一性来自 typed selector 的 principal reference + binding reference + exact version。该 binding 必须唯一指向该 principal，且其 SPIFFE ID/version 必须精确匹配；selector 只选择候选记录，ambiguous result 永远不是 allowed result。

第一阶段 internal resolver 只允许 `INTERNAL_SERVICE` 与 `AUTOMATION_BOT` Machine Principal。`EXTERNAL_INTEGRATION` 继续只走 external API-key resolver；`AI_AGENT` runtime 继续 deferred，不因本 contract 开放。

### 2.1 Persistence invariants

Identity Prisma 模型 `MachineWorkloadBinding` 固定保存 UUID `id`、Auth-independent `serviceAccountId`、exact SPIFFE ID、`ACTIVE | DISABLED` state、`BigInt` monotonic version、created/disabled operator、time、allowlisted reason 与 enrollment/disable audit reference。

- `serviceAccountId` 对本地 `ServiceAccount.id` 建立 `ON DELETE RESTRICT` FK；不对 tenant/org 或 Auth 建立跨服务 FK。
- 同一 `(serviceAccountId, workloadSpiffeId)` 同时最多一个 active binding；同一 SPIFFE ID 可合法绑定多个不同 principal。
- binding 没有 expiry 或 revoked state；disable 是终态。需要恢复时创建新 binding，不复活或改写旧历史。
- 任何 lifecycle 变更递增 version；resolver 必须比较 exact version，不容许“至少”或近似匹配。
- binding row 不存 leaf certificate、thumbprint、Auth credential、Permission Code、role/grant 或 ExecutionToken。
- enroll/disable state 和 local `AuditEvent` 在同一 Identity database transaction 中提交；resolver allowed/denied decision 在响应前记录同一 local audit sink。

### 2.2 Fixed SYSTEM inventory provisioner

Identity 拥有一个 deployment-invoked、idempotent、audited provisioner，用于在相关 workload readiness 前建立固定 SYSTEM / `INTERNAL_SERVICE` principal 与 binding。它不是 public/gRPC business API，不接收 runtime workload 请求，也不处理 TENANT / `AUTOMATION_BOT`。

版本化 inventory 的每个 entry 只包含 `inventory_entry_key`、`display_name`、固定 `machine_type=INTERNAL_SERVICE`、固定 `scope_level=SYSTEM` 与 exact `workload_spiffe_id`。Identity 以 immutable `inventory_entry_key` 作为幂等 owner key：首次运行在一个 local transaction 中创建 principal、创建 active binding、写 provisioning receipt 与 audit；同版本同内容重跑返回相同 selector 且不产生重复资产。已有 receipt/live owner facts 与 manifest 的 type/scope/SPIFFE 不一致、一个 key 对应多个记录、固定 entry 缺失或 audit 提交失败时，provisioner 拒绝并阻止相关 workload readiness，不静默修改 owner truth。

Identity-local `MachineWorkloadProvisioningReceipt` 固定保存 unique `inventoryEntryKey`、canonical manifest digest/version、`serviceAccountId`、`machineWorkloadBindingId`、首次 provision time、deployment revision 与 audit reference；两个 local FK 均使用 `ON DELETE RESTRICT`。receipt 不保存 selector secret（selector 本身非秘密）、certificate、tenant/org、Permission grant 或 Auth state。manifest 内容变化使用新 inventory version 并要求显式 migration；旧 key 不能悄然重指向另一 principal/binding。

成功输出每个 entry 的 `machine_principal_id`、`machine_workload_binding_id` 与 canonical positive `machine_workload_binding_version`，作为非秘密 workload selector 配置。输出不含 tenant/org、credential、certificate、Permission Code 或 grant。Deployment/SRE 只批准固定 inventory entry 与 workload SPIFFE 绑定意图；tenant bot/job owner 只批准已验证 job→binding 选择；Identity 批准 principal/binding identity 与 lifecycle；Permission 批准 workload/principal 的 Code 上限；Auth 只组合 owner decisions 并签发 Token。

tenant `AUTOMATION_BOT` 继续通过正常 management RPC 创建 principal/binding 并把 selector 存入其 owner-controlled job/runtime asset。一个 shared runner SPIFFE 可以拥有多个不同 tenant bot binding；每次 exchange 必须由 bot/job owner adapter 在验证 tenant/job→binding 后注入该 job 的 exact selector，external/body/prompt input 不得直接选择。停用一个 principal/binding 只使该 selector 失效。共享 runner compromise 的边界是同一 SPIFFE 的 declared binding set；高风险隔离使用独立 workload SPIFFE。

## 3. Trust And Logical Input

该 exact method 只接受 transport 验证的准确 `auth-service` mTLS/SPIFFE workload，并显式拒绝任何 `authorization` metadata。它不要求 Identity-audience ExecutionToken 或 `identity.internal.machine_principal.resolve` Code；method policy 不得复用到其他 Identity RPC、其他 caller、service-name header、network placement 或 wildcard。该 resolver 是 Identity owner control-plane 的唯一 pre-context identity primitive，不授予 target audience 或 Permission Code。

逻辑输入只包含 Auth 从 typed MACHINE selector 与当前 exchange transport 得到的：

- Machine Principal reference；
- `MachineWorkloadBinding` reference/version；
- 当前 transport-verified workload SPIFFE ID；
- trace/audit correlation。

不得输入 raw source credential、Authorization bearer、leaf certificate/thumbprint、API Key、Permission Code/grant、caller-computed tenant/org 或 body identity 作为 owner fact。`workload_spiffe_id` 必须由 Auth 从原始 exchange 的 `VerifiedWorkloadIdentity` 注入；selector 不得包含或覆盖该字段。

## 4. Decision Semantics

`allowed=true` 必须同时满足：

1. principal 存在、类型为允许的内部 MACHINE 类型且 lifecycle active；
2. scope 合法；`SYSTEM` tenant 为空，`TENANT` 具有有效且一致的 tenant reference；
3. binding 存在、active、唯一指向该 principal；
4. binding 的 SPIFFE ID 等于 Auth 提交的 transport-verified SPIFFE ID；
5. binding version 等于 typed selector 引用的 exact current version；
6. 适用 tenant/org reference 没有 owner-boundary mismatch。

稳定输出只包含：

- `allowed` 与 safe reason category；
- principal stable id（Auth 用作 ExecutionToken `sub`）、`principal_type=MACHINE`、machine type、scope、tenant 与适用 org reference；
- principal lifecycle version、binding reference/version、SPIFFE ID echo 与 safe decision reference。

Identity 不返回 source credential、leaf thumbprint、Permission grant、role graph、target audience authorization 或业务资源事实。Auth 独立使用当前 leaf 建立 Token certificate binding，Permission 独立判定 BUSINESS/INTERNAL authorization。

## 5. Failure And Availability

not found、inactive、wrong type/scope、tenant/org mismatch、binding missing/disabled/stale、SPIFFE mismatch、ambiguous mapping、trust failure、timeout 或 dependency unavailable 均 fail closed。

HUMAN OBO 不改变本 resolver wire contract：MES、WMS、Procurement 与 SRM 的 `SYSTEM` Machine Principal response 仍不得包含 tenant。Auth 从 deployment-owned immutable verified-SPIFFE/self-audience policy 取得 exact Machine Principal id、binding stable ref/version，并使用现有 request fields 连同 transport-verified SPIFFE 调用本 resolver。Identity 必须按当前 owner truth 返回 active 且完全相同的 principal/binding/version/SPIFFE、`principal_type=MACHINE`、`scope=SYSTEM` 和空 tenant；stale、mismatch、ambiguous 或 unavailable 均拒绝。Identity 不接收 subject ExecutionToken、subject tenant、target audience 或 caller-supplied actor，不把 HUMAN tenant 写入 principal/binding，也不参与 subject/target Token `jti` 关联。

Identity 返回安全 reason category；Auth 将其稳定映射为 MACHINE execution error。不得回退到 `ResolveIntegrationMachineForAuth`、legacy `AuthenticateApiKey`、Auth hardcoded root mapping、service-name header 或 caller/body principal fields。

stable reason category 只允许：

- `MACHINE_PRINCIPAL_NOT_ELIGIBLE`
- `MACHINE_PRINCIPAL_SCOPE_INVALID`
- `MACHINE_WORKLOAD_BINDING_NOT_ELIGIBLE`
- `MACHINE_WORKLOAD_BINDING_PRINCIPAL_MISMATCH`
- `MACHINE_WORKLOAD_BINDING_STALE`
- `MACHINE_WORKLOAD_SPIFFE_MISMATCH`
- `MACHINE_RESOLUTION_DEPENDENCY_UNAVAILABLE`

transport mTLS failure 或出现 Authorization metadata 使用 gRPC `UNAUTHENTICATED` 或 `PERMISSION_DENIED`，malformed field 使用 `INVALID_ARGUMENT`，owner dependency/audit unavailable 使用 `UNAVAILABLE`。这些 transport error 不伪装为 `allowed=false` owner decision。

## 6. Acceptance

1. 只有准确 Auth mTLS workload 可以调用 exact resolver；携带 Authorization、另一 workload、header identity、wildcard 或复用该 policy 到另一 RPC 均拒绝。
2. active principal 与 active binding 的 principal/SPIFFE/version 全部一致时返回唯一 allowed decision；selector 本身不建立 subject、tenant 或 grant。
3. principal disabled、binding disabled/stale、wrong principal、wrong SPIFFE、wrong scope/tenant 或 ambiguous mapping 返回 denied；Auth 不进入 Permission lookup/signing。
4. 同一 SPIFFE 下存在多个合法 binding 时，exact typed selector 仍只解析一个 principal；缺失或歧义 reference 拒绝。
5. external Integration resolver 与 API-key legacy surface 不参与内部 MACHINE resolution。
6. contract/runtime 不接收或返回 raw credential、leaf material、Permission facts 或 caller-computed authority。
7. empty inventory 首次运行创建固定 SYSTEM assets；同版本同内容重跑是 no-op 并输出相同 selector；manifest/database mismatch、duplicate 或 missing entry 阻止 readiness。
8. provisioner 输出不含 secret，且拒绝 TENANT / `AUTOMATION_BOT` inventory；tenant bot 只能走正常 management flow。
9. 同一 runner SPIFFE 的两个 tenant bot selector 分别解析到各自 tenant principal；停用一个 binding 后仅该 selector denied，另一个保持 allowed。
