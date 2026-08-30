import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { buildBusinessCardLiveFixtureSeed } from './business-card-live-fixtures.mjs'
import { normalizeTaskKey, parseEnvironmentFile } from './worktree-env.mjs'

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const serviceDirectory = path.join(repositoryRoot, 'src/services/system/public-entry-service')
const allowedModes = new Set(['--apply', '--check', '--cleanup'])

/** Builds the three persisted public-card states plus one deliberately absent identifier. */
export function buildPublicBusinessCardAcceptanceSeed(taskKey, source = buildBusinessCardLiveFixtureSeed()) {
  const normalizedTaskKey = normalizeTaskKey(taskKey)
  const fixtureOwner = `fixture:public-business-card:${normalizedTaskKey}`
  const fixtureTraceId = `fixture-public-business-card-${normalizedTaskKey}`
  const visibilityConfigJson = {
    showTitle: true,
    showDepartment: true,
    showCompany: true,
    showOfficialPhoto: true
  }
  const cards = [
    {
      fixtureState: 'AVAILABLE',
      ...source.publicCards.available,
      status: 'ACTIVE',
      templateKey: 'TENANT_STANDARD',
      contactActionsJson: [
        {
          contactActionType: 'SEND_EMAIL',
          targetRefType: 'CONTACT_ASSET',
          targetRefId: source.workEmailContactAssetId,
          visibility: 'PUBLIC',
          displayOrder: 10,
          enabled: true,
          includeInVCard: true
        },
        {
          contactActionType: 'SAVE_VCARD',
          targetRefType: 'NONE',
          targetRefId: null,
          visibility: 'PUBLIC',
          displayOrder: 20,
          enabled: true,
          includeInVCard: false
        }
      ]
    },
    {
      fixtureState: 'DISABLED',
      ...source.publicCards.disabled,
      status: 'DISABLED',
      templateKey: 'TENANT_STANDARD',
      contactActionsJson: []
    },
    {
      fixtureState: 'UNAVAILABLE',
      ...source.publicCards.unavailable,
      status: 'ACTIVE',
      templateKey: 'TASK_FIXTURE_UNAVAILABLE',
      contactActionsJson: []
    }
  ].map((card) => ({
    ...card,
    publicEntryRefJson: {
      publicEntryId: card.shortLinkId,
      shortCode: card.shortCode,
      publicUrl: `https://public.fixture.invalid/s/${card.shortCode}`,
      qrContent: `https://public.fixture.invalid/s/${card.shortCode}`,
      status: 'ACTIVE',
      expiresAt: null
    },
    visibilityConfigJson,
    createdBy: fixtureOwner,
    updatedBy: fixtureOwner
  }))
  const shortLinks = cards.map((card) => ({
    id: card.shortLinkId,
    tenantId: card.tenantId,
    displayName: `Task fixture ${card.fixtureState.toLowerCase()} public business card`,
    shortCode: card.shortCode,
    targetKind: 'INTERNAL_REF',
    targetType: 'BUSINESS_CARD',
    targetResourceId: card.businessCardId,
    targetUrl: null,
    entryPurpose: 'BUSINESS_CARD',
    sourcePlacement: 'PUBLIC_BOUNDARY_ACCEPTANCE',
    campaignRef: null,
    status: 'ACTIVE',
    expiresAt: null,
    createdBy: fixtureOwner,
    updatedBy: fixtureOwner
  }))
  const auditLogs = cards.map((card, index) => ({
    id: `00000000-0000-4000-8000-${String(900 + index + 1).padStart(12, '0')}`,
    tenantId: card.tenantId,
    businessCardId: card.businessCardId,
    action: 'TASK_FIXTURE_APPLY',
    before: null,
    after: { fixtureState: card.fixtureState },
    operatorAccountId: source.operatorAccountId,
    operatorOrgId: null,
    traceId: fixtureTraceId
  }))
  const projection = {
    version: 1,
    taskKey: normalizedTaskKey,
    fixtureOwner,
    cards: cards.map(toCardProjection),
    shortLinks: shortLinks.map(toShortLinkProjection),
    notFoundBusinessCardId: source.publicCards.notFound.businessCardId
  }
  return {
    ...projection,
    fixtureTraceId,
    cards,
    shortLinks,
    auditLogs,
    digest: crypto.createHash('sha256').update(stableJson(projection)).digest('hex')
  }
}

