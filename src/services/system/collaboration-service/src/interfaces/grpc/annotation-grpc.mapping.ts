import {
  BadRequestException,
  ForbiddenException,
  InternalServerErrorException,
  NotFoundException,
  PreconditionFailedException
} from '@nestjs/common'
import {
  AnnotationVisibility as ProtoAnnotationVisibility,
  AuditContext,
  ObjectRef,
  OperatorContext,
  TraceContext
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
  operatorDisplayName?: string
  traceId: string
  auditId?: string
}

/** requireAnnotationCommandContext validates Annotation P1 command context fields from gRPC requests. */
export function requireAnnotationCommandContext(input: {
  tenantId?: string
  operatorContext?: OperatorContext
  traceContext?: TraceContext
  auditContext?: AuditContext
}): AnnotationGrpcCommandContext {
  const context = requireAnnotationQueryContext(input)
  if (!input.auditContext) {
    throw new BadRequestException('audit_context is required')
  }
  return {
    ...context,
    auditId: normalizeText(input.auditContext.auditId)
  }
}

/** requireAnnotationQueryContext validates Annotation P1 query context fields from gRPC requests. */
export function requireAnnotationQueryContext(input: {
  tenantId?: string
  operatorContext?: OperatorContext
  traceContext?: TraceContext
}): Omit<AnnotationGrpcCommandContext, 'auditId'> {
  return {
    tenantId: requireText(input.tenantId, 'tenant_id'),
    operatorAccountId: requireText(input.operatorContext?.accountId, 'operator_context.account_id'),
    operatorDisplayName: normalizeText(input.operatorContext?.displayName),
    traceId: requireText(input.traceContext?.traceId, 'trace_context.trace_id')
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
