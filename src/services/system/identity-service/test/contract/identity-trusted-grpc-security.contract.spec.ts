import { join } from 'node:path';
import { createGrpcServerCredentials } from '@oes/common/transport';
import { IDENTITY_AUDIENCE } from '../../src/modules/identity-trusted-execution.module';
/** Locks the identity-service token-only boundary to its exact audience and declaration source. */
describe('identity-service trusted gRPC security', () => {
    it('uses one canonical target audience and no legacy class guard', () => {
        expect(IDENTITY_AUDIENCE).toBe('urn:oes:service:identity-service');
    });
    it('fails closed without mTLS deployment configuration and installs server credentials unconditionally', () => {
        expect(() => createGrpcServerCredentials({})).toThrow('gRPC mTLS is required');
    });
});
