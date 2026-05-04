import { ConfigService } from '@nestjs/config';
import { Metadata } from '@grpc/grpc-js';
import { InternalServiceAuthenticator, InternalServiceAuthenticationResult } from '../types';
export declare class DefaultInternalServiceAuthenticator implements InternalServiceAuthenticator {
    private readonly configService;
    constructor(configService: ConfigService);
    authenticate(metadata?: Metadata): InternalServiceAuthenticationResult;
}
