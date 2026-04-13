# OES Feature 执行复杂度评估规范

## 1. 目的

本文档定义 OES 在启动一个 feature 或一个实现任务前，如何判断其执行复杂度，并据此选择合适的 thread 协作方式。

这里的“执行复杂度”不是代码难度本身，而是：

- 边界复杂度
- 契约稳定度
- 协作成本
- 验证成本
- 迁移成本
- 文档漂移风险

本文档的目标是回答：

- 这个任务能否单 thread 闭环
- 是否必须先有 design thread
- 是否适合 producer / consumer 并行
- 是否必须先冻结契约
- 是否需要 review / integration 收口

## 2. 六个评估维度

### 2.1 Boundary Complexity

判断问题：

- 是否跨多个服务
- 是否跨多个 bounded context
- 是否涉及 `src/common`、proto、operator context、权限语义、租户语义

经验判断：

- 只改单模块内部实现 -> 低
- 跨两个服务但契约稳定 -> 中
- 涉及共享边界或高影响语义 -> 高

### 2.2 Contract Stability

判断问题：

- 契约是否已冻结
- request / response 是否稳定
- error semantics 是否清楚
- 是否已有 fixture

经验判断：

- 已冻结且有 fixture -> 低
- 基本稳定但仍可能补字段 -> 中
- 仍在探索接口形状 -> 高

### 2.3 Coordination Complexity

判断问题：

- 是否需要多个 owner 配合
- 是否存在前后端或多服务相互等待
- 是否需要多个 thread 频繁往返确认

经验判断：

- 一个 thread 闭环 -> 低
- 两个 owner 可并行 -> 中
- 多个 thread 必须频繁同步 -> 高

### 2.4 Verification Complexity

判断问题：

- 是否可局部 build / test 验证
- 是否必须两服务联调
- 是否必须前后端全链路验证
- 是否涉及一致性、缓存、权限、导航等联动

经验判断：

- 局部单测 / build 即可 -> 低
- 两模块联调 -> 中
- 全链路或多态联动 -> 高

### 2.5 Migration Complexity

判断问题：

- 是否修改已有行为
- 是否要兼容历史接口
- 是否涉及状态迁移、数据兼容、前端回退策略

经验判断：

- 全新能力 -> 低
- 旧能力增强 -> 中
- 涉及兼容与过渡期 -> 高

### 2.6 Drift Risk

判断问题：

- 是否容易在多份文档里重复描述
- 是否有多个 thread 同时维护同一 feature 状态
- 是否存在“README + plan + followups + summary”重复同步风险

经验判断：

- 单一真相源清楚 -> 低
- 存在多个说明页 -> 中
- 多 owner 同时改多份描述 -> 高

## 3. 复杂度如何使用

### 3.1 低复杂度

典型特征：

- 单模块
- 契约稳定
- 可局部验证
- 无明显漂移风险

推荐做法：

- 一个 thread 直接闭环
- 不强制建立 feature packet
- 不需要独立 design thread

### 3.2 中复杂度

典型特征：

- 跨前后端或跨两个服务
- 契约可冻结
- 可以通过 fixture 并行推进
- 联调成本可控

推荐做法：

- 建立 feature packet
- 先冻结最小契约
- producer / consumer owner 并行
- 需要 review 或 integration 收口

### 3.3 高复杂度

典型特征：

- 跨多个服务或共享边界
- 契约不稳定
- 实现中容易发现设计缺口
- 验证依赖全链路
- 漂移风险高

推荐做法：

- 先有 design thread
- 必要时先更新 architecture / ADR
- 冻结最小契约后再开实现 thread
- 必须建立 feature packet
- 必须显式 review / integration

## 4. 选择协作模式的规则

### 4.1 何时单 thread 直接做

同时满足以下条件时，可以单 thread：

- Boundary Complexity 低
- Contract Stability 低或中且已清楚
- Verification Complexity 低
- Drift Risk 低

### 4.2 何时必须先有 design thread

满足任一条时，默认先 design：

- Contract Stability 高
- Boundary Complexity 高
- 需要修改边界、契约、权限、租户、operator context 等高影响事项
- 同一个 feature 如果没有先设计就会导致多个 thread 相互等待

### 4.3 何时允许 producer / consumer 并行

必须同时满足：

- 最小契约已冻结
- 已有 fixture / sample payload
- 写路径可隔离
- 双方验收边界清楚

### 4.4 何时必须 integration 收口

满足以下任一情况时，建议 integration：

- 多个 thread 修改结果需要合并
- 验证需要全链路
- 存在兼容或缓存一致性问题
- 存在权限、导航、上下文等联动

## 5. 设计变更时的升级规则

执行中允许发现设计缺口，但不允许 implementation thread 私自把局部变更写成最终边界。

当出现以下情况时，必须升级：

- 需要改 contract
- 需要改 owner 分工
- 需要新增共享状态模型
- 需要连续解决多个派生 blocker 才能继续主线

升级目标通常是：

- design thread
- contract owner
- architecture / ADR owner

## 6. 当前默认建议

对于 OES 当前阶段，默认采用以下判断顺序：

1. 先判断是否跨服务或跨前后端
2. 再判断契约是否已经冻结
3. 再判断是否能用 fixture 并行
4. 再判断验证是否需要全链路
5. 最后决定：
   - 一个 thread 闭环
   - 一个 design thread + 两个 owner thread
   - 先 architecture / ADR，再进入实现

结论：

- 执行复杂度的作用不是给任务“打分”
- 而是帮助我们在开工前选择正确的协作模式
- 复杂度判断得越早，越不容易在实现中偏移主线
