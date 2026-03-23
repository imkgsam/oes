# OES 文档总索引

更新时间：2026-03-22 12:00:00 +08:00

本文档只负责导航，不承载设计正文。根目录 `doc` 只保留项目级、跨服务级和全局约束类文档；单个子服务的详细设计请进入对应服务的 `doc/` 目录。

## 阅读顺序

1. 先读 [overview.md](./overview.md)
2. 再读codex 行为准则 [requirements.md](./standards/requirements.md)
3. 再读文档规范 [doc-architecture-requirements.md](./standards/doc-architecture-requirements.md)
4. 需要统一服务骨架时读 [microservice-architecture-reuse-guide.md](./standards/microservice-architecture-reuse-guide.md)
5. 需要具体服务实现时进入对应服务的 `src/services/*/doc`

## 全局文档

| 分类       | 文档                                                                                                        | 用途                                                                                   |
| ---------- | ----------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| 项目概览   | [overview.md](./overview.md)                                                                                   | 说明根目录文档职责边界、服务级文档如何挂接、推荐阅读路径                               |
| 全局规范   | [standards/](./standards/)                                                                                     | 所有子服务共同继承、共同遵循的执行约束与架构规范目录                                   |
| 全局约束   | [requirements.md](./standards/requirements.md)                                                                 | 约束 Codex 在本仓库内的执行方式、文档更新规则和最小闭环要求                            |
| 文档规范   | [doc-architecture-requirements.md](./standards/doc-architecture-requirements.md)                               | 统一文档整理要求、索引要求、关联要求、跨服务挂接规则和链接规范                         |
| 架构复用   | [microservice-architecture-reuse-guide.md](./standards/microservice-architecture-reuse-guide.md)               | 从 `permission-service` 提炼出的统一微服务骨架、文档架构与实施规范，供其他子服务遵循 |
| 跨服务功能 | [internal-service-auth-and-operator-context.md](./cross-service/internal-service-auth-and-operator-context.md) | 第一个需要分发到多个子服务统一实现的跨服务功能主文档，负责总设计、总拆分和协作边界     |

## 服务文档入口

| 服务                   | 服务索引                                                                                                   | 说明                                         |
| ---------------------- | ---------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| `permission-service` | [src/services/system/permission-service/doc/INDEX.md](../src/services/system/permission-service/doc/INDEX.md) | 权限域服务边界、功能设计、阶段路线和历史索引 |
| `auth-service`       | [src/services/system/auth-service/doc/INDEX.md](../src/services/system/auth-service/doc/INDEX.md)             | 认证域服务设计与功能集合索引                 |

## 归档文档

- 历史项目资料保留在 [archive/](./archive/)。
- 根目录跨服务文档的历史记录保留在 [history/](./history/)。
