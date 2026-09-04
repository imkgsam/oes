import { createHash, createHmac } from 'node:crypto'
import { buildCanonicalRequest, formatSignature, verifySignedSiteRequest } from '../../src/domain/security/site-request-signing'
import { InMemoryNonceReplayStore } from '../../src/domain/security/nonce-replay-store'

/** Proves Site Runtime HMAC admission remains independent from internal ExecutionToken metadata. */
describe('Site trusted gRPC security', () => {
  it('verifies method, path, nonce, timestamp and body hash as a separate proof', async () => {
    const body = Buffer.from('{"publishVersion":7}')
    const timestamp = Date.now().toString(); const bodySha256 = createHash('sha256').update(body).digest('hex')
    const request = { method: 'POST', path: '/runtime/sync', body, headers: { 'x-oes-site-id': 'site-1', 'x-oes-client-id': 'client-1', 'x-oes-credential-id': 'credential-1', 'x-oes-request-id': 'request-1', 'x-oes-trace-id': 'trace-1', 'x-oes-timestamp': timestamp, 'x-oes-nonce': 'nonce-1', 'x-oes-signature': '' } }
    request.headers['x-oes-signature'] = formatSignature(createHmac('sha256', 'secret').update(buildCanonicalRequest({ ...request, bodySha256, siteId: 'site-1', clientId: 'client-1', credentialId: 'credential-1', timestamp, nonce: 'nonce-1' })).digest('hex'))
    const result = await verifySignedSiteRequest(request, { credential: { clientId: 'client-1', credentialId: 'credential-1', siteId: 'site-1', clientSecret: 'secret', status: 'active', scopes: ['site.runtime.sync'], siteStatus: 'active' }, now: new Date(Number(timestamp)), requiredScope: 'site.runtime.sync', nonceStore: new InMemoryNonceReplayStore() })
    expect(result.ok).toBe(true)
  })
})
