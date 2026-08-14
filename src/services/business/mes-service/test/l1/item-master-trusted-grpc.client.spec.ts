import { Metadata } from '@grpc/grpc-js'
import { Test } from '@nestjs/testing'
import { ITEM_MASTER_INTERNAL_PERMISSION_CODES } from '@oes/common/authorization'
import { of } from 'rxjs'
import { ItemMasterManufacturableQueryGrpcAdapter } from '../../src/infrastructure/adapters/item-master-manufacturable-query.grpc.adapter'
import { MesItemMasterTrustedGrpcClient } from '../../src/infrastructure/adapters/item-master-trusted-grpc.client'
import { MesItemMasterExecutionTokenExchangeClient } from '../../src/infrastructure/adapters/mes-item-master-execution-token-exchange.client'
import { MesItemMasterMachineSourceCredentialClient } from '../../src/infrastructure/adapters/mes-item-master-machine-source-credential.client'
import { MesItemMasterMachineSourceCredentialProvider } from '../../src/infrastructure/adapters/mes-item-master-machine-source-credential.provider'
import { MesItemMasterTrustedGrpcExecutionProducer } from '../../src/infrastructure/adapters/mes-item-master-trusted-grpc-execution.producer'
import { MesInfrastructureModule } from '../../src/modules/mes-infrastructure.module'

const audience = 'urn:oes:service:item-master-service'
const code = ITEM_MASTER_INTERNAL_PERMISSION_CODES.RESOLVE_MANUFACTURABLE_ITEM
const traceparent = '00-0123456789abcdef0123456789abcdef-0123456789abcdef-01'

/** Verifies MES's complete Item Master caller graph succeeds narrowly and fails closed. */
describe('MES Item Master trusted execution L1', () => {
  const saved = process.env

  beforeEach(() => {
    process.env = {
      ...saved,
      AUTH_EXECUTION_ISSUER: 'https://issuer.example',
      OES_WORKLOAD_SPIFFE_ID: 'spiffe://oes/mes-service',
      MES_ITEM_MASTER_MACHINE_PRINCIPAL_ID: 'machine-mes',
      MES_ITEM_MASTER_MACHINE_WORKLOAD_BINDING_ID: 'binding-mes-item-master',
      MES_ITEM_MASTER_MACHINE_WORKLOAD_BINDING_VERSION: '1'
    }
  })

  afterAll(() => {
    process.env = saved
  })

  it('resolves the dedicated client, source provider, exchange, and producer graph', async () => {
    const tokens = [
      MesItemMasterTrustedGrpcClient,
      MesItemMasterMachineSourceCredentialClient,
      MesItemMasterMachineSourceCredentialProvider,
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

  it('uses its own source selector and fails closed before downstream on source/config gaps', async () => {
    const client = new MesItemMasterMachineSourceCredentialClient()
    const issue = jest.fn(() => of({ tokenType: 'Bearer', sourceCredential: 'source' }))
    ;(client as any).getService = () => ({ issueMachineWorkloadSourceCredential: issue })
    await expect(client.issue()).resolves.toBe('source')
    expect(issue).toHaveBeenCalledWith(
      {
        machinePrincipalId: 'machine-mes',
        machineWorkloadBindingId: 'binding-mes-item-master',
        machineWorkloadBindingVersion: '1'
      },
      expect.any(Metadata)
    )

    delete process.env.MES_ITEM_MASTER_MACHINE_WORKLOAD_BINDING_ID
    await expect(client.issue()).rejects.toThrow('ITEM_MASTER_CALLER_FOUNDATION_UNAVAILABLE')
    const downstream = jest.fn(async () => undefined)
    await expect(
      new MesItemMasterMachineSourceCredentialProvider(client).run(downstream)
    ).rejects.toThrow()
    expect(downstream).not.toHaveBeenCalled()
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
      new MesItemMasterTrustedGrpcExecutionProducer({} as never, exchange).createMetadata(
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
