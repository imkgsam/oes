import { Metadata } from '@grpc/grpc-js'
import { Test } from '@nestjs/testing'
import { ITEM_MASTER_INTERNAL_PERMISSION_CODES } from '@oes/common/authorization'
import { of } from 'rxjs'
import { ItemMasterManufacturableQueryGrpcAdapter } from '../../src/infrastructure/adapters/item-master-manufacturable-query.grpc.adapter'
import { MesItemMasterTrustedGrpcClient } from '../../src/infrastructure/adapters/item-master-trusted-grpc.client'
import { MesItemMasterExecutionTokenExchangeClient } from '../../src/infrastructure/adapters/mes-item-master-execution-token-exchange.client'
import { MesItemMasterTrustedGrpcExecutionProducer } from '../../src/infrastructure/adapters/mes-item-master-trusted-grpc-execution.producer'
import { MesInfrastructureModule } from '../../src/modules/mes-infrastructure.module'

const audience = 'urn:oes:service:item-master-service'
const code = ITEM_MASTER_INTERNAL_PERMISSION_CODES.RESOLVE_MANUFACTURABLE_ITEM
const traceparent = '00-0123456789abcdef0123456789abcdef-0123456789abcdef-01'

/** Verifies MES's complete Item Master caller graph succeeds narrowly and fails closed. */
describe('MES Item Master trusted execution Unit', () => {
  const saved = process.env

  beforeEach(() => {
    process.env = {
      ...saved,
      AUTH_EXECUTION_ISSUER: 'https://issuer.example',
      OES_WORKLOAD_SPIFFE_ID: 'spiffe://oes/mes-service'
    }
  })

  afterAll(() => {
    process.env = saved
  })

  it('resolves the dedicated client, source provider, exchange, and producer graph', async () => {
    const tokens = [
      MesItemMasterTrustedGrpcClient,
      MesItemMasterExecutionTokenExchangeClient,
      MesItemMasterTrustedGrpcExecutionProducer
    ]
    const module = await compileRegisteredGraph(MesInfrastructureModule, tokens)
    for (const token of tokens) {
      expect(module.get(token)).toBeDefined()
    }
    await module.close()
  })

  it('calls only ResolveManufacturableItem with the exact code and no body tenant', async () => {
    const rpc = jest.fn(() =>
      of({ item: { itemId: 'item-1', itemCode: 'I-1', itemName: 'Item', active: true } })
    )
    const producer = { createMetadata: jest.fn(async () => new Metadata()) }
    const adapter = new ItemMasterManufacturableQueryGrpcAdapter(
      { internalQuery: () => ({ resolveManufacturableItem: rpc }) } as never,
      producer as never,
      { getContext: () => ({ requestId: 'request-1', traceId: traceparent }) } as never
    )
    adapter.onModuleInit()

    await expect(adapter.getManufacturableItem('tenant-1', 'item-1')).resolves.toMatchObject({
      manufacturable: true,
      physical: true
    })
    expect(rpc).toHaveBeenCalledWith({ itemId: 'item-1' }, expect.any(Metadata))
    expect(producer.createMetadata).toHaveBeenCalledWith(code, 'tenant-1', 'request-1', traceparent)
  })

  it('fails closed without a guard-verified inbound HUMAN subject scope', async () => {
    await expect(
      new MesItemMasterTrustedGrpcExecutionProducer({} as never).createMetadata(
        code,
        'tenant-1',
        'request-1',
        traceparent
      )
    ).rejects.toThrow('ITEM_MASTER_CALLER_EXECUTION_CONTEXT_REQUIRED')
  })

  it('maps Auth STS response and rejects incomplete MACHINE execution context', async () => {
    const exchange = new MesItemMasterExecutionTokenExchangeClient()
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
      new MesItemMasterTrustedGrpcExecutionProducer(exchange).createMetadata(
        code,
        'tenant-1',
        'request-1',
        'legacy-trace'
      )
    ).rejects.toThrow('ITEM_MASTER_CALLER_EXECUTION_CONTEXT_REQUIRED')
  })
})

/** Compiles only the trust providers registered by the real infrastructure module. */
async function compileRegisteredGraph(owner: object, tokens: unknown[]) {
  const providers = Reflect.getMetadata('providers', owner) as Array<object | Function>
  const selected = providers.filter((provider) =>
    tokens.includes(
      typeof provider === 'object' && 'provide' in provider ? provider.provide : provider
    )
  )
  expect(selected).toHaveLength(tokens.length)
  return Test.createTestingModule({ providers: selected as never[] }).compile()
}
