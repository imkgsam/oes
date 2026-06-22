import type { CollaborationAnnotationApi } from '#/api'

export interface CollaborationObjectContext {
  archived?: boolean
  displayName?: string
  objectRef: CollaborationAnnotationApi.ObjectRef
}
