import { CredentialType, Credential as PrismaCredential } from 'prisma/generated/prisma'
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

  static fromPrisma(prismaCredential: PrismaCredential): Credential {
    return new Credential(
      prismaCredential.id,
      prismaCredential.credentialType,
      prismaCredential.secretValue,
      prismaCredential.enabled,
      prismaCredential.createdAt,
      prismaCredential.updatedAt,
      prismaCredential.provider
    )
  }

  static async createPasswordCredential(plainPassword: string): Promise<Credential> {
    const hashedPassword = await hash(plainPassword, 10)
    return new Credential(crypto.randomUUID(), CredentialType.PASSWORD, hashedPassword, true)
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
}
