# PDA Phase 1 Foundation

## 1. 目标

- 建立 OES 独立 PDA 设备端的第一阶段系统基础能力。
- 在东集 Cruise Ge Android 9 设备上验证 APK、Android Shell、Vue3 静态资源、JS Bridge、登录、会话、扫码、拍照、设备信息、heartbeat、日志与版本策略。
- 为后续 WMS / MES PDA 业务闭环提供稳定终端地基。

## 2. 不做什么

- 不做 WMS 收货、上架、盘点、拣货、发货等业务闭环。
- 不做 MES 胚体扫码、工序完成、报工、质检等业务闭环。
- 不做离线业务提交。
- 不做仓库 / 车间作业上下文强隔离。
- 不做设备绑定到仓库、车间、产线、工位或库位。
- 不做完整设备管理后台。
- 不做自动升级、热更新、MDM 或企业应用市场集成。
- 不做蓝牙打印。
- 不做 NFC。
- 不做照片上传或业务附件服务。
- 不复用 `tenant-web` 页面、layout、Vben 管理台组件或 Web 菜单结构。

## 3. 上游依赖

- architecture:
  - [pda.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/terminals/pda.md)
  - [11-gateway-and-bff-architecture.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/11-gateway-and-bff-architecture.md)
  - [12-observability-and-audit-architecture.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/12-observability-and-audit-architecture.md)
  - [13-response-and-exception-architecture.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/13-response-and-exception-architecture.md)
- services:
  - [auth-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/auth-service.md)
  - [identity-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/identity-service.md)
  - [permission-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/permission-service.md)
- collaborations:
  - [authentication-and-identity.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/collaborations/authentication-and-identity.md)
  - [terminal-access-policy.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/collaborations/terminal-access-policy.md)
- contracts:
  - [auth-bff-login.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/api-gateway/auth-bff-login.md)
  - [pda-auth-bff-login.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/api-gateway/pda-auth-bff-login.md)
  - [access-summary.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/permission-service/access-summary.md)
  - [terminal-access.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/permission-service/terminal-access.md)
- adr:
  - [0005-terminal-access-policy.md](/Users/acehood/Documents/GitHub/oes/docs/adr/0005-terminal-access-policy.md)

## 4. 当前结论

- PDA 是独立 Android 设备端，工程目录为 `app/pda`。
- 目标结构为 `app/pda/web` 与 `app/pda/android`。
- PDA 使用 Android APK 交付，不使用浏览器 H5 作为运行形态。
- PDA 使用 Kotlin Android Shell + AndroidX WebView + 自研 JS Bridge。
- PDA Web 层使用 Vue3、Vite、TypeScript、Pinia、Vue Router 与 Vant。
- Vue3 静态资源随 APK 打包，Phase 1 不做热更新。
- PDA 使用独立 `/pda/*` BFF 外部契约，内部复用 `auth-service / identity-service / permission-service`。
- PDA Phase 1 首页采用开发 / 验收工作台。
- PDA 登录以账号密码为主，预留员工工号 / 工牌扫码登录扩展；若后续启用员工身份入口，HR `Employee / Employment` 设计以 [hr-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/hr-service.md) 为准。
- `/pda/auth/login` Phase 1 只实现账号密码登录，工号登录和工牌扫码登录只做设计预留。
- `/pda/session/bootstrap` Phase 1 作为启动聚合接口，返回 account、session、access、device policy、version policy、workbench 与 server time。
- `/pda/device/heartbeat` Phase 1 允许未登录和已登录都上报，只保存最近设备 / App 状态。
- `/pda/device/logs` Phase 1 只做手动诊断日志上传，允许诊断日志携带完整扫码值，但必须标记 `diagnosticMode`。
- PDA 扫码以全局扫码事件为主，输入框 / 手动输入为兜底。
- PDA Phase 1 拍照只验证 Bridge、预览与本地文件信息，不做上传。
- PDA Phase 1 本地日志支持手动上传。
- PDA Phase 1 heartbeat 用于设备 / App 状态诊断，不用于判断用户登录真相。
- PDA Phase 1 预留 `deviceStatus / devicePolicy`，但不做设备管理后台。

