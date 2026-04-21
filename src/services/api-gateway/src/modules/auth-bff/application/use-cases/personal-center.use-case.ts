import { Inject, Injectable } from '@nestjs/common'
import { DownstreamRequestSource } from '../../../../common/grpc/gateway-downstream-source.mapper'
import {
  PERSONAL_CENTER_SUMMARY_PORT,
  PersonalCenterSummaryPort
} from '../ports/personal-center-summary.port'
import { PersonalCenterViewModel } from '../../interfaces/http/view-models/personal-center.view-model'
import { SessionAccessSummaryUseCase } from './session-access-summary.use-case'
import { SessionContextUseCase } from './session-context.use-case'

@Injectable()
// Aggregates the first-stage personal-center payload without mixing user identity and account context semantics.
export class PersonalCenterUseCase {
  constructor(
    private readonly sessionContextUseCase: SessionContextUseCase,
    private readonly sessionAccessSummaryUseCase: SessionAccessSummaryUseCase,
    @Inject(PERSONAL_CENTER_SUMMARY_PORT)
    private readonly identitySummaryPort: PersonalCenterSummaryPort
  ) {}

  async execute(source: DownstreamRequestSource): Promise<PersonalCenterViewModel> {
    const [sessionContext, accessSummary, identitySummary] = await Promise.all([
      this.sessionContextUseCase.execute(source),
      this.sessionAccessSummaryUseCase.execute(source),
      this.identitySummaryPort.getPersonalCenterSummary(
        source.user?.sub ?? '',
        source.user?.aid ?? '',
        source
      )
    ])

    return {
      userProfile: {
        loginEmail: identitySummary.loginEmail,
        loginPhone: identitySummary.loginPhone,
        loginMethods: identitySummary.loginMethods ?? []
      },
      accountContext: {
        accountId: sessionContext.account?.accountId ?? '',
        accountName: sessionContext.account?.name,
        avatar: identitySummary.avatar,
        displayName: identitySummary.displayName,
        bio: identitySummary.bio,
        tenantId: sessionContext.tenant?.tenantId,
        tenantName: sessionContext.tenant?.name,
        scopeLevel: sessionContext.scopeLevel,
        roles: accessSummary.roles ?? [],
        workEmail: identitySummary.workEmail,
        workPhone: identitySummary.workPhone
      },
      securityEntries: [
        { code: 'session-security', label: '会话管理', path: '/account/security' },
        { code: 'mfa-security', label: 'MFA 与恢复码', path: '/account/security' }
      ]
    }
  }
}
