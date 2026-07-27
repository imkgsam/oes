import { Body, Controller, Headers, Post, Req } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { Public } from '@oes/common/auth'
import { Request } from 'express'
import { SiteRuntimeService, SiteRuntimeSignedHttpRequest } from '../../../site-runtime.service'

type RawBodyRequest = Request & { rawBody?: Buffer }

/** SiteRuntimeController exposes signed Site-facing APIs used by Site Runtime backends. */
@ApiTags('site-runtime')
@Controller('site')
export class SiteRuntimeController {
  constructor(private readonly service: SiteRuntimeService) {}

  /** getLatestPublishState lets a signed runtime query the latest remote publish version. */
  @Public()
  @Post('sync/latest')
  @ApiOperation({ summary: 'Get latest site publish state' })
  getLatestPublishState(
    @Headers() signedHeaders: Record<string, string>,
    @Body() body: Record<string, unknown>,
    @Req() requestOrRawBody?: Request | Buffer
  ) {
    return this.service.getLatestPublishState(
      buildSignedRequest('POST', '/api/v1/site/sync/latest', signedHeaders, body, requestOrRawBody)
    )
  }

  /** registerPageCapabilities accepts the complete Storefront page manifest on the signed site-facing path. */
  @Public()
  @Post('capabilities/pages:register')
  @ApiOperation({ summary: 'Register Storefront page capabilities' })
  registerPageCapabilities(
    @Headers() signedHeaders: Record<string, string>,
    @Body() body: Record<string, unknown>,
    @Req() requestOrRawBody?: Request | Buffer
  ) {
    return this.service.registerPageCapabilities(
      buildSignedRequest('POST', '/api/v1/site/capabilities/pages:register', signedHeaders, body, requestOrRawBody)
    )
  }

  /** listChangedResources lets a signed runtime fetch the aggregated delta resource list. */
  @Public()
  @Post('sync/changed-resources')
  @ApiOperation({ summary: 'List changed resources for site sync' })
  listChangedResources(
    @Headers() signedHeaders: Record<string, string>,
    @Body() body: Record<string, unknown>,
    @Req() requestOrRawBody?: Request | Buffer
  ) {
    return this.service.listChangedResources(
      buildSignedRequest('POST', '/api/v1/site/sync/changed-resources', signedHeaders, body, requestOrRawBody)
    )
  }

  /** batchGetPublicViews lets a signed runtime fetch latest public views by resource refs. */
  @Public()
  @Post('sync/public-views:batchGet')
  @ApiOperation({ summary: 'Batch get public views' })
  batchGetPublicViews(
    @Headers() signedHeaders: Record<string, string>,
    @Body() body: Record<string, unknown>,
    @Req() requestOrRawBody?: Request | Buffer
  ) {
    return this.service.batchGetPublicViews(
      buildSignedRequest('POST', '/api/v1/site/sync/public-views:batchGet', signedHeaders, body, requestOrRawBody)
    )
  }

  /** getSnapshot lets a signed runtime fetch a consistent snapshot view. */
  @Public()
  @Post('sync/snapshot')
  @ApiOperation({ summary: 'Get site public-view snapshot' })
  getSnapshot(
    @Headers() signedHeaders: Record<string, string>,
    @Body() body: Record<string, unknown>,
    @Req() requestOrRawBody?: Request | Buffer
  ) {
    return this.service.getSnapshot(
      buildSignedRequest('POST', '/api/v1/site/sync/snapshot', signedHeaders, body, requestOrRawBody)
    )
  }

  /** reportSyncResult lets a signed runtime update OES runtime sync status. */
  @Public()
  @Post('sync/report-result')
  @ApiOperation({ summary: 'Report Site Runtime sync result' })
  reportSyncResult(
    @Headers() signedHeaders: Record<string, string>,
    @Body() body: Record<string, unknown>,
    @Req() requestOrRawBody?: Request | Buffer
  ) {
    return this.service.reportSyncResult(
      buildSignedRequest('POST', '/api/v1/site/sync/report-result', signedHeaders, body, requestOrRawBody)
    )
  }

  /** getPreviewView lets a signed runtime fetch one draft preview view with a short-lived token. */
  @Public()
  @Post('preview/view')
  @ApiOperation({ summary: 'Get draft preview view' })
  getPreviewView(
    @Headers() signedHeaders: Record<string, string>,
    @Body() body: Record<string, unknown>,
    @Req() requestOrRawBody?: Request | Buffer
  ) {
    return this.service.getPreviewView(
      buildSignedRequest('POST', '/api/v1/site/preview/view', signedHeaders, body, requestOrRawBody)
    )
  }
}

/** buildSignedRequest preserves signed headers and raw body for downstream verification. */
function buildSignedRequest(
  method: string,
  path: string,
  signedHeaders: Record<string, string>,
  body: Record<string, unknown>,
  requestOrRawBody?: Request | Buffer
): SiteRuntimeSignedHttpRequest {
  return {
    method,
    path,
    normalizedQuery: '',
    signedHeaders,
    body,
    rawBody: resolveRawBody(body, requestOrRawBody)
  }
}

/** resolveRawBody preserves canonical request bytes for Site-facing HMAC verification. */
function resolveRawBody(body: Record<string, unknown>, requestOrRawBody?: Request | Buffer): Buffer {
  if (Buffer.isBuffer(requestOrRawBody)) {
    return requestOrRawBody
  }

  const request = requestOrRawBody as RawBodyRequest | undefined
  if (Buffer.isBuffer(request?.rawBody)) {
    return request.rawBody
  }

  if (Buffer.isBuffer(request?.body)) {
    return request.body
  }

  return Buffer.from(JSON.stringify(body ?? {}))
}