## 5. 契约真相位置

- PDA 终端长期边界以 [pda.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/terminals/pda.md) 为准。
- PDA 登录契约以 [pda-auth-bff-login.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/api-gateway/pda-auth-bff-login.md) 为准。
- Terminal Access Policy 以 [0005-terminal-access-policy.md](/Users/acehood/Documents/GitHub/oes/docs/adr/0005-terminal-access-policy.md) 与 [terminal-access-policy.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/collaborations/terminal-access-policy.md) 为准。
- `auth-service` session / token 语义以 auth-service contracts 为准。
- `permission-service` access summary 与 terminal access 语义以 permission-service contracts 为准。
- PDA Phase 1 device BFF contract 见 [pda-device-bff.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/api-gateway/pda-device-bff.md)。
- PDA Phase 1 JS Bridge contract 见 [js-bridge.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/pda/js-bridge.md)。

## 6. 线程分工

| Thread / Owner | 职责 | 允许修改路径 | 输入 | 输出 | 状态 |
| --- | --- | --- | --- | --- | --- |
| PDA design owner | 冻结 PDA 终端真相源与 Phase 1 feature packet | `docs/architecture/terminals/**`, `docs/plans/features/pda-phase-1-foundation.md` | 当前 PDA 主线讨论 | 稳定终端真相源与 feature packet | completed |
| PDA BFF owner | 冻结 `/pda/*` HTTP contract 与 api-gateway 编排 | `docs/contracts/api-gateway/**`, `src/services/api-gateway/**` | PDA feature packet、auth / permission contracts | PDA BFF 黑盒契约与实现 | completed |
| Android Shell owner | 实现 Android Shell、WebView、JS Bridge、secure storage、扫码、拍照、网络与日志能力 | `app/pda/android/**` | PDA 终端真相源、Bridge contract | 可安装 APK 壳层 | completed |
| PDA Web owner | 实现 Vue3 PDA Web、验收工作台、Bridge client、API client 与 Vant UI | `app/pda/web/**` | PDA 终端真相源、PDA BFF contract、Bridge contract | 可嵌入 APK 的静态资源 | completed |
| integration owner | 串联构建、真机安装、登录、扫码、拍照、heartbeat、日志与版本验收 | `app/pda/**`, 必要时最小修正 BFF | Android Shell 与 PDA Web 输出 | Phase 1 验收结论 | completed |

## 7. 当前 slice

- slice:
  - PDA Phase 1 system foundation
- scope:
  - `app/pda/web` 工程骨架
  - `app/pda/android` 工程骨架
  - Android WebView 加载本地 Vue3 静态资源
  - 最小 JS Bridge
  - `/pda/*` BFF 最小接口
  - 登录、会话恢复、退出、权限摘要、设备信息、扫码测试、拍照测试、heartbeat、日志手动上传、版本策略
- ready definition:
  - 东集 Cruise Ge 真机可安装 APK
  - App 可加载本地 Vue3 页面
  - 用户可登录并进入验收工作台
  - 空闲超时可自动退出
  - 扫码事件可显示在扫码测试页
  - 拍照结果可预览
  - 设备信息可展示
  - heartbeat 可上报
  - 本地日志可查看并手动上传
  - 版本过低策略可阻止继续使用

## 8. 主线范围

- 本线程主线：
  - 建立 PDA 终端基础技术与系统能力。
  - 保持 PDA 与 `tenant-web` 边界清晰。
  - 复用现有认证、身份、权限服务，不新增 PDA 专属认证/权限体系。
- 本线程不做：
  - 实现 WMS / MES 业务闭环。
  - 冻结仓库 / 车间作业上下文隔离。
  - 冻结完整设备管理、MDM 或远程控制。
  - 实现离线作业同步。
