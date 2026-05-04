<script setup lang="ts">
import { computed } from 'vue';

import { preferences } from '@vben/preferences';

import { Select } from 'ant-design-vue';

import { PHONE_COUNTRY_OPTIONS } from '#/views/_core/authentication/phone-country';

interface CountryRegionOption {
  label: string;
  value: string;
}

const props = withDefaults(
  defineProps<{
    disabled?: boolean;
    placeholder?: string;
    value?: string;
  }>(),
  {
    disabled: false,
    placeholder: '选择国家/地区',
    value: undefined,
  },
);

const emit = defineEmits<{
  'update:value': [value: string | undefined];
}>();

defineOptions({
  name: 'CountryRegionSelect',
});

const supplementalRegionCodes = ['AQ', 'BV', 'TF', 'HM', 'PN', 'GS', 'UM'];

const regionOptions = computed<CountryRegionOption[]>(() => {
  const locale = preferences.app.locale || 'en-US';
  const regionCodes = new Set<string>();

  for (const option of PHONE_COUNTRY_OPTIONS) {
    const [regionCode] = option.value.split(':');
    if (regionCode) {
      regionCodes.add(regionCode);
    }
  }

  for (const regionCode of supplementalRegionCodes) {
    regionCodes.add(regionCode);
  }

  return [...regionCodes].map((regionCode) => ({
    label: formatRegionLabel(regionCode, locale),
    value: regionCode,
  })).sort((left, right) =>
    left.label.localeCompare(right.label, locale),
  );
});

/** formatRegionLabel renders one ISO region code in the active app locale. */
function formatRegionLabel(regionCode: string, locale: string) {
  const localizedName = resolveLocalizedRegionName(regionCode, locale);
  return `${localizedName} (${regionCode})`;
}

/** resolveLocalizedRegionName uses the platform Intl catalog, falling back to existing phone labels. */
function resolveLocalizedRegionName(regionCode: string, locale: string) {
  try {
    const displayName = new Intl.DisplayNames([locale], { type: 'region' }).of(regionCode);
    if (displayName) {
      return displayName;
    }
  } catch {
    // Ignore unsupported locale/runtime combinations and fall back below.
  }

  const fallback = PHONE_COUNTRY_OPTIONS.find((option) =>
    option.value.startsWith(`${regionCode}:`),
  );
  return fallback?.label.replace(/\s+\(\+\d.*\)$/, '') || regionCode;
}

/** handleChange normalizes Ant Design select events into the component's v-model contract. */
function handleChange(value: unknown) {
  emit('update:value', typeof value === 'string' ? value : undefined);
}
</script>

<template>
  <Select
    :disabled="props.disabled"
    :options="regionOptions"
    :placeholder="props.placeholder"
    :value="props.value || undefined"
    allow-clear
    option-filter-prop="label"
    show-search
    @change="handleChange"
  />
</template>
