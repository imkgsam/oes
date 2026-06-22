import {
  AnnotationFailedPreconditionError,
  AnnotationInvalidArgumentError,
  AnnotationPermissionDeniedError
} from '../../common/errors/annotation.errors'
import { AnnotationVisibility } from '../value-objects/annotation.enums'

export type AnnotationEntityProps = {
  id: string
  tenantId: string
  objectOwnerService: string
  objectType: string
  objectId: string
  objectDisplayTitle: string | null
  objectDisplaySubtitle: string | null
  objectDisplayStatus: string | null
  authorAccountId: string
  authorDisplayNameSnapshot: string
  bodyText: string
  visibility: AnnotationVisibility
  pinned: boolean
  edited: boolean
  deletedAt: Date | null
  deletedByAccountId: string | null
  deleteReason: string | null
  createdAt: Date
  updatedAt: Date
}

/** AnnotationEntity enforces P1 note content, visibility, author, pin, and soft-delete invariants. */
export class AnnotationEntity {
  constructor(private readonly props: AnnotationEntityProps) {
    this.assertValidCoreFields(props)
  }

  get id() {
    return this.props.id
  }

  get tenantId() {
    return this.props.tenantId
  }

  get objectOwnerService() {
    return this.props.objectOwnerService
  }

  get objectType() {
    return this.props.objectType
  }

  get objectId() {
    return this.props.objectId
  }

  get objectDisplayTitle() {
    return this.props.objectDisplayTitle
  }

  get objectDisplaySubtitle() {
    return this.props.objectDisplaySubtitle
  }

  get objectDisplayStatus() {
    return this.props.objectDisplayStatus
  }

  get authorAccountId() {
    return this.props.authorAccountId
  }

  get authorDisplayNameSnapshot() {
    return this.props.authorDisplayNameSnapshot
  }

  get bodyText() {
    return this.props.bodyText
  }

  get visibility() {
    return this.props.visibility
  }

  get pinned() {
    return this.props.pinned
  }

  get edited() {
    return this.props.edited
  }

  get deletedAt() {
    return this.props.deletedAt
  }

  get deletedByAccountId() {
    return this.props.deletedByAccountId
  }

  get deleteReason() {
    return this.props.deleteReason
  }

  get createdAt() {
    return this.props.createdAt
  }

  get updatedAt() {
    return this.props.updatedAt
  }

  /** snapshot returns a detached copy suitable for persistence and presenters. */
  snapshot(): AnnotationEntityProps {
    return { ...this.props }
  }

  /** canRead applies P1 note visibility after the owner object has been validated readable. */
  canRead(operatorAccountId: string): boolean {
    if (this.isDeleted()) return false
    return (
      this.props.visibility === AnnotationVisibility.OBJECT_VISIBLE ||
      this.props.authorAccountId === operatorAccountId
    )
  }

  /** isDeleted reports whether the note has been soft-deleted. */
  isDeleted(): boolean {
    return Boolean(this.props.deletedAt)
  }

  /** updateContent lets authors change note text or visibility while preserving authorship. */
  updateContent(
    operatorAccountId: string,
    input: { bodyText?: string; visibility?: AnnotationVisibility },
    now = new Date()
  ): void {
    this.assertNotDeleted()
    this.assertAuthor(operatorAccountId)
    let changed = false
    if (input.bodyText !== undefined) {
      const normalized = normalizeRequiredText(input.bodyText, 'bodyText')
      if (normalized !== this.props.bodyText) {
        this.props.bodyText = normalized
        changed = true
      }
    }
    if (input.visibility !== undefined) {
      requireVisibility(input.visibility)
      if (input.visibility !== this.props.visibility) {
        this.props.visibility = input.visibility
        changed = true
      }
    }
    if (!changed) {
      throw new AnnotationInvalidArgumentError('at least one annotation field must change')
    }
    this.props.edited = true
    this.touch(now)
  }

