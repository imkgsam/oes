# 内部服务认证与可验签操作者上下文

更新时间：2026-03-19 10:10:03 +08:00

## 1. 文档目标

本文档不是纯方向说明，而是后续代码改造的执行依据。

目标是让后续在缺少额外上下文的情况下，仍然能够根据本文档直接开始分片开发：

- 明确模块职责
- 明确上下文契约
- 明确 guard 分层
- 明确 Phase 1 的具体改造顺序
- 明确每一步的验收标准

## 2. 背景与问题

`permission-service` 同时提供两类接口：

- 服务调用接口
- 业务管理接口

它们都通过内部服务链路访问，通常由 `gateway` 代理转发。

如果仅依赖以下模型：

1. 调用方是内部服务
2. `gateway` 告诉下游“当前操作者是谁”

则存在两个明显问题：

- 下游服务无法独立确认调用方是否可信
- 下游服务无法独立确认操作者身份是否被伪造

因此需要建立：

1. 内部服务身份认证
2. 可验签的操作者上下文

## 3. 设计结论

采用“方案 3：内部服务认证 + 可验签的用户上下文”。

核心规则：

- 所有进入下游服务的请求，都必须先通过内部服务身份认证
- 所有业务管理接口，都必须携带可验签的操作者上下文
- 下游服务必须自己验证操作者上下文，而不是仅信任 `gateway` 的裸字段转述
- 服务调用接口只要求内部服务身份，不要求后台操作者权限

## 4. 术语定义

### 4.1 内部服务认证

用于识别调用方服务是否为可信内部服务。

当前阶段默认基于证书或等价服务身份机制完成，不在本文档中展开具体 PKI 基础设施实现。

### 4.2 操作者上下文

由上游在完成外部用户身份校验后生成，并携带到下游的、可被下游服务独立验证的身份上下文。

该上下文不是裸 header，而是：

- 有固定结构
- 有签名
- 有有效期
- 可被下游独立校验

### 4.3 服务调用接口

给 `gateway` 或业务子服务调用的内部接口。

例如：

- `CheckPermission`
- `CheckPermissionWithContext`

### 4.4 业务管理接口

由后台业务操作触发、但经由内部服务链路转发的管理类接口。

例如：

- 角色管理
- 账号角色管理
- Permission 管理
- Policy 管理

## 5. 模块职责划分

## 5.1 gateway

负责：

- 校验外部用户 access token
- 提取用户身份与租户上下文
- 生成可验签的操作者上下文
- 作为内部服务调用下游服务
- 携带内部服务身份

不负责：

- 代替下游服务做最终业务授权
- 以裸字段形式让下游盲信当前用户身份

## 5.2 auth-service

负责：

- 用户认证
- access token 签发
- 公钥体系或等价验签基础设施

后续可扩展负责：

- 签发短期内部操作者声明
- 提供更强的签名能力隔离

## 5.3 common

负责承载跨服务一致的安全基础设施，不负责业务判断。

应提供：

- gRPC metadata 常量定义
- 操作者上下文结构定义
- 操作者上下文解析器
- 操作者上下文验签工具
- `InternalServiceGuard` 公共抽象
- `OperatorContextGuard` 公共抽象
- 可选的 decorator / metadata 工具

不负责：

- 判断系统管理员或租户管理员是否有业务权限

## 5.4 permission-service

负责：

- 校验调用方是否为可信内部服务
- 校验操作者上下文是否可验签、未篡改、未过期
- 对业务管理接口执行操作者授权判断
- 对服务调用接口执行内部服务接口保护

不负责：

- 外部用户登录认证
- access token 原始签发

## 6. 接口分类与保护要求

| 接口类型 | 示例 | 是否要求内部服务认证 | 是否要求操作者上下文 | 是否要求操作者授权 |
|---|---|---|---|---|
| 服务调用接口 | `CheckPermission`、`CheckPermissionWithContext` | 是 | 否 | 否 |
| 业务管理接口 | 角色管理、账号角色管理、Permission 管理、Policy 管理 | 是 | 是 | 是 |

说明：

- 所有接口都先要求内部服务认证
- 只有业务管理接口才要求操作者上下文和业务操作者授权

## 7. 调用链路

1. 外部请求进入 `gateway`
2. `gateway` 校验外部 access token
3. `gateway` 解析用户身份、租户上下文
4. `gateway` 生成可验签操作者上下文
5. `gateway` 携带内部服务身份 + 操作者上下文调用下游服务
6. `permission-service` 先执行内部服务认证
7. 若是业务管理接口，再执行操作者上下文验签
8. 若操作者上下文有效，再执行业务权限判断
9. 通过后进入具体 command / query handler

## 8. Metadata / 上下文契约

## 8.1 gRPC metadata 键名建议

Phase 1 先统一以下键名：

- `x-internal-service-name`
- `x-operator-context`

可选预留：

- `x-request-id`
- `x-trace-id`

说明：

- `x-internal-service-name` 用于标识调用方服务身份
- `x-operator-context` 为可验签操作者上下文载荷

## 8.2 操作者上下文字段

Phase 1 最小必需字段：

- `operator_id`
- `operator_type`
- `tenant_id`
- `issued_at`
- `expires_at`
- `issuer`
- `signature`

建议扩展字段：

- `operator_roles`
- `operator_permissions`
- `request_id`
- `trace_id`

## 8.3 字段语义

| 字段 | 是否必填 | 说明 |
|---|---|---|
| `operator_id` | 是 | 当前操作者 ID |
| `operator_type` | 是 | 操作者类型，例如账号用户 |
| `tenant_id` | 业务管理接口必须 | 当前租户上下文 |
| `issued_at` | 是 | 声明签发时间 |
| `expires_at` | 是 | 声明失效时间 |
| `issuer` | 是 | 签发方标识 |
| `signature` | 是 | 用于验证上下文未被篡改 |

