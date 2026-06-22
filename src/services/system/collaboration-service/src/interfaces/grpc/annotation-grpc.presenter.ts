import {
  AnnotationView,
  AnnotationVisibility as ProtoAnnotationVisibility
} from '@oes/common/generated/collaboration_service'
import { AnnotationEntity } from '../../domain/entities/annotation.entity'
import { AnnotationVisibility } from '../../domain/value-objects/annotation.enums'

/** presentAnnotation maps an Annotation aggregate to the gRPC AnnotationView contract. */
export function presentAnnotation(annotation: AnnotationEntity): AnnotationView {
  return {
    annotationId: annotation.id,
    tenantId: annotation.tenantId,
    objectRef: {
      objectOwnerService: annotation.objectOwnerService,
      objectType: annotation.objectType,
      objectId: annotation.objectId
    },
    objectDisplaySnapshot: {
      title: annotation.objectDisplayTitle ?? undefined,
      subtitle: annotation.objectDisplaySubtitle ?? undefined,
      status: annotation.objectDisplayStatus ?? undefined
    },
    authorAccountId: annotation.authorAccountId,
    authorDisplayNameSnapshot: annotation.authorDisplayNameSnapshot,
    bodyText: annotation.bodyText,
    visibility: toProtoVisibility(annotation.visibility),
    pinned: annotation.pinned,
    edited: annotation.edited,
    createdAt: annotation.createdAt.toISOString(),
    updatedAt: annotation.updatedAt.toISOString()
  }
}

/** toProtoVisibility maps domain visibility to generated gRPC enum values. */
export function toProtoVisibility(value: AnnotationVisibility): ProtoAnnotationVisibility {
  return value === AnnotationVisibility.PRIVATE
    ? ProtoAnnotationVisibility.ANNOTATION_VISIBILITY_PRIVATE
    : ProtoAnnotationVisibility.ANNOTATION_VISIBILITY_OBJECT_VISIBLE
}
