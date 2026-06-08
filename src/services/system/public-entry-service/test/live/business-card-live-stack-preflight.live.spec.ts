import {
  buildBusinessCardLiveStackPreflightReport,
  renderBusinessCardLiveStackPreflightReport
} from '../../scripts/business-card-live-stack-preflight'

// Verifies the real local BusinessCard Phase 1 service chain is ready before full live-stack smoke.
describe('BusinessCard live-stack preflight', () => {
  it('has reachable services and explicit BusinessCard fixture inputs', async () => {
    const report = await buildBusinessCardLiveStackPreflightReport()

    if (!report.ready) {
      throw new Error(renderBusinessCardLiveStackPreflightReport(report))
    }

    expect(report.ready).toBe(true)
  })
})
