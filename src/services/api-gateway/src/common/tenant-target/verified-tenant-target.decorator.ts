import { createParamDecorator, ExecutionContext } from '@nestjs/common'
import { getVerifiedTenantTarget } from './tenant-target-binding.guard'
import { VerifiedTenantTarget as VerifiedTenantTargetValue } from './tenant-target-binding.types'

/** VerifiedTenantTarget is the branded value type emitted by the parameter decorator of the same name. */
export type VerifiedTenantTarget = VerifiedTenantTargetValue

/** VerifiedTenantTarget injects the exact canonical request-scoped target produced by the global guard. */
export const VerifiedTenantTarget = createParamDecorator(
  (_data: unknown, context: ExecutionContext): VerifiedTenantTargetValue =>
    getVerifiedTenantTarget(context.switchToHttp().getRequest())
)
