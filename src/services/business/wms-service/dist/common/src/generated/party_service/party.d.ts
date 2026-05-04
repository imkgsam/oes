import { Observable } from "rxjs";
export interface PartyIdentifierInput {
    identifierType?: string | undefined;
    normalizedValue?: string | undefined;
    rawValue?: string | undefined;
    issuerCountryOrRegion?: string | undefined;
    status?: string | undefined;
}
export interface PartySummary {
    id?: string | undefined;
    type?: string | undefined;
    status?: string | undefined;
    canonicalName?: string | undefined;
    displayName?: string | undefined;
}
export interface TenantPartySummary {
    id?: string | undefined;
    tenantId?: string | undefined;
    partyId?: string | undefined;
    localDisplayName?: string | undefined;
    localCode?: string | undefined;
    status?: string | undefined;
}
export interface PartyCandidate {
    party?: PartySummary | undefined;
    confidence?: number | undefined;
    matchSignals?: string[] | undefined;
}
export interface PartyRelationshipSummary {
    id?: string | undefined;
    fromPartyId?: string | undefined;
    toPartyId?: string | undefined;
    relationshipType?: string | undefined;
    assertionLevel?: string | undefined;
    effectiveFrom?: string | undefined;
    effectiveTo?: string | undefined;
}
export interface RegisterPersonPartyRequest {
    tenantId?: string | undefined;
    canonicalName?: string | undefined;
    localDisplayName?: string | undefined;
    localCode?: string | undefined;
    identifiers?: PartyIdentifierInput[] | undefined;
}
export interface RegisterPersonPartyResponse {
    party?: PartySummary | undefined;
    tenantParty?: TenantPartySummary | undefined;
    matchResult?: string | undefined;
}
export interface RegisterOrganizationPartyRequest {
    tenantId?: string | undefined;
    canonicalName?: string | undefined;
    localDisplayName?: string | undefined;
    localCode?: string | undefined;
    registeredCountry?: string | undefined;
    identifiers?: PartyIdentifierInput[] | undefined;
}
export interface RegisterOrganizationPartyResponse {
    party?: PartySummary | undefined;
    tenantParty?: TenantPartySummary | undefined;
    matchResult?: string | undefined;
}
export interface BindExistingPartyToTenantRequest {
    tenantId?: string | undefined;
    partyId?: string | undefined;
    localDisplayName?: string | undefined;
    localCode?: string | undefined;
    tags?: string[] | undefined;
}
export interface BindExistingPartyToTenantResponse {
    party?: PartySummary | undefined;
    tenantParty?: TenantPartySummary | undefined;
}
export interface DeactivateTenantPartyRequest {
    tenantId?: string | undefined;
    tenantPartyId?: string | undefined;
    reason?: string | undefined;
}
export interface DeactivateTenantPartyResponse {
    tenantParty?: TenantPartySummary | undefined;
}
export interface GetPartyByIdRequest {
    partyId?: string | undefined;
}
export interface GetPartyByIdResponse {
    party?: PartySummary | undefined;
}
export interface GetTenantPartyByIdRequest {
    tenantId?: string | undefined;
    tenantPartyId?: string | undefined;
}
export interface GetTenantPartyByIdResponse {
    tenantParty?: TenantPartySummary | undefined;
}
export interface ResolvePartyByIdentifierRequest {
    identifierType?: string | undefined;
    normalizedValue?: string | undefined;
    rawValue?: string | undefined;
    issuerCountryOrRegion?: string | undefined;
}
export interface ResolvePartyByIdentifierResponse {
    matchType?: string | undefined;
    party?: PartySummary | undefined;
}
export interface SearchPartyCandidatesRequest {
    tenantId?: string | undefined;
    keyword?: string | undefined;
    partyType?: string | undefined;
    registeredCountry?: string | undefined;
    identifiers?: PartyIdentifierInput[] | undefined;
}
export interface SearchPartyCandidatesResponse {
    candidates?: PartyCandidate[] | undefined;
}
export interface ListPartyRelationshipsRequest {
    partyId?: string | undefined;
    relationshipType?: string | undefined;
}
export interface ListPartyRelationshipsResponse {
    relationships?: PartyRelationshipSummary[] | undefined;
}
export interface MergePartiesRequest {
    survivorPartyId?: string | undefined;
    mergedPartyIds?: string[] | undefined;
    reason?: string | undefined;
}
export interface MergePartiesResponse {
    survivorParty?: PartySummary | undefined;
    mergedParties?: PartySummary[] | undefined;
}
export interface PartyRegistrationServiceClient {
    registerPersonParty(request: RegisterPersonPartyRequest, ...rest: any): Observable<RegisterPersonPartyResponse>;
    registerOrganizationParty(request: RegisterOrganizationPartyRequest, ...rest: any): Observable<RegisterOrganizationPartyResponse>;
    bindExistingPartyToTenant(request: BindExistingPartyToTenantRequest, ...rest: any): Observable<BindExistingPartyToTenantResponse>;
    deactivateTenantParty(request: DeactivateTenantPartyRequest, ...rest: any): Observable<DeactivateTenantPartyResponse>;
}
export interface PartyRegistrationServiceController {
    registerPersonParty(request: RegisterPersonPartyRequest, ...rest: any): Promise<RegisterPersonPartyResponse> | Observable<RegisterPersonPartyResponse> | RegisterPersonPartyResponse;
    registerOrganizationParty(request: RegisterOrganizationPartyRequest, ...rest: any): Promise<RegisterOrganizationPartyResponse> | Observable<RegisterOrganizationPartyResponse> | RegisterOrganizationPartyResponse;
    bindExistingPartyToTenant(request: BindExistingPartyToTenantRequest, ...rest: any): Promise<BindExistingPartyToTenantResponse> | Observable<BindExistingPartyToTenantResponse> | BindExistingPartyToTenantResponse;
    deactivateTenantParty(request: DeactivateTenantPartyRequest, ...rest: any): Promise<DeactivateTenantPartyResponse> | Observable<DeactivateTenantPartyResponse> | DeactivateTenantPartyResponse;
}
export declare function PartyRegistrationServiceControllerMethods(): (constructor: Function) => void;
export declare const PARTY_REGISTRATION_SERVICE_NAME = "PartyRegistrationService";
export interface PartyQueryServiceClient {
    getPartyById(request: GetPartyByIdRequest, ...rest: any): Observable<GetPartyByIdResponse>;
    getTenantPartyById(request: GetTenantPartyByIdRequest, ...rest: any): Observable<GetTenantPartyByIdResponse>;
    resolvePartyByIdentifier(request: ResolvePartyByIdentifierRequest, ...rest: any): Observable<ResolvePartyByIdentifierResponse>;
    searchPartyCandidates(request: SearchPartyCandidatesRequest, ...rest: any): Observable<SearchPartyCandidatesResponse>;
    listPartyRelationships(request: ListPartyRelationshipsRequest, ...rest: any): Observable<ListPartyRelationshipsResponse>;
}
export interface PartyQueryServiceController {
    getPartyById(request: GetPartyByIdRequest, ...rest: any): Promise<GetPartyByIdResponse> | Observable<GetPartyByIdResponse> | GetPartyByIdResponse;
    getTenantPartyById(request: GetTenantPartyByIdRequest, ...rest: any): Promise<GetTenantPartyByIdResponse> | Observable<GetTenantPartyByIdResponse> | GetTenantPartyByIdResponse;
    resolvePartyByIdentifier(request: ResolvePartyByIdentifierRequest, ...rest: any): Promise<ResolvePartyByIdentifierResponse> | Observable<ResolvePartyByIdentifierResponse> | ResolvePartyByIdentifierResponse;
    searchPartyCandidates(request: SearchPartyCandidatesRequest, ...rest: any): Promise<SearchPartyCandidatesResponse> | Observable<SearchPartyCandidatesResponse> | SearchPartyCandidatesResponse;
    listPartyRelationships(request: ListPartyRelationshipsRequest, ...rest: any): Promise<ListPartyRelationshipsResponse> | Observable<ListPartyRelationshipsResponse> | ListPartyRelationshipsResponse;
}
export declare function PartyQueryServiceControllerMethods(): (constructor: Function) => void;
export declare const PARTY_QUERY_SERVICE_NAME = "PartyQueryService";
export interface PartyMergeServiceClient {
    mergeParties(request: MergePartiesRequest, ...rest: any): Observable<MergePartiesResponse>;
}
export interface PartyMergeServiceController {
    mergeParties(request: MergePartiesRequest, ...rest: any): Promise<MergePartiesResponse> | Observable<MergePartiesResponse> | MergePartiesResponse;
}
export declare function PartyMergeServiceControllerMethods(): (constructor: Function) => void;
export declare const PARTY_MERGE_SERVICE_NAME = "PartyMergeService";
