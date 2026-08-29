import { createLazyTrustedExecutionRuntime } from './lazy-trusted-execution-runtime'

describe('createLazyTrustedExecutionRuntime', () => {
  it('preserves both generic and issuance-specific transport identity operations', () => {
    const runtime = createLazyTrustedExecutionRuntime('urn:oes:service:auth-service', {})

    expect(runtime.workloadIdentityProvider.getVerifiedWorkloadIdentity).toEqual(expect.any(Function))
    expect(runtime.workloadIdentityProvider.getVerifiedWorkloadIssuanceIdentity).toEqual(expect.any(Function))
  })
})
