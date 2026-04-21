# OES 服务职责索引

## 1. 目的

本目录用于沉淀 OES 各服务的职责卡，作为“这个服务长期负责什么、不负责什么、拥有哪些核心能力”的唯一真相源。

这里不承载：

- feature 执行状态
- 详细模块实现方案
- 接口字段与错误码正文
- 可复用的跨服务协同流程正文

## 2. 使用规则

- 每个服务只有一份职责文档。
- 服务职责文档应保持短小，优先回答边界问题，而不是展开实现细节。
- 同一条服务职责不应同时散落在 feature packet、plan 与 contract 文档中。
- 若一个 feature 需要说明某服务长期负责什么，应直接引用本目录下对应文档。
- 若一个服务职责变化影响项目级边界，应同步回写 `docs/architecture/**` 或 ADR。

## 3. 当前服务职责文档

1. [auth-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/auth-service.md)
   - 认证、会话、挑战与认证审计职责卡
2. [identity-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/identity-service.md)
   - 用户、账号、租户展示查询与身份映射职责卡
3. [permission-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/permission-service.md)
   - 角色、权限、scope、policy 与授权判定职责卡
4. [party-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/party-service.md)
   - 交易与法律主体主数据、租户主体绑定职责卡
5. [tenant-org-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/tenant-org-service.md)
   - 租户边界、组织树、组织上下文与 org scope 基础职责卡
6. [hr-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/hr-service.md)
   - 员工、任职关系与人力基础事实职责卡
7. [crm-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/crm-service.md)
   - 客户关系、销售前置研究、lead draft 与未来 CRM 销售对象职责卡
8. [srm-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/srm-service.md)
   - 供应商关系、供应商联系人与供应商分析视图职责卡

## 4. 新服务准入规则

新增 `erp-service` 这类服务时，默认顺序应为：

1. 先判断是否需要更新项目级 architecture 或新增 ADR
2. 再新增本目录中的服务职责文档
3. 再补对应协同蓝图
4. 再补 contracts
5. 最后才进入 `candidates` 或 `feature packet`
