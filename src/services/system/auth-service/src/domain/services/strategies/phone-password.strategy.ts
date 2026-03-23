import { Inject, Injectable } from '@nestjs/common'
import { PhonePasswordLoginRequestDto } from '@oes/common/dtos'
import { ExceptionFactory } from '@oes/common/exceptions'
import { LoginMethodEnum, LoginMethodType } from 'src/common/constants'
import { AUTH_INVALID_CREDENTIALS } from 'src/common/constants/exception-enums'
import {
  HASHING_SERVICE,
  LOGIN_METHOD_REPOSITORY
} from 'src/common/constants/injection-tokens'
import { AuthStrategyPort } from 'src/domain/ports/auth-strategy.port'
import { HashingPort } from 'src/domain/ports/hashing.port'
import { ILoginMethodRepository } from 'src/domain/repositories/loginmethod.repository'
import { AuthIdentifierNormalizer } from '../auth-identifier-normalizer'

@Injectable()
export class PhonePasswordStrategy implements AuthStrategyPort<PhonePasswordLoginRequestDto> {
  constructor(
    @Inject(LOGIN_METHOD_REPOSITORY)
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
