import { Inject, Injectable } from '@nestjs/common'
import { PhonePasswordLoginRequestDto } from '@oes/common/dtos'
import { LoginMethodEnum, LoginMethodType, REPO } from '../../../common/constants'
import { HASHING_SERVICE } from '../../../common/constants/injection-tokens'
import { AuthStrategyPort, CredentialAuthenticationResult } from '../../ports/auth-strategy.port'
import { HashingPort } from '../../ports/hashing.port'
import { ILoginMethodRepository } from '../../repositories/loginmethod.repository'
import { AuthIdentifierNormalizer } from '../auth-identifier-normalizer'

@Injectable()
export class PhonePasswordStrategy implements AuthStrategyPort<PhonePasswordLoginRequestDto> {
  constructor(
    @Inject(REPO.LOGIN_METHOD)
    private readonly loginMethodRepo: ILoginMethodRepository,
    @Inject(HASHING_SERVICE)
    private readonly passwordHasher: HashingPort
  ) {}

  getType(): string {
    return LoginMethodEnum.PhonePassword
  }

  async authenticate(dto: PhonePasswordLoginRequestDto): Promise<CredentialAuthenticationResult> {
    const normalizedPhone = AuthIdentifierNormalizer.normalize(LoginMethodType.PHONE, dto.phone)
    const loginMethod = await this.loginMethodRepo.findValidOneByTypeAndIdentifier(
      LoginMethodType.PHONE,
      normalizedPhone
    )

    if (!loginMethod) {
      return { authenticated: false }
    }

    const passwordCredential = loginMethod.getPasswordCredential()
    if (!passwordCredential) {
      return { authenticated: false, auditUserId: loginMethod.userId }
    }

    const valid = await this.passwordHasher.compare(dto.password, passwordCredential.getSecret())
    if (!valid) {
      return { authenticated: false, auditUserId: loginMethod.userId }
    }

    return { authenticated: true, userId: loginMethod.userId }
  }
}
