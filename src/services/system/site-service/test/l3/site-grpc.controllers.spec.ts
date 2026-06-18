import {
  CreateSiteRequest,
  GetLatestPublishStateRequest,
  ListSiteCardsRequest,
  ReportSyncResultRequest
} from '@oes/common/generated/site_service'
import { SiteAdminGrpcController } from '../../src/interfaces/grpc/site-admin.grpc.controller'
import { SiteRuntimeGrpcController } from '../../src/interfaces/grpc/site-runtime.grpc.controller'

describe('site-service gRPC controllers L3', () => {
  it('Admin gRPC / maps CreateSite and ListSiteCards to the application service', async () => {
    const app = {
      createSite: jest.fn().mockResolvedValue({
        siteId: 'site_a',
        status: 'draft',
        defaultLocale: 'en-US'
      }),
      listSiteCards: jest.fn().mockResolvedValue({
        cards: [
          {
            siteId: 'site_a',
            siteName: 'Brand US',
            status: 'draft',
            activeLocales: ['en-US'],
            pendingSyncCount: 0,
            latestPublishVersion: 0,
            runtimePublishVersion: 0,
            runtimeStatus: 'unknown'
          }
        ]
      })
    }
    const controller = new SiteAdminGrpcController(app as never)
    const createRequest: CreateSiteRequest = {
      tenantId: 'tenant_a',
      operatorId: 'operator_a',
      traceId: 'trace_a',
      siteName: 'Brand US',
      siteType: 'brand',
      defaultLocale: 'en-US',
      primaryDomain: '',
      previewBaseUrl: ''
    }
    const listRequest: ListSiteCardsRequest = {
      tenantId: 'tenant_a',
      operatorId: 'operator_a',
      traceId: 'trace_a'
    }

    await expect(controller.createSite(createRequest)).resolves.toEqual({
      siteId: 'site_a',
      status: 'draft',
      defaultLocale: 'en-US'
    })
    await expect(controller.listSiteCards(listRequest)).resolves.toEqual({
      cards: [
        expect.objectContaining({
          siteId: 'site_a',
          siteName: 'Brand US'
        })
      ]
    })
    expect(app.createSite).toHaveBeenCalledWith(createRequest)
    expect(app.listSiteCards).toHaveBeenCalledWith(listRequest)
  })

  it('Runtime gRPC / maps latest state and sync result reports to the application service', async () => {
    const app = {
      getLatestPublishState: jest.fn().mockResolvedValue({
        siteId: 'site_a',
        latestPublishVersion: 5,
        latestSyncId: 'sync_a',
        hasUpdates: true,
        serverTime: '2026-06-15T08:00:00.000Z'
      }),
      reportSyncResult: jest.fn().mockResolvedValue({
        accepted: true,
        serverTime: '2026-06-15T08:01:00.000Z'
      })
    }
    const controller = new SiteRuntimeGrpcController(app as never)
    const latestRequest: GetLatestPublishStateRequest = {
      signedContext: {
        siteId: 'site_a',
        clientId: 'client_a',
        credentialId: 'cred_a',
        requestId: 'request_a',
        traceId: 'trace_a'
      },
      localPublishVersion: 3
    }
    const reportRequest: ReportSyncResultRequest = {
      signedContext: latestRequest.signedContext,
      syncId: 'sync_a',
      localPublishVersion: 5,
      status: 'completed',
      startedAt: '2026-06-15T08:00:30.000Z',
      completedAt: '2026-06-15T08:00:45.000Z',
      errorCode: '',
      errorMessage: ''
    }

    await expect(controller.getLatestPublishState(latestRequest)).resolves.toEqual({
      siteId: 'site_a',
      latestPublishVersion: 5,
      latestSyncId: 'sync_a',
      hasUpdates: true,
      serverTime: '2026-06-15T08:00:00.000Z'
    })
    await expect(controller.reportSyncResult(reportRequest)).resolves.toEqual({
      accepted: true,
      serverTime: '2026-06-15T08:01:00.000Z'
    })
    expect(app.getLatestPublishState).toHaveBeenCalledWith(latestRequest)
    expect(app.reportSyncResult).toHaveBeenCalledWith(reportRequest)
  })
})
