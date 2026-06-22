<script setup lang="ts">
import { computed } from 'vue';

import { preferences } from '@vben/preferences';

import { Select } from 'ant-design-vue';

import { PHONE_COUNTRY_OPTIONS } from '#/views/_core/authentication/phone-country';

interface CountryRegionOption {
  label: string;
  searchText: string;
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
const commonRegionAliases: Record<string, string[]> = {
  GB: ['UK'],
};

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

  return [...regionCodes]
    .sort((left, right) => left.localeCompare(right, 'en-US'))
    .map((regionCode) => {
      const localizedName = resolveLocalizedRegionName(regionCode, locale);
      const aliases = commonRegionAliases[regionCode] ?? [];
      const codeLabel = aliases.length > 0 ? `${regionCode} / ${aliases.join(' / ')}` : regionCode;

      return {
        label: `${codeLabel} - ${localizedName}`,
        searchText: [regionCode, ...aliases, localizedName].join(' '),
        value: regionCode,
      };
    });
});

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

/** filterRegionOption matches ISO codes, common aliases, and localized region names. */
function filterRegionOption(input: string, option?: Record<string, unknown>) {
  const normalizedInput = input.trim().toLowerCase();
  if (!normalizedInput) {
    return true;
  }

  return `${option?.label ?? ''} ${option?.searchText ?? ''}`
    .toLowerCase()
    .includes(normalizedInput);
}
</script>

<template>
  <Select
    :disabled="props.disabled"
    :options="regionOptions"
    :placeholder="props.placeholder"
    :value="props.value || undefined"
    allow-clear
    :filter-option="filterRegionOption"
    show-search
    @change="handleChange"
  />
</template>
