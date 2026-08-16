# Public Entry Navigation Entries

```text
featureKey: PUBLIC-ENTRY-NAVIGATION-ENTRIES
state: DESIGN_FROZEN_IMPLEMENTATION_READY
truthSource: docs/architecture/services/public-entry-service.md
```

## Objective

将 ShortLink 与 BusinessCard 管理入口从权限治理菜单中收敛到 tenant-web 的 `公开触点` 管理分组，同时保持员工自助入口与 HR 主数据边界。

## Scope

- 注册父级管理分组 `public-entry.touchpoints`。
- 注册 `public-entry.business-cards` 与 `public-entry.short-links` 两个管理 entry。
- 将对应 tenant-web 管理路由迁入 `公开触点` 分组。
- 员工详情只显示名片状态摘要和跳转，不承载完整配置。
- `我的名片` 从当前 account/employee context 派生，不进入管理员 navigation seed。

## Boundaries

- 导航分组不成为新的业务 owner。
- BusinessCard、ShortLink、HR、Identity 与 Contact Asset 的真相仍由各自 owner 管理。
- 管理 entry visibility 不替代 Public Entry mutation 的权限与资源校验。
- icon、order 与 route component path 按现有 tenant-web/navigation 规则实现，不升级为后端业务语义。

## Acceptance

- tenant-web 显示 `公开触点 -> 员工数字名片 / 公开短链`。
- 两个 entry 使用独立 visibility 与现有 Public Entry permission。
- 个人自助名片入口不依赖管理员角色。
- HR 页面不复制名片配置模型。
- navigation seed、BFF summary、tenant-web route/typecheck 与授权负向场景通过验证。
