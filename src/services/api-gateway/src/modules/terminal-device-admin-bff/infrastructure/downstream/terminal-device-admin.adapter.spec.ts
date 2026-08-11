import { Metadata } from '@grpc/grpc-js'
import { of } from 'rxjs'
import { TerminalDeviceAdminAdapter } from './terminal-device-admin.adapter'

/** Exercises Gateway HUMAN metadata for Admin Terminal Device calls. */
describe('TerminalDeviceAdminAdapter', () => {
  it('passes producer metadata to enrollment creation', async () => {
    const createEnrollment = jest.fn((_request: unknown, _metadata: Metadata) =>
      of({ enrollment: {}, enrollmentCode: 'enrollment-123' })
    )
    const client = { getService: jest.fn(() => ({ createEnrollment })) }
    const adapter = new TerminalDeviceAdminAdapter({ getClient: jest.fn(() => client) } as never, { forBusinessCall: jest.fn(async () => new Metadata()) } as never)
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
