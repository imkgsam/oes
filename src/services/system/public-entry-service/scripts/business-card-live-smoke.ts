import { ClientGrpc, ClientProxyFactory, Transport } from '@nestjs/microservices'
import { resolveCommonProtoPath } from '@oes/common/contracts'
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
import { lastValueFrom } from 'rxjs'

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

// runBusinessCardLiveSmokeFlow executes Phase 1 through the public-entry-service gRPC boundary.
export async function runBusinessCardLiveSmokeFlow(
  options: RunBusinessCardLiveSmokeOptions = {}
): Promise<BusinessCardLiveSmokeReport> {
  const input = options.input ?? buildBusinessCardLiveSmokeInputFromEnv(options.env)
  const client = options.client ?? createPublicEntryBusinessCardLiveSmokeClient()

  try {
    const operatorContext = {
      operatorAccountId: input.operatorAccountId,
      operatorOrgId: input.operatorOrgId,
      traceId: input.traceId
    }
    const ensured = await client.ensurePrimaryBusinessCard({
      tenantId: input.tenantId,
      employeeId: input.employeeId,
      operatorContext
    })
    const businessCardId = ensured.businessCard?.businessCardId
    if (!businessCardId) {
      throw new Error('BusinessCard live smoke failed: ensurePrimaryBusinessCard did not return businessCardId')
    }

    await client.updateBusinessCardContactActions({
      tenantId: input.tenantId,
      businessCardId,
      operatorContext,
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
      tenantId: input.tenantId,
      businessCardId,
      operatorContext
    })
    const shortCode = publicEntry.publicEntryRef?.shortCode
    const publicUrl = publicEntry.publicEntryRef?.publicUrl
    if (!shortCode || !publicUrl) {
      throw new Error('BusinessCard live smoke failed: public entry shortCode/publicUrl missing after bind')
    }

    const enabled = await client.enableBusinessCard({
      tenantId: input.tenantId,
      businessCardId,
      operatorContext
    })
    if (enabled.status !== BusinessCardStatus.BUSINESS_CARD_STATUS_ACTIVE) {
      throw new Error(`BusinessCard live smoke failed: enable returned status=${enabled.status}`)
    }

    const detail = await client.getBusinessCardDetail({
      tenantId: input.tenantId,
      businessCardId,
      operatorContext
    })
    if (detail.businessCard?.status !== BusinessCardStatus.BUSINESS_CARD_STATUS_ACTIVE) {
      throw new Error(`BusinessCard live smoke failed: detail status=${detail.businessCard?.status}`)
    }

    const readiness = await client.runBusinessCardReadinessCheck({
      tenantId: input.tenantId,
      businessCardId,
      operatorContext
    })
    if (!readiness.ready) {
      throw new Error(
        `BusinessCard live smoke failed: readiness failed with reasons=${(readiness.reasons ?? []).join(',')}`
      )
    }

    const publicRender = await client.renderPublicBusinessCard({
      tenantId: input.tenantId,
      businessCardId,
      traceId: input.traceId
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
      tenantId: input.tenantId,
      businessCardId,
      traceId: input.traceId
    })
    if (!vcard.contentType?.includes('text/vcard') || !vcard.body?.includes('BEGIN:VCARD')) {
      throw new Error('BusinessCard live smoke failed: vCard response is not a vCard payload')
    }

    const selfPreview = await client.getOwnBusinessCardPreview({
      tenantId: input.tenantId,
      accountId: input.selfAccountId,
      traceId: input.traceId
    })
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
      referrer: 'https://local-smoke.oes/business-card',
      traceId: input.traceId
    })
    if (
      redirect.resultType !== PublicRedirectResultType.PUBLIC_REDIRECT_RESULT_TYPE_REDIRECT ||
      !redirect.location
    ) {
      throw new Error(`BusinessCard live smoke failed: redirect result=${redirect.resultType}`)
    }

    const visitSummary = await client.getBusinessCardVisitSummary({
      tenantId: input.tenantId,
      businessCardId,
      operatorContext
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

// createPublicEntryBusinessCardLiveSmokeClient builds a thin Nest gRPC client for the public-entry-service live endpoint.
export function createPublicEntryBusinessCardLiveSmokeClient(
  url = process.env.PUBLIC_ENTRY_GRPC_URL?.trim() || process.env.GRPC_SERVICE_PUBLIC_ENTRY_URL?.trim() || '127.0.0.1:50067'
): BusinessCardLiveSmokeClient {
  const client = ClientProxyFactory.create({
    transport: Transport.GRPC,
    options: {
      package: 'public_entry_service',
      protoPath: [resolveCommonProtoPath('public_entry_service/public_entry.proto')],
      url
    }
  }) as unknown as ClientGrpc & { close?: () => void }
  const businessCard = client.getService<PublicEntryBusinessCardServiceClient>(
    PUBLIC_ENTRY_BUSINESS_CARD_SERVICE_NAME
  )
  const shortLink = client.getService<PublicEntryShortLinkServiceClient>(
    PUBLIC_ENTRY_SHORT_LINK_SERVICE_NAME
  )

  return {
    ensurePrimaryBusinessCard: (request) => lastValueFrom(businessCard.ensurePrimaryBusinessCard(request)),
    updateBusinessCardContactActions: (request) =>
      lastValueFrom(businessCard.updateBusinessCardContactActions(request)),
    bindOrRefreshBusinessCardPublicEntry: (request) =>
      lastValueFrom(businessCard.bindOrRefreshBusinessCardPublicEntry(request)),
    enableBusinessCard: (request) => lastValueFrom(businessCard.enableBusinessCard(request)),
    getBusinessCardDetail: (request) => lastValueFrom(businessCard.getBusinessCardDetail(request)),
    runBusinessCardReadinessCheck: (request) =>
      lastValueFrom(businessCard.runBusinessCardReadinessCheck(request)),
    renderPublicBusinessCard: (request) => lastValueFrom(businessCard.renderPublicBusinessCard(request)),
    generateBusinessCardVCard: (request) => lastValueFrom(businessCard.generateBusinessCardVCard(request)),
    getOwnBusinessCardPreview: (request) => lastValueFrom(businessCard.getOwnBusinessCardPreview(request)),
    resolvePublicRedirect: (request) => lastValueFrom(shortLink.resolvePublicRedirect(request)),
    getBusinessCardVisitSummary: (request) =>
      lastValueFrom(businessCard.getBusinessCardVisitSummary(request)),
    close: async () => {
      client.close?.()
    }
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
