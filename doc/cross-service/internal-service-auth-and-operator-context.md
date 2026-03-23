# 内部服务认证与可验签操作者上下文

更新时间：2026-03-22 12:30:00 +09:00

## 1. 文档目标

本文档不是静态协议说明，而是第一个跨服务功能的总设计与执行蓝图。

目标：

- 解释整条“外部请求 -> gateway -> 内部服务 -> 资源授权”链路
- 明确 `gateway`、`common`、`permission-service`、`auth-service`、其他子服务的职责边界
- 明确 `x-internal-service-name` 与 `x-operator-context` 的定位
- 明确 guard 分层与业务授权分层
- 提供按模块拆分、按优先级排序、可直接实施的分片清单
- 作为各子服务拆分本地任务文档的上游主文档

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
| L5 | 子服务入口 | 验证操作者上下文是否可信 | `AuthenticatedOperatorGuard` |
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
- `AuthenticatedOperatorGuard` 公共抽象 / 基础实现
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
6. 若是管理接口，再执行 `AuthenticatedOperatorGuard`
7. 若上下文可信，再执行服务内业务授权
8. 若涉及具体资源判断，再执行细粒度授权
9. 通过后进入具体 handler

### 8.3 多级内部调用链路

本方案不假设所有请求都只有一跳 `gateway -> 子服务`。

以下链路同样属于设计支持范围：

- `gateway -> auth-service -> permission-service`
- `gateway -> 业务子服务 A -> 业务子服务 B`
- 更长的多级内部服务调用链

多级链路下的规则如下：

1. `x-internal-service-name` 表达“当前这一跳的直接调用方”
2. `x-operator-context` 表达“整条调用链中的最终操作者身份声明”
3. 每经过一跳内部服务：
   - 直接下游看到的 `x-internal-service-name` 必须更新为当前调用它的服务
   - `x-operator-context` 默认继续沿链路透传，而不是退化为裸 `operator_id`
4. 中间服务若要继续调用下游，应先完成本跳入口校验，再决定是否继续向下透传操作者上下文

示例：

- `gateway -> auth-service` 时：
  - `x-internal-service-name = api-gateway`
  - `x-operator-context = gateway` 生成的已签名操作者上下文
- `auth-service -> permission-service` 时：
  - `x-internal-service-name = auth-service`
  - `x-operator-context` 仍应表示原始最终操作者，而不是改写成 `auth-service`

这意味着：

- 内部服务身份是“逐跳”的
- 操作者上下文是“跨跳”的

当前阶段的推荐基线：

- 中间服务默认透传已验签通过的 `x-operator-context`
- 中间服务覆盖本跳的 `x-internal-service-name`
- `x-request-id` / `x-trace-id` 按统一链路追踪策略继续透传

说明：

- 当前文档先将此规则作为设计要求写清
- 是否由中间服务重新签发更短期上下文，留待后续阶段再评估
- 本轮分片不要求立即完成所有中间服务的自动透传实现

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
- 在多级链路中，它必须反映“当前这一跳的直接调用方”，而不是入口服务名

### 9.3 `x-operator-context`

定位：

- 上游生成、下游可独立校验的操作者身份声明
- 在多级链路中默认跨跳透传，用于表达最终操作者，而不是当前中间服务身份

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

### 10.2 `AuthenticatedOperatorGuard`

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

- 这一步不等同于 `AuthenticatedOperatorGuard`
- `AuthenticatedOperatorGuard` 只负责“这个操作者身份是否可信”
- `ManagementAuthorizationGuard` 负责“这个可信操作者是否有权做这件事”
- 最终授权建议尽量基于 `permission` 判断，而不是在代码中硬编码 role 名称

## 11. 接口分类与保护要求

| 接口类型 | 示例 | 是否要求内部服务认证 | 是否要求操作者上下文 | 是否要求业务授权 |
|---|---|---|---|---|
| 服务调用接口 | `CheckPermission`、`CheckPermissionWithContext` | 是 | 否 | 否 |
| 业务管理接口 | 角色管理、账号角色管理、Permission 管理、Policy 管理 | 是 | 是 | 是 |
| 资源级业务接口 | 订单审批、仓库资源操作、租户资源操作 | 是 | 视接口而定 | 是，且通常需要细粒度授权 |

## 12. 按模块改造清单

### 12.0 子服务设计挂接规则

本跨服务功能主文档负责全局链路、职责边界和总分片；各子服务必须再补自己的设计承接文档与任务文档。

例如 `permission-service` 中：

- 设计承接文档：
  [authorization.md](../../src/services/system/permission-service/doc/design/authorization.md)
- 本服务任务文档：
  [internal-service-auth-and-operator-context.md](../../src/services/system/permission-service/doc/tasks/internal-service-auth-and-operator-context.md)

要求：

- 设计承接文档负责回答“本服务如何承接这项跨服务功能”
- 任务文档负责回答“本服务按什么顺序落地这些分片”
- 不能只建任务文档而不建立服务内设计承接关系

### 12.1 `common`

Phase 1 需要新增：

