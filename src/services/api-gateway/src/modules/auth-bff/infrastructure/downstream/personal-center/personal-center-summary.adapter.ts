import { Injectable } from '@nestjs/common'
import { DownstreamRequestSource } from '../../../../../common/grpc/gateway-downstream-source.mapper'
import {
  PersonalCenterLoginMethodSummary,
  PersonalCenterSummary,
  PersonalCenterSummaryPort
} from '../../../application/ports/personal-center-summary.port'
import { AuthGrpcAdapter } from '../auth-service/auth-grpc.adapter'
import { IdentityQueryGrpcAdapter } from '../identity-service/identity-query-grpc.adapter'

@Injectable()
// Aggregates read-only personal-center data from auth-service and identity-service without leaking downstream shapes.
export class PersonalCenterSummaryAdapter implements PersonalCenterSummaryPort {
  constructor(
    private readonly identityAdapter: IdentityQueryGrpcAdapter,
    private readonly authAdapter: AuthGrpcAdapter
  ) {}

  async getPersonalCenterSummary(
    userId: string,
    accountId: string,
    source: DownstreamRequestSource
  ): Promise<PersonalCenterSummary> {
    const [userResult, accountResult, workEmailResult, workPhoneResult, sessionResult] = await Promise.all([
      this.identityAdapter.getUserById(userId, source),
      this.identityAdapter.getAccountById(accountId, source),
      this.identityAdapter.listAccountWorkEmailAssets(accountId, source),
      this.identityAdapter.listAccountWorkPhoneAssets(accountId, source),
      this.authAdapter.listSessions(userId, source.user?.sid, source)
    ])

    const loginEmail = normalize(userResult.user?.personalEmail)
    const loginPhone = normalize(userResult.user?.personalPhone)

    return {
      avatar: normalize(accountResult.account?.avatarUrl),
      displayName: normalize(accountResult.account?.displayName),
      bio: normalize(accountResult.account?.bio),
      loginEmail,
      loginPhone,
      loginMethods: buildLoginMethods(
        sessionResult.sessions ?? [],
        accountId,
        loginEmail,
        loginPhone
      ),
      workEmail: pickPrimaryAssetValue(workEmailResult.assets ?? []),
      workPhone: pickPrimaryAssetValue(workPhoneResult.assets ?? [])
    }
  }
}

function buildLoginMethods(
  sessions: Array<{ accountId?: string; loginMethod?: string }>,
  accountId: string,
  loginEmail?: string,
  loginPhone?: string
): PersonalCenterLoginMethodSummary[] {
  const currentAccountMethods = [
    ...new Set(
      sessions
        .filter((session) => normalize(session.accountId) === accountId)
        .map((session) => normalizeMethod(session.loginMethod))
        .filter(Boolean)
    )
  ] as string[]

  return currentAccountMethods
    .map((type) => toLoginMethodSummary(type, loginEmail, loginPhone))
    .filter(Boolean) as PersonalCenterLoginMethodSummary[]
}

function toLoginMethodSummary(
  type: string,
  loginEmail?: string,
  loginPhone?: string
): PersonalCenterLoginMethodSummary | null {
  switch (type) {
    case 'EMAIL_PASSWORD':
      return { type, label: '邮箱密码', value: loginEmail }
    case 'EMAIL_OTP':
      return { type, label: '邮箱验证码', value: loginEmail }
    case 'PHONE_PASSWORD':
      return { type, label: '手机密码', value: loginPhone }
    case 'PHONE_OTP':
      return { type, label: '手机验证码', value: loginPhone }
    case 'WECHAT':
      return { type, label: '微信登录' }
    case 'GOOGLE':
      return { type, label: 'Google 登录' }
    default:
      return { type, label: type }
  }
}

function pickPrimaryAssetValue(
  assets: Array<{ isPrimary?: boolean; status?: string; value?: string }>
): string | undefined {
  const normalizedAssets = assets
    .map((asset) => ({
      isPrimary: Boolean(asset.isPrimary),
      status: normalizeStatus(asset.status),
      value: normalize(asset.value)
    }))
    .filter((asset) => asset.value)

  const activeAssets = normalizedAssets.filter((asset) => asset.status !== 'REVOKED')
  const primaryAsset = activeAssets.find((asset) => asset.isPrimary)

  return primaryAsset?.value ?? activeAssets[0]?.value
}

function normalize(value?: string): string | undefined {
  const normalized = value?.trim()
  return normalized ? normalized : undefined
}

function normalizeMethod(method?: string): string | undefined {
  const normalized = normalize(method)
  return normalized ? normalized.toUpperCase() : undefined
}

function normalizeStatus(status?: string): string {
  return normalize(status)?.toUpperCase() ?? ''
}
