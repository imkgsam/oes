import { CanActivate, ExecutionContext, Inject, Injectable } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { ExceptionFactory } from '../../core/exceptions'
import {
  INTERNAL_SERVICE_AUTHENTICATOR,
  PUBLIC_INTERFACE_METADATA_KEY
} from '../constants'
import {
  InternalServiceAuthenticator,
  InternalServiceAuthenticationResult
} from '../types'
import { INTERNAL_SERVICE_METADATA_MISSING, INTERNAL_SERVICE_NOT_ALLOWED } from '../exceptions'
import { attachInternalService } from '../utils'

@Injectable()
export class InternalServiceGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Inject(INTERNAL_SERVICE_AUTHENTICATOR)
    private readonly authenticator: InternalServiceAuthenticator
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublicInterface = this.reflector.getAllAndOverride<boolean>(
      PUBLIC_INTERFACE_METADATA_KEY,
      [context.getHandler(), context.getClass()]
    )

    if (isPublicInterface) {
      return true
    }

    const rpcContext = context.switchToRpc()
    const metadata = rpcContext.getContext()
    const result: InternalServiceAuthenticationResult = this.authenticator.authenticate(metadata)

    if (!result.authenticated || !result.principal) {
      if (result.reason?.includes('missing')) {
        throw ExceptionFactory.application(INTERNAL_SERVICE_METADATA_MISSING, {
          reason: result.reason
        })
      }

      throw ExceptionFactory.application(INTERNAL_SERVICE_NOT_ALLOWED, {
        reason: result.reason
      })
    }

    attachInternalService(rpcContext.getData(), result.principal.serviceName)
    return true
  }
}
