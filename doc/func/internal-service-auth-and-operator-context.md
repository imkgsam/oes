# 内部服务认证与可验签操作者上下文

更新时间：2026-03-22 12:30:00 +09:00

## 1. 文档目标

本文档不是方向性说明，而是本轮跨模块改造的执行蓝图。

目标：

- 解释整条“外部请求 -> gateway -> 内部服务 -> 资源授权”链路
- 明确 `gateway`、`common`、`permission-service`、`auth-service`、其他子服务的职责边界
- 明确 `x-internal-service-name` 与 `x-operator-context` 的定位
- 明确 guard 分层与业务授权分层
- 提供按模块拆分、按优先级排序、可直接实施的分片清单

## 2. 背景与问题

当前 `oes` 的真实授权链路不是单点鉴权，而是多层协作：

1. 外部用户先进入 `gateway`
2. `gateway` 负责用户 token 校验
3. `gateway` 负责入口级路由访问控制与粗粒度权限门禁
4. `gateway` 再调用下游子服务
5. 下游子服务还需要确认：
   - 调用方服务是否可信
   - 操作者身份是否可信
   - 当前操作者是否真的有权执行该动作
   - 对具体资源是否满足细粒度授权条件

如果没有统一方案，至少会出现以下问题：

- 下游服务无法独立确认调用方是否真的是可信内部服务
- 下游服务只能盲信上游传来的裸 `operator_id`
- `gateway` 与下游服务职责混乱，粗粒度与细粒度授权边界不清
- 不同子服务各自实现一套内部信任模型，长期不可维护

## 3. 设计结论

采用“方案 3：内部服务认证 + 可验签的操作者上下文 + 分层授权”。

核心规则：

- 所有进入下游子服务的请求，都必须先通过内部服务身份认证
- 所有业务管理接口，都必须携带可验签的操作者上下文
- `gateway` 负责外部认证和入口级粗粒度门禁，不替代下游做最终资源授权
- 下游子服务必须自己验证操作者上下文，而不是盲信上游裸字段
- 服务调用接口只要求内部服务身份
- 业务管理接口要求内部服务身份 + 操作者上下文 + 服务内业务授权

## 4. 全链路授权分层

本方案是分层协作，不是单点鉴权。

| 层级 | 执行位置 | 目标 | 典型能力 |
|---|---|---|---|
| L1 | `gateway` | 区分公开 / 登录后 / 需权限接口 | 路由访问分类 |
| L2 | `gateway` | 认证外部用户 | access token 校验 |
| L3 | `gateway` | 对入口做粗粒度权限门禁 | `CheckPermission` |
| L4 | 子服务入口 | 验证调用方是否为可信内部服务 | `InternalServiceGuard` |
| L5 | 子服务入口 | 验证操作者上下文是否可信 | `OperatorContextGuard` |
| L6 | 子服务接口层 / 应用层 | 判断操作者是否有权做该管理动作 | `ManagementAuthorizationGuard` 或等价授权器 |
| L7 | 子服务应用层 / 领域层 | 判断具体资源是否满足细粒度授权条件 | `CheckPermissionWithContext` / 本地 ABAC |

## 5. 两个鉴权接口的角色分工

### 5.1 `CheckPermission`

定位：

- 入口级、粗粒度、RBAC 优先

适用场景：

- `gateway` 对接口做预门禁
- 菜单 / 页面 / 按钮 / 基础操作访问控制
- 需要快速 fail-fast 的基础权限检查

### 5.2 `CheckPermissionWithContext`

定位：

- 资源级、上下文参与、RBAC + ABAC

适用场景：

- 子服务针对具体资源做最终授权判断
- 需要 `subject/resource/environment/action` 参与决策
- 租户隔离、资源归属、时间窗口、IP 限制、资源类型限制等细粒度授权

### 5.3 结论

- `CheckPermission` 不替代 `CheckPermissionWithContext`
- `CheckPermissionWithContext` 也不替代入口粗粒度门禁
- 两者在全链路中职责不同，应该并存

## 6. 术语定义

### 6.1 内部服务认证

用于识别调用方服务是否为可信内部服务。

当前推荐基线：

- 底层基于 `mTLS` 或等价服务身份机制
- 应用层用 `x-internal-service-name` 表达“调用方服务名”

说明：

- `x-internal-service-name` 本身不是信任根
- 真正可信应建立在证书、服务身份、sidecar、service mesh 或等价机制之上
- `Nacos` 可用于服务发现、可信服务配置下发，但不能代替调用方身份认证本身

