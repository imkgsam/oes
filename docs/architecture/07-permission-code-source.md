# OES 统一权限码语义源设计

> `permission-service` 的服务设计唯一真相源为 [permission-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/permission-service.md)。本文只定义项目级权限码语义源与同步机制，不重新定义 permission-service 的核心对象、owner 边界或授权判定模型。

## 1. 目的

本设计用于统一 OES 项目中权限码的定义、引用与数据库同步方式，避免以下问题：

- 各服务手写字符串，权限语义漂移
- 装饰器、授权检查、数据库初始化之间不一致
- `gateway`、`permission-service`、业务服务各自维护一份权限码副本
- 修改权限码后无法稳定同步到数据库与运行时

本设计只定义“权限码唯一语义源”的结构与同步机制，不直接承载 operator context 与权限解析链设计。相关内容已由 [09-role-based-permission-resolution.md](09-role-based-permission-resolution.md) 单独定义。

## 2. 目标

- 代码中所有权限码都来自统一常量定义
- 权限码按模块拆分，不放入单一大文件
- `permission-service` 能从统一定义中同步权限到数据库
- `gateway`、`auth-service`、其他服务、装饰器都复用同一份权限码常量
- 数据库中的权限定义与代码中的权限码保持一致

## 3. 非目标

- 不在本设计中调整 operator context 结构
- 不在本设计中调整 role / policy / scope 模型
- 不在本设计中定义所有业务域的完整权限集
- 不在本设计中改变现有 permission 判定协议

## 4. 设计原则

- 单一语义源优先于局部便利
- 权限码定义与数据库同步逻辑分离
- 共享库承载稳定语义，不承载本地服务实现
- 权限码按 bounded context / 模块拆分
- 常量命名与字符串值都必须稳定、可审计、可追踪

## 5. 模块拆分

统一权限码定义建议下沉到 `src/common`，并按模块拆分，而不是留在单个服务内部。

建议目录：

```text
src/common/src/authorization/permission-codes/
  auth/
    session.permission-codes.ts
    auth-management.permission-codes.ts
    index.ts
  permission/
    management.permission-codes.ts
    index.ts
  identity/
    account.permission-codes.ts
    tenant.permission-codes.ts
    index.ts
  index.ts
```

约束：

- 每个文件只定义一个清晰模块的权限码
- `index.ts` 只做聚合导出
- 不允许把所有域的权限码重新塞回一个超大常量对象

## 6. 常量形态

建议采用稳定对象常量：

```ts
export const AUTH_SESSION_PERMISSION_CODES = {
  ADMIN_VIEW_USER_SESSIONS: 'auth.session.admin.view',
  ADMIN_REVOKE_SESSION: 'auth.session.admin.revoke',
  USER_VIEW_OWN_SESSIONS: 'auth.session.self.view',
  USER_RENAME_OWN_SESSION_DEVICE: 'auth.session.self.rename_device',
  USER_LOGOUT_OWN_SESSION: 'auth.session.self.logout'
} as const
```

约束：

- key 使用稳定英文标识
- value 使用 `domain.resource.action` 风格
- value 才是数据库中真正持久化与判定的权限码
- key 仅用于代码可读性与引用稳定性

## 7. 与装饰器的关系

`@RequirePermissions({ all: [...] })` 不再接收散落字符串，而是接收统一常量值，例如：

```ts
@RequirePermissions({ all: [AUTH_SESSION_PERMISSION_CODES.ADMIN_REVOKE_SESSION] })
```

这保证：

- controller / guard / permission-service 检查语义一致
- IDE 可追踪引用
- 重构时可统一修改

## 8. 与数据库同步的关系

`permission-service` 应提供“从统一权限码定义同步数据库”的脚本或同步入口。

同步机制要求：

- 输入：`src/common/src/authorization/permission-codes/**`
- 输出：权限主数据表中的标准 permission code 记录
- 能识别新增、缺失、重复
- 默认只做 upsert，不自动删除数据库记录
- 删除动作需显式治理流程，不允许脚本默认清理

建议同步步骤：

1. 聚合所有 permission code 常量
2. 生成平铺清单
3. 对数据库执行 upsert
4. 输出新增 / 已存在 / 冲突报告

## 9. 数据库同步边界

统一权限码常量是语义源，但数据库仍是运行时事实源。

二者关系：

- 代码常量：定义“允许存在的权限语义”
- 数据库：承载“当前环境已注册的权限事实”

因此：

- 装饰器与服务代码引用统一常量
- `permission-service` 启动脚本或治理脚本将常量同步到数据库
- 不允许业务服务自行向数据库散写 permission code

## 10. 迁移路径

### Phase 1

- 保留 `permission-service` 现有本地 `MANAGEMENT_PERMISSION_CODES`
- 在 `src/common` 建立统一目录与结构
- 将 `permission-service` 的管理权限码迁移到 `common`
- 仅保证代码引用来源统一，不改变字符串值

### Phase 2

- 为 `auth-service` 增加 `auth` 域权限码常量
- 将 admin session 管理接口改为引用 `common` 中的权限码
- `permission-service` 同步脚本开始消费 `common` 权限码定义

### Phase 3

- 逐步迁移 `identity-service` 与其他服务
- 清理各服务内部残留的本地 permission code 常量

## 11. 对当前主线的直接影响

当前最直接落点是 `auth-service` 的 admin session 管理：

- `AdminListUserSessions`
- `AdminRevokeSession`

它们不应继续裸用 operator identity，而应在接入统一权限码定义后，通过 `permission-service` 做授权判定。

建议权限码语义先按 `auth` 模块拆：

- `auth.session.admin.view`
- `auth.session.admin.revoke`

注意：

- 本设计只确定结构与命名方向
- 具体权限码清单进入实施阶段时仍应按最小切片逐步落地

## 12. 风险与约束

- 这是跨模块语义设计，不能在单服务线程中随意扩张
- `src/common` 中只允许承载稳定权限码语义，不承载数据库同步实现
- 数据库同步脚本应放在 `permission-service` 或治理脚本目录，不应放进 `common`
- 如果历史数据库里已有不一致权限码，需要单独治理，不能靠常量文件直接覆盖

## 13. 当前落地状态

Updated: 2026-03-26 00:45 +08:00

截至当前，已完成：

- `SLICE-01`
  - `src/common/src/authorization/permission-codes/**` 目录与导出基线已建立
- `SLICE-02`
  - `permission-service` 本地 `MANAGEMENT_PERMISSION_CODES` 已收敛为对 `common` 的复用导出
- `SLICE-03`
  - `permission-service` 已新增统一权限码同步脚本
  - 当前脚本采用保守 upsert，不执行删除
- `SLICE-04`
  - `auth-service` 的 `AdminListUserSessions`
  - `auth-service` 的 `AdminRevokeSession`
  - 已接入统一权限码常量与 `RequirePermissions(...)`

当前仍未完成的内容：

- 历史数据库中权限码的实际同步执行与环境验证
- 其他服务继续迁移到统一权限码来源
- 装饰器和数据库同步链路在更大范围内的全面收口

## 14. 与整体主线的关系

这份设计文档对应的是“统一权限码语义源”这条治理分支，不等同于项目级
`internal-service-auth-and-operator-context` 主线切片本身。

当前关系如下：

- 整体主线：
  - 已超过 `SLICE-04`
  - 当前整体主线处于 `SLICE-07` 部分实现阶段
- 本治理分支：
  - 已完成到本地计划中的 `SLICE-04`
  - 也就是“统一权限码定义 -> `permission-service` 复用 -> 同步脚本 -> `auth-service` 接入”这一条最小闭环
