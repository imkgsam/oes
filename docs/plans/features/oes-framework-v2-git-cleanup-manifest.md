# OES Framework v2 Git Cleanup Manifest

- Audit date: 2026-07-28
- Audit baseline: `origin/main` = `a1597e8ea03baffafd8b3cca59770f8fdcadcc69`
- Scope: 26 linked worktrees and 22 local branches
- Mutation performed: none

This manifest is advisory. `SAFE_AFTER_APPROVAL` means the worktree is clean and its HEAD is already an ancestor of `origin/main`; it does not authorize removal. `KEEP_UNMERGED` means Git reports branch-only commits not represented by equivalent patches on `origin/main`. `KEEP_REGISTERED` means the surface is clean but belongs to a capability that may still resume. The active maintenance worktree remains `KEEP_ACTIVE` until its candidate is delivered.

Path abbreviations:

- `$REPO` = `/Users/acehood/Documents/GitHub/oes`
- `$CODEX` = `/Users/acehood/.codex/worktrees`

## Linked worktrees

| Worktree                                                              | Branch/state                                               | HEAD       |                Dirty | In `origin/main`     | Capability/task                   | Recommendation        |
| --------------------------------------------------------------------- | ---------------------------------------------------------- | ---------- | -------------------: | -------------------- | --------------------------------- | --------------------- |
| `$REPO`                                                               | `main`                                                     | `a1597e8e` |                    0 | yes                  | project root                      | `KEEP`                |
| `$CODEX/02a6/oes`                                                     | `codex/exec-crypto-01-tg0`                                 | `c1f426ea` |                    0 | no, 1 unique patch   | EXEC-CRYPTO A/I/01                | `KEEP_UNMERGED`       |
| `$CODEX/2fa3/oes`                                                     | `codex/exec-crypto/i03-trusted-execution-runtime`          | `21ebb9d9` |                    0 | no, 4 unique patches | EXEC-CRYPTO A/I/03                | `KEEP_UNMERGED`       |
| `$CODEX/3410/oes`                                                     | detached                                                   | `73f003f4` |                    0 | yes                  | GRPC integration snapshot         | `SAFE_AFTER_APPROVAL` |
| `$CODEX/475d/oes`                                                     | detached                                                   | `ddab5e77` |                    0 | yes                  | ACTION-GRANT integration snapshot | `SAFE_AFTER_APPROVAL` |
| `$CODEX/4e9d/oes`                                                     | detached                                                   | `3af13e05` |                    0 | yes                  | EXEC-CRYPTO review snapshot       | `SAFE_AFTER_APPROVAL` |
| `$CODEX/6b51/oes`                                                     | `codex/exec-crypto/i04-auth-sts-cryptographic-runtime`     | `8681f43b` |                    0 | no, 4 unique patches | EXEC-CRYPTO A/I/04                | `KEEP_UNMERGED`       |
| `$CODEX/abbf/oes`                                                     | detached                                                   | `9d091829` |                    0 | yes                  | GRPC acceptance snapshot          | `SAFE_AFTER_APPROVAL` |
| `$CODEX/b4ea/oes`                                                     | `codex/grpc/i02-trusted-execution-runtime-baseline`        | `9bcf5768` |                    0 | no, 2 unique patches | GRPC A/I/02                       | `KEEP_UNMERGED`       |
| `$CODEX/b5a2/oes`                                                     | detached                                                   | `3af13e05` |                    0 | yes                  | EXEC-CRYPTO acceptance snapshot   | `SAFE_AFTER_APPROVAL` |
| `$CODEX/c15f/oes`                                                     | detached                                                   | `73f003f4` |                    0 | yes                  | GRPC implementation snapshot      | `SAFE_AFTER_APPROVAL` |
| `$CODEX/c845/oes`                                                     | `codex/exec-crypto-02-tg2`                                 | `66243af4` |                    0 | no, 1 unique patch   | EXEC-CRYPTO A/I/02                | `KEEP_UNMERGED`       |
| `$CODEX/edf3/oes`                                                     | `codex/exec-crypto/x01-integration`                        | `8681f43b` |                    0 | no, 4 unique patches | EXEC-CRYPTO A/X/01                | `KEEP_UNMERGED`       |
| `$REPO/.worktrees/action-grant/d-governance`                          | `codex/action-grant/d-governance`                          | `ddab5e77` |                    0 | yes                  | ACTION-GRANT design               | `KEEP_REGISTERED`     |
| `$REPO/.worktrees/action-grant/x01-integration`                       | `codex/action-grant/x01-integration`                       | `ddab5e77` |                    0 | yes                  | ACTION-GRANT planned integration  | `KEEP_REGISTERED`     |
| `$REPO/.worktrees/api-key/d-external-api-key-security`                | `codex/api-key/d-external-api-key-security`                | `1eca45b8` |                    0 | yes                  | API-KEY design                    | `KEEP_REGISTERED`     |
| `$REPO/.worktrees/api-key/x01-integration`                            | `codex/api-key/x01-integration`                            | `ddab5e77` |                    0 | yes                  | API-KEY planned integration       | `KEEP_REGISTERED`     |
| `$REPO/.worktrees/exec-crypto/d-token-cryptography-workload-identity` | `codex/exec-crypto/d-token-cryptography-workload-identity` | `3af13e05` |                    0 | yes                  | EXEC-CRYPTO design                | `KEEP_REGISTERED`     |
| `$REPO/.worktrees/exec-revoke/d-emergency-revocation`                 | `codex/exec-revoke/d-emergency-revocation`                 | `9d091829` |                    0 | yes                  | EXEC-REVOKE design                | `KEEP_REGISTERED`     |
| `$REPO/.worktrees/governance/d-single-consumer-pull`                  | `codex/governance/d-single-consumer-pull`                  | `a1597e8e` |                    0 | yes                  | v2 Lite governance freeze         | `SAFE_AFTER_APPROVAL` |
| `$REPO/.worktrees/governance/repository-hygiene-v2`                   | `codex/governance/repository-hygiene-v2`                   | `a1597e8e` | 249 expected changes | yes                  | current maintenance               | `KEEP_ACTIVE`         |
| `$REPO/.worktrees/grpc/i01-generated-metadata-substrate`              | `codex/grpc/i01-generated-metadata-substrate`              | `4240e4b7` |                    0 | yes                  | GRPC A/I/01                       | `SAFE_AFTER_APPROVAL` |
| `$REPO/.worktrees/grpc/v01-generated-metadata-foundation`             | detached                                                   | `9d091829` |                    0 | yes                  | GRPC A/V/01                       | `SAFE_AFTER_APPROVAL` |
| `$REPO/.worktrees/grpc/x01-integration`                               | `codex/grpc/x01-integration`                               | `1398e322` |                    0 | no, 2 unique patches | GRPC integration continuation     | `KEEP_UNMERGED`       |
| `$REPO/.worktrees/principal-role/d-governance`                        | `codex/principal-role/d-governance`                        | `a24836a7` |                    0 | yes                  | PRINCIPAL-ROLE design             | `SAFE_AFTER_APPROVAL` |
| `$REPO/.worktrees/trusted-grpc-execution-context/d-freeze`            | `codex/trusted-grpc-execution-context/d-freeze`            | `73f003f4` |                    0 | yes                  | GRPC frozen design                | `SAFE_AFTER_APPROVAL` |

## Local branches without linked worktrees

| Branch                                             | HEAD       | In `origin/main` | Recommendation        |
| -------------------------------------------------- | ---------- | ---------------- | --------------------- |
| `codex/principal-role/i01-binding-contract`        | `9727d104` | yes              | `SAFE_AFTER_APPROVAL` |
| `codex/principal-role/r01-binding-contract-review` | `50ba0204` | yes              | `SAFE_AFTER_APPROVAL` |
| `codex/principal-role/x01-integration`             | `0a9dbbe0` | yes              | `SAFE_AFTER_APPROVAL` |

## Safe cleanup order after explicit approval

1. Re-read worktree clean state and `origin/main` ancestry immediately before cleanup.
2. Archive or confirm closure of the associated task record.
3. Remove only rows still classified `SAFE_AFTER_APPROVAL` with normal `git worktree remove`.
4. Delete their local branches only with `git branch -d`.
5. Do not touch `KEEP_UNMERGED`, `KEEP_REGISTERED`, `KEEP_ACTIVE`, or `main`.

No `git worktree remove`, branch deletion, remote branch deletion, force option, reset, clean, or stash operation was executed during this audit.
