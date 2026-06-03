import { LoginMethodType } from '@oes/common/constants'
import { CredentialType } from '../../../prisma/generated/prisma'
import { Credential } from '../entities/credential.entity'

export class LoginMethod {
  private credentials: Credential[] = []
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly type: LoginMethodType,
    public readonly identifier: string,
    private verified: boolean,
    private enabled: boolean,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    credentials?: Credential[]
  ) {
    if (credentials) this.credentials = credentials
  }

  enable() {
    this.enabled = true
  }
  disable() {
    this.enabled = false
  }
  verify() {
    this.verified = true
  }
  isEnabled() {
    return this.enabled
  }
  isVerified() {
    return this.verified
  }

  createNewCredential(cred: Credential) {
    this.credentials.push(cred)
  }
  removeCredential(credId: string) {
    this.credentials = this.credentials.filter((c) => c.id !== credId)
  }
  getCredentials() {
    return this.credentials
  }
  getCredentialByType(type: CredentialType): Credential | null {
    return this.credentials.find((credential) => credential.type === type) || null
  }
  getPasswordCredential(): Credential | null {
    return this.credentials.find((c) => c.type === 'PASSWORD' && c.isEnabled()) || null
  }

  async replacePasswordCredential(plainPassword: string): Promise<void> {
    const credential = await Credential.createPasswordCredential(plainPassword)
    const existing = this.getCredentialByType(CredentialType.PASSWORD)

    if (existing) {
      existing.updateSecret(credential.getSecret())
      existing.enable()
      return
    }

    this.credentials.push(credential)
  }

  // Replaces the user-scoped terminal PIN credential while keeping the login method verified.
  async replaceTerminalPinCredential(plainPin: string): Promise<void> {
    const credential = await Credential.createTerminalPinCredential(plainPin)
    const existing = this.getCredentialByType(CredentialType.TERMINAL_PIN)

    if (existing) {
      existing.updateSecret(credential.getSecret())
      existing.enable()
      this.enable()
      this.verify()
      return
    }

    this.credentials.push(credential)
    this.enable()
    this.verify()
  }

  getTerminalPinCredential(): Credential | null {
    return this.credentials.find((c) => c.type === 'TERMINAL_PIN' && c.isEnabled()) || null
  }
}
