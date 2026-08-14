import { ITEM_MASTER_INTERNAL_PERMISSION_CODES } from '@oes/common/authorization'
import { MesItemMasterTrustedGrpcExecutionProducer } from './mes-item-master-trusted-grpc-execution.producer'

/** Verifies MES's target-profile producer maps missing deployment roots to the Item Master error family. */
describe('MES Item Master producer', () => {
  it('fails closed before exchange when deployment trust is unavailable', async () => {
    const issuer = process.env.AUTH_EXECUTION_ISSUER
    delete process.env.AUTH_EXECUTION_ISSUER
    process.env.MES_ITEM_MASTER_MACHINE_PRINCIPAL_ID = 'machine-mes'
    await expect(
      new MesItemMasterTrustedGrpcExecutionProducer({} as never, {} as never).createMetadata(
        ITEM_MASTER_INTERNAL_PERMISSION_CODES.RESOLVE_MANUFACTURABLE_ITEM,
        'tenant-1',
        'request-1',
        '00-0123456789abcdef0123456789abcdef-0123456789abcdef-01'
      )
    ).rejects.toThrow('ITEM_MASTER_CALLER_FOUNDATION_UNAVAILABLE')
    if (issuer === undefined) delete process.env.AUTH_EXECUTION_ISSUER
    else process.env.AUTH_EXECUTION_ISSUER = issuer
  })
})
