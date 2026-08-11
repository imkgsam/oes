# PDA 终端架构真相源

> PDA 终端不拥有 terminal access、access summary、Role、Policy 或授权判定真相；这些服务设计边界以 [permission-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/permission-service.md) 为准。

## 1. Purpose

`PDA` 是 OES 面向车间、仓库等现场作业场景的 Android 设备端终端。

本文件作为 PDA 终端的长期稳定设计真相源，负责回答：

- PDA 是什么终端
- PDA 与 `tenant-web`、未来 `mobile` 的边界是什么
- PDA 如何接入认证、权限、设备能力与 BFF
- PDA 不拥有哪些业务、认证、权限或设备治理真相
- PDA Phase 1 与后续演进的边界如何划分

## 2. Core Positioning

- PDA 是独立 Android 设备端，不是 `tenant-web` 的小屏改版。
- PDA 面向现场高频作业、扫码、拍照、设备诊断与未来 WMS / MES 任务流。
- PDA 的第一阶段目标是打通端侧系统基础能力，不承载 WMS / MES 业务闭环。
- PDA 可以使用 Web 技术实现业务层，但运行形态是受控 Android APK，而不是浏览器 H5 页面。

## 3. Owns

PDA 终端拥有：

- Android APK 交付形态
- Android Shell 与 WebView 容器
- Vue3 PDA 业务层与验收工作台
- PDA 专用 JS Bridge client
- PDA 端设备能力调用体验
- PDA 端 session 执行策略，例如空闲超时后退出
- PDA 端扫码、拍照、网络状态、日志与设备信息的终端呈现
- PDA 端对 `/pda/*` BFF 的消费模型

## 4. Does Not Own

PDA 终端不拥有：

- 认证、密码、MFA、session 与 token 真相；这些属于 `auth-service`
- `User / UserAccount`、员工绑定、身份映射真相；这些属于 `identity-service`，HR `Employee / Employment` 设计以 [hr-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/hr-service.md) 为准
- 权限码、角色、policy、terminal access 与授权判定真相；这些属于 `permission-service`
- 仓库、库存、库位、收货、出库等 WMS 业务真相；这些属于 `wms-service`
- 工厂、车间、产线、工位、工序、生产对象等 MES 业务真相；这些属于 `mes-service` 或后续冻结的生产资源真相源
- 设备注册、设备绑定、设备禁用、MDM 与版本治理真相；这些需要后续设备管理能力冻结
- 业务操作的最终成功事实；PDA 只能提交请求，业务服务负责确认

## 5. Terminal Boundaries

### PDA vs tenant-web

- `tenant-web` 面向办公室、管理端、配置端和复杂表格/治理场景。
- `PDA` 面向现场作业设备，优先支持扫码、拍照、大按钮、强反馈、多人共用和设备诊断。
- PDA 不复用 `tenant-web` 的页面、layout、菜单树、管理台组件或后台表格交互。
- PDA 可复用平台契约、错误模型、权限码常量、类型生成和工具链，但不得复用 `tenant-web` 的业务 UI 结构。

### PDA vs mobile

- `PDA` 面向工业 Android 设备与现场任务流。
- 未来 `mobile` 可面向移动办公、审批、查询与协同场景。
- PDA 和 mobile 可以共享底层认证 client、API client、类型、错误模型和设计 token，但不默认共享 App、页面路由、首页结构或任务交互。

## 6. Technical Shape

PDA 采用以下目标技术形态：

- Android APK
- Kotlin Android Shell
- AndroidX WebView
- Vue3 + Vite + TypeScript
- Pinia
- Vue Router
- Vant
- 自研 PDA 关键组件
- 自研最小 JS Bridge
- Vue3 静态资源随 APK 打包

代码结构目标：

- `app/pda/web`
  - Vue3 PDA 业务层、验收工作台、Bridge client、PDA API client
- `app/pda/android`
  - Android Shell、WebView 容器、JS Bridge 原生实现、扫码、拍照、secure storage、设备信息、网络状态与日志能力

## 7. BFF Boundary

PDA 使用独立 `/pda/*` BFF 外部契约，但内部复用 OES 平台服务。

Phase 1 最小 BFF 能力：

- `POST /pda/auth/login`
- `POST /pda/auth/logout`
- `GET /pda/session/bootstrap`
- `POST /pda/device/heartbeat`
- `POST /pda/device/logs`

