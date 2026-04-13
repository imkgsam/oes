import { CanActivate, ExecutionContext, Inject, Injectable } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { ExceptionFactory } from '../../core/exceptions'
import {
  MANAGEMENT_INTERFACE_METADATA_KEY,
  OPERATOR_CONTEXT_METADATA_KEY,
  OPERATOR_CONTEXT_VERIFIER,
  REQUIRE_AUTHENTICATED_OPERATOR_METADATA_KEY
} from '../constants'
import { OPERATOR_CONTEXT_INVALID, OPERATOR_CONTEXT_MISSING } from '../exceptions'
import { OperatorContextVerificationResult, OperatorContextVerifier } from '../types'
import { attachOperatorContext, getGrpcMetadataValue } from '../utils'

@Injectable()
export class AuthenticatedOperatorGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Inject(OPERATOR_CONTEXT_VERIFIER)
    private readonly verifier: OperatorContextVerifier
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const shouldRequireAuthenticatedOperator =
      this.reflector.getAllAndOverride<boolean>(REQUIRE_AUTHENTICATED_OPERATOR_METADATA_KEY, [
        context.getHandler(),
        context.getClass()
      ]) ||
      this.reflector.getAllAndOverride<boolean>(MANAGEMENT_INTERFACE_METADATA_KEY, [
        context.getHandler(),
        context.getClass()
      ])

    if (!shouldRequireAuthenticatedOperator) {
      return true
    }

    const rpcContext = context.switchToRpc()
    const metadata = rpcContext.getContext()
    const rawOperatorContext = getGrpcMetadataValue(metadata, OPERATOR_CONTEXT_METADATA_KEY)

    if (!rawOperatorContext) {
      throw ExceptionFactory.application(OPERATOR_CONTEXT_MISSING)
    }

    const result: OperatorContextVerificationResult = this.verifier.verify(rawOperatorContext)
    if (!result.valid || !result.payload) {
      throw ExceptionFactory.application(OPERATOR_CONTEXT_INVALID, {
        reason: result.reason
      })
    }

    attachOperatorContext(rpcContext.getData(), result.payload)
    return true
  }
}
