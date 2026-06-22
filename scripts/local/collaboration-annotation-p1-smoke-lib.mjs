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

// runCollaborationAnnotationP1SmokeFlow drives the frozen Annotation P1 command/query contract over live gRPC.
export async function runCollaborationAnnotationP1SmokeFlow({ annotations, auditStore, fixtureStore }, seed) {
  await fixtureStore.prepare(seed)

  const activeObjectRef = objectRef(seed.activeAccountId)
  const archivedObjectRef = objectRef(seed.archivedAccountId)

  const visibleCreated = await annotations.createAnnotation({
    ...commandContext(seed, seed.authorAccountId, 'create-visible'),
    objectRef: activeObjectRef,
    bodyText: `${seed.marker} visible note`,
    visibility: ANNOTATION_VISIBILITY_OBJECT_VISIBLE,
  })
  const visibleAnnotationId = requireAnnotationId(visibleCreated, 'visible create')

  const privateCreated = await annotations.createAnnotation({
    ...commandContext(seed, seed.authorAccountId, 'create-private'),
    objectRef: activeObjectRef,
    bodyText: `${seed.marker} private note`,
    visibility: ANNOTATION_VISIBILITY_PRIVATE,
  })
  const privateAnnotationId = requireAnnotationId(privateCreated, 'private create')

  await expectRejected(
    annotations.updateAnnotation({
      ...commandContext(seed, seed.managerAccountId, 'manager-edit-denied'),
      annotationId: visibleAnnotationId,
      bodyText: `${seed.marker} manager should not edit`,
      visibility: ANNOTATION_VISIBILITY_OBJECT_VISIBLE,
    }),
    'manager cannot edit another author note',
  )

  const pinned = await annotations.setAnnotationPinned({
    ...commandContext(seed, seed.managerAccountId, 'manager-pin'),
    annotationId: visibleAnnotationId,
    pinned: true,
  })
  if (!pinned.annotation?.pinned) {
    throw new Error('Annotation P1 smoke expected manager pin to set pinned=true.')
  }

  const authorListBeforeDelete = await annotations.listAnnotationsForObject({
    ...queryContext(seed, seed.authorAccountId),
    objectRef: activeObjectRef,
    includePrivate: true,
    page: 1,
    pageSize: 20,
  })
  assertListContains(authorListBeforeDelete, visibleAnnotationId, 'author list contains visible note')
  assertListContains(authorListBeforeDelete, privateAnnotationId, 'author list contains private note')
  assertPinnedFirst(authorListBeforeDelete, visibleAnnotationId)

  const managerList = await annotations.listAnnotationsForObject({
    ...queryContext(seed, seed.managerAccountId),
    objectRef: activeObjectRef,
    includePrivate: true,
    page: 1,
    pageSize: 20,
  })
  assertListContains(managerList, visibleAnnotationId, 'manager list contains object-visible note')
  assertListNotContains(managerList, privateAnnotationId, 'manager list hides another author private note')

  const updatedPrivate = await annotations.updateAnnotation({
    ...commandContext(seed, seed.authorAccountId, 'author-update-private'),
    annotationId: privateAnnotationId,
    bodyText: `${seed.marker} private note updated`,
    visibility: ANNOTATION_VISIBILITY_PRIVATE,
  })
  if (!updatedPrivate.annotation?.edited) {
    throw new Error('Annotation P1 smoke expected own-note update to mark edited=true.')
  }

  await annotations.deleteAnnotation({
    ...commandContext(seed, seed.authorAccountId, 'author-delete-private'),
    annotationId: privateAnnotationId,
    deleteReason: 'Annotation P1 smoke author delete',
  })

  const authorListAfterDelete = await annotations.listAnnotationsForObject({
    ...queryContext(seed, seed.authorAccountId),
    objectRef: activeObjectRef,
    includePrivate: true,
    page: 1,
    pageSize: 20,
  })
  assertListNotContains(authorListAfterDelete, privateAnnotationId, 'ordinary list hides soft-deleted note')

  const archivedCreated = await annotations.createAnnotation({
    ...commandContext(seed, seed.authorAccountId, 'create-before-archive'),
    objectRef: archivedObjectRef,
    bodyText: `${seed.marker} archived governance note`,
    visibility: ANNOTATION_VISIBILITY_OBJECT_VISIBLE,
  })
  const archivedAnnotationId = requireAnnotationId(archivedCreated, 'archived pre-create')
  await fixtureStore.archiveCrmAccount(seed.archivedAccountId)

  const archivedList = await annotations.listAnnotationsForObject({
    ...queryContext(seed, seed.authorAccountId),
    objectRef: archivedObjectRef,
    includePrivate: true,
    page: 1,
    pageSize: 20,
  })
  assertListContains(archivedList, archivedAnnotationId, 'archived readable object still lists notes')

  await expectRejected(
    annotations.createAnnotation({
      ...commandContext(seed, seed.authorAccountId, 'create-archived-denied'),
      objectRef: archivedObjectRef,
      bodyText: `${seed.marker} should not be created on archived object`,
      visibility: ANNOTATION_VISIBILITY_OBJECT_VISIBLE,
    }),
    'archived object blocks create',
  )

  await expectRejected(
    annotations.updateAnnotation({
      ...commandContext(seed, seed.authorAccountId, 'update-archived-denied'),
      annotationId: archivedAnnotationId,
      bodyText: `${seed.marker} archived update denied`,
      visibility: ANNOTATION_VISIBILITY_OBJECT_VISIBLE,
    }),
    'archived object blocks edit',
  )

  await expectRejected(
    annotations.setAnnotationPinned({
      ...commandContext(seed, seed.managerAccountId, 'pin-archived-denied'),
      annotationId: archivedAnnotationId,
      pinned: true,
    }),
    'archived object blocks pin',
  )

  const governanceDeleted = await annotations.deleteAnnotation({
    ...commandContext(seed, seed.managerAccountId, 'manager-delete-archived'),
    annotationId: archivedAnnotationId,
    deleteReason: 'Annotation P1 smoke governance delete on archived object',
  })
  if (!governanceDeleted.annotation?.updatedAt) {
    throw new Error('Annotation P1 smoke expected governance delete response to include the note snapshot.')
  }

  const visibleSideEffects = await auditStore.readAnnotationAuditActions(visibleAnnotationId)
  const privateSideEffects = await auditStore.readAnnotationAuditActions(privateAnnotationId)
  const archivedSideEffects = await auditStore.readAnnotationAuditActions(archivedAnnotationId)
  assertSequence('visible audit actions', visibleSideEffects, EXPECTED_VISIBLE_AUDIT_ACTIONS)
  assertSequence('private audit actions', privateSideEffects, EXPECTED_PRIVATE_AUDIT_ACTIONS)
  assertSequence('archived audit actions', archivedSideEffects, EXPECTED_ARCHIVED_AUDIT_ACTIONS)

  return {
    activeAccountId: seed.activeAccountId,
    archivedAccountId: seed.archivedAccountId,
    auditActions: {
      archived: archivedSideEffects,
      private: privateSideEffects,
      visible: visibleSideEffects,
    },
    deniedChecks: {
      archivedCreate: true,
      archivedEdit: true,
      archivedPin: true,
      managerEditOtherAuthor: true,
    },
    listChecks: {
      authorCanSeePrivate: true,
      deletedHidden: true,
      managerCannotSeeAuthorPrivate: true,
      pinnedFirst: true,
    },
    marker: seed.marker,
    notes: {
      archivedAnnotationId,
      privateAnnotationId,
      visibleAnnotationId,
    },
  }
}