### 6.2 操作者上下文

由上游在完成外部用户身份校验后生成，并携带到下游的、可被下游独立验证的身份上下文。

它不是裸 header，而是：

- 有固定结构
- 有签名
- 有有效期
- 可被下游独立校验

### 6.3 服务调用接口

给 `gateway` 或业务子服务调用的内部接口。

例如：

- `CheckPermission`
- `CheckPermissionWithContext`

### 6.4 业务管理接口

由后台业务操作触发、但经由内部服务链路转发的管理类接口。

例如：

- 角色管理
- 账号角色管理
- Permission 管理
- Policy 管理
- 其他业务子服务中的后台管理型接口

## 7. 模块职责划分

### 7.1 `api-gateway`

负责：

- 校验外部用户 access token
- 对路由做“公开 / 登录后 / 需权限”访问分类
- 对入口执行粗粒度 RBAC 门禁，优先调用 `CheckPermission`
- 提取用户身份与租户上下文
- 生成可验签的操作者上下文
- 作为内部服务调用下游服务
- 携带内部服务身份

不负责：

- 替代下游服务做最终资源授权
- 以裸字段形式让下游盲信当前用户身份
- 替代下游决定 ABAC 细粒度资源访问

### 7.2 `auth-service`

负责：

- 用户认证
- access token 签发
- 公钥体系或等价验签基础设施
- 后续 signer 能力的演进入口

当前阶段说明：

- `Phase 1` 默认不让 `gateway` 每个请求都同步调用一次 `auth-service` 远程签发操作者上下文
- 否则会引入额外网络 hop、可用性耦合和时延开销
- `Phase 1` 推荐由 `gateway` 本地完成短期上下文签名，`auth-service` 提供密钥体系或配置支持

后续可扩展负责：

- 签发短期内部操作者声明
- 提供更强的签名能力隔离

### 7.3 `common`

负责承载跨服务一致的安全基础设施，不负责业务判断。

应提供：

- gRPC metadata 常量定义
- 操作者上下文结构定义
- 操作者上下文解析器
- 操作者上下文验签工具
- `InternalServiceGuard` 公共抽象 / 基础实现
- `OperatorContextGuard` 公共抽象 / 基础实现
- 可选的 decorator / metadata 工具

不负责：

- 判断系统管理员或租户管理员是否有业务权限
- 承担某个具体子服务的业务授权矩阵

### 7.4 `permission-service`

负责：

- 对自身所有开放接口执行内部服务认证
- 对管理接口执行操作者上下文验签
- 对管理接口执行服务内业务授权
- 对外提供 `CheckPermission` / `CheckPermissionWithContext`

不负责：

- 外部用户登录认证
- access token 原始签发

### 7.5 其他业务子服务

负责：

- 复用统一的内部服务信任模型
- 对后台管理型内部接口执行内部服务认证
- 在需要时验证操作者上下文
- 在资源级场景中执行最终细粒度授权

## 8. 调用链路

### 8.1 入口级链路

1. 外部请求进入 `gateway`
2. `gateway` 判断该路由是：
   - 公开接口
   - 需登录接口
   - 需基础 `permission` 接口
3. 若要求登录，则校验 access token
4. 若要求基础权限，则调用 `CheckPermission`
5. 通过后继续下游调用

### 8.2 内部转发链路

1. `gateway` 提取用户身份、租户上下文
2. `gateway` 生成 `x-operator-context`
3. `gateway` 注入 `x-internal-service-name`
4. `gateway` 调用下游子服务
5. 下游先执行 `InternalServiceGuard`
6. 若是管理接口，再执行 `OperatorContextGuard`
7. 若上下文可信，再执行服务内业务授权
8. 若涉及具体资源判断，再执行细粒度授权
9. 通过后进入具体 handler

## 9. Metadata / 上下文契约

### 9.1 gRPC metadata 键名

Phase 1 统一以下键名：

- `x-internal-service-name`
- `x-operator-context`

可选预留：

- `x-request-id`
- `x-trace-id`

### 9.2 `x-internal-service-name`

定位：

- 应用层可读的调用方服务身份标签

示例：

- `api-gateway`
- `order-service`
- `wms-service`

说明：

- 它不能单独作为信任依据
- 它应与 `mTLS` 或等价服务身份机制配合使用
- 适合用于日志、审计、白名单、调试和策略判断

### 9.3 `x-operator-context`

定位：

- 上游生成、下游可独立校验的操作者身份声明

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

