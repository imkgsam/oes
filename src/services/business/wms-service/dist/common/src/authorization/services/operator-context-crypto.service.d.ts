import { ConfigService } from '@nestjs/config';
import { OperatorContextSigner, OperatorContextVerificationResult, OperatorContextVerifier, UnsignedOperatorContextPayload } from '../types';
export declare class OperatorContextCryptoService implements OperatorContextSigner, OperatorContextVerifier {
    private readonly configService;
    constructor(configService: ConfigService);
    sign(payload: UnsignedOperatorContextPayload): string;
    verify(rawPayload: string): OperatorContextVerificationResult;
    private getPrivateKey;
    private getPublicKey;
    private getAuthKeyConfig;
}
