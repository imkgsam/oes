# Permission Service 历史索引

更新时间：2026-03-18 17:40:01 +08:00

本文档只作为 `permission-service` 历史索引使用，不再记录所有细节流水账。

## 功能集合历史

| 功能集合 | 历史文档 | 说明 |
|---|---|---|
| 角色管理 | [role-management.history.md](D:/user/vic/code/code_base/on/oes/src/services/system/permission-service/doc/role-management.history.md) | 角色相关功能改造、核查与设计变更历史 |
| 账号角色管理 | [account-role-management.history.md](D:/user/vic/code/code_base/on/oes/src/services/system/permission-service/doc/account-role-management.history.md) | 账号与角色绑定相关功能历史 |
| 权限管理 | [permission-management.history.md](D:/user/vic/code/code_base/on/oes/src/services/system/permission-service/doc/permission-management.history.md) | Permission 相关功能与结构调整历史 |
| Policy 管理 | [policy-management.history.md](D:/user/vic/code/code_base/on/oes/src/services/system/permission-service/doc/policy-management.history.md) | Policy 设计、接口与实现历史 |
| 鉴权能力 | [authorization.history.md](D:/user/vic/code/code_base/on/oes/src/services/system/permission-service/doc/authorization.history.md) | `CheckPermission`、上下文鉴权与安全约束历史 |

## 迁移说明

- 原先集中写在本文件中的历史，已按功能集合拆分。
- 后续新增变更记录时，应优先写入对应功能集合历史文档。
- 若某次变更同时影响多个功能集合，可在多个历史文档中分别记录，并互相引用。
