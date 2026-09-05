# V2 exact-owner profile template

Render every placeholder before hashing:

- `OWNER_PATH`, `ARTIFACT_PATH`, and `TASK_TEMP_PATH`;
- `OWNER_TASK_ID` and exact `TRANSITION_ID` for the active DA, UD, DO, CO, or RV task;
- read-only `REPOSITORY_ROOT` and `TRUSTED_AUTHORIZATION_ROOT`;
- owner-exclusive `OWNER_GIT_DIRECTORY`, exact read-only `USER_GIT_CONFIG`, and host-specific read-only `CREDENTIAL_STORE_PATH`;
- create-only shared `SERIAL_ADMISSION_ROOT`; and
- `PACKAGE_CACHE_PATH`.

Use `profile-render`; do not substitute approval fields directly. `APPROVAL_MODE` atomically selects the supported approval policy/reviewer pair and seals its expected permission-sandbox fingerprint in the installed profile and launch receipt. Repairs retain the same owner, increment generation monotonically, reference the preceding receipt, and use a new transition.

Every profile writes `RESOURCE_TOPOLOGY_VERSION=owner-exclusive-v2` and seals one `OES_OWNER_RESOURCE_BINDING`. The owner clone has a private Git/common directory, durable artifacts remain outside temporary storage, and the current delivery record, evidence manifest, checkpoint bundle, and optional Git bundle rehash exactly.

`OWNER_GIT_DIRECTORY` is the owner-exclusive clone's `.git`, not a shared common directory. `TMPDIR` is the exact task scratch path. The authorization root is a real read-only descendant of the installed profile; only the issuing parent/Human-gate transport writes immutable authorization and task-native evidence. The serial-admission root contains only `latest-main.lock` and grants no ref/worktree access.

Read back the installed profile SHA and complete both preflight phases before using it. The profile grants only the declared owner resources, credential dependencies, package cache, task scratch, and protocol roots; keep sensitive-path denies and domain allowlist unchanged.
