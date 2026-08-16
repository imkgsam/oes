# Observability And Audit Foundation

```text
featureKey: OBSERVABILITY-AND-AUDIT-FOUNDATION
state: RUNNING
truthSource: docs/architecture/platforms/observability-and-audit.md
```

## Objective

在不把日志、trace 或第三方平台当作审计真相的前提下，形成统一 metrics、trace、structured logging 与 owner-local audit 基线。

## Completed Foundation

- trace context 与结构化日志完成本地基线。
- Identity、Permission、Auth 已形成 owner-local `AuditEvent` 持久化及 `ListAuditEvents` 样板。
- audit envelope、三态结果、tenant/org/operator/resource/trace 与 cursor query 基线已冻结。
- service-local audit 与业务 mutation 保持 owner-local transaction 语义。

## Remaining Slices

| Slice | State | Entry condition |
| --- | --- | --- |
| OTel Collector/query chain | READY | 明确开发及部署环境 collector 入口。 |
| Metrics baseline | DEFERRED | 冻结首批 SLI/SLO 与采集成本。 |
| Shared audit query model | DEFERRED | 至少三个样板出现真正相同且稳定的 query shape；当前不得过早抽象。 |
| Central audit ingestion/query | DEFERRED | 出现跨服务统一检索需求并冻结 retention 与访问边界。 |
| Search/SIEM integration | DEFERRED | owner-local audit 稳定且有明确运营/安全检索需求。 |

## Acceptance

- 日志、span、metric 与 audit event 的职责不混淆。
- credential、token、OTP、敏感 payload 与未脱敏 recipient 不进入采集面。
- audit 写入、失败语义、查询权限与 retention 由 owner 明确。
- 中央索引只做受控 projection，不取代服务本地审计真相。
