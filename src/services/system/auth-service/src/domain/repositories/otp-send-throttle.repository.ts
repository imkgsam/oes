import { OTP_USAGES } from '../../common/constants'
import { OtpSendThrottleState } from '../aggregates/otp-send-throttle-state.aggregate'

export interface IOtpSendThrottleRepository {
  findByIdentifierAndUsage(
    identifier: string,
    usage: OTP_USAGES
  ): Promise<OtpSendThrottleState | null>
  save(state: OtpSendThrottleState): Promise<void>
}
