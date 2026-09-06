import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const packageJson = JSON.parse(readFileSync(new URL('../../../../package.json', import.meta.url), 'utf8'))
const scripts = packageJson.scripts

test('all local development and database compatibility entries delegate to one launcher', () => {
  for (const name of ['backend:system', 'backend:business', 'backend', 'dev:system', 'dev:business', 'dev', 'db:migrate', 'db:seed', 'db:rollback', 'env:bootstrap', 'local:trusted-runtime:prepare']) assert.match(scripts[name], /(?:runtime:|scripts\/local-runtime\/launcher\.mjs)/u, name)
})

test('managed root entries contain no direct Prisma push or legacy lifecycle executable', () => {
  for (const [name, command] of Object.entries(scripts)) assert.doesNotMatch(command, /prisma(?::|\s+)push|prisma\s+db\s+push|database-lifecycle|worktree-env/u, name)
})
