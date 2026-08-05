# Machine Principal Resolution For Auth Contract

```text
status: FROZEN
decisionAdr: docs/adr/0015-workload-identity-and-execution-token.md
architectureTruthSource: docs/architecture/services/identity-service.md
consumer: auth-service
```

> 本文冻结 Identity 为第一方 MACHINE root execution 提供的黑盒 principal/binding resolution。Identity 的长期 owner 语义以 [identity-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/identity-service.md) 为准；Auth source credential 以 [machine-workload-source-credential.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/auth-service/machine-workload-source-credential.md) 为准。

## 1. Surface And Purpose

Identity 在既有 `IdentityQueryService` gRPC surface 新增 Auth-only `ResolveMachinePrincipalForAuth`。该 resolver 只回答：Auth 已验证 credential 所引用的 Machine Principal 与 `MachineWorkloadBinding` 当前是否有效且一致，以及哪些 owner facts 可用于建立 `principal_type=MACHINE` 的执行身份。

它不修改或泛化既有 `ResolveIntegrationMachineForAuth`。后者继续只服务 external API-key exchange；两个 resolver 不互为 fallback。

本文冻结黑盒语义，不冻结 proto 字段、数据库 schema 或 runtime class 名。

## 2. Identity-owned Facts

Identity owns：

- Machine Principal stable id、type、`SYSTEM | TENANT` scope、tenant reference 与 active/disabled lifecycle；
- 适用时的 org reference，但不拥有 tenant/org tree 或 lifecycle；
- `MachineWorkloadBinding` stable reference、关联 Machine Principal、精确 workload SPIFFE ID、active/disabled lifecycle 与单调 binding version。

`MachineWorkloadBinding` 不保存 mTLS leaf certificate、certificate thumbprint、Auth credential、Permission Code、role/grant 或 ExecutionToken。

一个 SPIFFE workload 可以承载多个受控 machine binding；resolver 的唯一性来自 Auth 已验证 credential 提供的 principal reference + binding reference。该 binding 必须唯一指向该 principal，且其 SPIFFE ID/version 必须精确匹配；ambiguous result 永远不是 allowed result。

## 3. Trust And Logical Input

调用必须同时具备：

- transport 验证的准确 `auth-service` mTLS/SPIFFE workload；
- `aud=identity-service` 且绑定当前 Auth leaf certificate 的 ExecutionToken；
- exact INTERNAL Code `identity.internal.machine_principal.resolve`。

该 Code 只允许准确 Auth workload 通过 Permission `ResolveWorkloadIssuance` 申请，不进入 HUMAN/MACHINE role、external JWT、API-key flow 或 wildcard issuance policy。本 RPC 不是 mTLS-only bootstrap primitive。

逻辑输入只包含 Auth 从已验证 source credential 得到的：

- Machine Principal reference；
- `MachineWorkloadBinding` reference/version；
- 当前 transport-verified workload SPIFFE ID；
- trace/audit correlation。

不得输入 raw source credential、leaf certificate/thumbprint、API Key、Permission Code/grant、caller-computed tenant/org 或 body identity 作为 owner fact。

## 4. Decision Semantics

`allowed=true` 必须同时满足：

1. principal 存在、类型为允许的内部 MACHINE 类型且 lifecycle active；
2. scope 合法；`SYSTEM` tenant 为空，`TENANT` 具有有效且一致的 tenant reference；
3. binding 存在、active、唯一指向该 principal；
4. binding 的 SPIFFE ID 等于 Auth 提交的 transport-verified SPIFFE ID；
5. binding version 等于 credential 引用的当前 version；
6. 适用 tenant/org reference 没有 owner-boundary mismatch。

稳定输出只包含：

- `allowed` 与 safe reason category；
- principal stable id（Auth 用作 ExecutionToken `sub`）、`principal_type=MACHINE`、machine type、scope、tenant 与适用 org reference；
- principal lifecycle version、binding reference/version、SPIFFE ID echo 与 safe decision reference。

Identity 不返回 source credential、leaf thumbprint、Permission grant、role graph、target audience authorization 或业务资源事实。Auth 仍独立验证 leaf certificate binding，Permission 仍独立判定 BUSINESS/INTERNAL authorization。

## 5. Failure And Availability

not found、inactive、wrong type/scope、tenant/org mismatch、binding missing/disabled/stale、SPIFFE mismatch、ambiguous mapping、trust failure、timeout 或 dependency unavailable 均 fail closed。

Identity 返回安全 reason category；Auth 将其稳定映射为 MACHINE execution error。不得回退到 `ResolveIntegrationMachineForAuth`、legacy `AuthenticateApiKey`、Auth hardcoded root mapping、service-name header 或 caller/body principal fields。

## 6. Acceptance

1. 只有准确 Auth mTLS workload + identity-service audience Token + exact INTERNAL Code 可以调用。
2. active principal 与 active binding 的 principal/SPIFFE/version 全部一致时返回唯一 allowed decision。
3. principal disabled、binding disabled/stale、wrong principal、wrong SPIFFE、wrong scope/tenant 或 ambiguous mapping 返回 denied；Auth 不进入 Permission lookup/signing。
4. 同一 SPIFFE 下存在多个合法 binding 时，exact credential binding reference 仍只解析一个 principal；缺失或歧义 reference 拒绝。
5. external Integration resolver 与 API-key legacy surface 不参与内部 MACHINE resolution。
6. contract/runtime 不接收或返回 raw credential、leaf material、Permission facts 或 caller-computed authority。
