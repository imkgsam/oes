# OES 协同蓝图索引

## 1. 目的

本目录用于沉淀 OES 的关键跨服务协同蓝图，作为“多个服务围绕某项能力如何配合”的唯一真相源。

这里不承载：

- 单个服务长期职责真相
- feature 执行状态
- API / gRPC / event 字段正文
- 具体实现 checklist

## 2. 使用规则

- 每个关键能力只有一份协同蓝图。
- 协同蓝图回答的是服务之间如何配合，不重复定义单个服务职责卡中的边界。
- 若一个 feature 需要解释多个服务的长期协作方式，应直接引用本目录下对应蓝图。
- 若某项协同规则会被多个 feature 复用，就不应继续留在 feature packet 中。

## 3. 当前协同蓝图

1. [authentication-and-identity.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/collaborations/authentication-and-identity.md)
   - 认证与身份映射协同蓝图
2. [authorization-decision-flow.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/collaborations/authorization-decision-flow.md)
   - 授权判定与查询范围协同蓝图
3. [account-context-switch.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/collaborations/account-context-switch.md)
   - 账号上下文切换协同蓝图

## 4. 新服务协同准入规则

新增 `erp-service` 这类服务时：

- 若仅新增服务职责而不改变已有协同方式，可先补服务职责卡
- 若引入新的跨服务协同模式，必须补对应协同蓝图后再进入 feature 设计
- 协同蓝图应只沉淀稳定、可复用的规则，不为单个 feature 写一次性长文
