import { of } from 'rxjs'
import { EmployeeOfficialPhotoAssetGrpcAdapter } from '../../../../../src/modules/hr-service/adapters/employee-official-photo-asset-grpc.adapter'

/** Verifies employee-photo writes request the fixed Asset BUSINESS authority. */
describe('EmployeeOfficialPhotoAssetGrpcAdapter', () => {
  it('uses only hr.employee.create for both employee-photo operations', async () => {
    const service = { uploadEmployeeOfficialPhoto: jest.fn(() => of({})), bindEmployeeOfficialPhoto: jest.fn(() => of({})) }
    const producer = { forBusinessCall: jest.fn(async () => ({})) }
    const adapter = new EmployeeOfficialPhotoAssetGrpcAdapter({ getService: () => service } as never, producer as never)
    adapter.onModuleInit()
    const source = { user: { holderId: 'account-1', sid: 'session-1' }, requestId: 'request-1', traceparent: '00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01' }
    await adapter.uploadEmployeeOfficialPhoto({ employeeId: 'employee-1' }, source)
    await adapter.bindEmployeeOfficialPhoto({ employeeId: 'employee-1', newAssetId: 'asset-1' }, source)
    expect(producer.forBusinessCall).toHaveBeenCalledWith(source, 'urn:oes:service:asset-service', ['hr.employee.create'])
  })
})
