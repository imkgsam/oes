import { createHash, randomBytes } from 'crypto'

export interface GeneratedApiKeyMaterial {
  keyCode: string
  secret: string
  hashedValue: string
}

export function generateApiKeyMaterial(): GeneratedApiKeyMaterial {
  const keyCode = `key_${randomBytes(8).toString('hex')}`
  const secret = `sk_${randomBytes(24).toString('base64url')}`

  return {
    keyCode,
    secret,
    hashedValue: hashApiKeySecret(secret)
  }
}

export function hashApiKeySecret(secret: string): string {
  return createHash('sha256').update(secret).digest('hex')
}
