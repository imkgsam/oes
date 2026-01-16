import {
  LoginMethod as PrismaLoginMethod,
  Credential as PrismaCredential
} from 'prisma/generated/prisma'
import { LoginMethodType } from '@oes/common/constants/auth/login-method.type'
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

  static fromPrisma(
    prismaLoginMethod: PrismaLoginMethod & { credentials?: PrismaCredential[] }
  ): LoginMethod {
    const credentialEntities =
      prismaLoginMethod.credentials?.map((c) => Credential.fromPrisma(c)) ?? []
    return new LoginMethod(
      prismaLoginMethod.id,
      prismaLoginMethod.userId,
      prismaLoginMethod.type as LoginMethodType,
      prismaLoginMethod.identifier,
      prismaLoginMethod.verified,
      prismaLoginMethod.enabled,
      prismaLoginMethod.createdAt,
      prismaLoginMethod.updatedAt,
      credentialEntities
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
  getPasswordCredential(): Credential | null {
    return this.credentials.find((c) => c.type === 'PASSWORD' && c.isEnabled()) || null
  }
}
