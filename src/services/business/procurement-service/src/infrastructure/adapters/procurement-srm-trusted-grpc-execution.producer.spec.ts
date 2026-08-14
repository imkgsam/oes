import { SRM_INTERNAL_PERMISSION_CODES } from '@oes/common/authorization'
import {
  ProcurementSrmTrustedGrpcExecutionProducer,
  SRM_CALLER_ERRORS
} from './procurement-srm-trusted-grpc-execution.producer'

/** Verifies the prepared Procurement SRM producer fails before transport without verified inbound HUMAN scope. */
describe('Procurement SRM HUMAN_OBO producer', () => {
  it('rejects missing current-hop execution context with the SRM error family', async () => {
    await expect(
      new ProcurementSrmTrustedGrpcExecutionProducer({} as never).createMetadata(
        SRM_INTERNAL_PERMISSION_CODES.RESOLVE_ACTIVE_SUPPLIER,
        'tenant-1',
        'request-1',
        '00-0123456789abcdef0123456789abcdef-0123456789abcdef-01'
      )
    ).rejects.toThrow(SRM_CALLER_ERRORS.CONTEXT_REQUIRED)
  })

  it('rejects malformed trace authority before any STS exchange', async () => {
    const exchange = { exchange: jest.fn() }
    await expect(
      new ProcurementSrmTrustedGrpcExecutionProducer(exchange as never).createMetadata(
        SRM_INTERNAL_PERMISSION_CODES.RESOLVE_ACTIVE_SUPPLIER_OFFERING,
        'tenant-1',
        'request-1',
        'legacy-trace'
      )
    ).rejects.toThrow(SRM_CALLER_ERRORS.CONTEXT_REQUIRED)
    expect(exchange.exchange).not.toHaveBeenCalled()
  })
})
