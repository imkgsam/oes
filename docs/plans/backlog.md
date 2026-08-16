# OES Backlog

本文件只保存仍有效且明确延期的事项。达到触发条件时重新进入 Design Task；完成、取消或失效后直接删除。

## Platform

| Deferred item | Revisit when |
| --- | --- |
| DecisionEvent query model | 出现跨服务授权判定排障需求，并已明确 retention、查询权限和入口。 |
| Central audit ingestion/query | 至少两个业务服务产生稳定审计事实，并出现跨服务统一检索需求。 |
| Event-bus trace propagation | 业务事件链路投入使用并冻结事件 trace metadata。 |
| Remove legacy CheckPermissionWithContext | 完成真实调用面审查与调用方契约迁移。 |
| Cross-session permission refresh | 产品确认软刷新或强制失效语义，并冻结受影响账号解析和通知通道。 |

## Product

| Deferred item | Revisit when |
| --- | --- |
| QR login, self-registration and third-party login | 对应产品决策、BFF 契约和下游 owner 已冻结。 |
| System tenant selector | 冻结租户目录/搜索 BFF 契约与 system operator 可见范围。 |
| Browser access-token refresh E2E | 正式鉴权页面稳定并具备浏览器级测试入口。 |
| Machine identity management UI | 明确使用人、入口端、权限和 BFF surface。 |
| Login history and anomaly notification | 冻结 session/audit 数据口径、retention 和通知边界。 |
| OTP failure attribution in login history | 冻结 OTP 失败时的 user resolution 与风控语义。 |
| System-admin tenant creation | 冻结 Tenant、Org、initial admin、roles、audit 与 rollback ownership。 |
| Onboarding binding/grant compensation UI | 冻结 HR、Identity、Permission 查询与 retry contract。 |
| Independent access-channel/entry-policy model | 冻结该模型与 login methods、roles 的 ownership。 |
| Multiple active employments | 产品确认兼职语义并冻结 primary/secondary employment。 |
| Offboarded employee workspace | 冻结 rehire、retention、visibility 与账号禁用协同。 |
| Account/employee management IA | 明确主使用人、cross-link、聚合摘要与 owner 边界。 |
| CRM source record mutations | 冻结 add/set-primary commands、evidence、permission 与 audit。 |
| Non-employee subject workspaces | 按 supplier/dealer/customer 等主体分别确认 bounded context 与入口。 |
| Strict second-factor independence | 登录和 step-up 流程稳定，且产品要求排除同类 primary factor。 |
| Platform-default MFA policy | 冻结 platform default、tenant override、强制继承和冲突解释。 |
| Policy Explain / Impact Preview | 冻结 subject/resource/environment 输入和结果可见范围。 |
| Notification rule/template administration | 冻结预定义 notification type、tenant override、模板版本/变量和管理员 BFF surface。 |
| Notification realtime and external channels | 产品确认 polling、SSE、WebSocket、mobile push、Email/SMS 中哪些进入当前通知主线。 |

## Operations

| Deferred item | Revisit when |
| --- | --- |
| Audit search replica | Central audit query 立项并确认索引、同步和数据生命周期。 |
| Metrics, logging retention, dashboards and alerts | 平台进入稳定运营并确认 SLO 与指标集。 |
| Permission/navigation baseline environment runbook | shared environment 需要固定 seed/sync 顺序与回归检查。 |

## Extraction

| Deferred item | Revisit when |
| --- | --- |
| Shared audit-query model | 更多服务形成稳定且相似的查询样板。 |
| Unified CheckResource facade | 多个业务服务证明存在相同资源授权编排。 |
| Pre-repository authorization snapshot | 性能证据证明 detail query 需要稳定快照与失效策略。 |

## Sidecar

| Deferred item | Revisit when |
| --- | --- |
| Permission-management contract examples | 新前端接入出现具体请求、错误或刷新策略阻塞。 |