- 偏移返回条件：
  - 若需要改变认证、session、terminal access 或 token 语义，回到 Terminal Access Policy / auth-service 相关设计。
  - 若需要定义仓库、车间、产线、工位、库区、库位等作业上下文隔离，迁出到独立架构线程。
  - 若需要业务对象扫码识别或正式提交，迁出到 WMS / MES PDA feature。
  - 若需要照片上传与业务附件关联，先冻结统一附件或 PDA upload contract。

## 9. Phase 1 能力设计

### 9.1 PDA Web

- 使用 Vue3、Vite、TypeScript、Pinia、Vue Router、Vant。
- 自研 PDA 关键组件：
  - 设备状态条
  - 网络状态条
  - 扫码结果面板
  - 拍照测试卡片
  - 会话状态卡片
  - 大按钮操作入口
  - 强反馈成功 / 失败提示
- 首页为开发 / 验收工作台，不作为最终 WMS / MES 首页。

### 9.2 Android Shell

- 使用 Kotlin、Android Gradle Plugin、AndroidX、WebView。
- 加载 APK 内置 Vue3 静态资源。
- 提供自研最小 JS Bridge。
- 管理 refresh token 安全存储。
- 接入扫码、拍照、设备信息、网络状态、震动、蜂鸣与端侧日志。

### 9.3 JS Bridge

Bridge 使用“命令调用 + 事件推送”模型。

命令调用：

- `getDeviceInfo`
- `openCamera`
- `vibrate`
- `beep`
- `getNetworkStatus`
- `saveRefreshToken`
- `clearSession`
- `writeLog`

事件推送：

- `scanResult`
- `networkChanged`
- `sessionCleared`

Bridge 统一返回：

- 成功：`ok = true`，`data` 承载结果，`error = null`
- 失败：`ok = false`，`data = null`，`error.code / error.message` 描述失败原因

Bridge 事件格式：

- `eventId`
- `eventType`
- `occurredAt`
- `payload`

边界规则：

- Android Shell 不识别业务码类型。
- Vue3 页面必须通过 `bridgeClient` 消费 Bridge。
- Bridge 不承载 WMS / MES 业务语义。

### 9.4 Auth And Session

- 登录请求固定 `terminal = PDA`。
- Terminal Access Policy 由独立线程设计与实现，PDA 只消费结果。
- refresh token 由 Android Shell 安全存储。
- Vue3 只持有短期 access token。
- 空闲超时默认 15 分钟，可由 device policy 配置。
- Phase 1 空闲超时自动退出登录。

### 9.5 Scan

- Android Shell 接收扫码事件。
- Vue3 扫码测试页展示扫码内容、时间、来源、长度与最近记录。
- 支持清空记录。
- 支持成功蜂鸣 / 震动反馈。
- Phase 1 不识别胚体码、工单码、库位码或物料码。

### 9.6 Camera

- Android Shell 提供拍照能力。
- Vue3 可调用拍照并预览结果。
- 返回本地文件信息，例如 `localUri / fileName / mimeType / sizeBytes / width / height`。
- Phase 1 不上传照片。
- Phase 1 不绑定质检、异常、WMS 或 MES 业务语义。

### 9.7 Device Heartbeat

- App 启动时 heartbeat 一次。
- 登录成功后 heartbeat 一次。
- 登录后每 5 分钟 heartbeat 一次。
- App 回到前台 heartbeat 一次。
- 登出时 heartbeat 一次。
- 登录态下允许上报 `accountId / tenantId / sessionId`，不上传姓名等展示信息。
- heartbeat 响应预留 `deviceStatus / devicePolicy`。

### 9.8 Logs

- 本地记录关键诊断事件。
- 支持日志查看页。
- 支持清空本地日志。
- 支持手动上传诊断日志到 `/pda/device/logs`。
- 不默认自动上报。
- Phase 1 手动诊断日志允许包含完整扫码值 `scanValue`，但对应事件必须标记 `diagnosticMode`。
- 未来业务日志默认不自动上传完整业务扫码值，除非用户手动触发诊断上传。
- 不记录密码、token、完整个人隐私、大段业务数据或完整业务单据。

