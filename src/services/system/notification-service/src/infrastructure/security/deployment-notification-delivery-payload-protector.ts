import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto'
import { NotificationDeliveryPayloadProtector } from '../../domain/services/notification-delivery-payload-protection.port'

/** Encrypts bounded delivery-only payloads with the deployment key and carries an authenticated expiry. */
export class DeploymentNotificationDeliveryPayloadProtector implements NotificationDeliveryPayloadProtector {
  private readonly key: Buffer

  constructor(encodedKey = process.env.NOTIFICATION_DELIVERY_PAYLOAD_KEY) {
    const key = encodedKey ? Buffer.from(encodedKey, 'base64') : undefined
    if (!key || key.length !== 32) throw new Error('NOTIFICATION_DELIVERY_PAYLOAD_KEY must be a base64 32-byte key')
    this.key = key
  }

  protect(payload: Record<string, unknown>, expiresAt: Date): string {
    if (!(expiresAt instanceof Date) || Number.isNaN(expiresAt.valueOf())) throw new Error('Delivery payload expiry is invalid')
    const iv = randomBytes(12)
    const cipher = createCipheriv('aes-256-gcm', this.key, iv)
    const plaintext = Buffer.from(JSON.stringify({ expiresAt: expiresAt.toISOString(), payload }), 'utf8')
    const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()])
    return Buffer.concat([iv, cipher.getAuthTag(), encrypted]).toString('base64url')
  }

  unprotect(ciphertext: string, now: Date): Record<string, unknown> {
    const packed = Buffer.from(ciphertext, 'base64url')
    if (packed.length < 29) throw new Error('Delivery payload is invalid')
    const decipher = createDecipheriv('aes-256-gcm', this.key, packed.subarray(0, 12))
    decipher.setAuthTag(packed.subarray(12, 28))
    const decoded = JSON.parse(Buffer.concat([decipher.update(packed.subarray(28)), decipher.final()]).toString('utf8')) as { expiresAt?: string; payload?: unknown }
    if (!decoded.expiresAt || new Date(decoded.expiresAt).valueOf() <= now.valueOf() || !decoded.payload || typeof decoded.payload !== 'object' || Array.isArray(decoded.payload)) {
      throw new Error('Delivery payload is expired or invalid')
    }
    return decoded.payload as Record<string, unknown>
  }
}
