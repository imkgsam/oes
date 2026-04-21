import { Inject } from '@nestjs/common'
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { CredentialType } from '../../../../prisma/generated/prisma'
import { LoginMethodType } from '@oes/common/constants'
import { REPO } from '../../../common/constants'
import { LoginMethod } from '../../../domain/aggregates/loginmethod.aggregate'
import { ILoginMethodRepository } from '../../../domain/repositories/loginmethod.repository'
import { PasswordSetupRequirementService } from '../../services/password-setup-requirement.service'
import { LoginMethodListView, LoginMethodView } from './login-method-query.result'
import { ListLoginMethodsQuery } from './list-login-methods.query'

@QueryHandler(ListLoginMethodsQuery)
// Builds a safe login-method status read model without exposing stored credential secrets.
export class ListLoginMethodsHandler
  implements IQueryHandler<ListLoginMethodsQuery, LoginMethodListView>
{
  constructor(
    @Inject(REPO.LOGIN_METHOD)
    private readonly loginMethodRepository: ILoginMethodRepository,
    private readonly passwordSetupRequirementService: PasswordSetupRequirementService
  ) {}

  async execute(query: ListLoginMethodsQuery): Promise<LoginMethodListView> {
    const [methods, passwordSetupRequired] = await Promise.all([
      this.loginMethodRepository.findByUserId(query.userId),
      this.passwordSetupRequirementService.userRequiresPasswordSetup(query.userId)
    ])

    return {
      loginMethods: methods.flatMap((method) => toCapabilityViews(method)),
      passwordSetupRequired
    }
  }
}

function toCapabilityViews(method: LoginMethod): LoginMethodView[] {
  if (method.type === LoginMethodType.EMAIL || method.type === LoginMethodType.PHONE) {
    const passwordCredential = method.getCredentialByType(CredentialType.PASSWORD)
    const otpCredential = method.getCredentialByType(resolveOtpCredentialType(method.type))
    const baseView = {
      createdAt: method.createdAt.toISOString(),
      identifier: method.identifier,
      maskedIdentifier: maskIdentifier(method.type, method.identifier),
      updatedAt: method.updatedAt.toISOString(),
      userId: method.userId,
      verified: method.isVerified()
    }

    return [
      {
        ...baseView,
        methodId: `${method.id}:PASSWORD`,
        type: method.type === LoginMethodType.EMAIL ? 'EMAIL_PASSWORD' : 'PHONE_PASSWORD',
        enabled: Boolean(passwordCredential?.isEnabled()),
        hasPassword: Boolean(passwordCredential)
      },
      {
        ...baseView,
        methodId: `${method.id}:OTP`,
        type: method.type === LoginMethodType.EMAIL ? 'EMAIL_OTP' : 'PHONE_OTP',
        enabled: method.isEnabled() && method.isVerified() && (otpCredential ? otpCredential.isEnabled() : true),
        hasPassword: false
      }
    ]
  }

  return [
    {
      methodId: method.id,
      userId: method.userId,
      type: method.type,
      identifier: method.identifier,
      maskedIdentifier: maskIdentifier(method.type, method.identifier),
      verified: method.isVerified(),
      enabled: method.isEnabled(),
      hasPassword: Boolean(method.getCredentialByType(CredentialType.PASSWORD)),
      createdAt: method.createdAt.toISOString(),
      updatedAt: method.updatedAt.toISOString()
    }
  ]
}

function resolveOtpCredentialType(type: LoginMethodType): CredentialType {
  return type === LoginMethodType.EMAIL ? CredentialType.EMAIL_OTP : CredentialType.PHONE_OTP
}

function maskIdentifier(type: string, identifier: string): string {
  if (type === 'EMAIL' && identifier.includes('@')) {
    const [local, domain] = identifier.split('@')
    return `${local.slice(0, 1)}***@${domain}`
  }

  if (type === 'PHONE' && identifier.length >= 7) {
    return `${identifier.slice(0, 3)}****${identifier.slice(-4)}`
  }

  return identifier
}
