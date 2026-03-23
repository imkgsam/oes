# 4.4.2 账户主组织绑定任务

更新时间：2026-03-23 15:20:00 +08:00

## 上游设计文档

- [../design/identity-center.md](../design/identity-center.md)
- [../design/organization-structure.md](../design/organization-structure.md)

## 当前承接范围

- 为 `UserAccount` 建立主组织绑定能力

## 功能编号

- `4.4.2`

## 当前状态

- 未开始

## 最小闭环范围

- schema：为账户增加主组织关联
- domain：主组织绑定规则
- application：Command + Handler
- infra：Repository 实现
- interface：gRPC 管理接口
- doc：同步状态与验收结果

## 不包含范围

- 多组织归属
- 复杂组织权限继承

## 验收要求

- 一个账户可绑定一个主组织
- 允许账户暂时无主组织
- build 通过

## 关联设计文档

- [../design/organization-structure.md](../design/organization-structure.md)

## 阻塞项

- 依赖 `IDN-ORG-01`
