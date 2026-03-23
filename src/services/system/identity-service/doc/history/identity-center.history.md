# Identity Service 设计建立记录

更新时间：2026-03-23 15:20:00 +08:00

## 本次目标

为 `identity-service` 建立完整的服务级设计基线，摆脱对历史 `schema.prisma` 的被动依赖。

## 主要调整

- 明确 `identity-service` 定位为身份主数据中心
- 明确 `User / UserAccount / Tenant / Org / ContactAsset / MachineIdentity` 六个功能集合
- 明确 `identity-service` 与 `auth-service`、`permission-service` 的职责边界
- 将旧 `schema.prisma` 降级为历史草稿参考，而非当前有效设计来源

## 影响文档

- [../INDEX.md](../INDEX.md)
- [../overview.md](../overview.md)
- [../roadmap.md](../roadmap.md)
- [../design/identity-center.md](../design/identity-center.md)
- [../design/human-identity.md](../design/human-identity.md)
- [../design/account-identity.md](../design/account-identity.md)
- [../design/tenant-identity.md](../design/tenant-identity.md)
- [../design/organization-structure.md](../design/organization-structure.md)
- [../design/contact-asset.md](../design/contact-asset.md)
- [../design/machine-identity.md](../design/machine-identity.md)

## 备注

当前仅完成文档层设计基线，尚未开始代码结构重建与功能实现。
