# Identity Service 路线图

更新时间：2026-03-24 11:02:00 +09:00

## Phase 1：身份查询基线

目标：

- 建立 `identity-service` 的文档、gRPC、CQRS 结构基线
- 先支撑 `auth-service` 当前所需的身份查询闭环

范围：

- gRPC + CQRS 基线
- `User` 查询
- `UserAccount` 查询
- `Tenant` 最小查询

优先任务：

1. `IDN-FOUNDATION-01`
2. `IDN-USER-01`
3. `IDN-USER-02`
4. `IDN-USER-03`
5. `IDN-ACCOUNT-01`
6. `IDN-ACCOUNT-02`
7. `IDN-TENANT-01`

## Phase 2：身份管理与组织结构

目标：

- 补齐账户管理和租户管理基础能力
- 正式落地组织树与账户归属

范围：

- `Org` 查询与管理
- 账户主组织绑定
- 多组织归属
- 企业联系方式资产管理

优先任务：

1. `IDN-ORG-01`
2. `IDN-ORG-02`
3. `IDN-ORG-03`
4. `IDN-CONTACT-01`
5. `IDN-CONTACT-02`

## Phase 3：机器身份

目标：

- 为外部 API、内部服务、AI、自动化服务提供机器身份主数据基础

范围：

- `ServiceAccount`
- `APIKey`
- 后续机器凭据扩展预留

优先任务：

1. `IDN-MACHINE-01`
2. `IDN-MACHINE-02`

## 当前判断

当前进度判断：

- `Phase 1` 已完成
- `Phase 2` 中组织结构分片已完成：
  - `IDN-ORG-01`
  - `IDN-ORG-02`
  - `IDN-ORG-03`
- 当前建议下一步进入联系方式资产分片：
  - `IDN-CONTACT-01`
  - `IDN-CONTACT-02`

当前应优先推进 `IDN-CONTACT-01`。原因：

- 组织结构最小闭环已经完成
- `identity-service` 还缺企业联系方式资产这一层正式主数据
- 联系方式资产比机器身份更贴近现阶段账号与租户边界能力建设
