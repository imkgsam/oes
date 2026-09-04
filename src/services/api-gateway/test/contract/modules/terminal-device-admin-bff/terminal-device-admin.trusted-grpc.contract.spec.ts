import { Metadata } from '@grpc/grpc-js'
import { of } from 'rxjs'
import { TerminalDeviceAdminAdapter } from '../../../../src/modules/terminal-device-admin-bff/infrastructure/downstream/terminal-device-admin.adapter'

/** Proves the Admin BFF attaches trusted HUMAN authority before a Terminal Device BUSINESS call. */
describe('Terminal Device Admin trusted gRPC boundary', () => {
  it('uses the fixed Terminal Device audience and exact enrollment Code', async () => {
    const createEnrollment = jest.fn(() => of({ enrollment: {}, enrollmentCode: 'code-1' }))
    const client = { getService: jest.fn(() => ({ createEnrollment })) }
    const producer = { forBusinessCall: jest.fn(async () => new Metadata()) }
    const adapter = new TerminalDeviceAdminAdapter({ getClient: jest.fn(() => client) } as never, producer as never)
    adapter.onModuleInit()

    await adapter.createEnrollment({
      tenantId: 'tenant-1',
      terminalDeviceType: 'PDA',
      displayName: 'PDA 1',
      expiresAt: '2026-08-11T00:00:00.000Z',
      source: { user: { tid: 'tenant-1', aid: 'account-1' } }
    })

    expect(producer.forBusinessCall).toHaveBeenCalledWith(
      expect.any(Object),
      'urn:oes:service:terminal-device-service',
      ['terminal-device.enrollment.create']
    )
  })
})
