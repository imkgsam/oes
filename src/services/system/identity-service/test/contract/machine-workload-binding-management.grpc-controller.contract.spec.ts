import { join } from 'node:path';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { getRpcAuthorizationModeDeclaration } from '@oes/common/authorization';
import { IdentityManagementGrpcController } from '../../src/interfaces/grpc/identity-management.grpc.controller';
import { IdentityFoundationTrustedExecutionGuard } from '../../src/modules/identity-trusted-execution.module';
/** Protects the management boundary from silently dropping its permission gate or command mapping. */
describe('Machine workload binding management gRPC controller', () => {
    it('routes both lifecycle methods through the protected management controller', () => {
        expect(Reflect.getMetadata(GUARDS_METADATA, IdentityManagementGrpcController)).toEqual([
            IdentityFoundationTrustedExecutionGuard
        ]);
        for (const method of ['enrollMachineWorkloadBinding', 'disableMachineWorkloadBinding']) {
            expect(getRpcAuthorizationModeDeclaration(IdentityManagementGrpcController.prototype, method)).toEqual({
                mode: 'BUSINESS',
                permissions: { all: ['identity.machine.workload_binding.manage'] }
            });
        }
    });
});
