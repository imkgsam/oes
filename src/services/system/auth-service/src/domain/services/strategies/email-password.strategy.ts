import { Injectable } from '@nestjs/common'
import { EmailPasswordLoginRequestDto } from '@oes/common/dtos/auth-service/api/rpc/all.dto'
import { AuthStrategyPort } from 'src/domain/ports/auth-strategy.port'
import { LoginMethodEnum } from '@oes/common/constants/const/auth-service.const'
import { HashingPort } from 'src/domain/ports/hashing.port'
import { ILoginMethodRepository } from 'src/domain/repositories/loginmethod.repository'
import { LoginMethodType } from 'prisma/generated/prisma'

@Injectable()
export class EmailPasswordStrategy implements AuthStrategyPort<EmailPasswordLoginRequestDto> {
  constructor(
    private readonly loginMethodRepo: ILoginMethodRepository,
    private readonly passwordHasher: HashingPort
  ) {}

  getType(): string {
    return LoginMethodEnum.EmailPassword
  }

  async authenticate(dto: EmailPasswordLoginRequestDto): Promise<string> {
    const loginMethod = await this.loginMethodRepo.findValidOneByTypeAndIdentifier(
      LoginMethodType.EMAIL,
      dto.email
    )
    if (!loginMethod) throw new Error('Valid login method not found')

    const passwordCredential = loginMethod.getPasswordCredential()
    if (!passwordCredential) throw new Error('Password credential not found or disabled')
    const valid = await this.passwordHasher.compare(dto.password, passwordCredential.getSecret())
    if (!valid) throw new Error('Invalid credentials')

    return loginMethod.userId
  }
}
