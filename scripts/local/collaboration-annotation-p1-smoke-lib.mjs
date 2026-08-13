import { randomUUID } from 'node:crypto'

export const ANNOTATION_VISIBILITY_PRIVATE = 1
export const ANNOTATION_VISIBILITY_OBJECT_VISIBLE = 2

export const EXPECTED_VISIBLE_AUDIT_ACTIONS = [
  'ANNOTATION_CREATED',
  'ANNOTATION_PINNED_CHANGED',
]

export const EXPECTED_PRIVATE_AUDIT_ACTIONS = [
  'ANNOTATION_CREATED',
  'ANNOTATION_UPDATED',
  'ANNOTATION_DELETED',
]

export const EXPECTED_ARCHIVED_AUDIT_ACTIONS = ['ANNOTATION_CREATED', 'ANNOTATION_DELETED']
export const EXPECTED_GATEWAY_AUDIT_ACTIONS = [
  'ANNOTATION_CREATED',
  'ANNOTATION_UPDATED',
  'ANNOTATION_DELETED',
]

// createAnnotationP1SmokeSeed builds isolated local inputs for one repeatable Annotation P1 live smoke.
export function createAnnotationP1SmokeSeed(now = Date.now()) {
  return {
    activeAccountId: randomUUID(),
    archivedAccountId: randomUUID(),
    authorAccountId:
      process.env.COLLABORATION_ANNOTATION_SMOKE_AUTHOR_ACCOUNT_ID ||
      '00000000-0000-4000-8000-000000000911',
    managerAccountId:
      process.env.COLLABORATION_ANNOTATION_SMOKE_MANAGER_ACCOUNT_ID ||
      '00000000-0000-4000-8000-000000000912',
    marker: `collaboration Annotation P1 smoke ${now}`,
    tenantId:
      process.env.COLLABORATION_ANNOTATION_SMOKE_TENANT_ID ||
      '00000000-0000-4000-8000-000000000001',
    traceId: `annotation-p1-smoke-${now}`,
  }
}

// runCollaborationAnnotationP1GatewaySmokeFlow verifies the authenticated BFF HTTP path for author-owned notes.
export async function runCollaborationAnnotationP1GatewaySmokeFlow({ annotations, auditStore, fixtureStore }, seed) {
  await fixtureStore.prepare(seed)

  const activeObjectRef = objectRef(seed.activeAccountId)
  const archivedObjectRef = objectRef(seed.archivedAccountId)

  const created = await annotations.createAnnotation({
    objectRef: activeObjectRef,
    bodyText: `${seed.marker} gateway note`,
    visibility: ANNOTATION_VISIBILITY_OBJECT_VISIBLE,
  })
  const annotationId = requireAnnotationId(created, 'gateway create')

  const listed = await annotations.listAnnotationsForObject({
    objectRef: activeObjectRef,
    includePrivate: true,
    page: 1,
    pageSize: 20,
  })
  assertListContains(listed, annotationId, 'gateway list contains created note')

  const updated = await annotations.updateAnnotation({
    annotationId,
    bodyText: `${seed.marker} gateway note updated`,
    visibility: ANNOTATION_VISIBILITY_PRIVATE,
  })
  if (!updated.annotation?.edited || updated.annotation?.visibility !== 'PRIVATE') {
    throw new Error('Annotation P1 gateway smoke expected update to mark edited private note.')
  }

  await annotations.deleteAnnotation({
    annotationId,
    deleteReason: 'Annotation P1 gateway smoke delete',
  })
  const afterDelete = await annotations.listAnnotationsForObject({
    objectRef: activeObjectRef,
    includePrivate: true,
    page: 1,
    pageSize: 20,
  })
  assertListNotContains(afterDelete, annotationId, 'gateway list hides deleted note')

  await fixtureStore.archiveCrmAccount(seed.archivedAccountId)
  await expectRejected(
    annotations.createAnnotation({
      objectRef: archivedObjectRef,
      bodyText: `${seed.marker} gateway archived create denied`,
      visibility: ANNOTATION_VISIBILITY_OBJECT_VISIBLE,
    }),
    'gateway archived object blocks create',
  )

  const auditActions = await auditStore.readAnnotationAuditActions(annotationId)
  assertSequence('gateway audit actions', auditActions, EXPECTED_GATEWAY_AUDIT_ACTIONS)

  return {
    activeAccountId: seed.activeAccountId,
    archivedAccountId: seed.archivedAccountId,
    auditActions,
    deniedChecks: {
      archivedCreate: true,
    },
    listChecks: {
      createdVisible: true,
      deletedHidden: true,
    },
    marker: seed.marker,
    mode: 'gateway',
    notes: {
      annotationId,
    },
  }
}

// objectRef returns the frozen Annotation P1 owner reference shape for CRM accounts.
function objectRef(objectId) {
  return {
    objectOwnerService: 'crm-service',
    objectType: 'CrmAccount',
    objectId,
  }
}

// requireAnnotationId fails fast when the command response does not contain a stable note id.
function requireAnnotationId(response, label) {
  const annotationId = response.annotation?.annotationId
  if (!annotationId) {
    throw new Error(`Annotation P1 smoke ${label} response did not contain annotation.annotationId.`)
  }
  return annotationId
}

// expectRejected asserts that a forbidden or failed-precondition branch is actually enforced.
async function expectRejected(promise, label) {
  try {
    await promise
  } catch (_error) {
    return
  }
  throw new Error(`Annotation P1 smoke expected rejection for: ${label}.`)
}

// assertListContains verifies that a list response exposes an expected note id.
function assertListContains(response, annotationId, label) {
  if (!(response.items ?? []).some((item) => item.annotationId === annotationId)) {
    throw new Error(`Annotation P1 smoke list check failed: ${label}.`)
  }
}

// assertListNotContains verifies that visibility or soft deletion hides an expected note id.
function assertListNotContains(response, annotationId, label) {
  if ((response.items ?? []).some((item) => item.annotationId === annotationId)) {
    throw new Error(`Annotation P1 smoke list check failed: ${label}.`)
  }
}

// assertPinnedFirst verifies the frozen pinned-first ordering rule for object note lists.
function assertPinnedFirst(response, annotationId) {
  const first = response.items?.[0]
  if (first?.annotationId !== annotationId || !first.pinned) {
    throw new Error('Annotation P1 smoke expected the pinned note to be first in list order.')
  }
}

// assertSequence fails fast when persisted audit side effects drift from the frozen P1 command contract.
function assertSequence(label, actual, expected) {
  const normalizedActual = actual ?? []
  if (
    normalizedActual.length !== expected.length ||
    normalizedActual.some((value, index) => value !== expected[index])
  ) {
    throw new Error(
      `${label} mismatch. expected=${JSON.stringify(expected)} actual=${JSON.stringify(
        normalizedActual,
      )}`,
    )
  }
}