### 9.9 Version Policy

- App 上报 `appVersion`。
- bootstrap / heartbeat 返回 `minSupportedAppVersion`。
- 当前版本低于最低支持版本时，PDA 显示版本过低并阻止继续使用核心功能。
- Phase 1 不做自动升级。
- Phase 1 通过手动安装 APK 完成开发验收与小范围试点。

## 10. PDA BFF 最小契约

Phase 1 最小接口：

- `POST /pda/auth/login`
- `POST /pda/auth/logout`
- `GET /pda/session/bootstrap`
- `POST /pda/device/heartbeat`
- `POST /pda/device/logs`

接口边界：

- BFF 固定 `terminal = PDA`。
- BFF 负责终端 DTO、设备 metadata、trace / audit metadata 与下游服务编排。
- BFF 不拥有认证、身份、权限、设备治理或业务域真相。
- `POST /pda/auth/login` Phase 1 只实现账号密码登录。
- `GET /pda/session/bootstrap` 不返回 WMS / MES 业务任务，只初始化验收工作台。
- `POST /pda/device/heartbeat` 允许未登录状态上报。
- `POST /pda/device/logs` 支持手动上传诊断日志。

## 11. 阻塞 / 依赖

- Terminal Access Policy 设计与实现已完成独立主线，PDA 通过 `/pda/auth/*` 消费其最终拒绝语义。
- PDA BFF device heartbeat / logs contract 已冻结，见 [pda-device-bff.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/api-gateway/pda-device-bff.md)。
- 东集 Cruise Ge 扫码接入已通过真机广播路径验证。
- 东集 Cruise Ge 设备标识读取已通过真机验证，并保留 App-generated fallback。
- Android 9 WebView 与本地资源加载策略已通过真机验证；PDA Web build target 固定为 `chrome66`。
- refresh token 安全存储已在 Android Shell 中验证；Phase 2 设备治理已将 PDA 调整为只恢复设备 enrollment，不跨 App 关闭恢复用户登录态。

## 12. 派生问题 Ledger

| 时间 | 问题 | 分类 | 当前影响 | 处理策略 | 目标落点 | 状态 |
| --- | --- | --- | --- | --- | --- | --- |
| 2026-05-13 | 终端准入策略 | Blocker-Later | Phase 1 已可消费 PDA 登录准入结果 | 已迁出独立线程冻结与实现 | `docs/plans/features/terminal-access-policy.md` | completed-for-phase-1 |
| 2026-05-13 | 仓库 / 车间 / 工厂作业上下文与权限隔离 | Sidecar | Phase 1 不做强隔离，但后续 WMS / MES PDA 必须依赖 | 单独开架构线程讨论 | `docs/architecture/collaborations/**` 或 ADR | moved-to-backlog |
| 2026-05-13 | 完整设备管理、设备禁用与 MDM | Blocker-Later | Phase 1 只预留 deviceStatus/devicePolicy | 后续设备管理 feature 冻结 | `docs/plans/features/**` | moved-to-backlog |
| 2026-05-13 | 照片上传与附件服务 | Blocker-Later | Phase 1 只拍照预览，不上传 | 后续统一附件或 PDA upload contract 设计 | `docs/contracts/**` | moved-to-backlog |

## 12.1 Phase 2 Backlog

