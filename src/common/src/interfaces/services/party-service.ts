import {
  DeactivateTenantPartyRequest,
  DeactivateTenantPartyResponse,
  GetTenantPartyByIdRequest,
  GetTenantPartyByIdResponse,
  RegisterTenantPartyRequest,
  RegisterTenantPartyResponse,
  ResolveTenantPartyByIdentifierRequest,
  ResolveTenantPartyByIdentifierResponse,
  ResolveTenantPartyForConsumerRequest,
  ResolveTenantPartyForConsumerResponse,
  SearchTenantPartyCandidatesRequest,
  SearchTenantPartyCandidatesResponse
} from '../../generated/party_service/party'

/** IPartyRegistrationServiceRpcContract defines the write-side tenant-scoped party registration RPC surface. */
export interface IPartyRegistrationServiceRpcContract {
  registerTenantParty(data: RegisterTenantPartyRequest): Promise<RegisterTenantPartyResponse>
  deactivateTenantParty(data: DeactivateTenantPartyRequest): Promise<DeactivateTenantPartyResponse>
}

/** IPartyQueryServiceRpcContract defines the read-only tenant-scoped party query RPC surface. */
export interface IPartyQueryServiceRpcContract {
  getTenantPartyById(data: GetTenantPartyByIdRequest): Promise<GetTenantPartyByIdResponse>
  resolveTenantPartyByIdentifier(
    data: ResolveTenantPartyByIdentifierRequest
  ): Promise<ResolveTenantPartyByIdentifierResponse>
  resolveTenantPartyForConsumer(data: ResolveTenantPartyForConsumerRequest): Promise<ResolveTenantPartyForConsumerResponse>
  searchTenantPartyCandidates(data: SearchTenantPartyCandidatesRequest): Promise<SearchTenantPartyCandidatesResponse>
}
