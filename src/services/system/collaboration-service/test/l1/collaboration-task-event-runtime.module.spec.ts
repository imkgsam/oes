import { NatsJetStreamPublisher } from '@oes/common/events'
import { LoggingModule } from '@oes/common/logging'
import { Test } from '@nestjs/testing'
import {
  COLLABORATION_PUBLIC_EVENT_PUBLISHER,
  CollaborationTaskOutboxRelay
} from '../../src/infrastructure/events/collaboration-task-outbox.relay'

/** Verifies that the Task module consumes the accepted common JetStream runtime rather than a service-local client. */
describe('CollaborationTaskModule event runtime', () => {
  const savedEnvironment = { ...process.env }

  beforeEach(() => {
    process.env.NATS_URL = 'nats://127.0.0.1:4222'
    process.env.NATS_USER = 'collaboration-publisher'
    process.env.NATS_PASSWORD = 'local-validation-only'
  })

  afterEach(() => {
    process.env = { ...savedEnvironment }
    jest.resetModules()
  })

  it('binds the relay publisher port to the common NatsJetStreamPublisher', async () => {
    const { CollaborationTaskModule } = require('../../src/modules/collaboration-task.module') as typeof import('../../src/modules/collaboration-task.module')
    const module = await Test.createTestingModule({
      imports: [LoggingModule.forRoot({ serviceName: 'collaboration-service-test' }), CollaborationTaskModule]
    }).compile()

    expect(module.get(COLLABORATION_PUBLIC_EVENT_PUBLISHER)).toBeInstanceOf(NatsJetStreamPublisher)
    expect(module.get(CollaborationTaskOutboxRelay)).toBeInstanceOf(CollaborationTaskOutboxRelay)

    await module.close()
  })
})
