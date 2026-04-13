# OES 文档入口

更新时间：2026-04-11

本文档是 OES 项目级文档的统一入口，只负责导航，不承载大段设计正文。

## 当前有效目录

| 目录 | 职责 |
|---|---|
| [architecture](./architecture/index.md) | 项目级稳定架构、边界、治理原则与长期设计 |
| [governance](./governance/codex-threading-rules.md) | 多线程协作规则、变更边界与执行流程 |
| [plans](./plans/index.md) | 阶段计划、专题推进路径与实施顺序 |
| [contracts](./contracts/index.md) | 黑盒接口契约与前后端 / 服务间对接文档 |
| [adr](./adr/index.md) | 关键架构决策记录 |

## 推荐阅读顺序

1. [architecture/00-vision-and-scope.md](./architecture/00-vision-and-scope.md)
2. [architecture/01-system-context.md](./architecture/01-system-context.md)
3. [architecture/02-bounded-contexts.md](./architecture/02-bounded-contexts.md)
4. [architecture/03-technical-architecture.md](./architecture/03-technical-architecture.md)
5. [architecture/05-governance.md](./architecture/05-governance.md)
6. [governance/codex-threading-rules.md](./governance/codex-threading-rules.md)
7. [plans/index.md](./plans/index.md)

## 服务文档入口

| 服务 | 文档入口 |
|---|---|
| `auth-service` | [src/services/system/auth-service/doc/INDEX.md](../src/services/system/auth-service/doc/INDEX.md) |
| `identity-service` | [src/services/system/identity-service/doc/INDEX.md](../src/services/system/identity-service/doc/INDEX.md) |
| `permission-service` | [src/services/system/permission-service/doc/INDEX.md](../src/services/system/permission-service/doc/INDEX.md) |

## 清理结论

旧根目录 `doc/` 已不再作为项目级设计入口。其有效规则已经收敛到 `AGENTS.md`、`docs/architecture/05-governance.md`、`docs/governance/*` 与服务自身 `doc/`；历史经验和过时方案不再作为当前稳定设计依据。