/** Resolves the ignored task environment without echoing database credentials. */
export function loadPublicEntryDatabaseContext(root = repositoryRoot, environment = process.env) {
  const rootValues = parseEnvironmentFile(fs.readFileSync(path.join(root, '.env'), 'utf8'))
  const taskKey = normalizeTaskKey(environment.OES_TASK_KEY?.trim() || rootValues.get('OES_TASK_KEY'))
  const serviceEnvPath = path.join(root, 'src/services/system/public-entry-service/.env')
  const serviceValues = parseEnvironmentFile(fs.readFileSync(serviceEnvPath, 'utf8'), serviceEnvPath)
  const databaseUrl = environment.PUBLIC_ENTRY_DATABASE_URL?.trim() || serviceValues.get('DATABASE_URL')
  assertTaskOwnedPublicEntryDatabase(databaseUrl, taskKey)
  return { databaseUrl, taskKey }
}

/** Rejects remote, shared, or differently owned databases before any read or write. */
export function assertTaskOwnedPublicEntryDatabase(databaseUrl, taskKey) {
  const parsed = new URL(databaseUrl)
  if (!['postgres:', 'postgresql:'].includes(parsed.protocol)) {
    throw new Error('PUBLIC_BUSINESS_CARD_FIXTURE_DATABASE_PROTOCOL_INVALID')
  }
  if (!['127.0.0.1', 'localhost', '[::1]'].includes(parsed.hostname)) {
    throw new Error('PUBLIC_BUSINESS_CARD_FIXTURE_DATABASE_NOT_LOOPBACK')
  }
  const database = decodeURIComponent(parsed.pathname.slice(1))
  if (database !== `oes_${normalizeTaskKey(taskKey)}_public_entry`) {
    throw new Error('PUBLIC_BUSINESS_CARD_FIXTURE_DATABASE_NOT_TASK_OWNED')
  }
  return { database, host: parsed.hostname, port: parsed.port || '5432' }
}

/** Applies only the exact owned identifiers and fails closed on unique-key collisions. */
export async function applyFixture(prisma, fixture) {
  await assertNoForeignConflicts(prisma, fixture)
  await prisma.$transaction(async (tx) => {
    for (const link of fixture.shortLinks) {
      await tx.shortLink.upsert({
        where: { id: link.id },
        create: link,
        update: omit(link, ['id', 'createdBy'])
      })
    }
    for (const card of fixture.cards) {
      const data = {
        id: card.businessCardId,
        tenantId: card.tenantId,
        employeeId: card.employeeId,
        status: card.status,
        templateKey: card.templateKey,
        publicEntryRefJson: card.publicEntryRefJson,
        contactActionsJson: card.contactActionsJson,
        visibilityConfigJson: card.visibilityConfigJson,
        createdBy: card.createdBy,
        updatedBy: card.updatedBy
      }
      await tx.businessCard.upsert({
        where: { id: card.businessCardId },
        create: data,
        update: omit(data, ['id', 'tenantId', 'employeeId', 'createdBy'])
      })
    }
    for (const audit of fixture.auditLogs) {
      await tx.businessCardAuditLog.upsert({
        where: { id: audit.id },
        create: audit,
        update: omit(audit, ['id', 'tenantId', 'businessCardId'])
      })
    }
  })
  return checkFixture(prisma, fixture)
}

