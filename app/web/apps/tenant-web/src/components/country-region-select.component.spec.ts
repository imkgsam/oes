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

    expect(options.slice(0, 5).map((option) => option.value)).toEqual([
      'AD',
      'AE',
      'AF',
      'AG',
      'AI',
    ]);
    expect(options).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: 'CN - 中国', value: 'CN' }),
        expect.objectContaining({ label: 'US - 美国', value: 'US' }),
        expect.objectContaining({ label: 'AQ - 南极洲', value: 'AQ' }),
        expect.objectContaining({ label: 'GB / UK - 英国', value: 'GB' }),
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
        expect.objectContaining({ label: 'CN - China', value: 'CN' }),
        expect.objectContaining({ label: 'US - United States', value: 'US' }),
        expect.objectContaining({ label: 'GB / UK - United Kingdom', value: 'GB' }),
      ]),
    );
  });

  it('matches United Kingdom by the common UK alias', () => {
    const wrapper = mount(CountryRegionSelect);
    const select = wrapper.findComponent(Select);
    const filterOption = select.props('filterOption') as (
      input: string,
      option?: { label: string; searchText: string; value: string },
    ) => boolean;
    const options = select.props('options') as Array<{
      label: string;
      searchText: string;
      value: string;
    }>;
    const unitedKingdom = options.find((option) => option.value === 'GB');

    expect(unitedKingdom).toBeDefined();
    expect(filterOption('UK', unitedKingdom)).toBe(true);
  });
});
