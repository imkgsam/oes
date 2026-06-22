import {
  AnnotationView,
  AnnotationVisibility as ProtoAnnotationVisibility
} from '@oes/common/generated/collaboration_service'

/** mapAnnotationView maps collaboration-service AnnotationView messages to gateway JSON DTOs. */
export function mapAnnotationView(annotation: AnnotationView | undefined) {
  if (!annotation) return undefined
  return {
    annotationId: annotation.annotationId ?? '',
    tenantId: annotation.tenantId ?? '',
    objectRef: {
      objectOwnerService: annotation.objectRef?.objectOwnerService ?? '',
      objectType: annotation.objectRef?.objectType ?? '',
      objectId: annotation.objectRef?.objectId ?? ''
    },
    objectDisplaySnapshot: {
      title: annotation.objectDisplaySnapshot?.title ?? '',
      subtitle: annotation.objectDisplaySnapshot?.subtitle ?? '',
      status: annotation.objectDisplaySnapshot?.status ?? ''
    },
    authorAccountId: annotation.authorAccountId ?? '',
    authorDisplayNameSnapshot: annotation.authorDisplayNameSnapshot ?? '',
    bodyText: annotation.bodyText ?? '',
    visibility: mapVisibility(annotation.visibility),
    pinned: Boolean(annotation.pinned),
    edited: Boolean(annotation.edited),
    createdAt: annotation.createdAt,
    updatedAt: annotation.updatedAt
  }
}

/** toProtoAnnotationVisibility maps gateway visibility input to gRPC enum values. */
export function toProtoAnnotationVisibility(value?: string): ProtoAnnotationVisibility | undefined {
  if (!value) return undefined
  if (value === 'PRIVATE') return ProtoAnnotationVisibility.ANNOTATION_VISIBILITY_PRIVATE
  if (value === 'OBJECT_VISIBLE') {
    return ProtoAnnotationVisibility.ANNOTATION_VISIBILITY_OBJECT_VISIBLE
  }
  return ProtoAnnotationVisibility.ANNOTATION_VISIBILITY_UNSPECIFIED
}

/** mapVisibility maps gRPC visibility enum values to stable gateway strings. */
function mapVisibility(value?: ProtoAnnotationVisibility) {
  return value === ProtoAnnotationVisibility.ANNOTATION_VISIBILITY_PRIVATE
    ? 'PRIVATE'
    : 'OBJECT_VISIBLE'
}
