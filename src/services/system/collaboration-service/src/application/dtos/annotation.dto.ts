import { AnnotationVisibility } from '../../domain/value-objects/annotation.enums'

export type AnnotationObjectRefDto = {
  objectOwnerService: string
  objectType: string
  objectId: string
}

export type AnnotationCommandContext = {
  tenantId: string
  operatorAccountId: string
  operatorDisplayName?: string
  traceId: string
  auditId?: string
  now?: Date
}

export type CreateAnnotationInput = AnnotationCommandContext & {
  objectRef: AnnotationObjectRefDto
  bodyText: string
  visibility?: AnnotationVisibility
}

export type UpdateAnnotationInput = AnnotationCommandContext & {
  annotationId: string
  bodyText?: string
  visibility?: AnnotationVisibility
}

export type DeleteAnnotationInput = AnnotationCommandContext & {
  annotationId: string
  deleteReason?: string | null
}

export type SetAnnotationPinnedInput = AnnotationCommandContext & {
  annotationId: string
  pinned: boolean
}

export type ListAnnotationsForObjectInput = Omit<AnnotationCommandContext, 'auditId' | 'now'> & {
  objectRef: AnnotationObjectRefDto
  includePrivate?: boolean
  page?: number
  pageSize?: number
}

export type GetAnnotationInput = Omit<AnnotationCommandContext, 'auditId' | 'now'> & {
  annotationId: string
}

export type AnnotationListResultDto = {
  items: import('../../domain/entities/annotation.entity').AnnotationEntity[]
  page: number
  pageSize: number
  total: number
}
