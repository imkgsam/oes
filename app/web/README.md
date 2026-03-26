# OES Web Workspace

本目录是 OES 的 Web 前端工作区，基于 `vue-vben-admin` 的工程体系裁剪而来。

当前目标：

- 以 `apps/tenant-web` 作为租户业务 Web 起点
- 后续在同一工作区内继续派生 `platform-web`
- 保留 Vben 的工程化能力，去除与 OES 无关的模板残留

当前推荐命令：

```bash
pnpm install
pnpm dev:tenant
pnpm build:tenant
```

当前保留的核心结构：

- `apps/`
- `packages/`
- `internal/`
- `scripts/`
