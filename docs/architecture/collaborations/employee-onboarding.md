# Employee Onboarding 协同蓝图

## 1. 目标

定义 OES 中员工 onboarding 的最小跨服务协同方式，冻结：

- 谁拥有 onboarding 业务结果
- `party-service`、`hr-service`、`identity-service`、`permission-service`、`api-gateway/BFF` 如何配合
- 失败时哪些事实可保留、哪些只能进入待补偿状态

`hr-service` 的 `Employee / Employment`、员工生命周期、正式 `人 -> org` 归属与 onboarding owner 边界只以 [hr-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/hr-service.md) 为准；`identity-service` 的 `User / UserAccount / UserAccount <-> Employee` binding 长期边界只以 [identity-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/identity-service.md) 为准；本文只记录员工 onboarding 协同方式，不重新定义任一服务核心对象。

## 2. 参与服务

- `api-gateway` / BFF
- `party-service`
- `hr-service`
- `identity-service`
- `permission-service`
- `tenant-org-service`，用于 `OrgUnit` 校验与摘要查询

## 3. 真相归属

- `party-service`
  - 提供 `PersonParty / TenantParty` 主体事实；核心对象与 owner 边界以 [party-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/party-service.md) 为准
- `hr-service`
  - `Employee / Employment` 与 onboarding owner 边界以 [hr-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/hr-service.md) 为准
- `identity-service`
  - `User / UserAccount / UserAccount <-> Employee` binding 边界以 [identity-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/identity-service.md) 为准
- `permission-service`
  - role / access grant
- `tenant-org-service`
  - `OrgUnit`
  - org hierarchy / validation

## 4. owner 边界

- `api-gateway/BFF` 只负责收集输入、显示状态和触发命令，不拥有核心 onboarding 规则。
- `hr-service` 是 onboarding 的业务 owner；minimum 第一阶段由其 application orchestration 负责串联跨服务步骤。
- `party-service` 只按 [party-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/party-service.md) 提供主体事实与租户主体引用，不拥有 employee、employment、account、role grant 语义。
- `identity-service` 按唯一真相源提供 account identity 与 `UserAccount <-> Employee` binding 能力。
- `permission-service` 只负责初始角色 / grant；HR、Identity、BFF 都不能直接写角色绑定。

## 5. 协同链

推荐最小链路如下：

```txt
Create/Reuse party subject + tenant party reference
  -> Create Employee
  -> Create Employment -> OrgUnit
  -> optional Create/Bind UserAccount -> Employee
  -> optional Grant Initial Role/Access
```

## 6. 两段式提交边界

### 6.1 正式 HR 入档段

- `party-service` 创建或复用主体事实与租户主体引用
- `hr-service` 创建 `Employee`
- `hr-service` 创建 `Employment -> OrgUnit`

这一段一旦成功，表示“员工正式入档”已经成立，不应因为后续账号或授权失败而回滚。

### 6.2 接入段

- `identity-service` 创建或绑定 `UserAccount`
- `identity-service` 建立 `UserAccount <-> Employee` 绑定
- `permission-service` 执行初始角色 / grant

这一段失败时，只能把 onboarding 标记为待继续 / 待补偿，不能回滚已成立的 `Party / Employee / Employment` 真相。

### 6.3 接入段失败语义

- 若 account 创建或 binding 失败：
  - `Party / Employee / Employment` 保持成立
  - `hr-service` 返回并持有 `ACCOUNT_BINDING_PENDING` 类补偿状态
  - 后续只能重试 account 创建 / binding，不得重新创建 Employee
- 若 account 已创建 / 已绑定，但 permission grant 失败：
  - `Party / Employee / Employment` 保持成立
  - `UserAccount <-> Employee` binding 保留
  - 该 account 在 grant 成功前不得成为可登录且具备业务访问能力的 active account
  - `hr-service` 返回并持有 `ACCESS_GRANT_PENDING` 类补偿状态
  - 后续由 HR onboarding orchestration 以幂等方式重试 `permission-service` grant
- access 段补偿成功后，onboarding 才能进入 completed 状态。

## 7. 最小协同一致性规则

- HR 对象、主引用、唯一性与正式 `人 -> org` 归属规则以 [hr-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/hr-service.md) 为准；本文只约束 onboarding 协同链不得反向制造第二真相。
- `UserAccount <-> Employee` 绑定前，应校验：
  - 同 tenant
  - 同自然人主体
  - 即 `identity.User.partyId` 与该 `Employee` 上游 person party 对应一致

## 8. 明确禁止

- 不让 `account -> org` 成为正式真相。
- 不让 legacy account-org membership API 成为 onboarding 主链 owner。
- 不让 BFF 持有跨服务事务逻辑。
- 不让 `permission-service` 之外的服务直接写 account-role 绑定。
- 不在 minimum 第一阶段引入 payroll、attendance、performance、recruiting。

## 9. 后续仍待冻结

- access package 的 shape 与选择策略
- party merge / tenant party deactivate 后对 Employee 与 binding 的修复链

## 10. 关联文档

- [party-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/party-service.md)
- [hr-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/hr-service.md)
- [identity-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/identity-service.md)
- [permission-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/permission-service.md)
- [tenant-org-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/tenant-org-service.md)
