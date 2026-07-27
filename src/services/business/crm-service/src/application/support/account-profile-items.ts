import { randomUUID } from 'node:crypto'
import { InternetDomain } from '@oes/common'
import {
  CrmAccountProfileItemDraft,
  CrmAccountProfileItemRecord,
  CrmAccountProfileItemStatus,
  CrmAccountProfileItemType
} from '../../domain/models/crm-records'

export interface BuildCrmAccountProfileItemsInput {
  tenantId: string
  crmAccountId: string
  sourceRecordId?: string | null
  profileItems?: CrmAccountProfileItemDraft[]
}

/** buildCrmAccountProfileItems converts CRM account-level evidence into persisted profile item records. */
export function buildCrmAccountProfileItems(
  input: BuildCrmAccountProfileItemsInput
): CrmAccountProfileItemRecord[] {
  const drafts = input.profileItems ?? []
  const seen = new Set<string>()
  const records: CrmAccountProfileItemRecord[] = []

  for (const draft of drafts) {
    const itemType = normalizeItemType(draft.itemType)
    const normalizedValue = normalizeProfileItemValue(itemType, draft.normalizedValue)
    if (!itemType || !normalizedValue) {
      continue
    }
    const dedupeKey = `${itemType}:${normalizedValue.toLowerCase()}`
    if (seen.has(dedupeKey)) {
      continue
    }
    seen.add(dedupeKey)
    records.push({
      id: randomUUID(),
      tenantId: input.tenantId,
      crmAccountId: input.crmAccountId,
      itemType,
      normalizedValue,
      rawValue: normalizeRawValue(draft.rawValue) ?? normalizedValue,
      label: normalizeOptionalString(draft.label),
      role: normalizeOptionalString(draft.role),
      status: CrmAccountProfileItemStatus.ACTIVE,
      sourceRecordId: normalizeOptionalString(draft.sourceRecordId) ?? input.sourceRecordId ?? null
    })
  }

  return records
}

/** normalizeItemType keeps unsupported future values out of persisted CRM profile items. */
function normalizeItemType(value?: string | null): CrmAccountProfileItemType | '' {
  const normalized = value?.trim().toUpperCase()
  return Object.values(CrmAccountProfileItemType).includes(normalized as CrmAccountProfileItemType)
    ? (normalized as CrmAccountProfileItemType)
    : ''
}

/** normalizeProfileItemValue canonicalizes matchable values without proving possession. */
function normalizeProfileItemValue(
  itemType: CrmAccountProfileItemType | string,
  value?: string | null
): string {
  const trimmed = value?.trim()
  if (!trimmed) {
    return ''
  }
  if (itemType === CrmAccountProfileItemType.DOMAIN) {
    const domain = InternetDomain.parse(trimmed)
    return domain.isValid ? domain.canonicalHost : trimmed.toLowerCase()
  }
  if (itemType === CrmAccountProfileItemType.EMAIL) {
    return trimmed.toLowerCase()
  }
  return trimmed
}

/** normalizeRawValue preserves display/source text while dropping blank strings. */
function normalizeRawValue(value?: string | null): string | null {
  return normalizeOptionalString(value)
}

/** normalizeOptionalString returns null for blank optional string fields. */
function normalizeOptionalString(value?: string | null): string | null {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}
