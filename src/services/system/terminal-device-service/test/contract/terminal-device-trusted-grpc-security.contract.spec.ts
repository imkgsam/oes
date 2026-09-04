import { TerminalDeviceEntity } from '../../src/domain/entities/terminal-device.entity'
import { TerminalDeviceCredentialVerifierService } from '../../src/application/services/terminal-device-credential-verifier.service'

/** Locks the device-proof lifecycle independently of wire-level trusted execution tests. */
describe('terminal device trusted grpc security', () => {
  it('hashes issuance and rejects a previous credential after the frozen overlap', () => {
    const now = new Date('2026-08-11T00:00:00.000Z')
    const verifier = new TerminalDeviceCredentialVerifierService()
    const issued = verifier.issue(now)
    const device = new TerminalDeviceEntity({ terminalDeviceId: 'device', tenantId: 'tenant', terminalDeviceType: 'PDA', displayName: 'device', status: 'ACTIVE', statusReason: null, enrollmentId: null, manufacturerSerial: null, androidId: null, appInstallationId: 'install', manufacturer: null, model: null, androidVersion: null, registeredAt: now, updatedAt: now, notes: null, deviceCredentialHash: issued.hash, deviceCredentialPreviousHash: null, deviceCredentialVersion: issued.version, deviceCredentialPreviousVersion: null, deviceCredentialExpiresAt: new Date(now.getTime() + TerminalDeviceCredentialVerifierService.ROTATION_WINDOW_MS), deviceCredentialPreviousExpiresAt: null, deviceCredentialState: 'ACTIVE' })
    const rotated = verifier.rotate(device, now)
    verifier.verify(rotated.device, issued.credential, 'install', new Date(now.getTime() + TerminalDeviceCredentialVerifierService.OVERLAP_MS - 1))
    expect(() => verifier.verify(rotated.device, issued.credential, 'install', new Date(now.getTime() + TerminalDeviceCredentialVerifierService.OVERLAP_MS + 1))).toThrow('Terminal device credential is invalid')
  })

  it.each(['SUSPENDED', 'REVOKED'] as const)('rejects %s device credentials even with a matching digest', (state) => {
    const now = new Date('2026-08-11T00:00:00.000Z')
    const verifier = new TerminalDeviceCredentialVerifierService()
    const issued = verifier.issue(now)
    const device = new TerminalDeviceEntity({ terminalDeviceId: 'device', tenantId: 'tenant', terminalDeviceType: 'PDA', displayName: 'device', status: 'ACTIVE', statusReason: null, enrollmentId: null, manufacturerSerial: null, androidId: null, appInstallationId: 'install', manufacturer: null, model: null, androidVersion: null, registeredAt: now, updatedAt: now, notes: null, deviceCredentialHash: issued.hash, deviceCredentialPreviousHash: null, deviceCredentialVersion: issued.version, deviceCredentialPreviousVersion: null, deviceCredentialExpiresAt: issued.expiresAt, deviceCredentialPreviousExpiresAt: null, deviceCredentialState: state })

    expect(issued.hash).not.toContain(issued.credential)
    expect(() => verifier.verify(device, issued.credential, 'install', now)).toThrow('Terminal device credential is invalid')
  })
})
