import { status } from '@grpc/grpc-js'
import { ExceptionDefinition } from '@oes/common/exceptions'

export type SyncTargetErrorCode = 'SYNC_TARGET_REQUIRED' | 'SYNC_TARGET_NOT_COMMITTED' | 'SYNC_TARGET_UNAVAILABLE' | 'SYNC_TARGET_MISMATCH'

/** SYNC_TARGET_ERROR_DEFINITIONS exposes stable failures for immutable runtime sync targets. */
export const SYNC_TARGET_ERROR_DEFINITIONS: Readonly<Record<SyncTargetErrorCode, ExceptionDefinition>> = {
  SYNC_TARGET_REQUIRED: { code: 'SYNC_TARGET_REQUIRED', message: 'A committed sync target is required', rpcStatus: status.INVALID_ARGUMENT },
  SYNC_TARGET_NOT_COMMITTED: { code: 'SYNC_TARGET_NOT_COMMITTED', message: 'Requested sync target is not committed', rpcStatus: status.FAILED_PRECONDITION },
  SYNC_TARGET_UNAVAILABLE: { code: 'SYNC_TARGET_UNAVAILABLE', message: 'Requested sync target output is unavailable', rpcStatus: status.FAILED_PRECONDITION },
  SYNC_TARGET_MISMATCH: { code: 'SYNC_TARGET_MISMATCH', message: 'Requested sync target does not match returned output', rpcStatus: status.ABORTED }
}
