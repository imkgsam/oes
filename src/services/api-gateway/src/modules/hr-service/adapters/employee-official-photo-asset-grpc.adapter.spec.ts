import { Metadata } from '@grpc/grpc-js'
import { of } from 'rxjs'
import { EmployeeOfficialPhotoAssetGrpcAdapter } from './employee-official-photo-asset-grpc.adapter'

/** Verifies that employee photo operations use BUSINESS metadata and retain only Employee business targets. */
describe('EmployeeOfficialPhotoAssetGrpcAdapter trusted execution', () => {
  it('uses the exact BUSINESS Code for upload and bind', async () => {
    const source = {
      user: { aid: 'account-1', tid: 'tenant-1', sid: 'session-1' },
      requestId: 'request-1',
      traceparent: '00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01'
    }
    const metadata = new Metadata()
    const service = {
      uploadEmployeeOfficialPhoto: jest.fn(() => of({ asset: { assetId: 'asset-1' } })),
      bindEmployeeOfficialPhoto: jest.fn(() => of({ activeAsset: { assetId: 'asset-1' } }))
    }
    const producer = {
      forBusinessCall: jest.fn().mockResolvedValue(metadata)
    }
    const adapter = new EmployeeOfficialPhotoAssetGrpcAdapter(
      { getService: jest.fn(() => service) } as never,
      producer as never
    )
    adapter.onModuleInit()

    await adapter.uploadEmployeeOfficialPhoto(
      {
        employeeId: 'employee-1',
        file: Buffer.from('photo'),
        fileName: 'official.webp',
        contentType: 'image/webp'
      },
      source
    )
    await adapter.bindEmployeeOfficialPhoto(
      { employeeId: 'employee-1', newAssetId: 'asset-1', previousAssetId: 'asset-old' },
      source
    )

    expect(producer.forBusinessCall).toHaveBeenCalledTimes(2)
    expect(producer.forBusinessCall).toHaveBeenCalledWith(source, 'urn:oes:service:asset-service', [
      'hr.employee.create'
    ])
    expect(service.uploadEmployeeOfficialPhoto).toHaveBeenCalledWith(
      {
        employeeId: 'employee-1',
        file: Buffer.from('photo'),
        fileName: 'official.webp',
        contentType: 'image/webp'
      },
      metadata
    )
    expect(service.bindEmployeeOfficialPhoto).toHaveBeenCalledWith(
      { employeeId: 'employee-1', newAssetId: 'asset-1', previousAssetId: 'asset-old' },
      metadata
    )
  })
})
