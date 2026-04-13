# 权限码统一治理实施计划

## 1. 目标

将 OES 项目中的权限码收敛为单一语义源，并建立数据库同步能力。

## 2. 范围

- `src/common` 中建立统一权限码目录
- `permission-service` 迁移现有管理权限码
- `permission-service` 增加权限码同步脚本
- `auth-service` 接入 `auth` 域权限码并完成 admin session 管理授权

## 3. 分片

### SLICE-01 权限码统一目录基线

- 在 `src/common/src/authorization/permission-codes/` 建立目录结构
- 建立模块聚合导出
- 不改业务调用

### SLICE-02 permission-service 管理权限码迁移

- 将本地 `MANAGEMENT_PERMISSION_CODES` 迁移到 `common`
- 保持现有字符串值不变
- controller / guard 改为从 `common` 引用

### SLICE-03 权限码数据库同步脚本

- 在 `permission-service` 增加同步脚本
- 从 `common` 读取所有权限码
- 执行 upsert
- 输出同步报告

### SLICE-04 auth-service admin session 权限接入

- 在 `common` 中新增 `auth` 域 session 管理权限码
- `auth-service` 的 admin session 接口接入 `@RequirePermission(...)`
- 通过 `permission-service` 做授权判断

### SLICE-05 其他服务逐步迁移

- `identity-service`
- `entity-service`
- 其他管理接口

## 4. 当前推荐顺序

1. `SLICE-01`
2. `SLICE-02`
3. `SLICE-03`
4. `SLICE-04`

## 5. 当前进度

| Slice | Status | Notes |
| --- | --- | --- |
| `SLICE-01` | completed | `common` 中统一权限码目录与导出基线已建立 |
| `SLICE-02` | completed | `permission-service` 的 `MANAGEMENT_PERMISSION_CODES` 已改为复用 `common` 中的统一定义 |
| `SLICE-03` | completed | `permission-service` 已新增 `permission-codes:sync` 脚本与最小 upsert 同步逻辑 |
| `SLICE-04` | completed | `auth-service` admin session 接口已接入统一权限码与 `RequirePermission(...)` |

## 6. 当前快照

Updated: 2026-03-26 00:45 +08:00

当前这条“统一权限码语义源”治理线已经完成从目录基线到 `auth-service` 消费落点的最小闭环：

- `common`
  - 已建立统一权限码目录
  - 已提供 `auth / identity / permission` 三组模块入口
- `permission-service`
  - 现有管理权限码已迁移到 `common` 来源
  - 已补 `permission-codes:sync` 同步脚本
- `auth-service`
  - `AdminListUserSessions`
  - `AdminRevokeSession`
  - 已接入统一权限码常量与 `RequirePermission(...)`
  - 当时通过旧的权限快照字段完成权限解析

需要补充说明：

- 上述解析方式是该阶段的过渡实现，不是目标状态
- 自 2026-03-29 起，项目级目标状态已由 `docs/architecture/09-role-based-permission-resolution.md` 明确为：
  - `operator_context` 传播 `operator_roles`
  - 子服务通过共享 resolver 调用 `permission-service` 解析 permissions

同时，需要明确一点：

- 这条治理线已推进到“可用状态”
- 但还没有完成“数据库真实同步执行验收”
- 也还没有覆盖到除 `permission-service` / `auth-service` 之外的其他服务

## 7. 当前线程边界

当前线程如果继续推进，只适合在 `auth-service` 范围内消费既有统一权限码方案；涉及 `common` 与 `permission-service` 的共享语义和同步脚本变更，必须遵循项目级设计并按最小切片推进。
