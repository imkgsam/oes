import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import {
  NodeSqlitePublishedStore,
  PublicViewsReader,
  type SiteExposurePublication,
  type StoredPublishedResource
} from '@oes/site-runtime-kit'
import { NotFoundException } from '@nestjs/common'

import { PublicDataController } from '../runtime/src/modules/public-data/public-data.controller'
import { PublicDataService } from '../runtime/src/modules/public-data/public-data.service'
import { SiteExposureService } from '../runtime/src/modules/site-exposure/site-exposure.service'

const siteId = 'meilong-faq-directory-test'
const publishedAt = '2026-07-25T00:00:00.000Z'

// This integration test proves the FAQ endpoint reads one Runtime-local, exact-locale directory with no OES fallback.
describe('Meilong Runtime FAQ directory endpoint', () => {
  let directory: string
  let store: NodeSqlitePublishedStore
  let controller: PublicDataController

  beforeEach(async () => {
    directory = mkdtempSync(join(tmpdir(), 'meilong-faq-directory-'))
    store = new NodeSqlitePublishedStore({ path: join(directory, 'runtime.sqlite') })
    await store.init()
    await store.commitPublication({
      mode: 'snapshot',
      siteId,
      expectedLocalPublishVersion: 0,
      publishVersion: 17,
      latestSyncId: 'sync-17',
      lastKnownRemotePublishVersion: 17,
      exposure: faqPublication(),
      resources: [faqDirectory('en-US')],
      missingResources: []
    })
    const runtimeService = {
      getRuntime: () => ({ publicViews: new PublicViewsReader(store, siteId) })
    }
    const exposure = new SiteExposureService(runtimeService as never)
    controller = new PublicDataController(new PublicDataService(exposure, runtimeService as never))
  })

  afterEach(async () => {
    await store.close()
    rmSync(directory, { force: true, recursive: true })
  })

  it('serves the local published directory and preserves its sanitized answer HTML', async () => {
    await expect(controller.getFaqDirectory('en-US')).resolves.toMatchObject({
      resourceType: 'faq',
      resourceId: `${siteId}:faq-directory`,
      slug: '',
      locale: 'en-US',
      status: 'published',
      publishVersion: 17,
      payload: {
        categories: [
          {
            anchor_key: 'care',
            entries: [{ entry_id: 'care-1', answer_html: '<p>Use a soft cloth.</p>' }]
          }
        ]
      }
    })
  })

  it('returns not found for a missing active locale instead of falling back to the default directory', async () => {
    await expect(controller.getFaqDirectory('fr-FR')).rejects.toBeInstanceOf(NotFoundException)
  })
})

// faqPublication supplies the committed local exposure policy required before the FAQ directory can be read.
function faqPublication(): SiteExposurePublication {
  return {
    siteId,
    publishVersion: 17,
    defaultLocale: 'en-US',
    activeLocales: ['en-US', 'fr-FR'],
    pages: [
      {
        pageKey: 'FAQ',
        enabled: true,
        indexable: false,
        supportedLocales: ['en-US', 'fr-FR']
      }
    ],
    publishedAt
  }
}

// faqDirectory provides the no-slug public resource shape persisted by Runtime Kit for one locale.
function faqDirectory(locale: string): StoredPublishedResource {
  return {
    siteId,
    resourceType: 'faq',
    resourceId: `${siteId}:faq-directory`,
    slug: '',
    locale,
    status: 'published',
    publishVersion: 17,
    updatedAt: publishedAt,
    payloadJson: JSON.stringify({
      categories: [
        {
          category_id: 'care',
          title: 'Care',
          anchor_key: 'care',
          sort_order: 10,
          entries: [
            {
              entry_id: 'care-1',
              question: 'How do I clean it?',
              answer_html: '<p>Use a soft cloth.</p>',
              sort_order: 10
            }
          ]
        }
      ]
    })
  }
}
