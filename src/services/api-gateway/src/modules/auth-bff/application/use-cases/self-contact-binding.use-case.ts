import { Injectable } from '@nestjs/common'
import { DownstreamRequestSource } from '../../../../common/grpc/gateway-downstream-source.mapper'
import { AuthGrpcAdapter } from '../../infrastructure/downstream/auth-service/auth-grpc.adapter'
import { IdentityQueryGrpcAdapter } from '../../infrastructure/downstream/identity-service/identity-query-grpc.adapter'
import {
  RequestEmailContactBindingChallengeDto,
  RequestPhoneContactBindingChallengeDto,
  VerifyEmailContactBindingDto,
  VerifyPhoneContactBindingDto
} from '../../interfaces/http/dtos/self-security.dto'
import {
  ContactBindingMutationViewModel,
  ContactBindingVerificationViewModel
} from '../../interfaces/http/view-models/self-security.view-model'
import { getAuthenticatedSelfContext } from './self-security-context'

@Injectable()
// Orchestrates authenticated self-service email and phone binding flows across auth-service and identity-service.
export class SelfContactBindingUseCase {
  constructor(
    private readonly authAdapter: AuthGrpcAdapter,
    private readonly identityAdapter: IdentityQueryGrpcAdapter
  ) {}

  async requestEmailChallenge(
    dto: RequestEmailContactBindingChallengeDto,
    source: DownstreamRequestSource
  ): Promise<ContactBindingMutationViewModel> {
    const self = getAuthenticatedSelfContext(source)
    const result = await this.authAdapter.requestEmailBindingChallenge(
      {
        userId: self.userId,
        email: dto.email
      },
      source
    )

    return {
      challengeId: result.challengeId ?? '',
      destination: result.destination ?? '',
      expiresAt: result.expiresAt ?? ''
    }
  }

  async requestPhoneChallenge(
    dto: RequestPhoneContactBindingChallengeDto,
    source: DownstreamRequestSource
  ): Promise<ContactBindingMutationViewModel> {
    const self = getAuthenticatedSelfContext(source)
    const result = await this.authAdapter.requestPhoneBindingChallenge(
      {
        userId: self.userId,
        phone: dto.phone
      },
      source
    )

    return {
      challengeId: result.challengeId ?? '',
      destination: result.destination ?? '',
      expiresAt: result.expiresAt ?? ''
    }
  }

  async verifyEmailBinding(
    dto: VerifyEmailContactBindingDto,
    source: DownstreamRequestSource
  ): Promise<ContactBindingVerificationViewModel> {
    const self = getAuthenticatedSelfContext(source)
    const result = await this.authAdapter.verifyEmailBinding(
      {
        userId: self.userId,
        accountId: self.accountId,
        tenantId: self.tenantId,
        scopeLevel: self.scopeLevel,
        email: dto.email,
        otp: dto.otp,
        mfaGrantToken: dto.mfaGrantToken
      },
      source
    )

    await this.identityAdapter.updateOwnUserBasicInfo(
      {
        accountId: self.accountId ?? '',
        userId: self.userId,
        email: result.identifier ?? ''
      },
      source
    )
    await this.authAdapter.bootstrapOwnLoginMethods(
      {
        userId: self.userId,
        accountId: self.accountId ?? '',
        email: result.identifier ?? ''
      },
      source
    )

    return {
      success: Boolean(result.success),
      type: result.type ?? 'EMAIL',
      identifier: result.identifier ?? ''
    }
  }

  async verifyPhoneBinding(
    dto: VerifyPhoneContactBindingDto,
    source: DownstreamRequestSource
  ): Promise<ContactBindingVerificationViewModel> {
    const self = getAuthenticatedSelfContext(source)
    const result = await this.authAdapter.verifyPhoneBinding(
      {
        userId: self.userId,
        accountId: self.accountId,
        tenantId: self.tenantId,
        scopeLevel: self.scopeLevel,
        phone: dto.phone,
        otp: dto.otp,
        mfaGrantToken: dto.mfaGrantToken
      },
      source
    )

    await this.identityAdapter.updateOwnUserBasicInfo(
      {
        accountId: self.accountId ?? '',
        userId: self.userId,
        phone: result.identifier ?? ''
      },
      source
    )
    await this.authAdapter.bootstrapOwnLoginMethods(
      {
        userId: self.userId,
        accountId: self.accountId ?? '',
        phone: result.identifier ?? ''
      },
      source
    )

    return {
      success: Boolean(result.success),
      type: result.type ?? 'PHONE',
      identifier: result.identifier ?? ''
    }
  }
}
