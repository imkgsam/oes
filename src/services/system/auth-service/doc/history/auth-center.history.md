# Auth Service 认证中心设计历史

更新时间：2026-03-22 14:40:00 +08:00

## 本次目标

- 将 `auth-service` 文档结构调整为符合仓库级文档规范的形式
- 将完整设计方案从 `INDEX.md` 下沉到 `design/`
- 重新定义当前阶段的设计边界和优先级

## 修改范围

- 重写 `doc/INDEX.md`
- 新增 `doc/overview.md`
- 新增 `doc/roadmap.md`
- 新增 `doc/design/auth-center.md`
- 新增 `doc/history/auth-center.history.md`

## 主要改动

- 将 `INDEX.md` 从“设计正文 + 索引混合文档”改为纯导航文档
- 明确当前阶段只落地 Human Auth Domain
- 明确 token 不承载完整角色与权限快照
- 明确登录后账号选择是正式流程的一部分
- 明确前端权限展示通过初始化接口获取摘要
- 将开放 API、机器身份、AI 代理调整为预留能力，而非当前实施范围

## 备注

- 当前设计正文以上游 [design/auth-center.md](../design/auth-center.md) 为准
- 后续如果拆分更多专题设计，应继续在 `design/` 下展开，并由 `INDEX.md` 导航
