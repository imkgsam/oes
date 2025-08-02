import { BadRequestException, Injectable, Inject } from '@nestjs/common'
import { ILoginMethodRepository } from 'src/domain/repositories/loginmethod.repository'
import { IOtpRepository } from 'src/domain/repositories/otp.repository'

@Injectable()
export class AdminAuthService {
  constructor(
    @Inject('LoginMethodRepository')
    private readonly loginMethodRepository: ILoginMethodRepository,
    @Inject('OtpRepository') private readonly otpRepository: IOtpRepository,
  ) {}

  async getAllCredentials() {
    return this.loginMethodRepository._Credential.findAll()
  }

  async getAllLoginMethods() {
    return this.loginMethodRepository.findAll()
  }

  async getAllOtps() {
    return this.otpRepository.findAll()
  }
}
