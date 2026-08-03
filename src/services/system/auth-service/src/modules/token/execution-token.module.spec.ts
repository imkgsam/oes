import { MODULE_METADATA } from '@nestjs/common/constants'
import { AsyncLocalTrustedExecutionContextAccessor } from '@oes/common/authorization'
import { EXECUTION_TOKEN_EXCHANGE_CONTEXT } from '../../application/ports/execution-token-exchange-context.port'
import { ExecutionTokenModule } from './execution-token.module'

type ProviderDefinition = Readonly<{
  provide?: unknown
  inject?: readonly unknown[]
}>

/** Proves the Auth STS provider receives the same Common request-local execution accessor registered by its module. */
describe('ExecutionTokenModule verified context wiring', () => {
  it('injects Common execution context into the exchange boundary', () => {
    const providers: Array<ProviderDefinition | Function> = Reflect.getMetadata(
      MODULE_METADATA.PROVIDERS,
      ExecutionTokenModule
    )
    const exchangeContextProvider = providers.find(
      (provider) =>
        typeof provider === 'object' && provider?.provide === EXECUTION_TOKEN_EXCHANGE_CONTEXT
    )

    expect(providers).toContain(AsyncLocalTrustedExecutionContextAccessor)
    expect(exchangeContextProvider).toEqual(
      expect.objectContaining({
        inject: expect.arrayContaining([AsyncLocalTrustedExecutionContextAccessor])
      })
    )
  })
})
