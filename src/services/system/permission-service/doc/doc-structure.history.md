# 文档结构调整历史

## 2026-03-19 10:16:12 +08:00

### 本次目标

将 `permission-service` 的索引文档 `FEATURE_CHECKLIST.md` 改名为 `INDEX.md`，并在索引中为功能集合补充编号。

### 主要改动

- 将 `FEATURE_CHECKLIST.md` 重命名为 [INDEX.md](D:/user/vic/code/code_base/on/oes/src/services/system/permission-service/doc/INDEX.md)
- 将功能集合索引项补充为带编号形式：
  - `4.2 角色管理`
  - `4.3 账号角色管理`
  - `4.4 权限管理`
  - `4.5 Policy 管理`
  - `4.6 鉴权能力`
- 调整文档结构历史中的旧文件名描述

### 备注

- 后续此服务内不再使用 `FEATURE_CHECKLIST.md` 作为索引文件名
- 根目录与其他服务若后续采用同样结构，也建议统一使用 `INDEX.md`

## 2026-03-19 10:19:56 +08:00

### 本次目标

为 `permission-service` 功能集合文档中的功能项统一补充编号，便于后续讨论、引用和分片推进。

### 主要改动

- 在以下功能集合文档中新增“功能编号”列：
  - [role-management.md](D:/user/vic/code/code_base/on/oes/src/services/system/permission-service/doc/func/role-management.md)
  - [account-role-management.md](D:/user/vic/code/code_base/on/oes/src/services/system/permission-service/doc/func/account-role-management.md)
  - [permission-management.md](D:/user/vic/code/code_base/on/oes/src/services/system/permission-service/doc/func/permission-management.md)
  - [policy-management.md](D:/user/vic/code/code_base/on/oes/src/services/system/permission-service/doc/func/policy-management.md)
  - [authorization.md](D:/user/vic/code/code_base/on/oes/src/services/system/permission-service/doc/func/authorization.md)
- 编号规则与索引保持一致：
  - `4.2.x`
  - `4.3.x`
  - `4.4.x`
  - `4.5.x`
  - `4.6.x`

### 备注

- 后续新增功能项时，应继续沿用该编号体系
- 若中间插入新项，优先使用末尾新增，避免频繁改动既有编号

## 2026-03-19 09:47:39 +08:00

### 本次目标

将 `permission-service/doc` 的功能文档与对应历史文档统一迁移到 `doc/func`，保留索引文档在 `doc` 根目录。

### 主要改动

- 保留索引文档与 [HISTORY.md](D:/user/vic/code/code_base/on/oes/src/services/system/permission-service/doc/HISTORY.md) 在原位置
- 新建 `doc/func`
- 将角色、账号角色、Permission、Policy、鉴权的主文档与历史文档移动到 `doc/func`
- 更新索引文档中的所有链接

### 备注

- 后续新增功能集合文档时，统一放在 `doc/func`
- 只有索引类文档、迁移类文档、文档结构类文档保留在 `doc` 根目录
