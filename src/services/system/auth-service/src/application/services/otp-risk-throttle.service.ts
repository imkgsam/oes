import { Inject, Injectable } from '@nestjs/common'
import { OTP_USAGES, REPO } from 'src/common/constants'
import { OtpSendThrottleState } from 'src/domain/aggregates/otp-send-throttle-state.aggregate'
import { IOtpSendThrottleRepository } from 'src/domain/repositories/otp-send-throttle.repository'

@Injectable()
export class OtpRiskThrottleService {
  constructor(
    @Inject(REPO.OTP_SEND_THROTTLE)
    private readonly otpSendThrottleRepository: IOtpSendThrottleRepository
  ) {}

  async assertCanSend(identifier: string, usage: OTP_USAGES): Promise<void> {
    const state = await this.getState(identifier, usage)
    state.assertCanSend()
  }

  async recordSend(identifier: string, usage: OTP_USAGES): Promise<void> {
    const state = await this.getState(identifier, usage)
    state.recordSend()
    await this.otpSendThrottleRepository.save(state)
  }

  private async getState(identifier: string, usage: OTP_USAGES): Promise<OtpSendThrottleState> {
    return (
      (await this.otpSendThrottleRepository.findByIdentifierAndUsage(identifier, usage)) ??
      OtpSendThrottleState.create(identifier, usage)
    )
  }
}
