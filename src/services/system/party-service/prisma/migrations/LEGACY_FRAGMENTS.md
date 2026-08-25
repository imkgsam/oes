# Preserved migration fragments

These SQL files are preserved byte-for-byte for audit. The prior sequence had no initial schema and failed from an empty database. The active `20260825000000_baseline` is the complete current-schema migration used by `prisma migrate deploy`; the fragment digests are recorded in `legacy-fragments.json`.
