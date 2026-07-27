import { NotificationCollaborationTaskEventWorker } from '../../src/infrastructure/events/notification-collaboration-task-event.worker'

/** Verifies that Notification starts only the pre-provisioned Collaboration Task durable pull worker. */
describe('NotificationCollaborationTaskEventWorker L1', () => {
  it('starts the exact durable on module initialization and stops it on shutdown', async () => {
    const calls: string[] = []
    let options: any
    const runner = {
      start: (input: any) => {
        options = input
        calls.push('start')
        return {
          stop: async () => {
            calls.push('stop')
          }
        }
      }
    }
    const consumer = { handleDelivery: async () => undefined }
    const worker = new NotificationCollaborationTaskEventWorker(runner as any, consumer as any)

    await worker.onModuleInit()
    await worker.onModuleDestroy()

    expect(calls).toEqual(['start', 'stop'])
    expect(options).toMatchObject({
      stream: 'OES_BUSINESS_EVENTS',
      consumer: 'notification-service__collaboration-task__v1'
    })
    await expect(options.handle({ id: 'delivery' })).resolves.toBeUndefined()
  })
})
