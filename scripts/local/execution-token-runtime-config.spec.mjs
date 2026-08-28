import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const compose = fs.readFileSync(new URL('../../docker-compose.yml', import.meta.url), 'utf8')
const trust = fs.readFileSync(new URL('../../docker/grpc-trust/bootstrap-local-trust.sh', import.meta.url), 'utf8')
const issuer = fs.readFileSync(new URL('./runtime-config/execution-token-issuer.nginx.conf', import.meta.url), 'utf8')

test('signer is Auth-only over a read-only UDS mount with no network or ambient capability', () => {
  assert.match(compose, /execution-token-signer:[\s\S]*network_mode: none[\s\S]*cap_drop: \[ALL\]/)
  assert.match(compose, /auth-service:[\s\S]*AUTH_EXECUTION_SIGNER_SOCKET_PATH: \/execution-signer\/signer\.sock/)
  assert.match(compose, /source: execution_signer_runtime\n\s+target: \/execution-signer\n\s+read_only: true/)
  assert.equal((compose.match(/target: \/execution-signer/g) ?? []).length, 1)
  assert.doesNotMatch(compose, /EXECUTION_SIGNER_PIN|BEGIN PRIVATE KEY/)
})

test('issuer publishes metadata only inside Auth network namespace using the Auth leaf', () => {
  assert.match(compose, /execution-token-issuer:[\s\S]*network_mode: service:auth-service/)
  assert.match(trust, /DNS:issuer\.local\.oes\.internal/)
  assert.match(issuer, /listen 443 ssl/)
  assert.match(issuer, /location = \/\.well-known\/jwks\.json/)
  assert.match(issuer, /proxy_pass http:\/\/127\.0\.0\.1:50051/)
  assert.match(issuer, /location \/ \{ return 404; \}/)
})
