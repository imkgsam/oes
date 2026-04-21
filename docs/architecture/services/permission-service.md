# permission-service 职责卡

## 1. Purpose

`permission-service` 是 OES 的授权判定真相服务，负责回答“谁在什么上下文下可以做什么”。

## 2. Owns

- 权限码、角色、scope、policy 语义
- 授权判定结果真相
- 资源级授权与查询范围构建所需共享授权能力
- 面向前端或 Gateway 的授权摘要视图
- 第一阶段 navigation governance 真相：
  - `NavigationEntry Registry`
  - `RoleNavigationVisibility`
  - `RoleLandingPolicy`

## 3. Does Not Own

- 用户认证与会话真相
- 用户、账号、租户、组织主数据真相
- 业务资源本体真相
- 前端菜单展示文案真相
- Web route、菜单层级、icon、layout 等 terminal-specific UI 呈现真相
- 用户个人 landing page 偏好真相

## 4. Core Responsibilities

- 提供角色、权限、scope、policy 的统一治理入口
- 为 Gateway、平台服务与业务服务提供授权判定能力
- 支撑 `checkResource`、`buildQueryScope` 等统一授权分层模型
- 输出可被消费的权限摘要，但不替代业务域规则
- 为 `api-gateway/auth-bff` 提供第一阶段 navigation governance 所需的 entry registry、role visibility 与 role landing policy 治理能力

## 5. External Interfaces

- 典型上游入口：`api-gateway`、平台服务、业务服务
- 典型契约位置：
  - [permission-service/access-summary.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/permission-service/access-summary.md)
  - [api-gateway/permission-management.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/api-gateway/permission-management.md)
  - [api-gateway/navigation-summary.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/api-gateway/navigation-summary.md)

## 6. Upstream Dependencies

- `identity-service`
  - 提供操作者账号、租户、组织等身份上下文事实
- 业务服务
  - 提供资源归属、业务状态与领域规则事实，供授权链路消费

## 7. Downstream / Published Facts

- 授权是否通过
- 操作者在当前上下文下可消费的权限摘要
- 资源级授权判断结果
- 列表 / 搜索 / 分页查询可用的范围约束结果
- 当前 role / scope / terminal 组合下可消费的 navigation governance 配置事实

## 8. Non-goals

- 不拥有用户、租户、会话或业务资源主数据
- 不在 Gateway、DTO 或前端中复制其内部角色 / policy 模型
- 不替代业务域自己的领域规则判断
- 不把 navigation governance 扩展成后端统一菜单树或 terminal-specific UI 配置中心
