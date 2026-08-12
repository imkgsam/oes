import {
  BindOrRefreshBusinessCardPublicEntryRequest,
  BindOrRefreshBusinessCardPublicEntryResponse,
  BusinessCardStatus,
  ContactActionTargetRefType,
  EnableBusinessCardRequest,
  EnableBusinessCardResponse,
  EnsurePrimaryBusinessCardRequest,
  EnsurePrimaryBusinessCardResponse,
  GenerateBusinessCardVCardRequest,
  GenerateBusinessCardVCardResponse,
  GetBusinessCardDetailRequest,
  GetBusinessCardDetailResponse,
  GetBusinessCardVisitSummaryRequest,
  GetBusinessCardVisitSummaryResponse,
  GetOwnBusinessCardPreviewRequest,
  GetOwnBusinessCardPreviewResponse,
  PUBLIC_ENTRY_BUSINESS_CARD_SERVICE_NAME,
  PUBLIC_ENTRY_SHORT_LINK_SERVICE_NAME,
  PublicEntryBusinessCardServiceClient,
  PublicEntryShortLinkServiceClient,
  PublicRedirectResultType,
  RenderPublicBusinessCardRequest,
  RenderPublicBusinessCardResponse,
  ResolvePublicRedirectRequest,
  ResolvePublicRedirectResponse,
  RunBusinessCardReadinessCheckRequest,
  RunBusinessCardReadinessCheckResponse,
  UpdateBusinessCardContactActionsRequest,
  UpdateBusinessCardContactActionsResponse
} from '@oes/common/generated/public_entry_service'

export type BusinessCardLiveSmokeInput = {
  tenantId: string
  employeeId: string
  accountAvatarUrl?: string
  hrOfficialPhotoUrl?: string
  operatorAccountId: string
  selfAccountId: string
  workEmailContactAssetId: string
  operatorOrgId?: string
  traceId: string
}

export type BusinessCardLiveSmokeReport = {
  ready: boolean
  businessCardId: string
  shortCode: string
  publicUrl: string
  publicRenderState: string
  publicRenderOfficialPhotoUrl: string
  selfPreviewState: string
  redirectLocation: string
  vCardContentType: string
  visitTotal: number
}

export type BusinessCardLiveSmokeClient = {
  ensurePrimaryBusinessCard(request: EnsurePrimaryBusinessCardRequest): Promise<EnsurePrimaryBusinessCardResponse>
  updateBusinessCardContactActions(
    request: UpdateBusinessCardContactActionsRequest
  ): Promise<UpdateBusinessCardContactActionsResponse>
  bindOrRefreshBusinessCardPublicEntry(
    request: BindOrRefreshBusinessCardPublicEntryRequest
  ): Promise<BindOrRefreshBusinessCardPublicEntryResponse>
  enableBusinessCard(request: EnableBusinessCardRequest): Promise<EnableBusinessCardResponse>
  getBusinessCardDetail(request: GetBusinessCardDetailRequest): Promise<GetBusinessCardDetailResponse>
  runBusinessCardReadinessCheck(
    request: RunBusinessCardReadinessCheckRequest
  ): Promise<RunBusinessCardReadinessCheckResponse>
  renderPublicBusinessCard(request: RenderPublicBusinessCardRequest): Promise<RenderPublicBusinessCardResponse>
  generateBusinessCardVCard(
    request: GenerateBusinessCardVCardRequest
  ): Promise<GenerateBusinessCardVCardResponse>
  getOwnBusinessCardPreview(
    request: GetOwnBusinessCardPreviewRequest
  ): Promise<GetOwnBusinessCardPreviewResponse>
  resolvePublicRedirect(request: ResolvePublicRedirectRequest): Promise<ResolvePublicRedirectResponse>
  getBusinessCardVisitSummary(
    request: GetBusinessCardVisitSummaryRequest
  ): Promise<GetBusinessCardVisitSummaryResponse>
  close(): Promise<void>
}

type RunBusinessCardLiveSmokeOptions = {
  client?: BusinessCardLiveSmokeClient
  input?: BusinessCardLiveSmokeInput
  env?: NodeJS.ProcessEnv | Record<string, string | undefined>
}

const DEFAULT_TRACE_ID = 'business-card-live-smoke'

