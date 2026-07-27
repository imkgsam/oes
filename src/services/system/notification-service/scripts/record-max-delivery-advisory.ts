import { readFileSync } from 'node:fs'
import { PrismaNotificationEventOperationsRepository } from '../src/infrastructure/events/operations/prisma-notification-event-operations.repository'
import { NotificationAdvisoryRecoveryJob } from '../src/infrastructure/events/operations/notification-advisory-recovery.job'
import { NotificationEventOperationsService } from '../src/infrastructure/events/operations/notification-event-operations.service'
import { PrismaService } from '../src/infrastructure/prisma/prisma.service'

/** Captures one persisted MaxDeliver advisory as unresolved Notification state without attempting DLQ, ACK, or TERM. */
async function main(): Promise<void> {
  const input = readInput(process.argv[2])
  const prisma = new PrismaService()
  try {
    await prisma.$connect()
    const record = await new NotificationAdvisoryRecoveryJob(
      new NotificationEventOperationsService(
        new PrismaNotificationEventOperationsRepository(prisma)
      )
    ).execute(input)
    process.stdout.write(`${JSON.stringify({
      consumerName: record.consumerName,
      sourceStream: record.sourceStream,
      sourceStreamSequence: record.sourceStreamSequence,
      status: record.status,
      originalSourceTermination: record.originalSourceTermination
    })}\n`)
  } finally {
    await prisma.$disconnect()
  }
}

/** Reads the advisory monitor handoff while rejecting malformed or already-expired source retention references. */
function readInput(path: string | undefined): {
  readonly advisory: unknown
  readonly sourceExpiresAt: string
} {
  if (!path?.trim()) throw new Error('MAX_DELIVERY_ADVISORY_FILE_REQUIRED')
  const parsed: unknown = JSON.parse(readFileSync(path, 'utf8'))
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed))
    throw new Error('MAX_DELIVERY_ADVISORY_INPUT_INVALID')
  const input = parsed as { advisory?: unknown; sourceExpiresAt?: unknown }
  if (!input.advisory || typeof input.sourceExpiresAt !== 'string')
    throw new Error('MAX_DELIVERY_ADVISORY_INPUT_INVALID')
  return { advisory: input.advisory, sourceExpiresAt: input.sourceExpiresAt }
}

main().catch((error: unknown) => {
  const code = error instanceof Error ? error.message : 'MAX_DELIVERY_ADVISORY_CAPTURE_FAILED'
  process.stderr.write(`${code}\n`)
  process.exitCode = 1
})
