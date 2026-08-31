# Project owner profile template

Render every placeholder to an absolute, exact-owner path before hashing and handoff:

- `OWNER_PATH`, `ARTIFACT_PATH`, and `TASK_TEMP_PATH`;
- `OWNER_TASK_ID` and its exact `TRANSITION_ID`;
- read-only `REPOSITORY_ROOT` and `TRUSTED_AUTHORIZATION_ROOT`;
- owner-exclusive `OWNER_GIT_DIRECTORY`;
- the shared, create-only protocol resource `SERIAL_ADMISSION_ROOT`; and
- `PACKAGE_CACHE_PATH`.

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

`OWNER_GIT_DIRECTORY` must be the `.git` directory of the owner-exclusive clone, never a shared Git common directory. The authorization root is profile-read-only and must be a real descendant of the installed profile directory; only the creating parent/Human-gate issuer writes action records and atomically advances or invalidates the fixed `current-stage-cleanup.json` CAS record. The serial-admission root contains only the global exact `latest-main.lock` and grants no ref/worktree access. Keep sensitive-file denies and the domain allowlist unchanged. Read back the installed profile SHA and execute the full `profile-preflight` smoke before accepting it.
