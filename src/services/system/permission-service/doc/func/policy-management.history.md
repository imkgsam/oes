# Policy 管理历史

## 2026-03-18 17:40:01 +08:00

### 本次目标

将 Policy 管理从总索引中拆出，形成独立功能文档与历史文档。

### 主要改动

- 新建 [policy-management.md](/D:/user/vic/code/code_base/on/oes/src/services/system/permission-service/doc/func/policy-management.md)
- 提取 Policy 设计决策与功能清单

## 2026-03-19 15:28:00 +08:00

### 本次目标

连续完成 `4.5.1 - 4.5.9` 的审核与实现，收敛 Policy 管理的 `P0` 基础能力。

### 主要改动

- 完成 `4.5.1 - 4.5.5`
- 完成 `4.5.6 - 4.5.9`
- 将 `Permission -> Policy` 入口正式落地
- 将 `4.5.10` 保留为后续分页与过滤增强项

## 2026-03-19 18:05:00 +08:00

### 本次目标

实现 `4.5.10 Policy 列表分页与过滤`，并将 Policy 列表查询收敛为统一主入口。

### 主要改动

- 新增 `ListPoliciesPaged` RPC
- 新增 `ListPoliciesPagedQuery / Handler`
- 在 `PolicyRepository` 中新增 `findPaged(...)`
- 在 Prisma Policy 仓储中实现：
  - `page/pageSize`
  - `tenantId`
  - `permissionCode`
  - `isEnabled`
  - `keyword`
  - 固定 `createdAt desc` 排序
- 在 gRPC controller 中新增 `listPoliciesPaged(...)`
- 旧 `listPolicies(...)` 保留为兼容路径，并标注 `OUTDATED`
- 重写 `policy-management.md` 与历史文档，清理编码噪声

### 备注

- `keyword` 当前仅匹配 `name / description`
- 本次统一的是主入口，未删除旧查询接口
