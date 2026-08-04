# 授权判定协同蓝图

## 1. 目标

定义 OES 中“操作者在当前上下文下是否可以执行某操作、访问某资源、查询某范围”的长期协同方式。

`identity-service` 的身份上下文事实边界只以 [identity-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/identity-service.md) 为准；本文只记录授权判定协同方式。
`permission-service` 的服务设计、核心对象与 owner 边界只以 [permission-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/permission-service.md) 为准；本文不重新定义权限、角色、policy 或授权判定真相。

## 2. 参与服务

- `api-gateway`
- `auth-service` / STS
- `permission-service`
- `identity-service`
- 各平台服务与业务服务

## 3. 协同分工

- `api-gateway`
  - 承担入口级粗粒度门禁与前端权限摘要消费
- `auth-service` / STS
  - 验证 source credential 与直接 workload，消费 Permission 的独立 issuance decision，并独占 ExecutionToken 签发
- `permission-service`
  - 提供权限、角色、scope、policy、principal authorization、workload issuance 与授权判定真相；不签发 Token
- `identity-service`
  - 按唯一真相源提供账号、scope、tenant 引用等身份上下文事实
- 业务服务
  - 提供资源归属、业务状态与领域规则事实

## 4. 协同顺序

1. 外部入口由 `api-gateway` 验证 session / external credential、可信 tenant 与入口级 BUSINESS Permission。
2. Gateway 或调用方服务需要访问一个内部 target audience 时，通过 mTLS 连接 Auth / STS 并携带 Auth 可复核的 source credential；requested Code 只是最小申请，不建立授权。
3. INTERNAL issuance 时，Auth 以自身 transport-verified mTLS identity 调用 Permission `ResolveWorkloadIssuance`。这是唯一不预先要求 ExecutionToken 的 bootstrap authorization primitive；Permission 仍按 original workload -> audience -> Code policy 独立判定。
4. BUSINESS issuance 时，Auth 调用 `ResolvePrincipalAuthorization`；该调用要求 Auth mTLS identity 与含 `permission.internal.principal_authorization.resolve` 的 Permission-audience ExecutionToken。Permission 只做 principal BUSINESS Code upper bound，不接收业务 resource facts。
5. 所有 requested Code 全部获准后，Auth 才签发绑定直接 workload certificate、单一 audience、principal / tenant 与精确 Code 集的短期 ExecutionToken；任一 denied / mismatch / unavailable 都不签发。
6. 目标服务同时验证 mTLS workload identity 与 ExecutionToken 的 signature、audience、`client_id / cnf`、principal、tenant 和 method Code declaration。SELF_SERVICE 仍从可信 HUMAN principal 派生 target。
7. 需要单资源、列表范围或动态 resource policy 时，由业务服务 application 层调用 `checkResource / buildQueryScope`；最终状态机、不变量与领域规则仍由目标业务服务裁决。

## 5. 同步 / 异步边界

- 同步：
  - 调用方到 Auth / STS 的 ExecutionToken exchange
  - Auth 到 Permission 的 issuance decision
  - 业务 application 到 Permission 的明确 resource authorization contract
  - 调用方到 `identity-service` 的身份上下文查询
- 异步：
  - 无默认异步授权判定主链；跨域事实扩散应通过事件而非共享数据库

## 6. 真相归属

- 权限码、角色、scope、policy、授权判定：`permission-service`
- 操作者身份上下文：以 [identity-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/identity-service.md) 为准
- 资源本体与业务规则：对应业务服务
- HTTP 消费摘要：`api-gateway`

## 7. 明确禁止

- 不在 Gateway、DTO、Prisma schema 中编写授权真相
- 不让 `permission-service` 直接拥有业务资源主数据
- 不用共享数据库或复制内部类型来伪造授权耦合
- 不让 Gateway、普通业务服务或外部调用者直接消费 Auth-only issuance decision RPC
- 不把 mTLS workload identity 当作 BUSINESS / INTERNAL Permission；除 `ResolveWorkloadIssuance` 的精确 bootstrap policy 外，受保护内部 RPC 仍要求目标专属 ExecutionToken
- 不让 Auth 把 requested Code、legacy role/operator context 或本地 Permission 副本直接当作 granted set

## 8. 关联文档

- [permission-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/permission-service.md)
- [identity-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/identity-service.md)
- [15-authorization-layering-and-resource-policy-architecture.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/15-authorization-layering-and-resource-policy-architecture.md)
- [14-grpc-metadata-and-service-trust-architecture.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/14-grpc-metadata-and-service-trust-architecture.md)
- [principal-authorization.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/permission-service/principal-authorization.md)
- [execution-token.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/auth-service/execution-token.md)
