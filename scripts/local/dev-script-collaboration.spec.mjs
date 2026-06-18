import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const packageJson = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8'))
const scripts = packageJson.scripts

// Keeps collaboration-service runtime startup aligned with the gateway proxy and schema sync integration.
test('system backend startup includes collaboration-service when collaboration schema is synced', () => {
  assert.match(scripts['backend:system:db:sync'], /collaboration-service prisma:push/)
  assert.match(scripts['backend:system'], /-n [^"]*cos/)
  assert.match(scripts['backend:system'], /"pnpm cos"/)
})

// Keeps all-service startup from regressing when new system services are added.
test('full backend startup includes collaboration-service', () => {
  assert.match(scripts.backend, /-n [^"]*cos/)
  assert.match(scripts.backend, /"pnpm cos"/)
})

// Keeps site-service available before API Gateway Site Management routes are browser-tested.
test('system backend startup includes site-service when site schema is synced', () => {
  assert.match(scripts['backend:system:db:sync'], /site-service prisma:push/)
  assert.match(scripts['backend:system'], /-n [^"]*site/)
  assert.match(scripts['backend:system'], /"pnpm site"/)
})

// Keeps full backend startup from regressing the Site Management BFF downstream dependency.
test('full backend startup includes site-service', () => {
  assert.match(scripts.backend, /-n [^"]*site/)
  assert.match(scripts.backend, /"pnpm site"/)
})
