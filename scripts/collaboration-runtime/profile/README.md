# Project owner profile template

Render every placeholder to an absolute, exact-owner path before hashing and handoff:

- `OWNER_PATH`, `ARTIFACT_PATH`, and `TASK_TEMP_PATH`;
- read-only `REPOSITORY_ROOT` and `TRUSTED_AUTHORIZATION_ROOT`;
- owner-exclusive `OWNER_GIT_DIRECTORY`;
- the shared, create-only protocol resource `SERIAL_ADMISSION_ROOT`; and
- `PACKAGE_CACHE_PATH`.

`OWNER_GIT_DIRECTORY` must be the `.git` directory of the owner-exclusive clone, never a shared Git common directory. The authorization root is profile-read-only and must be a real descendant of the installed profile directory; only the creating parent/Human-gate issuer writes action records. The serial-admission root contains only the global exact lock and grants no ref/worktree access. Keep sensitive-file denies and the domain allowlist unchanged. Read back the installed profile SHA and execute the full `profile-preflight` smoke before accepting it.
