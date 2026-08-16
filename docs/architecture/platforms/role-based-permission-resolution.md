# OES 基于主体与角色的 Permission 解析设计

```text
status: FROZEN_PRINCIPAL_PERMISSION_RESOLUTION
decisionAdr: docs/adr/0015-workload-identity-and-execution-token.md
transportTruthSource: docs/architecture/platforms/grpc-metadata-and-service-trust.md
```

> `permission-service` 的服务设计唯一真相源为 [permission-service.md](../services/permission-service.md)。本文只定义 Role / Principal grant 如何解析为 Permission Code 并供 Gateway、Auth / STS 与目标服务消费，不重新定义 Role、PrincipalRoleBinding、Permission 或 Policy owner。

## 1. 目的

本设计回答：

- HUMAN / MACHINE principal 的 Role grant 如何解析为有效 Permission Code。
- Gateway、Auth / STS 与目标服务分别在哪一层消费判定。
- 多跳调用为何传播最小 Permission Code，而不是 Role id 或完整授权图。
- 如何避免每个业务 RPC 在线访问 Permission Service 或 Auth。

## 2. 冻结结论

```text
PrincipalRoleBinding + RolePermission + Policy
  -> Permission Service resolves effective Permission Codes
  -> Gateway checks external BUSINESS entry
  -> Auth / STS signs exact granted subset into ExecutionToken.scope
  -> target service validates locally and applies resource/domain rules
```

稳定规则：

- Role 与 grant 是 Permission Service 的运行时授权事实，不跨服务复制。
- Permission Code 是接口能力的稳定公共词汇，也是 ExecutionToken `scope` 的值。
- Role id、role-permission mapping 或完整 permission catalog 不作为多跳 transport context。
- 目标服务从可信 ExecutionToken 取得本次获准的最小 Code 子集，不在普通 RPC 上重新解析全部 Role。
- Gateway HTTP `RequirePermissions` 与目标 gRPC method authorization 都保留；二者使用相同 Code 和可信 tenant，但各自保护不同信任边界。
- resource ownership、query scope、审批分离、状态机与业务不变量不由 Token 替代。

## 3. Role 与 Principal

Role 保持三类：

- `SYSTEM_TEMPLATE`：只用于派生 role instance，不直接绑定 principal。
- `SYSTEM_INSTANCE`：可绑定符合 metadata 的 SYSTEM HUMAN / MACHINE principal。
- `TENANT_INSTANCE`：只能绑定同 tenant HUMAN / MACHINE principal。

`PrincipalRoleBinding` 显式记录 principal type / id、scopeLevel、tenant、role、effective / expiry 与审计关系。既有 `AccountRole` 是 HUMAN binding 的 legacy storage 形态，按 [Principal Authorization Contract](../../contracts/permission-service/principal-authorization.md) 无损迁移。

MACHINE 不通过伪造 `UserAccount` 复用 grant。机器角色只参与业务授权，不生成 human navigation、landing page 或 terminal access view。

## 4. Permission Code 解析

### 4.1 BUSINESS

Permission Service 根据 active principal、有效 binding、enabled role、role-permission、scope / tenant 与适用 policy 解析有效 BUSINESS Code。

- HUMAN 以可信 session / account identity 解析。
- MACHINE 以 Identity 拥有的 active Machine Principal 解析。
- DELEGATED 不拥有独立长期 Role；有效 Code 是 HUMAN grant、delegation、agent/tool upper bound 与目标 policy 的交集。

### 4.2 SELF_SERVICE

基础 self-service 不通过普通岗位 Role grant 建模。目标必须从可信 HUMAN principal 派生，并由 `SELF_SERVICE` RPC mode、字段白名单、安全策略、step-up 与 application rule 共同保护。

### 4.3 INTERNAL

INTERNAL Code 不进入 HUMAN / MACHINE role。Permission Service 的 `ResolveWorkloadIssuance` 只回答：Auth 已验证的 original caller workload 能否为 target audience 申请指定 INTERNAL Code。它是发证控制面唯一不预先要求 ExecutionToken 的 bootstrap authorization primitive，只接受 transport-verified 的准确 `auth-service` mTLS / SPIFFE identity 调用这一准确方法；其他 Permission RPC 不继承该 trust policy。Auth / STS 消费该 decision 并签发绑定 audience、直接 workload 与 `cnf` 的 Token。

