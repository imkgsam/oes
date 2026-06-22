export type AnnotationAuditAction =
  | 'ANNOTATION_CREATED'
  | 'ANNOTATION_UPDATED'
  | 'ANNOTATION_DELETED'
  | 'ANNOTATION_PINNED_CHANGED'

export type AnnotationAuditRecord = {
  tenantId: string
  annotationId: string
  action: AnnotationAuditAction
  result: 'SUCCEEDED' | 'REJECTED' | 'FAILED'
  operatorAccountId: string
  authorAccountId: string
  objectOwnerService: string
  objectType: string
  objectId: string
  traceId?: string
  auditId?: string
  reasonSnapshot?: string
  payload?: Record<string, unknown>
}

/** AnnotationAuditPort records local command audit envelopes for Annotation P1. */
export interface AnnotationAuditPort {
  record(input: AnnotationAuditRecord): Promise<void>
}

export const ANNOTATION_AUDIT_PORT = Symbol('ANNOTATION_AUDIT_PORT')
