import { Inject, Injectable } from '@nestjs/common'
import { LoginMethodEnum, LoginMethodType, REPO } from '../../../common/constants'
import { EmailPasswordLoginRequestDto } from '@oes/common/dtos'
import { HASHING_SERVICE } from '../../../common/constants/injection-tokens'
import { AuthStrategyPort, CredentialAuthenticationResult } from '../../ports/auth-strategy.port'
import { HashingPort } from '../../ports/hashing.port'
import { ILoginMethodRepository } from '../../repositories/loginmethod.repository'
import { AuthIdentifierNormalizer } from '../auth-identifier-normalizer'

@Injectable()
export class EmailPasswordStrategy implements AuthStrategyPort<EmailPasswordLoginRequestDto> {
  constructor(
    @Inject(REPO.LOGIN_METHOD)
    private readonly loginMethodRepo: ILoginMethodRepository,
    @Inject(HASHING_SERVICE)
    private readonly passwordHasher: HashingPort
  ) {}

  getType(): string {
    return LoginMethodEnum.EmailPassword
  }

  async authenticate(dto: EmailPasswordLoginRequestDto): Promise<CredentialAuthenticationResult> {
    const normalizedEmail = AuthIdentifierNormalizer.normalize(LoginMethodType.EMAIL, dto.email)
    const loginMethod = await this.loginMethodRepo.findValidOneByTypeAndIdentifier(
      LoginMethodType.EMAIL,
      normalizedEmail
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