  /** softDelete marks the note deleted without destroying note truth or original authorship. */
  softDelete(operatorAccountId: string, canManage: boolean, reason: string | null, now = new Date()): void {
    if (!canManage && this.props.authorAccountId !== operatorAccountId) {
      throw new AnnotationPermissionDeniedError('only author or annotation manager can delete note')
    }
    if (this.props.deletedAt) return
    this.props.deletedAt = now
    this.props.deletedByAccountId = operatorAccountId
    this.props.deleteReason = normalizeOptionalText(reason)
    this.touch(now)
  }

  /** setPinned changes the object-level pin marker for manager-governed ordering. */
  setPinned(pinned: boolean, now = new Date()): void {
    this.assertNotDeleted()
    if (this.props.pinned === pinned) return
    this.props.pinned = pinned
    this.touch(now)
  }

  /** refreshObjectSnapshot stores a display-only owner object snapshot without claiming CRM truth. */
  refreshObjectSnapshot(snapshot: {
    title?: string | null
    subtitle?: string | null
    status?: string | null
  }): void {
    this.props.objectDisplayTitle = normalizeOptionalText(snapshot.title)
    this.props.objectDisplaySubtitle = normalizeOptionalText(snapshot.subtitle)
    this.props.objectDisplayStatus = normalizeOptionalText(snapshot.status)
  }

  /** assertMutableTarget rejects ordinary note mutations for archived owner objects. */
  assertMutableTarget(lifecycle: string): void {
    if (lifecycle === 'ARCHIVED') {
      throw new AnnotationFailedPreconditionError('archived object is readonly for annotation mutation')
    }
  }

  /** touch updates the aggregate updatedAt timestamp after a state-changing operation. */
  private touch(now: Date): void {
    this.props.updatedAt = now
  }

  /** assertNotDeleted blocks ordinary operations against soft-deleted notes. */
  private assertNotDeleted(): void {
    if (this.isDeleted()) {
      throw new AnnotationFailedPreconditionError('deleted annotation cannot be mutated')
    }
  }

  /** assertAuthor enforces P1 author-only edit rules. */
  private assertAuthor(operatorAccountId: string): void {
    if (this.props.authorAccountId !== operatorAccountId) {
      throw new AnnotationPermissionDeniedError('only annotation author can edit note')
    }
  }

  /** assertValidCoreFields validates required note fields at aggregate construction. */
  private assertValidCoreFields(props: AnnotationEntityProps): void {
    normalizeRequiredText(props.id, 'annotationId')
    normalizeRequiredText(props.tenantId, 'tenantId')
    normalizeRequiredText(props.objectOwnerService, 'objectOwnerService')
    normalizeRequiredText(props.objectType, 'objectType')
    normalizeRequiredText(props.objectId, 'objectId')
    normalizeRequiredText(props.authorAccountId, 'authorAccountId')
    normalizeRequiredText(props.authorDisplayNameSnapshot, 'authorDisplayNameSnapshot')
    props.bodyText = normalizeRequiredText(props.bodyText, 'bodyText')
    requireVisibility(props.visibility)
  }
}

/** requireVisibility validates Annotation P1 visibility values. */
function requireVisibility(value: AnnotationVisibility): AnnotationVisibility {
  if (!Object.values(AnnotationVisibility).includes(value)) {
    throw new AnnotationInvalidArgumentError('visibility is invalid')
  }
  return value
}

/** normalizeRequiredText trims required note text and rejects blanks. */
function normalizeRequiredText(value: string | undefined | null, fieldName: string): string {
  const normalized = normalizeOptionalText(value)
  if (!normalized) {
    throw new AnnotationInvalidArgumentError(`${fieldName} is required`)
  }
  return normalized
}

/** normalizeOptionalText trims optional note text and returns null for blanks. */
function normalizeOptionalText(value: string | undefined | null): string | null {
  const normalized = value?.trim()
  return normalized ? normalized : null
}
