import { Metadata } from '@grpc/grpc-js'
import { ACTION_GRANT_METADATA_KEY } from '../../constants'

/** Extracts the sole permitted ActionGrant carrier while rejecting duplicate or malformed bearer values. */
export function extractActionGrantMetadata(metadata: Metadata | undefined): string | undefined {
  if (!metadata) return undefined
  const values = metadata.get(ACTION_GRANT_METADATA_KEY)
  if (values.length === 0) return undefined
  if (values.length !== 1) throw new Error('ActionGrant metadata must contain exactly one value')
  const value = values[0]
  if (typeof value !== 'string' || !isCompactJws(value)) {
    throw new Error('ActionGrant metadata must contain one compact JWS string')
  }
  return value
}

/** Sets one metadata-only ActionGrant without permitting duplicate carriers or non-compact values. */
export function setActionGrantMetadata(metadata: Metadata, actionGrant: string): void {
  if (metadata.get(ACTION_GRANT_METADATA_KEY).length > 0) {
    throw new Error('ActionGrant metadata is already set')
  }
  if (!isCompactJws(actionGrant)) {
    throw new Error('ActionGrant metadata must contain one compact JWS string')
  }
  metadata.set(ACTION_GRANT_METADATA_KEY, actionGrant)
}

/** Recognizes only unpadded compact JWS segments and never parses credential content at transport extraction. */
function isCompactJws(value: string): boolean {
  const segments = value.split('.')
  return segments.length === 3 && segments.every((segment) => /^[A-Za-z0-9_-]+$/.test(segment))
}
