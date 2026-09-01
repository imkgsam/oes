/* @vitest-environment happy-dom */

import { mount } from '@vue/test-utils';
import { defineComponent } from 'vue';
import { describe, expect, it, vi } from 'vitest';

vi.mock('ant-design-vue', () => ({
  Input: defineComponent({
    name: 'AntInput',
    inheritAttrs: false,
    props: ['placeholder', 'value'],
    emits: ['input'],
    template:
      '<input v-bind="$attrs" :placeholder="placeholder" :value="value" @input="$emit(\'input\', $event)" />',
  }),
  Select: defineComponent({
    name: 'AntSelect',
    inheritAttrs: false,
    props: ['value'],
    template: '<select v-bind="$attrs" :value="value" />',
  }),
}));

describe('PhoneNumberInput accessibility', () => {
  it('binds the visible validation alert to the focusable local-number input', async () => {
    const phoneNumberInput = await import('./phone-number-input.vue');
    const harness = defineComponent({
      components: { PhoneNumberInput: phoneNumberInput.default },
      template: `
        <div>
          <PhoneNumberInput
            id="phone-field"
            aria-describedby="phone-error"
            aria-invalid="true"
            class="form-valid-error"
            placeholder="请输入手机号"
          />
          <p id="phone-error" role="alert">请输入手机号</p>
        </div>
      `,
    });
    const wrapper = mount(harness);
    const group = wrapper.get('.phone-number-input');
    const countrySelect = wrapper.get('.phone-country-select');
    const input = wrapper.get('.phone-local-input');
    const alert = wrapper.get('#phone-error');
    const countryLabel = wrapper.get(
      `label[for="${countrySelect.attributes('id')}"]`,
    );

    expect(group.attributes('role')).toBe('group');
    expect(group.attributes('aria-label')).toBe('请输入手机号');
    expect(group.classes()).toContain('form-valid-error');
    expect(countryLabel.text()).toBe('国家或地区：China (+86)');
    expect(input.attributes('id')).toBe('phone-field');
    expect(input.attributes('aria-invalid')).toBe('true');
    expect(input.attributes('aria-describedby')).toBe(alert.attributes('id'));
    expect(alert.attributes('role')).toBe('alert');
    expect(alert.isVisible()).toBe(true);
  });
});
