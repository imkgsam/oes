# ADR 0010: Site Publish Sync Concurrency

## Status

Accepted — 2026-07-22

## Context

Site Service 允许运营人员在正式 Sync 进行期间继续保存内容，也允许同一 Site 收到近乎同时发生的 Sync 请求。与此同时，Site Runtime 可能正在拉取一个正式版本时收到更高版本对应的新 webhook。

如果发布方只用普通状态标记清账，并发编辑可能被旧 Sync 误认为已经发布；如果两个 Sync 同时读取同一个当前版本，则可能创建重复的下一 publishVersion。Runtime 若在多批或多页读取中跟随变化中的 latest，则可能把不同版本的 public views 与 Site Exposure Publication 混合提交。

## Decision

### OES publish serialization

- 同一 Site 的正式 Sync 使用 site-scoped 数据库事务锁串行化；不同 Site 互不阻塞。
- 竞争者只允许有限等待。取得发布权后必须基于最新已提交状态重跑完整事务，而不是继续使用锁外读取的旧状态；随后按实际 pending changes 成为 no-op 或创建下一版本。
- 同一 Site 的 publishVersion 唯一性由数据库唯一约束提供最终并发防线。该约束的具体 schema 与 migration 由后续实现任务设计和交付。

### Pending revision and CAS clearing

- 每个 pending resource 使用 Site Service 内部 revision 表达本次待发布编辑。
- Sync 在构建 pending snapshot 时捕获 expected revision，只能用 compare-and-set 清除自己确实物化的 revision。
- Sync 期间的新编辑不获取发布锁，也不应被阻塞；它产生更高 revision，并继续保持 pending 供下一批发布。
- 不允许以资源 id 为单位笼统标记“已同步”，也不允许旧 Sync 清除自己未读取的新 revision。

### Atomic publication

- publishVersion、pending snapshot、目标版本 public views、Site Exposure Publication、CAS 清账结果、sync batch 与 Site 最新版本在同一数据库事务中提交。
- 任一步失败都回滚整轮，不得留下可见的部分版本、部分公开输出或错误清账。
- 只有正式事务提交成功且确有变化后，才为该 publishVersion 创建并发送新的 webhook 通知。Webhook 失败允许重发，不回滚已提交版本；无变更 no-op 不发送 webhook。

### Runtime pinned target and catch-up

- Runtime 先通过 `GetLatestPublishState` 发现 latest committed publishVersion，再将其固定为本轮 target。Webhook publishVersion 只是唤醒提示，不是同步读取真相。
- `ListChangedResources.to_publish_version`、每次 `BatchGetPublicViews.target_publish_version` 与每一页 `GetSnapshot.target_publish_version` 必须显式携带该 target；本轮 delta、snapshot、public views 与 Site Exposure Publication 必须全部属于该 target。任何版本不一致都使整轮失败，Runtime 不得混合或部分提交。
- Runtime 正在同步时收到新 webhook 或 pull trigger，只记录一个合并后的 pending trigger，不并行写本地 published store。
- 当前 target 成功提交后，Runtime 重新发现 latest 并自动追赶更高版本。若当前 target 因版本漂移、网络或校验失败而未完成，Runtime 保留上一个完整本地版本，并通过 pending trigger、定时 pull fallback 或 startup recovery 再次发现 latest。
- 上述追赶不需要操作者再次点击 OES Sync，也不需要人工触发 Runtime Sync。

### Version-addressable published output

- Site Service 必须能够按仍可读取的 target 返回该版本不可变的 public views 与 Site Exposure Publication；只保存会被下一次发布覆盖且无法按 target 读取的单份 latest 行不满足本决策。
- 该能力是 Site 统一同步版本，不为 FAQ 或其他资源分别新增运营版本历史、选择版本或回滚界面。
- 发布 N+1 不得污染 N。Target 缺失时不得默认为 latest；target 未提交、不可读取或超出保留范围时必须显式失败，Runtime 不得接受 latest fallback。
- P1 采用显式 target 字段，不引入 server-issued sync session / snapshot token。保留策略与物理存储形式由实现设计，但必须满足黑盒契约中的可读窗口与失败语义。

本决策新增 `BatchGetPublicViews.target_publish_version` 与 `GetSnapshot.target_publish_version` shared contract 字段；`ListChangedResources.to_publish_version` 继续承担 delta target。字段与错误语义以 Site Service [sync-api.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/site-service/sync-api.md) 为准。

## Consequences

- 同一 Site 的 OES 发布吞吐受控串行，但避免重复版本与互相覆盖；不同 Site 仍可并行发布。
- 内容编辑不因正式发布而长时间锁定，新编辑稳定进入下一批。
- Runtime 永远只暴露上一个完整本地版本或新完成的完整版本，不暴露半同步状态。
- 实现必须提供有限锁等待、完整事务重试、revision/CAS、数据库版本唯一性、target-addressable public output 与失败注入测试；这些属于后续实现任务，本 ADR 不冻结具体 schema 或 migration。

## Alternatives Considered

### 用进程内布尔值阻止重复 Sync

拒绝。它不能覆盖多实例部署、进程崩溃或数据库层并发，也不能保护 publishVersion 唯一性。

### Sync 期间禁止内容编辑

拒绝。长时间业务锁降低运营体验，且不能替代资源级清账正确性。

### Sync 完成时清除资源全部 pending 状态

拒绝。它会误清同步期间保存的新 revision，使未发布编辑长期失去待同步信号。

### Runtime 始终读取变化中的 latest

拒绝。分页和分批读取会形成混合版本，破坏本地原子发布与可恢复性。

### Server-issued sync session / snapshot token

P1 拒绝。它能封装 target 与保留租约，但会新增 session 创建、过期、恢复、签名与清理生命周期；当前显式 target 已能以更透明的方式满足一致性要求。

### 为 FAQ 建立独立版本控制

拒绝。FAQ 只随 Site 统一 publishVersion 生成 `FaqDirectoryPublicView`；独立 FAQ 历史版本、选择版本或回滚不属于同步一致性需求。

## Related Documents

- [site-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/site-service.md)
- [sync-api.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/site-service/sync-api.md)
- [public-views.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/site-service/public-views.md)
- [site-runtime-kit.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/site-runtime-kit.md)
