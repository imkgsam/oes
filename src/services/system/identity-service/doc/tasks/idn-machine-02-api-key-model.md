# 4.6.2 机器凭据模型任务

更新时间：2026-03-23 15:20:00 +08:00

## 上游设计文档

- [../design/identity-center.md](../design/identity-center.md)
- [../design/machine-identity.md](../design/machine-identity.md)

## 当前承接范围

- 建立 `APIKey` 凭据模型

## 功能编号

- `4.6.2`

## 当前状态

- 未开始

## 最小闭环范围

- schema：定义 `APIKey`
- domain：启停、过期、撤销、轮换规则
- application：基础查询与管理入口
- infra：Repository 实现
- interface：gRPC 管理与查询接口
- doc：同步状态与验收结果

## 不包含范围

- 机器 token 签发
- OAuth2 client credentials

## 验收要求

- 一个 `ServiceAccount` 可拥有多个 `APIKey`
- 支持轮换、撤销、过期和使用审计的基础字段
- build 通过

## 关联设计文档

- [../design/machine-identity.md](../design/machine-identity.md)

## 阻塞项

- 依赖 `IDN-MACHINE-01`
