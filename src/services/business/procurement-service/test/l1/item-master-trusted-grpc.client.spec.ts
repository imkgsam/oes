import { Metadata } from '@grpc/grpc-js'
import { ITEM_MASTER_INTERNAL_PERMISSION_CODES } from '@oes/common/authorization'
import { of } from 'rxjs'
import { ItemMasterQueryGrpcAdapter } from '../../src/infrastructure/adapters/item-master-query.grpc.adapter'
import { ProcurementItemMasterTrustedGrpcClient } from '../../src/infrastructure/adapters/item-master-trusted-grpc.client'
import { ProcurementItemMasterExecutionTokenExchangeClient } from '../../src/infrastructure/adapters/procurement-item-master-execution-token-exchange.client'
import { ProcurementItemMasterTrustedGrpcExecutionProducer } from '../../src/infrastructure/adapters/procurement-item-master-trusted-grpc-execution.producer'
import { ProcurementInfrastructureModule } from '../../src/modules/procurement-infrastructure.module'

const audience = 'urn:oes:service:item-master-service'
const code = ITEM_MASTER_INTERNAL_PERMISSION_CODES.RESOLVE_PURCHASABLE_ITEM
const traceparent = '00-0123456789abcdef0123456789abcdef-0123456789abcdef-01'

/** Verifies Procurement's complete Item Master caller graph succeeds narrowly and fails closed. */
describe('Procurement Item Master trusted execution L1', () => {
  const saved = process.env

  beforeEach(() => {
    process.env = {
      ...saved,
      AUTH_EXECUTION_ISSUER: 'https://issuer.example',
      OES_WORKLOAD_SPIFFE_ID: 'spiffe://oes/procurement-service'
    }
  })

  afterAll(() => {
    process.env = saved
  })

  it('keeps the prepared caller graph out of production DI until Procurement inbound migration', () => {
    const tokens = [
      ProcurementItemMasterTrustedGrpcClient,
      ProcurementItemMasterExecutionTokenExchangeClient,
      ProcurementItemMasterTrustedGrpcExecutionProducer
    ]
    const providers = Reflect.getMetadata('providers', ProcurementInfrastructureModule) as unknown[]
    expect(providers).not.toEqual(expect.arrayContaining(tokens))
  })

  it('calls only ResolvePurchasableItem with the exact code and no body tenant', async () => {
    const rpc = jest.fn(() =>
      of({ item: { itemId: 'item-1', itemCode: 'I-1', itemName: 'Item', active: true } })
    )
    const producer = { createMetadata: jest.fn(async () => new Metadata()) }
    const adapter = new ItemMasterQueryGrpcAdapter(
      { internalQuery: () => ({ resolvePurchasableItem: rpc }) } as never,
      producer as never,
      { getContext: () => ({ requestId: 'request-1', traceId: traceparent }) } as never
    )
    adapter.onModuleInit()

    await expect(adapter.getItemById('tenant-1', 'item-1')).resolves.toMatchObject({
      purchasable: true
    })
    expect(rpc).toHaveBeenCalledWith({ itemId: 'item-1' }, expect.any(Metadata))
    expect(producer.createMetadata).toHaveBeenCalledWith(code, 'tenant-1', 'request-1', traceparent)
  })

  it('maps Auth STS response and rejects incomplete MACHINE execution context', async () => {
    const exchange = new ProcurementItemMasterExecutionTokenExchangeClient()
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
      new ProcurementItemMasterTrustedGrpcExecutionProducer(exchange).createMetadata(
        code,
        'tenant-1',
        'request-1',
        'legacy-trace'
      )
    ).rejects.toThrow('ITEM_MASTER_CALLER_EXECUTION_CONTEXT_REQUIRED')
  })
})
