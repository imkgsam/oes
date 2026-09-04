import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import { DATABASE_LIFECYCLE_INIT_SERVICES } from '../../database-lifecycle.mjs'

const repositoryRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../../../..')

test('database lifecycle provisions every exact one-shot infrastructure dependency', () => {
  assert.deepEqual(DATABASE_LIFECYCLE_INIT_SERVICES, [
    'nats-bootstrap',
    'minio-init',
    'nacos-auth-bootstrap'
  ])
  const infra = fs.readFileSync(path.join(repositoryRoot, 'docker-compose.infra.yml'), 'utf8')
  for (const service of DATABASE_LIFECYCLE_INIT_SERVICES) {
    assert.match(infra, new RegExp(`^  ${service}:`, 'm'))
  }
  assert.match(infra, /nacos-auth-bootstrap:[\s\S]*INSERT INTO users[\s\S]*INSERT INTO roles/)
})
test('service and Gateway images generate tracked proto outputs before Common build', () => {
  const ignored = fs.readFileSync(path.join(repositoryRoot, '.dockerignore'), 'utf8').split(/\r?\n/)
  assert.ok(ignored.includes('docs'), 'Feature Packet updates must not change runtime image inputs')
  for (const relative of ['docker/Dockerfile.service', 'docker/Dockerfile.api-gateway']) {
    const contents = fs.readFileSync(path.join(repositoryRoot, relative), 'utf8')
    const proto = contents.indexOf('pnpm proto:gen')
    const common = contents.indexOf('pnpm common:build')
    assert.match(contents, /FROM bufbuild\/buf:1\.61\.0@sha256:[a-f0-9]{64} AS buf/)
    assert.match(contents, /COPY --from=buf \/usr\/local\/bin\/buf \/usr\/local\/bin\/buf/)
    assert.ok(proto >= 0, relative + ' must generate proto output')
    assert.ok(common > proto, relative + ' must generate proto before Common build')
  }
})
