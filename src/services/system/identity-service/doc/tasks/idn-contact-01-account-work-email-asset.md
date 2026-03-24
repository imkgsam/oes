# 4.5.1 企业邮箱资产绑定任务

更新时间：2026-03-24 12:20:00 +09:00

## 上游设计文档

- [../design/identity-center.md](../design/identity-center.md)
- [../design/contact-asset.md](../design/contact-asset.md)

## 当前承接范围

- 建立企业邮箱资产绑定模型与最小管理闭环

## 功能编号

- `4.5.1`

## 当前状态

- 已实现

## 最小闭环范围

- schema：工作邮箱资产表
- domain：分配、回收、启停规则
- application：Command / Query + Handler
- infra：Repository 实现
- interface：gRPC 管理与查询接口
- doc：同步状态与验收结果

## 不包含范围

- 邮件服务器管理
- 邮件审查与内容过滤

## 验收要求

- 企业邮箱可作为账户资产被分配和回收
- 支持主邮箱标记和状态变更
- build 通过

## 关联设计文档

- [../design/contact-asset.md](../design/contact-asset.md)

## 阻塞项

- 当前无

## 备注

- 已落 `AccountContactAsset` schema、repository、CQRS 与 gRPC 闭环
- 当前支持分配、回收、启停、主邮箱切换、账户下工作邮箱列表查询
- 本次仅开放 `WORK_EMAIL`，`WORK_PHONE` 仍留待 `5.2`