## 5. 三个消费点

### 5.1 Gateway

Gateway 验证 HTTP session / API credential，绑定可信 tenant target，并通过 `RequirePermissions` 对外部 BUSINESS 入口执行第一层授权。Gateway 不能使用 body tenant 或 tenant-blind legacy query。

### 5.2 Auth / STS

STS 在 Token cache miss、audience 变化、Code 集变化或安全版本变化时解析授权。INTERNAL 使用上述 mTLS-only bootstrap decision；BUSINESS 使用 Permission 的 `ResolvePrincipalAuthorization`，后者要求准确 Auth mTLS identity、`aud=permission-service` certificate-bound ExecutionToken 与精确 Code `permission.internal.principal_authorization.resolve`。两个 issuance decision 都是 Auth-only 发证控制面，不供 Gateway 或普通 application 直接调用；请求任意未获准 Code 时整体拒绝，Auth 不做 partial issuance。

### 5.3 Target Service

目标服务本地验证 Token signature、issuer、time、audience、`cnf`、tenant、principal mode 与 decorator `all / any`。普通调用不访问 Auth 或 Permission Service；只有需要动态 resource policy 的 application use case 才通过明确 contract 请求 `checkResource / buildQueryScope`。

## 6. all / any

- `all`：同一动作必须同时持有全部独立能力。
- `any`：列出的任一 Code 都足以授权完全相同的动作。
- request body 中不同值触发不同状态跃迁时，不能用一个 `any` 放行；应拆 command 或在 application 层按实际动作检查对应 Code。

## 7. Cache 与失效

- Gateway 可以按其入口契约缓存粗粒度授权 decision；STS 以 Permission decision 签发后只复用精确 tuple 的未过期 ExecutionToken，不把 caller request 或过期 decision 当作授权。相关 key 必须包含 principal、scope、tenant、requested Code、policy / authz version 与 delegation。
- 调用服务的 ExecutionToken cache 只存在本进程，key 还必须包含 audience 与 `cnf`。
- Role / grant 普通变更通过短 Token TTL 收敛；紧急变化通过 Auth / Permission 安全版本与撤销事实更新本地 deny cache。
- 不使用 Redis 共享 Bearer Token；Redis 可以保存非凭据型授权事实和安全版本。

## 8. 安全约束

- 调用方提交的 role id、admin flag、subject facts、tenant 或 permission list 不能建立授权。
- 业务服务不得本地硬编码 Role -> Permission 映射。
- Permission Service 不签发 ExecutionToken；Auth / STS 不拥有 Role / Policy 真相。
- Token `scope` 直接使用 Permission Code，不建立第二套 Scope catalog。
- Role / grant / policy decision 和 Token exchange 必须保留可关联的 audit reference 与 trace。

## 9. 迁移

历史 `operator_context.operator_roles -> Common resolver -> Permission Service` 路径不再是目标架构：

1. Common definitions 取代 Permission Service 反向生成 Code。
2. AccountRole 无损迁移到 HUMAN PrincipalRoleBinding，并加入独立 MACHINE binding。
3. Gateway 修复 tenant-aware permission gate。
4. Auth / STS 以 trusted principal decision 签发最小 Code subset。
5. Asset / Site 作为第一条业务优先链删除 role/operator body/header 传播并启用本地 Token authorization。
6. 同一 capability 继续逐服务迁移当前全部 gRPC 服务；每个目标独立验收并清零 legacy 引用，最终删除 role-based operator resolver 与 operator-context transport API。

未迁移服务可以暂时保持 legacy runtime，但任何一个 RPC 不得同时信任 legacy subject source 与新 ExecutionToken。

## 10. 相关真相源

- [Permission Service](../services/permission-service.md)
- [Permission Code Source](./permission-code-source.md)
- [Trusted gRPC Metadata](./grpc-metadata-and-service-trust.md)
- [Authorization Layering](./authorization-layering-and-resource-policy.md)
- [Principal Authorization Contract](../../contracts/permission-service/principal-authorization.md)
