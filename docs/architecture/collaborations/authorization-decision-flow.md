# 授权判定协同蓝图

## 1. 目标

定义 OES 中“操作者在当前上下文下是否可以执行某操作、访问某资源、查询某范围”的长期协同方式。

`identity-service` 的身份上下文事实边界只以 [identity-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/identity-service.md) 为准；本文只记录授权判定协同方式。
`permission-service` 的服务设计、核心对象与 owner 边界只以 [permission-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/permission-service.md) 为准；本文不重新定义权限、角色、policy 或授权判定真相。

## 2. 参与服务

- `api-gateway`
- `permission-service`
- `identity-service`
- 各平台服务与业务服务

## 3. 协同分工

- `api-gateway`
  - 承担入口级粗粒度门禁与前端权限摘要消费
- `permission-service`
  - 提供权限、角色、scope、policy 与授权判定真相
- `identity-service`
  - 按唯一真相源提供账号、scope、tenant 引用等身份上下文事实
- 业务服务
  - 提供资源归属、业务状态与领域规则事实

## 4. 协同顺序

1. `api-gateway` 或调用方服务携带 operator / tenant / trace context 发起受保护请求
2. 需要粗粒度接口授权时，由 `permission-service` 给出授权判定
3. 需要资源级授权时，由业务服务 application 层调用统一授权能力，并消费 `permission-service` 的判定结果
4. 需要列表 / 搜索范围限制时，由调用方消费 `buildQueryScope` 风格的范围构建结果
5. 最终业务规则仍由目标业务服务负责裁决

## 5. 同步 / 异步边界

- 同步：
  - 调用方到 `permission-service` 的授权判定
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

## 8. 关联文档

- [permission-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/permission-service.md)
- [identity-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/identity-service.md)
- [15-authorization-layering-and-resource-policy-architecture.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/15-authorization-layering-and-resource-policy-architecture.md)