边界规则：

- PDA BFF 只做终端聚合、DTO 校验、设备 metadata 归一化与下游服务编排。
- PDA BFF 不拥有认证、身份、权限、设备治理或业务域真相。
- 登录请求必须固定 `terminal = PDA`，Terminal Access Policy 以独立设计和实现为准。
- Phase 1 `/pda/auth/login` 只正式支持账号密码登录。
- PDA Employee Code + Terminal PIN 登录启用后，PDA 默认入口使用 `employeeCode + TERMINAL_PIN`；员工码语义以 [hr-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/hr-service.md) 为准，员工账号绑定以 [identity-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/identity-service.md) 为准，PIN credential 与 session 以 [auth-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/auth-service.md) 为准。
- 工牌、IC 卡、NFC、badge credential service 不属于 PDA Employee Code + Terminal PIN 登录阶段。
- `/pda/session/bootstrap` 是 PDA 启动聚合接口，一次返回 account、session、access、device policy、version policy、workbench 与 server time。
- `/pda/device/heartbeat` 用于保存最近设备 / App 状态，允许未登录和已登录状态上报。
- `/pda/device/logs` 用于手动上传诊断日志，Phase 1 允许诊断日志携带完整扫码值，但必须标记 `diagnosticMode`。
- 受管设备 enrollment 激活后由 Terminal Device Service 返回一次性 `deviceCredential`；Android shell 使用 Keystore 加密保存，后续登录前设备判定、heartbeat、bootstrap 与诊断上传必须携带。该 credential 只证明设备 secret 持有，不代表 HUMAN session 或业务权限。
- 后续 WMS / MES PDA 能力应通过 `/pda/*` 场景契约暴露，但业务规则仍由对应业务服务拥有。

## 8. JS Bridge Boundary

PDA JS Bridge 使用“命令调用 + 事件推送”模型。

正式端内契约位置：

- [js-bridge.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/pda/js-bridge.md)

命令调用表示 Vue3 主动请求 Android Shell 执行设备能力，例如：

- 获取设备信息
- 打开相机
- 震动
- 蜂鸣
- 获取网络状态
- 保存或清理安全凭证

事件推送表示 Android Shell 主动通知 Vue3 设备事件，例如：

- 扫码结果
- 网络状态变化
- 原生层清理 session

Phase 1 Bridge 能力：

- 设备信息
- 扫码事件
- 摄像头拍照
- 声音 / 震动反馈
- 网络状态
- 端侧日志
- refresh token 安全存储

Bridge 契约规则：

- Bridge 是跨 PDA 设备的统一设备能力契约，不是东集 Cruise Ge 专属接口。
- Android Shell 负责适配具体厂商设备、扫码 SDK、广播格式、WebView 细节与 Android API。
- Vue3 只消费稳定的 OES PDA Bridge API。
- Bridge 只承载设备 / 容器能力，不承载 WMS / MES 业务语义。
- 所有命令异步返回统一 `ok / data / error` 结构。
- 扫码、网络变化、session 清理等设备事件通过事件推送给 Vue3。
- 事件推送应包含 `eventId / eventType / payload / occurredAt`。
- Vue3 必须通过 `bridgeClient` 统一封装 Bridge 调用，页面不得直接访问原始 Android 对象。
- Android Shell 不识别业务码类型，只负责把扫码结果推给 Vue3。
- PDA Employee Code + Terminal PIN 登录阶段，Vue3 扫码登录只接受 `OES:EMPLOYEE:<employeeCode>` 员工条码并解析为纯 `employeeCode`；手动输入仍可提交纯 `employeeCode`；Android Shell 不解析员工码，也不识别工牌或业务码语义。

明确后置：

- 蓝牙打印
- NFC
- 后台前台服务
- 开机自启
- MDM 集成

## 9. Session And Security

PDA 是多人共用设备，因此 Phase 1 使用以下安全策略：

- refresh token 由 Android Shell 安全存储。
- Vue3 只持有短期 access token，不长期写入 localStorage。
- 退出登录时 Android Shell 与 Vue3 都必须清理登录态。
- App 冷启动时 Android Shell 可以尝试用 refresh token 恢复 session。
- 恢复失败时进入登录页。
- 空闲超时默认 15 分钟，可由 device policy 配置。
- Phase 1 空闲超时后自动退出登录。
- 不同 terminal 应使用不同 session policy；具体 TTL 由 `auth-service` 与 Terminal Access Policy 相关设计冻结。

