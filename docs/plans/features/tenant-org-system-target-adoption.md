# Tenant Org SYSTEM Target Adoption

featureKey: `tenant-org-system-target-adoption`
truthCommit: `bb3a1b9c26accb2c95089addddf90ca6d0dd1d4d`
baseSha: `5566a5fa77fbce76a321e2dcaca670af8730ca21`
integrationBranch: `codex/feature/tenant-org-system-target-adoption`
worktreeKey: `c5aa`
pullRequest: `https://github.com/imkgsam/oes/pull/15`
mergeSha: `pending`
cleanup: `HOLD`
state: `RUNNING`

## Objective

Adopt the frozen tenant-target admission boundary in Tenant Org: every retained tenant selector is target-authorized, SYSTEM is admitted only on the exact SYSTEM-eligible Tenant Org methods, ordinary tenant-only org mutations deny SYSTEM, and the admitted selector is the sole application/resource boundary with correlated audit evidence.

## Slices

### tenant-org-target-admission

state: `RUNNING`
candidate: `pending`
review: `global-ri`

- Scope: Tenant Org RPC declarations, exact Gateway workload binding, target admission/audit provider wiring, admitted-selector consumption, focused tests, and only strictly required executable shared contract expression.
- Protected scope: frozen architecture/ADR/contracts; Admission owner resources; Gateway runtime; Permission catalog/persistence; Execution Token, STS request and Token cache-key shapes; Site Management P1 binding-stage SYSTEM deny; unrelated services, schemas, frontends and all pre-existing Feature Packets.
- Dependencies: `tenant-target-admission-foundation` merged as `5566a5fa77fbce76a321e2dcaca670af8730ca21` with candidate `2af114a37deda72344b1777627570a73398732a1` as parent 2 and exact tree.
- Acceptance: exact TENANT equality succeeds; TENANT mismatch, malformed selector, SYSTEM on ordinary methods, workload/Code/range mismatch and audit failure reject before application access or side effect; dedicated SYSTEM methods use the exact existing BUSINESS Code and `ALL`; controllers consume only the private admitted selector; correlated audit contains no bearer/credential or target authority in Token/STS/cache; Tenant Org/Common/proto tests and builds pass; protected scope remains unchanged.

## Feature acceptance

1. The eleven SYSTEM-eligible Tenant Org RPCs with `tenant_id` use dedicated declarations for the exact Gateway workload, existing Code and `ALL`; the four tenant-only org mutation RPCs use ordinary explicit SYSTEM-deny declarations.
2. All fifteen retained selector RPCs run `TenantTargetAdmissionGuard` after trusted execution and use `requireAdmittedTenantTarget(...).selector` for owner/query boundaries.
3. Target admission binds actor, scope, selector, exact method declaration, Code, request and trace evidence through Tenant Org's structured audit sink before handler access; applicable denials record exact method, result, stage and stable reason without credentials or untrusted selector material.
4. Denied admission produces no repository/application call or domain side effect; existing resource-ownership checks remain authoritative after admission.
5. No target tenant is added to Execution Token claims, exchange request fields, STS inputs or Token cache keys, and no unrelated/protected resource changes.
