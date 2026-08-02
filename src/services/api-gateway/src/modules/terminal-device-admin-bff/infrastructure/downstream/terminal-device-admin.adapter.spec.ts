import { Metadata } from '@grpc/grpc-js'
import { of } from 'rxjs'
import { TerminalDeviceAdminAdapter } from './terminal-device-admin.adapter'

/** Exercises explicit generated metadata for Admin Terminal Device legacy calls without adding authority. */
describe('TerminalDeviceAdminAdapter', () => {
  it('passes empty explicit metadata to the legacy enrollment creation RPC', async () => {
    const createEnrollment = jest.fn((_request: unknown, _metadata: Metadata) =>
      of({ enrollment: {}, enrollmentCode: 'enrollment-123' })
    )
    const adapter = new TerminalDeviceAdminAdapter({
      getService: jest.fn(() => ({ createEnrollment }))
    } as never)
    adapter.onModuleInit()

    await adapter.createEnrollment({
      tenantId: 'tenant-123',
      terminalDeviceType: 'PDA',
      displayName: 'PDA',
      expiresAt: '2026-08-02T00:00:00.000Z',
      source: { user: { aid: 'account-123' } }
    })

    expect(createEnrollment).toHaveBeenCalledTimes(1)
    const metadata = createEnrollment.mock.calls[0]?.[1]
    expect(metadata).toBeInstanceOf(Metadata)
    expect(metadata.getMap()).toEqual({})
  })
})
