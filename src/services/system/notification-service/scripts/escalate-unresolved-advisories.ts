import { PrismaNotificationEventOperationsRepository } from '../src/infrastructure/events/operations/prisma-notification-event-operations.repository'
import { NotificationEventOperationsService } from '../src/infrastructure/events/operations/notification-event-operations.service'
import { PrismaService } from '../src/infrastructure/prisma/prisma.service'

/** Performs the consumer-owner alert and pre-expiry escalation pass for unresolved advisory-only recoveries. */
async function main(): Promise<void> {
  const preExpiryWindowMs = requiredPositiveInteger(
    process.env.NOTIFICATION_ADVISORY_PRE_EXPIRY_WINDOW_MS,
    'NOTIFICATION_ADVISORY_PRE_EXPIRY_WINDOW_REQUIRED'
  )
  const prisma = new PrismaService()
  try {
    await prisma.$connect()
    await new NotificationEventOperationsService(
      new PrismaNotificationEventOperationsRepository(prisma)
    ).advanceUnresolvedRecoveryEscalations({ now: new Date(), preExpiryWindowMs })
    process.stdout.write('{"status":"ESCALATION_PASS_RECORDED"}\n')
  } finally {
    await prisma.$disconnect()
  }
}

/** Validates the deployment-provided pre-expiry window before a maintenance runner can advance consumer operations state. */
function requiredPositiveInteger(value: string | undefined, code: string): number {
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed < 1) throw new Error(code)
  return parsed
}

main().catch((error: unknown) => {
  const code = error instanceof Error ? error.message : 'ADVISORY_ESCALATION_FAILED'
  process.stderr.write(`${code}\n`)
  process.exitCode = 1
})
