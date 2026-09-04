import {
  createBusinessCardSmokeSeed,
  runBusinessCardSmokeFlow
} from '../../scripts/business-card-smoke-lib'

// Verifies BusinessCard Phase 1 persists config refs, binds ShortLink, renders public view, records visits, and audits mutations.
describe('public-entry-service BusinessCard smoke flow', () => {
  it('executes the BusinessCard public-entry loop without persisting upstream display/contact truth', async () => {
    const seed = createBusinessCardSmokeSeed(1_780_859_999_001)
    const result = await runBusinessCardSmokeFlow(seed)

    expect(result.businessCard.status).toBe('ACTIVE')
    expect(result.publicRender.state).toBe('AVAILABLE')
    expect(
      result.publicRender.view?.contactActions.map((action) => action.contactActionType)
    ).toEqual(['CALL_PHONE', 'SEND_EMAIL', 'OPEN_COMPANY_WEBSITE', 'SAVE_VCARD'])
    expect(result.redirect).toEqual({
      type: 'REDIRECT',
      location: `${seed.publicRenderBaseUrl}/public/business-cards/${result.businessCard.businessCardId}`
    })
    expect(result.visitSummary.totalVisits).toBe(1)
    expect(result.vcard.body).toContain('BEGIN:VCARD')
    expect(result.vcard.body).toContain('EMAIL;TYPE=WORK:alex.chen@example.com')
    expect(result.persistedTruthLeakCheck.containsDisplayOrContactTruth).toBe(false)
    expect(result.auditActions).toEqual(
      expect.arrayContaining(['CREATE', 'UPDATE_CONTACT_ACTIONS', 'BIND_PUBLIC_ENTRY', 'ENABLE'])
    )
  })
})
