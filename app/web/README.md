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
pnpm backend:foundation:sync
pnpm dev:tenant
pnpm build:tenant
```

本地联调约束：

- `tenant-web` 默认通过 Vite 代理把 `/api/*` 转发到 trusted runtime 的 `http://127.0.0.1:52101/api/v1/*`，因此需要先运行根目录的 `pnpm backend`。如显式覆盖 Gateway 监听地址，使用完整的 `OES_GATEWAY_HTTP_BASE_URL`（包含 `/api/v1`）。
- `pnpm backend:foundation:sync` 只同步当前确认过的 permission-service foundation seed；旧的 tenant-web auth/account seed 已移除，账号与租户联调数据后续按各服务 seed/reset 方案重新整理。

当前保留的核心结构：

- `apps/`
- `packages/`
- `internal/`
- `scripts/`
