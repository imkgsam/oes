# Authorization Layering Rollout

```text
featureKey: AUTHORIZATION-LAYERING-ROLLOUT
state: RUNNING
truthSource: docs/architecture/platforms/authorization-layering-and-resource-policy.md
serviceTruth: docs/architecture/services/permission-service.md
```

## Objective

将粗粒度 Permission Code、单资源 `checkResource`、列表 `buildQueryScope`、高风险 security policy 与跨服务派生授权按稳定边界逐步接入真实业务能力。

## Completed Foundation

- Gateway/服务入口的粗粒度 Permission Code 声明已统一并保持 fail closed。
- `AuthorizationQueryScopeService + QueryScopeBuilder + DI registry` 已形成首批基础。
- Identity、Auth 与 Permission 已完成多个 query-scope、detail-query 和 command 样板。
- Permission/Role/RoleTemplate/AccountRole 的首批 Gateway 管理接口已完成契约与联调收口。
- Session tenant/org 已成为 Auth 聚合事实，不再从普通 metadata 推断。

## Active Slices

| Slice | State | Acceptance |
| --- | --- | --- |
| 单资源命令 `checkResource` | RUNNING | 在 application 层加载最小 resource facts；业务状态机不进入 policy。 |
| 单资源详情 `checkResource` | RUNNING | detail query 在 owner application 层判定，不由 controller/guard 伪造资源事实。 |
| 列表 `buildQueryScope` | RUNNING | repository 消费 owner-defined query scope，不逐条布尔鉴权。 |
| 高风险 security policy | READY | 只在具体 export/approve/grant/rotate/revoke 场景冻结后进入。 |
| 派生内部协作 | READY | 主动作与独立下游授权点明确，operator/tenant/audit 连续且不重复同层授权。 |

## Execution Rule

每个业务域单独冻结小 slice：明确资源 owner、resource facts、query filter、Code、拒绝语义、测试与回写目标。不得以一个全局迁移线程批量修改所有服务。

## Acceptance

- `checkPermission` 只做粗粒度 capability gate。
- `checkResource` 只处理单资源可访问性，不吞掉业务规则。
- `buildQueryScope` 输出可下推 repository 的查询边界。
- tenant isolation、认证完整性和稳定安全边界不依赖可配置 policy 才成立。
- 目标服务仍独立执行资源与领域约束；Gateway 判断不替代 owner enforcement。
