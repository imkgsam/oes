# identity-service Machine Auth API

> 服务设计唯一真相源：[identity-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/identity-service.md)。本文只描述现有黑盒 gRPC machine auth 接口语义；machine principal 与 credential 的长期边界以服务真相源及后续专项设计为准。
> 涉及 permission code、upper-bound policy、delegation scope 或授权判定的服务设计边界，以 [permission-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/permission-service.md) 为准。

## 1. 接口范围

`IdentityMachineAuthService` 提供现有机器身份认证入口。

当前仅开放一个接口：

- `AuthenticateApiKey`

该接口用于：

- 校验 API Key secret
- 解析所属 `service account`
- 返回可供上游继续使用的机器主体摘要

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

- 把该接口视为机器主体认证入口，而不是通用查询接口
- 成功后应基于返回的 `service account` 继续做上层授权判断
- 不要依赖下游实现细节，只依赖返回的主体摘要和明确错误语义
