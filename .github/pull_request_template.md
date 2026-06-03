# Summary

Describe the purpose of this pull request in one or two paragraphs.

## Scope

- [ ] One service
- [ ] One frontend surface
- [ ] One contract
- [ ] One governance or documentation topic
- [ ] One narrowly related cross-service collaboration

## Architecture Boundary

Explain which service, frontend, contract, or governance document owns the change.

If this PR changes a stable boundary, link the updated truth source:

- `docs/architecture/services/<service-name>.md`
- `docs/architecture/collaborations/<collaboration>.md`
- `docs/contracts/**`
- `docs/adr/**`

## Tenant, Permission, And Audit Impact

Describe any impact on:

- Tenant or organization isolation.
- Operator context.
- Trace context.
- Permission, role, scope, or policy behavior.
- Audit metadata.

Write "No impact" only when you have checked the relevant path.

## Verification

List the commands, tests, screenshots, traces, or manual checks performed.

```text
pnpm proto:lint
pnpm common:build
```

## Reviewer Notes

Call out risky areas, known limitations, follow-up work, or questions for maintainers.
