import { requestClient } from '#/api/request'

export namespace CollaborationAnnotationApi {
  export type AnnotationVisibility = 'PRIVATE' | 'OBJECT_VISIBLE'

  export interface ObjectRef {
    objectOwnerService: string
    objectType: string
    objectId: string
  }

  export interface ObjectDisplaySnapshot {
    title?: string
    subtitle?: string
    status?: string
  }

  export interface AnnotationView {
    annotationId: string
    tenantId: string
    objectRef: ObjectRef
    objectDisplaySnapshot: ObjectDisplaySnapshot
    authorAccountId: string
    authorDisplayNameSnapshot: string
    bodyText: string
    visibility: AnnotationVisibility | string
    pinned: boolean
    edited: boolean
    createdAt: string
    updatedAt: string
  }

  export interface ListAnnotationsQuery {
    includePrivate?: boolean
    page?: number
    pageSize?: number
  }

  export interface ListAnnotationsResult {
    items: AnnotationView[]
    page: number
    pageSize: number
    total: number
  }

  export interface AnnotationResponse {
    annotation: AnnotationView
  }

  export interface CreateAnnotationPayload {
    bodyText: string
    visibility?: AnnotationVisibility
  }

  export interface UpdateAnnotationPayload {
    bodyText?: string
    visibility?: AnnotationVisibility
  }
}

const objectAnnotationBase = (objectRef: CollaborationAnnotationApi.ObjectRef) =>
  `/collaboration/objects/${encodeURIComponent(objectRef.objectOwnerService)}/${encodeURIComponent(objectRef.objectType)}/${encodeURIComponent(objectRef.objectId)}/annotations`

/** listCollaborationAnnotationsApi lists Annotation P1 notes through the Gateway BFF. */
export async function listCollaborationAnnotationsApi(
  objectRef: CollaborationAnnotationApi.ObjectRef,
  params: CollaborationAnnotationApi.ListAnnotationsQuery = {}
) {
  return requestClient.get<CollaborationAnnotationApi.ListAnnotationsResult>(
    objectAnnotationBase(objectRef),
    { params }
  )
}

/** createCollaborationAnnotationApi creates one pure-text object note. */
export async function createCollaborationAnnotationApi(
  objectRef: CollaborationAnnotationApi.ObjectRef,
  data: CollaborationAnnotationApi.CreateAnnotationPayload
) {
  return requestClient.post<CollaborationAnnotationApi.AnnotationResponse>(
    objectAnnotationBase(objectRef),
    data
  )
}

/** updateCollaborationAnnotationApi updates an author-owned note. */
export async function updateCollaborationAnnotationApi(
  annotationId: string,
  data: CollaborationAnnotationApi.UpdateAnnotationPayload
) {
  return requestClient.request<CollaborationAnnotationApi.AnnotationResponse>(
    `/collaboration/annotations/${encodeURIComponent(annotationId)}`,
    { data, method: 'PATCH' }
  )
}

/** deleteCollaborationAnnotationApi soft-deletes one note. */
export async function deleteCollaborationAnnotationApi(annotationId: string, deleteReason?: string) {
  return requestClient.request<CollaborationAnnotationApi.AnnotationResponse>(
    `/collaboration/annotations/${encodeURIComponent(annotationId)}`,
    { data: { deleteReason }, method: 'DELETE' }
  )
}

/** setCollaborationAnnotationPinnedApi sets object-level note pin state. */
export async function setCollaborationAnnotationPinnedApi(annotationId: string, pinned: boolean) {
  return requestClient.request<CollaborationAnnotationApi.AnnotationResponse>(
    `/collaboration/annotations/${encodeURIComponent(annotationId)}/pinned`,
    { data: { pinned }, method: 'PATCH' }
  )
}
