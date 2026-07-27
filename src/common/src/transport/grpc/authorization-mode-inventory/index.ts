import type { RpcAuthorizationModeDeclaration } from '../../../authorization/trusted-execution/declarations'

/** Supplies the structural declarations for one logical gRPC RPC to the inventory checker. */
export type GrpcAuthorizationModeInventoryEntry = {
  readonly rpcId: string
  readonly declarations: readonly RpcAuthorizationModeDeclaration[]
}

/** Maps logical RPC identifiers to their sole declared authorization mode. */
export type GrpcAuthorizationModeInventory = Readonly<
  Record<string, RpcAuthorizationModeDeclaration>
>

/** Verifies structural declaration cardinality without assigning authorization modes to service RPCs. */
export function buildGrpcAuthorizationModeInventory(
  entries: readonly GrpcAuthorizationModeInventoryEntry[]
): GrpcAuthorizationModeInventory {
  const inventory: Record<string, RpcAuthorizationModeDeclaration> = {}

  for (const entry of entries) {
    assertRpcId(entry.rpcId)

    if (Object.prototype.hasOwnProperty.call(inventory, entry.rpcId)) {
      throw new Error(
        `${entry.rpcId} appears more than once in the RPC authorization mode inventory`
      )
    }

    if (entry.declarations.length !== 1) {
      throw new Error(
        `${entry.rpcId} must declare exactly one RPC authorization mode; found ${entry.declarations.length}`
      )
    }

    inventory[entry.rpcId] = entry.declarations[0]
  }

  return Object.freeze(inventory)
}

/** Rejects absent logical RPC identifiers before an inventory can make a false claim of coverage. */
function assertRpcId(rpcId: string): void {
  if (typeof rpcId !== 'string' || rpcId.trim().length === 0) {
    throw new Error('RPC authorization mode inventory entries require a non-empty rpcId')
  }
}
