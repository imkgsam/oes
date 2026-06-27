import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SERVICE_ROOT = path.resolve(__dirname, '..')

const { PrismaClient } = require('../prisma/generated/prisma')
const { InternetDomain } = require('@oes/common')

// loadServiceEnv loads local crm-service environment values before Prisma initializes its connection.
function loadServiceEnv() {
  const envPath = path.join(SERVICE_ROOT, '.env')
  if (!existsSync(envPath)) {
    return
  }

  const content = readFileSync(envPath, 'utf8')
  for (const rawLine of content.split('\n')) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue

    const separatorIndex = line.indexOf('=')
    if (separatorIndex === -1) continue

    const key = line.slice(0, separatorIndex).trim()
    const rawValue = line.slice(separatorIndex + 1).trim()
    const value =
      (rawValue.startsWith('"') && rawValue.endsWith('"')) ||
      (rawValue.startsWith("'") && rawValue.endsWith("'"))
        ? rawValue.slice(1, -1)
        : rawValue

    if (!(key in process.env)) {
      process.env[key] = value
    }
  }
}

// normalizeLeadDomainForGovernance mirrors CRM storage semantics without merging duplicate CRM records.
function normalizeLeadDomainForGovernance(value) {
  const trimmedValue = value?.trim()
  if (!trimmedValue) {
    return {
      canonicalValue: null,
      isValid: false,
      reason: 'BLANK'
    }
  }

  const domain = InternetDomain.parse(trimmedValue)
  if (!domain.isValid) {
    return {
      canonicalValue: trimmedValue,
      isValid: false,
      reason: 'INVALID_HOST'
    }
  }

  return {
    canonicalValue: domain.canonicalHost,
    isValid: true,
    reason: domain.canonicalHost === value ? 'UNCHANGED' : 'CANONICALIZED'
  }
}

// buildDomainGovernancePlan classifies rows into updates, invalid values, and post-normalization collision groups.
function buildDomainGovernancePlan(accounts) {
  const updates = []
  const invalid = []
  const effectiveValidDomainsByTenant = new Map()

  for (const account of accounts) {
    const normalized = normalizeLeadDomainForGovernance(account.leadDomain)
    if (normalized.canonicalValue !== account.leadDomain) {
      updates.push({
        id: account.id,
        tenantId: account.tenantId,
        displayName: account.displayName,
        from: account.leadDomain,
        to: normalized.canonicalValue,
        reason: normalized.reason
      })
    }

    if (!normalized.isValid && normalized.reason !== 'BLANK') {
      invalid.push({
        id: account.id,
        tenantId: account.tenantId,
        displayName: account.displayName,
        leadDomain: account.leadDomain,
        normalizedValue: normalized.canonicalValue,
        reason: normalized.reason
      })
      continue
    }

    if (normalized.isValid && normalized.canonicalValue) {
      const groupKey = `${account.tenantId}\u0000${normalized.canonicalValue}`
      const group = effectiveValidDomainsByTenant.get(groupKey) ?? {
        tenantId: account.tenantId,
        canonicalHost: normalized.canonicalValue,
        accounts: []
      }
      group.accounts.push({
        id: account.id,
        displayName: account.displayName,
        recordStatus: account.recordStatus,
        lifecycleStage: account.lifecycleStage,
        leadDomain: account.leadDomain
      })
      effectiveValidDomainsByTenant.set(groupKey, group)
    }
  }

  return {
    updates,
    invalid,
    collisionGroups: Array.from(effectiveValidDomainsByTenant.values()).filter(
      (group) => group.accounts.length > 1
    )
  }
}

// applyDomainUpdates writes only leadDomain canonicalization updates and leaves duplicate records untouched.
async function applyDomainUpdates(prisma, updates) {
  await prisma.$transaction(
    updates.map((update) =>
      prisma.crmAccount.update({
        where: {
          id: update.id
        },
        data: {
          leadDomain: update.to
        }
      })
    )
  )
}

// main scans CRM leadDomain data and optionally applies canonical leadDomain-only cleanup.
async function main() {
  loadServiceEnv()

  const apply = process.argv.includes('--apply')
  const prisma = new PrismaClient()

  try {
    const accounts = await prisma.crmAccount.findMany({
      where: {
        leadDomain: {
          not: null
        }
      },
      select: {
        id: true,
        tenantId: true,
        displayName: true,
        recordStatus: true,
        lifecycleStage: true,
        leadDomain: true
      },
      orderBy: [
        {
          tenantId: 'asc'
        },
        {
          updatedAt: 'desc'
        }
      ]
    })
    const plan = buildDomainGovernancePlan(accounts)

    if (apply && plan.updates.length > 0) {
      await applyDomainUpdates(prisma, plan.updates)
    }

    console.log(
      JSON.stringify(
        {
          mode: apply ? 'APPLY' : 'DRY_RUN',
          scannedRows: accounts.length,
          updatedRows: apply ? plan.updates.length : 0,
          plannedUpdates: plan.updates.length,
          invalidRows: plan.invalid.length,
          collisionGroups: plan.collisionGroups.length,
          updates: plan.updates,
          invalid: plan.invalid,
          collisions: plan.collisionGroups,
          note: 'This script only normalizes CrmAccount.leadDomain values. It does not merge CRM records or resolve duplicates.'
        },
        null,
        2
      )
    )
  } finally {
    await prisma.$disconnect()
  }
}

await main()
