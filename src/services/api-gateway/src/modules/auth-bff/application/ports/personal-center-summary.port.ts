import { DownstreamRequestSource } from '../../../../common/grpc/gateway-downstream-source.mapper'

export const PERSONAL_CENTER_SUMMARY_PORT = Symbol('PERSONAL_CENTER_SUMMARY_PORT')

export interface PersonalCenterLoginMethodSummary {
  label: string
  type: string
  value?: string
}

export interface PersonalCenterSummary {
  avatar?: string
  displayName?: string
  bio?: string
  loginEmail?: string
  loginMethods: PersonalCenterLoginMethodSummary[]
  loginPhone?: string
  workEmail?: string
  workPhone?: string
}

// Defines the read-only user/account summary contract used by the personal-center use case.
export interface PersonalCenterSummaryPort {
  getPersonalCenterSummary(
    userId: string,
    accountId: string,
    source: DownstreamRequestSource
  ): Promise<PersonalCenterSummary>
}
