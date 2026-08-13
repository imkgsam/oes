import { Metadata } from '@grpc/grpc-js'
import { AsyncLocalTrustedExecutionContextAccessor, createTrustedExecutionContext } from './trusted-execution-context'
import { InternalTrustedGrpcCaller, PARTY_CALLER_ERRORS } from './internal-trusted-grpc-caller'

const code = 'party.internal.get_tenant_party_by_id'
const root = () => createTrustedExecutionContext({ subject: 'machine', principalType: 'MACHINE', requestId: 'request', traceparent: '00-0123456789abcdef0123456789abcdef-0123456789abcdef-01' })
const metadata = (failure?: Error) => ({ forInternalCall: jest.fn(async () => { if (failure) throw failure; return new Metadata() }) })
const source = (failure?: Error) => ({ run: jest.fn(async (callback: () => Promise<unknown>) => { if (failure) throw failure; return callback() }) })

describe('InternalTrustedGrpcCaller', () => {
  it('fails closed without a MACHINE root and never invokes downstream', async () => {
    const downstream = jest.fn(async () => undefined)
    // @ts-ignore focused runtime fixture
    const caller = new InternalTrustedGrpcCaller(new AsyncLocalTrustedExecutionContextAccessor(), metadata(), source() as never)
    await expect(caller.forInternalCall(code, downstream)).rejects.toThrow(PARTY_CALLER_ERRORS.CONTEXT_REQUIRED)
    expect(downstream).not.toHaveBeenCalled()
  })

  it.each([
    ['configuration unavailable', PARTY_CALLER_ERRORS.FOUNDATION_UNAVAILABLE],
    ['local workload identity unavailable', PARTY_CALLER_ERRORS.FOUNDATION_UNAVAILABLE],
    ['STS transport unavailable', PARTY_CALLER_ERRORS.FOUNDATION_UNAVAILABLE],
    ['source credential rejected: source-secret', PARTY_CALLER_ERRORS.SOURCE_CREDENTIAL_INVALID],
    ['ExecutionToken exchange returned an invalid bearer credential: raw-token', PARTY_CALLER_ERRORS.SOURCE_CREDENTIAL_INVALID],
    ['ExecutionToken exchange granted an unexpected audience', PARTY_CALLER_ERRORS.SOURCE_CREDENTIAL_INVALID],
    ['ExecutionToken exchange granted an unexpected Permission Code set', PARTY_CALLER_ERRORS.SOURCE_CREDENTIAL_INVALID],
    ['Local workload certificate thumbprint is invalid', PARTY_CALLER_ERRORS.SOURCE_CREDENTIAL_INVALID],
    ['cnf certificate binding failed', PARTY_CALLER_ERRORS.SOURCE_CREDENTIAL_INVALID]
  ])('maps %s and does not expose the underlying value', async (message, expected) => {
    const context = new AsyncLocalTrustedExecutionContextAccessor()
    const downstream = jest.fn(async () => undefined)
    const caller = new InternalTrustedGrpcCaller(context, metadata(new Error(message)) as never, source() as never)
    let caught: Error | undefined
    try { await context.run(root(), () => caller.forInternalCall(code, downstream)) } catch (error) { caught = error as Error }
    expect(caught).toBeDefined()
    expect(caught?.message).toBe(expected)
    expect(caught?.stack).not.toContain('source-secret')
    expect(caught?.stack).not.toContain('raw-token')
    expect(downstream).not.toHaveBeenCalled()
  })

  it('maps a rejected source provider without calling metadata or downstream', async () => {
    const context = new AsyncLocalTrustedExecutionContextAccessor()
    const provider = source(new Error('source credential rejected: source-secret'))
    const providerMetadata = metadata()
    const downstream = jest.fn(async () => undefined)
    const caller = new InternalTrustedGrpcCaller(context, providerMetadata as never, provider as never)
    await expect(context.run(root(), () => caller.forInternalCall(code, downstream))).rejects.toThrow(PARTY_CALLER_ERRORS.SOURCE_CREDENTIAL_INVALID)
    expect(providerMetadata.forInternalCall).not.toHaveBeenCalled()
    expect(downstream).not.toHaveBeenCalled()
  })

  it('calls downstream exactly once after a valid source and Party ET metadata result', async () => {
    const context = new AsyncLocalTrustedExecutionContextAccessor()
    const downstream = jest.fn(async (value: Metadata) => value.getMap())
    const caller = new InternalTrustedGrpcCaller(context, metadata() as never, source() as never)
    await expect(context.run(root(), () => caller.forInternalCall(code, downstream))).resolves.toEqual({})
    expect(downstream).toHaveBeenCalledTimes(1)
  })
})
