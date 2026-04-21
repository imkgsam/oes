# party-service Contracts

## 1. 目的

本目录用于提供 `party-service` 的黑盒接口文档。

这些文档面向：

- `api-gateway`
- `identity-service`
- `tenant-org-service`
- `hr-service`
- CRM、SRM、订单、合同、会计等未来业务服务

阅读目标：

- 理解 `party-service` 暴露了哪些能力
- 明确每个接口的请求 / 响应语义
- 明确上下文、权限、副作用与错误边界

这些文档不是 proto 副本。

当前稳定真相源仍然是：

- [party-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/party-service.md)
- [ADR 0003](/Users/acehood/Documents/GitHub/oes/docs/adr/0003-party-master-service-and-tenant-party-binding.md)

在 proto、generated client 与运行时服务 rename 完成前，当前目录用于先冻结黑盒契约，不代表现有代码中已经完成 `entity-service -> party-service` 迁移。

## 2. 模块划分

- [registration.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/party-service/registration.md)
  - 主体注册、租户绑定、停用等管理型写接口
- [query.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/party-service/query.md)
  - 主体查询、候选搜索、标识解析与关系摘要查询
- [merge.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/party-service/merge.md)
  - 主体受控合并接口与 merge 治理边界

## 3. 全局调用约束

- 所有接口均为内部服务接口，不直接对外部客户端开放。
- 所有调用方都应将 `party-service` 视为 black box，而不是依赖其内部实现结构。
- 第一阶段业务域默认引用 `tenantPartyId`，而不是直接持有裸 `partyId` 作为业务主体主引用。
- 管理型写接口要求：
  - internal service 调用上下文
  - authenticated operator context
  - `tenantId`
  - trace context
  - 审计元数据
- 查询接口是否要求 `operator context` 与 permission guard，以具体接口文档为准。
- 在现有运行时代码仍使用旧 `entity-service` 名称期间，任何调用方不得继续扩展泛化 entity 语义；应按本目录的 `party-service` 边界设计新能力。

## 4. 第一阶段能力范围

截至当前，`party-service` 第一阶段只开放以下能力：

- 自然人 / 组织主体注册
- 租户绑定已有主体
- 按主体 ID、租户主体 ID、标识与名称候选执行受控查询
- 查询少量稳定主体关系摘要
- 受控主体合并
- 租户主体停用

当前不包含：

- customer / supplier / employee / contact 业务角色管理
- org tree 或 org membership 管理
- 完整主数据治理平台能力
- 自动外部工商 / 证照数据同步
