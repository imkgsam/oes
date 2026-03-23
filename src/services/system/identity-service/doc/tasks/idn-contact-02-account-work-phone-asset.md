# 4.5.2 企业手机资产绑定任务

更新时间：2026-03-23 15:20:00 +08:00

## 上游设计文档

- [../design/identity-center.md](../design/identity-center.md)
- [../design/contact-asset.md](../design/contact-asset.md)

## 当前承接范围

- 建立企业手机资产绑定模型与最小管理闭环

## 功能编号

- `4.5.2`

## 当前状态

- 未开始

## 最小闭环范围

- schema：工作手机资产表
- domain：分配、回收、启停规则
- application：Command / Query + Handler
- infra：Repository 实现
- interface：gRPC 管理与查询接口
- doc：同步状态与验收结果

## 不包含范围

- 短信平台管理
- 号码资源池运营

## 验收要求

- 企业手机可作为账户资产被分配和回收
- 支持主手机号标记和状态变更
- build 通过

## 关联设计文档

- [../design/contact-asset.md](../design/contact-asset.md)

## 阻塞项

- Phase 2 任务，当前不优先开发
