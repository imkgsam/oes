import { ExceptionFactory } from '@oes/common/exceptions'
import { AUTH_OTP_SEND_RATE_LIMITED } from '../../common/constants/exception-enums/auth.errors'
import { OTP_USAGES } from '../../common/constants'

export interface OtpSendThrottleStateProps {
  identifier: string
  usage: OTP_USAGES
  sendCount: number
  maxSends: number
  windowEndsAt: Date
  windowMinutes: number
}

export interface OtpSendThrottleStateRedisShape {
  identifier: string
  usage: OTP_USAGES
  sendCount: number
  maxSends: number
  windowEndsAt: string
  windowMinutes: number
}

export class OtpSendThrottleState {
  private constructor(private readonly props: OtpSendThrottleStateProps) {}

  static create(
    identifier: string,
    usage: OTP_USAGES,
    now: Date = new Date()
  ): OtpSendThrottleState {
    const windowMinutes = 10
    return new OtpSendThrottleState({
      identifier,
      usage,
      sendCount: 0,
      maxSends: 5,
      windowEndsAt: new Date(now.getTime() + windowMinutes * 60 * 1000),
      windowMinutes
    })
  }

  static fromRedis(shape: OtpSendThrottleStateRedisShape): OtpSendThrottleState {
    return new OtpSendThrottleState({
      identifier: shape.identifier,
      usage: shape.usage,
      sendCount: shape.sendCount,
      maxSends: shape.maxSends,
      windowEndsAt: new Date(shape.windowEndsAt),
      windowMinutes: shape.windowMinutes
    })
  }

  assertCanSend(now: Date = new Date()): void {
    this.resetWindowIfNeeded(now)
    if (this.props.sendCount >= this.props.maxSends) {
      throw ExceptionFactory.domain(AUTH_OTP_SEND_RATE_LIMITED, {
        identifier: this.props.identifier,
        usage: this.props.usage,
        windowEndsAt: this.props.windowEndsAt.toISOString()
      })
    }
  }

  recordSend(now: Date = new Date()): void {
    this.resetWindowIfNeeded(now)
    this.props.sendCount += 1
  }

  getIdentifier(): string {
    return this.props.identifier
  }

  getUsage(): OTP_USAGES {
    return this.props.usage
  }

  getTTLSeconds(now: Date = new Date()): number {
    return Math.max(60, Math.ceil((this.props.windowEndsAt.getTime() - now.getTime()) / 1000))
  }

  toRedis(): OtpSendThrottleStateRedisShape {
    return {
      identifier: this.props.identifier,
      usage: this.props.usage,
      sendCount: this.props.sendCount,
      maxSends: this.props.maxSends,
      windowEndsAt: this.props.windowEndsAt.toISOString(),
      windowMinutes: this.props.windowMinutes
    }
  }

  private resetWindowIfNeeded(now: Date): void {
    if (now.getTime() < this.props.windowEndsAt.getTime()) {
      return
    }

    this.props.sendCount = 0
    this.props.windowEndsAt = new Date(now.getTime() + this.props.windowMinutes * 60 * 1000)
  }
}
