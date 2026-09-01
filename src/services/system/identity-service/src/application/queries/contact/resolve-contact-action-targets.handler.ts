import { Inject } from '@nestjs/common'
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { SYMBOLS } from '../../../common/constants'
import { AccountContactAssetEntity } from '../../../domain/entities/account-contact-asset.entity'
import { AccountContactAssetRepository } from '../../../domain/repositories/account-contact-asset.repository'
import {
  ContactAssetPublicValueSummaryView,
  ResolveContactActionTargetsView,
  ResolvedContactActionTargetView
} from './contact-query.result'
import {
  ContactActionTargetRefQueryInput,
  ResolveContactActionTargetsQuery
} from './resolve-contact-action-targets.query'

const CONTACT_ASSET_REF_TYPE = 'CONTACT_ASSET'
const ACTIVE_STATUS = 'ACTIVE'

const ACTION_COMPATIBLE_TYPES: Record<string, string[]> = {
  CALL_PHONE: ['WORK_PHONE'],
  SEND_EMAIL: ['WORK_EMAIL'],
  ADD_WECHAT: ['WECHAT', 'EXTERNAL_COMMUNICATION_ACCOUNT'],
  OPEN_WHATSAPP: ['WHATSAPP', 'WORK_PHONE']
}

// ResolveContactActionTargetsHandler returns public-safe contact values for BusinessCard action refs.
@QueryHandler(ResolveContactActionTargetsQuery)
export class ResolveContactActionTargetsHandler implements IQueryHandler<
  ResolveContactActionTargetsQuery,
  ResolveContactActionTargetsView
> {
  constructor(
    @Inject(SYMBOLS.REPO.ACCOUNT_CONTACT_ASSET)
    private readonly accountContactAssetRepository: AccountContactAssetRepository
  ) {}

  async execute(query: ResolveContactActionTargetsQuery): Promise<ResolveContactActionTargetsView> {
    return resolveContactActionTargets(this.accountContactAssetRepository, query)
  }
}

/** Resolves public-safe action targets after the caller has established the owning account. */
export async function resolveContactActionTargets(
  accountContactAssetRepository: AccountContactAssetRepository,
  query: Pick<
    ResolveContactActionTargetsQuery,
    'tenantId' | 'accountId' | 'employeeId' | 'targetRefs'
  >
): Promise<ResolveContactActionTargetsView> {
  const ids = uniqueTargetIds(query.targetRefs)
  const assets = await accountContactAssetRepository.listByIds(ids)
  const assetsById = new Map(assets.map((asset) => [asset.id, asset]))

  return {
    targets: query.targetRefs.map((ref) => {
      const base = createBaseTarget(ref)
      if (ref.targetRefType !== CONTACT_ASSET_REF_TYPE) {
        return hide(base, 'TARGET_REF_TYPE_UNSUPPORTED')
      }
      if (!ref.targetRefId?.trim()) {
        return hide(base, 'TARGET_REF_EMPTY')
      }

      const asset = assetsById.get(ref.targetRefId)
      if (!asset) {
        return hide(base, 'CONTACT_ASSET_NOT_FOUND')
      }
      if (asset.tenantId !== query.tenantId || asset.accountId !== query.accountId) {
        return hide(base, 'CONTACT_ASSET_SCOPE_MISMATCH')
      }
      if (query.employeeId?.trim() && asset.employeeId && asset.employeeId !== query.employeeId) {
        return hide(base, 'CONTACT_ASSET_SCOPE_MISMATCH')
      }
      if (asset.status !== ACTIVE_STATUS) {
        return hide(base, 'CONTACT_ASSET_NOT_ACTIVE')
      }
      if (!isActionCompatible(ref.contactActionType, asset.type)) {
        return hide(base, 'CONTACT_ACTION_TYPE_MISMATCH')
      }

      const publicValueSummary = toPublicValueSummary(ref.contactActionType, asset)
      if (!publicValueSummary) {
        return hide(base, 'PUBLIC_VALUE_UNAVAILABLE')
      }

      return {
        ...base,
        renderable: true,
        hiddenReason: null,
        publicValueSummary
      }
    })
  }
}

