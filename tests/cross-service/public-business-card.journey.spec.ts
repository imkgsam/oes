import { chromium, type Browser } from 'playwright'
import {
  createBusinessCardSmokeSeed,
  runBusinessCardSmokeFlow,
  type BusinessCardSmokePublicBoundary
} from '../../src/services/system/public-entry-service/scripts/business-card-smoke-lib'
import { html, listen, type JourneyServer } from './support/http'

/**
 * Prerequisites: task-owned migrated Public Entry Postgres and Playwright Chromium.
 * Boundaries: public ShortLink -> BusinessCard application -> upstream projections -> browser/vCard.
 * Success: an anonymous browser follows the short link, sees public-safe actions, and downloads vCard.
 * Critical failure: an unknown public card returns 404 and exposes no employee/contact projection.
 * Reproduce: pnpm test:run -- --type journey (or the risk-selected change plan).
 */
describe('Public BusinessCard access Journey', () => {
  let browser: Browser
  let server: JourneyServer
  let boundary: BusinessCardSmokePublicBoundary | undefined

  afterAll(async () => {
    await browser?.close()
    await server?.close()
  })

  it('serves an anonymous short-link visit and fails closed for an unknown card', async () => {
    if (!process.env.PUBLIC_ENTRY_DATABASE_URL)
      throw new Error('PUBLIC_ENTRY_DATABASE_URL_REQUIRED')
    process.env.DATABASE_URL = process.env.PUBLIC_ENTRY_DATABASE_URL
    server = await listen(async (request, response) => {
      if (!boundary) {
        response.writeHead(503).end()
        return
      }
      if (request.url?.startsWith('/s/')) {
        const shortCode = request.url.slice('/s/'.length)
        try {
          const result = await boundary.resolveVisit({
            shortCode,
            userAgent: request.headers['user-agent'],
            ipAddress: '127.0.0.1',
            acceptLanguage: request.headers['accept-language'],
            referrer: request.headers.referer
          })
          response.writeHead(302, { location: result.location, 'cache-control': 'no-store' })
          response.end()
        } catch {
          response.writeHead(404).end()
        }
        return
      }
      const vcardMatch = request.url?.match(/^\/public\/business-cards\/([^/?]+)\/vcard$/u)
      if (vcardMatch) {
        try {
          const result = await boundary.generateVCard(vcardMatch[1])
          response.writeHead(200, {
            'content-type': result.contentType,
            'content-disposition': 'attachment; filename="business-card.vcf"'
          })
          response.end(result.body)
        } catch {
          response.writeHead(404).end()
        }
        return
      }
      const cardMatch = request.url?.match(/^\/public\/business-cards\/([^/?]+)$/u)
      if (cardMatch) {
        try {
          const result = await boundary.renderPublicCard(cardMatch[1])
          if (result.state !== 'AVAILABLE' || !result.view) {
            response.writeHead(404).end()
            return
          }
          html(
            response,
            `<!doctype html><html><body><main><h1>${result.view.person.displayName}</h1><p>${result.view.person.title}</p><ul>${result.view.contactActions
              .map(
                (action: any) =>
                  `<li data-action="${action.contactActionType}">${action.displayValue ?? action.contactActionType}</li>`
              )
              .join(
                ''
              )}</ul><a id="vcard" href="/public/business-cards/${cardMatch[1]}/vcard">Save contact</a></main></body></html>`
          )
        } catch {
          response.writeHead(404).end()
        }
        return
      }
      response.writeHead(404).end()
    })

    const seed = createBusinessCardSmokeSeed(1_788_480_000_005)
    seed.publicRenderBaseUrl = server.origin
    const result = await runBusinessCardSmokeFlow(seed, async (publicBoundary) => {
      boundary = publicBoundary
      browser = await chromium.launch({ headless: true })
      const page = await browser.newPage({ acceptDownloads: true })
      const response = await page.goto(`${server.origin}/s/${publicBoundary.shortCode}`)
      expect(response?.status()).toBe(200)
      expect(page.url()).toBe(
        `${server.origin}/public/business-cards/${publicBoundary.businessCardId}`
      )
      expect(await page.locator('h1').textContent()).toBe('Alex Chen')
      expect(await page.locator('[data-action="CALL_PHONE"]').textContent()).toContain('+1')
      expect(await page.locator('[data-action="SEND_EMAIL"]').textContent()).toContain(
        '@example.com'
      )

      const downloadPromise = page.waitForEvent('download')
      await page.locator('#vcard').click()
      const download = await downloadPromise
      expect(download.suggestedFilename()).toMatch(/\.vcf$/u)

      const missing = await page.request.get(`${server.origin}/public/business-cards/missing-card`)
      expect(missing.status()).toBe(404)
      expect(await missing.text()).toBe('')
    })

    expect(result.businessCard.status).toBe('ACTIVE')
    expect(result.publicRender.state).toBe('AVAILABLE')
    expect(result.visitSummary.totalVisits).toBe(1)
    expect(result.persistedTruthLeakCheck.containsDisplayOrContactTruth).toBe(false)
  })
})
