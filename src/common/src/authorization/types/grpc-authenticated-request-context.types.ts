import { OperatorContextPayload } from './operator-context-payload'
import type {
  VerifiedExecutionToken,
  VerifiedWorkloadIdentity
} from '../trusted-execution'

export interface GrpcAuthenticatedRequestContext {
  internalServiceName?: string
  operatorContext?: OperatorContextPayload
  verifiedExecutionToken?: VerifiedExecutionToken
  verifiedWorkloadIdentity?: VerifiedWorkloadIdentity
  requestId?: string
  traceId?: string
}
