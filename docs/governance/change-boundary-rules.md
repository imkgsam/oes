# OES 变更边界规则

## 1. 目的

本文档用于定义 OES 项目中的变更分级与处理流程，使不同线程可以快速判断一个改动属于什么级别，以及必须走什么治理路径。

## 2. 变更类型定义

### 2.1 单模块变更

单模块变更指：

- 只影响一个服务或一个独立模块内部
- 不修改共享契约
- 不修改架构文档
- 不改变租户、权限、AI、operator context 等平台语义
- 不影响其他服务的实现边界

典型特征：

- 修改路径可限定在一个服务内
- 不需要其他服务同步调整

### 2.2 跨模块变更

跨模块变更指：

- 影响多个服务或多个模块
- 需要多个线程协同
- 需要调整共享契约、共享接口或跨服务协作方式
- 但尚未上升到系统级架构重定义

典型特征：

- 不止一个实现线程会受影响
- 需要统一计划拆分

### 2.3 架构级变更

架构级变更指：

- 改变系统边界、上下文边界或平台语义
- 改变 gRPC / Event / common / tenant / IAM / AI 等全局基础约束
- 影响未来多个线程的工作方式

典型特征：

- 需要修改 `AGENTS.md`
- 需要修改 `docs/architecture/**`
- 往往需要新增或更新 ADR

## 3. 不同变更类型必须走的流程

### 3.1 单模块变更流程

1. plan thread 判断为单模块变更
2. 分配 implementation thread
3. implementation thread 在授权路径内实现
4. review thread 审核
5. integration thread 或直接收口

约束：

- 不得修改受保护文件

### 3.2 跨模块变更流程

1. plan thread 识别跨模块影响
2. 若边界已清晰，则拆分多个 implementation threads
3. 若共享边界需要调整，则先升级 architecture thread
4. review thread 分别审核
5. integration thread 集成收口

约束：

- 不允许把跨模块变更伪装成多个无关联单模块变更

### 3.3 架构级变更流程

1. architecture thread 识别与定义变更
2. 更新架构文档
3. 必要时新增或更新 ADR
4. plan thread 基于新边界重新拆分任务
5. 后续 implementation threads 再进入实现

约束：

- 在架构边界未冻结前，不允许普通实现线程继续推进相关实现

## 4. 基础示例

### 4.1 修改 permission schema 属于什么级别

- 如果只是 `permission-service` 内部局部表结构调整，且不影响对外契约与权限语义，属于单模块变更。
- 如果会影响权限判定逻辑、跨服务授权语义、共享 DTO 或事件，则属于跨模块变更。
- 如果改变 RBAC / scope / policy 的平台语义，则属于架构级变更。

### 4.2 修改 proto 属于什么级别

- proto 属于共享契约边界。
- 只要 proto 会被其他服务依赖，默认至少属于跨模块变更。
- 如果 proto 变更同时改变系统通信规则、版本策略或上下文边界，则属于架构级变更。

### 4.3 修改 common 包属于什么级别

- 修改 `common` 内部实现且不影响公共 API，可按局部平台变更处理。
- 修改 `common` 对外公共接口、公共抽象、公共契约辅助能力，默认属于跨模块变更。
- 修改 `common` 中承载全局语义的基础能力，例如认证、传输、contracts、operator context 支撑，通常属于架构级变更。

## 5. 结合 OES 当前模块现状的真实案例

### 5.1 `src/common`

#### 案例 A：修改 `src/common/src/logging/**` 内部输出字段顺序，但不改变对外 API

结论：

- 跨模块变更

原因：

- 会影响多个服务的日志行为与运维使用方式
- 虽然不是业务架构级，但已超出单服务边界

#### 案例 B：修改 `src/common/src/contracts/**`

结论：

- 默认至少是跨模块变更
- 如果连契约治理方式一起调整，则是架构级变更

#### 案例 C：修改 `src/common/src/authorization/**` 中 operator context 结构

结论：

- 架构级变更

原因：

- 直接影响认证、授权、审计、跨服务上下文传播

#### 案例 D：往 `src/common` 新增一个仅供单服务自己使用的小工具

结论：

- 不应直接作为普通实现处理
- 先判断是否真的属于公共能力
- 在大多数情况下，这应被视为边界治理问题

### 5.2 proto

#### 案例 A：修改 permission 相关 proto 字段名

结论：

- 跨模块变更

原因：

- 会影响调用方与生成代码

#### 案例 B：调整 proto 包名、版本策略、breaking change 规则

结论：

- 架构级变更

### 5.3 `src/services/api-gateway`

#### 案例 A：只修改 `api-gateway` 内部 HTTP controller 映射，不影响共享契约

结论：

- 单模块变更

#### 案例 B：修改 Gateway 与下游服务的调用契约适配方式，要求下游同步调整

结论：

- 跨模块变更

#### 案例 C：改变 Gateway、BFF、APISIX 的职责分工

结论：

- 架构级变更

### 5.4 `src/services/system/auth-service`

#### 案例 A：修改登录流程内部校验细节，不影响 token 结构和对外接口

结论：

- 单模块变更

#### 案例 B：修改 token payload 结构，导致 Gateway 或其他服务解析方式变化

结论：

- 跨模块变更

#### 案例 C：改变 auth 与 identity 的职责边界

结论：

- 架构级变更

### 5.5 `src/services/system/identity-service`

#### 案例 A：只修改 identity 内部查询逻辑或 repository 实现

结论：

- 单模块变更

#### 案例 B：修改 account 与 entity 的映射契约，影响 `entity-service` 或 `auth-service`

结论：

- 跨模块变更

#### 案例 C：改变 identity、entity、tenant 的归属关系

结论：

- 架构级变更

### 5.6 `src/services/system/permission-service`

#### 案例 A：仅修改 `permission-service` 内部 repository 实现或查询优化

结论：

- 单模块变更

#### 案例 B：修改权限判定结果结构，影响 Gateway 或其他服务调用

结论：

- 跨模块变更

#### 案例 C：改变 RBAC / scope / policy 的平台语义

结论：

- 架构级变更

### 5.7 `permission-service` schema 具体案例

#### 案例 A：给内部表新增一个仅用于本服务内部统计的非共享字段

结论：

- 单模块变更

#### 案例 B：修改 schema 导致对外 DTO、proto、授权语义同步变化

结论：

- 跨模块变更

#### 案例 C：修改 schema 背后的权限模型定义，例如 role 与 policy 的根本关系

结论：

- 架构级变更

## 6. 受保护路径与变更级别的关系

以下路径一旦修改，默认不能视为普通单模块变更：

- `AGENTS.md`
- `docs/architecture/**`
- `docs/governance/**`
- `docs/adr/**`
- `src/common/src/contracts/**`
- `src/common/src/generated/**`
- 所有 proto 文件
- `src/common` 中会影响公共边界的文件

## 7. 快速判断规则

可以用以下问题快速判断：

1. 只影响一个服务内部吗？
2. 其他服务是否要同步改？
3. 是否触碰共享契约、公共接口、租户/权限/AI 语义？
4. 是否需要修改受保护文件？

判定原则：

- 只有第 1 个问题为“是”，且后 3 个问题都为“否”，才可视为单模块变更。
- 只要其他服务需要同步改，至少是跨模块变更。
- 只要改变平台语义或受保护边界，就是架构级变更。

## 8. 结论

OES 的变更分级不是形式化分类，而是用于约束线程行为。

简单说：

- 只改自己服务内部，且不碰共享边界，才算单模块变更
- 一旦碰共享边界，至少是跨模块变更
- 一旦改变系统语义或未来协作规则，就是架构级变更