/** Reads the exact identifier set and verifies its stable public-boundary projection. */
export async function checkFixture(prisma, fixture) {
  const [cards, shortLinks, notFoundCount, auditCount] = await Promise.all([
    prisma.businessCard.findMany({
      where: { id: { in: fixture.cards.map((card) => card.businessCardId) } },
      orderBy: { id: 'asc' }
    }),
    prisma.shortLink.findMany({
      where: { id: { in: fixture.shortLinks.map((link) => link.id) } },
      orderBy: { id: 'asc' }
    }),
    prisma.businessCard.count({ where: { id: fixture.notFoundBusinessCardId } }),
    prisma.businessCardAuditLog.count({ where: { id: { in: fixture.auditLogs.map((audit) => audit.id) } } })
  ])
  const actual = {
    version: 1,
    taskKey: fixture.taskKey,
    fixtureOwner: fixture.fixtureOwner,
    cards: cards.map((card) => toCardProjection({ ...card, businessCardId: card.id })),
    shortLinks: shortLinks.map(toShortLinkProjection),
    notFoundBusinessCardId: fixture.notFoundBusinessCardId
  }
  if (notFoundCount !== 0) throw new Error('PUBLIC_BUSINESS_CARD_FIXTURE_NOT_FOUND_ID_PRESENT')
  if (auditCount !== fixture.auditLogs.length) throw new Error('PUBLIC_BUSINESS_CARD_FIXTURE_AUDIT_MISMATCH')
  if (stableJson(actual) !== stableJson(toExpectedProjection(fixture))) {
    throw new Error('PUBLIC_BUSINESS_CARD_FIXTURE_PROJECTION_MISMATCH')
  }
  return {
    result: 'PUBLIC_BUSINESS_CARD_FIXTURE_VERIFIED',
    taskKey: fixture.taskKey,
    cardCount: cards.length,
    shortLinkCount: shortLinks.length,
    auditCount,
    notFoundCount,
    digest: fixture.digest
  }
}

/** Removes only owned fixture rows; cascades remove the bounded audit rows. */
export async function cleanupFixture(prisma, fixture) {
  await assertNoForeignConflicts(prisma, fixture)
  const result = await prisma.$transaction(async (tx) => {
    const deletedCards = await tx.businessCard.deleteMany({
      where: { id: { in: fixture.cards.map((card) => card.businessCardId) }, createdBy: fixture.fixtureOwner }
    })
    const deletedShortLinks = await tx.shortLink.deleteMany({
      where: { id: { in: fixture.shortLinks.map((link) => link.id) }, createdBy: fixture.fixtureOwner }
    })
    return { deletedCards: deletedCards.count, deletedShortLinks: deletedShortLinks.count }
  })
  const [remainingCards, remainingShortLinks, remainingAudits] = await Promise.all([
    prisma.businessCard.count({ where: { id: { in: fixture.cards.map((card) => card.businessCardId) } } }),
    prisma.shortLink.count({ where: { id: { in: fixture.shortLinks.map((link) => link.id) } } }),
    prisma.businessCardAuditLog.count({ where: { id: { in: fixture.auditLogs.map((audit) => audit.id) } } })
  ])
  if (remainingCards + remainingShortLinks + remainingAudits !== 0) {
    throw new Error('PUBLIC_BUSINESS_CARD_FIXTURE_CLEANUP_INCOMPLETE')
  }
  return { result: 'PUBLIC_BUSINESS_CARD_FIXTURE_CLEANED', taskKey: fixture.taskKey, ...result }
}