## 10. Device Identity And Heartbeat

Phase 1 设备标识策略：

- 优先读取东集 Cruise Ge 可稳定提供的设备序列号 / SN / 厂商设备 ID。
- 如果读取成功，作为 `deviceId` 来源。
- 如果读取失败、为空、权限不足或格式异常，则生成 `appDeviceId`。
- 需要上报 `idSource`，用于区分厂商标识与 App 生成标识。
- 同时上报 `deviceModel / manufacturer / androidVersion / appVersion`。

Heartbeat 语义：

- heartbeat 用于检测 PDA App 运行状态与设备诊断状态，不用于判断用户登录真相。
- 用户信息只是在登录态下的诊断附加字段。
- Phase 1 heartbeat 不承诺关机、锁屏、App 未启动时仍可上报。
- 服务端通过 `lastHeartbeatAt` 推断最近 App 活跃状态。

Phase 1 heartbeat 字段可包含：

- `deviceId`
- `idSource`
- `deviceModel`
- `manufacturer`
- `androidVersion`
- `appVersion`
- `networkStatus`
- `batteryLevel`
- `appState`
- `accountId`，登录态下允许
- `tenantId`，登录态下允许
- `sessionId`，登录态下允许
- `timestamp`

## 11. Device Management Boundary

设备管理是 PDA 的重要后续方向，但 Phase 1 不做完整设备管理后台。

Phase 1 只做：

- 设备标识采集
- heartbeat 上报
- 最近设备状态保存
- bootstrap / heartbeat 响应预留 `deviceStatus / devicePolicy`
- `deviceStatus` 暂固定为 `ACTIVE`
- `devicePolicy` 暂返回默认策略

Phase 2 / Phase 3 后续考虑：

- device registry
- 设备列表
- 设备详情
- 设备禁用
- 设备绑定 / 分组
- 设备日志查看
- App 版本分布
- 前台服务 heartbeat
- 开机自启
- MDM / 企业设备管理
- 远程强制退出
- 版本升级策略
- 设备在线看板

设备禁用第一阶段应按服务端状态控制演进：设备下次 heartbeat / bootstrap / API 请求时生效。实时远程控制需要 MDM、推送、长连接或前台服务，不能作为 Phase 1 承诺。

## 12. Version Policy

PDA 是 APK 静态打包，因此版本策略必须从 Phase 1 预留。

Phase 1：

- App 上报 `appVersion`
- bootstrap / heartbeat 返回 `minSupportedAppVersion`
- 如果当前 `appVersion < minSupportedAppVersion`，PDA 显示版本过低并阻止继续使用核心功能
- 不做自动下载 / 自动升级
- APK 分发 Phase 1 使用手动安装，后续再设计 MDM 或企业分发

## 13. Phase 1 Baseline

PDA Phase 1 只做系统基础能力：

- Android APK
- Vue3 静态资源随 APK 打包
- Android Shell
- JS Bridge
- `/pda/*` BFF 最小契约
- 用户登录
- 会话恢复 / 退出 / 过期处理
- 权限摘要获取
- 开发 / 验收工作台首页
- 扫码事件接入与扫码测试页
- 手动输入兜底
- 摄像头拍照与预览
- 设备信息采集
- heartbeat
- 本地日志 + 手动上传
- 版本过低提示 / 拦截
- 断网提示与在线提交保护

Phase 1 不做：

- WMS 收货 / 上架 / 盘点等业务闭环
- MES 胚体扫码 / 工序完成等业务闭环
- 离线业务提交
- 仓库 / 车间作业上下文强隔离
- 设备绑定到仓库 / 车间 / 工位
- 完整设备管理后台
- 自动升级
- 蓝牙打印
- NFC
- 照片 / 业务附件上传

## 14. Open Design References

以下主题应在独立线程冻结，不混入 PDA Phase 1 主线：

- Terminal Access Policy
- 仓库、车间、工厂、作业上下文与权限隔离
- 设备注册、绑定、禁用与 MDM
- WMS PDA 业务闭环
- MES PDA 业务闭环
- 离线作业与本地同步队列
- 统一附件 / 照片上传服务
