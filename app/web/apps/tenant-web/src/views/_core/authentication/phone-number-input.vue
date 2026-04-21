<script setup lang="ts">
import { computed, ref, watch } from 'vue';

import { Input, Select } from 'ant-design-vue';

import {
  buildPhoneNumber,
  DEFAULT_COUNTRY_CODE,
  getPhoneCountryOption,
  normalizeLocalPhoneNumber,
  PHONE_COUNTRY_OPTIONS,
  resolveDialCode,
} from './phone-country';

interface Props {
  placeholder?: string;
}

defineOptions({ name: 'PhoneNumberInput' });

const props = withDefaults(defineProps<Props>(), {
  placeholder: '请输入手机号',
});

const modelValue = defineModel<string>();

const countryCode = ref(DEFAULT_COUNTRY_CODE);
const localPhoneNumber = ref('');

const countrySelectOptions = computed(() =>
  PHONE_COUNTRY_OPTIONS.map((item) => ({
    label: resolveDialCode(item.value),
    title: item.label,
    value: item.value,
  })),
);

// Updates the selected country while preserving the already-entered local phone number.
function handleCountryChange(value: unknown) {
  countryCode.value = `${value || DEFAULT_COUNTRY_CODE}`;
}

// Updates the local phone segment with digits only so the combined model remains API-ready.
function handleLocalPhoneInput(event: Event) {
  const input = event.target as HTMLInputElement;
  localPhoneNumber.value = normalizeLocalPhoneNumber(input.value);
}

// Keeps the compact phone input state aligned with any external model updates.
function syncFromModelValue(value?: string) {
  const normalized = `${value ?? ''}`.trim();
  if (!normalized) {
    countryCode.value = DEFAULT_COUNTRY_CODE;
    localPhoneNumber.value = '';
    return;
  }

  const matchedOption = PHONE_COUNTRY_OPTIONS
    .toSorted((left, right) => resolveDialCode(right.value).length - resolveDialCode(left.value).length)
    .find((option) => normalized.startsWith(resolveDialCode(option.value)));

  const nextCountryCode = matchedOption?.value ?? DEFAULT_COUNTRY_CODE;
  countryCode.value = nextCountryCode;
  localPhoneNumber.value = normalized.replaceAll(resolveDialCode(nextCountryCode), '');
}

watch(
  () => modelValue.value,
  (value) => {
    syncFromModelValue(value);
  },
  { immediate: true },
);

watch(
  [countryCode, localPhoneNumber],
  () => {
    const normalizedLocalPhoneNumber = `${localPhoneNumber.value ?? ''}`.replaceAll(/\D/g, '');
    modelValue.value = normalizedLocalPhoneNumber
      ? buildPhoneNumber(countryCode.value, normalizedLocalPhoneNumber)
      : '';
  },
);

const selectedCountryLabel = computed(() => {
  return getPhoneCountryOption(countryCode.value)?.label ?? 'China (+86)';
});
</script>

<template>
  <div class="phone-number-input flex w-full items-center rounded-md border border-border bg-background transition-colors focus-within:border-primary">
    <Select
      :value="countryCode"
      :aria-label="selectedCountryLabel"
      :options="countrySelectOptions"
      class="phone-country-select shrink-0"
      option-label-prop="label"
      popup-class-name="phone-country-select-popper"
      @change="handleCountryChange"
    />

    <Input
      :value="localPhoneNumber"
      :aria-label="selectedCountryLabel"
      :placeholder="props.placeholder"
      class="phone-local-input"
      inputmode="tel"
      @input="handleLocalPhoneInput"
    />
  </div>
</template>

<style scoped>
.phone-number-input {
  --phone-input-bg: hsl(var(--input-background));
  --phone-input-border: hsl(var(--border));
  --phone-input-text: hsl(var(--foreground));
  --phone-input-muted: hsl(var(--muted-foreground));
  --phone-input-popover: hsl(var(--popover));
  --phone-input-accent: hsl(var(--muted) / 0.82);
  --phone-input-height: 32px;
}

:deep(.phone-country-select) {
  width: 84px;
}

:deep(.phone-country-select .ant-select-selector) {
  border: 0;
  border-right: 1px solid var(--phone-input-border);
  border-radius: 0;
  box-shadow: none;
  background: var(--phone-input-bg) !important;
  min-height: var(--phone-input-height);
  padding-inline: 10px 6px;
}

:deep(.phone-country-select .ant-select-selection-item) {
  color: var(--phone-input-text);
  line-height: calc(var(--phone-input-height) - 2px);
}

:deep(.phone-country-select .ant-select-arrow) {
  color: var(--phone-input-muted);
}

:deep(.phone-local-input.ant-input) {
  border: 0;
  box-shadow: none;
  background: transparent;
  color: var(--phone-input-text);
  min-height: var(--phone-input-height);
  padding-inline: 10px;
}

:deep(.phone-local-input.ant-input::placeholder) {
  color: var(--phone-input-muted);
}

:deep(.phone-country-select-popper .ant-select-dropdown) {
  background: var(--phone-input-popover);
  border: 1px solid var(--phone-input-border);
}

:deep(.phone-country-select-popper .ant-select-item) {
  color: var(--phone-input-text);
}

:deep(.phone-country-select-popper .ant-select-item-option-selected:not(.ant-select-item-option-disabled)),
:deep(.phone-country-select-popper .ant-select-item-option-active:not(.ant-select-item-option-disabled)) {
  background: var(--phone-input-accent);
}
</style>
