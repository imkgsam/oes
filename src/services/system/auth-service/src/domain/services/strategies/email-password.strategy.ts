import { Inject, Injectable } from '@nestjs/common'
import { LoginMethodEnum, LoginMethodType } from 'src/common/constants'
import { ExceptionFactory } from '@oes/common/exceptions'
import { EmailPasswordLoginRequestDto } from '@oes/common/dtos'
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
export class EmailPasswordStrategy implements AuthStrategyPort<EmailPasswordLoginRequestDto> {
  constructor(
    @Inject(LOGIN_METHOD_REPOSITORY)
    private readonly loginMethodRepo: ILoginMethodRepository,
    @Inject(HASHING_SERVICE)
    private readonly passwordHasher: HashingPort
  ) {}

  getType(): string {
    return LoginMethodEnum.EmailPassword
  }

  async authenticate(dto: EmailPasswordLoginRequestDto): Promise<string> {
    const normalizedEmail = AuthIdentifierNormalizer.normalize(LoginMethodType.EMAIL, dto.email)
    const loginMethod = await this.loginMethodRepo.findValidOneByTypeAndIdentifier(
      LoginMethodType.EMAIL,
      normalizedEmail
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
