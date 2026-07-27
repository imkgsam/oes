import { SetMetadata } from '@nestjs/common'
import {
  TenantTargetBindingMetadata,
  TenantTargetBindingOptions
} from './tenant-target-binding.types'

export const TENANT_TARGET_BINDING_METADATA_KEY = 'gateway:tenant-target-binding'

const DEFAULT_PATH_PARAM = 'tenantId'
const DEFAULT_SYSTEM_POLICY = 'DENY' as const
const PATH_PARAM_NAME_PATTERN = /^[A-Za-z][A-Za-z0-9_]*$/

/** RequireTenantTargetBinding marks a route or controller for fail-closed session-to-target binding. */
export function RequireTenantTargetBinding(
  options: TenantTargetBindingOptions = {}
): ClassDecorator & MethodDecorator {
  const pathParam = options.pathParam ?? DEFAULT_PATH_PARAM
  const systemPolicy = options.systemPolicy ?? DEFAULT_SYSTEM_POLICY

  if (!PATH_PARAM_NAME_PATTERN.test(pathParam)) {
    throw new Error('Tenant target path param must be a non-blank identifier')
  }
  if (systemPolicy !== DEFAULT_SYSTEM_POLICY) {
    throw new Error(
      'Tenant target SYSTEM policy must remain DENY until an architecture decision allows otherwise'
    )
  }

  const metadata: TenantTargetBindingMetadata = { pathParam, systemPolicy }
  return SetMetadata(TENANT_TARGET_BINDING_METADATA_KEY, metadata)
}
