export const ANNOTATION_NOT_FOUND = 'ANNOTATION_NOT_FOUND'
export const ANNOTATION_PERMISSION_DENIED = 'ANNOTATION_PERMISSION_DENIED'
export const ANNOTATION_INVALID_ARGUMENT = 'ANNOTATION_INVALID_ARGUMENT'
export const ANNOTATION_FAILED_PRECONDITION = 'ANNOTATION_FAILED_PRECONDITION'

/** AnnotationDomainError carries stable Annotation P1 error codes across layers. */
export class AnnotationDomainError extends Error {
  constructor(
    public readonly code: string,
    message: string
  ) {
    super(message)
  }
}

/** AnnotationNotFoundError reports a missing or ordinary-query-hidden note. */
export class AnnotationNotFoundError extends AnnotationDomainError {
  constructor(message = 'annotation not found') {
    super(ANNOTATION_NOT_FOUND, message)
  }
}

/** AnnotationPermissionDeniedError reports author, visibility, or capability rule failures. */
export class AnnotationPermissionDeniedError extends AnnotationDomainError {
  constructor(message = 'annotation permission denied') {
    super(ANNOTATION_PERMISSION_DENIED, message)
  }
}

/** AnnotationInvalidArgumentError reports invalid Annotation P1 input. */
export class AnnotationInvalidArgumentError extends AnnotationDomainError {
  constructor(message = 'annotation input is invalid') {
    super(ANNOTATION_INVALID_ARGUMENT, message)
  }
}

/** AnnotationFailedPreconditionError reports target lifecycle states that block mutation. */
export class AnnotationFailedPreconditionError extends AnnotationDomainError {
  constructor(message = 'annotation precondition failed') {
    super(ANNOTATION_FAILED_PRECONDITION, message)
  }
}
