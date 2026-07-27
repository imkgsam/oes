import { Injectable } from '@nestjs/common'
import { InternetDomain } from '@oes/common'
import {
  CrmActivity as PrismaCrmActivityRow,
  CrmAccount as PrismaCrmAccountRow,
  CrmContact as PrismaCrmContactRow,
  CrmSourceRecord as PrismaCrmSourceRecordRow,
  Opportunity as PrismaOpportunityRow,
  Prisma
} from '../../../../prisma/generated/prisma'
import {
  CrmActivityRecord,
  CrmActivityCreatedByType,
  CrmActivityDirection,
  CrmActivityType,
  CrmActivityVisibility,
  CrmAccountProfileItemRecord,
  CrmAccountProfileItemStatus,
  CrmAccountRecord,
  CrmAccountLifecycleStage,
  CrmAccountRecordStatus,
  CrmAccountTypeHint,
  CrmArchiveReason,
  CrmContactRecord,
  CrmOpportunityStage,
  CrmOpportunityStatus,
  CrmOpportunityRecord,
  CrmPriority,
  CrmSourceRecord,
  CrmSourceType,
  CrmLeadIdentifierRecord
} from '../../../domain/models/crm-records'
import {
  CrmAccountDuplicateCandidate,
  CrmAccountRepository,
  CrmDuplicateSearchInput,
  ListCrmAccountsInput,
  ListCrmAccountsResult
} from '../../../domain/repositories/crm-account.repository'
import { PrismaService } from '../../prisma/prisma.service'

