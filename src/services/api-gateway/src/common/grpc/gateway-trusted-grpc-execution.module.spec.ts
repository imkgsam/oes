import { GatewayMachineTrustedGrpcExecutionProducer } from './gateway-machine-trusted-grpc-execution-producer'
import { GatewayMachineWorkloadSourceCredentialProvider } from './gateway-machine-workload-source-credential.provider'
import { GatewayTrustedGrpcExecutionModule } from './gateway-trusted-grpc-execution.module'
import { GatewayTrustedGrpcExecutionProducer } from './gateway-trusted-grpc-execution-producer'
import { GatewaySalesGrpcClient } from './gateway-sales-grpc.client'
import { Module } from '@nestjs/common'
import { Test } from '@nestjs/testing'

type FactoryProvider = {
  provide: unknown
  useFactory?: (...args: never[]) => unknown
  inject?: readonly unknown[]
}

/** Verifies the Gateway module composes one real HUMAN/MACHINE trust stack from deployment configuration. */
describe('GatewayTrustedGrpcExecutionModule wiring', () => {
  const saved = {
    issuer: process.env.AUTH_EXECUTION_ISSUER,
    workload: process.env.OES_WORKLOAD_SPIFFE_ID
  }
  beforeEach(() => {
    process.env.AUTH_EXECUTION_ISSUER = 'https://auth.example.test'
    process.env.OES_WORKLOAD_SPIFFE_ID = 'spiffe://oes/gateway'
  })
  afterAll(() => {
    if (saved.issuer === undefined) delete process.env.AUTH_EXECUTION_ISSUER
    else process.env.AUTH_EXECUTION_ISSUER = saved.issuer
    if (saved.workload === undefined) delete process.env.OES_WORKLOAD_SPIFFE_ID
    else process.env.OES_WORKLOAD_SPIFFE_ID = saved.workload
  })

  it('registers and exports both trusted producers with all frozen target audiences', () => {
    const providers = Reflect.getMetadata(
      'providers',
      GatewayTrustedGrpcExecutionModule
    ) as FactoryProvider[]
    const exports = Reflect.getMetadata('exports', GatewayTrustedGrpcExecutionModule) as unknown[]
    expect(
      providers.map((provider) => (typeof provider === 'object' ? provider.provide : provider))
    ).toEqual(
      expect.arrayContaining([
        GatewayTrustedGrpcExecutionProducer,
        GatewaySalesGrpcClient,
        GatewayMachineWorkloadSourceCredentialProvider,
        GatewayMachineTrustedGrpcExecutionProducer
      ])
    )
    expect(exports).toEqual(
      expect.arrayContaining([
        GatewayTrustedGrpcExecutionProducer,
        GatewaySalesGrpcClient,
        GatewayMachineWorkloadSourceCredentialProvider,
        GatewayMachineTrustedGrpcExecutionProducer
      ])
    )
    const registry = providers.find((provider) =>
      provider.provide?.toString().includes('TrustedExecutionRegistry')
    )!
    const value = registry.useFactory!() as { audiences: ReadonlySet<string> }
    expect([...value.audiences]).toEqual([
      'urn:oes:service:asset-service',
      'urn:oes:service:site-service',
      'urn:oes:service:browser-activity-service',
      'urn:oes:service:terminal-device-service',
      'urn:oes:service:finance-service',
      'urn:oes:service:sales-service',
      'urn:oes:service:public-entry-service'
    ])
  })

  it('exports the dedicated Sales client to a consumer module through the real Nest DI graph', async () => {
    @Module({ imports: [GatewayTrustedGrpcExecutionModule] })
    class ConsumerModule {}
    const module = await Test.createTestingModule({ imports: [ConsumerModule] }).compile()
    expect(module.get(GatewaySalesGrpcClient)).toBeInstanceOf(GatewaySalesGrpcClient)
  })

  it('fails closed when deployment trust configuration is absent instead of installing a default producer', () => {
    const providers = Reflect.getMetadata(
      'providers',
      GatewayTrustedGrpcExecutionModule
    ) as FactoryProvider[]
    const registry = providers.find((provider) =>
      provider.provide?.toString().includes('TrustedExecutionRegistry')
    )!
    delete process.env.AUTH_EXECUTION_ISSUER
    expect(() => registry.useFactory!()).toThrow('AUTH_EXECUTION_ISSUER is required')
    expect(
      providers.some(
        (provider) =>
          provider.provide === GatewayMachineTrustedGrpcExecutionProducer &&
          provider.useFactory === undefined
      )
    ).toBe(false)
  })
})
