# Policy 管理

更新时间：2026-03-20 13:05:00 +08:00

## 目标

围绕 `Permission -> Policy` 收敛授权策略管理能力，并逐步把策略条件从简单平铺条件升级为受限 AST。

## 设计决策

- Policy 必须绑定明确的 `permissionCode`。
- `permissionCode` 必须对应真实存在的 Permission。
- Policy 主要表达业务授权条件，不承载全局入口风控。
- 当前模型下，Policy 不再作为其他领域对象的宿主对象，因此删除时不额外增加伪删除保护。
- Policy 审计事件后续统一纳入审计模块，不在本阶段重复设计。
- `4.5.8 / 4.5.9` 采用 `Permission -> Policy` 专用入口，不替代原有兼容创建入口。
- Policy 列表查询统一收敛到分页主入口 `ListPoliciesPaged`。
- Policy 评估规则：
  - `RBAC` 未通过时直接拒绝。
  - 若该 `permission` 没有启用中的 policy，则 `RBAC` 通过即可允许。
  - 若该 `permission` 存在启用中的 policy，则进入 policy 评估。
  - 命中任意 `DENY` => 拒绝。
  - 否则命中任意 `ALLOW` => 允许。
  - 否则 => 拒绝。
- 允许同一 `permission` 下同时存在 `ALLOW` 和 `DENY` policy，且 `DENY` 优先。
- `conditionAstJson` 是当前唯一正式持久化路径。
- `conditionAstJson` 是后端持久化与评估格式，不作为管理端第一阶段的直接编辑模型。
- 管理端第一阶段应使用受限规则表单或预置模板构建条件，再转换为 AST。

## Policy 功能清单

| 功能编号 | 功能项 | 允许调用服务 | 允许操作者 | 优先级 | 状态 | 最后检查时间 | 备注 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 4.5.1 | 查看 Policy 详情 | `gateway` | 系统管理员、租户管理员 | P0 | 已实现 | 2026-03-19 | 支持按 `id` 查询，不存在时返回 `POLICY_NOT_FOUND` |
| 4.5.2 | 查看 Policy 列表 | `gateway` | 系统管理员、租户管理员 | P0 | 已实现 | 2026-03-19 | 当前支持基础列表；分页与过滤已收敛到 `4.5.10` |
| 4.5.3 | 创建 Policy | `gateway` | 系统管理员、租户管理员 | P0 | 已实现 | 2026-03-19 | 创建时校验 `permissionCode` 存在 |
| 4.5.4 | 修改 Policy | `gateway` | 系统管理员、租户管理员 | P0 | 已实现 | 2026-03-19 | 更新 `permissionCode` 时会重新校验目标 Permission 存在 |
| 4.5.5 | 删除 Policy | `gateway` | 系统管理员、租户管理员 | P0 | 已实现 | 2026-03-19 | 当前仅校验存在性；审计后续统一实现 |
| 4.5.6 | 启用/停用 Policy | `gateway` | 系统管理员、租户管理员 | P0 | 已实现 | 2026-03-19 | 显式设置 `isEnabled`，不存在时返回 `POLICY_NOT_FOUND` |
| 4.5.7 | 查看某权限关联的 Policy | `gateway` | 系统管理员、租户管理员 | P0 | 已实现 | 2026-03-19 | 支持按 `permissionCode` 和可选 `tenantId` 查询 |
| 4.5.8 | 为权限添加 Policy | `gateway` | 系统管理员、租户管理员 | P0 | 已实现 | 2026-03-19 | 新增 `AddPermissionPolicy`，以 Permission 为主入口创建 Policy |
| 4.5.9 | 为权限移除 Policy | `gateway` | 系统管理员、租户管理员 | P0 | 已实现 | 2026-03-19 | 新增 `RemovePermissionPolicy`，移除时校验 Policy 与 Permission 的绑定关系 |
| 4.5.10 | Policy 列表分页与过滤 | `gateway` | 系统管理员、租户管理员 | P1 | 已实现 | 2026-03-19 | 统一主入口 `ListPoliciesPaged`；支持 `page/pageSize + tenantId + permissionCode + isEnabled + keyword` |

## Policy Condition 设计

### 目标

`4.5.11 / 4.5.12` 不再继续扩展“字段 vs 固定值”的简单 condition 表达，而是升级为受限 AST。

### 顶层节点

顶层只允许 4 种节点：

- `all`
- `any`
- `not`
- `comparison`

#### `all`

```json
{ "all": [ ...conditions ] }
```

含义：全部条件都成立。

#### `any`

```json
{ "any": [ ...conditions ] }
```

含义：任一条件成立。

#### `not`

```json
{ "not": { ...condition } }
```

含义：对单个条件结果取反。

#### `comparison`

```json
{
  "comparison": {
    "left": { "source": "resource", "key": "tenant_id" },
    "operator": "EQUALS",
    "right": { "type": "attribute", "source": "subject", "key": "tenant_id" }
  }
}
```

含义：一个原子比较条件。

### comparison 结构

- `left`
- `operator`
- `right`

#### left

```json
{ "source": "subject | resource | environment | action", "key": "..." }
```

#### operator

当前正式支持：

