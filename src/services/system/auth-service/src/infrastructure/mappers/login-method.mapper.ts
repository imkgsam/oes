import { LoginMethodType as CommonLoginMethodType } from '@oes/common/constants'
import { CredentialType } from '../../../prisma/generated/prisma'
import { LoginMethod } from 'src/domain/aggregates/loginmethod.aggregate'
import { Credential } from 'src/domain/entities/credential.entity'

type PrismaCredentialRecord = {
  id: string
  credentialType: CredentialType
  hashedValue: string | null
  provider: string | null
  enabled: boolean
  createdAt: Date
  updatedAt: Date
}

type PrismaLoginMethodRecord = {
  id: string
  userId: string
  type: string
  identifier: string
  verified: boolean
  enabled: boolean
  createdAt: Date
  updatedAt: Date
  credentials?: PrismaCredentialRecord[]
}

export class LoginMethodMapper {
  static toDomain(record: PrismaLoginMethodRecord): LoginMethod {
    const credentials = (record.credentials ?? []).map((credential) =>
      new Credential(
        credential.id,
        credential.credentialType,
        credential.hashedValue ?? '',
        credential.enabled,
        credential.createdAt,
        credential.updatedAt,
        credential.provider ?? undefined
      )
    )

    return new LoginMethod(
      record.id,
      record.userId,
      record.type as CommonLoginMethodType,
      record.identifier,
      record.verified,
      record.enabled,
      record.createdAt,
      record.updatedAt,
      credentials
    )
  }

  static toPersistence(record: LoginMethod) {
    return {
      id: record.id,
      userId: record.userId,
      type: record.type,
      identifier: record.identifier,
      verified: record.isVerified(),
      enabled: record.isEnabled(),
      createdAt: record.createdAt,
      updatedAt: new Date()
    }
  }
}