### 9.4 推荐编码结构

Phase 1 推荐用单个 JSON 字符串承载：

```json
{
  "operator_id": "user-123",
  "operator_type": "USER",
  "tenant_id": "tenant-001",
  "issued_at": "2026-03-22T12:00:00.000Z",
  "expires_at": "2026-03-22T12:05:00.000Z",
  "issuer": "api-gateway",
  "request_id": "req-xxx",
  "trace_id": "trace-xxx",
  "signature": "base64-signature"
}
```

签名约束：

- `signature` 字段本身不参与原文签名
- 其余受保护字段需按稳定顺序编码后签名
- 下游统一通过 `common` 中的验签器校验签名、issuer 和有效期

### 9.5 字段语义

| 字段 | 是否必填 | 说明 |
|---|---|---|
| `operator_id` | 是 | 当前操作者 ID |
| `operator_type` | 是 | 操作者类型，例如账号用户 |
| `tenant_id` | 管理接口必须 | 当前租户上下文 |
| `issued_at` | 是 | 声明签发时间 |
| `expires_at` | 是 | 声明失效时间 |
| `issuer` | 是 | 签发方标识，`Phase 1` 默认是 `api-gateway` |
| `signature` | 是 | 用于验证上下文未被篡改 |

### 9.6 Phase 1 约束

- 不在 `Phase 1` 强制要求 `operator_permissions`
- 不在 `Phase 1` 强制要求服务级 `scope`
- 不在 `Phase 1` 强制要求具体 `aud`
- 不在 `Phase 1` 采用“每请求同步调用 `auth-service` 远程签发上下文”

## 10. Guard 分层设计

### 10.1 `InternalServiceGuard`

职责：

- 校验调用请求是否来自可信内部服务

输入：

- 底层服务身份
- `x-internal-service-name`

结果：

- 认证通过则继续
- 失败则拒绝请求

挂载范围：

- 所有对内开放接口

### 10.2 `OperatorContextGuard`

职责：

- 解析并验证 `x-operator-context`
- 校验签名、有效期、必要字段、issuer

输入：

- `x-operator-context`

结果：

- 验证通过则把解析后的操作者上下文挂入请求上下文
- 验证失败则拒绝请求

挂载范围：

- 仅业务管理接口

### 10.3 业务操作者授权

职责：

- 基于已验证的操作者上下文，判断其是否有权执行当前管理操作

建议命名：

- `ManagementAuthorizationGuard`

说明：

- 这一步不等同于 `OperatorContextGuard`
- `OperatorContextGuard` 只负责“这个操作者身份是否可信”
- `ManagementAuthorizationGuard` 负责“这个可信操作者是否有权做这件事”
- 最终授权建议尽量基于 `permission` 判断，而不是在代码中硬编码 role 名称

## 11. 接口分类与保护要求

| 接口类型 | 示例 | 是否要求内部服务认证 | 是否要求操作者上下文 | 是否要求业务授权 |
|---|---|---|---|---|
| 服务调用接口 | `CheckPermission`、`CheckPermissionWithContext` | 是 | 否 | 否 |
| 业务管理接口 | 角色管理、账号角色管理、Permission 管理、Policy 管理 | 是 | 是 | 是 |
| 资源级业务接口 | 订单审批、仓库资源操作、租户资源操作 | 是 | 视接口而定 | 是，且通常需要细粒度授权 |

## 12. 按模块改造清单

### 12.1 `common`

Phase 1 需要新增：

- metadata 常量
- `OperatorContextPayload` 类型
- 上下文编码 / 解码器
- 签名器 / 验签器接口
- `InternalServiceGuard`
- `OperatorContextGuard`
- 可选 decorator：
  - `@PublicInterface()`
  - `@ManagementInterface()`
  - `@RequireOperatorContext()`

### 12.2 `api-gateway`

Phase 1 需要改造：

- 建立路由访问级别分类：
  - 公开
  - 需登录
  - 需基础 `permission`
- 为“需基础 `permission`”接口接入粗粒度 RBAC 校验
- 完成 `x-operator-context` 生成
- 完成 `x-internal-service-name` 注入
- 内部调用统一转发 metadata

### 12.3 `permission-service`

Phase 1 需要改造：

- 所有 gRPC 接口接入 `InternalServiceGuard`
- 管理接口接入 `OperatorContextGuard`
- 落地 `ManagementAuthorizationGuard` 或等价授权器
- 修补现有管理接口边界缺口

### 12.4 其他业务子服务

