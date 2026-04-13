import { Inject, Injectable } from '@nestjs/common'
import { PhonePasswordLoginRequestDto } from '@oes/common/dtos'
import { ExceptionFactory } from '@oes/common/exceptions'
import { LoginMethodEnum, LoginMethodType, REPO } from '../../../common/constants'
import { AUTH_INVALID_CREDENTIALS } from '../../../common/constants/exception-enums'
import { HASHING_SERVICE } from '../../../common/constants/injection-tokens'
import { AuthStrategyPort } from '../../ports/auth-strategy.port'
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

  async authenticate(dto: PhonePasswordLoginRequestDto): Promise<string> {
    const normalizedPhone = AuthIdentifierNormalizer.normalize(LoginMethodType.PHONE, dto.phone)
    const loginMethod = await this.loginMethodRepo.findValidOneByTypeAndIdentifier(
      LoginMethodType.PHONE,
      normalizedPhone
    )

    if (!loginMethod) {
      throw ExceptionFactory.domain(AUTH_INVALID_CREDENTIALS)
    }

    const passwordCredential = loginMethod.getPasswordCredential()
    if (!passwordCredential) {
      throw ExceptionFactory.domain(AUTH_INVALID_CREDENTIALS)
    }

    const valid = await this.passwordHasher.compare(dto.password, passwordCredential.getSecret())
    if (!valid) {
      throw ExceptionFactory.domain(AUTH_INVALID_CREDENTIALS)
    }

    return loginMethod.userId
  }
}
