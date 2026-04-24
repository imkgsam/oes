# hr-service Contracts

## 1. 目的

本目录用于提供 `hr-service` minimum 第一阶段的黑盒接口文档。

这些文档面向：

- `api-gateway`
- `party-service`
- `tenant-org-service`
- `identity-service`
- `permission-service`
- 后续需要消费正式员工事实的业务服务

## 2. 模块划分

- [query.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/hr-service/query.md)
  - 员工与任职只读查询
- [management.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/hr-service/management.md)
  - 员工建档、任职写接口与 minimum onboarding owner 语义

## 3. 全局调用约束

- 所有接口均为内部服务接口，不直接对外部客户端开放。
- `hr-service` 是 `Employee / Employment` 真相 owner，不是账号、角色或组织树 owner。
- 正式 `人 -> org` 真相在 `Employment -> OrgUnit`。
- `account -> org` 只能作为 compatibility / projection，不能被调用方视为正式 HR 归属 owner。

## 4. 当前能力范围

截至 minimum 第一阶段，`hr-service` 只冻结以下能力：

- 员工目录查询
- 员工主档查询
- 任职记录查询
- 创建员工
- 创建任职
- 结束任职 / 调岗所需的受控写语义

当前不包含：

- payroll
- attendance
- performance
- recruiting
- 完整岗位体系
- 角色 / 权限 owner 能力