- metadata 常量
- `OperatorContextPayload` 类型
- 上下文编码 / 解码器
- 签名器 / 验签器接口
- `InternalServiceGuard`
- `AuthenticatedOperatorGuard`
- 可选 decorator：
  - `@PublicInterface()`
  - `@RequireAuthenticatedOperator()`

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
- 为后续多级内部调用链提供统一 metadata 基线

### 12.3 `permission-service`

Phase 1 需要改造：

- 所有 gRPC 接口接入 `InternalServiceGuard`
- 管理接口接入 `AuthenticatedOperatorGuard`
- 落地 `ManagementAuthorizationGuard` 或等价授权器
- 修补现有管理接口边界缺口

### 12.4 其他业务子服务

Phase 1 建议同步对齐：

- 接入 `InternalServiceGuard`
- 对管理型内部接口接入 `AuthenticatedOperatorGuard`
- 在资源级场景中接入 `CheckPermissionWithContext` 或等价细粒度授权器

### 12.5 `auth-service`

Phase 1 不要求引入“每请求实时签发”改造，前提是：

- `gateway` 已能稳定完成 access token 校验
- 当前验签体系已足以支持下游验证操作者上下文

Phase 1.5 / Phase 2 再评估：

- 是否将 signer 能力下沉到 `auth-service`
- 是否引入更强的签名能力隔离
- 是否由中间服务在多级链路中重签发更短期操作者上下文

## 13. 分片实施蓝图

以下分片按“依赖顺序 + 优先级”排列，默认要求先文档、再代码、再验证。

| 分片编号 | 模块 | 优先级 | 目标 | 前置依赖 |
|---|---|---|---|---|
| SLICE-01 | `common` | P0 | 安全契约与 guard 基础设施 | 无 |
| SLICE-02 | `api-gateway` | P0 | 路由访问分类与粗粒度 RBAC 门禁 | `SLICE-01` |
| SLICE-03 | `api-gateway` | P0 | `x-internal-service-name` / `x-operator-context` 生成与转发 | `SLICE-01` |
| SLICE-04 | `permission-service` | P0 | 接入 `InternalServiceGuard` | `SLICE-01` |
| SLICE-05 | `permission-service` | P0 | 接入 `AuthenticatedOperatorGuard` | `SLICE-01`、`SLICE-03` |
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
6. 新增 `AuthenticatedOperatorGuard`
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
6. 明确多级调用链场景下 `x-internal-service-name` 与 `x-operator-context` 的逐跳 / 跨跳语义

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

#### `SLICE-05` 接入 `AuthenticatedOperatorGuard`

优先级：

- P0

目标：

- 防止管理接口盲信裸操作者字段

具体实现项：

1. 明确管理接口清单
2. 仅对管理接口挂载 `AuthenticatedOperatorGuard`
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
2. 管理接口接入 `AuthenticatedOperatorGuard`
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
5. `SLICE-05 permission-service AuthenticatedOperatorGuard`
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
- 多级链路下的中间服务 metadata 自动透传目前只形成设计要求，尚未在所有服务中统一落地

## 19. 后续使用规则

- 后续与本方案相关的代码改造，必须先对齐本文档中的 `SLICE` 编号
- 若实施顺序、metadata 契约、guard 设计发生变化，应先更新本文档再改代码
- 具体服务内落地细节，再分别记录到对应服务自己的 `doc/design`、`doc/tasks` 文档中
## 0. 当前进度快照（2026-03-23）

当前主线已经完成到：

- `SLICE-01 common`：已完成公共安全基础设施，并额外补齐了可复用的接口级 permission 底座：
  - `@RequirePermission(...)`
  - `PermissionGuard`
  - `OperatorPermissionResolver`
  - `DenyAllOperatorPermissionResolver`
- `SLICE-02 api-gateway`：已能为 `permission-service` 管理调用生成 signed `x-operator-context`
- `SLICE-03 api-gateway`：已抽出统一下游 gRPC metadata 构造能力
- `SLICE-04 permission-service`：已为开放 gRPC 接口接入 `InternalServiceGuard`
- `SLICE-05 permission-service`：已为管理接口接入 `AuthenticatedOperatorGuard`
- `SLICE-06 permission-service`：已为管理接口接入显式 permission 声明的 `ManagementAuthorizationGuard`
- `SLICE-07 permission-service`：部分实现，已收口部分模板 / 实例 / 租户边界

当前明确未完成：

- `gateway` 入口侧粗颗粒 `CheckPermission` 门禁仍按后期优化处理，当前未继续推进
- 多级内部调用链的自动透传实现，当前只有设计约束，尚未统一落地
- 通用 `PermissionGuard` 目前只有公共底座，各子服务仍需自行提供真实的 `OperatorPermissionResolver`
- `SLICE-07` 仍需继续把租户 / 模板 / 实例边界收口到更多写接口
- `SLICE-08` 其他业务子服务尚未开始样板接入

当前暂停点：

- 后续推荐先选择一个子服务，提供真实 `OperatorPermissionResolver`，把 `@RequirePermission(...) + PermissionGuard` 接到 1 到 2 个真实接口上验证链路
- `permission-service` 内此前用于 `SLICE-07` 的临时 “system scope” 判定思路已被否定，后续应改为基于 `operator_roles -> permission/capability` 的解析，不再使用 `tenant_id` 空值推断系统管理员
