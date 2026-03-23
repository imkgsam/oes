# Frontend Auth Context 设计

更新时间：2026-03-22 18:35:00 +08:00

## 文档定位

本文档描述登录后前端如何获得初始化认证上下文与权限展示摘要。

## 目标

- 保持 token 轻量
- 兼容页面、菜单、按钮展示需求
- 不把前端展示需求和服务端安全边界混为一体

## 设计原则

- token 只提供最小身份上下文
- 前端通过初始化接口获取展示摘要
- 服务端业务接口仍做实时鉴权

## 初始化接口应返回

- 当前用户信息
- 当前账户信息
- 当前租户信息
- 当前账户角色摘要
- 菜单可见性摘要
- 页面可见性摘要
- 按钮可见性摘要

## 责任划分

建议由网关聚合：

- `auth-service` 的认证上下文
- `identity-service` 的账户和租户信息
- `permission-service` 的展示权限摘要

## 规则

- 前端隐藏按钮不等于真实授权
- 所有写操作和敏感操作仍要走后端权限校验

## 关联设计

- 上游总设计：[auth-center.md](./auth-center.md)
- token 与 session：[session-token-management.md](./session-token-management.md)

## 关联任务完成情况

全局审核记录：[minimum-closure-global-review.history.md](../history/minimum-closure-global-review.history.md)

| 序号 | 任务编号 | 任务文档 | 描述 | 当前状态 | 最后一次全局审核时间 | 备注 |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | AUTH-05 | [auth-05-account-selection.md](../tasks/auth-05-account-selection.md) | 当前账户上下文确认闭环 | 部分实现 | 2026-03-23 | 登录响应已可携带候选账户列表，但还没有提交选择后的上下文确认接口 |
| 2 | SESS-01 | [sess-01-session-and-token-issuance.md](../tasks/sess-01-session-and-token-issuance.md) | 登录后前端初始化认证上下文 | 部分实现 | 2026-03-22 | Token 最小上下文原则已确定，初始化接口尚未实现 |
