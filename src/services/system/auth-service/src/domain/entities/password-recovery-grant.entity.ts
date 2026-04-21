import { randomUUID } from 'node:crypto'

// Represents one verified forgot-password grant that can be consumed exactly once to set a new password.
export class PasswordRecoveryGrant {
  static create(input: {
    challengeId: string
    expiresAt: Date
    loginMethodId: string
    userId: string
  }): PasswordRecoveryGrant {
    const now = new Date()

    return new PasswordRecoveryGrant(
      randomUUID(),
      input.userId,
      input.loginMethodId,
      input.challengeId,
      input.expiresAt,
      now,
      null,
      now,
      now
    )
  }

  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly loginMethodId: string,
    public readonly challengeId: string,
    private readonly expiresAt: Date,
    public readonly verifiedAt: Date,
    private consumedAt: Date | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}

  isExpired(now: Date = new Date()): boolean {
    return now > this.expiresAt
  }

  getExpiresAt(): Date {
    return this.expiresAt
  }

  isConsumed(): boolean {
    return Boolean(this.consumedAt)
  }

  getConsumedAt(): Date | null {
    return this.consumedAt
  }

  consume(at: Date = new Date()): void {
    this.consumedAt = at
  }
}
