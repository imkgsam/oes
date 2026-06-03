import { randomUUID } from 'crypto'
import { CredentialType } from '../../../prisma/generated/prisma'
import { compare, hash } from 'bcrypt'

export class Credential {
  constructor(
    public readonly id: string,
    public readonly type: CredentialType,
    private _secretValue: string,
    private enabled: boolean,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date(),
    public readonly provider?: string
  ) {}

  static async createPasswordCredential(plainPassword: string): Promise<Credential> {
    const hashedPassword = await hash(plainPassword, 10)
    return new Credential(randomUUID(), CredentialType.PASSWORD, hashedPassword, true)
  }

  // Creates a low-entropy terminal PIN credential after enforcing the shared terminal PIN policy.
  static async createTerminalPinCredential(plainPin: string): Promise<Credential> {
    Credential.assertTerminalPinAllowed(plainPin)
    const hashedPin = await hash(plainPin, 10)
    return new Credential(randomUUID(), CredentialType.TERMINAL_PIN, hashedPin, true)
  }
  enable() {
    this.enabled = true
  }
  disable() {
    this.enabled = false
  }
  isEnabled(): boolean {
    return this.enabled
  }
  async validate(input: string): Promise<boolean> {
    return compare(input, this._secretValue)
  }
  updateSecret(newSecret: string) {
    this._secretValue = newSecret
  }
  getSecret(): string {
    return this._secretValue
  }

  // Guards terminal PIN format and obvious weak values before credential hashing.
  private static assertTerminalPinAllowed(plainPin: string): void {
    if (!/^\d{6}$/.test(plainPin)) {
      throw new Error('TERMINAL_PIN_FORMAT_INVALID')
    }

    const weakPins = new Set(['000000', '111111', '222222', '333333', '444444', '555555', '666666', '777777', '888888', '999999', '123456', '654321'])
    if (weakPins.has(plainPin)) {
      throw new Error('TERMINAL_PIN_WEAK')
    }
  }
}
