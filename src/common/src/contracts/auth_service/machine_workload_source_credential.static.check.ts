import { describe, it, test } from 'node:test'
import { expect } from '../../testing/static-check-assertions.mjs'
import { fileURLToPath } from 'node:url'
const __dirname = fileURLToPath(new URL('.', import.meta.url))
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

/** Reads the published MACHINE root credential proto to verify its frozen wire contract. */
const readMachineSourceProto = (): string =>
  readFileSync(join(__dirname, 'machine_workload_source_credential.proto'), 'utf8')

/** Guards MACHINE root issuance and revocation against caller-selected authority and profile drift. */
describe('MachineWorkloadSourceCredential proto contract', () => {
  it('defines the exact certificate-bound source credential issuance surface', () => {
    const source = readMachineSourceProto()
    const request = source.match(/message IssueMachineWorkloadSourceCredentialRequest \{([\s\S]*?)\n\}/)?.[1]

    expect(source).toContain('service MachineWorkloadSourceCredentialService')
    expect(source).toContain(
      'rpc IssueMachineWorkloadSourceCredential(IssueMachineWorkloadSourceCredentialRequest) returns (IssueMachineWorkloadSourceCredentialResponse);'
    )
    expect(source).toContain('string machine_principal_id = 1;')
    expect(source).toContain('string machine_workload_binding_id = 2;')
    expect(source).toContain('int64 machine_workload_binding_version = 3;')
    expect(source).toContain('string source_credential = 1;')
    expect(source).toContain('string credential_id = 2;')
    expect(source).toContain('string token_type = 3;')
    expect(source).toContain('int64 expires_at_unix_seconds = 5;')
    expect(source).toContain('string audit_correlation_id = 9;')
    expect(source).toContain('string supersedes_credential_id = 10;')
    expect(request).toBeDefined()
    expect(request).not.toMatch(/(tenant|org|permission|audience|spiffe|thumbprint|lifetime)/)
  })

  it('defines idempotent management revocation without mutable authority fields', () => {
    const source = readMachineSourceProto()
    const request = source.match(/message RevokeMachineWorkloadSourceCredentialRequest \{([\s\S]*?)\n\}/)?.[1]

    expect(source).toContain(
      'rpc RevokeMachineWorkloadSourceCredential(RevokeMachineWorkloadSourceCredentialRequest) returns (RevokeMachineWorkloadSourceCredentialResponse);'
    )
    expect(source).toContain('string credential_id = 1;')
    expect(source).toContain('string reason_code = 2;')
    expect(source).toContain('int64 revoked_at_unix_seconds = 3;')
    expect(source).toContain('bool already_revoked = 4;')
    expect(request).toBeDefined()
    expect(request).not.toMatch(/(principal|binding|tenant|permission|operator)/)
  })
})
