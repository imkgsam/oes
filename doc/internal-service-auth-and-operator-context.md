# 内部服务认证与可验签操作者上下文

更新时间：2026-03-18 17:40:01 +08:00

## 背景

`permission-service` 既提供：

- 业务管理接口
- 服务调用接口

两类接口最终都需要经过内部服务调用链访问，因此必须明确：

1. 如何识别调用方是否为可信内部服务
2. 如何证明最终操作者身份未被网关或中间服务伪造

## 设计结论

采用“方案 3：内部服务认证 + 可验签的用户上下文”。

## 适用范围

- `gateway`
- `auth-service`
- `common`
- `permission-service`
- 后续需要承接操作者上下文的业务子服务

## 模块职责

### gateway

- 校验外部用户 access token
- 生成或转发可验签的操作者上下文
- 将请求转发到下游内部服务
- 携带内部服务身份信息

### auth-service

- 负责用户认证
- 负责 access token 签发与公钥体系
- 后续可扩展为签发短期内部操作者声明

### common

- 提供通用 metadata 常量
- 提供操作者上下文结构定义
- 提供上下文验签工具
- 提供内部服务 guard / 操作者上下文 guard 的公共抽象

### permission-service

- 校验调用方是否为可信内部服务
- 校验操作者上下文是否可验签且未被篡改
- 对业务管理接口执行操作者授权判断
- 对服务调用接口执行内部服务接口保护

## 接口分类

### 服务调用接口

示例：

- `CheckPermission`
- `CheckPermissionWithContext`

要求：

- 调用方必须是可信内部服务
- 不要求后台管理员角色
- 当前阶段不限制到具体服务名白名单

### 业务管理接口

示例：

- 角色管理
- 账号角色管理
- Permission 管理
- Policy 管理

要求：

- 调用方必须是可信内部服务
- 必须携带可验签的操作者上下文
- 目标服务必须自己验证操作者身份和权限

## 调用链路

1. 用户请求进入 `gateway`
2. `gateway` 验证外部 access token
3. `gateway` 生成或转发可验签操作者上下文
4. `gateway` 作为内部服务调用 `permission-service`
5. `permission-service` 校验内部服务身份
6. `permission-service` 校验操作者上下文签名与基本有效性
7. 若为业务管理接口，再校验操作者是否有权执行该操作
8. 若为服务调用接口，则直接进入对应鉴权逻辑

## 上下文约束

建议至少包含以下信息：

- `operator_id`
- `operator_type`
- `tenant_id`
- `issued_at`
- `expires_at`
- `issuer`
- `signature`

后续可扩展：

- `operator_roles`
- `operator_permissions`
- `trace_id`

## 安全边界

- 不信任未签名的裸用户 header
- 不仅依赖 `gateway` 口头转述“当前操作者是谁”
- 只信任可验签的操作者上下文
- 即使请求来自可信内部服务，业务管理接口仍必须校验操作者授权

## 已知限制

- 当前阶段只要求“可信内部服务”这一层，不细分到服务级接口授权白名单
- 若 `gateway` 与签名能力同时失陷，攻击者仍可能伪造操作者上下文
- 后续可通过缩短上下文有效期、隔离签名能力、引入更严格的签发方来增强

## 分阶段实施

### Phase 1

- 明确接口分类
- 在 `common` 中定义操作者上下文结构与验签工具
- 在 `permission-service` 中落地内部服务认证与操作者上下文校验

### Phase 1.5

- 增加服务级调用范围约束
- 引入更明确的 `aud` / `scope` / `service_name`

### Phase 2

- 评估是否由 `auth-service` 或专门签发方生成更短期的内部操作者声明
- 评估是否引入更强的集中授权能力