// uniqueTargetIds extracts stable Contact Asset ids from action target refs.
function uniqueTargetIds(refs: ContactActionTargetRefQueryInput[]): string[] {
  return Array.from(
    new Set(
      refs
        .filter((ref) => ref.targetRefType === CONTACT_ASSET_REF_TYPE)
        .map((ref) => ref.targetRefId?.trim())
        .filter((value): value is string => Boolean(value))
    )
  )
}

// createBaseTarget carries through BusinessCard target identity without adding contact values.
function createBaseTarget(ref: ContactActionTargetRefQueryInput): ResolvedContactActionTargetView {
  return {
    contactActionType: ref.contactActionType,
    targetRefType: ref.targetRefType,
    targetRefId: ref.targetRefId?.trim() || null,
    renderable: false,
    hiddenReason: null,
    publicValueSummary: null
  }
}

// hide marks an action target unavailable while preserving the target ref for admin diagnostics.
function hide(
  target: ResolvedContactActionTargetView,
  hiddenReason: string
): ResolvedContactActionTargetView {
  return {
    ...target,
    renderable: false,
    hiddenReason,
    publicValueSummary: null
  }
}

// isActionCompatible enforces the Phase 1 BusinessCard action to Contact Asset type matrix.
function isActionCompatible(contactActionType: string, assetType: string): boolean {
  return ACTION_COMPATIBLE_TYPES[contactActionType]?.includes(assetType) ?? false
}

// toPublicValueSummary converts a renderable Contact Asset into the public-safe query shape.
function toPublicValueSummary(
  contactActionType: string,
  asset: AccountContactAssetEntity
): ContactAssetPublicValueSummaryView | null {
  const displayValue = asset.value.trim()
  if (!displayValue) return null

  const label = asset.displayName?.trim() || defaultLabel(asset.type)
  const provider = asset.provider?.trim() || null

  if (contactActionType === 'CALL_PHONE') {
    const actionValue = normalizePhone(displayValue)
    if (!actionValue) return null
    return {
      type: asset.type,
      provider,
      label,
      displayValue,
      actionValue,
      actionUri: `tel:${actionValue}`,
      includeInVCardAllowed: asset.usage.includes('VCARD_CANDIDATE')
    }
  }

  if (contactActionType === 'SEND_EMAIL') {
    return {
      type: asset.type,
      provider,
      label,
      displayValue,
      actionValue: displayValue,
      actionUri: `mailto:${displayValue}`,
      includeInVCardAllowed: asset.usage.includes('VCARD_CANDIDATE')
    }
  }

  if (contactActionType === 'ADD_WECHAT') {
    return {
      type: asset.type,
      provider,
      label,
      displayValue,
      actionValue: displayValue,
      actionUri: `weixin://contacts/profile/${encodeURIComponent(displayValue)}`,
      includeInVCardAllowed: false
    }
  }

  if (contactActionType === 'OPEN_WHATSAPP') {
    const actionValue = normalizePhone(displayValue)
    if (!actionValue) return null
    return {
      type: asset.type,
      provider,
      label,
      displayValue,
      actionValue,
      actionUri: `https://wa.me/${actionValue.replace(/^\+/, '')}`,
      includeInVCardAllowed: false
    }
  }

  return null
}

// defaultLabel provides stable public labels when an asset has no display name.
function defaultLabel(assetType: string): string {
  if (assetType === 'WORK_PHONE') return 'Phone'
  if (assetType === 'WORK_EMAIL') return 'Email'
  if (assetType === 'WECHAT') return 'WeChat'
  if (assetType === 'WHATSAPP') return 'WhatsApp'
  return 'Contact'
}

// normalizePhone strips presentation punctuation while preserving an international plus prefix.
function normalizePhone(value: string): string {
  const trimmed = value.trim()
  const prefix = trimmed.startsWith('+') ? '+' : ''
  const digits = trimmed.replace(/[^\d]/g, '')
  return digits ? `${prefix}${digits}` : ''
}
