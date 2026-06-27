export interface CountryRegionOption {
  label: string
  value: string
}

const REGION_CODES = [
  'AE',
  'AR',
  'AT',
  'AU',
  'BE',
  'BR',
  'CA',
  'CH',
  'CL',
  'CN',
  'CO',
  'CZ',
  'DE',
  'DK',
  'EG',
  'ES',
  'FI',
  'FR',
  'GB',
  'GR',
  'HK',
  'ID',
  'IE',
  'IL',
  'IN',
  'IT',
  'JP',
  'KR',
  'MX',
  'MY',
  'NL',
  'NO',
  'NZ',
  'PH',
  'PL',
  'PT',
  'RO',
  'SA',
  'SE',
  'SG',
  'TH',
  'TR',
  'TW',
  'US',
  'VN',
  'ZA'
] as const

const REGION_ALIASES: Record<string, string[]> = {
  GB: ['UK']
}

// buildCountryRegionOptions creates compact ISO region selector options for the extension side panel.
export function buildCountryRegionOptions(locale = 'en-US'): CountryRegionOption[] {
  return REGION_CODES.map((regionCode) => ({
    label: `${formatRegionCodeLabel(regionCode)} - ${resolveRegionName(regionCode, locale)}`,
    value: regionCode
  }))
}

// buildCountryRegionOptionsWithSelected preserves existing stored region values even if they are outside the compact option set.
export function buildCountryRegionOptionsWithSelected(selectedValue: string, locale = 'en-US'): CountryRegionOption[] {
  const options = buildCountryRegionOptions(locale)
  const normalizedValue = selectedValue.trim().toUpperCase()
  if (!normalizedValue || options.some((option) => option.value === normalizedValue)) {
    return options
  }

  return [
    {
      label: `${normalizedValue} - 自定义国家/地区`,
      value: normalizedValue
    },
    ...options
  ]
}

// normalizeRegionCode uppercases and trims selector values before storing them in CRM draft fields.
export function normalizeRegionCode(value: string): string {
  return value.trim().toUpperCase()
}

// resolveRegionName uses the browser Intl catalog and falls back to the ISO code when unavailable.
function resolveRegionName(regionCode: string, locale: string): string {
  try {
    const displayName = new Intl.DisplayNames([locale], { type: 'region' }).of(regionCode)
    if (displayName) {
      return displayName
    }
  } catch {
    // Older extension runtimes may not support Intl.DisplayNames for every locale.
  }

  return regionCode
}

function formatRegionCodeLabel(regionCode: string): string {
  const aliases = REGION_ALIASES[regionCode] ?? []
  return aliases.length ? `${regionCode} / ${aliases.join(' / ')}` : regionCode
}
