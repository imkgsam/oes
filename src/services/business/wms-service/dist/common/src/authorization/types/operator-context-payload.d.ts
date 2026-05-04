export interface OperatorContextPayload {
    operator_id: string;
    operator_type: string;
    tenant_id?: string;
    org_id?: string;
    issued_at: string;
    expires_at: string;
    issuer: string;
    signature: string;
    operator_roles?: string[];
    request_id?: string;
    trace_id?: string;
}
export type UnsignedOperatorContextPayload = Omit<OperatorContextPayload, 'signature'>;
