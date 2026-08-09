import { Metadata } from '@grpc/grpc-js'
import {
  AUTHORIZATION_METADATA_KEY,
  REQUEST_ID_METADATA_KEY,
  TRACE_ID_METADATA_KEY,
  TRACEPARENT_METADATA_KEY,
  TRACESTATE_METADATA_KEY
} from '../../authorization/constants'
import { AsyncLocalTransportPrivateSourceCredentialAccessor } from '../../authorization/trusted-execution/transport-private-source-credential'
import type { TrustedExecutionContext } from '../../authorization/trusted-execution/trusted-execution-context'

/** Emits the opaque source credential only on the dedicated Auth STS exchange metadata path. */
export class ExecutionTokenExchangeSourceCredentialCarrier {
  constructor(private readonly accessor: AsyncLocalTransportPrivateSourceCredentialAccessor) {}

  /** Requires a verified source credential even when an exact target Token cache entry is reusable. */
  assertCurrent(): void {
    this.accessor.useCurrent(() => undefined)
  }

  /** Creates the fixed ExchangeExecutionToken bearer and correlation metadata without general propagation. */
  createMetadata(
    context: Pick<TrustedExecutionContext, 'requestId' | 'traceparent' | 'tracestate'>
  ): Metadata {
    return this.accessor.useCurrent((sourceCredential) => {
      const metadata = new Metadata()
      metadata.set(AUTHORIZATION_METADATA_KEY, `Bearer ${sourceCredential}`)
      metadata.set(REQUEST_ID_METADATA_KEY, context.requestId)
      metadata.set(TRACEPARENT_METADATA_KEY, context.traceparent)
      metadata.set(TRACE_ID_METADATA_KEY, context.traceparent.slice(3, 35))
      if (context.tracestate !== undefined) {
        metadata.set(TRACESTATE_METADATA_KEY, context.tracestate)
      }
      return metadata
    })
  }
}