/** PrismaCrmAccountRepository persists the CRM P1 account shell and source history in PostgreSQL. */
@Injectable()
export class PrismaCrmAccountRepository implements CrmAccountRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** saveAccount upserts one tenant-scoped CRM account without crossing tenant boundaries. */
  async saveAccount(account: CrmAccountRecord): Promise<CrmAccountRecord> {
    await this.assertFormalTenantPartyIsAvailable(account)

    const saved = await this.prisma.getExecutionClient().crmAccount.upsert({
      where: {
        id: account.id
      },
      create: {
        id: account.id,
        tenantId: account.tenantId,
        tenantPartyId: account.tenantPartyId ?? null,
        recordStatus: account.recordStatus,
        lifecycleStage: account.lifecycleStage,
        partyTypeHint: account.partyTypeHint,
        displayName: account.displayName,
        leadLegalName: account.leadLegalName ?? null,
        leadCompanyName: account.leadCompanyName ?? null,
        leadPersonName: account.leadPersonName ?? null,
        leadDomain: normalizeLeadDomainForStorage(account.leadDomain),
        leadEmail: account.leadEmail ?? null,
        leadPhone: account.leadPhone ?? null,
        leadWhatsapp: account.leadWhatsapp ?? null,
        leadCountry: account.leadCountry ?? null,
        leadIdentifiers: toJson(account.leadIdentifiers),
        ownerAccountId: account.ownerAccountId ?? null,
        priority: account.priority,
        lastActivityAt: account.lastActivityAt ?? null,
        nextFollowUpAt: account.nextFollowUpAt ?? null,
        createdBy: account.createdBy,
        archivedAt: account.archivedAt ?? null,
        archiveReason: account.archiveReason ?? null
      },
      update: {
        tenantPartyId: account.tenantPartyId ?? null,
        recordStatus: account.recordStatus,
        lifecycleStage: account.lifecycleStage,
        partyTypeHint: account.partyTypeHint,
        displayName: account.displayName,
        leadLegalName: account.leadLegalName ?? null,
        leadCompanyName: account.leadCompanyName ?? null,
        leadPersonName: account.leadPersonName ?? null,
        leadDomain: normalizeLeadDomainForStorage(account.leadDomain),
        leadEmail: account.leadEmail ?? null,
        leadPhone: account.leadPhone ?? null,
        leadWhatsapp: account.leadWhatsapp ?? null,
        leadCountry: account.leadCountry ?? null,
        leadIdentifiers: toJson(account.leadIdentifiers),
        ownerAccountId: account.ownerAccountId ?? null,
        priority: account.priority,
        lastActivityAt: account.lastActivityAt ?? null,
        nextFollowUpAt: account.nextFollowUpAt ?? null,
        archivedAt: account.archivedAt ?? null,
        archiveReason: account.archiveReason ?? null
      }
    })

    return toCrmAccountRecord(saved)
  }

  /** addContact creates one CRM-local contact record without turning it into a TenantParty. */
  async addContact(contact: CrmContactRecord): Promise<CrmContactRecord> {
    const saved = await this.prisma.getExecutionClient().crmContact.create({
      data: {
        id: contact.id,
        tenantId: contact.tenantId,
        crmAccountId: contact.crmAccountId,
        personTenantPartyId: contact.personTenantPartyId ?? null,
        name: contact.name,
        title: contact.title ?? null,
        department: contact.department ?? null,
        email: contact.email ?? null,
        phone: contact.phone ?? null,
        whatsapp: contact.whatsapp ?? null,
        linkedin: contact.linkedin ?? null,
        isPrimary: contact.isPrimary,
        note: contact.note ?? null,
        createdBy: contact.createdBy,
        archivedAt: contact.archivedAt ?? null
      }
    })

    return toCrmContactRecord(saved)
  }

  /** listContacts returns CRM-local contacts for one account inside one tenant. */
  async listContacts(tenantId: string, accountId: string): Promise<CrmContactRecord[]> {
    const records = await this.prisma.getExecutionClient().crmContact.findMany({
      where: {
        tenantId,
        crmAccountId: accountId
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    return records.map(toCrmContactRecord)
  }

  /** addAccountProfileItem creates one account-level CRM profile item without treating it as contact data. */
  async addAccountProfileItem(
    profileItem: CrmAccountProfileItemRecord
  ): Promise<CrmAccountProfileItemRecord> {
    const saved = await (this.prisma.getExecutionClient() as any).crmAccountProfileItem.create({
      data: {
        id: profileItem.id,
        tenantId: profileItem.tenantId,
        crmAccountId: profileItem.crmAccountId,
        itemType: profileItem.itemType,
        normalizedValue: profileItem.normalizedValue,
        rawValue: profileItem.rawValue,
        label: profileItem.label ?? null,
        role: profileItem.role ?? null,
        status: profileItem.status,
        sourceRecordId: profileItem.sourceRecordId ?? null,
        promotedTargetType: profileItem.promotedTargetType ?? null,
        promotedTargetId: profileItem.promotedTargetId ?? null,
        promotedAt: profileItem.promotedAt ?? null
      }
    })

    return toCrmAccountProfileItemRecord(saved)
  }

  /** listAccountProfileItems returns account-level profile items used for duplicate checks and Party promotion. */
  async listAccountProfileItems(
    tenantId: string,
    accountId: string
  ): Promise<CrmAccountProfileItemRecord[]> {
    const records = await (this.prisma.getExecutionClient() as any).crmAccountProfileItem.findMany({
      where: {
        tenantId,
        crmAccountId: accountId,
        status: CrmAccountProfileItemStatus.ACTIVE
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    return records.map(toCrmAccountProfileItemRecord)
  }

  /** replaceAccountProfileItems rewrites draft account-level profile items as one account-owned collection. */
  async replaceAccountProfileItems(
    tenantId: string,
    accountId: string,
    profileItems: CrmAccountProfileItemRecord[]
  ): Promise<CrmAccountProfileItemRecord[]> {
    const client = this.prisma.getExecutionClient() as any
    await client.$transaction(async (tx: any) => {
      await tx.crmAccountProfileItem.deleteMany({
        where: {
          tenantId,
          crmAccountId: accountId
        }
      })
      if (profileItems.length > 0) {
        await tx.crmAccountProfileItem.createMany({
          data: profileItems.map((profileItem) => ({
            id: profileItem.id,
            tenantId: profileItem.tenantId,
            crmAccountId: profileItem.crmAccountId,
            itemType: profileItem.itemType,
            normalizedValue: profileItem.normalizedValue,
            rawValue: profileItem.rawValue,
            label: profileItem.label ?? null,
            role: profileItem.role ?? null,
            status: profileItem.status,
            sourceRecordId: profileItem.sourceRecordId ?? null,
            promotedTargetType: profileItem.promotedTargetType ?? null,
            promotedTargetId: profileItem.promotedTargetId ?? null,
            promotedAt: profileItem.promotedAt ?? null
          }))
        })
      }
    })

    return this.listAccountProfileItems(tenantId, accountId)
  }

  /** addActivity appends one business-visible timeline event to a CRM account. */
  async addActivity(activity: CrmActivityRecord): Promise<CrmActivityRecord> {
    const saved = await this.prisma.getExecutionClient().crmActivity.create({
      data: {
        id: activity.id,
        tenantId: activity.tenantId,
        crmAccountId: activity.crmAccountId,
        opportunityId: activity.opportunityId ?? null,
        contactId: activity.contactId ?? null,
        activityType: activity.activityType,
        direction: activity.direction,
        subject: activity.subject,
        content: activity.content ?? null,
        occurredAt: activity.occurredAt,
        createdByAccountId: activity.createdByAccountId ?? null,
        createdByType: activity.createdByType,
        externalProvider: activity.externalProvider ?? null,
        externalReference: activity.externalReference ?? null,
        metadata: toJson(activity.metadata),
        visibility: activity.visibility
      }
    })

    return toCrmActivityRecord(saved)
  }

  /** listActivities returns the account timeline in occurrence order. */
  async listActivities(tenantId: string, accountId: string): Promise<CrmActivityRecord[]> {
    const records = await this.prisma.getExecutionClient().crmActivity.findMany({
      where: {
        tenantId,
        crmAccountId: accountId
      },
      orderBy: {
        occurredAt: 'asc'
      }
    })

    return records.map(toCrmActivityRecord)
  }

  /** saveOpportunity upserts one opportunity after verifying the account is already formalized. */
  async saveOpportunity(opportunity: CrmOpportunityRecord): Promise<CrmOpportunityRecord> {
    await this.assertOpportunityAccountIsFormal(opportunity.tenantId, opportunity.crmAccountId)

    const saved = await this.prisma.getExecutionClient().opportunity.upsert({
      where: {
        id: opportunity.id
      },
      create: {
        id: opportunity.id,
        tenantId: opportunity.tenantId,
        crmAccountId: opportunity.crmAccountId,
        ownerAccountId: opportunity.ownerAccountId,
        name: opportunity.name,
        stage: opportunity.stage,
        status: opportunity.status,
        estimatedAmount: opportunity.estimatedAmount
          ? new Prisma.Decimal(opportunity.estimatedAmount)
          : null,
        currency: opportunity.currency,
        expectedCloseDate: opportunity.expectedCloseDate ?? null,
        openedAt: opportunity.openedAt,
        closedAt: opportunity.closedAt ?? null,
        closeReason: opportunity.closeReason ?? null,
        closeNote: opportunity.closeNote ?? null,
        createdBy: opportunity.createdBy
      },
      update: {
        ownerAccountId: opportunity.ownerAccountId,
        name: opportunity.name,
        stage: opportunity.stage,
        status: opportunity.status,
        estimatedAmount: opportunity.estimatedAmount
          ? new Prisma.Decimal(opportunity.estimatedAmount)
          : null,
        currency: opportunity.currency,
        expectedCloseDate: opportunity.expectedCloseDate ?? null,
        openedAt: opportunity.openedAt,
        closedAt: opportunity.closedAt ?? null,
        closeReason: opportunity.closeReason ?? null,
        closeNote: opportunity.closeNote ?? null
      }
    })

    return toCrmOpportunityRecord(saved)
  }

  /** listOpportunities returns all opportunities under one account inside the tenant boundary. */
  async listOpportunities(tenantId: string, accountId: string): Promise<CrmOpportunityRecord[]> {
    const records = await this.prisma.getExecutionClient().opportunity.findMany({
      where: {
        tenantId,
        crmAccountId: accountId
      },
      orderBy: {
        openedAt: 'asc'
      }
    })

    return records.map(toCrmOpportunityRecord)
  }

  /** addSourceRecord appends one immutable acquisition source record to a CRM account. */
  async addSourceRecord(source: CrmSourceRecord): Promise<CrmSourceRecord> {
    const saved = await this.prisma.getExecutionClient().crmSourceRecord.create({
      data: {
        id: source.id,
        tenantId: source.tenantId,
        crmAccountId: source.crmAccountId,
        sourceType: source.sourceType,
        sourceName: source.sourceName ?? null,
        capturedAt: source.capturedAt,
        capturedByAccountId: source.capturedByAccountId ?? null,
        externalReference: source.externalReference ?? null,
        rawPayload: source.rawPayload ? toJson(source.rawPayload) : Prisma.JsonNull,
        note: source.note ?? null,
        isPrimary: source.isPrimary
      }
    })

    return toCrmSourceRecord(saved)
  }

  /** findAccountById returns an account only inside the caller's tenant boundary. */
  async findAccountById(tenantId: string, accountId: string): Promise<CrmAccountRecord | null> {
    const record = await this.prisma.getExecutionClient().crmAccount.findFirst({
      where: {
        id: accountId,
        tenantId
      }
    })

    return record ? toCrmAccountRecord(record) : null
  }

  /** findActiveFormalByTenantPartyId returns the formal CRM account currently claiming one TenantParty. */
  async findActiveFormalByTenantPartyId(
    tenantId: string,
    tenantPartyId: string
  ): Promise<CrmAccountRecord | null> {
    const record = await this.prisma.getExecutionClient().crmAccount.findFirst({
      where: {
        tenantId,
        tenantPartyId,
        recordStatus: CrmAccountRecordStatus.ACTIVE,
        lifecycleStage: {
          in: [CrmAccountLifecycleStage.PROSPECT_CUSTOMER, CrmAccountLifecycleStage.CUSTOMER]
        }
      }
    })

    return record ? toCrmAccountRecord(record) : null
  }

  /** listAccounts returns tenant-scoped CRM P1 accounts for list and workspace screens. */
  async listAccounts(input: ListCrmAccountsInput): Promise<ListCrmAccountsResult> {
    const page = Math.max(input.page ?? 1, 1)
    const pageSize = Math.min(Math.max(input.pageSize ?? 20, 1), 100)
    const p1RecordStatus =
      input.recordStatus === CrmAccountRecordStatus.DRAFT ||
      input.recordStatus === CrmAccountRecordStatus.ACTIVE ||
      input.recordStatus === CrmAccountRecordStatus.ARCHIVED
        ? input.recordStatus
        : null
    const recordStatusWhere = input.recordStatus
      ? p1RecordStatus
        ? { recordStatus: p1RecordStatus }
        : { recordStatus: { in: [] } }
      : { recordStatus: { in: [CrmAccountRecordStatus.DRAFT, CrmAccountRecordStatus.ACTIVE] } }
    const where: Prisma.CrmAccountWhereInput = {
      tenantId: input.tenantId,
      ...(input.lifecycleStages?.length
        ? { lifecycleStage: { in: input.lifecycleStages } }
        : input.lifecycleStage
          ? { lifecycleStage: input.lifecycleStage }
          : {}),
      ...recordStatusWhere,
      ...(input.createdBy ? { createdBy: input.createdBy } : {}),
      ...(input.ownerless ? { ownerAccountId: null } : {}),
      ...(input.ownerAccountId ? { ownerAccountId: input.ownerAccountId } : {}),
      ...(input.keyword
        ? {
            OR: [
              { displayName: { contains: input.keyword, mode: 'insensitive' } },
              { leadLegalName: { contains: input.keyword, mode: 'insensitive' } },
              { leadCompanyName: { contains: input.keyword, mode: 'insensitive' } },
              { leadPersonName: { contains: input.keyword, mode: 'insensitive' } },
              { leadDomain: { contains: input.keyword, mode: 'insensitive' } },
              { leadEmail: { contains: input.keyword, mode: 'insensitive' } }
            ]
          }
        : {})
    }

    const [total, items] = await Promise.all([
      this.prisma.getExecutionClient().crmAccount.count({ where }),
      this.prisma.getExecutionClient().crmAccount.findMany({
        where,
        orderBy: {
          updatedAt: 'desc'
        },
        skip: (page - 1) * pageSize,
        take: pageSize
      })
    ])

    return {
      items: items.map(toCrmAccountRecord),
      total,
      page,
      pageSize
    }
  }

  /** listSourceRecords returns primary source first, then newest captured evidence for one account. */
  async listSourceRecords(tenantId: string, accountId: string): Promise<CrmSourceRecord[]> {
    const records = await this.prisma.getExecutionClient().crmSourceRecord.findMany({
      where: {
        tenantId,
        crmAccountId: accountId
      },
      orderBy: [
        {
          isPrimary: 'desc'
        },
        {
          capturedAt: 'desc'
        }
      ]
    })

    return records.map(toCrmSourceRecord)
  }

  /** deleteDraftAccount hard-deletes only draft leads and cascades their source records. */
  async deleteDraftAccount(tenantId: string, accountId: string): Promise<boolean> {
    const deleted = await this.prisma.getExecutionClient().crmAccount.deleteMany({
      where: {
        id: accountId,
        tenantId,
        recordStatus: CrmAccountRecordStatus.DRAFT,
        lifecycleStage: CrmAccountLifecycleStage.LEAD
      }
    })

    return deleted.count > 0
  }

  /** findDuplicateCandidates searches tenant-local CRM evidence without consulting party-service. */
  async findDuplicateCandidates(
    input: CrmDuplicateSearchInput
  ): Promise<CrmAccountDuplicateCandidate[]> {
    const profileItemMatches = await this.findDuplicateProfileItemMatches(input)
    const profileMatchedAccountIds = [
      ...new Set(profileItemMatches.map((item) => item.crmAccountId))
    ]
    const records = await this.prisma.getExecutionClient().crmAccount.findMany({
      where: {
        tenantId: input.tenantId,
        recordStatus: {
          in: [CrmAccountRecordStatus.ACTIVE, CrmAccountRecordStatus.ARCHIVED]
        }
      },
      orderBy: {
        updatedAt: 'desc'
      },
      take: 50
    })
    const missingProfileMatchedRecords = profileMatchedAccountIds.length
      ? await this.prisma.getExecutionClient().crmAccount.findMany({
          where: {
            tenantId: input.tenantId,
            id: {
              in: profileMatchedAccountIds.filter(
                (accountId) => !records.some((record) => record.id === accountId)
              )
            },
            recordStatus: {
              in: [CrmAccountRecordStatus.ACTIVE, CrmAccountRecordStatus.ARCHIVED]
            }
          }
        })
      : []
    const profileMatchedFieldsByAccountId = new Map<string, string[]>()
    for (const profileItem of profileItemMatches) {
      const fields = profileMatchedFieldsByAccountId.get(profileItem.crmAccountId) ?? []
      fields.push(`profileItems.${profileItem.itemType}`)
      profileMatchedFieldsByAccountId.set(profileItem.crmAccountId, [...new Set(fields)])
    }

    return [...records, ...missingProfileMatchedRecords]
      .map((record) =>
        toDuplicateCandidate(record, input, profileMatchedFieldsByAccountId.get(record.id) ?? [])
      )
      .filter((candidate): candidate is CrmAccountDuplicateCandidate => candidate !== null)
  }

  /** findDuplicateProfileItemMatches finds account-level profile item values that match submitted lead evidence. */
  private async findDuplicateProfileItemMatches(input: CrmDuplicateSearchInput): Promise<
    Array<{
      crmAccountId: string
      itemType: string
    }>
  > {
    const profileItems = input.profileItems ?? []
    if (profileItems.length === 0) {
      return []
    }
    const records = await (this.prisma.getExecutionClient() as any).crmAccountProfileItem.findMany({
      where: {
        tenantId: input.tenantId,
        status: CrmAccountProfileItemStatus.ACTIVE,
        OR: profileItems.map((profileItem) => ({
          itemType: profileItem.itemType,
          normalizedValue: profileItem.normalizedValue
        }))
      },
      select: {
        crmAccountId: true,
        itemType: true
      },
      take: 100
    })

    return records
  }

  /** assertFormalTenantPartyIsAvailable prevents two active formal CRM accounts from claiming one TenantParty. */
  private async assertFormalTenantPartyIsAvailable(account: CrmAccountRecord): Promise<void> {
    if (
      !account.tenantPartyId ||
      account.recordStatus !== CrmAccountRecordStatus.ACTIVE ||
      !isFormalLifecycleStage(account.lifecycleStage)
    ) {
      return
    }

    const existing = await this.prisma.getExecutionClient().crmAccount.findFirst({
      where: {
        tenantId: account.tenantId,
        tenantPartyId: account.tenantPartyId,
        recordStatus: CrmAccountRecordStatus.ACTIVE,
        lifecycleStage: {
          in: [CrmAccountLifecycleStage.PROSPECT_CUSTOMER, CrmAccountLifecycleStage.CUSTOMER]
        },
        id: {
          not: account.id
        }
      },
      select: {
        id: true
      }
    })

    if (existing) {
      throw new Error(`tenantPartyId is already bound to active formal CrmAccount ${existing.id}`)
    }
  }

  /** assertOpportunityAccountIsFormal protects Opportunity from being attached to draft or lead accounts. */
  private async assertOpportunityAccountIsFormal(
    tenantId: string,
    accountId: string
  ): Promise<void> {
    const account = await this.prisma.getExecutionClient().crmAccount.findFirst({
      where: {
        id: accountId,
        tenantId,
        recordStatus: CrmAccountRecordStatus.ACTIVE,
        lifecycleStage: {
          in: [CrmAccountLifecycleStage.PROSPECT_CUSTOMER, CrmAccountLifecycleStage.CUSTOMER]
        },
        tenantPartyId: {
          not: null
        }
      },
      select: {
        id: true
      }
    })

    if (!account) {
      throw new Error('Opportunity requires an active formal CrmAccount with tenantPartyId')
    }
  }
}

/** toCrmAccountRecord converts one Prisma account row into the CRM P1 domain record. */
function toCrmAccountRecord(record: PrismaCrmAccountRow): CrmAccountRecord {
  return {
    id: record.id,
    tenantId: record.tenantId,
    tenantPartyId: record.tenantPartyId,
    recordStatus: record.recordStatus as CrmAccountRecordStatus,
    lifecycleStage: record.lifecycleStage as CrmAccountLifecycleStage,
    partyTypeHint: record.partyTypeHint as CrmAccountTypeHint,
    displayName: record.displayName,
    leadLegalName: record.leadLegalName,
    leadCompanyName: record.leadCompanyName,
    leadPersonName: record.leadPersonName,
    leadDomain: record.leadDomain,
    leadEmail: record.leadEmail,
    leadPhone: record.leadPhone,
    leadWhatsapp: record.leadWhatsapp,
    leadCountry: record.leadCountry,
    leadIdentifiers: fromJsonArray<CrmLeadIdentifierRecord>(record.leadIdentifiers),
    ownerAccountId: record.ownerAccountId,
    priority: record.priority as CrmPriority,
    lastActivityAt: record.lastActivityAt,
    nextFollowUpAt: record.nextFollowUpAt,
    createdBy: record.createdBy,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    archivedAt: record.archivedAt,
    archiveReason: record.archiveReason as CrmArchiveReason | null
  }
}

/** toCrmSourceRecord converts one Prisma source row into the CRM P1 domain record. */
function toCrmSourceRecord(record: PrismaCrmSourceRecordRow): CrmSourceRecord {
  return {
    id: record.id,
    tenantId: record.tenantId,
    crmAccountId: record.crmAccountId,
    sourceType: record.sourceType as CrmSourceType,
    sourceName: record.sourceName,
    capturedAt: record.capturedAt,
    capturedByAccountId: record.capturedByAccountId,
    externalReference: record.externalReference,
    rawPayload: record.rawPayload ? fromJson<Record<string, unknown>>(record.rawPayload) : null,
    note: record.note,
    isPrimary: record.isPrimary,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt
  }
}

/** toCrmAccountProfileItemRecord converts one Prisma profile item row into a CRM domain record. */
function toCrmAccountProfileItemRecord(record: {
  id: string
  tenantId: string
  crmAccountId: string
  itemType: string
  normalizedValue: string
  rawValue: string
  label: string | null
  role: string | null
  status: string
  sourceRecordId: string | null
  promotedTargetType: string | null
  promotedTargetId: string | null
  promotedAt: Date | null
  createdAt: Date
  updatedAt: Date
}): CrmAccountProfileItemRecord {
  return {
    id: record.id,
    tenantId: record.tenantId,
    crmAccountId: record.crmAccountId,
    itemType: record.itemType,
    normalizedValue: record.normalizedValue,
    rawValue: record.rawValue,
    label: record.label,
    role: record.role,
    status: record.status,
    sourceRecordId: record.sourceRecordId,
    promotedTargetType: record.promotedTargetType,
    promotedTargetId: record.promotedTargetId,
    promotedAt: record.promotedAt,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt
  }
}

/** toCrmContactRecord converts one Prisma contact row into the CRM P1 contact record. */
function toCrmContactRecord(record: PrismaCrmContactRow): CrmContactRecord {
  return {
    id: record.id,
    tenantId: record.tenantId,
    crmAccountId: record.crmAccountId,
    personTenantPartyId: record.personTenantPartyId,
    name: record.name,
    title: record.title,
    department: record.department,
    email: record.email,
    phone: record.phone,
    whatsapp: record.whatsapp,
    linkedin: record.linkedin,
    isPrimary: record.isPrimary,
    note: record.note,
    createdBy: record.createdBy,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    archivedAt: record.archivedAt
  }
}

/** toCrmActivityRecord converts one Prisma activity row into the CRM P1 activity record. */
function toCrmActivityRecord(record: PrismaCrmActivityRow): CrmActivityRecord {
  return {
    id: record.id,
    tenantId: record.tenantId,
    crmAccountId: record.crmAccountId,
    opportunityId: record.opportunityId,
    contactId: record.contactId,
    activityType: record.activityType as CrmActivityType,
    direction: record.direction as CrmActivityDirection,
    subject: record.subject,
    content: record.content,
    occurredAt: record.occurredAt,
    createdByAccountId: record.createdByAccountId,
    createdByType: record.createdByType as CrmActivityCreatedByType,
    externalProvider: record.externalProvider,
    externalReference: record.externalReference,
    metadata: fromJson<Record<string, unknown>>(record.metadata),
    visibility: record.visibility as CrmActivityVisibility,
    createdAt: record.createdAt
  }
}

/** toCrmOpportunityRecord converts one Prisma opportunity row into the CRM P1 opportunity record. */
function toCrmOpportunityRecord(record: PrismaOpportunityRow): CrmOpportunityRecord {
  return {
    id: record.id,
    tenantId: record.tenantId,
    crmAccountId: record.crmAccountId,
    ownerAccountId: record.ownerAccountId,
    name: record.name,
    stage: record.stage as CrmOpportunityStage,
    status: record.status as CrmOpportunityStatus,
    estimatedAmount: record.estimatedAmount?.toFixed(2) ?? null,
    currency: record.currency,
    expectedCloseDate: record.expectedCloseDate,
    openedAt: record.openedAt,
    closedAt: record.closedAt,
    closeReason: record.closeReason,
    closeNote: record.closeNote,
    createdBy: record.createdBy,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt
  }
}

/** isFormalLifecycleStage identifies CRM account stages that must already be backed by TenantParty. */
function isFormalLifecycleStage(stage: CrmAccountLifecycleStage): boolean {
  return (
    stage === CrmAccountLifecycleStage.PROSPECT_CUSTOMER ||
    stage === CrmAccountLifecycleStage.CUSTOMER
  )
}

/** toDuplicateCandidate converts a matching account row into a duplicate candidate with matched evidence fields. */
function toDuplicateCandidate(
  record: PrismaCrmAccountRow,
  input: CrmDuplicateSearchInput,
  matchedProfileItemFields: string[] = []
): CrmAccountDuplicateCandidate | null {
  const matchedFields: string[] = []
  const recordIdentifiers = fromJsonArray<CrmLeadIdentifierRecord>(record.leadIdentifiers)

  if (matchesNullableText(record.leadEmail, input.leadEmail)) {
    matchedFields.push('leadEmail')
  }
  if (matchesNullableLeadDomain(record.leadDomain, input.leadDomain)) {
    matchedFields.push('leadDomain')
  }
  if (matchesNullableText(record.leadPhone, input.leadPhone)) {
    matchedFields.push('leadPhone')
  }
  if (matchesNullableText(record.leadWhatsapp, input.leadWhatsapp)) {
    matchedFields.push('leadWhatsapp')
  }
  if (hasMatchingLeadIdentifier(recordIdentifiers, input.leadIdentifiers ?? [])) {
    matchedFields.push('leadIdentifiers')
  }
  matchedFields.push(...matchedProfileItemFields)

  if (matchedFields.length === 0) {
    return null
  }

  return {
    crmAccountId: record.id,
    tenantId: record.tenantId,
    displayName: record.displayName,
    ownerAccountId: record.ownerAccountId,
    recordStatus: record.recordStatus as CrmAccountRecordStatus,
    lifecycleStage: record.lifecycleStage as CrmAccountLifecycleStage,
    matchedFields,
    confidence: 'HIGH'
  }
}

/** normalizeLeadDomainForStorage stores valid lead domains as canonical hosts without treating invalid legacy text as business truth. */
function normalizeLeadDomainForStorage(value?: string | null): string | null {
  const trimmedValue = value?.trim()
  if (!trimmedValue) {
    return null
  }

  const domain = InternetDomain.parse(trimmedValue)
  if (!domain.isValid) {
    return trimmedValue
  }

  return domain.canonicalHost
}

/** matchesNullableLeadDomain compares valid domains by canonical host while preserving text fallback for invalid legacy values. */
function matchesNullableLeadDomain(left?: string | null, right?: string | null): boolean {
  if (!left || !right) {
    return false
  }

  const leftDomain = InternetDomain.parse(left)
  const rightDomain = InternetDomain.parse(right)
  if (leftDomain.isValid && rightDomain.isValid) {
    return leftDomain.canonicalHost === rightDomain.canonicalHost
  }

  return matchesNullableText(left, right)
}

/** matchesNullableText compares normalized optional text evidence values. */
function matchesNullableText(left?: string | null, right?: string | null): boolean {
  if (!left || !right) {
    return false
  }

  return left.trim().toLowerCase() === right.trim().toLowerCase()
}

/** hasMatchingLeadIdentifier checks whether any submitted strong identifier already exists on a CRM lead. */
function hasMatchingLeadIdentifier(
  existingIdentifiers: CrmLeadIdentifierRecord[],
  requestedIdentifiers: CrmDuplicateSearchInput['leadIdentifiers']
): boolean {
  return (requestedIdentifiers ?? []).some((requested) =>
    existingIdentifiers.some(
      (existing) =>
        existing.identifierType === requested.identifierType &&
        existing.normalizedValue === requested.normalizedValue &&
        (!requested.issuerCountryOrRegion ||
          existing.issuerCountryOrRegion === requested.issuerCountryOrRegion)
    )
  )
}

/** toJson deep-clones a plain object into a Prisma JSON input payload. */
function toJson(value: unknown): Prisma.InputJsonValue {
  return structuredClone(value) as Prisma.InputJsonValue
}

/** fromJson deep-clones one stored Prisma JSON value into a plain domain payload. */
function fromJson<T>(value: Prisma.JsonValue): T {
  return structuredClone(value) as T
}

/** fromJsonArray normalizes stored Prisma JSON values that are expected to be domain arrays. */
function fromJsonArray<T>(value: Prisma.JsonValue): T[] {
  const cloned = structuredClone(value)
  return Array.isArray(cloned) ? (cloned as T[]) : []
}
