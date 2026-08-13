import {
  BadRequestException,
  ForbiddenException,
  InternalServerErrorException,
  NotFoundException,
  PreconditionFailedException
} from '@nestjs/common'
import { getAuthenticatedGrpcRequestContext } from '@oes/common/authorization'
import {
  AnnotationVisibility as ProtoAnnotationVisibility,
  ObjectRef
} from '@oes/common/generated/collaboration_service'
import {
  ANNOTATION_FAILED_PRECONDITION,
  ANNOTATION_INVALID_ARGUMENT,
  ANNOTATION_NOT_FOUND,
  ANNOTATION_PERMISSION_DENIED,
  AnnotationDomainError
} from '../../common/errors/annotation.errors'
import { AnnotationVisibility } from '../../domain/value-objects/annotation.enums'

export type AnnotationGrpcCommandContext = {
  tenantId: string
  operatorAccountId: string
  traceId: string
  auditId?: string
}

/** requireAnnotationCommandContext validates Annotation P1 command context fields from gRPC requests. */
export function requireAnnotationCommandContext(input: object): AnnotationGrpcCommandContext {
  const context = requireAnnotationQueryContext(input)
  const trusted = getAuthenticatedGrpcRequestContext(input)
  return {
    ...context,
    auditId: requireText((trusted as ({ requestId?: string } | undefined))?.requestId, 'trusted request')
  }
}

/** requireAnnotationQueryContext validates Annotation P1 query context fields from gRPC requests. */
export function requireAnnotationQueryContext(input: object): Omit<AnnotationGrpcCommandContext, 'auditId'> {
  const context = getAuthenticatedGrpcRequestContext(input)
  const token = context?.verifiedExecutionToken
  return {
    tenantId: requireText(token?.tenantId, 'trusted tenant'),
    operatorAccountId: requireText(token?.subject, 'trusted subject'),
    traceId: requireText((context as ({ traceId?: string } | undefined))?.traceId, 'trusted trace')
  }
}

/** fromProtoAnnotationVisibility maps generated visibility values to domain visibility. */
export function fromProtoAnnotationVisibility(
  value?: ProtoAnnotationVisibility
): AnnotationVisibility | undefined {
  if (value === undefined || value === ProtoAnnotationVisibility.ANNOTATION_VISIBILITY_UNSPECIFIED) {
    return undefined
  }
  if (value === ProtoAnnotationVisibility.ANNOTATION_VISIBILITY_PRIVATE) {
    return AnnotationVisibility.PRIVATE
  }
  if (value === ProtoAnnotationVisibility.ANNOTATION_VISIBILITY_OBJECT_VISIBLE) {
    return AnnotationVisibility.OBJECT_VISIBLE
  }
  throw new BadRequestException('visibility is invalid')
}

/** fromProtoObjectRef maps gRPC object refs to application DTO shape. */
export function fromProtoObjectRef(value?: ObjectRef) {
  return {
    objectOwnerService: value?.objectOwnerService ?? '',
    objectType: value?.objectType ?? '',
    objectId: value?.objectId ?? ''
  }
}

/** mapAnnotationError converts domain errors to Nest exceptions consumed by the gRPC exception filter. */
export function mapAnnotationError(error: unknown): never {
  if (error instanceof AnnotationDomainError) {
    if (error.code === ANNOTATION_NOT_FOUND) throw new NotFoundException(error.message)
    if (error.code === ANNOTATION_PERMISSION_DENIED) throw new ForbiddenException(error.message)
    if (error.code === ANNOTATION_FAILED_PRECONDITION) {
      throw new PreconditionFailedException(error.message)
    }
    if (error.code === ANNOTATION_INVALID_ARGUMENT) throw new BadRequestException(error.message)
  }
  throw error instanceof Error ? error : new InternalServerErrorException('annotation operation failed')
}

/** requireText trims required gRPC scalar strings and rejects blanks. */
function requireText(value: string | undefined, fieldName: string): string {
  const normalized = normalizeText(value)
  if (!normalized) throw new BadRequestException(`${fieldName} is required`)
  return normalized
}

/** normalizeText trims optional gRPC scalar strings and returns undefined for blanks. */
function normalizeText(value: string | undefined): string | undefined {
  const normalized = value?.trim()
  return normalized ? normalized : undefined
}
