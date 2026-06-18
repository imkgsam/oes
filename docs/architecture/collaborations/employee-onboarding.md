# Employee Onboarding 协同蓝图

Last Updated: 2026-06-10

## 1. 目标

定义员工 onboarding 的最小跨服务协同方式。

`hr-service` 的 `Employee / Employment`、员工生命周期、正式 `人 -> org` 归属与 onboarding owner 边界只以 [hr-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/hr-service.md) 为准；本文只描述协同链。

## 2. 参与服务

- `api-gateway` / BFF
- `party-service`
- `hr-service`
- `identity-service`
- `permission-service`
- `tenant-org-service`

## 3. 真相归属

- `party-service`：当前租户内 `PERSON` TenantParty。
- `hr-service`：`Employee / Employment` 与 onboarding 业务结果。
- `identity-service`：`User / UserAccount / UserAccount <-> Employee` binding。
- `permission-service`：role / access grant。
- `tenant-org-service`：`OrgUnit` 与 org hierarchy validation。

## 4. 最小协同链

```txt
Create/Reuse PERSON TenantParty
  -> Create Employee(tenantPartyId)
  -> Create Employment -> OrgUnit
  -> optional Create/Bind UserAccount(tenantPartyId) -> Employee
  -> optional Grant Initial Role/Access
```

## 5. 两段式提交边界

### 5.1 正式 HR 入档段

- `party-service` 创建或复用当前租户 `PERSON` TenantParty。
- `hr-service` 创建 `Employee`。
- `hr-service` 创建 `Employment -> OrgUnit`。

这一段一旦成功，表示员工正式入档成立，不应因为后续账号或授权失败而回滚。

### 5.2 接入段

- `identity-service` 创建或绑定 `UserAccount`。
- 当 HR 已经解析出 `Employee.tenantPartyId` 并需要创建租户账号时，HR 必须通过 `CreateUserAccountRequest.tenant_party_id` 把同一个 `tenantPartyId` 传给 `identity-service`；Identity 收到该字段时复用它，不重新注册新的 `TenantParty`。
- `identity-service` 建立 `UserAccount <-> Employee` binding。
- `permission-service` 执行初始角色 / grant。

这一段失败时，只能把 onboarding 标记为待继续 / 待补偿，不能回滚已成立的 `TenantParty / Employee / Employment` 真相。

## 6. 一致性规则

- `Employee` 只使用 `tenantPartyId` 作为主体引用。
- `UserAccount <-> Employee` 绑定前必须校验：
  - 同 tenant。
  - `UserAccount.tenantPartyId == Employee.tenantPartyId`。
- `Employment -> OrgUnit` 是正式人到组织归属。
- account-org membership 或 UI projection 不得成为正式归属真相。

## 7. 明确禁止

- 不让 BFF 持有跨服务事务逻辑。
- 不让 `hr-service` 持久化账号绑定真相。
- 不让 `identity-service` 判断 employee lifecycle 或 active employment。
- 不让 `permission-service` 之外的服务直接写 account-role 绑定。
- 不在 minimum 第一阶段引入 payroll、attendance、performance、recruiting。

## 8. 关联文档

- [party-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/party-service.md)
- [hr-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/hr-service.md)
- [identity-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/identity-service.md)
- [permission-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/permission-service.md)
- [tenant-org-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/tenant-org-service.md)
