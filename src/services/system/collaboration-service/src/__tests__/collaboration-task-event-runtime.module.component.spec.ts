import { NatsJetStreamPublisher } from '@oes/common/events'
import { LoggingModule } from '@oes/common/logging'
import * as CommonTransport from '@oes/common/transport'
import { TrustedExecutionGuard } from '@oes/common/authorization'
import { Test } from '@nestjs/testing'
import {
  COLLABORATION_PUBLIC_EVENT_PUBLISHER,
  CollaborationTaskOutboxRelay
} from '../infrastructure/events/collaboration-task-outbox.relay'
import { CollaborationTaskOutboxWorker } from '../infrastructure/events/collaboration-task-outbox.worker'

jest.mock('@oes/common/transport', () => {
  const actual = jest.requireActual<typeof import('@oes/common/transport')>('@oes/common/transport')
  const { credentials } = jest.requireActual<typeof import('@grpc/grpc-js')>('@grpc/grpc-js')
  return {
    ...actual,
    createGrpcClientCredentials: jest.fn(() => credentials.createInsecure())
  }
})

/** Verifies that the Task module consumes the accepted common JetStream runtime rather than a service-local client. */
describe('CollaborationTaskModule event runtime', () => {
  const savedEnvironment = { ...process.env }

  beforeEach(() => {
    process.env.NATS_URL = 'nats://127.0.0.1:4222'
    delete process.env.NATS_USER
    delete process.env.NATS_PASSWORD
    process.env.NATS_COLLABORATION_USER = 'collaboration-publisher'
    process.env.NATS_COLLABORATION_PASSWORD = 'local-validation-only'
    jest.clearAllMocks()
  })

  afterEach(() => {
    process.env = { ...savedEnvironment }
    jest.resetModules()
  })

  it('binds the relay publisher port to the common NatsJetStreamPublisher', async () => {
    const { CollaborationTaskModule } =
      require('../modules/collaboration-task.module') as typeof import('../modules/collaboration-task.module')
    const builder = Test.createTestingModule({
      imports: [
        LoggingModule.forRoot({ serviceName: 'collaboration-service-test' }),
        CollaborationTaskModule
      ]
    })
    const module = await builder
      .overrideGuard(TrustedExecutionGuard)
      .useValue({ canActivate: () => true })
      .compile()

    expect(module.get(COLLABORATION_PUBLIC_EVENT_PUBLISHER)).toBeInstanceOf(NatsJetStreamPublisher)
    expect(module.get(CollaborationTaskOutboxRelay)).toBeInstanceOf(CollaborationTaskOutboxRelay)
    expect(module.get(CollaborationTaskOutboxWorker)).toBeInstanceOf(CollaborationTaskOutboxWorker)
    expect(CommonTransport.createGrpcClientCredentials).toHaveBeenCalledTimes(2)

    await module.close()
  })
})
