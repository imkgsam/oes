# Doc Traceability Correction

更新时间：2026-03-22 18:35:00 +08:00

## 本次目标

- 修正 `auth-service` 文档未完全遵循仓库规范的问题
- 为 `design -> tasks -> history -> global review` 建立完整追踪链路

## 修改范围

- `requirements.md`
- `design/*.md`
- `INDEX.md`
- `history/*.history.md`
- 个别 `tasks/*.md` 的阻塞项同步

## 主要改动

- 在 `requirements.md` 中补充设计任务状态表和全局审核记录要求
- 所有专题设计文档改为使用 Markdown 表格维护关联任务完成情况
- `auth-center.md` 补充总任务状态表
- 新增最小闭环全局审核记录
- 新增工程基线恢复历史记录
- 更新 `INDEX.md` 的历史入口与最新审核入口

## 备注

- 本次只修正文档追踪链路，不变更代码行为
