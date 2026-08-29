import { LoginResponse } from '@oes/common/generated/auth_service'
import { DownstreamRequestSource } from '../../../../common/grpc/gateway-downstream-source.mapper'
import { TenantOrgQueryGrpcAdapter } from '../../infrastructure/downstream/tenant-org-service/tenant-org-query-grpc.adapter'

// Hydrates auth account-option payloads with tenant names from tenant-org-service so auth-service only returns tenant identity facts.
export async function hydrateAuthResponseTenantNames(
  result: LoginResponse,
  source: DownstreamRequestSource,
  tenantOrgAdapter?: TenantOrgQueryGrpcAdapter
): Promise<LoginResponse> {
  const accounts = result.accounts ?? []
  // Login and account selection precede Gateway session verification. Tenant names are optional
  // presentation data and must not trigger a BUSINESS downstream call from an unverified source.
  if (accounts.length === 0 || !tenantOrgAdapter || !source.user) {
    return result
  }

  const tenantIds = [...new Set(accounts.map((account) => normalize(account.tenantId)).filter(Boolean))] as string[]
  if (tenantIds.length === 0) {
    return result
  }

  const tenantEntries = await Promise.all(
    tenantIds.map(async (tenantId) => {
      const tenant = await tenantOrgAdapter.getTenantById(tenantId, source)
      return [tenantId, normalize(tenant.tenant?.name)] as const
    })
  )
  const tenantNameMap = new Map(tenantEntries)

  return {
    ...result,
    accounts: accounts.map((account) => {
      const tenantId = normalize(account.tenantId)
      return {
        ...account,
        tenantName: tenantId ? tenantNameMap.get(tenantId) : undefined
      }
    })
  }
}

function normalize(value?: string): string | undefined {
  const normalized = value?.trim()
  return normalized ? normalized : undefined
}
