# 4.4.3 账户多组织归属任务

更新时间：2026-03-23 15:20:00 +08:00

## 上游设计文档

- [../design/identity-center.md](../design/identity-center.md)
- [../design/organization-structure.md](../design/organization-structure.md)

## 当前承接范围

- 建立账户多组织归属能力

## 功能编号

- `4.4.3`

## 当前状态

- 未开始

## 最小闭环范围

- schema：增加账户组织归属关联表
- domain：主归属与附属归属规则
- application：Command / Query + Handler
- infra：Repository 实现
- interface：gRPC 管理与查询接口
- doc：同步状态与验收结果

## 不包含范围

- 复杂跨组织审批规则

## 验收要求

- 一个账户可归属多个组织
- 可区分主组织和附属组织
- build 通过

## 关联设计文档

- [../design/organization-structure.md](../design/organization-structure.md)

## 阻塞项

- 依赖 `IDN-ORG-02`
