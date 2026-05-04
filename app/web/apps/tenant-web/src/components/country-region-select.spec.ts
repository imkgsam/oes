/* @vitest-environment happy-dom */

import { mount } from '@vue/test-utils';
import { Select } from 'ant-design-vue';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import CountryRegionSelect from './country-region-select.vue';

const preferencesMock = vi.hoisted(() => ({
  app: {
    locale: 'zh-CN',
  },
}));

vi.mock('@vben/preferences', () => ({
  preferences: preferencesMock,
}));

// Verifies the shared country/region selector exposes ISO region codes and a reusable v-model contract.
describe('CountryRegionSelect', () => {
  beforeEach(() => {
    preferencesMock.app.locale = 'zh-CN';
  });

  it('renders ISO region options and emits selected region codes', async () => {
    const wrapper = mount(CountryRegionSelect, {
      props: {
        value: 'CN',
      },
    });

    const select = wrapper.findComponent(Select);
    const options = select.props('options') as Array<{ label: string; value: string }>;

    expect(options).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: '中国 (CN)', value: 'CN' }),
        expect.objectContaining({ label: '美国 (US)', value: 'US' }),
        expect.objectContaining({ label: '南极洲 (AQ)', value: 'AQ' }),
      ]),
    );

    select.vm.$emit('change', 'US');
    await wrapper.vm.$nextTick();

    expect(wrapper.emitted('update:value')).toEqual([['US']]);
  });

  it('uses the current global locale when rendering region labels', () => {
    preferencesMock.app.locale = 'en-US';

    const wrapper = mount(CountryRegionSelect, {
      props: {
        value: 'US',
      },
    });

    const options = wrapper.findComponent(Select).props('options') as Array<{
      label: string;
      value: string;
    }>;

    expect(options).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: 'China (CN)', value: 'CN' }),
        expect.objectContaining({ label: 'United States (US)', value: 'US' }),
      ]),
    );
  });
});
