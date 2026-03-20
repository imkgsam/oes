# Policy 管理历史

## 2026-03-20 14:25:00 +08:00

### 本次目标

继续收敛 4.5.17 Policy 决策整合层，明确 CheckPermission 与 CheckPermissionWithContext 的职责边界。

### 主要改动

- 修正 PolicyEngine 的默认决策：
  - 无 policy 时按 RBAC 放行
  - 有 policy 时采用 DENY > ALLOW > default deny
- CheckPermission 保持 RBAC-only，继续供 gateway guard 使用
- CheckPermissionWithContext 保持 RBAC + ABAC，用于资源级授权判断
- 同步更新 4.5.17 状态为已实现

### 备注

- 本次不新增 Explain 输出
- tenantId 仅对 CheckPermissionWithContext 的租户级 policy 评估生效

## 2026-03-20 14:05:00 +08:00

### 本次目标

继续收敛 4.5.16 Policy AST 评估器，补齐 client_ip 的 IPv6 / IPv6 CIDR 评估支持。

### 主要改动

- 在 policy-condition-ast.ts 中新增 IPv6 地址解析与 IPv6 CIDR 匹配逻辑
- client_ip 条件现在统一支持：
  - IPv4
  - IPv4 CIDR
  - IPv6
  - IPv6 CIDR
- 同步更新 4.5.16 状态为已实现

### 备注

- 本次不触碰 4.5.17 Policy 决策整合层
- Explain 仍保留在 4.5.18
## 2026-03-20 13:05:00 +08:00

### 本次目标

重写 `policy-management.md` 与 `policy-management.history.md`，修复编码污染，并把 `4.5` 当前真实状态收敛为干净文档。

### 主要改动

- 重写主文档与历史文档，统一为 UTF-8 内容
- 收敛 `4.5.1 - 4.5.10` 当前状态
- 收敛 `4.5.11 / 4.5.12` 的 AST 条件设计与状态
- 收敛 `4.5.13 - 4.5.18` 的 Policy 引擎分片状态

### 备注

- 本次不改业务代码
- 重点是修复文档编码和状态失真问题

## 2026-03-20 12:31:11 +08:00

### 本次目标

实现 `4.5.12 Policy Condition AST 静态校验`，把 AST 保存前校验从“最小可解析”收敛为“结构 + 白名单 + 类型 + 复杂度”完整校验。

### 主要改动

- 在 `policy-condition-ast.ts` 中新增静态校验器与专用校验错误类型
- AST 保存前现在会校验：
  - 最大深度
  - 最大节点数
  - 空 `all/any` 节点
  - key 白名单
  - operator 白名单
  - `literal / attribute` 类型匹配
  - `BETWEEN / IN / NOT_IN / IS_NULL / IS_NOT_NULL` 语义约束
- `normalizePolicyConditionAstJson` 现在会把校验错误细节统一翻译为 `POLICY_CONDITION_INVALID`
- 同步更新：
  - `4.5.12`
  - `4.5.14`
  - `4.5.15`
  的状态与最后检查时间

### 备注

- 本次只实现保存前静态校验，不涉及 Explain
- 运行时评估器保持现有行为，未额外扩展 operator 集合

## 2026-03-20 12:20:00 +08:00

### 本次目标

彻底删除 legacy `PolicyCondition` 兼容路径，只保留 AST 方案。

### 主要改动

- 删除 `PolicyConditionVO`
- 删除 command 中的 `PolicyConditionInput / conditions`
- 删除 controller 中 legacy `conditions` 输入输出映射
- 删除 proto 中 `PolicyConditionInput / PolicyConditionResponse / conditions` 相关字段和枚举
- 删除 `Policy` 聚合中的 legacy flat condition 状态与操作 API
- 删除 mapper 和引擎中的 legacy `conditions` 兼容读取路径
- 删除未再使用的 `AttributeSource` enum

### 备注

- 本次是正式清理，不再保留 legacy condition 兼容层
- `Policy` 现在只通过 `conditionAstJson` 表达条件

## 2026-03-20 11:10:00 +08:00

### 本次目标

实现 `4.5.11 Policy Condition AST 第一阶段落地`，并补齐 AST 存储与运行时评估的最小闭环。

### 主要改动

- `Policy` 模型新增 `conditionAstJson`
- `CreatePolicy / UpdatePolicy / AddPermissionPolicy` 支持接收 `conditionAstJson`
- `GetPolicyById / ListPoliciesPaged` 回显 `conditionAstJson`
- 新增 AST 解析与评估逻辑，支持：
  - `all / any / not / comparison`
  - `literal / attribute`
  - 时间窗口比较
  - IPv4 CIDR 匹配
  - 租户隔离 / 数据归属 / 动作条件
- `CheckPermissionWithContext` 评估链路改为 AST 优先

### 备注

- 当时仅做了最小解析与结构判断，完整保存前静态校验在 `4.5.12` 落地

## 2026-03-20 11:40:00 +08:00

### 本次目标

收敛 Policy command 中重复的 AST 归一化逻辑，避免三处实现漂移。

### 主要改动

- 新增共享 helper：`normalizePolicyConditionAstJson`
- `CreatePolicyHandler`、`UpdatePolicyHandler`、`AddPermissionPolicyHandler` 统一复用该 helper
- 删除各 handler 内重复的本地 `normalizeConditionAstJson` 实现

### 备注

- 本次只做代码整理，不改变行为

## 2026-03-20 11:50:00 +08:00

### 本次目标

收敛 Prisma Policy 仓储到当前 schema 真实状态，移除对已停用 `PolicyCondition` 持久化模型的依赖。

### 主要改动

- `PrismaPolicyRepository` 不再 `include conditions`
- `PrismaPolicyRepository.save` 不再读写 `policyCondition`
- 明确 `conditionAstJson` 是当前唯一正式持久化路径

### 备注

- 本次修改与当前 schema 注释保持一致

## 2026-03-19 18:05:00 +08:00

### 本次目标

实现 `4.5.10 Policy 列表分页与过滤`，并将 Policy 列表查询收敛为统一主入口。

### 主要改动

- 新增 `ListPoliciesPaged` RPC
- 新增 `ListPoliciesPagedQuery / Handler`
- 新增仓储分页查询能力：
  - `page/pageSize`
  - `tenantId`
  - `permissionCode`
  - `isEnabled`
  - `keyword`
- 新增 gRPC `listPoliciesPaged(...)`

### 备注

- `keyword` 当前匹配 `name / description`
- 旧 `ListPolicies` 后续已在兼容清理中删除

## 2026-03-19 15:28:00 +08:00

### 本次目标

连续完成 `4.5.1 - 4.5.9` 的审核与实现，收敛 Policy 管理的 `P0` 基础能力。

### 主要改动

- 完成 `4.5.1 - 4.5.5`
- 完成 `4.5.6 - 4.5.9`
- 正式落地 `Permission -> Policy` 入口能力

### 备注

- `4.5.10` 保留为后续分页与过滤增强项






