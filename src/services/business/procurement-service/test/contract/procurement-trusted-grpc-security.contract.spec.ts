import { Metadata } from '@grpc/grpc-js';
import { Reflector } from '@nestjs/core';
import { join } from 'node:path';
import { getRpcAuthorizationModeDeclaration, PROCUREMENT_INTERNAL_PERMISSION_CODES, PROCUREMENT_MANAGEMENT_PERMISSION_CODES } from '@oes/common/authorization';
import { ProcurementInternalQueryGrpcController } from '../../src/interfaces/grpc/procurement-internal-query.grpc.controller';
import { ProcurementManagementGrpcController } from '../../src/interfaces/grpc/procurement-management.grpc.controller';
import { ProcurementQueryGrpcController } from '../../src/interfaces/grpc/procurement-query.grpc.controller';
import { ProcurementRpcContextValidator } from '../../src/interfaces/grpc/procurement-rpc-context.validator';
import { PROCUREMENT_INTERNAL_WORKLOAD_ALLOWLIST, ProcurementTrustedBusinessExecutionGuard, ProcurementTrustedInternalExecutionGuard } from '../../src/modules/procurement-trusted-execution.module';
const queryCodes = {
    getPurchaseRequest: PROCUREMENT_MANAGEMENT_PERMISSION_CODES.GET_PURCHASE_REQUEST,
    searchPurchaseRequests: PROCUREMENT_MANAGEMENT_PERMISSION_CODES.LIST_PURCHASE_REQUEST,
    getPurchaseOrder: PROCUREMENT_MANAGEMENT_PERMISSION_CODES.GET_PURCHASE_ORDER,
    searchPurchaseOrders: PROCUREMENT_MANAGEMENT_PERMISSION_CODES.LIST_PURCHASE_ORDER,
    listPurchaseOrderChanges: PROCUREMENT_MANAGEMENT_PERMISSION_CODES.LIST_PURCHASE_ORDER_CHANGES,
    getReceivingExpectation: PROCUREMENT_MANAGEMENT_PERMISSION_CODES.GET_RECEIVING_EXPECTATION,
    searchReceivingExpectations: PROCUREMENT_MANAGEMENT_PERMISSION_CODES.LIST_RECEIVING_EXPECTATION
} as const;
const managementCodes = {
    createPurchaseRequest: PROCUREMENT_MANAGEMENT_PERMISSION_CODES.CREATE_PURCHASE_REQUEST,
    updatePurchaseRequestDraft: PROCUREMENT_MANAGEMENT_PERMISSION_CODES.UPDATE_PURCHASE_REQUEST_DRAFT,
    submitPurchaseRequest: PROCUREMENT_MANAGEMENT_PERMISSION_CODES.SUBMIT_PURCHASE_REQUEST,
    decidePurchaseRequest: PROCUREMENT_MANAGEMENT_PERMISSION_CODES.DECIDE_PURCHASE_REQUEST,
    cancelPurchaseRequest: PROCUREMENT_MANAGEMENT_PERMISSION_CODES.CANCEL_PURCHASE_REQUEST,
    convertPurchaseRequestToPurchaseOrder: PROCUREMENT_MANAGEMENT_PERMISSION_CODES.CONVERT_PURCHASE_REQUEST_TO_ORDER,
    createPurchaseOrderDraft: PROCUREMENT_MANAGEMENT_PERMISSION_CODES.CREATE_PURCHASE_ORDER_DRAFT,
    updatePurchaseOrderDraft: PROCUREMENT_MANAGEMENT_PERMISSION_CODES.UPDATE_PURCHASE_ORDER_DRAFT,
    issuePurchaseOrder: PROCUREMENT_MANAGEMENT_PERMISSION_CODES.ISSUE_PURCHASE_ORDER,
    confirmSupplierAcknowledgement: PROCUREMENT_MANAGEMENT_PERMISSION_CODES.CONFIRM_SUPPLIER_ACKNOWLEDGEMENT,
    applyPurchaseOrderChange: PROCUREMENT_MANAGEMENT_PERMISSION_CODES.APPLY_PURCHASE_ORDER_CHANGE,
    cancelPurchaseOrder: PROCUREMENT_MANAGEMENT_PERMISSION_CODES.CANCEL_PURCHASE_ORDER,
    createReceivingExpectation: PROCUREMENT_MANAGEMENT_PERMISSION_CODES.CREATE_RECEIVING_EXPECTATION,
    recordReceivingDiscrepancyResolution: PROCUREMENT_MANAGEMENT_PERMISSION_CODES.RECORD_RECEIVING_DISCREPANCY_RESOLUTION
} as const;
const internalCode = PROCUREMENT_INTERNAL_PERMISSION_CODES.RESOLVE_RECEIVING_EXPECTATION_FOR_RECEIPT;
const audience = 'urn:oes:service:procurement-service';
const thumbprint = 'A'.repeat(43);
/** Locks all 22 Procurement RPCs to the frozen token-only execution matrix. */
describe('Procurement trusted gRPC security matrix Contract', () => {
    it('declares all 21 existing RPCs as exact HUMAN/WEB BUSINESS methods', () => {
        const entries = [
            ...Object.entries(queryCodes).map((entry) => [ProcurementQueryGrpcController.prototype, ...entry] as const),
            ...Object.entries(managementCodes).map((entry) => [ProcurementManagementGrpcController.prototype, ...entry] as const)
        ];
        expect(entries).toHaveLength(21);
        for (const [prototype, method, code] of entries) {
            expect(getRpcAuthorizationModeDeclaration(prototype, method)).toEqual({
                mode: 'BUSINESS',
                permissions: { all: [code] },
                principalType: 'HUMAN',
                sessionTerminals: ['WEB']
            });
        }
    });
    it('declares exactly one WMS HUMAN_OBO INTERNAL method', () => {
        expect(getRpcAuthorizationModeDeclaration(ProcurementInternalQueryGrpcController.prototype, 'resolveReceivingExpectationForReceipt')).toEqual({ mode: 'INTERNAL', permissions: { all: [internalCode] } });
        expect(PROCUREMENT_INTERNAL_WORKLOAD_ALLOWLIST).toEqual({
            [internalCode]: ['wms-service']
        });
    });
    it('installs token-only guards on all three controller classes', () => {
        expect(Reflect.getMetadata('__guards__', ProcurementQueryGrpcController)).toEqual(expect.arrayContaining([
            ProcurementTrustedBusinessExecutionGuard,
            ProcurementRpcContextValidator
        ]));
        expect(Reflect.getMetadata('__guards__', ProcurementManagementGrpcController)).toEqual(expect.arrayContaining([
            ProcurementTrustedBusinessExecutionGuard,
            ProcurementRpcContextValidator
        ]));
        expect(Reflect.getMetadata('__guards__', ProcurementInternalQueryGrpcController)).toEqual(expect.arrayContaining([
            ProcurementTrustedInternalExecutionGuard,
            ProcurementRpcContextValidator
        ]));
    });
    it('admits exact Gateway HUMAN/WEB authority and derives verified tenant context', async () => {
        const result = await runBusiness();
        expect(new ProcurementRpcContextValidator().canActivate(result.context)).toBe(true);
        expect(ProcurementRpcContextValidator.assertQueryContext(result.body).tenantId).toBe('tenant-1');
        expect(result.body).not.toHaveProperty('tenantId');
    });
    it.each([
        ['MACHINE principal', { principalType: 'MACHINE' }],
        ['DELEGATED principal', { principalType: 'DELEGATED' }],
        ['non-WEB terminal', { sessionTerminal: 'PDA' }],
        ['missing terminal', { sessionTerminal: undefined }],
        ['missing session', { sessionId: undefined }],
        ['missing tenant', { tenantId: undefined }],
        ['wrong audience', { audience: 'urn:oes:service:other-service' }],
        ['wrong cnf', { certificateThumbprint: 'B'.repeat(43) }],
        ['non-Gateway workload', { clientId: 'spiffe://oes/wms-service' }],
        ['unexpected actor', { actor: { sub: 'machine', principal_type: 'MACHINE' } }],
        ['missing Code', { permissionCodes: [] }],
        ['wrong Code', { permissionCodes: ['procurement.purchase_order.create_draft'] }]
    ])('rejects BUSINESS %s', async (_label, overrides) => {
        await expect(runBusiness(overrides)).rejects.toThrow();
    });
    it('rejects missing bearer and retired body/ordinary authority', async () => {
        await expect(runBusiness({}, {}, false)).rejects.toThrow();
        for (const body of [
            { tenantId: 'attacker' },
            { tenant_id: 'attacker' },
            { orgId: 'attacker' },
            { operatorContext: {} },
            { traceContext: {} },
            { auditContext: {} }
        ]) {
            const result = await runBusiness({}, body);
            expect(() => new ProcurementRpcContextValidator().canActivate(result.context)).toThrow();
        }
    });
    it('admits exact WMS HUMAN_OBO actor/workload/Code and derives exact tenant', async () => {
        const result = await runInternal();
        expect(new ProcurementRpcContextValidator().canActivate(result.context)).toBe(true);
        expect(ProcurementRpcContextValidator.assertQueryContext(result.body).tenantId).toBe('tenant-1');
    });
    it.each([
        ['direct HUMAN without actor', { actor: undefined }],
        ['pure MACHINE root', { principalType: 'MACHINE', actor: undefined }],
        ['DELEGATED execution', { principalType: 'DELEGATED' }],
        [
            'TENANT MACHINE actor',
            { actor: { sub: 'machine-wms', principal_type: 'MACHINE', scope_level: 'TENANT' } }
        ],
        [
            'nested actor',
            {
                actor: {
                    sub: 'machine-wms',
                    principal_type: 'MACHINE',
                    scope_level: 'SYSTEM',
                    act: {}
                }
            }
        ],
        ['unknown workload', { clientId: 'spiffe://oes/procurement-service' }],
        ['malformed workload', { clientId: 'wms-service' }],
        ['wildcard tenant', { tenantId: '*' }],
        ['missing Code', { permissionCodes: [] }]
    ])('rejects INTERNAL %s', async (_label, overrides) => {
        await expect(runInternal(overrides)).rejects.toThrow();
    });
});
/** Executes Procurement's actual BUSINESS guard against one target-token fixture. */
async function runBusiness(overrides: Record<string, unknown> = {}, body: Record<string, unknown> = {}, includeBearer = true) {
    const metadata = baseMetadata(includeBearer);
    const verified = targetToken(queryCodes.searchPurchaseRequests, overrides);
    const workloadIdentity = {
        spiffeId: verified.clientId,
        certificateThumbprint: thumbprint
    };
    const verifier = strictVerifier(verified);
    const context = executionContext(ProcurementQueryGrpcController, ProcurementQueryGrpcController.prototype.searchPurchaseRequests, body, metadata, workloadIdentity);
    await new ProcurementTrustedBusinessExecutionGuard(new Reflector(), verifier as never, { getVerifiedWorkloadIdentity: jest.fn().mockResolvedValue(workloadIdentity) } as never, audience).canActivate(context);
    return { context, body };
}
/** Executes Procurement's actual INTERNAL guard against one exact WMS OBO token. */
async function runInternal(overrides: Record<string, unknown> = {}) {
    const metadata = baseMetadata(true);
    const verified = targetToken(internalCode, {
        clientId: 'spiffe://oes/wms-service',
        actor: {
            sub: 'machine-wms',
            principal_type: 'MACHINE',
            scope_level: 'SYSTEM'
        },
        ...overrides
    });
    const body = { receivingExpectationId: 'expectation-1' };
    const workloadIdentity = {
        spiffeId: verified.clientId,
        certificateThumbprint: thumbprint
    };
    const context = executionContext(ProcurementInternalQueryGrpcController, ProcurementInternalQueryGrpcController.prototype.resolveReceivingExpectationForReceipt, body, metadata, workloadIdentity);
    await new ProcurementTrustedInternalExecutionGuard(new Reflector(), strictVerifier(verified) as never, { getVerifiedWorkloadIdentity: jest.fn().mockResolvedValue(workloadIdentity) } as never, audience).canActivate(context);
    return { context, body };
}
/** Creates the target-bound verified claim fixture consumed by both guards. */
function targetToken(code: string, overrides: Record<string, unknown>) {
    return {
        issuer: 'https://auth.example',
        audience,
        subject: 'human-1',
        principalType: 'HUMAN',
        clientId: 'spiffe://oes/api-gateway',
        tenantId: 'tenant-1',
        orgId: 'org-1',
        permissionCodes: [code],
        tokenId: 'token-1',
        issuedAt: 1,
        notBefore: 1,
        expiresAt: 9999999999,
        certificateThumbprint: thumbprint,
        sessionId: 'session-1',
        sessionTerminal: 'WEB',
        ...overrides
    };
}
/** Mimics the Common verifier's exact audience, workload, certificate, session, and tenant checks. */
function strictVerifier(verified: ReturnType<typeof targetToken>) {
    return {
        verify: jest.fn(async (input) => {
            if (verified.audience !== input.targetAudience ||
                verified.certificateThumbprint !== input.workloadIdentity.certificateThumbprint ||
                verified.clientId !== input.workloadIdentity.spiffeId ||
                !verified.sessionId ||
                !verified.tenantId ||
                verified.tenantId === '*') {
                throw new Error('invalid Procurement target token');
            }
            return verified;
        })
    };
}
/** Builds the only ordinary transport metadata retained after authority retirement. */
function baseMetadata(includeBearer: boolean): Metadata {
    const metadata = new Metadata();
    if (includeBearer)
        metadata.set('authorization', 'Bearer target.execution.token');
    metadata.set('x-request-id', 'request-1');
    metadata.set('x-trace-id', 'trace-1');
    metadata.set('traceparent', '00-0123456789abcdef0123456789abcdef-0123456789abcdef-01');
    return metadata;
}
/** Creates the Nest RPC context consumed by Common and Procurement guards. */
function executionContext(controller: object, handler: unknown, body: object, metadata: Metadata, workloadIdentity: {
    spiffeId: string;
    certificateThumbprint: string;
}) {
    return {
        switchToRpc: () => ({ getData: () => body, getContext: () => metadata }),
        getHandler: () => handler,
        getClass: () => controller,
        getArgByIndex: () => ({ workloadIdentity })
    } as never;
}
