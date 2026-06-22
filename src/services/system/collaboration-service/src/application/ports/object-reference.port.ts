import { AnnotationObjectRefDto } from '../dtos/annotation.dto'

export enum ObjectReferenceCapability {
  READ = 'READ',
  CREATE_ANNOTATION = 'CREATE_ANNOTATION',
  MUTATE_ANNOTATION = 'MUTATE_ANNOTATION'
}

export type ObjectReferenceValidation = {
  objectRef: AnnotationObjectRefDto
  exists: boolean
  readable: boolean
  capabilityAllowed: boolean
  lifecycle: 'ACTIVE' | 'ARCHIVED' | 'DELETED_OR_UNAVAILABLE'
  displaySnapshot: {
    title?: string | null
    subtitle?: string | null
    status?: string | null
  }
  denyReason?: string
}

/** ObjectReferencePort validates owner object existence, read access, lifecycle, and capability. */
export interface ObjectReferencePort {
  validate(input: {
    tenantId: string
    operatorAccountId: string
    traceId: string
    objectRef: AnnotationObjectRefDto
    capability: ObjectReferenceCapability
  }): Promise<ObjectReferenceValidation>
}

export const OBJECT_REFERENCE_PORT = Symbol('OBJECT_REFERENCE_PORT')
