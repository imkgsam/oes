import { ExceptionFactory } from '@oes/common/exceptions'
import { AUTH_LOGIN_TEMPORARILY_LOCKED } from '../../common/constants/exception-enums'

export interface LoginFailureStateProps {
  identifier: string
  failureCount: number
  lockedUntil: Date | null
  maxFailures: number
  lockDurationMinutes: number
}

export interface LoginFailureStateRedisShape {
  identifier: string
  failureCount: number
  lockedUntil: string | null
  maxFailures: number
  lockDurationMinutes: number
}

export class LoginFailureState {
  private constructor(private readonly props: LoginFailureStateProps) {}

  static create(identifier: string): LoginFailureState {
    return new LoginFailureState({
      identifier,
      failureCount: 0,
      lockedUntil: null,
      maxFailures: 5,
      lockDurationMinutes: 15
    })
  }

  static fromRedis(shape: LoginFailureStateRedisShape): LoginFailureState {
    return new LoginFailureState({
      identifier: shape.identifier,
      failureCount: shape.failureCount,
      lockedUntil: shape.lockedUntil ? new Date(shape.lockedUntil) : null,
      maxFailures: shape.maxFailures,
      lockDurationMinutes: shape.lockDurationMinutes
    })
  }

  assertCanAttempt(now: Date = new Date()): void {
    if (this.isLocked(now)) {
      throw ExceptionFactory.domain(AUTH_LOGIN_TEMPORARILY_LOCKED, {
        identifier: this.props.identifier,
        lockedUntil: this.props.lockedUntil?.toISOString()
      })
    }
  }

  recordFailure(now: Date = new Date()): void {
    this.clearExpiredLock(now)

    this.props.failureCount += 1
    if (this.props.failureCount >= this.props.maxFailures) {
      this.props.lockedUntil = new Date(
        now.getTime() + this.props.lockDurationMinutes * 60 * 1000
      )
    }
  }

  recordSuccess(): void {
    this.props.failureCount = 0
    this.props.lockedUntil = null
  }

  isLocked(now: Date = new Date()): boolean {
    return !!this.props.lockedUntil && this.props.lockedUntil.getTime() > now.getTime()
  }

  getIdentifier(): string {
    return this.props.identifier
  }

  toRedis(): LoginFailureStateRedisShape {
    return {
      identifier: this.props.identifier,
      failureCount: this.props.failureCount,
      lockedUntil: this.props.lockedUntil?.toISOString() ?? null,
      maxFailures: this.props.maxFailures,
      lockDurationMinutes: this.props.lockDurationMinutes
    }
  }

  getTTLSeconds(now: Date = new Date()): number {
    if (this.props.lockedUntil) {
      return Math.max(60, Math.ceil((this.props.lockedUntil.getTime() - now.getTime()) / 1000))
    }

    return Math.max(60, this.props.lockDurationMinutes * 60)
  }

  private clearExpiredLock(now: Date): void {
    if (this.props.lockedUntil && this.props.lockedUntil.getTime() <= now.getTime()) {
      this.props.failureCount = 0
      this.props.lockedUntil = null
    }
  }
}
