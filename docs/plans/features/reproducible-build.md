# Reproducible Build

featureKey: reproducible-build
truthCommit: 8638401207d3d94fd3695e8d5e25deaf3e2a760a
baseSha: 8638401207d3d94fd3695e8d5e25deaf3e2a760a
integrationBranch: codex/feature/reproducible-build
worktreeKey: reproducible-build
pullRequest: pending
mergeSha: pending
cleanup: HOLD
state: CANDIDATE_READY

## Objective

Make a clean worktree self-preparing and reproducibly buildable from versioned, sanitized inputs across all backend packages and Site Runtime packages, without changing stable service, data, transport, event, or execution-context semantics.

## Slices

### environment-contract

state: CANDIDATE_READY
candidate: 5969ac046abd0a087d93446585a245185fbcd884
review: global-ri round 2 exact integration candidate pending; round 1 findings closed by current slice candidate

- Scope: sanitized versioned environment template; deterministic `env:bootstrap` and `env:check`; task-owned worktree defaults and validation tests.
- Protected scope: secret values, production/shared data, host-global configuration, business configuration semantics.
- Dependencies: none.
- Acceptance: a clean worktree creates only ignored local environment files from versioned inputs; positive validation succeeds; missing, malformed, placeholder, and unsafe production-like inputs fail with actionable diagnostics.

### generated-clients

state: CANDIDATE_READY
candidate: 5969ac046abd0a087d93446585a245185fbcd884
review: global-ri round 2 exact integration candidate pending; round 1 findings closed by current slice candidate

- Scope: one versioned command that generates protobuf outputs and all 21 Prisma Clients with an audited schema count.
- Protected scope: Prisma data models, migrations, service data ownership, protobuf contracts.
- Dependencies: environment-contract.
- Acceptance: one command reports and generates exactly 21 Prisma schemas plus required protobuf outputs from a clean worktree; count drift and generation failure are fatal.

### workspace-install-policy

state: CANDIDATE_READY
candidate: 5969ac046abd0a087d93446585a245185fbcd884
review: global-ri round 2 exact integration candidate pending; round 1 findings closed by current slice candidate

- Scope: pnpm workspace discovery, package metadata, lockfile, and explicit trusted dependency build policy.
- Protected scope: dependency major-version migration, arbitrary lifecycle scripts, unrelated application workspaces.
- Dependencies: generated-clients.
- Acceptance: frozen install completes without placeholder `allowBuilds` entries or ignored required build scripts, and all in-scope packages are discoverable exactly once.

### backend-build-graph

state: CANDIDATE_READY
candidate: 5969ac046abd0a087d93446585a245185fbcd884
review: global-ri round 2 exact integration candidate pending; round 1 findings closed by current slice candidate

- Scope: root TypeScript references and build orchestration for common, Gateway/BFF, and all 21 backend services.
- Protected scope: stable service boundaries, runtime transport/event behavior, tenant/org/operator/trace/audit semantics.
- Dependencies: generated-clients; workspace-install-policy.
- Acceptance: the versioned backend build command fails on package/reference drift and builds common, Gateway/BFF, and all 21 service packages successfully.

### site-runtime-build

state: CANDIDATE_READY
candidate: 5969ac046abd0a087d93446585a245185fbcd884
review: global-ri round 2 exact integration candidate pending; round 1 findings closed by current slice candidate

- Scope: Site Runtime workspace links and deterministic build order for the runtime kit, template runtime/storefront, and concrete site runtime/storefront.
- Protected scope: site business behavior, content, deployment, credentials, and external integrations.
- Dependencies: workspace-install-policy.
- Acceptance: the versioned Site Runtime build command resolves local workspace packages and completes every in-scope build from the root.

### clean-worktree-reproduction

state: CANDIDATE_READY
candidate: 5969ac046abd0a087d93446585a245185fbcd884
review: global-ri round 2 exact integration candidate pending; round 1 findings closed by current slice candidate

- Scope: automated positive/negative checks and clean-worktree evidence for bootstrap, generation, install policy, backend build, and Site Runtime build.
- Protected scope: remote merge, cleanup, production/shared services or data.
- Dependencies: environment-contract; generated-clients; workspace-install-policy; backend-build-graph; site-runtime-build.
- Acceptance: exact commands, inputs, literal outputs, exit codes, tool versions, dependency fingerprint, and clean-worktree result are recorded for the frozen candidate and accepted by Global RI.

## Feature acceptance

1. A clean owner worktree completes `env:bootstrap` and `env:check` from versioned sanitized inputs without reading ignored files from another worktree.
2. One versioned command generates required protobuf outputs and exactly 21 Prisma Clients, failing on schema-count drift.
3. Frozen root install succeeds with explicit non-placeholder dependency build policy and complete in-scope workspace discovery.
4. Root commands build common, Gateway/BFF, all 21 backend services, and all Site Runtime packages.
5. Positive and negative environment checks plus an independent clean-worktree reproduction have literal evidence on the exact candidate.
6. Risk-based Global RI accepts the complete exact candidate before the first remote write.
7. The exact feature branch is published through the repository remote driver as a Draft PR with required CI read-after-write evidence, then stops at `READY_FOR_STAGE_REVIEW`.

## Evidence keys

- candidate: exact integration HEAD assigned to Global RI; current implementation ancestor `5969ac046abd0a087d93446585a245185fbcd884`
- dependency fingerprint: `pnpm-lock.yaml`, Node, pnpm, TypeScript, Prisma, and Nuxt tool versions
- literal inputs: truth/base/scope binding plus exact changed paths and clean-worktree path
- execution profile fingerprint: pending final evidence bundle; handoff evidence root is owner-local
- command coverage: env bootstrap/check positive and negative paths; frozen install; generated-client audit; backend build; Site Runtime build; focused tests
- result coverage: exact outputs and exit statuses under the frozen feature candidate