// runCollaborationAnnotationP1GatewaySmokeFlow verifies the authenticated BFF HTTP path for author-owned notes.
export async function runCollaborationAnnotationP1GatewaySmokeFlow({ annotations, auditStore, fixtureStore }, seed) {
  await fixtureStore.prepare(seed)

  const activeObjectRef = objectRef(seed.activeAccountId)
  const archivedObjectRef = objectRef(seed.archivedAccountId)

  const created = await annotations.createAnnotation({
    ...commandContext(seed, seed.authorAccountId, 'gateway-create'),
    objectRef: activeObjectRef,
    bodyText: `${seed.marker} gateway note`,
    visibility: ANNOTATION_VISIBILITY_OBJECT_VISIBLE,
  })
  const annotationId = requireAnnotationId(created, 'gateway create')

  const listed = await annotations.listAnnotationsForObject({
    ...queryContext(seed, seed.authorAccountId),
    objectRef: activeObjectRef,
    includePrivate: true,
    page: 1,
    pageSize: 20,
  })
  assertListContains(listed, annotationId, 'gateway list contains created note')

  const updated = await annotations.updateAnnotation({
    ...commandContext(seed, seed.authorAccountId, 'gateway-update'),
    annotationId,
    bodyText: `${seed.marker} gateway note updated`,
    visibility: ANNOTATION_VISIBILITY_PRIVATE,
  })
  if (!updated.annotation?.edited || updated.annotation?.visibility !== 'PRIVATE') {
    throw new Error('Annotation P1 gateway smoke expected update to mark edited private note.')
  }

  await annotations.deleteAnnotation({
    ...commandContext(seed, seed.authorAccountId, 'gateway-delete'),
    annotationId,
    deleteReason: 'Annotation P1 gateway smoke delete',
  })
  const afterDelete = await annotations.listAnnotationsForObject({
    ...queryContext(seed, seed.authorAccountId),
    objectRef: activeObjectRef,
    includePrivate: true,
    page: 1,
    pageSize: 20,
  })
  assertListNotContains(afterDelete, annotationId, 'gateway list hides deleted note')

  await fixtureStore.archiveCrmAccount(seed.archivedAccountId)
  await expectRejected(
    annotations.createAnnotation({
      ...commandContext(seed, seed.authorAccountId, 'gateway-archived-create-denied'),
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

// commandContext creates the required tenant, operator, trace, and audit context for one write call.
function commandContext(seed, operatorAccountId, auditSuffix) {
  return {
    tenantId: seed.tenantId,
    operatorContext: {
      accountId: operatorAccountId,
      tenantId: seed.tenantId,
      userId: operatorAccountId,
    },
    traceContext: {
      traceId: `${seed.traceId}-${auditSuffix}`,
    },
    auditContext: {
      auditId: `${seed.traceId}-${auditSuffix}`,
      reason: 'Annotation P1 live smoke',
      source: 'scripts/local/collaboration-annotation-p1-smoke.mjs',
    },
  }
}

// queryContext creates the required tenant, operator, and trace context for one read call.
function queryContext(seed, operatorAccountId) {
  return {
    tenantId: seed.tenantId,
    operatorContext: {
      accountId: operatorAccountId,
      tenantId: seed.tenantId,
      userId: operatorAccountId,
    },
    traceContext: {
      traceId: `${seed.traceId}-query`,
    },
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
