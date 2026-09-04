import { describe, expect, it } from 'vitest'

import {
  annotateCrmSearchResultsInCurrentDocument,
  clearCrmSearchResultsAnnotationsInCurrentDocument
} from './crm-page-annotations'

describe('CRM search page annotations', () => {
  it('renders read-only CRM status directly beside Google search results', () => {
    const document = new DOMParser().parseFromString(
      `
        <html>
          <body>
            <div class="g">
              <a href="https://serrano.example/about">
                <h3>Serrano Fixtures</h3>
              </a>
              <div>Ceramic lighting exports.</div>
            </div>
          </body>
        </html>
      `,
      'text/html'
    )

    const result = annotateCrmSearchResultsInCurrentDocument({
      document,
      results: [
        {
          deepLinks: { tenantWebCrmAccountUrl: '/crm/accounts/serrano-1' },
          domain: 'serrano.example',
          status: 'CUSTOMER',
          summary: { displayName: 'Serrano Fixtures', label: 'Customer' },
          title: 'Serrano Fixtures',
          url: 'https://serrano.example/about'
        }
      ],
      tenantWebBaseUrl: 'http://localhost:5771'
    })

    const badge = document.querySelector<HTMLSpanElement>('.oes-crm-search-badge')
    const title = document.querySelector('h3')

    expect(result.annotatedCount).toBe(1)
    expect(badge?.textContent).toContain('Customer')
    expect(title?.querySelector('.oes-crm-search-annotation')).not.toBeNull()
    expect(document.querySelector('.oes-crm-search-open')).toBeNull()
    expect(document.body.textContent).not.toContain('打开 OES')
  })

  it('keeps the injected function self-contained for chrome.scripting serialization', () => {
    const document = new DOMParser().parseFromString(
      `
        <html>
          <body>
            <div class="g">
              <a href="https://pool.example">
                <h3>Pool Candidate</h3>
              </a>
            </div>
          </body>
        </html>
      `,
      'text/html'
    )
    const serializedAnnotator = new Function(
      'payload',
      `
        return (${annotateCrmSearchResultsInCurrentDocument.toString()})(payload)
      `
    )

    expect(serializedAnnotator({
      document,
      results: [
        {
          domain: 'pool.example',
          status: 'POOL_LEAD',
          summary: { displayName: 'Pool Candidate', label: 'Pool lead' },
          title: 'Pool Candidate',
          url: 'https://pool.example/'
        }
      ],
      tenantWebBaseUrl: 'http://localhost:5771'
    })).toEqual({ annotatedCount: 1 })
    expect(Array.from(document.querySelectorAll('.oes-crm-search-badge')).map((badge) => badge.textContent)).toEqual([
      '公海',
      'Lead'
    ])
  })

  it('renders owner and lifecycle tags with distinct visual tones', () => {
    const document = new DOMParser().parseFromString(
      `
        <html>
          <body>
            <div class="g">
              <a href="https://vintagetub.example">
                <h3>Vintage Tub</h3>
              </a>
            </div>
          </body>
        </html>
      `,
      'text/html'
    )

    annotateCrmSearchResultsInCurrentDocument({
      document,
      results: [
        {
          domain: 'vintagetub.example',
          matchedAccount: {
            crmAccountId: 'crm-vintage-1',
            lifecycleStage: 'LEAD',
            ownerKind: 'SELF',
            recordStatus: 'ACTIVE'
          },
          status: 'OWNED_LEAD',
          title: 'Vintage Tub',
          url: 'https://vintagetub.example/'
        }
      ],
      tenantWebBaseUrl: 'http://localhost:5771'
    })

    const badges = Array.from(document.querySelectorAll<HTMLElement>('.oes-crm-search-badge'))

    expect(badges.map((badge) => badge.textContent)).toEqual(['我的', 'Lead'])
    expect(badges.map((badge) => badge.dataset.tagTone)).toEqual(['owner-self', 'lifecycle-lead'])
    expect(new Set(badges.map((badge) => badge.dataset.tagTone)).size).toBe(2)
  })

  it('does not render raw status labels or combined CRM status tags', () => {
    const document = new DOMParser().parseFromString(
      `
        <html>
          <body>
            <a href="https://swissmadison.com/collections/psc-console-sinks">
              <h3>Swiss Madison Console Sinks</h3>
            </a>
          </body>
        </html>
      `,
      'text/html'
    )

    annotateCrmSearchResultsInCurrentDocument({
      document,
      results: [
        {
          domain: 'swissmadison.com',
          status: 'OWNED_LEAD',
          summary: { displayName: 'Swiss Madison', label: 'OWNED_LEAD' },
          title: 'Swiss Madison Console Sinks',
          url: 'https://swissmadison.com/collections/psc-console-sinks'
        }
      ],
      tenantWebBaseUrl: 'http://localhost:5771'
    })

    const labels = Array.from(document.querySelectorAll('.oes-crm-search-badge')).map((badge) => badge.textContent)

    expect(labels).toEqual(['我的', 'Lead'])
    expect(labels).not.toContain('OWNED_LEAD')
    expect(labels).not.toContain('CRM 我的 Lead')
  })

  it('renders archived CRM records with archive reason tags when supplied by BFF', () => {
    const document = new DOMParser().parseFromString(
      `
        <html>
          <body>
            <a href="https://kohler.example">
              <h3>Kohler</h3>
            </a>
          </body>
        </html>
      `,
      'text/html'
    )

    annotateCrmSearchResultsInCurrentDocument({
      document,
      results: [
        {
          archiveReason: 'NON_TARGET_ACCOUNT',
          archivedAt: '2026-06-23T00:00:00.000Z',
          domain: 'kohler.example',
          matchedAccount: {
            crmAccountId: 'crm-kohler-1',
            lifecycleStage: 'LEAD',
            ownerKind: 'OTHER_OWNER',
            recordStatus: 'ARCHIVED'
          },
          status: 'OTHER_OWNER_LEAD',
          title: 'Kohler',
          url: 'https://kohler.example/'
        }
      ],
      tenantWebBaseUrl: 'http://localhost:5771'
    })

    const badges = Array.from(document.querySelectorAll<HTMLElement>('.oes-crm-search-badge'))

    expect(badges.map((badge) => badge.textContent)).toEqual(['他人', 'Lead', 'Archived', '非目标'])
    expect(badges.map((badge) => badge.dataset.tagTone)).toEqual([
      'owner-other',
      'lifecycle-lead',
      'archived',
      'archive-non-target'
    ])
  })

  it('renders competitor archive reasons as peer-company tags on search results', () => {
    const document = new DOMParser().parseFromString(
      `
        <html>
          <body>
            <a href="https://competitor.example">
              <h3>Competitor Fixtures</h3>
            </a>
          </body>
        </html>
      `,
      'text/html'
    )

    annotateCrmSearchResultsInCurrentDocument({
      document,
      results: [
        {
          archiveReason: 'COMPETITOR',
          archivedAt: '2026-06-24T00:00:00.000Z',
          domain: 'competitor.example',
          matchedAccount: {
            crmAccountId: 'crm-competitor-1',
            lifecycleStage: 'LEAD',
            ownerKind: 'SELF',
            recordStatus: 'ARCHIVED'
          },
          status: 'OWNED_LEAD',
          title: 'Competitor Fixtures',
          url: 'https://competitor.example/'
        }
      ],
      tenantWebBaseUrl: 'http://localhost:5771'
    })

    const badges = Array.from(document.querySelectorAll<HTMLElement>('.oes-crm-search-badge'))

    expect(badges.map((badge) => badge.textContent)).toEqual(['我的', 'Lead', 'Archived', '同行'])
    expect(badges.map((badge) => badge.dataset.tagTone)).toEqual([
      'owner-self',
      'lifecycle-lead',
      'archived',
      'archive-competitor'
    ])
  })

  it('renders CRM tags on Google image section cards when the source page is resolved', () => {
    const document = new DOMParser().parseFromString(
      `
        <html>
          <body>
            <div class="g">
              <a href="https://ordinary.example">
                <h3>Ordinary Result</h3>
              </a>
            </div>
            <section aria-label="Images">
              <a
                class="image-card"
                data-oes-image-result="true"
                href="/imgres?imgurl=https%3A%2F%2Fcdn.example%2Fowned.jpg&imgrefurl=https%3A%2F%2Fimage-owned.example%2Fcollections%2Fconsole-sinks"
              >
                <img alt="Owned image fixtures" src="https://cdn.example/owned.jpg" />
                <span class="image-title">Owned Image Fixtures</span>
              </a>
            </section>
          </body>
        </html>
      `,
      'text/html'
    )
    Object.defineProperty(document, 'location', {
      value: new URL('https://www.google.com/search?q=console+sink')
    })

    const result = annotateCrmSearchResultsInCurrentDocument({
      document,
      results: [
        {
          domain: 'image-owned.example',
          matchedAccount: {
            crmAccountId: 'crm-image-1',
            lifecycleStage: 'LEAD',
            ownerKind: 'SELF',
            recordStatus: 'ACTIVE'
          },
          status: 'OWNED_LEAD',
          title: 'Owned Image Fixtures',
          url: 'https://image-owned.example/collections/console-sinks'
        }
      ],
      tenantWebBaseUrl: 'http://localhost:5771'
    })

    const imageCard = document.querySelector('.image-card')
    const annotation = imageCard?.querySelector('.oes-crm-image-annotation')

    expect(result.annotatedCount).toBe(1)
    expect(annotation).not.toBeNull()
    expect(Array.from(annotation?.querySelectorAll('.oes-crm-search-badge') ?? []).map((badge) => badge.textContent)).toEqual([
      '我的',
      'Lead'
    ])
    expect(document.querySelector('h3')?.querySelector('.oes-crm-search-annotation')).toBeNull()
  })

  it('renders CRM tags on direct-link cards in the Google Images block', () => {
    const document = new DOMParser().parseFromString(
      `
        <html>
          <body>
            <div id="search">
              <h2>Images</h2>
              <div class="image-grid">
                <a class="image-card" href="https://signaturehardware.example/30-cierra-console-sink">
                  <img alt="30 inch Cierra console sink" src="https://encrypted-tbn0.gstatic.com/images?q=tbn:1" />
                  <div>30&quot; Cierra Console Sink with ...</div>
                  <div>Signature Hardware</div>
                </a>
              </div>
            </div>
          </body>
        </html>
      `,
      'text/html'
    )
    Object.defineProperty(document, 'location', {
      value: new URL('https://www.google.com/search?q=console+sink')
    })

    const result = annotateCrmSearchResultsInCurrentDocument({
      document,
      results: [
        {
          domain: 'signaturehardware.example',
          matchedAccount: {
            crmAccountId: 'crm-signature-1',
            lifecycleStage: 'PROSPECT_CUSTOMER',
            ownerKind: 'POOL',
            recordStatus: 'ACTIVE'
          },
          status: 'POOL_LEAD',
          title: 'Signature Hardware',
          url: 'https://signaturehardware.example/30-cierra-console-sink'
        }
      ],
      tenantWebBaseUrl: 'http://localhost:5771'
    })

    const annotation = document.querySelector('.image-card .oes-crm-image-annotation')

    expect(result.annotatedCount).toBe(1)
    expect(Array.from(annotation?.querySelectorAll('.oes-crm-search-badge') ?? []).map((badge) => badge.textContent)).toEqual([
      '公海',
      'PC'
    ])
  })

  it('renders CRM tags inside the visible metadata for Google Images overlay cards', () => {
    const document = new DOMParser().parseFromString(
      `
        <html>
          <body>
            <div id="search">
              <div class="g">
                <a href="https://ordinary.example">
                  <h3>Ordinary Result</h3>
                </a>
              </div>
              <div class="w43QB EXH1Ce">
                <a
                  aria-labelledby="image-title image-source"
                  class="ddkIM c30Ztd xZGX9"
                  href="https://www.signaturehardware.com/30-in-cierra-console-sink-with-brass-stand/912178.html"
                ></a>
                <div class="oYLlHe">
                  <img alt="30&quot; Cierra Console Sink with Brass Stand - Polished Nickel" src="https://encrypted-tbn0.gstatic.com/images?q=tbn:1" />
                </div>
                <div class="T3Fozb">
                  <div id="image-title"><span>30&quot; Cierra Console Sink with Brass Stand - Polished Nickel</span></div>
                  <div id="image-source">Signature Hardware</div>
                </div>
              </div>
            </div>
          </body>
        </html>
      `,
      'text/html'
    )
    Object.defineProperty(document, 'location', {
      value: new URL('https://www.google.com/search?q=console+sink')
    })

    const result = annotateCrmSearchResultsInCurrentDocument({
      document,
      results: [
        {
          domain: 'signaturehardware.com',
          matchedAccount: {
            crmAccountId: 'crm-signature-1',
            lifecycleStage: 'LEAD',
            ownerKind: 'SELF',
            recordStatus: 'ACTIVE'
          },
          status: 'OWNED_LEAD',
          title: 'Signature Hardware',
          url: 'https://www.signaturehardware.com/30-in-cierra-console-sink-with-brass-stand/912178.html'
        }
      ],
      tenantWebBaseUrl: 'http://localhost:5771'
    })

    const metadata = document.querySelector('.T3Fozb')
    const annotation = metadata?.querySelector('.oes-crm-image-annotation')

    expect(result.annotatedCount).toBe(1)
    expect(annotation).not.toBeNull()
    expect(Array.from(annotation?.querySelectorAll('.oes-crm-search-badge') ?? []).map((badge) => badge.textContent)).toEqual([
      '我的',
      'Lead'
    ])
  })

  it('renders Google All-tab image tags into each card when Google reuses labelled IDs', () => {
    const document = new DOMParser().parseFromString(
      `
        <html>
          <body>
            <div id="search">
              <div class="w43QB EXH1Ce">
                <a
                  aria-labelledby="image-title image-source"
                  class="ddkIM c30Ztd xZGX9"
                  href="https://signaturehardware.example/30-cierra-console-sink"
                ></a>
                <div class="oYLlHe">
                  <img alt="30&quot; Cierra Console Sink" src="https://encrypted-tbn0.gstatic.com/images?q=tbn:1" />
                </div>
                <div class="T3Fozb" data-card="signature">
                  <div id="image-title"><span>30&quot; Cierra Console Sink</span></div>
                  <div id="image-source">Signature Hardware</div>
                </div>
              </div>
              <div class="w43QB EXH1Ce">
                <a
                  aria-labelledby="image-title image-source"
                  class="ddkIM c30Ztd xZGX9"
                  href="https://rejuvenation.example/winslow-marble-vanity"
                ></a>
                <div class="oYLlHe">
                  <img alt="Winslow Marble Vanity" src="https://encrypted-tbn0.gstatic.com/images?q=tbn:2" />
                </div>
                <div class="T3Fozb" data-card="rejuvenation">
                  <div id="image-title"><span>Winslow Marble Vanity</span></div>
                  <div id="image-source">Rejuvenation</div>
                </div>
              </div>
            </div>
          </body>
        </html>
      `,
      'text/html'
    )
    Object.defineProperty(document, 'location', {
      value: new URL('https://www.google.com/search?q=console+sink')
    })

    const result = annotateCrmSearchResultsInCurrentDocument({
      document,
      results: [
        {
          domain: 'signaturehardware.example',
          matchedAccount: { lifecycleStage: 'LEAD', ownerKind: 'SELF', recordStatus: 'ACTIVE' },
          status: 'OWNED_LEAD',
          title: 'Signature Hardware',
          url: 'https://signaturehardware.example/30-cierra-console-sink'
        },
        {
          domain: 'rejuvenation.example',
          matchedAccount: { lifecycleStage: 'LEAD', ownerKind: 'POOL', recordStatus: 'ACTIVE' },
          status: 'POOL_LEAD',
          title: 'Rejuvenation',
          url: 'https://rejuvenation.example/winslow-marble-vanity'
        }
      ],
      tenantWebBaseUrl: 'http://localhost:5771'
    })

    const signatureBadges = Array.from(
      document.querySelectorAll('[data-card="signature"] .oes-crm-search-badge')
    ).map((badge) => badge.textContent)
    const rejuvenationBadges = Array.from(
      document.querySelectorAll('[data-card="rejuvenation"] .oes-crm-search-badge')
    ).map((badge) => badge.textContent)

    expect(result.annotatedCount).toBe(2)
    expect(signatureBadges).toEqual(['我的', 'Lead'])
    expect(rejuvenationBadges).toEqual(['公海', 'Lead'])
  })

  it('renders Google All-tab image tags beside sibling metadata when thumbnail anchors have no label text', () => {
    const document = new DOMParser().parseFromString(
      `
        <html>
          <body>
            <div id="search">
              <div class="google-image-card" data-card="signature">
                <a href="https://signaturehardware.example/pennfield-porcelain-pedestal">
                  <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:1" />
                </a>
                <div class="google-image-metadata">
                  <div>Pennfield Porcelain Pedestal ...</div>
                  <div>Signature Hardware</div>
                </div>
              </div>
              <div class="google-image-card" data-card="homedepot">
                <a href="https://homedepot.example/best-pedestal-sinks">
                  <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:2" />
                </a>
                <div class="google-image-metadata">
                  <div>Best Pedestal Sinks for Your B...</div>
                  <div>The Home Depot</div>
                </div>
              </div>
            </div>
          </body>
        </html>
      `,
      'text/html'
    )
    Object.defineProperty(document, 'location', {
      value: new URL('https://www.google.com/search?q=pedestal+sink')
    })

    const result = annotateCrmSearchResultsInCurrentDocument({
      document,
      results: [
        {
          domain: 'signaturehardware.example',
          matchedAccount: { lifecycleStage: 'LEAD', ownerKind: 'POOL', recordStatus: 'ACTIVE' },
          status: 'POOL_LEAD',
          title: 'Signature Hardware',
          url: 'https://signaturehardware.example/pennfield-porcelain-pedestal'
        },
        {
          domain: 'homedepot.example',
          matchedAccount: { lifecycleStage: 'LEAD', ownerKind: 'SELF', recordStatus: 'ACTIVE' },
          status: 'OWNED_LEAD',
          title: 'The Home Depot',
          url: 'https://homedepot.example/best-pedestal-sinks'
        }
      ],
      tenantWebBaseUrl: 'http://localhost:5771'
    })

    const signatureBadges = Array.from(
      document.querySelectorAll('[data-card="signature"] .google-image-metadata .oes-crm-search-badge')
    ).map((badge) => badge.textContent)
    const homeDepotBadges = Array.from(
      document.querySelectorAll('[data-card="homedepot"] .google-image-metadata .oes-crm-search-badge')
    ).map((badge) => badge.textContent)

    expect(result.annotatedCount).toBe(2)
    expect(signatureBadges).toEqual(['公海', 'Lead'])
    expect(homeDepotBadges).toEqual(['我的', 'Lead'])
    expect(document.querySelector('[data-card="signature"] a .oes-crm-image-annotation')).toBeNull()
    expect(document.querySelector('[data-card="homedepot"] a .oes-crm-image-annotation')).toBeNull()
  })

  it('renders tags on both the web result and image card when they share the same URL', () => {
    const document = new DOMParser().parseFromString(
      `
        <html>
          <body>
            <div id="search">
              <div class="g" data-result="signature-web">
                <a href="https://signaturehardware.example/console-bathroom-sinks">
                  <h3>Console Bathroom Sinks</h3>
                </a>
              </div>
              <div class="google-image-card" data-card="signature-image">
                <a href="https://signaturehardware.example/console-bathroom-sinks">
                  <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:1" />
                </a>
                <div class="google-image-metadata">
                  <div>30&quot; Cierra Console Sink with ...</div>
                  <div>Signature Hardware</div>
                </div>
              </div>
            </div>
          </body>
        </html>
      `,
      'text/html'
    )
    Object.defineProperty(document, 'location', {
      value: new URL('https://www.google.com/search?q=console+sink')
    })

    const result = annotateCrmSearchResultsInCurrentDocument({
      document,
      results: [
        {
          domain: 'signaturehardware.example',
          matchedAccount: { lifecycleStage: 'LEAD', ownerKind: 'POOL', recordStatus: 'ACTIVE' },
          status: 'POOL_LEAD',
          title: 'Signature Hardware',
          url: 'https://signaturehardware.example/console-bathroom-sinks'
        }
      ],
      tenantWebBaseUrl: 'http://localhost:5771'
    })

    const webBadges = Array.from(
      document.querySelectorAll('[data-result="signature-web"] .oes-crm-search-badge')
    ).map((badge) => badge.textContent)
    const imageBadges = Array.from(
      document.querySelectorAll('[data-card="signature-image"] .google-image-metadata .oes-crm-search-badge')
    ).map((badge) => badge.textContent)

    expect(result.annotatedCount).toBe(2)
    expect(webBadges).toEqual(['公海', 'Lead'])
    expect(imageBadges).toEqual(['公海', 'Lead'])
  })

  it('renders an ordinary search result tag only on the h3 title, not its thumbnail or read-more link', () => {
    const document = new DOMParser().parseFromString(
      `
        <html>
          <body>
            <div id="search">
              <div class="g" data-result="ordinary">
                <a data-role="title" href="https://kohler.example/pedestal-bathroom-sinks">
                  <h3>Pedestal Bathroom Sinks</h3>
                </a>
                <p>
                  Pedestal sinks are a great choice.
                  <a data-role="read-more" href="https://kohler.example/pedestal-bathroom-sinks">Read more</a>
                </p>
                <a data-role="thumbnail" href="https://kohler.example/pedestal-bathroom-sinks">
                  <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:kohler" />
                </a>
              </div>
            </div>
          </body>
        </html>
      `,
      'text/html'
    )
    Object.defineProperty(document, 'location', {
      value: new URL('https://www.google.com/search?q=pedestal+sink')
    })

    const result = annotateCrmSearchResultsInCurrentDocument({
      document,
      results: [
        {
          archiveReason: 'NO_FIT',
          archivedAt: '2026-06-27T00:00:00.000Z',
          domain: 'kohler.example',
          matchedAccount: { lifecycleStage: 'LEAD', ownerKind: 'SELF', recordStatus: 'ARCHIVED' },
          status: 'OWNED_LEAD',
          title: 'Kohler',
          url: 'https://kohler.example/pedestal-bathroom-sinks'
        }
      ],
      tenantWebBaseUrl: 'http://localhost:5771'
    })

    expect(result.annotatedCount).toBe(1)
    expect(Array.from(document.querySelectorAll('[data-role="title"] .oes-crm-search-badge')).map((badge) => badge.textContent))
      .toEqual(['我的', 'Lead', 'Archived', '不匹配'])
    expect(document.querySelector('[data-role="thumbnail"] .oes-crm-search-badge')).toBeNull()
    expect(document.querySelector('[data-role="read-more"] .oes-crm-search-badge')).toBeNull()
    expect(document.querySelector('[data-role="thumbnail"] + .oes-crm-search-annotation')).toBeNull()
    expect(document.querySelector('[data-role="read-more"] + .oes-crm-search-annotation')).toBeNull()
  })

  it('does not render any CRM tag for unmatched search results', () => {
    const document = new DOMParser().parseFromString(
      `
        <html>
          <head></head>
          <body>
            <a href="https://unknown.example"><h3>Unknown Example</h3></a>
          </body>
        </html>
      `,
      'text/html'
    )

    annotateCrmSearchResultsInCurrentDocument({
      document,
      results: [
        {
          domain: 'unknown.example',
          status: 'UNKNOWN',
          title: 'Unknown Example',
          url: 'https://unknown.example/'
        }
      ],
      tenantWebBaseUrl: 'http://localhost:5771'
    })

    expect(document.querySelector('.oes-crm-search-annotation')).toBeNull()
    expect(document.querySelector('.oes-crm-search-badge')).toBeNull()
    expect(document.body.textContent).not.toContain('CRM 未建档')
  })

  it('removes injected CRM search annotations when CRM capability is disabled', () => {
    const document = new DOMParser().parseFromString(
      `
        <html>
          <head></head>
          <body>
            <a href="https://serrano.example"><h3>Serrano Fixtures</h3></a>
          </body>
        </html>
      `,
      'text/html'
    )

    annotateCrmSearchResultsInCurrentDocument({
      document,
      results: [
        {
          domain: 'serrano.example',
          status: 'CUSTOMER',
          title: 'Serrano Fixtures',
          url: 'https://serrano.example/'
        }
      ],
      tenantWebBaseUrl: 'http://localhost:5771'
    })

    expect(document.querySelectorAll('.oes-crm-search-annotation')).toHaveLength(1)
    expect(document.getElementById('oes-crm-search-annotation-style')).not.toBeNull()

    expect(clearCrmSearchResultsAnnotationsInCurrentDocument({ document })).toEqual({ removedCount: 1 })
    expect(document.querySelectorAll('.oes-crm-search-annotation')).toHaveLength(0)
    expect(document.getElementById('oes-crm-search-annotation-style')).toBeNull()
  })
})
