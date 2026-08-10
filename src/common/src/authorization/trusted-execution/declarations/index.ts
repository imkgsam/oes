import { SetMetadata } from '@nestjs/common'
import { requireTrustedSessionTerminal, TrustedSessionTerminal } from '../trusted-execution-context'

/** Identifies the three authorization declarations that a gRPC method may eventually use. */
export const RPC_AUTHORIZATION_MODES = ['BUSINESS', 'SELF_SERVICE', 'INTERNAL'] as const

/** Stores gRPC authorization declarations separately from existing HTTP authorization metadata. */
export const RPC_AUTHORIZATION_MODE_METADATA_KEY = 'oes:trusted-execution:rpc-authorization-mode'

/** Represents the only accepted permission requirement shapes for a declaration. */
export type RpcPermissionRequirement =
  | { readonly all: readonly string[]; readonly any?: never }
  | { readonly any: readonly string[]; readonly all?: never }

/** Represents a structural BUSINESS declaration without authorizing a request. */
export type BusinessRpcAuthorizationDeclaration = {
  readonly mode: 'BUSINESS'
  readonly permissions: RpcPermissionRequirement
  readonly principalType?: 'HUMAN' | 'MACHINE' | 'DELEGATED'
  readonly sessionTerminal?: TrustedSessionTerminal
}

/** Represents a structural SELF_SERVICE declaration without binding a principal. */
export type SelfServiceRpcAuthorizationDeclaration = {
  readonly mode: 'SELF_SERVICE'
  readonly allowDelegated: boolean
  readonly sessionTerminal?: TrustedSessionTerminal
}

/** Represents a structural INTERNAL declaration without validating a workload or policy. */
export type InternalRpcAuthorizationDeclaration = {
  readonly mode: 'INTERNAL'
  readonly permissions: { readonly all: readonly string[] }
}

/** Represents one declaration that a future trusted-execution runtime can inspect. */
export type RpcAuthorizationModeDeclaration =
  | BusinessRpcAuthorizationDeclaration
  | SelfServiceRpcAuthorizationDeclaration
  | InternalRpcAuthorizationDeclaration

/** Declares BUSINESS metadata on a method without installing authorization enforcement. */
export const AuthorizeBusinessRpc = (
  permissions: RpcPermissionRequirement,
  options: {
    readonly principalType?: 'HUMAN' | 'MACHINE' | 'DELEGATED'
    readonly sessionTerminal?: TrustedSessionTerminal
  } = {}
) =>
  SetMetadata(
    RPC_AUTHORIZATION_MODE_METADATA_KEY,
    createBusinessRpcAuthorizationDeclaration(permissions, options)
  )

/** Declares SELF_SERVICE metadata on a method without binding it to any principal. */
export const AuthorizeSelfServiceRpc = ({
  allowDelegated,
  sessionTerminal
}: {
  readonly allowDelegated: boolean
  readonly sessionTerminal?: TrustedSessionTerminal
}) =>
  SetMetadata(
    RPC_AUTHORIZATION_MODE_METADATA_KEY,
    createSelfServiceRpcAuthorizationDeclaration(allowDelegated, sessionTerminal)
  )

/** Declares INTERNAL metadata on a method without validating any workload identity or policy. */
export const AuthorizeInternalCall = ({ all }: { readonly all: readonly string[] }) =>
  SetMetadata(RPC_AUTHORIZATION_MODE_METADATA_KEY, createInternalRpcAuthorizationDeclaration(all))

/** Reads one structural declaration from a method without making an authorization decision. */
export const getRpcAuthorizationModeDeclaration = (
  target: object,
  propertyKey: string | symbol
): RpcAuthorizationModeDeclaration | undefined => {
  const handler = Object.getOwnPropertyDescriptor(target, propertyKey)?.value

  return handler === undefined
    ? Reflect.getMetadata(RPC_AUTHORIZATION_MODE_METADATA_KEY, target, propertyKey)
    : Reflect.getMetadata(RPC_AUTHORIZATION_MODE_METADATA_KEY, handler)
}

/** Creates an immutable BUSINESS declaration after validating its local metadata shape. */
function createBusinessRpcAuthorizationDeclaration(
  permissions: RpcPermissionRequirement,
  options: {
    readonly principalType?: 'HUMAN' | 'MACHINE' | 'DELEGATED'
    readonly sessionTerminal?: TrustedSessionTerminal
  }
): BusinessRpcAuthorizationDeclaration {
  return Object.freeze({
    mode: 'BUSINESS',
    permissions: normalizePermissionRequirement('BUSINESS', permissions),
    ...(options.principalType === undefined ? {} : { principalType: options.principalType }),
    ...(options.sessionTerminal === undefined
      ? {}
      : { sessionTerminal: normalizeSessionTerminal(options.sessionTerminal) })
  })
}

/** Creates an immutable SELF_SERVICE declaration after validating its local metadata shape. */
function createSelfServiceRpcAuthorizationDeclaration(
  allowDelegated: boolean,
  sessionTerminal?: string
): SelfServiceRpcAuthorizationDeclaration {
  if (typeof allowDelegated !== 'boolean') {
    throw new Error('SELF_SERVICE authorization allowDelegated must be a boolean')
  }

  return Object.freeze({
    mode: 'SELF_SERVICE',
    allowDelegated,
    ...(sessionTerminal === undefined
      ? {}
      : { sessionTerminal: normalizeSessionTerminal(sessionTerminal) })
  })
}

/** Restricts terminal declarations to one exact Auth-signed session fact. */
function normalizeSessionTerminal(value: string): TrustedSessionTerminal {
  return requireTrustedSessionTerminal(value)
}

/** Creates an immutable INTERNAL declaration after validating its local metadata shape. */
function createInternalRpcAuthorizationDeclaration(
  all: readonly string[]
): InternalRpcAuthorizationDeclaration {
  return Object.freeze({
    mode: 'INTERNAL',
    permissions: Object.freeze({ all: normalizePermissionCodes('INTERNAL', 'all', all) })
  })
}

/** Normalizes a mutually exclusive BUSINESS all-or-any permission requirement. */
function normalizePermissionRequirement(
  mode: 'BUSINESS',
  permissions: RpcPermissionRequirement
): RpcPermissionRequirement {
  const hasAll = Object.prototype.hasOwnProperty.call(permissions, 'all')
  const hasAny = Object.prototype.hasOwnProperty.call(permissions, 'any')

  if (hasAll === hasAny) {
    throw new Error(`${mode} authorization must declare exactly one of all or any permission codes`)
  }

  return hasAll
    ? Object.freeze({ all: normalizePermissionCodes(mode, 'all', permissions.all) })
    : Object.freeze({ any: normalizePermissionCodes(mode, 'any', permissions.any) })
}

/** Normalizes non-empty permission codes while preserving declaration-only behavior. */
function normalizePermissionCodes(
  mode: 'BUSINESS' | 'INTERNAL',
  requirement: 'all' | 'any',
  codes: readonly string[]
): readonly string[] {
  if (!Array.isArray(codes) || codes.length === 0) {
    throw new Error(
      `${mode} authorization ${requirement} permission codes must be a non-empty array`
    )
  }

  const normalized = codes.map((code) => {
    if (typeof code !== 'string' || code.trim().length === 0) {
      throw new Error(`${mode} authorization permission codes must be non-empty strings`)
    }
    return code.trim()
  })

  return Object.freeze(normalized)
}
