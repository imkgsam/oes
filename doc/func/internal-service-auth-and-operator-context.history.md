# 内部服务认证与可验签操作者上下文历史

## 2026-03-22 12:30:00 +09:00

### 本次目标

将跨模块方案从“可执行设计稿”继续升级为“全链路实现蓝图”，用于指导按模块分片实施。

### 修改范围

- [internal-service-auth-and-operator-context.md](D:/user/vic/code/code_base/on/oes/doc/func/internal-service-auth-and-operator-context.md)

### 主要改动

- 补充全链路授权分层说明
- 明确 `CheckPermission` 与 `CheckPermissionWithContext` 的职责分工
- 补充 `gateway` 的入口级粗粒度门禁职责
- 补充 `x-internal-service-name` 与 `x-operator-context` 的推荐编码与约束
- 明确 `Phase 1` 不采用“每请求实时调用 `auth-service` 远程签发”方案
- 为 `common`、`gateway`、`permission-service`、其他子服务、`auth-service` 分别补充详细分片步骤
- 新增跨模块优先级与推荐实现顺序

### 备注

- 当前文档已可作为“全链路 + 按模块”的分片实施蓝图
- 具体代码落地时，仍需分别更新各模块自己的功能文档与历史文档

## 2026-03-19 10:10:03 +08:00

### 本次目标

将根目录跨模块方案文档从“方向性说明”扩充为“可执行设计稿”，使后续在缺少额外上下文时也能按文档直接开始代码改造。

### 修改范围

- [internal-service-auth-and-operator-context.md](D:/user/vic/code/code_base/on/oes/doc/func/internal-service-auth-and-operator-context.md)

### 主要改动

- 补充文档目标，明确其为执行依据
- 补充术语定义
- 补充接口分类与保护要求表
- 补充 metadata / 上下文契约
- 补充 `InternalServiceGuard` 与 `OperatorContextGuard` 分层设计
- 补充 `gateway`、`auth-service`、`common`、`permission-service` 的模块级改造清单
- 将 Phase 1 细化为可执行的 5 个步骤
- 为每个步骤补充产出与验收标准
- 补充 Phase 1.5 / Phase 2 增强清单

### 备注

- 当前文档已可作为后续跨模块改造的基线设计稿
- 具体 metadata 编码格式、签名算法、以及某一步的代码实现方式，后续仍需在具体分片中继续细化

## 2026-03-19 09:58:12 +08:00

### 本次目标

将根目录 `doc` 也按“索引在根，功能文档与 history 在 `doc/func`”的规则收敛。

### 修改范围

- 根目录 `doc`

### 主要改动

- 新建根目录 `doc/func`
- 将当前跨模块功能文档与对应 history 移动到 `doc/func`
- 更新根目录 [INDEX.md](D:/user/vic/code/code_base/on/oes/doc/INDEX.md) 中的链接

### 备注

- `src/common/doc` 与 `src/services/api-gateway/doc` 当前为空目录，暂时无需调整
- 后续新增根目录跨模块方案文档时，统一放在 `doc/func`

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
