# Policy Template / Instance Storage

> Status: SUPERSEDED_BY_TRUTH_SOURCE. Do not use this file as the stable storage design source or an implementation target.

> Historical phase packet. The active PolicyInstance resource authorization mainline is [policyinstance-resource-authorization-mainline.md](/Users/acehood/Documents/GitHub/oes/docs/plans/features/policyinstance-resource-authorization-mainline.md), and the current `PolicyInstance` management contract is [policy-instance-management.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/permission-service/policy-instance-management.md). Use this file only as background for the storage slice that has already landed.

> 服务设计唯一真相源：[permission-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/permission-service.md)。本文只记录第一阶段 policy template instance 存储落地前的历史设计，不重新定义 permission-service 长期 owner 边界；当前模型、契约与 rollout 状态以上述真相源为准。

## 1. 目标

- 为第一阶段 `PolicyInstance` 提供可持久化的内部事实来源。
- 让 `PolicyTemplateInstanceAuthorizationService` 可以通过 repository/reader 消费启用中的 instance。
- 保持 `Policy Template Registry` 由平台代码内置，不从数据库自由创建。
- 保持旧 `Policy.conditionAstJson` readonly governance 与新 template instance 存储边界清晰。

## 2. 不做什么

- 历史阶段当时未开放 gRPC / HTTP mutation contract；当前 `PolicyInstance` 管理契约以 [policy-instance-management.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/permission-service/policy-instance-management.md) 为准。
- 不做 tenant-web UI。
- 不开放自由 AST 编辑。
- 不迁移或删除现有 `Policy` AST 表。
- 不做 CRM/SRM/Procurement/MES/WMS 业务 rollout。
- 不让 permission-service 查询业务资源数据库。
- 不把 category/customer/supplier/factory/warehouse 等业务主数据真相写入 permission-service。

## 3. 存储模型

新增持久化模型建议命名为 `PolicyInstance`，与旧 `Policy` 分离：

```text
PolicyInstance:
  id
  tenantId
  subjectSelectorType: ACCOUNT | ROLE | TENANT_WIDE
  subjectSelectorValue?
  permissionCode
  resourceType?
  templateCode
  effect: ALLOW | DENY
  params: Json
  enabled
  priority
  createdBy
  updatedBy
  createdAt
  updatedAt
```

稳定规则：

- `permissionCode` 继续通过 permission code 外键引用 `Permission.code`。
- `templateCode` 必须在 repository 写入前由内置 registry 校验。
- `TENANT_WIDE` 不保存 `subjectSelectorValue`。
- `ACCOUNT` 的 `subjectSelectorValue` 表示 accountId。
- `ROLE` 的 `subjectSelectorValue` 表示 roleId。
- `params` 保存授权配置引用，不保存业务主数据真相。

## 4. 内部 Repository / Reader

第一阶段新增内部 repository：

```text
PolicyTemplateInstanceRepository:
  findById(id)
  findEnabledForEvaluation({ tenantId, permissionCode, resourceType })
  save(instance)
```

新增 evaluator reader adapter：

```text
PrismaPolicyTemplateInstanceReader implements PolicyInstanceReader
```

稳定规则：

- evaluator 只依赖 `PolicyInstanceReader`，不依赖 Prisma。
- repository 负责 storage mapping 与 template code fail-fast 校验。
- evaluator 仍对未知 template code fail closed，避免绕过 repository 的测试/迁移数据导致放行。

## 5. 验收标准

- Prisma schema 有独立 `PolicyInstance` 存储模型。
- repository 可保存并读取 template-based `PolicyInstance`。
- `findEnabledForEvaluation` 只返回同 tenant、同 permission、resourceType 匹配或为空、enabled 的 instance。
- 未知 `templateCode` 写入失败。
- `TENANT_WIDE / ACCOUNT / ROLE` selector 能正确映射到 contract shape。
- `PolicyTemplateInstanceAuthorizationService` 可以通过 repository-backed reader 消费启用 instance。
- 未改动旧 `Policy` AST readonly governance 语义。
