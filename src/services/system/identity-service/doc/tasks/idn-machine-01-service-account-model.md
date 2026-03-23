# 4.6.1 机器身份主体模型任务

更新时间：2026-03-23 15:20:00 +08:00

## 上游设计文档

- [../design/identity-center.md](../design/identity-center.md)
- [../design/machine-identity.md](../design/machine-identity.md)

## 当前承接范围

- 建立 `ServiceAccount` 主体模型

## 功能编号

- `4.6.1`

## 当前状态

- 未开始

## 最小闭环范围

- schema：定义 `ServiceAccount`
- domain：机器身份状态规则
- application：基础查询与管理入口
- infra：Repository 实现
- interface：gRPC 管理与查询接口
- doc：同步状态与验收结果

## 不包含范围

- `APIKey`
- 机器认证
- delegation token

## 验收要求

- 可表达租户级和系统级机器主体
- 可区分内部服务、外部客户端、AI、自动化服务
- build 通过

## 关联设计文档

- [../design/machine-identity.md](../design/machine-identity.md)

## 阻塞项

- Phase 3 任务，当前不优先开发