/** Checks identifier and unique-key ownership before mutation or cleanup. */
async function assertNoForeignConflicts(prisma, fixture) {
  const [cards, links, audits] = await Promise.all([
    prisma.businessCard.findMany({
      where: {
        OR: fixture.cards.flatMap((card) => [
          { id: card.businessCardId },
          { tenantId: card.tenantId, employeeId: card.employeeId }
        ])
      }
    }),
    prisma.shortLink.findMany({
      where: {
        OR: fixture.shortLinks.flatMap((link) => [{ id: link.id }, { shortCode: link.shortCode }])
      }
    }),
    prisma.businessCardAuditLog.findMany({
      where: { id: { in: fixture.auditLogs.map((audit) => audit.id) } }
    })
  ])
  if (cards.some((card) => card.createdBy !== fixture.fixtureOwner)) {
    throw new Error('PUBLIC_BUSINESS_CARD_FIXTURE_FOREIGN_CARD_CONFLICT')
  }
  if (links.some((link) => link.createdBy !== fixture.fixtureOwner)) {
    throw new Error('PUBLIC_BUSINESS_CARD_FIXTURE_FOREIGN_SHORT_LINK_CONFLICT')
  }
  if (
    audits.some(
      (audit) => audit.traceId !== fixture.fixtureTraceId || audit.action !== 'TASK_FIXTURE_APPLY'
    )
  ) {
    throw new Error('PUBLIC_BUSINESS_CARD_FIXTURE_FOREIGN_AUDIT_CONFLICT')
  }
}

function toCardProjection(card) {
  return {
    id: card.businessCardId ?? card.id,
    tenantId: card.tenantId,
    employeeId: card.employeeId,
    status: card.status,
    templateKey: card.templateKey,
    publicEntryRefJson: card.publicEntryRefJson,
    contactActionsJson: card.contactActionsJson,
    visibilityConfigJson: card.visibilityConfigJson,
    createdBy: card.createdBy,
    updatedBy: card.updatedBy
  }
}

function toShortLinkProjection(link) {
  return {
    id: link.id,
    tenantId: link.tenantId,
    displayName: link.displayName,
    shortCode: link.shortCode,
    targetKind: link.targetKind,
    targetType: link.targetType,
    targetResourceId: link.targetResourceId,
    targetUrl: link.targetUrl,
    entryPurpose: link.entryPurpose,
    sourcePlacement: link.sourcePlacement,
    campaignRef: link.campaignRef,
    status: link.status,
    expiresAt: link.expiresAt,
    createdBy: link.createdBy,
    updatedBy: link.updatedBy
  }
}

function toExpectedProjection(fixture) {
  return {
    version: 1,
    taskKey: fixture.taskKey,
    fixtureOwner: fixture.fixtureOwner,
    cards: fixture.cards.map(toCardProjection).sort(compareId),
    shortLinks: fixture.shortLinks.map(toShortLinkProjection).sort(compareId),
    notFoundBusinessCardId: fixture.notFoundBusinessCardId
  }
}

function compareId(left, right) {
  return left.id.localeCompare(right.id)
}

function omit(value, keys) {
  return Object.fromEntries(Object.entries(value).filter(([key]) => !keys.includes(key)))
}

function stableJson(value) {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`
  if (value && typeof value === 'object' && !(value instanceof Date)) {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(',')}}`
  }
  return JSON.stringify(value)
}

async function main() {
  const modes = process.argv.slice(2).filter((argument) => allowedModes.has(argument))
  if (modes.length !== 1) throw new Error('Usage: public-business-card-acceptance-seed.mjs --apply|--check|--cleanup')
  const [mode] = modes
  const context = loadPublicEntryDatabaseContext()
  const target = assertTaskOwnedPublicEntryDatabase(context.databaseUrl, context.taskKey)
  const require = createRequire(import.meta.url)
  const { PrismaClient } = require(
    path.join(serviceDirectory, 'prisma/generated/prisma')
  )
  const prisma = new PrismaClient({ datasources: { db: { url: context.databaseUrl } } })
  const fixture = buildPublicBusinessCardAcceptanceSeed(context.taskKey)
  process.stdout.write(`TARGET taskKey=${context.taskKey} database=${target.database} host=${target.host} port=${target.port}\n`)
  try {
    const result = mode === '--apply'
      ? await applyFixture(prisma, fixture)
      : mode === '--check'
        ? await checkFixture(prisma, fixture)
        : await cleanupFixture(prisma, fixture)
    process.stdout.write(`${JSON.stringify(result)}\n`)
  } finally {
    await prisma.$disconnect()
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`)
    process.exitCode = 1
  })
}
