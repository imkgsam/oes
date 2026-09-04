import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { PolicyInstancePreviewApi } from '../../../../src/api/bff/policy-instance-preview/index'

const post = vi.fn()

vi.mock('#/api/request', () => ({
  requestClient: {
    post
  }
}))

// Verifies the tenant-web PolicyInstance preview API client targets the dedicated gateway contract.
describe('tenant-web policy instance preview api', () => {
  beforeEach(() => {
    post.mockReset()
  })

  it('posts evaluate preview requests to the policy-instance preview endpoint', async () => {
    const { evaluatePolicyInstancePreviewApi } = await import('../../../../src/api/bff/policy-instance-preview/index')
    const payload: PolicyInstancePreviewApi.EvaluatePreviewRequest = {
      mode: 'QUERY_SCOPE',
      subject: {
        accountId: 'account-1',
        tenantId: 'tenant-1',
        roleIds: []
      },
      permissionCode: 'procurement.purchase_request.create',
      resourceType: 'item',
      policyInstances: []
    }

    await evaluatePolicyInstancePreviewApi(payload)

    expect(post).toHaveBeenCalledWith('/policy-instance/evaluate-preview', payload)
  })
})
