# auth-service Trusted Login Device API

> 服务设计唯一真相源：[auth-service.md](../../architecture/services/auth-service.md)。本文只描述 personal trusted login device 的黑盒语义，不重新定义 managed terminal device 边界。

## 1. 能力定位

Trusted login device 是账号安全中的个人化登录环境信任能力。

Phase 2 适用范围：

- Web trusted browser
- future Mobile remembered app/device

明确不适用：

- PDA
- KIOSK
- 其他企业受管共享终端

PDA / KIOSK 可以是企业受管可信设备，但不是某个 user 的 personal trusted login device。

## 2. Owner

- personal trusted login device truth：`auth-service`
- managed terminal device truth：`terminal-device-service`
- 管理操作授权判定：`permission-service`

## 3. Stable Rules

- Web trusted browser 可用于减少 Web 新设备 MFA 或 remember MFA 频率。
- Trusted device 必须绑定 user/account security context、terminal 与稳定设备识别摘要。
- 裸 IP 或裸 user-agent 不得单独作为 trusted device 判定依据。
- PDA / KIOSK 不提供“信任此设备”或 remember MFA 语义。
- 受管 PDA/KIOSK active 状态可以作为风险输入，但不等于 personal trusted login device。

## 4. Self-service APIs

### `ListOwnTrustedLoginDevices`

- 作用：当前用户查看自己的 trusted login devices。
- 响应只应包含 Web / future Mobile 个人化设备，不包含 PDA / KIOSK 受管设备。

### `RevokeOwnTrustedLoginDevice`

- 作用：当前用户撤销自己的一个 trusted login device。

### `RevokeOwnOtherTrustedLoginDevices`

- 作用：当前用户撤销除当前设备外的其他 trusted login devices。

## 5. Admin APIs

Phase 2 可按已有 admin security 能力查看或撤销目标 user 的 trusted login devices。管理员能力必须：

- 经过 permission-service 授权判定。
- 按 operator scope 收敛。
- 记录认证安全审计。

## 6. 明确禁止

- 禁止把 `terminalDeviceId` 直接作为 personal trusted device id。
- 禁止让 PDA/KIOSK 进入 user trusted device 列表。
- 禁止把企业受管设备 active 状态等同于用户个人信任。

## 7. 关联文档

- [terminal-aware-account-security.md](../../architecture/collaborations/terminal-aware-account-security.md)
- [managed-terminal-device-management.md](../../architecture/collaborations/managed-terminal-device-management.md)
