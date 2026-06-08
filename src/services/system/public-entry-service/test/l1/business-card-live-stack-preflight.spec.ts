import {
  BUSINESS_CARD_LIVE_STACK_REQUIRED_FIXTURE_ENVS,
  BUSINESS_CARD_LIVE_STACK_REQUIRED_SERVICES,
  buildBusinessCardLiveStackPreflightReport
} from '../../scripts/business-card-live-stack-preflight'

// Verifies live-stack preflight reports every required service endpoint and fixture input explicitly.
describe('BusinessCard live-stack preflight', () => {
  it('passes only when all service endpoints are reachable and fixture envs are present', async () => {
    const report = await buildBusinessCardLiveStackPreflightReport({
      env: {
        BUSINESS_CARD_LIVE_TENANT_ID: 'tenant-1',
        BUSINESS_CARD_LIVE_EMPLOYEE_ID: 'employee-1',
        BUSINESS_CARD_LIVE_OPERATOR_ACCOUNT_ID: 'operator-1',
        BUSINESS_CARD_LIVE_SELF_ACCOUNT_ID: 'self-1',
        BUSINESS_CARD_LIVE_WORK_EMAIL_CONTACT_ASSET_ID: 'contact-email-1'
      },
      probeEndpoint: async () => true
    })

    expect(report.ready).toBe(true)
    expect(report.services).toHaveLength(BUSINESS_CARD_LIVE_STACK_REQUIRED_SERVICES.length)
    expect(report.fixtureInputs).toHaveLength(BUSINESS_CARD_LIVE_STACK_REQUIRED_FIXTURE_ENVS.length)
    expect(report.missing).toEqual([])
  })

  it('fails closed with actionable missing service and fixture details', async () => {
    const report = await buildBusinessCardLiveStackPreflightReport({
      env: {
        BUSINESS_CARD_LIVE_TENANT_ID: 'tenant-1'
      },
      probeEndpoint: async (endpoint) => endpoint.name === 'permission-service'
    })

    expect(report.ready).toBe(false)
    expect(report.missing).toEqual(
      expect.arrayContaining([
        'identity-service endpoint 127.0.0.1:50052 is not reachable',
        'tenant-org-service endpoint 127.0.0.1:50054 is not reachable',
        'hr-service endpoint 127.0.0.1:50055 is not reachable',
        'public-entry-service endpoint 127.0.0.1:50067 is not reachable',
        'api-gateway endpoint 127.0.0.1:9101 is not reachable',
        'fixture env BUSINESS_CARD_LIVE_EMPLOYEE_ID is missing',
        'fixture env BUSINESS_CARD_LIVE_OPERATOR_ACCOUNT_ID is missing',
        'fixture env BUSINESS_CARD_LIVE_SELF_ACCOUNT_ID is missing',
        'fixture env BUSINESS_CARD_LIVE_WORK_EMAIL_CONTACT_ASSET_ID is missing'
      ])
    )
  })
})
