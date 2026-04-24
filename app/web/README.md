# OES Web Workspace

本目录是 OES 的 Web 前端工作区，基于 `vue-vben-admin` 的工程体系裁剪而来。

当前目标：

- 以 `apps/tenant-web` 作为租户业务 Web 起点
- 后续在同一工作区内继续派生 `platform-web`
- 保留 Vben 的工程化能力，去除与 OES 无关的模板残留

当前推荐命令：

```bash
pnpm install
pnpm docker:infra:up
pnpm dev
pnpm seed:tenant-web-auth
pnpm dev:tenant
pnpm build:tenant
```

本地联调约束：

- `tenant-web` 默认通过 Vite 代理把 `/api/*` 转发到 `http://localhost:9101/api/v1/*`，因此需要源码方式启动 `api-gateway` 与其下游服务，而不只是启动 infra 容器。
- `pnpm seed:tenant-web-auth` 现在会同时重建 `authdb / identitydb / permissiondb / tenantorgdb` 的本地联调数据；当租户、登录标识或 tenant owner 链路发生变化后，应重新执行一次，避免旧 seed 漂移导致“前端接口报错”或“登录异常”。

当前保留的核心结构：

- `apps/`
- `packages/`
- `internal/`
- `scripts/`
