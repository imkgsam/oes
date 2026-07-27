import { status } from '@grpc/grpc-js'
import { RpcException } from '@nestjs/microservices'
import { SiteCapabilityRegistrationError } from '../../domain/site-page/site-capability-registration'

/** mapSiteCapabilityRegistrationError converts only stable registration errors into OES RPC payloads. */
export function mapSiteCapabilityRegistrationError(error: unknown): never {
  if (!(error instanceof SiteCapabilityRegistrationError)) {
    throw error
  }

  const grpcStatus = registrationGrpcStatus(error)
  throw new RpcException({
    grpcStatus,
    code: error.code,
    message: error.message,
    details: error.details
  })
}

/** registrationGrpcStatus assigns the frozen transport status for each stable registration code. */
function registrationGrpcStatus(error: SiteCapabilityRegistrationError): status {
  switch (error.code) {
    case 'SITE_CAPABILITY_REGISTRATION_VALIDATION_FAILED':
      return status.INVALID_ARGUMENT
    case 'SITE_CAPABILITY_IDEMPOTENCY_CONFLICT':
      return status.ALREADY_EXISTS
    case 'SITE_CAPABILITY_REGISTRATION_GENERATION_EXHAUSTED':
      return status.RESOURCE_EXHAUSTED
  }
}