## 8.4 Phase 1 约束

- 不在 Phase 1 强制要求 `operator_permissions`
- 不在 Phase 1 强制要求服务级 `scope`
- 不在 Phase 1 强制要求具体 `aud`

这些放到 Phase 1.5 再增强。

## 9. Guard 分层设计

## 9.1 InternalServiceGuard

职责：

- 校验调用请求是否来自可信内部服务

输入：

- 证书身份或等价服务身份
- `x-internal-service-name`

结果：

- 认证通过则继续
- 失败则拒绝请求

挂载范围：

- `permission-service` 所有开放 gRPC 接口

## 9.2 OperatorContextGuard

职责：

- 解析并验证 `x-operator-context`
- 校验签名、有效期、必要字段

输入：

- `x-operator-context`

结果：

- 验证通过则把解析后的操作者上下文挂入请求上下文
- 验证失败则拒绝请求

挂载范围：

- 仅业务管理接口

## 9.3 业务操作者授权

职责：

- 基于已验证的操作者上下文，判断其是否有权执行当前管理操作

实现位置建议：

- 优先在 `permission-service` 接口层或应用层的授权 guard / policy 中实现

说明：

- 这一步不等同于 `OperatorContextGuard`
- `OperatorContextGuard` 只负责“这个操作者身份是否可信”
- 业务操作者授权负责“这个可信身份是否有权做这件事”

## 10. 模块级改造清单

## 10.1 common

Phase 1 需要新增：

- 操作者上下文类型定义
- metadata 常量定义
- 操作者上下文解析工具
- 操作者上下文验签工具
- `InternalServiceGuard` 抽象
- `OperatorContextGuard` 抽象

可选新增：

- `@RequireOperatorContext()`
- `@ServiceInterface()`
- `@ManagementInterface()`

## 10.2 gateway

Phase 1 需要改造：

- 在完成外部 token 验证后生成 `x-operator-context`
- 调下游服务时携带：
  - `x-internal-service-name`
  - `x-operator-context`

当前阶段不要求：

- 对不同下游服务生成不同 scope

## 10.3 permission-service

Phase 1 需要改造：

- 所有 gRPC 接口接入 `InternalServiceGuard`
- 业务管理接口接入 `OperatorContextGuard`
- 在管理接口中开始使用已验证操作者上下文做授权决策

优先接入顺序建议：

1. `CheckPermission`
2. `CheckPermissionWithContext`
3. 账号角色管理接口
4. 角色管理接口
5. Permission / Policy 管理接口

## 10.4 auth-service

Phase 1 不要求改代码，前提是：

- 现有 access token 已支持被 `gateway` 正确验证

Phase 1.5 再评估是否需要：

- 把操作者上下文签发能力下沉到 `auth-service`

## 11. Phase 1 可执行实施清单

## Step 1：定义 common 契约与工具

目标：

- 在 `common` 中建立统一的 metadata 与操作者上下文基础设施

产出：

- 上下文类型
- metadata 常量
- 解析器
- 验签工具接口

验收标准：

- `common` 可独立被 `gateway` 与 `permission-service` 引用
- 不包含任何业务服务私有逻辑

## Step 2：gateway 生成并转发操作者上下文

目标：

- 让 `gateway` 在转发内部请求时携带标准化上下文

产出：

- `x-internal-service-name`
- `x-operator-context`

验收标准：

- `gateway -> permission-service` 请求中能稳定携带上述 metadata
- 上下文结构与 `common` 定义一致

## Step 3：permission-service 落地 InternalServiceGuard

目标：

- 为所有 gRPC 接口建立第一层服务身份保护

产出：

- `InternalServiceGuard`
- 对应模块挂载策略

验收标准：

- 未通过内部服务认证的请求无法访问任何开放接口
- 已认证内部服务可访问现有接口

## Step 4：permission-service 落地 OperatorContextGuard

目标：

- 为业务管理接口建立第二层操作者上下文保护

产出：

- `OperatorContextGuard`
- 管理接口挂载规则

验收标准：

- 业务管理接口缺少 `x-operator-context` 时拒绝请求
- 无效签名或过期上下文拒绝请求
- 服务调用接口不受该 guard 影响

## Step 5：permission-service 落地业务操作者授权

目标：

- 将“系统管理员 / 租户管理员”这类业务授权开始落到服务内

产出：

- 业务管理接口的操作者权限判断规则

验收标准：

- 租户管理员不能调用系统管理员专属操作
- 无权操作者不能调用租户管理接口

## 12. Phase 1.5 增强清单

- 引入服务级接口访问范围限制
- 增加 `aud`
- 增加 `scope`
- 增加 `service_name` 白名单校验
- 进一步缩短操作者上下文有效期

## 13. Phase 2 增强清单

- 评估是否由 `auth-service` 或专门签发方生成更短期内部声明
- 评估签名能力与 `gateway` 进程隔离
- 评估更强的集中授权能力

## 14. 已知限制

- Phase 1 仍默认所有可信内部服务都可访问“服务调用接口”
- Phase 1 还没有做到服务级最小权限
- 如果 `gateway` 与签名能力同时失陷，仍可能伪造操作者上下文

## 15. 后续使用规则

- 后续与本方案相关的代码改造，必须先对齐本文档中的 Step 编号
- 若实施顺序、metadata 契约、guard 设计发生变化，应先更新本文档再改代码
- 具体服务内落地细节，再分别记录到对应服务自己的 `doc/func` 文档中
