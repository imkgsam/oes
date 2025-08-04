import { LoginMethod as PrismaLoginMethod } from 'prisma/generated/prisma'
import { Credential as PrismaCredential } from 'prisma/generated/prisma'
import { compare, hash } from 'bcrypt'
import { CREDENTIAL_TYPES } from '@oes/common/constants/enums/auth-relative.enums'
export class LoginMethod {
  private credentials: Credential[] = []
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly type: string,
    public readonly identifier: string,
    private verified: boolean,
    private enabled: boolean,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    credentials?: Credential[],
  ) {
    if (credentials) this.credentials = credentials
  }

  static fromPrisma(
    prismaLoginMethod: PrismaLoginMethod & { credentials?: PrismaCredential[] },
  ): LoginMethod {
    const credentialEntities =
      prismaLoginMethod.credentials?.map((c) => Credential.fromPrisma(c)) ?? []
    return new LoginMethod(
      prismaLoginMethod.id,
      prismaLoginMethod.userId,
      prismaLoginMethod.type,
      prismaLoginMethod.identifier,
      prismaLoginMethod.verified,
      prismaLoginMethod.enabled,
      prismaLoginMethod.createdAt,
      prismaLoginMethod.updatedAt,
      credentialEntities,
    )
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
}

export class Credential {
  constructor(
    public readonly id: string,
    public readonly loginMethodId: string,
    public readonly secretType: string,
    private _secretValue: string,
    private enabled: boolean,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date(),
    public readonly provider?: string,
  ) {}

  static fromPrisma(prismaCredential: PrismaCredential): Credential {
    return new Credential(
      prismaCredential.id,
      prismaCredential.loginMethodId,
      prismaCredential.secretType,
      prismaCredential.secretValue,
      prismaCredential.enabled,
      prismaCredential.createdAt,
      prismaCredential.updatedAt,
      prismaCredential.provider,
    )
  }

  static async createPasswordCredential(
    loginMethodId: string,
    plainPassword: string,
  ): Promise<Credential> {
    const hashedPassword = await hash(plainPassword, 10)
    return new Credential(
      crypto.randomUUID(),
      loginMethodId,
      CREDENTIAL_TYPES.PASSWORD,
      hashedPassword,
      true,
    )
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
  updateSecrete(newSecrete: string) {
    this._secretValue = newSecrete
  }
  getSecrete(): string {
    return this._secretValue
  }
}
