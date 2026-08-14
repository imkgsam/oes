import { Metadata } from '@grpc/grpc-js'
import { ITEM_MASTER_INTERNAL_PERMISSION_CODES } from '@oes/common/authorization'
import { of } from 'rxjs'
import { ItemMasterStockableQueryGrpcAdapter } from '../../src/infrastructure/adapters/item-master-stockable-query.grpc.adapter'
import { WmsItemMasterTrustedGrpcClient } from '../../src/infrastructure/adapters/item-master-trusted-grpc.client'
import { WmsItemMasterExecutionTokenExchangeClient } from '../../src/infrastructure/adapters/wms-item-master-execution-token-exchange.client'
import { WmsItemMasterTrustedGrpcExecutionProducer } from '../../src/infrastructure/adapters/wms-item-master-trusted-grpc-execution.producer'
import { WmsInfrastructureModule } from '../../src/modules/wms-infrastructure.module'

const audience = 'urn:oes:service:item-master-service'
const code = ITEM_MASTER_INTERNAL_PERMISSION_CODES.RESOLVE_STOCKABLE_ITEM
const traceparent = '00-0123456789abcdef0123456789abcdef-0123456789abcdef-01'

/** Verifies WMS's complete Item Master caller graph succeeds narrowly and fails closed. */
describe('WMS Item Master trusted execution L1', () => {
  const saved = process.env

  beforeEach(() => {
    process.env = {
      ...saved,
      AUTH_EXECUTION_ISSUER: 'https://issuer.example',
      OES_WORKLOAD_SPIFFE_ID: 'spiffe://oes/wms-service'
    }
  })

  afterAll(() => {
    process.env = saved
  })

  it('keeps the prepared caller graph out of production DI until WMS inbound migration', () => {
    const tokens = [
      WmsItemMasterTrustedGrpcClient,
      WmsItemMasterExecutionTokenExchangeClient,
      WmsItemMasterTrustedGrpcExecutionProducer
    ]
    const providers = Reflect.getMetadata('providers', WmsInfrastructureModule) as unknown[]
    expect(providers).not.toEqual(expect.arrayContaining(tokens))
  })

  it('calls only ResolveStockableItem with the exact code and no body tenant', async () => {
    const rpc = jest.fn(() =>
      of({ item: { itemId: 'item-1', itemCode: 'I-1', itemName: 'Item', active: true } })
    )
    const producer = { createMetadata: jest.fn(async () => new Metadata()) }
    const adapter = new ItemMasterStockableQueryGrpcAdapter(
      { internalQuery: () => ({ resolveStockableItem: rpc }) } as never,
      producer as never,
      { getContext: () => ({ requestId: 'request-1', traceId: traceparent }) } as never
    )
    adapter.onModuleInit()

    await expect(adapter.getItemById('tenant-1', 'item-1')).resolves.toMatchObject({
      stockable: true
    })
    expect(rpc).toHaveBeenCalledWith({ itemId: 'item-1' }, expect.any(Metadata))
    expect(producer.createMetadata).toHaveBeenCalledWith(code, 'tenant-1', 'request-1', traceparent)
  })

  it('fails closed without a verified inbound HUMAN scope', async () => {
    await expect(
      new WmsItemMasterTrustedGrpcExecutionProducer({} as never).createMetadata(
        code,
        'tenant-1',
        'request-1',
        traceparent
      )
    ).rejects.toThrow('ITEM_MASTER_CALLER_EXECUTION_CONTEXT_REQUIRED')
  })

  it('maps Auth STS response and rejects incomplete MACHINE execution context', async () => {
    const exchange = new WmsItemMasterExecutionTokenExchangeClient()
    const sts = jest.fn(() =>
      of({
        tokenType: 'Bearer',
        accessToken: 'target',
        grantedAudience: audience,
        grantedPermissionCodes: [code]
      })
    )
    ;(exchange as any).getService = () => ({ exchangeExecutionToken: sts })
    await expect(
      exchange.exchange(
        { targetAudience: audience, requestedPermissionCodes: [code] },
        new Metadata()
      )
    ).resolves.toMatchObject({ accessToken: 'target', grantedAudience: audience })
    expect(sts).toHaveBeenCalledWith(
      { targetAudience: audience, requestedPermissionCodes: [code] },
      expect.any(Metadata)
    )
    await expect(
      new WmsItemMasterTrustedGrpcExecutionProducer(exchange).createMetadata(
        code,
        'tenant-1',
        'request-1',
        'legacy-trace'
      )
    ).rejects.toThrow('ITEM_MASTER_CALLER_EXECUTION_CONTEXT_REQUIRED')
  })
})