Phase 1 建议同步对齐：

- 接入 `InternalServiceGuard`
- 对管理型内部接口接入 `OperatorContextGuard`
- 在资源级场景中接入 `CheckPermissionWithContext` 或等价细粒度授权器

### 12.5 `auth-service`

Phase 1 不要求引入“每请求实时签发”改造，前提是：

- `gateway` 已能稳定完成 access token 校验
- 当前验签体系已足以支持下游验证操作者上下文

Phase 1.5 / Phase 2 再评估：

- 是否将 signer 能力下沉到 `auth-service`
- 是否引入更强的签名能力隔离

## 13. 分片实施蓝图

以下分片按“依赖顺序 + 优先级”排列，默认要求先文档、再代码、再验证。

| 分片编号 | 模块 | 优先级 | 目标 | 前置依赖 |
|---|---|---|---|---|
| SLICE-01 | `common` | P0 | 安全契约与 guard 基础设施 | 无 |
| SLICE-02 | `api-gateway` | P0 | 路由访问分类与粗粒度 RBAC 门禁 | `SLICE-01` |
| SLICE-03 | `api-gateway` | P0 | `x-internal-service-name` / `x-operator-context` 生成与转发 | `SLICE-01` |
| SLICE-04 | `permission-service` | P0 | 接入 `InternalServiceGuard` | `SLICE-01` |
| SLICE-05 | `permission-service` | P0 | 接入 `OperatorContextGuard` | `SLICE-01`、`SLICE-03` |
| SLICE-06 | `permission-service` | P0 | 落地管理接口业务授权 | `SLICE-05` |
| SLICE-07 | `permission-service` | P0 | 修补管理接口租户 / 角色 / 资源边界缺口 | `SLICE-06` |
| SLICE-08 | 其他业务子服务 | P1 | 复用统一内部服务信任与操作者上下文模型 | `SLICE-01`、`SLICE-03` |
| SLICE-09 | `auth-service` | P1 | signer 演进入口与密钥治理 | `SLICE-01` |

## 14. 按模块详细分片步骤

### 模块 A：`common`

#### `SLICE-01` 安全契约与基础设施

优先级：

- P0

目标：

- 为所有子服务提供统一可复用的内部服务认证和操作者上下文基础能力

具体实现项：

1. 新增 metadata 常量定义
2. 新增 `OperatorContextPayload` 类型定义
3. 新增上下文序列化 / 反序列化工具
4. 新增签名 / 验签接口抽象
5. 新增 `InternalServiceGuard`
6. 新增 `OperatorContextGuard`
7. 新增可选 decorator
8. 新增公共异常语义与错误码映射

验收标准：

- `gateway` 与任一子服务可直接复用
- 不包含业务服务私有逻辑
- gRPC metadata 读取行为一致

### 模块 B：`api-gateway`

#### `SLICE-02` 路由访问分类与粗粒度门禁

优先级：

- P0

目标：

- 在入口就区分接口公开级别，并提前拦截无权请求

具体实现项：

1. 建立三类访问级别：
   - 公开
   - 需登录
   - 需基础 `permission`
2. 为“需基础 `permission`”路由接入声明式 metadata
3. 调用 `permission-service.CheckPermission` 做粗粒度 RBAC 校验
4. 统一 fail-closed 行为和错误响应

验收标准：

- 无登录用户不能访问“需登录”接口
- 无 `permission` 用户不能访问“需权限”接口
- 公开接口不受登录校验影响

#### `SLICE-03` metadata 生成与内部转发

优先级：

- P0

目标：

- 让所有发往下游子服务的内部请求都携带标准化可验证上下文

具体实现项：

1. 提取操作者身份与租户上下文
2. 生成带短期有效期的 `x-operator-context`
3. 注入 `x-internal-service-name=api-gateway`
4. 统一内部 gRPC 客户端 metadata 转发逻辑
5. 区分服务调用接口与管理接口的 metadata 注入规则

验收标准：

- 所有内部转发请求都能稳定读取 metadata
- 管理接口链路能稳定携带可验签操作者上下文

### 模块 C：`permission-service`

#### `SLICE-04` 接入 `InternalServiceGuard`

优先级：

- P0

目标：

- 为本服务所有开放接口建立可信内部调用边界

具体实现项：

1. 识别所有 gRPC controller
2. 统一挂载 `InternalServiceGuard`
3. 对必要例外接口建立显式豁免机制
4. 将调用方服务名写入日志 / 审计上下文

验收标准：

