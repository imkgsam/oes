import { describe, it, test } from 'node:test'
import { expect } from '../../testing/static-check-assertions.mjs'
import { fileURLToPath } from 'node:url'
const __dirname = fileURLToPath(new URL('.', import.meta.url))
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

/** Locks Terminal Device's trusted request tombstones and credential wire additions. */
describe('terminal device trusted grpc contract', () => {
  const proto = readFileSync(resolve(__dirname, 'terminal_device.proto'), 'utf8')

  it('reserves all removed authority fields and retains only the frozen credential additions', () => {
    expect(proto).toContain('reserved "tenant_id", "operator_context";')
    expect(proto).toContain('string device_credential = 9;')
    expect(proto).toContain('string device_credential = 11;')
    expect(proto).toContain('string rotated_device_credential = 5;')
    expect(proto).toContain('message TerminalDeviceDiagnosticLogInput')
  })

  it('keeps activation credential facts output-only at frozen response fields 8 through 10', () => {
    const activationRequest = proto.match(/message ActivateEnrollmentRequest \{([\s\S]*?)\n\}/)?.[1] ?? ''
    const activationResponse = proto.match(/message ActivateEnrollmentResponse \{([\s\S]*?)\n\}/)?.[1] ?? ''

    expect(activationRequest).toContain('reserved 5, 8, 9, 10;')
    expect(activationRequest).toContain('"device_credential", "device_credential_expires_at", "device_credential_version"')
    expect(activationRequest).not.toContain('device_credential =')
    expect(activationResponse).toContain('string device_credential = 8;')
    expect(activationResponse).toContain('string device_credential_expires_at = 9;')
    expect(activationResponse).toContain('int32 device_credential_version = 10;')

    const credentialWireFields = [
      ...proto.matchAll(/\b(?:string|int32) (?:device_credential|device_credential_expires_at|device_credential_version|rotated_device_credential) = \d+;/g)
    ].map(([field]) => field)
    expect(credentialWireFields).toEqual([
      'string device_credential = 8;',
      'string device_credential_expires_at = 9;',
      'int32 device_credential_version = 10;',
      'string device_credential = 9;',
      'string device_credential = 11;',
      'string rotated_device_credential = 5;',
      'string device_credential_expires_at = 6;',
      'int32 device_credential_version = 7;',
      'string device_credential = 4;'
    ])
  })
})
