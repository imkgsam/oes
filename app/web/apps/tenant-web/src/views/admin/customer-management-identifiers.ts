type IdentifierSubjectType = 'ORGANIZATION' | 'PERSON' | 'UNKNOWN' | undefined

export interface IdentifierTypeOption {
  label: string
  value: string
}

const organizationIdentifierOptionsByCountry: Record<string, IdentifierTypeOption[]> = {
  CN: [
    { label: '统一社会信用代码', value: 'UNIFIED_SOCIAL_CREDIT_CODE' },
    { label: '营业执照号', value: 'BUSINESS_LICENSE_NO' },
    { label: '纳税人识别号', value: 'TAXPAYER_ID' }
  ],
  DE: [
    { label: 'VAT No', value: 'VAT_NO' },
    { label: 'Commercial Register No', value: 'BUSINESS_REGISTRATION_NO' },
    { label: 'EORI', value: 'EORI' }
  ],
  ES: [
    { label: 'VAT No', value: 'VAT_NO' },
    { label: 'Company Registration No', value: 'BUSINESS_REGISTRATION_NO' },
    { label: 'EORI', value: 'EORI' }
  ],
  EU: [
    { label: 'VAT No', value: 'VAT_NO' },
    { label: 'EORI', value: 'EORI' }
  ],
  FR: [
    { label: 'SIREN', value: 'BUSINESS_REGISTRATION_NO' },
    { label: 'VAT No', value: 'VAT_NO' },
    { label: 'EORI', value: 'EORI' }
  ],
  GB: [
    { label: 'Company No', value: 'BUSINESS_REGISTRATION_NO' },
    { label: 'VAT No', value: 'VAT_NO' },
    { label: 'EORI', value: 'EORI' }
  ],
  JP: [
    { label: 'Corporate Number', value: 'BUSINESS_REGISTRATION_NO' },
    { label: 'Consumption Tax ID', value: 'TAX_ID' }
  ],
  SG: [
    { label: 'UEN', value: 'BUSINESS_REGISTRATION_NO' },
    { label: 'GST Registration No', value: 'TAX_ID' }
  ],
  US: [
    { label: 'EIN', value: 'TAX_ID' },
    { label: 'State Registration No', value: 'BUSINESS_REGISTRATION_NO' },
    { label: 'D-U-N-S', value: 'DUNS' }
  ]
}

const personIdentifierOptionsByCountry: Record<string, IdentifierTypeOption[]> = {
  CN: [
    { label: '居民身份证号', value: 'NATIONAL_ID' },
    { label: '护照号', value: 'PASSPORT_NO' }
  ],
  US: [
    { label: 'Taxpayer ID', value: 'TAX_ID' },
    { label: 'Passport No', value: 'PASSPORT_NO' }
  ]
}

const fallbackOrganizationIdentifierOptions = [
  { label: 'Business Registration No', value: 'BUSINESS_REGISTRATION_NO' },
  { label: 'Tax ID', value: 'TAX_ID' }
]

const fallbackPersonIdentifierOptions = [
  { label: 'National ID', value: 'NATIONAL_ID' },
  { label: 'Passport No', value: 'PASSPORT_NO' },
  { label: 'Tax ID', value: 'TAX_ID' }
]

/** identifierTypeOptionsForCountry returns official identity options for a subject kind and issuer country. */
export function identifierTypeOptionsForCountry(countryCode: string, subjectType: IdentifierSubjectType) {
  const country = countryCode.trim().toUpperCase()
  if (!country) {
    return []
  }
  if (subjectType === 'PERSON') {
    return personIdentifierOptionsByCountry[country] ?? fallbackPersonIdentifierOptions
  }
  return organizationIdentifierOptionsByCountry[country] ?? fallbackOrganizationIdentifierOptions
}

/** identifierTypeLabel renders official identity enum values with the best available country-specific label. */
export function identifierTypeLabel(
  value: string | undefined,
  countryCode = '',
  subjectType: IdentifierSubjectType = 'ORGANIZATION'
) {
  if (!value) {
    return ''
  }
  const scopedLabel = identifierTypeOptionsForCountry(countryCode, subjectType).find(
    (option) => option.value === value
  )?.label
  if (scopedLabel) {
    return scopedLabel
  }
  const allOptions = [
    ...Object.values(organizationIdentifierOptionsByCountry).flat(),
    ...Object.values(personIdentifierOptionsByCountry).flat(),
    ...fallbackOrganizationIdentifierOptions,
    ...fallbackPersonIdentifierOptions
  ]
  return allOptions.find((option) => option.value === value)?.label ?? value
}