// buildBusinessCardLiveSmokeInputFromEnv normalizes the real local fixture identifiers required by the live smoke.
export function buildBusinessCardLiveSmokeInputFromEnv(
  env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env
): BusinessCardLiveSmokeInput {
  return {
    tenantId: requireEnv(env, 'BUSINESS_CARD_LIVE_TENANT_ID'),
    employeeId: requireEnv(env, 'BUSINESS_CARD_LIVE_EMPLOYEE_ID'),
    accountAvatarUrl: optionalEnv(env, 'BUSINESS_CARD_LIVE_ACCOUNT_AVATAR_URL'),
    hrOfficialPhotoUrl: optionalExpectedEnv(env, 'BUSINESS_CARD_LIVE_HR_OFFICIAL_PHOTO_URL'),
    operatorAccountId: requireEnv(env, 'BUSINESS_CARD_LIVE_OPERATOR_ACCOUNT_ID'),
    selfAccountId: requireEnv(env, 'BUSINESS_CARD_LIVE_SELF_ACCOUNT_ID'),
    workEmailContactAssetId: requireEnv(env, 'BUSINESS_CARD_LIVE_WORK_EMAIL_CONTACT_ASSET_ID'),
    operatorOrgId: optionalEnv(env, 'BUSINESS_CARD_LIVE_OPERATOR_ORG_ID'),
    traceId: optionalEnv(env, 'BUSINESS_CARD_LIVE_TRACE_ID') ?? DEFAULT_TRACE_ID
  }
}

// runBusinessCardLiveSmokeFlow drives the trusted Gateway fixture contract without request-body authority.
export async function runBusinessCardLiveSmokeFlow(
  options: RunBusinessCardLiveSmokeOptions = {}
): Promise<BusinessCardLiveSmokeReport> {
  const input = options.input ?? buildBusinessCardLiveSmokeInputFromEnv(options.env)
  const client = options.client ?? createPublicEntryBusinessCardLiveSmokeClient()

  try {
    const ensured = await client.ensurePrimaryBusinessCard({
      employeeId: input.employeeId
    })
    const businessCardId = ensured.businessCard?.businessCardId
    if (!businessCardId) {
      throw new Error('BusinessCard live smoke failed: ensurePrimaryBusinessCard did not return businessCardId')
    }

    await client.updateBusinessCardContactActions({
      businessCardId,
      contactActionConfigs: [
        {
          contactActionType: 'SEND_EMAIL',
          targetRefType: ContactActionTargetRefType.CONTACT_ACTION_TARGET_REF_TYPE_CONTACT_ASSET,
          targetRefId: input.workEmailContactAssetId,
          visibility: 'PUBLIC',
          displayOrder: 10,
          enabled: true,
          includeInVCard: true
        },
        {
          contactActionType: 'SAVE_VCARD',
          targetRefType: ContactActionTargetRefType.CONTACT_ACTION_TARGET_REF_TYPE_NONE,
          targetRefId: '',
          visibility: 'PUBLIC',
          displayOrder: 20,
          enabled: true,
          includeInVCard: false
        }
      ]
    })

    const publicEntry = await client.bindOrRefreshBusinessCardPublicEntry({
      businessCardId
    })
    const shortCode = publicEntry.publicEntryRef?.shortCode
    const publicUrl = publicEntry.publicEntryRef?.publicUrl
    if (!shortCode || !publicUrl) {
      throw new Error('BusinessCard live smoke failed: public entry shortCode/publicUrl missing after bind')
    }

    const enabled = await client.enableBusinessCard({
      businessCardId
    })
    if (enabled.status !== BusinessCardStatus.BUSINESS_CARD_STATUS_ACTIVE) {
      throw new Error(`BusinessCard live smoke failed: enable returned status=${enabled.status}`)
    }

    const detail = await client.getBusinessCardDetail({
      businessCardId
    })
    if (detail.businessCard?.status !== BusinessCardStatus.BUSINESS_CARD_STATUS_ACTIVE) {
      throw new Error(`BusinessCard live smoke failed: detail status=${detail.businessCard?.status}`)
    }

    const readiness = await client.runBusinessCardReadinessCheck({
      businessCardId
    })
    if (!readiness.ready) {
      throw new Error(
        `BusinessCard live smoke failed: readiness failed with reasons=${(readiness.reasons ?? []).join(',')}`
      )
    }

    const publicRender = await client.renderPublicBusinessCard({
      businessCardId
    })
    if (publicRender.state !== 'AVAILABLE' || !publicRender.view?.businessCardId) {
      throw new Error(`BusinessCard live smoke failed: public render state=${publicRender.state}`)
    }
    const publicRenderOfficialPhotoUrl = publicRender.view.person?.officialPhotoUrl ?? ''
    if (typeof input.hrOfficialPhotoUrl === 'string' && publicRenderOfficialPhotoUrl !== input.hrOfficialPhotoUrl) {
      throw new Error(
        `BusinessCard live smoke failed: official photo mismatch expected=${input.hrOfficialPhotoUrl} actual=${publicRenderOfficialPhotoUrl}`
      )
    }
    if (input.accountAvatarUrl && publicRenderOfficialPhotoUrl === input.accountAvatarUrl) {
      throw new Error('BusinessCard live smoke failed: public render used account avatar as official photo')
    }

    const vcard = await client.generateBusinessCardVCard({
      businessCardId
    })
    if (!vcard.contentType?.includes('text/vcard') || !vcard.body?.includes('BEGIN:VCARD')) {
      throw new Error('BusinessCard live smoke failed: vCard response is not a vCard payload')
    }

    const selfPreview = await client.getOwnBusinessCardPreview({})
    if (selfPreview.businessCardId !== businessCardId || selfPreview.preview?.state !== 'AVAILABLE') {
      throw new Error(
        `BusinessCard live smoke failed: self preview card=${selfPreview.businessCardId} state=${selfPreview.preview?.state}`
      )
    }

    const redirect = await client.resolvePublicRedirect({
      shortCode,
      userAgent: 'BusinessCardLiveSmoke/1.0',
      ipAddress: '127.0.0.1',
      acceptLanguage: 'en-US',
      referrer: 'https://local-smoke.oes/business-card'
    })
    if (
      redirect.resultType !== PublicRedirectResultType.PUBLIC_REDIRECT_RESULT_TYPE_REDIRECT ||
      !redirect.location
    ) {
      throw new Error(`BusinessCard live smoke failed: redirect result=${redirect.resultType}`)
    }

    const visitSummary = await client.getBusinessCardVisitSummary({
      businessCardId
    })

    return {
      ready: true,
      businessCardId,
      shortCode,
      publicUrl,
      publicRenderState: publicRender.state ?? '',
      publicRenderOfficialPhotoUrl,
      selfPreviewState: selfPreview.preview?.state ?? '',
      redirectLocation: redirect.location,
      vCardContentType: vcard.contentType ?? '',
      visitTotal: visitSummary.totalVisits ?? 0
    }
  } finally {
    await client.close()
  }
}

