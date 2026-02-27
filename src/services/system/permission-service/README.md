# Permission Service — RBAC + ABAC 混合权限服务

## 目录

- [1. 服务概述](#1-服务概述)
- [2. 架构设计](#2-架构设计)
  - [2.1 DDD 分层架构](#21-ddd-分层架构)
  - [2.2 CQRS 模式](#22-cqrs-模式)
  - [2.3 权限模型：RBAC + ABAC](#23-权限模型rbac--abac)
- [3. 数据模型](#3-数据模型)
  - [3.1 Prisma Schema](#31-prisma-schema)
  - [3.2 ER 关系图](#32-er-关系图)
- [4. 权限控制逻辑](#4-权限控制逻辑)
  - [4.1 完整鉴权流程](#41-完整鉴权流程)
  - [4.2 策略评估引擎](#42-策略评估引擎)
  - [4.3 具体场景演示](#43-具体场景演示)
- [5. 目录结构](#5-目录结构)
- [6. 领域层设计](#6-领域层设计)
  - [6.1 聚合根](#61-聚合根)
  - [6.2 值对象](#62-值对象)
  - [6.3 领域服务](#63-领域服务)
  - [6.4 Repository 接口](#64-repository-接口)
- [7. 应用层设计](#7-应用层设计)
  - [7.1 Commands](#71-commands)
  - [7.2 Queries](#72-queries)
- [8. 基础设施层设计](#8-基础设施层设计)
- [9. 接口层设计（gRPC）](#9-接口层设计grpc)
  - [9.1 Proto 定义](#91-proto-定义)
  - [9.2 gRPC Controllers](#92-grpc-controllers)
  - [9.3 TCP 到 gRPC 迁移](#93-tcp-到-grpc-迁移)
- [10. Common 模块复用](#10-common-模块复用)
- [11. 异常处理](#11-异常处理)
- [12. 测试策略](#12-测试策略)
- [13. 部署方案](#13-部署方案)
- [14. 可观测性](#14-可观测性)
- [15. 实施路线图](#15-实施路线图)
- [16. 已知问题与修复清单](#16-已知问题与修复清单)

---

## 1. 服务概述

Permission Service 是 OES 平台的核心系统服务，负责统一的权限管理与鉴权决策。采用 **RBAC（基于角色的访问控制）+ ABAC（基于属性的访问控制）** 混合模型，提供从粗粒度到细粒度的完整权限控制能力。

**核心职责**：

- 角色（Role）与权限（Permission）的 CRUD 管理
- 账户-角色绑定（AccountRole）管理
- ABAC 策略（Policy）的 CRUD 管理
- 鉴权决策：纯 RBAC 检查 + RBAC+ABAC 混合检查
- 对外通过 gRPC 提供鉴权接口，供 API Gateway 和业务服务调用

**技术栈**：

| 组件     | 技术选型                                                        |
| -------- | --------------------------------------------------------------- |
| 框架     | NestJS 11                                                       |
| 架构模式 | DDD 分层 + CQRS                                                 |
| 通信协议 | gRPC（全量迁移，废弃 TCP）                                      |
| ORM      | Prisma                                                          |
| 数据库   | PostgreSQL                                                      |
| 日志     | `@oes/common` AppLogger（Pino + OpenTelemetry）                 |
| 链路追踪 | OpenTelemetry SDK                                               |
| 服务注册 | Nacos                                                           |
| 异常体系 | `@oes/common` 三类异常（Domain / Application / Infrastructure） |

---

## 2. 架构设计

### 2.1 DDD 分层架构

```mermaid
graph TB
    subgraph "Interface Layer 接口层"
        GRPC_AUTH[PermissionCheck gRPC Controller<br/>鉴权接口]
        GRPC_MGMT[PermissionManagement gRPC Controller<br/>管理接口]
        GRPC_POLICY[PolicyManagement gRPC Controller<br/>策略管理接口]
    end

    subgraph "Application Layer 应用层"
        CMD[Command Handlers<br/>写操作]
        QRY[Query Handlers<br/>读操作]
        VBUS[ValidatingCommandBus / ValidatingQueryBus<br/>from @oes/common]
    end

    subgraph "Domain Layer 领域层"
        AGG_ROLE[Role Aggregate]
        AGG_PERM[Permission Aggregate]
        AGG_POLICY[Policy Aggregate]
        VO[Value Objects<br/>RolePermission / AccountRole / PolicyCondition]
        DS[Domain Services<br/>AccountAuthorizationService / PolicyEngine]
        REPO_IF[Repository Interfaces]
    end

    subgraph "Infrastructure Layer 基础设施层"
        PRISMA[PrismaService]
        REPO_IMPL[Prisma Repository Implementations]
        MAPPER[Mappers]
        CONFIG[Configs]
    end

    GRPC_AUTH --> VBUS
    GRPC_MGMT --> VBUS
    GRPC_POLICY --> VBUS
    VBUS --> CMD
    VBUS --> QRY
    CMD --> DS
    QRY --> DS
    DS --> AGG_ROLE
    DS --> AGG_PERM
    DS --> AGG_POLICY
    DS --> REPO_IF
    REPO_IF -.->|implemented by| REPO_IMPL
    REPO_IMPL --> PRISMA
    REPO_IMPL --> MAPPER
```

**依赖规则**：外层依赖内层，内层不依赖外层。Domain 层不依赖任何框架或基础设施。

### 2.2 CQRS 模式

复用 `@oes/common` 的 `ValidatingCommandBus` 和 `ValidatingQueryBus`，自动对 Command/Query 对象执行 `class-validator` 校验。

```
写操作: gRPC Controller → ValidatingCommandBus → CommandHandler → Domain Service → Repository
读操作: gRPC Controller → ValidatingQueryBus  → QueryHandler  → Repository（可直接查询）
```

### 2.3 权限模型：RBAC + ABAC

```
RBAC 回答："你能做什么"（粗粒度）
ABAC 回答："在什么条件下你能对什么资源做"（细粒度）
```

| 层级   | 机制                 | 作用                                          |
| ------ | -------------------- | --------------------------------------------- |
| 第一层 | RBAC                 | 角色 → 权限映射，决定用户是否拥有某个操作权限 |
| 第二层 | ABAC Policy（DENY）  | 限制条件：非工作时间禁止、大额操作限制等      |
| 第三层 | ABAC Policy（ALLOW） | 资源白名单：可操作哪些仓库、哪些客户等        |

---

## 3. 数据模型

### 3.1 Prisma Schema

```prisma
// ============================================================
// RBAC 核心模型
// ============================================================

model Role {
  id          String   @id @default(uuid())
  tenantId    String?  // null = 全平台可用
  code        String
  name        String
  description String?
  isSystem    Boolean  @default(false)
  isEnabled   Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  createdBy   String

  permissions RolePermission[]
  accounts    AccountRole[]

  @@unique([tenantId, code])
}

model Permission {
  id          String           @id @default(uuid())
  code        String           @unique  // 如 "outbound:read", "order:approve"
  description String?
  module      Modules
  roles       RolePermission[]
}

model RolePermission {
  id           String     @id @default(uuid())
  roleId       String
  permissionId String
  role         Role       @relation(fields: [roleId], references: [id])
  permission   Permission @relation(fields: [permissionId], references: [id])
  createdBy    String

  @@unique([roleId, permissionId])
}

model AccountRole {
  id          String      @id @default(uuid())
  accountType AccountType
  accountId   String      // 指向 identity-service 的 userAccount.id 或 serviceAccount.id
  roleId      String
  tenantId    String
  role        Role        @relation(fields: [roleId], references: [id])
  createdBy   String

  @@unique([accountId, roleId])
  @@index([accountId, tenantId])
}

// ============================================================
// ABAC 策略模型
// ============================================================

model Policy {
  id             String           @id @default(uuid())
  name           String
  description    String?
  tenantId       String?          // null = 全局策略
  effect         PolicyEffect     // ALLOW / DENY
  subjectType    PolicySubjectType @default(ANY)
  subjectId      String?          // ROLE 时为 roleCode，ACCOUNT 时为 accountId
  permissionCode String?          // null = 适用所有权限
  resourceType   String?          // null = 适用所有资源类型
  priority       Int              @default(0)
  isEnabled      Boolean          @default(true)
  conditions     PolicyCondition[]
  createdAt      DateTime         @default(now())
  updatedAt      DateTime         @updatedAt
  createdBy      String

  @@index([tenantId, isEnabled])
  @@index([permissionCode])
  @@index([subjectType, subjectId])
}

model PolicyCondition {
  id              String            @id @default(uuid())
  policyId        String
  policy          Policy            @relation(fields: [policyId], references: [id], onDelete: Cascade)
  attributeSource AttributeSource   // SUBJECT / RESOURCE / ENVIRONMENT / ACTION
  attributeKey    String            // 如 "department", "amount", "hour"
  operator        ConditionOperator // EQUALS, IN, GREATER_THAN 等
  value           String            // JSON 编码，支持 $subject.xxx 动态引用

  @@index([policyId])
}

// ============================================================
// 枚举
// ============================================================

enum PolicyEffect {
  ALLOW
  DENY
}

enum PolicySubjectType {
  ROLE
  ACCOUNT
  ANY
}

enum AttributeSource {
  SUBJECT
  RESOURCE
  ENVIRONMENT
  ACTION
}

enum ConditionOperator {
  EQUALS
  NOT_EQUALS
  IN
  NOT_IN
  GREATER_THAN
  GREATER_THAN_OR_EQUAL
  LESS_THAN
  LESS_THAN_OR_EQUAL
  BETWEEN
  CONTAINS
  STARTS_WITH
  REGEX
  IS_NULL
  IS_NOT_NULL
}

enum AccountType {
  USER
  SERVICE
}

enum Modules {
  ENTITY_SERVICE
  IDENTITY_SERVICE
  PERMISSION_SERVICE
  AUTH_SERVICE
  EPR_SERVICE
  MES_SERVICE
  WMS_SERVICE
}
```

> **注意**：原 schema 中的 `AccountScope` 模型已删除，其功能由 `Policy`（ALLOW 类型）完全替代。

### 3.2 ER 关系图

```mermaid
erDiagram
    Role ||--o{ RolePermission : has
    Permission ||--o{ RolePermission : assigned_to
    Role ||--o{ AccountRole : assigned_to
    Policy ||--o{ PolicyCondition : has

    Role {
        string id PK
        string tenantId
        string code
        string name
        boolean isSystem
        boolean isEnabled
    }
    Permission {
        string id PK
        string code UK
        Modules module
    }
    RolePermission {
        string id PK
        string roleId FK
        string permissionId FK
    }
    AccountRole {
        string id PK
        AccountType accountType
        string accountId
        string roleId FK
        string tenantId
    }
    Policy {
        string id PK
        string name
        PolicyEffect effect
        PolicySubjectType subjectType
        string subjectId
        string permissionCode
        string resourceType
        int priority
        boolean isEnabled
    }
    PolicyCondition {
        string id PK
        string policyId FK
        AttributeSource attributeSource
        string attributeKey
        ConditionOperator operator
        string value
    }
```

---

## 4. 权限控制逻辑

### 4.1 完整鉴权流程

```mermaid
flowchart TD
    REQ[请求到达] --> JWT{JWT 验证<br/>GatewayJwtAuthGuard}
    JWT -->|失败| REJECT[❌ 拒绝]
    JWT -->|成功| RBAC

    subgraph RBAC_LAYER["第一层：RBAC"]
        RBAC[查询 AccountRole → Role → RolePermission]
        RBAC_CHECK{用户的角色<br/>是否拥有该权限?}
        RBAC --> RBAC_CHECK
    end

    RBAC_CHECK -->|否| REJECT
    RBAC_CHECK -->|是| ABAC_NEEDED{请求是否需要<br/>ABAC 检查?}

    ABAC_NEEDED -->|否| ALLOW[✅ 允许]

    ABAC_NEEDED -->|是| LOAD[加载适用策略]

    LOAD --> HAS_POLICY{有适用策略?}
    HAS_POLICY -->|无| ALLOW

    HAS_POLICY -->|有| SPLIT[按 effect 分组]

    SPLIT --> DENY_EVAL[评估所有 DENY 策略<br/>按 priority 降序]
    DENY_EVAL --> DENY_HIT{任何 DENY 匹配?}
    DENY_HIT -->|是| REJECT_POLICY["❌ 拒绝<br/>返回触发的策略名"]

    DENY_HIT -->|否| HAS_ALLOW{存在 ALLOW 策略?}
    HAS_ALLOW -->|否| ALLOW
    HAS_ALLOW -->|是| ALLOW_EVAL[评估所有 ALLOW 策略]
    ALLOW_EVAL --> ALLOW_HIT{至少一条 ALLOW 匹配?}
    ALLOW_HIT -->|是| ALLOW
    ALLOW_HIT -->|否| REJECT_NO_ALLOW["❌ 拒绝<br/>无匹配的 ALLOW 策略"]

    style REJECT fill:#ff6b6b
    style REJECT_POLICY fill:#ff6b6b
    style REJECT_NO_ALLOW fill:#ff6b6b
    style ALLOW fill:#51cf66
```

**三条核心规则**：

1. **无策略 = 放行**（RBAC 已经是门槛）
2. **DENY 优先**（安全兜底，任何 DENY 匹配即拒绝）
3. **有 ALLOW 则必须匹配**（白名单生效）

### 4.2 策略评估引擎

#### 策略匹配规则

一条策略是否"适用于"当前请求，由以下字段决定：

| 字段             | 匹配规则                                                 |
| ---------------- | -------------------------------------------------------- |
| `tenantId`       | null = 全局策略，适用所有租户；非 null 则精确匹配        |
| `permissionCode` | null = 适用所有权限；非 null 则精确匹配                  |
| `resourceType`   | null = 适用所有资源类型；非 null 则精确匹配              |
| `subjectType`    | ANY = 所有人；ROLE = 匹配角色代码；ACCOUNT = 匹配账户 ID |

#### 条件评估规则

- 一条策略内的多个 `PolicyCondition` 为 **AND** 关系（所有条件都满足才算匹配）
- 条件值支持 `$subject.xxx`、`$resource.xxx`、`$environment.xxx` 动态引用

#### 条件操作符

| 操作符         | 说明       | 值格式示例                      |
| -------------- | ---------- | ------------------------------- |
| `EQUALS`       | 等于       | `"warehouse_director"`          |
| `NOT_EQUALS`   | 不等于     | `"warehouse_director"`          |
| `IN`           | 在集合中   | `["wh-shanghai", "wh-beijing"]` |
| `NOT_IN`       | 不在集合中 | `[9,10,11,12,13,14,15,16,17]`   |
| `GREATER_THAN` | 大于       | `100000`                        |
| `LESS_THAN`    | 小于       | `100000`                        |
| `BETWEEN`      | 区间       | `[9, 17]`                       |
| `CONTAINS`     | 包含子串   | `"admin"`                       |
| `STARTS_WITH`  | 前缀匹配   | `"wh-"`                         |
| `REGEX`        | 正则匹配   | `"^wh-.*"`                      |
| `IS_NULL`      | 为空       | 无需值                          |
| `IS_NOT_NULL`  | 不为空     | 无需值                          |

#### 动态引用（`$subject.xxx`）

条件值以 `$` 开头时，引擎从评估上下文中动态解析：

```
条件: resource.warehouseId IN $subject.assignedWarehouses
```

评估时：

1. 从 `ctx.resource` 取 `warehouseId` → `"wh-shanghai"`
2. 从 `ctx.subject` 取 `assignedWarehouses` → `["wh-shanghai", "wh-guangzhou"]`
3. 执行 IN：`"wh-shanghai"` 在列表中 → 条件满足

### 4.3 具体场景演示

#### 场景设定

| 用户 | 角色               | 分配的仓库 |
| ---- | ------------------ | ---------- |
| 张三 | warehouse_manager  | 上海仓库   |
| 李四 | warehouse_director | 所有仓库   |

#### 策略配置

| 策略           | 效果  | 优先级 | 适用主体             | 条件                                                                |
| -------------- | ----- | ------ | -------------------- | ------------------------------------------------------------------- |
| 工作时间限制   | DENY  | 100    | ANY                  | environment.hour NOT_IN [9..17]                                     |
| 大额审批限制   | DENY  | 90     | ANY                  | resource.amount > 100000 AND subject.roleCode != warehouse_director |
| 张三仓库范围   | ALLOW | 80     | ACCOUNT:zhang-san-id | resource.warehouseId IN ["wh-shanghai"]                             |
| 李四全仓库权限 | ALLOW | 80     | ACCOUNT:li-si-id     | 无条件（无 PolicyCondition）                                        |

#### 场景1：张三审批 15 万上海仓库出库单（下午 2 点）

```
RBAC: warehouse_manager 有 outbound:approve → ✅
DENY 评估:
  策略1(工作时间): hour=14 在 9-17 内 → 不触发 ✅
  策略2(大额审批): amount=150000>100000 ✅, roleCode≠director ✅ → 触发 DENY ❌
结果: 拒绝，原因"大额审批限制"
```

#### 场景2：张三审批 5000 元上海仓库出库单（下午 2 点）

```
RBAC: ✅
DENY 评估:
  策略1: 不触发 ✅
  策略2: amount=5000, 不满足 >100000 → 不触发 ✅
ALLOW 评估:
  策略3(张三仓库范围): warehouseId="wh-shanghai" IN ["wh-shanghai"] → 匹配 ✅
结果: 允许
```

#### 场景3：张三审批 5000 元北京仓库出库单

```
RBAC: ✅
DENY 评估: 都不触发 ✅
ALLOW 评估:
  策略3: warehouseId="wh-beijing" IN ["wh-shanghai"] → 不匹配
  存在 ALLOW 策略但无一匹配 → ❌
结果: 拒绝，原因"无匹配的 ALLOW 策略"
```

#### 场景4：李四审批 15 万北京仓库出库单（下午 2 点）

```
RBAC: warehouse_director 有 outbound:approve → ✅
DENY 评估:
  策略1: 不触发 ✅
  策略2: amount>100000 ✅, 但 roleCode=warehouse_director → NOT_EQUALS 不满足 → 不触发 ✅
ALLOW 评估:
  策略4(李四全仓库): 无条件 → 直接匹配 ✅
结果: 允许
```

---

## 5. 目录结构

```
src/services/system/permission-service/
├── prisma/
│   ├── schema.prisma                    # 数据模型定义
│   ├── migrations/                      # 数据库迁移文件
│   └── generated/prisma/               # Prisma Client 生成代码
├── src/
│   ├── main.ts                          # 服务启动入口
│   ├── app.module.ts                    # 根模块
│   │
│   ├── common/                          # 服务内公共代码
│   │   └── constants/
│   │       ├── exception-enums/
│   │       │   └── permission-service.errors.ts  # 错误码定义
│   │       └── symbols/
│   │           └── repo.symbols.ts      # DI Symbol 定义
│   │
│   ├── domain/                          # 领域层（纯业务逻辑，无框架依赖）
│   │   ├── aggregates/
│   │   │   ├── role.aggregate.ts
│   │   │   ├── permission.aggregate.ts
│   │   │   └── policy.aggregate.ts      # 新增
│   │   ├── vo/
│   │   │   ├── role-permission.value-object.ts
│   │   │   ├── account-role.value-object.ts
│   │   │   └── policy-condition.value-object.ts  # 新增
│   │   ├── enums/
│   │   │   ├── account-type.enum.ts
│   │   │   ├── permission-module.enum.ts
│   │   │   ├── policy-effect.enum.ts             # 新增
│   │   │   ├── policy-subject-type.enum.ts       # 新增
│   │   │   ├── condition-operator.enum.ts        # 新增
│   │   │   └── attribute-source.enum.ts          # 新增
│   │   ├── repositories/               # Repository 接口（Port）
│   │   │   ├── role.repository.ts
│   │   │   ├── permission.repository.ts
│   │   │   └── policy.repository.ts     # 新增
│   │   └── services/                   # 领域服务
│   │       ├── account-authorization.service.ts  # 重写
│   │       └── policy-engine.ts         # 新增：策略评估引擎
│   │
│   ├── application/                     # 应用层（用例编排）
│   │   ├── commands/
│   │   │   ├── permission/
│   │   │   │   ├── create-permission.command.ts
│   │   │   │   ├── create-permission.handler.ts
│   │   │   │   ├── delete-permission.command.ts
│   │   │   │   ├── delete-permission.handler.ts
│   │   │   │   └── index.ts
│   │   │   ├── role/
│   │   │   │   ├── create-role.command.ts
│   │   │   │   ├── create-role.handler.ts
│   │   │   │   ├── assign-role-permission.command.ts    # 新增
│   │   │   │   ├── assign-role-permission.handler.ts    # 新增
│   │   │   │   ├── assign-account-role.command.ts       # 新增
│   │   │   │   ├── assign-account-role.handler.ts       # 新增
│   │   │   │   ├── revoke-account-role.command.ts       # 新增
│   │   │   │   ├── revoke-account-role.handler.ts       # 新增
│   │   │   │   ├── delete-role.command.ts
│   │   │   │   ├── delete-role.handler.ts
│   │   │   │   └── index.ts
│   │   │   └── policy/                  # 新增
│   │   │       ├── create-policy.command.ts
│   │   │       ├── create-policy.handler.ts
│   │   │       ├── update-policy.command.ts
│   │   │       ├── update-policy.handler.ts
│   │   │       ├── delete-policy.command.ts
│   │   │       ├── delete-policy.handler.ts
│   │   │       ├── toggle-policy.command.ts
│   │   │       ├── toggle-policy.handler.ts
│   │   │       └── index.ts
│   │   ├── queries/
│   │   │   ├── authorization/
│   │   │   │   ├── check-permission.query.ts            # 重命名
│   │   │   │   ├── check-permission.handler.ts          # 重命名
│   │   │   │   ├── check-permission-with-context.query.ts   # 新增
│   │   │   │   ├── check-permission-with-context.handler.ts # 新增
│   │   │   │   └── index.ts
│   │   │   ├── permission/
│   │   │   │   └── ...（保持现有）
│   │   │   ├── role/
│   │   │   │   ├── ...（保持现有）
│   │   │   │   ├── list-account-roles.query.ts          # 新增
│   │   │   │   ├── list-account-roles.handler.ts        # 新增
│   │   │   │   └── index.ts
│   │   │   └── policy/                  # 新增
│   │   │       ├── get-policy-by-id.query.ts
│   │   │       ├── get-policy-by-id.handler.ts
│   │   │       ├── list-policies.query.ts
│   │   │       ├── list-policies.handler.ts
│   │   │       └── index.ts
│   │   └── index.ts
│   │
│   ├── infrastructure/                  # 基础设施层
│   │   ├── prisma/
│   │   │   ├── prisma.module.ts
│   │   │   └── prisma.service.ts
│   │   ├── repositories/prisma/
│   │   │   ├── prisma.permission.repository.ts
│   │   │   ├── prisma.role.repository.ts
│   │   │   └── prisma.policy.repository.ts  # 新增
│   │   ├── mappers/
│   │   │   ├── permission.mapper.ts
│   │   │   ├── role.mapper.ts               # 需完善
│   │   │   └── policy.mapper.ts             # 新增
│   │   └── configs/
│   │
│   ├── interfaces/                      # 接口层
│   │   └── grpc/
│   │       ├── permission-check.grpc.controller.ts      # 鉴权接口
│   │       ├── permission-management.grpc.controller.ts  # 新增：权限/角色管理
│   │       └── policy-management.grpc.controller.ts      # 新增：策略管理
│   │
│   └── modules/                         # NestJS 模块组织
│       ├── permission/
│       │   └── permission.module.ts
│       ├── role/
│       │   └── role.module.ts
│       └── policy/                      # 新增
│           └── policy.module.ts
│
├── test/
│   ├── unit/
│   │   ├── domain/
│   │   │   ├── policy-engine.spec.ts
│   │   │   ├── policy-condition.spec.ts
│   │   │   └── role.aggregate.spec.ts
│   │   └── application/
│   │       ├── check-permission.handler.spec.ts
│   │       └── check-permission-with-context.handler.spec.ts
│   ├── integration/
│   │   ├── prisma.policy.repository.spec.ts
│   │   └── prisma.role.repository.spec.ts
│   └── e2e/
│       └── permission-check.e2e.spec.ts
│
├── package.json
├── tsconfig.json
└── README.md
```

---

## 6. 领域层设计

### 6.1 聚合根

#### Role Aggregate

```typescript
// src/domain/aggregates/role.aggregate.ts
export class Role {
  constructor(
    public readonly id: string,
    public name: string,
    public code: string,
    public tenantId: string | null,
    public isSystem: boolean,
    public isEnabled: boolean,
    public description?: string,
    private _permissions: RolePermission[] = []
  ) {}

  get permissions(): ReadonlyArray<RolePermission> {
    return [...this._permissions]
  }

  addPermission(permission: RolePermission): void {
    if (this.hasPermissionById(permission.permissionId)) return
    this._permissions.push(permission)
  }

  removePermissionById(permissionId: string): void {
    this._permissions = this._permissions.filter((p) => p.permissionId !== permissionId)
  }

  hasPermissionByCode(permissionCode: string): boolean {
    return this._permissions.some((p) => p.permissionCode === permissionCode)
  }

  hasPermissionById(permissionId: string): boolean {
    return this._permissions.some((p) => p.permissionId === permissionId)
  }

  disable(): void {
    this.isEnabled = false
  }
  enable(): void {
    this.isEnabled = true
  }
}
```

#### Permission Aggregate

```typescript
// src/domain/aggregates/permission.aggregate.ts
export class Permission {
  constructor(
    public readonly id: string,
    public code: string,
    public module: PermissionModule,
    public description?: string
  ) {}

  matchesModule(module: PermissionModule): boolean {
    return this.module === module
  }
}
```

#### Policy Aggregate（新增）

```typescript
// src/domain/aggregates/policy.aggregate.ts
export class Policy {
  constructor(
    public readonly id: string,
    public name: string,
    public effect: PolicyEffect,
    public priority: number,
    public subjectType: PolicySubjectType,
    public subjectId: string | null,
    public permissionCode: string | null,
    public resourceType: string | null,
    public tenantId: string | null,
    public isEnabled: boolean,
    private _conditions: PolicyConditionVO[] = [],
    public description?: string
  ) {}

  get conditions(): ReadonlyArray<PolicyConditionVO> {
    return [...this._conditions]
  }

  addCondition(condition: PolicyConditionVO): void {
    this._conditions.push(condition)
  }

  removeCondition(conditionId: string): void {
    this._conditions = this._conditions.filter((c) => c.id !== conditionId)
  }

  disable(): void {
    this.isEnabled = false
  }
  enable(): void {
    this.isEnabled = true
  }
}
```

### 6.2 值对象

#### PolicyConditionVO（新增，核心）

```typescript
// src/domain/vo/policy-condition.value-object.ts
export class PolicyConditionVO {
  constructor(
    public readonly id: string,
    public readonly attributeSource: AttributeSource,
    public readonly attributeKey: string,
    public readonly operator: ConditionOperator,
    public readonly rawValue: string // JSON 编码，支持 $subject.xxx 动态引用
  ) {}

  /**
   * 评估条件是否满足
   */
  evaluate(ctx: EvaluationContext): boolean {
    const actual = this.resolveAttribute(ctx)
    const expected = this.resolveValue(ctx)
    return this.compare(actual, expected)
  }

  private resolveAttribute(ctx: EvaluationContext): any {
    const sourceMap = {
      [AttributeSource.SUBJECT]: ctx.subject,
      [AttributeSource.RESOURCE]: ctx.resource,
      [AttributeSource.ENVIRONMENT]: ctx.environment,
      [AttributeSource.ACTION]: ctx.action
    }
    return sourceMap[this.attributeSource]?.[this.attributeKey]
  }

  /**
   * 解析值：支持 $subject.xxx / $resource.xxx 动态引用
   */
  private resolveValue(ctx: EvaluationContext): any {
    const val = this.rawValue
    if (val.startsWith('$subject.')) return ctx.subject[val.slice(9)]
    if (val.startsWith('$resource.')) return ctx.resource[val.slice(10)]
    if (val.startsWith('$environment.')) return ctx.environment[val.slice(13)]
    if (val.startsWith('$action.')) return ctx.action[val.slice(8)]
    return JSON.parse(val)
  }

  private compare(actual: any, expected: any): boolean {
    switch (this.operator) {
      case ConditionOperator.EQUALS:
        return actual === expected
      case ConditionOperator.NOT_EQUALS:
        return actual !== expected
      case ConditionOperator.IN:
        return Array.isArray(expected) && expected.includes(actual)
      case ConditionOperator.NOT_IN:
        return Array.isArray(expected) && !expected.includes(actual)
      case ConditionOperator.GREATER_THAN:
        return Number(actual) > Number(expected)
      case ConditionOperator.GREATER_THAN_OR_EQUAL:
        return Number(actual) >= Number(expected)
      case ConditionOperator.LESS_THAN:
        return Number(actual) < Number(expected)
      case ConditionOperator.LESS_THAN_OR_EQUAL:
        return Number(actual) <= Number(expected)
      case ConditionOperator.BETWEEN:
        return (
          Array.isArray(expected) &&
          Number(actual) >= Number(expected[0]) &&
          Number(actual) <= Number(expected[1])
        )
      case ConditionOperator.CONTAINS:
        return typeof actual === 'string' && actual.includes(String(expected))
      case ConditionOperator.STARTS_WITH:
        return typeof actual === 'string' && actual.startsWith(String(expected))
      case ConditionOperator.REGEX:
        return new RegExp(String(expected)).test(String(actual))
      case ConditionOperator.IS_NULL:
        return actual == null
      case ConditionOperator.IS_NOT_NULL:
        return actual != null
      default:
        return false
    }
  }
}
```

### 6.3 领域服务

#### PolicyEngine（新增，核心）

```typescript
// src/domain/services/policy-engine.ts

export interface EvaluationContext {
  subject: Record<string, any>
  resource: Record<string, any>
  environment: Record<string, any>
  action: Record<string, any>
}

export interface AuthzRequest {
  accountId: string
  permissionCode: string
  tenantId?: string
  subject: Record<string, any>
  resource: Record<string, any>
  environment: Record<string, any>
  action: Record<string, any>
}

export interface AuthzDecision {
  allowed: boolean
  matchedPolicy?: string
  reason?: string
}

export class PolicyEngine {
  evaluate(policies: Policy[], request: AuthzRequest): AuthzDecision {
    const applicable = policies.filter((p) => p.isEnabled && this.isApplicable(p, request))

    if (applicable.length === 0) {
      return { allowed: true, reason: 'No applicable policies, default allow' }
    }

    const sorted = applicable.sort((a, b) => b.priority - a.priority)
    const denyPolicies = sorted.filter((p) => p.effect === PolicyEffect.DENY)
    const allowPolicies = sorted.filter((p) => p.effect === PolicyEffect.ALLOW)

    const ctx: EvaluationContext = {
      subject: request.subject,
      resource: request.resource,
      environment: request.environment,
      action: request.action
    }

    // DENY 优先
    for (const policy of denyPolicies) {
      if (this.evaluatePolicy(policy, ctx)) {
        return {
          allowed: false,
          matchedPolicy: policy.name,
          reason: `Denied by policy "${policy.name}"`
        }
      }
    }

    // ALLOW 检查
    if (allowPolicies.length === 0) {
      return { allowed: true, reason: 'No DENY triggered, no ALLOW required' }
    }

    const anyAllowMatched = allowPolicies.some((p) => this.evaluatePolicy(p, ctx))
    return anyAllowMatched
      ? { allowed: true, reason: 'Allowed by policy' }
      : { allowed: false, reason: 'No ALLOW policy matched' }
  }

  private isApplicable(policy: Policy, request: AuthzRequest): boolean {
    if (policy.tenantId !== null && policy.tenantId !== request.tenantId) return false
    if (policy.permissionCode !== null && policy.permissionCode !== request.permissionCode)
      return false
    if (policy.resourceType !== null && policy.resourceType !== request.resource?.type) return false

    switch (policy.subjectType) {
      case PolicySubjectType.ANY:
        return true
      case PolicySubjectType.ROLE:
        const roleCodes = request.subject.roleCodes
        if (Array.isArray(roleCodes)) return roleCodes.includes(policy.subjectId)
        return request.subject.roleCode === policy.subjectId
      case PolicySubjectType.ACCOUNT:
        return request.accountId === policy.subjectId
      default:
        return false
    }
  }

  private evaluatePolicy(policy: Policy, ctx: EvaluationContext): boolean {
    if (policy.conditions.length === 0) return true // 无条件 → 直接匹配
    return policy.conditions.every((cond) => cond.evaluate(ctx))
  }
}
```

#### AccountAuthorizationService（重写）

```typescript
// src/domain/services/account-authorization.service.ts

export class AccountAuthorizationService {
  constructor(
    private roleRepo: RoleRepository,
    private permissionRepo: PermissionRepository,
    private policyRepo: PolicyRepository,
    private policyEngine: PolicyEngine
  ) {}

  async checkPermission(accountId: string, permissionCode: string): Promise<boolean> {
    const permission = await this.permissionRepo.findByCode(permissionCode)
    if (!permission) return false
    const roles = await this.roleRepo.findRolesForAccountId(accountId)
    return roles.some((role) => role.hasPermissionByCode(permissionCode))
  }

  async checkPermissionWithContext(request: AuthzRequest): Promise<AuthzDecision> {
    // Step 1: RBAC
    const rbacPass = await this.checkPermission(request.accountId, request.permissionCode)
    if (!rbacPass) {
      return { allowed: false, reason: 'RBAC: role does not have this permission' }
    }

    // Step 2: ABAC
    const policies = await this.policyRepo.findApplicable(request.permissionCode, request.tenantId)

    return this.policyEngine.evaluate(policies, request)
  }
}
```

### 6.4 Repository 接口

```typescript
// src/domain/repositories/policy.repository.ts
export interface PolicyRepository {
  findById(id: string): Promise<Policy | null>
  findApplicable(permissionCode: string, tenantId?: string): Promise<Policy[]>
  findByTenant(tenantId: string): Promise<Policy[]>
  findAll(): Promise<Policy[]>
  save(policy: Policy): Promise<Policy>
  delete(id: string): Promise<void>
}
```

```typescript
// src/domain/repositories/role.repository.ts（增强）
export interface RoleRepository {
  findById(id: string): Promise<Role | null>
  findByCode(code: string): Promise<Role | null>
  findAll(): Promise<Role[]>
  save(role: Role): Promise<Role>
  delete(id: string): Promise<Role | null>
  findOwnPermissions(roleId: string): Promise<Permission[]>
  findRolesForAccountId(accountId: string): Promise<Role[]>
  // 新增
  assignAccountRole(
    accountId: string,
    roleId: string,
    tenantId: string,
    accountType: AccountType,
    createdBy: string
  ): Promise<void>
  revokeAccountRole(accountId: string, roleId: string): Promise<void>
  findAccountRoles(accountId: string, tenantId: string): Promise<Role[]>
}
```

---

## 7. 应用层设计

### 7.1 Commands

| Command                       | 说明           | 所属模块       |
| ----------------------------- | -------------- | -------------- |
| `CreatePermissionCommand`     | 创建权限       | permission     |
| `DeletePermissionCommand`     | 删除权限       | permission     |
| `CreateRoleCommand`           | 创建角色       | role           |
| `DeleteRoleCommand`           | 删除角色       | role           |
| `AssignRolePermissionCommand` | 为角色分配权限 | role（新增）   |
| `RevokeRolePermissionCommand` | 撤销角色权限   | role（新增）   |
| `AssignAccountRoleCommand`    | 为账户分配角色 | role（新增）   |
| `RevokeAccountRoleCommand`    | 撤销账户角色   | role（新增）   |
| `CreatePolicyCommand`         | 创建策略       | policy（新增） |
| `UpdatePolicyCommand`         | 更新策略       | policy（新增） |
| `DeletePolicyCommand`         | 删除策略       | policy（新增） |
| `TogglePolicyCommand`         | 启用/禁用策略  | policy（新增） |

### 7.2 Queries

| Query                             | 说明                     | 所属模块      |
| --------------------------------- | ------------------------ | ------------- |
| `CheckPermissionQuery`            | 纯 RBAC 鉴权             | authorization |
| `CheckPermissionWithContextQuery` | RBAC + ABAC 鉴权（新增） | authorization |
| `GetPermissionByIdQuery`          | 按 ID 查权限             | permission    |
| `GetPermissionByCodeQuery`        | 按 code 查权限           | permission    |
| `ListPermissionsQuery`            | 列出所有权限             | permission    |
| `ListPermissionsByModuleQuery`    | 按模块列出权限           | permission    |
| `GetRoleByIdQuery`                | 按 ID 查角色             | role          |
| `ListRolesQuery`                  | 列出所有角色             | role          |
| `ListAccountRolesQuery`           | 列出账户的角色（新增）   | role          |
| `GetPolicyByIdQuery`              | 按 ID 查策略（新增）     | policy        |
| `ListPoliciesQuery`               | 列出策略（新增）         | policy        |

---

## 8. 基础设施层设计

### PrismaService

复用现有 `PrismaService`，需要修复导入路径（当前使用了旧版 common 异常 API）。

### Repository 实现

#### PrismaPolicyRepository（新增）

```typescript
// src/infrastructure/repositories/prisma/prisma.policy.repository.ts
@Injectable()
export class PrismaPolicyRepository implements PolicyRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findApplicable(permissionCode: string, tenantId?: string): Promise<Policy[]> {
    const records = await this.prisma.policy.findMany({
      where: {
        isEnabled: true,
        OR: [
          { tenantId: null }, // 全局策略
          { tenantId: tenantId ?? '' } // 租户策略
        ],
        AND: [
          {
            OR: [
              { permissionCode: null }, // 适用所有权限
              { permissionCode: permissionCode } // 精确匹配
            ]
          }
        ]
      },
      include: { conditions: true },
      orderBy: { priority: 'desc' }
    })

    return records.map(PolicyMapper.toDomain)
  }

  // ... 其他方法
}
```

### Mapper

#### PolicyMapper（新增）

```typescript
// src/infrastructure/mappers/policy.mapper.ts
export class PolicyMapper {
  static toDomain(record: any): Policy {
    const conditions = (record.conditions || []).map(
      (c: any) =>
        new PolicyConditionVO(c.id, c.attributeSource, c.attributeKey, c.operator, c.value)
    )
    return new Policy(
      record.id,
      record.name,
      record.effect,
      record.priority,
      record.subjectType,
      record.subjectId,
      record.permissionCode,
      record.resourceType,
      record.tenantId,
      record.isEnabled,
      conditions,
      record.description
    )
  }

  static toPersistent(policy: Policy) {
    return {
      id: policy.id,
      name: policy.name,
      description: policy.description,
      tenantId: policy.tenantId,
      effect: policy.effect,
      subjectType: policy.subjectType,
      subjectId: policy.subjectId,
      permissionCode: policy.permissionCode,
      resourceType: policy.resourceType,
      priority: policy.priority,
      isEnabled: policy.isEnabled
    }
  }
}
```

---

## 9. 接口层设计（gRPC）

### 9.1 Proto 定义

需要定义三个 gRPC 服务：

#### permission_check.proto（扩展）

```protobuf
syntax = "proto3";
package permission_service;

service PermissionCheckService {
  // 纯 RBAC 鉴权（保持向后兼容）
  rpc CheckPermission(CheckPermissionRequest) returns (CheckPermissionResponse);

  // RBAC + ABAC 鉴权（新增）
  rpc CheckPermissionWithContext(CheckPermissionWithContextRequest) returns (AuthzDecisionResponse);
}

message CheckPermissionRequest {
  string account_id = 1;
  string permission_code = 2;
}

message CheckPermissionResponse {
  bool pass = 1;
}

message CheckPermissionWithContextRequest {
  string account_id = 1;
  string permission_code = 2;
  string tenant_id = 3;
  map<string, string> subject_attributes = 4;
  map<string, string> resource_attributes = 5;
  map<string, string> environment_attributes = 6;
  map<string, string> action_attributes = 7;
}

message AuthzDecisionResponse {
  bool allowed = 1;
  string matched_policy = 2;
  string reason = 3;
}
```

#### permission_management.proto（新增，替代 TCP）

```protobuf
syntax = "proto3";
package permission_service;

service PermissionManagementService {
  // Permission CRUD
  rpc CreatePermission(CreatePermissionRequest) returns (PermissionResponse);
  rpc DeletePermission(DeletePermissionRequest) returns (Empty);
  rpc GetPermissionById(GetPermissionByIdRequest) returns (PermissionResponse);
  rpc GetPermissionByCode(GetPermissionByCodeRequest) returns (PermissionResponse);
  rpc ListPermissions(ListPermissionsRequest) returns (ListPermissionsResponse);
  rpc ListPermissionsByModule(ListPermissionsByModuleRequest) returns (ListPermissionsResponse);

  // Role CRUD
  rpc CreateRole(CreateRoleRequest) returns (RoleResponse);
  rpc DeleteRole(DeleteRoleRequest) returns (Empty);
  rpc GetRoleById(GetRoleByIdRequest) returns (RoleResponse);
  rpc ListRoles(ListRolesRequest) returns (ListRolesResponse);

  // Role-Permission 绑定
  rpc AssignRolePermission(AssignRolePermissionRequest) returns (Empty);
  rpc RevokeRolePermission(RevokeRolePermissionRequest) returns (Empty);

  // Account-Role 绑定
  rpc AssignAccountRole(AssignAccountRoleRequest) returns (Empty);
  rpc RevokeAccountRole(RevokeAccountRoleRequest) returns (Empty);
  rpc ListAccountRoles(ListAccountRolesRequest) returns (ListRolesResponse);
}
```

#### policy_management.proto（新增）

```protobuf
syntax = "proto3";
package permission_service;

service PolicyManagementService {
  rpc CreatePolicy(CreatePolicyRequest) returns (PolicyResponse);
  rpc UpdatePolicy(UpdatePolicyRequest) returns (PolicyResponse);
  rpc DeletePolicy(DeletePolicyRequest) returns (Empty);
  rpc TogglePolicy(TogglePolicyRequest) returns (PolicyResponse);
  rpc GetPolicyById(GetPolicyByIdRequest) returns (PolicyResponse);
  rpc ListPolicies(ListPoliciesRequest) returns (ListPoliciesResponse);
}
```

### 9.2 gRPC Controllers

每个 proto service 对应一个 gRPC Controller：

| Controller                       | Proto Service                 | 职责               |
| -------------------------------- | ----------------------------- | ------------------ |
| `PermissionCheckController`      | `PermissionCheckService`      | 鉴权接口           |
| `PermissionManagementController` | `PermissionManagementService` | 权限/角色/绑定管理 |
| `PolicyManagementController`     | `PolicyManagementService`     | 策略管理           |

所有 Controller 使用 `@UseFilters(OtelExceptionFilter, GrpcExceptionFilter)` 统一异常处理。

### 9.3 TCP 到 gRPC 迁移

当前 `main.ts` 使用 TCP transport，需要迁移为 gRPC：

```typescript
// src/main.ts（重写）
import { initOtelSdk } from '@oes/common/tracing/otel-sdk'
import { AppLogger } from '@oes/common/logging/app-logger.service'
import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { MicroserviceOptions, Transport } from '@nestjs/microservices'
import { join } from 'path'

async function bootstrap() {
  const serviceName = process.env.MODULE_NAME || 'permission-service'
  initOtelSdk(serviceName)

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    transport: Transport.GRPC,
    options: {
      package: 'permission_service',
      protoPath: [
        join(__dirname, '../protos/permission_check.proto'),
        join(__dirname, '../protos/permission_management.proto'),
        join(__dirname, '../protos/policy_management.proto')
      ],
      url: `${process.env.GRPC_HOST || '0.0.0.0'}:${process.env.GRPC_PORT || '50051'}`
    }
  })

  app.useLogger(app.get(AppLogger))
  await app.listen()
}
bootstrap()
```

原 `PERMISSION_MESSAGES` 中定义的 TCP 消息模式将全部由 gRPC proto 替代，不再使用。

---

## 10. Common 模块复用

| Common 模块                   | 用途                                         | 引用方式                                                                              |
| ----------------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------- |
| `@oes/common/logging`         | `AppLogger`、`LoggingModule`                 | `main.ts` 中 `app.useLogger()`，Module 中 import `LoggingModule`                      |
| `@oes/common/tracing`         | `initOtelSdk`                                | `main.ts` 中初始化 OpenTelemetry SDK                                                  |
| `@oes/common/core/exceptions` | `ExceptionFactory`、三类异常                 | Handler 中抛出 `DomainException` / `ApplicationException` / `InfrastructureException` |
| `@oes/common/core/filters`    | `GrpcExceptionFilter`、`OtelExceptionFilter` | gRPC Controller 上 `@UseFilters()`                                                    |
| `@oes/common/cqrs`            | `ValidatingCommandBus`、`ValidatingQueryBus` | Module 中注册，Controller 中注入                                                      |
| `@oes/common/registry`        | `RegistryModule`、Nacos 服务注册             | `AppModule` 中 import                                                                 |
| `@oes/common/config`          | `NacosConfigModule`                          | `AppModule` 中 import（配置中心）                                                     |
| `@oes/common/transport/grpc`  | gRPC transport 工具                          | 如果需要调用其他服务                                                                  |

### AppModule 重写

```typescript
// src/app.module.ts
import { Module } from '@nestjs/common'
import { PermissionModule } from './modules/permission/permission.module'
import { RoleModule } from './modules/role/role.module'
import { PolicyModule } from './modules/policy/policy.module'
import { LoggingModule } from '@oes/common/logging/logging.module'
// import { RegistryModule } from '@oes/common/registry/registry.module';
// import { NacosConfigModule } from '@oes/common/config/nacos.config.module';

@Module({
  imports: [
    LoggingModule,
    // RegistryModule,      // Nacos 服务注册
    // NacosConfigModule,   // Nacos 配置中心
    PermissionModule,
    RoleModule,
    PolicyModule // 新增
  ]
})
export class AppModule {}
```

---

## 11. 异常处理

### 异常体系

复用 `@oes/common` 的三类异常：

| 异常类型                  | 使用场景       | 示例                      |
| ------------------------- | -------------- | ------------------------- |
| `DomainException`         | 业务规则违反   | 角色已存在、权限不存在    |
| `ApplicationException`    | 应用层校验失败 | 参数校验失败、鉴权失败    |
| `InfrastructureException` | 基础设施故障   | 数据库连接失败、gRPC 超时 |

### 错误码定义

```typescript
// src/common/constants/exception-enums/permission-service.errors.ts

// 现有
export const ROLE_NOT_FOUND: ExceptionDefinition = { ... };
export const ROLE_ALREADY_EXISTS: ExceptionDefinition = { ... };
export const PERMISSION_NOT_FOUND: ExceptionDefinition = { ... };
export const PERMISSION_ALREADY_EXISTS: ExceptionDefinition = { ... };

// 新增
export const POLICY_NOT_FOUND: ExceptionDefinition = {
  code: 'POLICY_NOT_FOUND',
  message: 'Policy not found',
  messageKey: 'permission.policy_not_found',
  rpcStatus: status.NOT_FOUND,
};

export const POLICY_CONDITION_INVALID: ExceptionDefinition = {
  code: 'POLICY_CONDITION_INVALID',
  message: 'Policy condition is invalid',
  messageKey: 'permission.policy_condition_invalid',
  rpcStatus: status.INVALID_ARGUMENT,
};

export const AUTHORIZATION_DENIED: ExceptionDefinition = {
  code: 'AUTHORIZATION_DENIED',
  message: 'Authorization denied',
  messageKey: 'permission.authorization_denied',
  rpcStatus: status.PERMISSION_DENIED,
};

export const ACCOUNT_ROLE_ALREADY_ASSIGNED: ExceptionDefinition = {
  code: 'ACCOUNT_ROLE_ALREADY_ASSIGNED',
  message: 'Account already has this role',
  messageKey: 'permission.account_role_already_assigned',
  rpcStatus: status.ALREADY_EXISTS,
};
```

### 异常处理链

```
gRPC Controller
  └── @UseFilters(OtelExceptionFilter, GrpcExceptionFilter)
        ├── OtelExceptionFilter: 记录异常到 OpenTelemetry Span
        └── GrpcExceptionFilter: 将 OESExceptionBase 转为 RpcException
```

---

## 12. 测试策略

### 12.1 单元测试（重点）

#### PolicyEngine 测试

```typescript
// test/unit/domain/policy-engine.spec.ts
describe('PolicyEngine', () => {
  describe('evaluate', () => {
    it('should allow when no policies exist')
    it('should deny when DENY policy conditions all match')
    it('should not deny when DENY policy conditions partially match')
    it('should allow when ALLOW policy matches and no DENY triggered')
    it('should deny when ALLOW policies exist but none match')
    it('should deny when DENY overrides ALLOW')
    it('should handle priority ordering correctly')
    it('should filter by tenantId')
    it('should filter by permissionCode')
    it('should filter by subjectType ANY')
    it('should filter by subjectType ROLE')
    it('should filter by subjectType ACCOUNT')
    it('should skip disabled policies')
  })
})
```

#### PolicyConditionVO 测试

```typescript
// test/unit/domain/policy-condition.spec.ts
describe('PolicyConditionVO', () => {
  describe('evaluate', () => {
    it('should evaluate EQUALS correctly')
    it('should evaluate NOT_EQUALS correctly')
    it('should evaluate IN correctly')
    it('should evaluate NOT_IN correctly')
    it('should evaluate GREATER_THAN correctly')
    it('should evaluate BETWEEN correctly')
    it('should evaluate REGEX correctly')
    it('should evaluate IS_NULL correctly')
    it('should resolve $subject.xxx dynamic reference')
    it('should resolve $resource.xxx dynamic reference')
    it('should resolve $environment.xxx dynamic reference')
    it('should handle missing attribute gracefully')
    it('should handle invalid JSON value gracefully')
  })
})
```

#### Role Aggregate 测试

```typescript
// test/unit/domain/role.aggregate.spec.ts
describe('Role', () => {
  it('should add permission')
  it('should not add duplicate permission')
  it('should remove permission by id')
  it('should check permission by code')
})
```

### 12.2 集成测试

```typescript
// test/integration/prisma.policy.repository.spec.ts
describe('PrismaPolicyRepository', () => {
  it('should save and retrieve a policy with conditions')
  it('should find applicable policies by permissionCode and tenantId')
  it('should cascade delete conditions when policy is deleted')
})
```

### 12.3 E2E 测试

```typescript
// test/e2e/permission-check.e2e.spec.ts
describe('PermissionCheckService (gRPC)', () => {
  it('should return pass=true for valid RBAC permission')
  it('should return pass=false for missing RBAC permission')
  it('should return allowed=true when ABAC passes')
  it('should return allowed=false when DENY policy triggers')
  it('should return allowed=false when no ALLOW policy matches')
})
```

### 12.4 测试覆盖率目标

| 层级                                      | 目标覆盖率        |
| ----------------------------------------- | ----------------- |
| Domain（PolicyEngine, PolicyConditionVO） | ≥ 95%             |
| Application（Handlers）                   | ≥ 85%             |
| Infrastructure（Repositories）            | ≥ 70%（集成测试） |
| Interface（Controllers）                  | ≥ 60%（E2E 测试） |

---

## 13. 部署方案

### 13.1 Docker

```dockerfile
# docker/Dockerfile.permission-service
FROM node:20-alpine AS builder
WORKDIR /app
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY src/common/ src/common/
COPY src/services/system/permission-service/ src/services/system/permission-service/
RUN corepack enable && pnpm install --frozen-lockfile
RUN cd src/services/system/permission-service && pnpm run prisma:generate && pnpm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/src/services/system/permission-service/dist ./dist
COPY --from=builder /app/src/services/system/permission-service/prisma ./prisma
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 50051
CMD ["node", "dist/main.js"]
```

### 13.2 环境变量

| 变量                          | 说明                         | 默认值                  |
| ----------------------------- | ---------------------------- | ----------------------- |
| `MODULE_NAME`                 | 服务名称                     | `permission-service`    |
| `DATABASE_URL`                | PostgreSQL 连接串            | —                       |
| `GRPC_HOST`                   | gRPC 监听地址                | `0.0.0.0`               |
| `GRPC_PORT`                   | gRPC 监听端口                | `50051`                 |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | OpenTelemetry Collector 地址 | `http://localhost:4318` |
| `OTEL_SERVICE_NAME`           | OTel 服务名                  | `permission-service`    |
| `NACOS_SERVER_LIST`           | Nacos 地址                   | `localhost:8848`        |

### 13.3 Docker Compose 集成

在项目根目录 `docker-compose.yml` 中添加：

```yaml
permission-service:
  build:
    context: .
    dockerfile: docker/Dockerfile.permission-service
  environment:
    MODULE_NAME: permission-service
    DATABASE_URL: postgresql://postgres:postgres@postgres:5432/permission_db
    GRPC_HOST: 0.0.0.0
    GRPC_PORT: 50051
    OTEL_EXPORTER_OTLP_ENDPOINT: http://otel-collector:4318
  ports:
    - '50051:50051'
  depends_on:
    - postgres
    - otel-collector
```

### 13.4 数据库迁移

```bash
# 开发环境
cd src/services/system/permission-service
npx prisma migrate dev --name add_abac_policy_model

# 生产环境
npx prisma migrate deploy
```

---

## 14. 可观测性

### 14.1 链路追踪（Tracing）

- 通过 `initOtelSdk()` 自动集成 OpenTelemetry
- gRPC 请求自动生成 Span
- 异常通过 `OtelExceptionFilter` 记录到 Span
- 导出到 Jaeger（通过 OTLP）

### 14.2 日志（Logging）

- 使用 `AppLogger`（Pino + OpenTelemetry 集成）
- 日志自动关联 traceId / spanId
- 结构化日志格式，包含 module、operation、errorCode 等字段

关键日志点：

| 位置          | 日志级别 | 内容                                             |
| ------------- | -------- | ------------------------------------------------ |
| 鉴权通过      | DEBUG    | accountId, permissionCode, decision              |
| 鉴权拒绝      | WARN     | accountId, permissionCode, matchedPolicy, reason |
| 策略变更      | INFO     | policyId, action, operator                       |
| 角色/权限变更 | INFO     | roleId/permissionId, action, operator            |
| 数据库异常    | ERROR    | operation, error details                         |

### 14.3 指标（Metrics）

通过 OpenTelemetry Metrics 导出：

| 指标                               | 类型      | 说明              |
| ---------------------------------- | --------- | ----------------- |
| `permission.check.total`           | Counter   | 鉴权请求总数      |
| `permission.check.denied`          | Counter   | 鉴权拒绝数        |
| `permission.check.duration_ms`     | Histogram | 鉴权耗时          |
| `policy.evaluation.total`          | Counter   | 策略评估次数      |
| `policy.evaluation.deny_triggered` | Counter   | DENY 策略触发次数 |

### 14.4 健康检查

gRPC 健康检查协议（`grpc.health.v1.Health`），或自定义健康端点检查数据库连接状态。

---

## 15. 实施路线图

```mermaid
gantt
    title Permission Service RBAC+ABAC 实施路线图
    dateFormat YYYY-MM-DD

    section Phase 1: Schema 重构
    删除 AccountScope 模型                    :p1a, 2026-03-01, 1d
    新增 Policy + PolicyCondition 模型        :p1b, after p1a, 2d
    Prisma Migration                          :p1c, after p1b, 1d
    修复现有代码 bug                          :p1d, after p1a, 2d

    section Phase 2: 领域层
    新增枚举类型                              :p2a, after p1c, 1d
    PolicyConditionVO 实现                    :p2b, after p2a, 2d
    Policy Aggregate 实现                     :p2c, after p2b, 1d
    PolicyEngine 领域服务                     :p2d, after p2c, 3d
    PolicyEngine 单元测试                     :p2e, after p2d, 2d
    PolicyConditionVO 单元测试                :p2f, after p2b, 2d
    重写 AccountAuthorizationService          :p2g, after p2d, 2d

    section Phase 3: 基础设施层
    PolicyRepository 接口                     :p3a, after p2c, 1d
    PrismaPolicyRepository 实现               :p3b, after p3a, 2d
    PolicyMapper 实现                         :p3c, after p3a, 1d
    完善 RoleMapper                           :p3d, after p1c, 1d
    修复 PrismaPermissionRepository           :p3e, after p1c, 1d
    Repository 集成测试                       :p3f, after p3b, 2d

    section Phase 4: 应用层
    Policy CRUD Commands + Handlers           :p4a, after p3b, 3d
    CheckPermissionWithContext Query           :p4b, after p2g, 2d
    AccountRole 管理 Commands                 :p4c, after p3b, 2d
    Handler 单元测试                          :p4d, after p4b, 2d

    section Phase 5: 接口层 - gRPC 迁移
    Proto 定义                                :p5a, after p4a, 2d
    Proto 代码生成                            :p5b, after p5a, 1d
    PermissionCheck gRPC Controller 重写      :p5c, after p5b, 2d
    PermissionManagement gRPC Controller      :p5d, after p5b, 3d
    PolicyManagement gRPC Controller          :p5e, after p5b, 2d
    main.ts 迁移到 gRPC transport             :p5f, after p5c, 1d
    E2E 测试                                  :p5g, after p5f, 3d

    section Phase 6: 集成与部署
    AppModule 重构                            :p6a, after p5f, 1d
    Dockerfile 编写                           :p6b, after p6a, 1d
    Docker Compose 集成                       :p6c, after p6b, 1d
    Nacos 注册集成                            :p6d, after p6a, 1d
    Gateway 侧 Guard 适配                    :p6e, after p5g, 2d
```

---

## 16. 已知问题与修复清单

| #   | 文件                                                | 问题                                                           | 修复方案                                                 |
| --- | --------------------------------------------------- | -------------------------------------------------------------- | -------------------------------------------------------- |
| 1   | `role.aggregate.ts:18`                              | `removePermissionById` 使用 `filter` 但未赋值回 `_permissions` | 改为 `this._permissions = this._permissions.filter(...)` |
| 2   | `prisma.permission.repository.ts:12,20`             | `findById` 和 `findByCode` 缺少 `await`                        | 添加 `await`                                             |
| 3   | `role.mapper.ts:5-6`                                | `toDomain` 和 `toPersistant` 方法为空                          | 实现完整映射逻辑                                         |
| 4   | `permission-check.grpc.controller.ts:44`            | `checkPermissionScope` 返回的 `scopes:` 后缺少值               | 完善返回逻辑                                             |
| 5   | `prisma.service.ts:4`                               | 导入了旧版 common 异常 API                                     | 更新为 `@oes/common/core/exceptions`                     |
| 6   | `repo.symbols.ts`                                   | 缺少 `POLICY` Symbol                                           | 添加 `POLICY: Symbol('PolicyRepository')`                |
| 7   | `main.ts`                                           | 使用 TCP transport                                             | 迁移为 gRPC transport                                    |
| 8   | `prisma.role.repository.ts:15`                      | 引用了不存在的 `Role.fromPrisma` 静态方法                      | 使用 `RoleMapper.toDomain`                               |
| 9   | `schema.prisma:74-89`                               | `AccountScope` 模型冗余                                        | 删除，由 Policy ALLOW 替代                               |
| 10  | `check-account-permission-with-scope.handler.ts:34` | 函数未返回值                                                   | 重写为 `CheckPermissionWithContextHandler`               |
