# V2 Delivery Records

一个 repository Delivery Owner（DO）对应一个 active record：`docs/plans/deliveries/<delivery-key>.md`。

## Minimal template

```markdown
# <Delivery>

deliveryKey: <key>
ownerRole: DO
baseSha: <origin/main SHA>
candidateSha: pending | <SHA>
pullRequest: pending | <URL>
ciBaselineChecks: pending | passed | failed
rv: pending | passed | findings
cleanup: hold | confirmed | complete

## Objective

## Scope

## Protected scope

## Dependencies

## Acceptance

## Self-test evidence

## Remaining risk

## Rollback
```

只有 exact DO 写自己的 record。内容原位更新，不追加时间线、聊天、内部 task 消息或重复日志。CO 的协调状态保存在 task-local current evidence；默认 aggregate PR 不建立另一个 repository packet。合并与 main 验证成功后，record 只能在独立 cleanup 边界删除。

完整规则见 [文档治理](../../governance/document-governance.md) 与 [执行模型](../../governance/codex-execution-model.md)。
