import { readFileSync } from 'node:fs'
import {
  NatsJetStreamClient,
  NatsJetStreamRuntimeConfig,
  NatsSafeRedeliveryRunner,
  type SafeRedeliveryRequest
} from '@oes/common'
import { CollaborationTaskNotificationHandler } from '../src/application/events/collaboration-task-notification.handler'
import { PrismaNotificationInboxRepository } from '../src/infrastructure/inbox/prisma-notification-inbox.repository'
import { PrismaService } from '../src/infrastructure/prisma/prisma.service'
import { PrismaNotificationEventOperationsRepository } from '../src/infrastructure/events/operations/prisma-notification-event-operations.repository'
import { NotificationEventOperationsService } from '../src/infrastructure/events/operations/notification-event-operations.service'
import { NotificationSafeRedeliveryJob } from '../src/infrastructure/events/operations/notification-safe-redelivery.job'

/** Runs one approved Notification SAFE_REDELIVERY request using only the short-lived run credential supplied by deployment. */
async function main(): Promise<void> {
  const input = readInput(process.argv[2])
  const trustedOperator = trustedOperatorFromEnvironment(process.env)
  if (input.request.requestedBy !== undefined)
    throw new Error('SAFE_REDELIVERY_FREE_TEXT_OPERATOR_FORBIDDEN')
  const request: SafeRedeliveryRequest = {
    ...input.request,
    requestedBy: trustedOperator.accountId
  } as SafeRedeliveryRequest
  const runtime = new NatsJetStreamClient(
    NatsJetStreamRuntimeConfig.fromEnvironment({
      ...process.env,
      NATS_USER: process.env.NATS_NOTIFICATION_REPLAY_USER,
      NATS_PASSWORD: process.env.NATS_NOTIFICATION_REPLAY_PASSWORD,
      NATS_CLIENT_NAME: `notification-safe-redelivery-${request.replayRunId}`
    })
  )
  const prisma = new PrismaService()
  try {
    await prisma.$connect()
    await runtime.onModuleInit()
    const runner = new NatsSafeRedeliveryRunner(runtime)
    const job = new NotificationSafeRedeliveryJob(
      new NotificationEventOperationsService(
        new PrismaNotificationEventOperationsRepository(prisma)
      ),
      runner,
      new CollaborationTaskNotificationHandler(new PrismaNotificationInboxRepository(prisma))
    )
    const result = await job.execute({
      trustedOperator,
      request,
      maximumPulls: input.maximumPulls
    })
    const deletedConsumers =
      result.status === 'COMPLETED'
        ? await runner.deleteConsumers({ stream: 'OES_BUSINESS_EVENTS', request })
        : []
    process.stdout.write(
      `${JSON.stringify({
        replayRunId: result.replayRunId,
        status: result.status,
        originalSourceTermination: result.originalSourceTermination,
        deletedConsumers
      })}\n`
    )
  } finally {
    await runtime.onModuleDestroy()
    await prisma.$disconnect()
  }
}

/** Reads an operations-only request file while excluding the trusted operator identity from untrusted caller-controlled input. */
function readInput(path: string | undefined): {
  readonly request: Omit<SafeRedeliveryRequest, 'requestedBy'> & { readonly requestedBy?: never }
  readonly maximumPulls: number
} {
  if (!path?.trim()) throw new Error('SAFE_REDELIVERY_REQUEST_FILE_REQUIRED')
  const parsed: unknown = JSON.parse(readFileSync(path, 'utf8'))
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed))
    throw new Error('SAFE_REDELIVERY_REQUEST_INVALID')
  const input = parsed as { request?: unknown; maximumPulls?: unknown }
  if (!input.request || typeof input.request !== 'object' || Array.isArray(input.request))
    throw new Error('SAFE_REDELIVERY_REQUEST_INVALID')
  if (!Number.isInteger(input.maximumPulls) || (input.maximumPulls as number) < 3)
    throw new Error('SAFE_REDELIVERY_MAXIMUM_PULLS_INVALID')
  return {
    request: input.request as Omit<SafeRedeliveryRequest, 'requestedBy'> & {
      readonly requestedBy?: never
    },
    maximumPulls: input.maximumPulls as number
  }
}

/** Reads the deployment-authenticated operator and tenant authorization boundary instead of accepting a free-text principal. */
function trustedOperatorFromEnvironment(environment: NodeJS.ProcessEnv): {
  readonly accountId: string
  readonly authorizedTenantIds: readonly string[]
} {
  const accountId = environment.OES_TRUSTED_OPERATOR_ID?.trim()
  const authorizedTenantIds =
    environment.OES_TRUSTED_OPERATOR_TENANT_IDS?.split(',')
      .map((value) => value.trim())
      .filter(Boolean) ?? []
  if (!accountId || !authorizedTenantIds.length)
    throw new Error('SAFE_REDELIVERY_TRUSTED_OPERATOR_CONTEXT_REQUIRED')
  return { accountId, authorizedTenantIds }
}

main().catch((error: unknown) => {
  const code = error instanceof Error ? error.message : 'SAFE_REDELIVERY_FAILED'
  process.stderr.write(`${code}\n`)
  process.exitCode = 1
})
