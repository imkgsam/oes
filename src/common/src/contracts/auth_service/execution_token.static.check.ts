import { describe, it, test } from 'node:test'
import { expect } from '../../testing/static-check-assertions.mjs'
import { fileURLToPath } from 'node:url'
const __dirname = fileURLToPath(new URL('.', import.meta.url))
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

/** Reads the producer-owned ExecutionToken proto so contract assertions inspect its published wire surface. */
const readExecutionTokenProto = (): string =>
  readFileSync(join(__dirname, 'execution_token.proto'), 'utf8')

/** Guards the frozen ExecutionToken exchange and JWKS protocol against accidental weakening or request-body trust inputs. */
describe('ExecutionToken proto contract', () => {
  /** Verifies that the STS exchange exposes only caller-declared target inputs and returns cache-safe issued-token metadata. */
  it('defines the bounded exchange surface without caller-controlled identity or cryptography', () => {
    const source = readExecutionTokenProto()
    const request = source.match(/message ExchangeExecutionTokenRequest \{([\s\S]*?)\n\}/)?.[1]

    expect(source).toContain('service ExecutionTokenService')
    expect(source).toContain(
      'rpc ExchangeExecutionToken(ExchangeExecutionTokenRequest) returns (ExchangeExecutionTokenResponse);',
    )
    expect(source).toContain('string target_audience = 1;')
    expect(source).toContain('repeated string requested_permission_codes = 2;')
    expect(source).toContain('string access_token = 1;')
    expect(source).toContain('string token_type = 2;')
    expect(source).toContain('int64 expires_in_seconds = 4;')
    expect(source).toContain('string kid = 5;')
    expect(source).toContain('repeated string granted_permission_codes = 6;')
    expect(source).toContain('string granted_audience = 7;')
    expect(request).toBeDefined()
    expect(request).not.toMatch(/string\s+(issuer|client_id|spiffe_id|cnf|x5t_s256)\s*=/)
    expect(request).not.toMatch(/string\s+(algorithm|alg|jwks_uri|trust_domain)\s*=/)
  })

  /** Verifies that JWKS publication is ES256/P-256-only and carries the bounded refresh and rotation facts verifiers need. */
  it('defines a bounded ES256 JWKS publication surface with rotation metadata', () => {
    const source = readExecutionTokenProto()

    expect(source).toContain(
      'rpc GetExecutionTokenJwks(GetExecutionTokenJwksRequest) returns (GetExecutionTokenJwksResponse);',
    )
    expect(source).toContain('string issuer = 1;')
    expect(source).toContain('repeated ExecutionTokenJwk keys = 2;')
    expect(source).toContain('int32 max_age_seconds = 3;')
    expect(source).toContain('int32 unknown_kid_refresh_limit = 4;')
    expect(source).toContain('repeated ExecutionTokenKeyRotation rotations = 5;')
    expect(source).toContain('string kty = 1;')
    expect(source).toContain('string alg = 2;')
    expect(source).toContain('string crv = 3;')
    expect(source).toContain('string x = 5;')
    expect(source).toContain('string y = 6;')
    expect(source).toContain('string kid = 7;')
    expect(source).toContain('int64 publish_not_before_unix_seconds = 2;')
    expect(source).toContain('int64 signing_not_before_unix_seconds = 3;')
    expect(source).toContain('int64 retire_after_unix_seconds = 4;')
    expect(source).toContain('ES256')
    expect(source).toContain('P-256')
    expect(source).toContain('300 seconds')
    expect(source).toContain('one controlled refresh')
  })
})
