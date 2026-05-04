export interface PermissionCheckInput {
    accountId: string;
    permissionCode: string;
    tenantId?: string;
}
export interface PolicyExplainEntryOutput {
    policyId: string;
    policyName: string;
    effect: 'ALLOW' | 'DENY';
    priority: number;
    applicable: boolean;
    matched: boolean;
    reasonCode: string;
    conditionExplainTree?: PolicyConditionExplainNodeOutput;
}
export interface PolicyConditionExplainNodeOutput {
    nodeType: 'ALL' | 'ANY' | 'NOT' | 'COMPARISON';
    path: string;
    matched: boolean;
    reasonCode: string;
    source?: string;
    key?: string;
    operator?: string;
    actualValueJson?: string;
    expectedValueJson?: string;
    children?: PolicyConditionExplainNodeOutput[];
}
export interface AuthorizationDecisionOutput {
    allowed: boolean;
    evaluationMode: 'RBAC' | 'RBAC_ABAC';
    reason?: string;
    matchedPolicy?: string;
    explainCode?: string;
    matchedPolicyId?: string;
    policyExplainEntries?: PolicyExplainEntryOutput[];
}
/**
 * @deprecated OUTDATED: kept for the historical CheckPermissionWithContext RPC.
 * New business resource authorization should use application-level checkResource
 * and buildQueryScope flows instead of this RPC as the standard integration path.
 */
export interface PermissionCheckWithContextInput {
    accountId: string;
    permissionCode: string;
    tenantId?: string;
    subjectAttributes: Record<string, string>;
    resourceAttributes: Record<string, string>;
    environmentAttributes: Record<string, string>;
    actionAttributes: Record<string, string>;
}
export type PermissionCheckOutput = AuthorizationDecisionOutput;
export type AuthzDecisionOutput = AuthorizationDecisionOutput;
