import { join } from 'node:path';
import { createGrpcServerCredentials } from '@oes/common/transport';
import { HR_AUDIENCE } from '../../src/modules/hr-trusted-execution.module';
/** Locks the hr-service token-only boundary to its exact audience and declaration source. */
describe('hr-service trusted gRPC security', () => {
    it('uses one canonical target audience and no legacy class guard', () => {
        expect(HR_AUDIENCE).toBe('urn:oes:service:hr-service');
    });
    it('fails closed without mTLS deployment configuration and installs server credentials unconditionally', () => {
        expect(() => createGrpcServerCredentials({})).toThrow('gRPC mTLS is required');
    });
});
