# party-service Merge API

## 1. 模块职责

`PartyMergeService` 负责主体受控合并接口。

第一阶段适用场景：

- 确认历史上重复创建了多个 canonical `Party`
- 需要把重复主体归并到一个保留主体
- 需要让后续租户绑定和查询都指向同一主体真相

调用约束：

- 接口类型：内部服务接口
- 服务：`PartyMergeService`
- 调用方：内部服务
- 必要 guard：
  - internal service
  - authenticated operator
  - permission guard

## 2. 通用上下文要求

所有 merge 接口都要求：

- internal service 调用上下文
- operator context
- trace context
- 审计元数据

merge 是高风险管理动作，必须保留完整审计链路。

## 3. 合并主体

### `MergeParties`

- 作用：将一个或多个重复主体归并到保留主体
- 请求关键字段：
  - `survivor_party_id`
  - `merged_party_ids[]`
  - optional `reason`
- 关键语义：
  - `survivor_party_id` 是最终保留的 canonical 主体
  - `merged_party_ids[]` 中的主体会被标记为 merged 状态
  - merge 不等于删除；历史查询与审计仍应可追溯到被并入主体
  - merge 后，后续租户绑定和主体解析应指向保留主体
- 响应关键字段：
  - `survivor_party`
  - `merged_parties[]`
  - `merge_record`

## 4. 主要副作用

- 被并入主体状态切换为 merged / inactive 类状态
- 主体解析链路重定向到保留主体
- 相关 `TenantParty`、标识、关系或历史引用的处理策略需要在实现阶段明确，但调用方不能假设 merge 会物理删除历史数据
- 记录审计事件

## 5. 主要错误语义

调用方应重点关注这几类失败：

- validation failure
  - 请求字段缺失、主体列表为空、重复主体输入
- permission denied
  - operator 不具备 merge 管理权限
- not found
  - `survivor_party_id` 或某个 `merged_party_id` 不存在
- invalid merge
  - 例如把主体并入自身、尝试合并状态不允许的主体、尝试跨不兼容主体类型 merge
- conflict
  - merge 前置条件不满足，或当前主体已被其他 merge 流程占用

## 6. 第一阶段治理边界

- 第一阶段只冻结 `MergeParties` 的黑盒语义，不冻结完整 merge 审批流或 unmerge 流程。
- 普通业务服务不得把 merge 当作日常写接口调用。
- merge 结果会影响后续主体解析和绑定，但不能替代业务单据自己的历史快照。
- 若未来需要 `UnmergeParties`、merge preview、merge approval 或批量治理，应单独新增 contract / feature packet。
