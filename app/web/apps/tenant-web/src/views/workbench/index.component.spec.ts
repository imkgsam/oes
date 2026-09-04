/* @vitest-environment happy-dom */

import { mount } from '@vue/test-utils';

import { describe, expect, it, vi } from 'vitest';

import workbenchHomeSource from './index.vue?raw';

vi.mock('./components/collaboration-task/task-workbench-section.vue', () => ({
  default: {
    name: 'TaskWorkbenchSection',
    template: '<section data-testid="task-workbench-section" />',
  },
}));

// Verifies the workbench is task-first instead of retaining placeholder dashboard blocks.
describe('tenant workbench home layout', () => {
  it('renders the collaboration task block as the primary workbench content', async () => {
    const view = await import('./index.vue');

    const wrapper = mount(view.default);

    expect(wrapper.classes()).toContain('tenant-workbench-home');
    expect(wrapper.find('[data-testid="task-workbench-section"]').exists()).toBe(true);
    expect(wrapper.text()).not.toContain('OES Tenant Workbench');
    expect(wrapper.text()).not.toContain('本阶段说明');
    expect(wrapper.text()).not.toContain('租户治理');
    expect(wrapper.text()).not.toContain('业务域导航');
  });

  it('stretches the desktop workbench across the available content width', () => {
    expect(workbenchHomeSource).toContain('box-sizing: border-box;');
    expect(workbenchHomeSource).toContain('width: 100%;');
    expect(workbenchHomeSource).not.toContain('max-width: 1320px;');
  });
});
