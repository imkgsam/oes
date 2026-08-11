import { Injectable } from '@nestjs/common'
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto'
import { TerminalDeviceEntity } from '../../domain/entities/terminal-device.entity'
import { TerminalDeviceError } from '../../domain/errors/terminal-device.error'

export type IssuedTerminalDeviceCredential = Readonly<{ credential: string; hash: string; version: number; expiresAt: Date }>

/** Verifies and rotates Terminal Device-owned opaque credentials without treating them as execution principals. */
@Injectable()
export class TerminalDeviceCredentialVerifierService {
  static readonly MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000
  static readonly ROTATION_WINDOW_MS = 7 * 24 * 60 * 60 * 1000
  static readonly OVERLAP_MS = 5 * 60 * 1000

  /** Issues a one-time plaintext credential whose only persisted representation is a digest. */
  issue(now = new Date(), version = 1): IssuedTerminalDeviceCredential {
    const credential = randomBytes(32).toString('base64url')
    return Object.freeze({ credential, hash: digest(credential), version, expiresAt: new Date(now.getTime() + TerminalDeviceCredentialVerifierService.MAX_AGE_MS) })
  }

  /** Confirms an active credential is bound to the registered device installation and accepted version window. */
  verify(device: TerminalDeviceEntity, credential: string | undefined, appInstallationId: string | null | undefined, now = new Date()): void {
    if (!credential || !appInstallationId || device.appInstallationId !== appInstallationId || device.deviceCredentialState !== 'ACTIVE') throw denied()
    const candidate = digest(credential)
    if (matches(candidate, device.deviceCredentialHash) && validUntil(device.deviceCredentialExpiresAt, now)) return
    if (matches(candidate, device.deviceCredentialPreviousHash) && validUntil(device.deviceCredentialPreviousExpiresAt, now)) return
    throw denied()
  }

  /** Issues a replacement only inside the frozen rotation window and preserves a bounded old-version overlap. */
  rotate(device: TerminalDeviceEntity, now = new Date()): { readonly device: TerminalDeviceEntity; readonly issued?: IssuedTerminalDeviceCredential } {
    if (!device.deviceCredentialExpiresAt || device.deviceCredentialExpiresAt.getTime() - now.getTime() > TerminalDeviceCredentialVerifierService.ROTATION_WINDOW_MS) return { device }
    const issued = this.issue(now, device.deviceCredentialVersion + 1)
    return { issued, device: new TerminalDeviceEntity({ ...device, deviceCredentialHash: issued.hash, deviceCredentialPreviousHash: device.deviceCredentialHash, deviceCredentialVersion: issued.version, deviceCredentialPreviousVersion: device.deviceCredentialVersion, deviceCredentialExpiresAt: issued.expiresAt, deviceCredentialPreviousExpiresAt: new Date(now.getTime() + TerminalDeviceCredentialVerifierService.OVERLAP_MS), updatedAt: now }) }
  }
}

function digest(value: string): string { return createHash('sha256').update(value).digest('hex') }
function validUntil(value: Date | null, now: Date): boolean { return value !== null && value.getTime() > now.getTime() }
function matches(candidate: string, expected: string | null): boolean { return expected !== null && timingSafeEqual(Buffer.from(candidate), Buffer.from(expected)) }
function denied(): TerminalDeviceError { return new TerminalDeviceError('TERMINAL_DEVICE_CREDENTIAL_INVALID', 'Terminal device credential is invalid') }
