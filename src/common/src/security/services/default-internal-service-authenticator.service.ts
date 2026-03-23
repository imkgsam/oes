import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Metadata } from '@grpc/grpc-js'
import { INTERNAL_SERVICE_NAME_METADATA_KEY } from '../constants'
import { InternalServiceAuthenticator, InternalServiceAuthenticationResult } from '../types'
import { getGrpcMetadataValue } from '../utils'

@Injectable()
export class DefaultInternalServiceAuthenticator implements InternalServiceAuthenticator {
  constructor(private readonly configService: ConfigService) {}

  authenticate(metadata?: Metadata): InternalServiceAuthenticationResult {
    const serviceName = getGrpcMetadataValue(metadata, INTERNAL_SERVICE_NAME_METADATA_KEY)?.trim()

    if (!serviceName) {
      return {
        authenticated: false,
        reason: 'missing x-internal-service-name'
      }
    }

    const trustedServices = this.configService
      .get<string>('INTERNAL_SERVICE_TRUSTED_SERVICES')
      ?.split(',')
      .map((item) => item.trim())
      .filter(Boolean)

    if (trustedServices && trustedServices.length > 0 && !trustedServices.includes(serviceName)) {
      return {
        authenticated: false,
        reason: `service ${serviceName} is not in trusted allowlist`
      }
    }

    return {
      authenticated: true,
      principal: {
        serviceName
      }
    }
  }
}
