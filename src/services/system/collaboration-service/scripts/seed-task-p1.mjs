import { PrismaClient } from '../prisma/generated/prisma/index.js'

const DEFAULT_LOCAL_DATABASE_URL = 'postgres://imkgsam:imkgsam@localhost:5432/collaborationdb'
const rawDatabaseUrl =
  process.env.COLLABORATION_DATABASE_URL ||
  process.env.DATABASE_URL ||
  (process.env.NODE_ENV !== 'production' ? DEFAULT_LOCAL_DATABASE_URL : '')

if (!rawDatabaseUrl) {
  console.error('COLLABORATION_DATABASE_URL or DATABASE_URL is required for production Task P1 seed.')
  process.exit(1)
}

process.env.DATABASE_URL = withCollaborationSchema(rawDatabaseUrl)

const prisma = new PrismaClient()

const TENANT_ID = '00000000-0000-4000-8000-000000000001'
const ASSIGNER_ACCOUNT_ID = '00000000-0000-4000-8000-000000000901'
const BASIC_ACCOUNT_ID = '00000000-0000-4000-8000-000000000903'
const SEED_TASK_IDS = [
  '10000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000002',
  '10000000-0000-4000-8000-000000000003',
  '10000000-0000-4000-8000-000000000004',
  '10000000-0000-4000-8000-000000000005',
  '10000000-0000-4000-8000-000000000006',
  '10000000-0000-4000-8000-000000000007',
  '10000000-0000-4000-8000-000000000008'
]
const SEED_REFERENCE_TIME = new Date('2026-01-15T12:00:00.000Z')

/** withCollaborationSchema scopes local seed writes to collaboration-service storage. */
function withCollaborationSchema(rawUrl) {
  const parsed = new URL(rawUrl)
  if (!parsed.searchParams.get('schema')) {
    parsed.searchParams.set('schema', 'collaboration_service')
  }
  return parsed.toString()
}

