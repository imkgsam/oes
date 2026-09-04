import { TerminalDeviceEntity } from '../../domain/entities/terminal-device.entity'
import { TerminalDeviceCredentialVerifierService } from './terminal-device-credential-verifier.service'

/** Exercises the frozen credential failure matrix at the service-owned verifier boundary. */
describe('TerminalDeviceCredentialVerifierService', () => {
  const now = new Date('2026-08-11T00:00:00.000Z')

  it.each([
    ['missing credential', undefined, 'install-1', 'ACTIVE'],
    ['wrong credential', 'wrong-credential', 'install-1', 'ACTIVE'],
    ['wrong installation', 'issued', 'other-installation', 'ACTIVE'],
    ['suspended device', 'issued', 'install-1', 'SUSPENDED'],
    ['revoked device', 'issued', 'install-1', 'REVOKED']
  ] as const)('rejects %s', (_caseName, credentialKind, installationId, deviceCredentialState) => {
    const verifier = new TerminalDeviceCredentialVerifierService()
    const issued = verifier.issue(now)
    const credential = credentialKind === 'issued' ? issued.credential : credentialKind
    const device = deviceFor(issued.hash, issued.expiresAt, deviceCredentialState)

    expect(() => verifier.verify(device, credential, installationId, now)).toThrow('Terminal device credential is invalid')
  })
})

// Constructs a minimal persisted device fixture for verifier failure tests.
function deviceFor(
  credentialHash: string,
  expiresAt: Date,
  deviceCredentialState: 'ACTIVE' | 'SUSPENDED' | 'REVOKED'
): TerminalDeviceEntity {
  return new TerminalDeviceEntity({
    terminalDeviceId: 'device-1', tenantId: 'tenant-1', terminalDeviceType: 'PDA', displayName: 'PDA 1',
    status: 'ACTIVE', statusReason: null, enrollmentId: null, manufacturerSerial: null, androidId: null,
    appInstallationId: 'install-1', manufacturer: null, model: null, androidVersion: null,
    registeredAt: new Date('2026-08-11T00:00:00.000Z'), updatedAt: new Date('2026-08-11T00:00:00.000Z'),
    notes: null, deviceCredentialHash: credentialHash, deviceCredentialExpiresAt: expiresAt, deviceCredentialState
  })
}
