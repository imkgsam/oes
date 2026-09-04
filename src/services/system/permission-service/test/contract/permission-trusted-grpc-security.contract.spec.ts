import { join } from 'node:path';
import { Metadata } from '@grpc/grpc-js';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthorizationModule as CommonAuthorizationModule, ExecutionTokenVerifier, getRpcAuthorizationModeDeclaration } from '@oes/common/authorization';
import { LoggingModule } from '@oes/common/logging';
import { createGrpcServerCredentials, GrpcWorkloadIdentityProvider } from '@oes/common/transport';
import { PrismaService } from '../../src/infrastructure/prisma/prisma.service';
import { AuthorizationModule } from '../../src/modules/authorization/authorization.module';
import { PermissionAccessSummaryGrpcController } from '../../src/interfaces/grpc/permission-access-summary.grpc.controller';
import { PermissionManagementGrpcController } from '../../src/interfaces/grpc/permission-management.grpc.controller';
import { PERMISSION_AUDIENCE, PermissionFoundationTrustedExecutionGuard } from '../../src/modules/authorization/permission-trusted-execution.module';
import { PermissionModule } from '../../src/modules/permission/permission.module';
import { PolicyModule } from '../../src/modules/policy/policy.module';
/** Locks the permission-service token-only boundary to its exact audience and declaration source. */
describe('permission-service trusted gRPC security', () => {
    it('uses one canonical target audience and no legacy class guard', () => {
        expect(PERMISSION_AUDIENCE).toBe('urn:oes:service:permission-service');
    });
    it('fails closed without mTLS deployment configuration and installs server credentials unconditionally', () => {
        expect(() => createGrpcServerCredentials({})).toThrow('gRPC mTLS is required');
    });
    it.each([
        ['getAccountAccessSummary', 'permission.internal.account_access_summary.resolve'],
        ['resolveAccountNavigation', 'permission.internal.account_navigation.resolve']
    ] as const)('admits PDA only to foundation INTERNAL method %s', async (method, permission) => {
        const pda = evaluatePermissionTerminal(PermissionAccessSummaryGrpcController.prototype, method, 'PDA');
        expect(pda.declaration).toEqual({ mode: 'INTERNAL', permissions: { all: [permission] } });
        await expect(pda.decision).resolves.toBe(true);
        await expect(evaluatePermissionTerminal(PermissionAccessSummaryGrpcController.prototype, method, 'WEB')
            .decision).resolves.toBe(true);
        await expect(evaluatePermissionTerminal(PermissionAccessSummaryGrpcController.prototype, method, 'KIOSK')
            .decision).rejects.toThrow('Permission HUMAN execution terminal is not permitted');
    });
    it.each([
        ['listPermissionsPaged', 'permission management'],
        ['listRoleInstances', 'role management'],
        ['listNavigationEntries', 'navigation management'],
        ['getRoleTerminalAccess', 'terminal-policy management']
    ] as const)('keeps %s (%s) BUSINESS admission WEB-only', async (method) => {
        const web = evaluatePermissionTerminal(PermissionManagementGrpcController.prototype, method, 'WEB');
        expect(web.declaration.mode).toBe('BUSINESS');
        await expect(web.decision).resolves.toBe(true);
        await expect(evaluatePermissionTerminal(PermissionManagementGrpcController.prototype, method, 'PDA')
            .decision).rejects.toThrow('Permission HUMAN execution terminal is not permitted');
    });
    it.each([
        ['AuthorizationModule', AuthorizationModule],
        ['PermissionModule', PermissionModule],
        ['PolicyModule', PolicyModule]
    ] as const)('%s resolves its controller guard and trusted verifier dependencies', async (_, ownerModule) => {
        const originalAuthSpiffeId = process.env.PERMISSION_AUTH_SERVICE_SPIFFE_ID;
        const originalWorkloadPolicies = process.env.PERMISSION_WORKLOAD_ISSUANCE_POLICIES;
        process.env.PERMISSION_AUTH_SERVICE_SPIFFE_ID = 'spiffe://oes.test/ns/system/sa/auth-service';
        process.env.PERMISSION_WORKLOAD_ISSUANCE_POLICIES = validWorkloadPolicies();
        let moduleRef: TestingModule | undefined;
        try {
            moduleRef = await compileControllerOwner(ownerModule);
            const ownerContext = moduleRef.select(ownerModule);
            const guard = ownerContext.get(PermissionFoundationTrustedExecutionGuard, { strict: true });
            const verifier = (guard as unknown as {
                verifier: ExecutionTokenVerifier;
            }).verifier;
            const workloadIdentity = (guard as unknown as {
                workloadIdentityProvider: GrpcWorkloadIdentityProvider;
            }).workloadIdentityProvider;
            expect(guard).toBeInstanceOf(PermissionFoundationTrustedExecutionGuard);
            expect(typeof verifier.verify).toBe('function');
            expect(typeof workloadIdentity.getVerifiedWorkloadIdentity).toBe('function');
        }
        finally {
            await moduleRef?.close();
            restoreEnvironment('PERMISSION_AUTH_SERVICE_SPIFFE_ID', originalAuthSpiffeId);
            restoreEnvironment('PERMISSION_WORKLOAD_ISSUANCE_POLICIES', originalWorkloadPolicies);
        }
    });
});
/** Evaluates one real Permission declaration with an exact Gateway HUMAN token terminal. */
function evaluatePermissionTerminal(target: object, method: string, terminal: string) {
    const declaration = getRpcAuthorizationModeDeclaration(target, method);
    if (!declaration)
        throw new Error(`Missing Permission RPC declaration for ${method}`);
    const metadata = new Metadata();
    metadata.set('authorization', 'Bearer e30.e30.e30');
    metadata.set('x-request-id', 'request-1');
    metadata.set('traceparent', '00-0123456789abcdef0123456789abcdef-0123456789abcdef-01');
    const data = {};
    const reflector = { getAllAndOverride: jest.fn(() => declaration) };
    const verifier = {
        verify: jest.fn(async () => ({
            issuer: 'https://auth.local.oes.example',
            audience: PERMISSION_AUDIENCE,
            subject: 'account-1',
            clientId: 'spiffe://local.oes.internal/ns/oes/sa/api-gateway',
            tokenId: 'token-1',
            issuedAt: 1,
            notBefore: 1,
            expiresAt: 2,
            certificateThumbprint: 'A'.repeat(43),
            principalType: 'HUMAN',
            permissionCodes: 'all' in declaration.permissions
                ? [...declaration.permissions.all]
                : [...declaration.permissions.any],
            sessionTerminal: terminal
        }))
    };
    const identity = {
        getVerifiedWorkloadIdentity: jest.fn(async () => ({
            spiffeId: 'spiffe://local.oes.internal/ns/oes/sa/api-gateway',
            certificateThumbprint: 'A'.repeat(43)
        }))
    };
    const handler = jest.fn();
    const context = {
        getHandler: jest.fn(() => handler),
        getClass: jest.fn(),
        getArgByIndex: jest.fn(() => ({ getAuthContext: jest.fn() })),
        switchToRpc: jest.fn(() => ({ getContext: () => metadata, getData: () => data }))
    };
    const guard = new PermissionFoundationTrustedExecutionGuard(reflector as never, verifier as never, identity as never);
    return { declaration, decision: guard.canActivate(context as never) };
}
/** Compiles one real controller-owner module so Nest must construct every controller guard. */
function compileControllerOwner(ownerModule: typeof AuthorizationModule): Promise<TestingModule> {
    return Test.createTestingModule({
        imports: [
            LoggingModule.forRoot({ serviceName: 'permission-service' }),
            EventEmitterModule.forRoot(),
            CommonAuthorizationModule,
            ownerModule
        ]
    })
        .overrideProvider(PrismaService)
        .useValue({ $connect: jest.fn(), $disconnect: jest.fn() })
        .compile();
}
/** Restores one environment value without turning absence into the string "undefined". */
function restoreEnvironment(name: string, value: string | undefined): void {
    if (value === undefined)
        delete process.env[name];
    else
        process.env[name] = value;
}
/** Supplies one valid exact workload policy to satisfy AuthorizationModule bootstrap. */
function validWorkloadPolicies(): string {
    return JSON.stringify([
        {
            originalWorkloadSpiffeId: 'spiffe://local.test/site-service',
            targetAudience: 'urn:oes:service:asset-service',
            permissionCodes: ['asset.internal.resolve'],
            scopeLevel: 'TENANT',
            tenantIds: ['tenant-1'],
            policyVersion: 'policy-v1'
        }
    ]);
}