/** buildTaskSeedRows creates the frozen Task P1 sample set for local tenant-web smoke. */
function buildTaskSeedRows(now = SEED_REFERENCE_TIME) {
  const dueSoon = new Date(now.getTime() + 24 * 60 * 60 * 1000)
  const overdue = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  const completedAt = new Date(now.getTime() - 2 * 60 * 60 * 1000)
  const cancelledAt = new Date(now.getTime() - 90 * 60 * 1000)
  const archivedAt = new Date(now.getTime() - 30 * 60 * 1000)

  return [
    {
      id: SEED_TASK_IDS[0],
      tenantId: TENANT_ID,
      title: 'P1 Self Todo / prepare daily handoff',
      description: 'Private self todo created by the assign-capable tenant admin account.',
      createdByAccountId: ASSIGNER_ACCOUNT_ID,
      assigneeAccountId: ASSIGNER_ACCOUNT_ID,
      visibility: 'PRIVATE',
      status: 'OPEN',
      priority: 'NORMAL',
      dueAt: dueSoon
    },
    {
      id: SEED_TASK_IDS[1],
      tenantId: TENANT_ID,
      title: 'P1 Assigned Task / review supplier quotation',
      description: 'Assigned by an account with collaboration.task.assign to a basic account.',
      createdByAccountId: ASSIGNER_ACCOUNT_ID,
      assigneeAccountId: BASIC_ACCOUNT_ID,
      visibility: 'ASSIGNMENT_PARTICIPANTS',
      status: 'OPEN',
      priority: 'HIGH',
      dueAt: dueSoon
    },
    {
      id: SEED_TASK_IDS[2],
      tenantId: TENANT_ID,
      title: 'P1 Created By Me / check packing note',
      description: 'Created-by-me sample already in progress.',
      createdByAccountId: ASSIGNER_ACCOUNT_ID,
      assigneeAccountId: BASIC_ACCOUNT_ID,
      visibility: 'ASSIGNMENT_PARTICIPANTS',
      status: 'IN_PROGRESS',
      priority: 'NORMAL',
      dueAt: null,
      startedAt: new Date(now.getTime() - 60 * 60 * 1000)
    },
    {
      id: SEED_TASK_IDS[3],
      tenantId: TENANT_ID,
      title: 'P1 Due Soon / confirm invoice attachment',
      description: 'Due soon active task for filter smoke.',
      createdByAccountId: BASIC_ACCOUNT_ID,
      assigneeAccountId: BASIC_ACCOUNT_ID,
      visibility: 'PRIVATE',
      status: 'OPEN',
      priority: 'URGENT',
      dueAt: dueSoon
    },
    {
      id: SEED_TASK_IDS[4],
      tenantId: TENANT_ID,
      title: 'P1 Overdue / update shipment contact',
      description: 'Overdue is derived by query and is not stored as status.',
      createdByAccountId: BASIC_ACCOUNT_ID,
      assigneeAccountId: BASIC_ACCOUNT_ID,
      visibility: 'PRIVATE',
      status: 'OPEN',
      priority: 'HIGH',
      dueAt: overdue
    },
    {
      id: SEED_TASK_IDS[5],
      tenantId: TENANT_ID,
      title: 'P1 Completed / reconcile receiving draft',
      description: 'Completed terminal sample that can be archived by creator.',
      createdByAccountId: ASSIGNER_ACCOUNT_ID,
      assigneeAccountId: BASIC_ACCOUNT_ID,
      visibility: 'ASSIGNMENT_PARTICIPANTS',
      status: 'COMPLETED',
      priority: 'LOW',
      dueAt: null,
      completedAt,
      completedByAccountId: BASIC_ACCOUNT_ID,
      completionNote: 'Seeded completion note'
    },
    {
      id: SEED_TASK_IDS[6],
      tenantId: TENANT_ID,
      title: 'P1 Cancelled / duplicate vendor follow-up',
      description: 'Cancelled terminal sample that can be reopened by creator.',
      createdByAccountId: ASSIGNER_ACCOUNT_ID,
      assigneeAccountId: BASIC_ACCOUNT_ID,
      visibility: 'ASSIGNMENT_PARTICIPANTS',
      status: 'CANCELLED',
      priority: 'NORMAL',
      dueAt: null,
      cancelledAt,
      cancelledByAccountId: ASSIGNER_ACCOUNT_ID,
      cancelReason: 'Seeded duplicate task'
    },
    {
      id: SEED_TASK_IDS[7],
      tenantId: TENANT_ID,
      title: 'P1 Archived / closed onboarding checklist',
      description: 'Archived completed sample for archived-only filter smoke.',
      createdByAccountId: ASSIGNER_ACCOUNT_ID,
      assigneeAccountId: ASSIGNER_ACCOUNT_ID,
      visibility: 'PRIVATE',
      status: 'COMPLETED',
      priority: 'NORMAL',
      dueAt: null,
      completedAt,
      completedByAccountId: ASSIGNER_ACCOUNT_ID,
      completionNote: 'Seeded archive-ready task',
      archivedAt,
      archivedByAccountId: ASSIGNER_ACCOUNT_ID
    }
  ].map((task) => ({
    ...task,
    createdAt: now,
    updatedAt: now
  }))
}

/** main creates missing deterministic Task P1 samples without rewriting an existing fixture. */
async function main() {
  const rows = buildTaskSeedRows()

  for (const task of rows) {
    const existing = await prisma.collaborationTask.findUnique({ where: { id: task.id }, select: { id: true } })
    if (!existing) await prisma.collaborationTask.create({ data: task })
  }

  console.log(
    `Seeded ${rows.length} collaboration Task P1 samples for tenant ${TENANT_ID}. assigner=${ASSIGNER_ACCOUNT_ID}; basic=${BASIC_ACCOUNT_ID}`
  )
}

main()
  .catch((error) => {
    console.error('Failed to seed collaboration Task P1 samples.')
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
