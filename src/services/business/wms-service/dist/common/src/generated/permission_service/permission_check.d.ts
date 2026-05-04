import { Observable } from "rxjs";
export declare enum EvaluationModeProto {
    EVALUATION_MODE_PROTO_UNSPECIFIED = 0,
    EVALUATION_MODE_PROTO_RBAC = 1,
    EVALUATION_MODE_PROTO_RBAC_ABAC = 2
}
export declare enum PolicyEffectExplainProto {
    POLICY_EFFECT_EXPLAIN_PROTO_UNSPECIFIED = 0,
    POLICY_EFFECT_EXPLAIN_PROTO_ALLOW = 1,
    POLICY_EFFECT_EXPLAIN_PROTO_DENY = 2
}
/** 纯 RBAC 鉴权请求 */
export interface CheckPermissionRequest {
    /** 账户ID */
    accountId?: string | undefined;
    /** 权限代码 */
    permissionCode?: string | undefined;
    /** 租户ID（可选） */
    tenantId?: string | undefined;
}
/** 纯 RBAC 批量鉴权单项 */
export interface BatchCheckPermissionItem {
    /** 调用方自带回显标识 */
    requestId?: string | undefined;
    /** 账户ID */
    accountId?: string | undefined;
    /** 权限代码 */
    permissionCode?: string | undefined;
    /** 租户ID（可选） */
    tenantId?: string | undefined;
}
/** 纯 RBAC 批量鉴权请求 */
export interface BatchCheckPermissionRequest {
    items?: BatchCheckPermissionItem[] | undefined;
}
/** OUTDATED: 历史 RBAC + ABAC 混合鉴权请求；不作为新业务资源授权标准入口。 */
export interface CheckPermissionWithContextRequest {
    /** 账户ID */
    accountId?: string | undefined;
    /** 权限代码 */
    permissionCode?: string | undefined;
    /** 租户ID */
    tenantId?: string | undefined;
    /** 主体属性 */
    subjectAttributes?: {
        [key: string]: string;
    } | undefined;
    /** 资源属性 */
    resourceAttributes?: {
        [key: string]: string;
    } | undefined;
    /** 环境属性 */
    environmentAttributes?: {
        [key: string]: string;
    } | undefined;
    /** 操作属性 */
    actionAttributes?: {
        [key: string]: string;
    } | undefined;
}
export interface CheckPermissionWithContextRequest_SubjectAttributesEntry {
    key: string;
    value: string;
}
export interface CheckPermissionWithContextRequest_ResourceAttributesEntry {
    key: string;
    value: string;
}
export interface CheckPermissionWithContextRequest_EnvironmentAttributesEntry {
    key: string;
    value: string;
}
export interface CheckPermissionWithContextRequest_ActionAttributesEntry {
    key: string;
    value: string;
}
/** CheckPermissionResponse preserves the existing wire shape while satisfying RPC-specific response naming hygiene. */
export interface CheckPermissionResponse {
    /** 是否允许 */
    allowed?: boolean | undefined;
    /** 决策评估层级 */
    evaluationMode?: EvaluationModeProto | undefined;
    /** 命中的策略名称 */
    matchedPolicy?: string | undefined;
    /** 决策原因 */
    reason?: string | undefined;
    /** 稳定的机器可读解释码 */
    explainCode?: string | undefined;
    /** 命中的策略ID */
    matchedPolicyId?: string | undefined;
    /** 参与本次评估的策略解释条目 */
    policyExplainEntries?: PolicyExplainEntry[] | undefined;
}
/** 统一鉴权决策响应 */
export interface AuthorizationDecisionResponse {
    /** 是否允许 */
    allowed?: boolean | undefined;
    /** 决策评估层级 */
    evaluationMode?: EvaluationModeProto | undefined;
    /** 命中的策略名称 */
    matchedPolicy?: string | undefined;
    /** 决策原因 */
    reason?: string | undefined;
    /** 稳定的机器可读解释码 */
    explainCode?: string | undefined;
    /** 命中的策略ID */
    matchedPolicyId?: string | undefined;
    /** 参与本次评估的策略解释条目 */
    policyExplainEntries?: PolicyExplainEntry[] | undefined;
}
/** CheckPermissionWithContextResponse preserves the existing wire shape while satisfying RPC-specific response naming hygiene. */
export interface CheckPermissionWithContextResponse {
    /** 是否允许 */
    allowed?: boolean | undefined;
    /** 决策评估层级 */
    evaluationMode?: EvaluationModeProto | undefined;
    /** 命中的策略名称 */
    matchedPolicy?: string | undefined;
    /** 决策原因 */
    reason?: string | undefined;
    /** 稳定的机器可读解释码 */
    explainCode?: string | undefined;
    /** 命中的策略ID */
    matchedPolicyId?: string | undefined;
    /** 参与本次评估的策略解释条目 */
    policyExplainEntries?: PolicyExplainEntry[] | undefined;
}
/** 批量鉴权单项决策 */
export interface BatchAuthorizationDecisionItem {
    /** 调用方回显标识 */
    requestId?: string | undefined;
    /** 是否允许 */
    allowed?: boolean | undefined;
    /** 决策评估层级 */
    evaluationMode?: EvaluationModeProto | undefined;
    /** 命中的策略名称 */
    matchedPolicy?: string | undefined;
    /** 决策原因 */
    reason?: string | undefined;
    /** 稳定的机器可读解释码 */
    explainCode?: string | undefined;
}
/** 批量鉴权响应 */
export interface BatchAuthorizationDecisionResponse {
    decisions?: BatchAuthorizationDecisionItem[] | undefined;
}
/** BatchCheckPermissionResponse preserves the existing wire shape while satisfying RPC-specific response naming hygiene. */
export interface BatchCheckPermissionResponse {
    decisions?: BatchAuthorizationDecisionItem[] | undefined;
}
export interface PolicyExplainEntry {
    policyId?: string | undefined;
    policyName?: string | undefined;
    effect?: PolicyEffectExplainProto | undefined;
    priority?: number | undefined;
    applicable?: boolean | undefined;
    matched?: boolean | undefined;
    reasonCode?: string | undefined;
    conditionExplainTree?: PolicyConditionExplainNode | undefined;
}
export interface PolicyConditionExplainNode {
    nodeType?: string | undefined;
    path?: string | undefined;
    matched?: boolean | undefined;
    reasonCode?: string | undefined;
    source?: string | undefined;
    key?: string | undefined;
    operator?: string | undefined;
    actualValueJson?: string | undefined;
    expectedValueJson?: string | undefined;
    children?: PolicyConditionExplainNode[] | undefined;
}
/** 权限鉴权服务 */
export interface PermissionCheckServiceClient {
    /** 纯 RBAC 鉴权 */
    checkPermission(request: CheckPermissionRequest, ...rest: any): Observable<CheckPermissionResponse>;
    /** 纯 RBAC 批量鉴权 */
    batchCheckPermission(request: BatchCheckPermissionRequest, ...rest: any): Observable<BatchCheckPermissionResponse>;
    /** OUTDATED: 历史 RBAC + ABAC 混合鉴权兼容接口；新业务资源授权应使用 application 层 checkResource / buildQueryScope。 */
    checkPermissionWithContext(request: CheckPermissionWithContextRequest, ...rest: any): Observable<CheckPermissionWithContextResponse>;
}
/** 权限鉴权服务 */
export interface PermissionCheckServiceController {
    /** 纯 RBAC 鉴权 */
    checkPermission(request: CheckPermissionRequest, ...rest: any): Promise<CheckPermissionResponse> | Observable<CheckPermissionResponse> | CheckPermissionResponse;
    /** 纯 RBAC 批量鉴权 */
    batchCheckPermission(request: BatchCheckPermissionRequest, ...rest: any): Promise<BatchCheckPermissionResponse> | Observable<BatchCheckPermissionResponse> | BatchCheckPermissionResponse;
    /** OUTDATED: 历史 RBAC + ABAC 混合鉴权兼容接口；新业务资源授权应使用 application 层 checkResource / buildQueryScope。 */
    checkPermissionWithContext(request: CheckPermissionWithContextRequest, ...rest: any): Promise<CheckPermissionWithContextResponse> | Observable<CheckPermissionWithContextResponse> | CheckPermissionWithContextResponse;
}
export declare function PermissionCheckServiceControllerMethods(): (constructor: Function) => void;
export declare const PERMISSION_CHECK_SERVICE_NAME = "PermissionCheckService";
