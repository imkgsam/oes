import { Controller, Get } from '@nestjs/common'
import { ExecutionTokenJwksService } from '../../application/services/execution-token-jwks.service'

/** Exposes only issuer-pinned authorization-server metadata and public JWKS documents for HTTPS hosting. */
@Controller()
export class ExecutionTokenMetadataHttpController {
  constructor(private readonly jwksService: ExecutionTokenJwksService) {}

  /** Returns discovery metadata without accepting caller-controlled issuer or key-source inputs. */
  @Get('.well-known/openid-configuration')
  metadata() {
    return this.jwksService.metadata()
  }

  /** Returns public ES256 verification material and fixed cache/rotation facts without private key material. */
  @Get('.well-known/jwks.json')
  jwks() {
    return this.jwksService.jwks()
  }
}
