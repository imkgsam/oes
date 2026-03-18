# 内部服务认证与可验签操作者上下文历史

## 2026-03-18 17:40:01 +08:00

### 本次目标

将“方案 3：内部服务认证 + 可验签的用户上下文”整理为根目录跨模块设计文档。

### 修改范围

- 仓库根目录 `doc`

### 主要改动

- 新建 [internal-service-auth-and-operator-context.md](D:/user/vic/code/code_base/on/oes/doc/internal-service-auth-and-operator-context.md)
- 新建对应历史文档
- 新建根目录 [INDEX.md](D:/user/vic/code/code_base/on/oes/doc/INDEX.md)
- 明确各模块职责：
  - `gateway`
  - `auth-service`
  - `common`
  - `permission-service`

### 备注

- 当前文档先描述 Phase 1 目标方案
- 具体 metadata 字段、签名格式、guard 实现方式后续再拆成功能分片推进
