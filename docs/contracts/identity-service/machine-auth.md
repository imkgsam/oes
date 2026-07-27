# identity-service Machine Auth API（Legacy / Superseded Target）

```text
status: LEGACY_COMPATIBILITY_ONLY
supersededBy: docs/contracts/auth-service/execution-token.md
doNotUseAsTargetArchitecture: true
```

> 服务设计唯一真相源：[identity-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/identity-service.md)。本文只记录现有黑盒 gRPC 接口，不能作为新调用方或长期 credential 架构依据。
> 涉及 permission code、upper-bound policy、delegation scope 或授权判定的服务设计边界，以 [permission-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/permission-service.md) 为准。

目标 owner 已由 [ADR 0015](/Users/acehood/Documents/GitHub/oes/docs/adr/0015-workload-identity-and-execution-token.md) 冻结：Identity 只拥有 Machine Principal identity / lifecycle；Auth 拥有 API Key credential、认证、轮换、撤销与 STS ExecutionToken；Permission 拥有机器授权。

## 1. 接口范围

`IdentityMachineAuthService` 是待迁移的现有机器身份认证入口。

当前仅开放一个接口：

- `AuthenticateApiKey`

该接口用于：

- 校验 API Key secret
- 解析所属 `service account`
- 返回可供上游继续使用的机器主体摘要

禁止新增调用方。目标调用链为 API Key 只在 Gateway / Auth 认证，随后换取 target-audience ExecutionToken；API Key 不进入内部 gRPC metadata。

## 2. 调用约束

- 接口类型：gRPC
- 服务：`IdentityMachineAuthService`
- 调用方：内部服务
- guard：
  - `InternalServiceGuard`
- 当前不要求：
  - authenticated operator
  - permission code

## 3. AuthenticateApiKey

### 作用

用 API Key secret 做机器身份认证。

### 请求关键字段

- `secret`

### 响应关键字段

- `principal.api_key`
  - API Key 摘要
- `principal.account`
  - 所属 `service account` 摘要

### 关键业务语义

- 成功认证会刷新 `apiKey.lastUsedAt`
- 已撤销 API Key 不可通过认证
- 已过期 API Key 不可通过认证
- 所属 `service account` 被禁用时不可通过认证
- secret 明文不会被持久化，库内仅保存 hash

## 4. 主要错误语义

调用方应重点关注：

- validation failure
  - secret 缺失
- API Key invalid
  - 无法匹配任何有效 key
- API Key expired
  - key 已过期
- service account disabled / not found
  - 所属机器账号不可用

## 5. 调用方建议

- 现有调用方只可在原子迁移窗口内继续使用，不得扩散。
- 迁移时把 API Key hash、status、expiry、rotation、last-used 与审计关系转交 Auth-owned credential storage；Machine Principal id、type、scope、tenant 与 lifecycle 继续由 Identity 拥有。
- 迁移完成后删除 `AuthenticateApiKey` 与 Identity 内 credential secret/hash，不保留 Identity -> Auth 双写或长期 fallback。
- 新调用方使用 [execution-token.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/auth-service/execution-token.md)。
