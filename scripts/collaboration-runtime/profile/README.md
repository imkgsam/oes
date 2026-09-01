# Project owner profile template

Render every placeholder to an absolute, exact-owner path before hashing and handoff:

- `OWNER_PATH`, `ARTIFACT_PATH`, and `TASK_TEMP_PATH`;
- `OWNER_TASK_ID` and its exact `TRANSITION_ID`;
- read-only `REPOSITORY_ROOT` and `TRUSTED_AUTHORIZATION_ROOT`;
- owner-exclusive `OWNER_GIT_DIRECTORY`, exact read-only `USER_GIT_CONFIG`, and host-specific read-only `CREDENTIAL_STORE_PATH`;
- the shared, create-only protocol resource `SERIAL_ADMISSION_ROOT`; and
- `PACKAGE_CACHE_PATH`.

Use the repository `profile-render` command rather than substituting approval fields directly. Its
sole approval input is `APPROVAL_MODE`: `ON_REQUEST_AUTO_REVIEW` atomically renders
`on-request/auto_review`, while `NEVER_USER` atomically renders `never/user`. The renderer seals the
mode-independent expected managed/restricted permission-sandbox fingerprint into both the installed
profile and an `OES_PROFILE_LAUNCH_RECEIPT`. Initial v2 profiles use generation 1 with no
predecessor; every repair is a same-owner, next-generation receipt referencing the immediately
preceding receipt and a new transition id.

Before cutover render `RESOURCE_TOPOLOGY_VERSION=pre-cutover-v1` and render the three
`OWNER_RESOURCE_BINDING_*` values as empty strings. After cutover, render
`RESOURCE_TOPOLOGY_VERSION=stable-owner-exclusive-v1` and seal the absolute path, SHA-256, and
canonical fingerprint of one `OES_OWNER_RESOURCE_BINDING`. The stable binding is accepted only when
its owner clone has a private `.git`/Git-common directory, its durable artifact root is outside
temporary storage, and its current Packet, evidence manifest, checkpoint bundle, and Git bundle all
rehash exactly.

The installed profile is also the issuer-controlled identity root: render `OWNER_TASK_ID` and
`TRANSITION_ID` before hashing it. An effective-profile report is accepted only when both fields
exactly match those reopened profile bytes.

`OWNER_GIT_DIRECTORY` must be the `.git` directory of the owner-exclusive clone, never a shared Git common directory. `USER_GIT_CONFIG` is the exact read-only Git configuration required to resolve the credential helper; `CREDENTIAL_STORE_PATH` is its one host-specific backing store (for example the current user's macOS Keychains directory), never the whole home directory. Repository dependencies remain under `OWNER_PATH`; the standard preflight invokes the current managed Node runtime directly, avoiding package-manager installs or unrelated toolchain expansion. Shell `TMPDIR` is pinned to `TASK_TEMP_PATH` so Git/toolchain caches never require a host-global writable temp directory. The authorization root is profile-read-only and must be a real descendant of the installed profile directory; only the creating parent/Human-gate issuer writes action records, the completed-turn telemetry snapshot, and atomically advances or invalidates the fixed `current-stage-cleanup.json` CAS record. The owner consumes that snapshot in place: its real path must remain within the sealed authorization root, and its path plus exact SHA is fingerprinted in the v2 report. The serial-admission root contains only the global exact `latest-main.lock` and grants no ref/worktree access. Keep sensitive-file denies and the domain allowlist unchanged. Read back the installed profile SHA and execute the full `profile-preflight` smoke before accepting it.

The preflight writer emits only `OES_EFFECTIVE_PROFILE_REPORT` v2, scans every rollout
`turn_context`, and rejects disabled or unmanaged permission profiles, danger-full-access or
unrestricted sandboxes, pair drift, fingerprint drift, conflicting duplicate contexts, and any
approval event in `NEVER_USER`. The reader retains frozen v1 compatibility only for
`on-request/auto_review` reports.
