import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { createSign, createVerify } from 'crypto'
import { readFileSync } from 'fs'
import { join } from 'path'
import { AuthKeyConfigName, IAuthKeyConfig } from '../../auth'
import {
  OperatorContextPayload,
  OperatorContextSigner,
  OperatorContextVerificationResult,
  OperatorContextVerifier,
  UnsignedOperatorContextPayload
} from '../types'
import {
  canonicalizeOperatorContextForSigning,
  decodeOperatorContext,
  validateOperatorContextPayload
} from '../utils'

@Injectable()
export class OperatorContextCryptoService implements OperatorContextSigner, OperatorContextVerifier {
  constructor(private readonly configService: ConfigService) {}

  sign(payload: UnsignedOperatorContextPayload): string {
    const signer = createSign('RSA-SHA256')
    signer.update(canonicalizeOperatorContextForSigning(payload))
    signer.end()

    return signer.sign(this.getPrivateKey(), 'base64')
  }

  verify(rawPayload: string): OperatorContextVerificationResult {
    let payload: OperatorContextPayload

    try {
      payload = decodeOperatorContext(rawPayload)
    } catch (error) {
      return {
        valid: false,
        reason: (error as Error).message
      }
    }

    const validationError = validateOperatorContextPayload(payload)
    if (validationError) {
      return {
        valid: false,
        reason: validationError
      }
    }

    const trustedIssuers = this.configService
      .get<string>('OPERATOR_CONTEXT_TRUSTED_ISSUERS')
      ?.split(',')
      .map((item) => item.trim())
      .filter(Boolean)

    if (trustedIssuers && trustedIssuers.length > 0 && !trustedIssuers.includes(payload.issuer)) {
      return {
        valid: false,
        reason: `issuer ${payload.issuer} is not trusted`
      }
    }

    const verifier = createVerify('RSA-SHA256')
    verifier.update(canonicalizeOperatorContextForSigning(payload))
    verifier.end()

    const valid = verifier.verify(this.getPublicKey(), payload.signature, 'base64')
    return {
      valid,
      payload: valid ? payload : undefined,
      reason: valid ? undefined : 'signature verification failed'
    }
  }

  private getPrivateKey(): string {
    const config = this.getAuthKeyConfig()
    return readFileSync(join(__dirname, '../../..', config.privateKeyPath), 'utf8')
  }

  private getPublicKey(): string {
    const config = this.getAuthKeyConfig()
    return readFileSync(join(__dirname, '../../..', config.publicKeyPath), 'utf8')
  }

  private getAuthKeyConfig(): IAuthKeyConfig {
    return this.configService.getOrThrow<IAuthKeyConfig>(AuthKeyConfigName)
  }
}
