import { AsyncLocalTrustedExecutionContextAccessor, createTrustedExecutionContext } from './trusted-execution-context'
import { InternalTrustedGrpcCaller, PARTY_CALLER_ERRORS } from './internal-trusted-grpc-caller'

describe('InternalTrustedGrpcCaller', () => {
  it('fails closed without a MACHINE root', async () => {
    // @ts-ignore focused runtime fixture
    const caller = new InternalTrustedGrpcCaller(new AsyncLocalTrustedExecutionContextAccessor(), {}, {})
    await expect(caller.forInternalCall('party.internal.get_tenant_party_by_id', async () => undefined)).rejects.toThrow(PARTY_CALLER_ERRORS.CONTEXT_REQUIRED)
  })

  it('maps source credential failures to the stable Party error', async () => {
    const context = new AsyncLocalTrustedExecutionContextAccessor()
    // @ts-ignore focused runtime fixture
    const caller = new InternalTrustedGrpcCaller(context, {}, { run: async () => { throw new Error('source credential is invalid') } })
    const root = createTrustedExecutionContext({ subject: 'machine', principalType: 'MACHINE', requestId: 'request', traceparent: '00-0123456789abcdef0123456789abcdef-0123456789abcdef-01' })
    await expect(context.run(root, () => caller.forInternalCall('party.internal.get_tenant_party_by_id', async () => undefined))).rejects.toThrow(PARTY_CALLER_ERRORS.SOURCE_CREDENTIAL_INVALID)
  })

  it.each([
    'ExecutionToken exchange granted an unexpected audience',
    'ExecutionToken exchange returned an invalid bearer credential',
    'certificate thumbprint is invalid'
  ])('maps ET and certificate failures without exposing the cause', async (message) => {
    const context = new AsyncLocalTrustedExecutionContextAccessor()
    // @ts-ignore focused runtime fixture
    const caller = new InternalTrustedGrpcCaller(context, { forInternalCall: async () => { throw new Error(message) } }, { run: async (callback: () => Promise<unknown>) => callback() })
    const root = createTrustedExecutionContext({ subject: 'machine', principalType: 'MACHINE', requestId: 'request', traceparent: '00-0123456789abcdef0123456789abcdef-0123456789abcdef-01' })
    await expect(context.run(root, () => caller.forInternalCall('party.internal.get_tenant_party_by_id', async () => undefined))).rejects.toThrow(PARTY_CALLER_ERRORS.SOURCE_CREDENTIAL_INVALID)
  })
})
