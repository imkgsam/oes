import {
  BindExistingPartyToTenantRequest,
  BindExistingPartyToTenantResponse,
  DeactivateTenantPartyRequest,
  DeactivateTenantPartyResponse,
  GetPartyByIdRequest,
  GetPartyByIdResponse,
  GetTenantPartyByIdRequest,
  GetTenantPartyByIdResponse,
  ListPartyRelationshipsRequest,
  ListPartyRelationshipsResponse,
  MergePartiesRequest,
  MergePartiesResponse,
  RegisterOrganizationPartyRequest,
  RegisterOrganizationPartyResponse,
  RegisterPersonPartyRequest,
  RegisterPersonPartyResponse,
  ResolvePartyByIdentifierRequest,
  ResolvePartyByIdentifierResponse,
  SearchPartyCandidatesRequest,
  SearchPartyCandidatesResponse
} from '../../generated/party_service/party'

/** IPartyRegistrationServiceRpcContract defines the write-side party registration RPC surface. */
export interface IPartyRegistrationServiceRpcContract {
  registerPersonParty(data: RegisterPersonPartyRequest): Promise<RegisterPersonPartyResponse>
  registerOrganizationParty(data: RegisterOrganizationPartyRequest): Promise<RegisterOrganizationPartyResponse>
  bindExistingPartyToTenant(data: BindExistingPartyToTenantRequest): Promise<BindExistingPartyToTenantResponse>
  deactivateTenantParty(data: DeactivateTenantPartyRequest): Promise<DeactivateTenantPartyResponse>
}

/** IPartyQueryServiceRpcContract defines the read-only party query RPC surface. */
export interface IPartyQueryServiceRpcContract {
  getPartyById(data: GetPartyByIdRequest): Promise<GetPartyByIdResponse>
  getTenantPartyById(data: GetTenantPartyByIdRequest): Promise<GetTenantPartyByIdResponse>
  resolvePartyByIdentifier(data: ResolvePartyByIdentifierRequest): Promise<ResolvePartyByIdentifierResponse>
  searchPartyCandidates(data: SearchPartyCandidatesRequest): Promise<SearchPartyCandidatesResponse>
  listPartyRelationships(data: ListPartyRelationshipsRequest): Promise<ListPartyRelationshipsResponse>
}

/** IPartyMergeServiceRpcContract defines the guarded canonical-party merge RPC surface. */
export interface IPartyMergeServiceRpcContract {
  mergeParties(data: MergePartiesRequest): Promise<MergePartiesResponse>
}
