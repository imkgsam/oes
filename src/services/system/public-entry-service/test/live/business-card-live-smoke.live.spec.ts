import {
  buildBusinessCardLiveStackPreflightReport,
  renderBusinessCardLiveStackPreflightReport
} from '../../scripts/business-card-live-stack-preflight'
import {
  renderBusinessCardLiveSmokeReport,
  runBusinessCardLiveSmokeFlow
} from '../../scripts/business-card-live-smoke'

// Verifies the real local BusinessCard Phase 1 service chain through public-entry-service gRPC.
describe('BusinessCard live smoke', () => {
  it('runs the full management, public render, vCard, self-view, redirect, and stats loop', async () => {
    const preflight = await buildBusinessCardLiveStackPreflightReport()
    if (!preflight.ready) {
      throw new Error(renderBusinessCardLiveStackPreflightReport(preflight))
    }

    const report = await runBusinessCardLiveSmokeFlow()
    console.log(renderBusinessCardLiveSmokeReport(report))

    expect(report.ready).toBe(true)
    expect(report.businessCardId).toBeTruthy()
    expect(report.shortCode).toBeTruthy()
    expect(report.publicRenderState).toBe('AVAILABLE')
    expect(report.selfPreviewState).toBe('AVAILABLE')
    expect(report.vCardContentType).toContain('text/vcard')
  }, 30000)
})