- `EQUALS`
- `NOT_EQUALS`
- `IN`
- `NOT_IN`
- `GREATER_THAN`
- `GREATER_THAN_OR_EQUAL`
- `LESS_THAN`
- `LESS_THAN_OR_EQUAL`
- `BETWEEN`
- `IS_NULL`
- `IS_NOT_NULL`

当前不支持：

- `REGEX`
- `CONTAINS`
- `STARTS_WITH`

#### right

支持两种类型：

1. `literal`

```json
{ "type": "literal", "value": "..." }
```

2. `attribute`

```json
{ "type": "attribute", "source": "subject", "key": "tenant_id" }
```

### 允许的 key 白名单

#### `subject`

- `account_id`
- `tenant_id`
- `role_codes`
- `department_id`
- `is_system_admin`

#### `resource`

- `resource_id`
- `resource_type`
- `tenant_id`
- `owner_id`
- `department_id`
- `created_by`

#### `environment`

- `current_datetime`
- `current_date`
- `current_time`
- `weekday`
- `client_ip`

#### `action`

- `name`

### 标准示例

#### 租户隔离

`resource.tenant_id == subject.tenant_id`

```json
{
  "comparison": {
    "left": { "source": "resource", "key": "tenant_id" },
    "operator": "EQUALS",
    "right": { "type": "attribute", "source": "subject", "key": "tenant_id" }
  }
}
```

#### 工作日办公时间且公司 IP 内允许

```json
{
  "all": [
    {
      "comparison": {
        "left": { "source": "environment", "key": "weekday" },
        "operator": "IN",
        "right": {
          "type": "literal",
          "value": ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"]
        }
      }
    },
    {
      "any": [
        {
          "comparison": {
            "left": { "source": "environment", "key": "current_time" },
            "operator": "BETWEEN",
            "right": { "type": "literal", "value": ["08:00", "11:30"] }
          }
        },
        {
          "comparison": {
            "left": { "source": "environment", "key": "current_time" },
            "operator": "BETWEEN",
            "right": { "type": "literal", "value": ["13:00", "17:30"] }
          }
        }
      ]
    },
    {
      "comparison": {
        "left": { "source": "environment", "key": "client_ip" },
        "operator": "IN",
        "right": {
          "type": "literal",
          "value": ["10.10.0.0/16", "192.168.1.0/24"]
        }
      }
    }
  ]
}
```

## Policy Condition 功能清单

| 功能编号 | 功能项 | 允许调用服务 | 允许操作者 | 优先级 | 状态 | 最后检查时间 | 备注 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 4.5.11 | Policy Condition AST 第一阶段落地 | `gateway` | 系统管理员、租户管理员 | P1 | 已实现 | 2026-03-20 | `CreatePolicy / UpdatePolicy / AddPermissionPolicy / GetPolicyById / ListPoliciesPaged / CheckPermissionWithContext` 已接入 AST |
| 4.5.12 | Policy Condition AST 静态校验 | `gateway` | 系统管理员、租户管理员 | P2 | 已实现 | 2026-03-20 | 已接入保存前静态校验；覆盖 AST 深度/节点数限制、空 `all/any` 节点、key 白名单、operator 白名单、literal/attribute 类型匹配，以及 `BETWEEN/IN/NOT_IN/IS_NULL/IS_NOT_NULL` 规则校验 |

## Policy 引擎功能清单

| 功能编号 | 功能项 | 优先级 | 状态 | 最后检查时间 | 关联接口 | 备注 |
| --- | --- | --- | --- | --- | --- | --- |
| 4.5.13 | Policy AST 存储模型收敛 | P1 | 已实现 | 2026-03-20 | `CreatePolicy` / `UpdatePolicy` / `AddPermissionPolicy` / `GetPolicyById` / `ListPoliciesPaged` | 当前 AST 通过 `Policy.conditionAstJson` 持久化 |
| 4.5.14 | Policy AST 结构校验器 | P1 | 已实现 | 2026-03-20 | `CreatePolicy` / `UpdatePolicy` / `AddPermissionPolicy` | 已覆盖 JSON 解析、AST 根节点/子节点结构、空 `all/any` 节点、最大深度、最大节点数 |
| 4.5.15 | Policy AST key/operator 类型校验器 | P2 | 已实现 | 2026-03-20 | `CreatePolicy` / `UpdatePolicy` / `AddPermissionPolicy` | 已覆盖 key 白名单、operator 白名单、literal/attribute 类型匹配，以及 `BETWEEN/IN/NOT_IN` 等操作符规则校验 |
| 4.5.16 | Policy AST 评估器 | P1 | 已实现 | 2026-03-20 | `CheckPermission` / `CheckPermissionWithContext` | 已支持 `literal / attribute`、`all / any / not / comparison`、时间窗口以及 IPv4 / IPv6 CIDR；Explain 单列为 `4.5.18` |
| 4.5.17 | Policy 决策整合层 | P1 | 已实现 | 2026-03-20 | `CheckPermission` / `CheckPermissionWithContext` | `CheckPermission` 保持 `RBAC-only` 供 gateway guard 使用；`CheckPermissionWithContext` 采用 `RBAC -> Policy` 决策链，无 policy 时按 RBAC，存在 policy 时采用 `DENY > ALLOW > default deny` |
| 4.5.18 | Policy Explain 能力 | P2 | 未开始 |  | `CheckPermission` / `CheckPermissionWithContext` | 计划返回命中 policy、命中 AST 分支和拒绝原因 |
