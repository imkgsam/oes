import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'
const relationships = JSON.parse(fs.readFileSync(new URL('../../../../scripts/local-runtime/relationships.json', import.meta.url), 'utf8'))
const processRuntime = fs.readFileSync(new URL('../../../../scripts/local-runtime/src/process-runtime.mjs', import.meta.url), 'utf8')
const mtls = fs.readFileSync(new URL('../../../../scripts/local-runtime/src/docker-driver.mjs', import.meta.url), 'utf8')

test('Auth and Gateway receive declared network trust through minimal manifest injection', () => {
  for (const owner of ['auth-service', 'api-gateway']) assert.ok(relationships.owners[owner].capabilities.includes('network-trust'))
  assert.match(processRuntime, /environmentForOwner\(manifest, owner/)
  assert.match(mtls, /const subjectAltName = \[`URI:\$\{spiffe\}`/)
  assert.match(mtls, /writeAtomic\(ext, `subjectAltName=\$\{subjectAltName\}/)
  assert.match(mtls, /DNS:\$\{name\}/)
  assert.doesNotMatch(processRuntime, /BEGIN PRIVATE KEY|EXECUTION_SIGNER_PIN/)
})
