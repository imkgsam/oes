import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common'
import { AsyncLocalTransportPrivateSourceCredentialAccessor } from '@oes/common/authorization'
import type { Response } from 'express'
import { Observable, Subscription } from 'rxjs'
import { GatewayVerifiedSourceCredentialVault } from '../grpc/gateway-verified-source-credential.vault'

/** Runs the real HTTP handler subscription in the private credential scope and clears all lifecycle paths. */
@Injectable()
export class GatewayVerifiedSourceCredentialScopeInterceptor implements NestInterceptor {
  constructor(
    private readonly vault: GatewayVerifiedSourceCredentialVault,
    private readonly accessor: AsyncLocalTransportPrivateSourceCredentialAccessor
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') return next.handle()
    const request = context.switchToHttp().getRequest<object>()
    const response = context.switchToHttp().getResponse<Response>()
    const entry = this.vault.consume(request)
    if (entry === undefined) return next.handle()

    return new Observable((subscriber) => {
      let subscription: Subscription | undefined
      let finalized = false
      const finalize = () => {
        if (finalized) return
        finalized = true
        this.vault.clear(request)
        response?.removeListener('finish', finalize)
        response?.removeListener('close', finalize)
      }
      response?.once('finish', finalize)
      response?.once('close', finalize)

      this.accessor.run(entry.credential, () => {
        subscription = next.handle().subscribe({
          next: (value) => subscriber.next(value),
          error: (error) => {
            finalize()
            subscriber.error(error)
          },
          complete: () => {
            finalize()
            subscriber.complete()
          }
        })
      })

      return () => {
        subscription?.unsubscribe()
        finalize()
      }
    })
  }
}
