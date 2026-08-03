import { Injectable } from '@nestjs/common'
import { TrustedExecutionContext } from './trusted-execution-context'

/** Retains one guard-verified immutable execution root for the lifetime of its gRPC request object. */
@Injectable()
export class TrustedExecutionContextStore {
  private readonly contexts = new WeakMap<object, TrustedExecutionContext>()

  /** Associates only an immutable guard-derived root with the current RPC data object. */
  attach(rpcData: unknown, context: TrustedExecutionContext): void {
    if (rpcData === null || typeof rpcData !== 'object')
      throw new Error('Trusted execution RPC data is required')
    if (!Object.isFrozen(context)) throw new Error('Trusted execution context must be immutable')
    this.contexts.set(rpcData, context)
  }

  /** Returns the verified root or fails closed instead of interpreting request-body identity. */
  require(rpcData: unknown): TrustedExecutionContext {
    if (rpcData === null || typeof rpcData !== 'object')
      throw new Error('Trusted execution RPC data is required')
    const context = this.contexts.get(rpcData)
    if (context === undefined) throw new Error('Trusted execution context is required')
    return context
  }
}
