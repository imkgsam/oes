/* @vitest-environment happy-dom */

import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const evaluatePolicyInstancePreviewApi = vi.fn();

vi.mock('#/api', () => ({
  evaluatePolicyInstancePreviewApi,
}));

describe('policy instance preview page', () => {
  beforeEach(() => {
    evaluatePolicyInstancePreviewApi.mockReset();
    evaluatePolicyInstancePreviewApi.mockResolvedValue({
      allowed: true,
      matchedPolicyIds: ['00000000-0000-4000-8000-000000000999'],
      reasonCode: 'POLICY_ALLOW_MATCHED',
      scope: {
        field: 'categoryId',
        op: 'IN',
        value: ['raw-material', 'packaging'],
      },
    });
  });

  it('runs the default PolicyInstance query-scope preview from the page', async () => {
    const view = await import('./policy-instance-preview.vue');
    const wrapper = mount(view.default, {
      attachTo: document.body,
    });

    await wrapper.get('[data-testid="run-policy-instance-preview"]').trigger('click');
    await flushPromises();

    expect(evaluatePolicyInstancePreviewApi).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: 'QUERY_SCOPE',
        permissionCode: 'procurement.purchase_request.create',
        subject: {
          accountId: '00000000-0000-4000-8000-000000000901',
          tenantId: '00000000-0000-4000-8000-000000000001',
          roleIds: [],
        },
        policyInstances: [
          expect.objectContaining({
            templateCode: 'resource-field-in-set',
            params: {
              allowedValues: ['00000000-0000-4000-8000-000000000996'],
              field: 'categoryId',
            },
          }),
        ],
      }),
    );
    expect(wrapper.text()).toContain('POLICY_ALLOW_MATCHED');
    expect(wrapper.text()).toContain('categoryId');
  });
});
