# Permission Service 阶段路线

更新时间：2026-03-22 12:00:00 +08:00

本文档只负责记录阶段说明、优先级和实施顺序，不重复展开功能设计细节。

## Phase 划分

### Phase 1：权限核心闭环

目标：

- 建立稳定可用的权限、角色、策略和鉴权核心闭环

范围：

- 角色模板与租户实例模型
- 账号角色绑定
- 权限管理
- Policy 收敛
- `CheckPermission`
- `CheckPermissionWithContext`
- 管理接口边界补强

### Phase 2：服务内授权与安全收口

目标：

- 将当前文档中已确定的服务边界、操作者授权和租户约束真正落实到接口层与应用层

范围：

- `InternalServiceGuard`
- `AuthenticatedOperatorGuard`
- 管理接口授权矩阵
- 租户边界收口
- 审计与决策记录增强

### Phase 3：复用与推广

目标：

- 将 `permission-service` 中已经验证有效的骨架和约束推广到其他子服务

范围：

- 服务骨架模板化
- 协议和文档规范进一步统一
- 其他子服务按统一方式接入授权能力

## 当前优先级

1. 继续收敛 `Role` 模板 / 实例边界
2. 完成管理接口服务内授权收口
3. 修补租户边界和资源边界缺口
4. 稳定 `Policy` 与鉴权结果语义
5. 再考虑更广泛的服务模板推广

## 当前功能状态摘要

| 功能集合 | 当前状态 | 主要文档 |
|---|---|---|
| 4.2 角色管理 | 进行中 | [design/role-management.md](./design/role-management.md) |
| 4.3 账号角色管理 | 进行中 | [design/account-role-management.md](./design/account-role-management.md) |
| 4.4 权限管理 | 进行中 | [design/permission-management.md](./design/permission-management.md) |
| 4.5 Policy 管理 | 进行中 | [design/policy-management.md](./design/policy-management.md) |
| 4.6 鉴权能力 | 进行中 | [design/authorization.md](./design/authorization.md) |

## 任务文档约定

- 若后续某个功能集合开始频繁拆分实现步骤，应新增到 `tasks/*.md`
- `tasks/*.md` 只写步骤、验收和阻塞，不重复设计正文