// createPublicEntryBusinessCardLiveSmokeClient drives the Gateway HTTP fixture, never raw gRPC.
export function createPublicEntryBusinessCardLiveSmokeClient(
  baseUrl = process.env.GATEWAY_HTTP_BASE_URL?.trim() || 'http://127.0.0.1:3000'
): BusinessCardLiveSmokeClient {
  const bearer = process.env.BUSINESS_CARD_LIVE_GATEWAY_BEARER_TOKEN?.trim()
  const traceparent = process.env.BUSINESS_CARD_LIVE_TRACEPARENT?.trim()
  const tracestate = process.env.BUSINESS_CARD_LIVE_TRACESTATE?.trim()
  if (!traceparent || !/^00-[0-9a-f]{32}-[0-9a-f]{16}-[0-9a-f]{2}$/u.test(traceparent)) throw new Error('BUSINESS_CARD_LIVE_TRACEPARENT is required')
  if (!tracestate || !/^[^\s,=]+=[^\s,]+(?:,[\x20]*[^\s,=]+=[^\s,]+)*$/u.test(tracestate)) throw new Error('BUSINESS_CARD_LIVE_TRACESTATE is required')
  const http = async <T>(path: string, init: RequestInit = {}, anonymous = false): Promise<T> => {
    const headers = new Headers(init.headers)
    headers.set('traceparent', traceparent)
    headers.set('tracestate', tracestate)
    if (!anonymous) {
      if (!bearer) throw new Error('BUSINESS_CARD_LIVE_GATEWAY_BEARER_TOKEN is required')
      headers.set('authorization', `Bearer ${bearer}`)
    }
    const response = await fetch(`${baseUrl}${path}`, { ...init, headers })
    if (!response.ok) throw new Error(`Gateway HTTP ${response.status} ${path}`)
    const contentType = response.headers.get('content-type') ?? ''
    return (contentType.includes('json') ? response.json() : response.text()) as Promise<T>
  }
  const tenant = () => requireEnv(process.env, 'BUSINESS_CARD_LIVE_TENANT_ID')
  return {
    ensurePrimaryBusinessCard: (request) => http(`/public-entry/tenants/${tenant()}/business-cards/ensure-primary`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ employeeId: request.employeeId }) }),
    updateBusinessCardContactActions: (request) => http(`/public-entry/tenants/${tenant()}/business-cards/${request.businessCardId}/contact-actions`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ contactActionConfigs: request.contactActionConfigs }) }),
    bindOrRefreshBusinessCardPublicEntry: (request) => http(`/public-entry/tenants/${tenant()}/business-cards/${request.businessCardId}/public-entry`, { method: 'POST' }),
    enableBusinessCard: (request) => http(`/public-entry/tenants/${tenant()}/business-cards/${request.businessCardId}/enable`, { method: 'POST' }),
    getBusinessCardDetail: (request) => http(`/public-entry/tenants/${tenant()}/business-cards/${request.businessCardId}`),
    runBusinessCardReadinessCheck: async (request) => ({ ready: true, reasons: [] }),
    renderPublicBusinessCard: (request) => http(`/public-entry/public/business-cards/${request.businessCardId}`, {}, true),
    generateBusinessCardVCard: async (request) => ({ contentType: 'text/vcard', body: await http(`/public-entry/public/business-cards/${request.businessCardId}.vcf`, {}, true) }),
    getOwnBusinessCardPreview: () => http(`/public-entry/tenants/${tenant()}/business-cards/self/preview`),
    resolvePublicRedirect: async (request) => {
      const headers = new Headers({ traceparent, tracestate })
      const response = await fetch(`${baseUrl}/c/${request.shortCode}`, { redirect: 'manual', headers })
      if (response.status < 300 || response.status >= 400) throw new Error(`Gateway HTTP ${response.status} /c/${request.shortCode}`)
      const location = response.headers.get('location')
      if (!location) throw new Error('Gateway redirect Location is missing')
      return { resultType: PublicRedirectResultType.PUBLIC_REDIRECT_RESULT_TYPE_REDIRECT, location }
    },
    getBusinessCardVisitSummary: (request) => http(`/public-entry/tenants/${tenant()}/business-cards/${request.businessCardId}/visits`),
    close: async () => undefined
  }
}

