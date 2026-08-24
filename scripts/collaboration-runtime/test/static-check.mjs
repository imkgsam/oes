import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const base = new URL('..', import.meta.url)
const repo = new URL('../../..', import.meta.url)
const workflow = readFileSync(new URL('.github/workflows/ci.yml', repo), 'utf8')
assert.match(workflow, /merge_group:/)
assert.match(workflow, /name: Baseline Checks/)
assert.match(workflow, /pnpm collaboration-runtime:check/)
const entry = readFileSync(new URL('bin/oes-remote-driver', base), 'utf8')
assert.match(entry, /^#!\/bin\/sh\nset -eu\n/)
assert.match(entry, /exec node --experimental-strip-types/)
assert.doesNotMatch(entry, /git |gh |curl /)
const profile = readFileSync(new URL('profile/oes-project-owner.config.toml', base), 'utf8')
assert.match(profile, /approval_policy = "on-request"/)
assert.match(profile, /approvals_reviewer = "auto_review"/)
assert.match(profile, /allow_local_binding = true/)
assert.match(profile, /"\*\*\/\.env" = "deny"/)
for (const file of readdirSync(new URL('schemas', base))) JSON.parse(readFileSync(new URL(`schemas/${file}`, base), 'utf8'))
console.log('collaboration-runtime static checks: PASS')
