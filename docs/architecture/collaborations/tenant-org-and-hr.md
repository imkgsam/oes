# Tenant-Org 与 HR 协同蓝图

## 1. 目标

定义 OES 中 `tenant-org-service` 与 `hr-service` 的长期边界，回答：

- `OrgUnit` 与 `Employee / Employment` 各自由谁拥有
- “组织结构真相”与“人员归属真相”如何拆分
- 为什么 `tenant-org-service` 第一版不直接承接人员归属

`tenant-org-service` 的 `Tenant / OrgUnit / org tree` 边界以 [tenant-org-service.md](../services/tenant-org-service.md) 为准；`hr-service` 的 `Employee / Employment` 与正式 `人 -> org` 归属边界以 [hr-service.md](../services/hr-service.md) 为准。本文只记录两者如何协同，不重新定义服务核心对象。

## 2. 参与服务

- `tenant-org-service`
- `hr-service`
- `party-service`
- `identity-service`

## 3. 真相归属

- `tenant-org-service`
  - `Tenant`、`OrgUnit`、org tree、org hierarchy 与 org reference validation 边界以 [tenant-org-service.md](../services/tenant-org-service.md) 为准
- `hr-service`
  - `Employee / Employment`、员工是否成立、员工任职到哪个 `OrgUnit`、主任职组织与后续岗位 / 汇报关系边界以 [hr-service.md](../services/hr-service.md) 为准

## 4. 核心边界

- `tenant-org-service` 回答“tenant 如何组织”。
- `hr-service` 按服务真相源回答“正式 employee 如何任职到这些组织节点”。
- `tenant-org-service` 不拥有 `employee -> org` 或 `account -> org` 的长期归属真相。
- `hr-service` 不拥有 org tree 本体，只引用 `OrgUnit`。
- 正式 `人 -> org` 真相的 HR 口径以 [hr-service.md](../services/hr-service.md) 为准，不来自 account membership 或兼容查询字段。

## 5. 协作链路

建议长期链路如下：

```txt
Party(Person)
  -> Employee (HR)
  -> Employment -> OrgUnit (Tenant-Org)
  -> optional UserAccount (Identity)
```

解释：

- `party-service` 回答“这个自然人是谁”
- `hr-service` 回答“这个自然人是否构成员工，以及如何任职”
- `tenant-org-service` 回答“组织树和组织节点是什么”
- `identity-service` 回答“这个人如何登录、有哪些 account”
- 若需要 account 视角的 org 数据，只能由 `Employment` 派生 projection，不能再形成第二份 owner 真相

## 6. 第一版实施规则

- `tenant-org-service` 第一版不落 `AccountOrgMembership`
- `tenant-org-service` 第一版不落 `Employee / Employment`
- 未来如需 org-based scope，应由 `hr-service` 的正式任职事实驱动
- 若需要为权限或会话做投影，只能是受控 projection，不能形成第二份人员归属真相
- account-org membership 只允许以 compatibility / projection 口径继续存在，不能作为 HR onboarding 或正式 employee 归属链的 owner

## 7. 明确禁止

- 不让 `tenant-org-service` 先临时拥有人员归属真相再等待 HR 替换
- 不让 `account -> org` 与 `employment -> org` 形成双真相
- 不把外部协作人员或低权限账号错误建模成正式 employee

## 8. 关联文档

- [tenant-org-service.md](../services/tenant-org-service.md)
- [hr-service.md](../services/hr-service.md)