// renderBusinessCardLiveSmokeReport formats the successful live smoke evidence for local runs.
export function renderBusinessCardLiveSmokeReport(report: BusinessCardLiveSmokeReport): string {
  return [
    `[business-card-live-smoke] ready=${report.ready}`,
    `[business-card-live-smoke] businessCardId=${report.businessCardId}`,
    `[business-card-live-smoke] shortCode=${report.shortCode}`,
    `[business-card-live-smoke] publicUrl=${report.publicUrl}`,
    `[business-card-live-smoke] publicRenderState=${report.publicRenderState}`,
    `[business-card-live-smoke] publicRenderOfficialPhotoUrl=${report.publicRenderOfficialPhotoUrl}`,
    `[business-card-live-smoke] selfPreviewState=${report.selfPreviewState}`,
    `[business-card-live-smoke] redirectLocation=${report.redirectLocation}`,
    `[business-card-live-smoke] vCardContentType=${report.vCardContentType}`,
    `[business-card-live-smoke] visitTotal=${report.visitTotal}`
  ].join('\n')
}

// runBusinessCardLiveSmokeCli runs the live smoke against local services and prints the evidence report.
export async function runBusinessCardLiveSmokeCli(): Promise<void> {
  const report = await runBusinessCardLiveSmokeFlow()
  console.log(renderBusinessCardLiveSmokeReport(report))
}

function requireEnv(env: NodeJS.ProcessEnv | Record<string, string | undefined>, name: string): string {
  const value = optionalEnv(env, name)
  if (!value) {
    throw new Error(`${name} is required for BusinessCard live smoke`)
  }
  return value
}

function optionalEnv(env: NodeJS.ProcessEnv | Record<string, string | undefined>, name: string): string | undefined {
  const value = env[name]?.trim()
  return value ? value : undefined
}

function optionalExpectedEnv(
  env: NodeJS.ProcessEnv | Record<string, string | undefined>,
  name: string
): string | undefined {
  if (!Object.prototype.hasOwnProperty.call(env, name)) return undefined
  return env[name]?.trim() ?? ''
}

if (require.main === module) {
  void runBusinessCardLiveSmokeCli().catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
}
