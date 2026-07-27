import {
  NotificationEventOperationsService,
  type UnresolvedAdvisoryRecoveryRecord
} from './notification-event-operations.service'

/** Records a persisted Notification MaxDeliver advisory without claiming a DLQ transfer or source termination that lacks broker authority. */
export class NotificationAdvisoryRecoveryJob {
  /** Receives the consumer-owned operations service that retains only mutable recovery state and audit evidence. */
  constructor(private readonly operations: NotificationEventOperationsService) {}

  /** Captures one advisory and leaves immutable source/failure material in JetStream where the broker retained it. */
  execute(input: {
    readonly advisory: unknown
    readonly sourceExpiresAt: string
  }): Promise<UnresolvedAdvisoryRecoveryRecord> {
    return this.operations.captureAdvisoryOnlyRecovery(input)
  }
}
