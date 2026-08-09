import { SetMetadata } from '@nestjs/common'

export const PERMISSION_DECISION_TRANSPORT_METADATA_KEY = 'permission:decision-transport'

export type PermissionDecisionTransportDeclaration =
  | { readonly mode: 'BOOTSTRAP' }
  | { readonly mode: 'PROTECTED'; readonly permissionCode: string }

/** Declares the unique bootstrap or exact-Code protected transport policy for one Permission decision RPC. */
export const PermissionDecisionTransport = (
  declaration: PermissionDecisionTransportDeclaration
): MethodDecorator =>
  SetMetadata(PERMISSION_DECISION_TRANSPORT_METADATA_KEY, Object.freeze(declaration))