| 主题 | 建议下一线程 | 为什么不属于 Phase 1 |
| --- | --- | --- |
| PDA 设备管理 | 设备注册、绑定、禁用、在线状态、版本管理、远程强制退出、设备在线看板 | 需要稳定设备 registry 真相与管理 UI，不能混入 Phase 1 诊断态 heartbeat。 |
| 作业上下文隔离 | 工厂、车间、仓库、库区、库位、产线、工位与账号可操作范围 | 会影响 WMS / MES 权限模型、组织边界与资源 scope，需要独立架构冻结。 |
| WMS PDA 业务闭环 | 收货扫码、库存查询、上架、拣货、盘点等 | 属于 WMS 业务规则与单据状态变更，必须另起 feature packet。 |
| MES PDA 业务闭环 | 胚体扫码查询、工序完成、报工、质检等 | 属于 MES 业务规则与工序顺序控制，必须另起 feature packet。 |
| 离线能力 | 离线缓存、只读查询、离线提交策略、冲突处理 | 会改变一致性模型和业务提交边界，不能作为 Phase 1 网络兜底。 |
| 照片上传与附件 | 拍照附件上传、业务对象关联、存储策略、权限与审计 | 需要统一附件契约和业务归属，Phase 1 只验证相机能力。 |
| App 分发与升级 | 版本检查、强制升级、APK 分发、MDM / 企业设备管理 | 需要运维与设备治理策略，Phase 1 只做手动安装验收。 |

## 13. 验收标准

- APK 可在东集 Cruise Ge Android 9 真机安装并启动。
- WebView 成功加载 APK 内置 Vue3 静态资源。
- 登录成功后进入 PDA 验收工作台。
- 退出登录后无法继续访问受保护工作台。
- access token 不长期写入 Vue3 localStorage。
- Android Shell 可保存并清理 refresh token。
- 空闲超时默认 15 分钟后自动退出。
- 设备信息卡展示 `deviceId / idSource / deviceModel / androidVersion / appVersion`。
- 扫码测试页可以收到并展示真实扫码事件。
- 拍照测试卡片可以打开相机、拍照、预览并展示本地文件信息。
- 网络状态变化可反映到 UI。
- heartbeat 可以上报设备与登录态诊断字段。
- 日志页可展示本地诊断日志并手动上传。
- 低于 `minSupportedAppVersion` 时阻止继续使用核心功能。
- Phase 1 不出现 WMS / MES 正式业务提交入口。

## 14. 关闭条件

- PDA 终端真相源已创建并被 feature packet 引用。
- PDA Phase 1 feature packet 已冻结。
- PDA BFF contract 已冻结。
- Android Shell 与 PDA Web 最小实现已完成。
- 东集 Cruise Ge 真机验收通过。
- 登录、会话、扫码、拍照、设备信息、heartbeat、日志、版本策略均有验证记录。
- 后续 WMS / MES、设备管理、离线能力、作业上下文隔离均已迁出为独立后续主题。

## 15. Phase 1 验收记录

| 验收项 | 当前结果 | 证据 / 备注 |
| --- | --- | --- |
| APK 真机安装与启动 | passed | 东集 Cruise Ge Android 9 已多次安装并启动 `com.oes.pda` debug APK。 |
| PDA 登录与会话恢复 | passed | `/pda/auth/*` 登录成功；退出 App 后重新打开可恢复登录态。 |
| 终端准入 | passed | PDA 登录走 Terminal Access Policy；非 PDA 准入账号会被拒绝。 |
| 双 LAN BFF 访问 | passed | 支持 `192.168.2.33` 与 `192.168.100.44` fallback，并记忆最近可用地址。 |
| 扫码诊断 | passed | 真机扫码可显示完整扫码值、来源、适配器、长度与时间。 |
| 拍照诊断 | passed | 真机可打开相机、拍照、返回本地预览与文件 metadata。 |
| 日志本地记录 | passed | 扫码与拍照后日志卡片待上传数量会增加；已修复 Android WebView 66 缺少 `Object.fromEntries` 的兼容问题。 |
| 日志手动上传 | passed | `/pda/device/logs` smoke 返回 `accepted = true`；上传成功后 UI 显示后端确认接收条数与 server time。 |
| 日志上传失败体验 | passed | 上传失败时本地日志保留，UI 提示“日志已保留，可稍后重试”。 |
| heartbeat | passed | `/pda/device/heartbeat` 可接收未登录 / 已登录设备状态并返回 Phase 1 device policy。 |
| Phase 1 业务边界 | passed | 当前 APK 不包含 WMS / MES 正式业务提交入口。 |
