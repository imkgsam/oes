import { ActivateEnrollmentHandler } from './activate-enrollment.command'
import { CreateEnrollmentHandler } from './create-enrollment.command'
import { RevokeEnrollmentHandler } from './revoke-enrollment.command'

export * from './activate-enrollment.command'
export * from './create-enrollment.command'
export * from './revoke-enrollment.command'

export const EnrollmentCommandHandlers = [CreateEnrollmentHandler, ActivateEnrollmentHandler, RevokeEnrollmentHandler]