- 非可信内部调用无法访问任意开放接口
- 正常内部调用链路不受破坏

#### `SLICE-05` 接入 `OperatorContextGuard`

优先级：

- P0

目标：

- 防止管理接口盲信裸操作者字段

具体实现项：

1. 明确管理接口清单
2. 仅对管理接口挂载 `OperatorContextGuard`
3. 验签通过后将解析结果注入请求上下文
4. 统一处理缺字段、签名失败、过期、issuer 错误等异常

验收标准：

- 管理接口缺少上下文时一律拒绝
- 服务调用接口不受影响

#### `SLICE-06` 落地管理接口业务授权

优先级：

- P0

目标：

- 将“系统管理员 / 租户管理员”的访问边界真正落到服务内

具体实现项：

1. 为管理接口建立授权矩阵
2. 引入 `ManagementAuthorizationGuard` 或等价应用层授权器
3. 优先按 `permission` 做最终授权判断
4. 在需要处补充租户一致性校验

验收标准：

- 租户管理员不能执行系统级操作
- 租户管理员只能操作自己租户的数据
- 系统管理员跨租户能力应有显式规则

#### `SLICE-07` 修补现有边界缺口

优先级：

- P0

目标：

- 修补“文档已要求、代码未完全收口”的接口约束问题

具体实现项：

1. 修补 `AssignAccountRole` 的租户实例约束
2. 审查角色 / 权限 / policy 管理接口租户边界
3. 审查模板角色与实例角色操作边界
4. 将缺口同步记录到对应 `func` 文档待办表

验收标准：

- 单个接口不会因遗漏约束而绕过管理边界

### 模块 D：其他业务子服务

#### `SLICE-08` 复用统一服务边界模型

优先级：

- P1

目标：

- 将同一套内部服务信任模型推广到其他会接收后台管理请求的子服务

具体实现项：

1. 接入 `InternalServiceGuard`
2. 管理接口接入 `OperatorContextGuard`
3. 在资源级场景中接入细粒度授权能力
4. 统一日志、错误语义和 metadata 读取方式

验收标准：

- 不同子服务不会各自发明不同的内部信任模型

### 模块 E：`auth-service`

#### `SLICE-09` signer 演进入口

优先级：

- P1

目标：

- 为后续将操作者上下文签发能力下沉到认证域做准备

具体实现项：

1. 明确 issuer / key 配置来源
2. 明确公钥发布 / 配置分发策略
3. 为后续 signer 服务或签发接口预留文档与配置能力
4. 当前阶段不引入“每请求远程签发”链路

验收标准：

- 当前方案不引入额外同步签发开销
- 后续演进到 `auth-service` signer 时不需要推翻 Phase 1 契约

## 15. 推荐优先实现顺序

1. `SLICE-01 common`
2. `SLICE-02 gateway 路由访问分类与粗粒度门禁`
3. `SLICE-03 gateway metadata 生成与转发`
4. `SLICE-04 permission-service InternalServiceGuard`
5. `SLICE-05 permission-service OperatorContextGuard`
6. `SLICE-06 permission-service 管理接口业务授权`
7. `SLICE-07 permission-service 边界缺口修补`
8. `SLICE-08 其他业务子服务推广`
9. `SLICE-09 auth-service signer 演进入口`

## 16. Phase 1.5 增强清单

- 引入服务级接口访问范围限制
- 增加 `aud`
- 增加 `scope`
- 增加 `service_name` 白名单校验
- 进一步缩短操作者上下文有效期
- 评估是否让 `CheckPermission` 的调用方也按服务名做最小权限限制

## 17. Phase 2 增强清单

- 评估是否由 `auth-service` 或专门 signer 服务生成更短期内部声明
- 评估签名能力与 `gateway` 进程隔离
- 评估更强的集中授权能力

## 18. 已知限制

- `Phase 1` 仍默认所有可信内部服务都可访问“服务调用接口”
- `Phase 1` 还没有做到服务级最小权限
- 如果 `gateway` 与签名能力同时失陷，仍可能伪造操作者上下文
- 若未来改成“每请求同步调用 `auth-service` 远程签发”，会引入额外 hop 和可用性耦合，因此当前不采用

## 19. 后续使用规则

- 后续与本方案相关的代码改造，必须先对齐本文档中的 `SLICE` 编号
- 若实施顺序、metadata 契约、guard 设计发生变化，应先更新本文档再改代码
- 具体服务内落地细节，再分别记录到对应服务自己的 `doc/func` 文档中
