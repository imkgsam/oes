import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, nextTick } from 'vue'

import { CRM_LEAD_DRAFT_STATE_CHANGED_MESSAGE } from '../runtime/messages'
import {
  buildCrmLeadDraftStorageKey,
  type CrmLeadCapturePayload,
  type CrmLeadDraft
} from '../workspaces/crm-lead-drafts'
import CrmWorkspaceApp from './CrmWorkspaceApp.vue'

describe('CrmWorkspaceApp operation console', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', createMemoryLocalStorage())
  })

  afterEach(() => {
    document.body.innerHTML = ''
    localStorage.clear()
    vi.unstubAllGlobals()
  })

  it('renders a fixed CRM operation shell without the manual current-page recognition entry', async () => {
    const sendMessageMock = vi.fn()
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    vi.stubGlobal('chrome', {
      runtime: {
        sendMessage: sendMessageMock
      }
    })

    const root = mountCrmWorkspace()
    await flush()

    expect(root.textContent).toContain('CRM 工作台')
    expect(root.textContent).toContain('工作台')
    expect(root.textContent).toContain('草稿')
    expect(root.textContent).toContain('最近')
    expect(root.textContent).toContain('设置')
    expect(root.textContent).toContain('+ Lead')
    expect(root.textContent).toContain('记录页面')
    expect(root.textContent).toContain('备注')
    expect(root.textContent).not.toContain('识别当前页面')
    expect(root.querySelector('.primary-action')).toBeNull()
    expect(sendMessageMock).not.toHaveBeenCalled()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('renders the active OES Draft Lead form from the single local editing slot', async () => {
    seedAuthenticatedSession()
    seedActiveDraft()

    const root = mountCrmWorkspace()
    await flush()

    expect(root.textContent).toContain('编辑 Lead 草稿')
    expect(root.textContent).toContain('Serrano Fixtures')
    expect(root.textContent).toContain('serrano.example')
    expect(root.querySelector<HTMLInputElement>('input[name="companyName"]')?.value).toBe('Serrano Fixtures')
    expect(root.querySelector<HTMLInputElement>('input[name="country"]')).toBeNull()
    expect(root.querySelector<HTMLSelectElement>('select[name="country"]')?.value).toBe('US')
    expect(root.querySelector('button[type="submit"]')?.textContent).toContain('转为 Lead')
  })

  it('updates active draft country through a region selector', async () => {
    seedAuthenticatedSession()
    seedActiveDraft()

    const root = mountCrmWorkspace()
    await flush()
    const countrySelect = root.querySelector<HTMLSelectElement>('select[name="country"]')
    expect(countrySelect).toBeTruthy()
    expect(Array.from(countrySelect!.options).some((option) => option.value === 'ES')).toBe(true)

    countrySelect!.value = 'ES'
    countrySelect!.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }))
    await flush()

    const stored = JSON.parse(localStorage.getItem(buildCrmLeadDraftStorageKey(identity)) || '{}')
    expect(stored.drafts[0].fields.country).toBe('ES')
  })

  it('loads the draft inbox from OES instead of local saved drafts', async () => {
    seedAuthenticatedSession()
    seedWorkspaceEnabled()
    seedDraftBucket({
      drafts: [
        buildDraft({
          draftId: 'local-saved-1',
          displayName: 'Local Saved Only',
          domain: 'local-only.example',
          savedAt: '2026-06-23T08:00:02.000Z'
        })
      ]
    })
    const fetchMock = mockFetchSequence([
      {
        data: {
          crmAccounts: [
            {
              crmAccountId: 'oes-draft-1',
              displayName: 'OES Draft Fixtures',
              leadCountry: 'US',
              leadDomain: 'oes-draft.example',
              lifecycleStage: 'LEAD',
              priority: 'B',
              recordStatus: 'DRAFT',
              updatedAt: '2026-06-24T01:00:00.000Z'
            }
          ],
          page: 1,
          pageSize: 50,
          total: 1
        },
        success: true
      }
    ])
    vi.stubGlobal('fetch', fetchMock)

    const root = mountCrmWorkspace()
    await flush()
    clickButton(root, '草稿')
    await flush()

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:9101/api/v1/customer-management/tenants/tenant-1/crm-accounts?createdBy=account-1&page=1&pageSize=50&recordStatus=DRAFT',
      expect.objectContaining({ method: 'GET' })
    )
    expect(root.textContent).toContain('OES Draft Fixtures')
    expect(root.textContent).toContain('oes-draft.example')
    expect(root.textContent).not.toContain('Local Saved Only')
  })

  it('saves the active draft to OES and keeps navigation exits visible', async () => {
    seedAuthenticatedSession()
    seedWorkspaceEnabled()
    seedActiveDraft({ draftId: 'oes-draft-1' })
    const fetchMock = mockFetchSequence([{ data: { crmAccount: { crmAccountId: 'oes-draft-1' } }, success: true }])
    vi.stubGlobal('fetch', fetchMock)

    const root = mountCrmWorkspace()
    await flush()
    clickButton(root, '保存草稿')
    await flush()

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:9101/api/v1/customer-management/tenants/tenant-1/draft-leads/oes-draft-1',
      expect.objectContaining({
        body: expect.stringContaining('"leadDomain":"serrano.example"'),
        method: 'PATCH'
      })
    )
    expect(root.textContent).toContain('已保存到 OES 草稿')
    expect(root.textContent).toContain('查看草稿箱')
    expect(root.textContent).toContain('回到工作台')
  })

  it('updates then submits the active OES draft and refreshes visible CRM tags', async () => {
    seedAuthenticatedSession()
    seedWorkspaceEnabled()
    seedActiveDraft({ draftId: 'oes-draft-1' })
    const sendMessageMock = vi.fn().mockResolvedValue({ ok: true })
    const fetchMock = mockFetchSequence([
      { data: { crmAccount: { crmAccountId: 'oes-draft-1' } }, success: true },
      { data: { crmAccount: { crmAccountId: 'active-lead-1' } }, success: true }
    ])
    vi.stubGlobal('fetch', fetchMock)
    vi.stubGlobal('chrome', { runtime: { sendMessage: sendMessageMock } })

    const root = mountCrmWorkspace()
    await flush()
    root.querySelector<HTMLFormElement>('form')?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    await flush()

    expect(fetchMock.mock.calls.map(([url, init]) => [url, init.method])).toEqual([
      ['http://localhost:9101/api/v1/customer-management/tenants/tenant-1/draft-leads/oes-draft-1', 'PATCH'],
      ['http://localhost:9101/api/v1/customer-management/tenants/tenant-1/draft-leads/oes-draft-1/submit', 'POST']
    ])
    expect(localStorage.getItem(buildCrmLeadDraftStorageKey(identity))).toBeNull()
    expect(sendMessageMock).toHaveBeenCalledWith({ type: 'oes.crm.refreshCrmTags' })
    expect(root.textContent).toContain('已转为 Lead')
    expect(root.textContent).toContain('查看草稿箱')
    expect(root.textContent).toContain('回到工作台')
  })

  it('deletes an OES draft from the draft inbox', async () => {
    seedAuthenticatedSession()
    seedWorkspaceEnabled()
    const fetchMock = mockFetchSequence([
      {
        data: {
          crmAccounts: [
            {
              crmAccountId: 'oes-draft-1',
              displayName: 'OES Draft Fixtures',
              leadDomain: 'oes-draft.example',
              lifecycleStage: 'LEAD',
              recordStatus: 'DRAFT'
            }
          ],
          page: 1,
          pageSize: 50,
          total: 1
        },
        success: true
      },
      { data: {}, success: true },
      { data: { crmAccounts: [], page: 1, pageSize: 50, total: 0 }, success: true }
    ])
    vi.stubGlobal('fetch', fetchMock)

    const root = mountCrmWorkspace()
    await flush()
    clickButton(root, '草稿')
    await flush()
    clickButton(root, '删除')
    await flush()

    expect(fetchMock.mock.calls.map(([url, init]) => [url, init.method])).toEqual([
      ['http://localhost:9101/api/v1/customer-management/tenants/tenant-1/crm-accounts?createdBy=account-1&page=1&pageSize=50&recordStatus=DRAFT', 'GET'],
      ['http://localhost:9101/api/v1/customer-management/tenants/tenant-1/draft-leads/oes-draft-1', 'DELETE'],
      ['http://localhost:9101/api/v1/customer-management/tenants/tenant-1/crm-accounts?createdBy=account-1&page=1&pageSize=50&recordStatus=DRAFT', 'GET']
    ])
    expect(root.textContent).toContain('暂无 OES 草稿')
  })

  it('blocks duplicate captures without exposing CRM duplicate details', async () => {
    seedAuthenticatedSession()
    seedDraftBucket({
      blockedDuplicate: {
        capture: {
          ...baseCapture,
          companyNameCandidates: ['Swiss Madison'],
          targetDomain: 'swissmadison.com',
          targetTitle: 'Console Sinks – Swiss Madison - well made forever',
          targetUrl: 'https://swissmadison.com/collections/psc-console-sinks?srsltid=AfmBOopyqF0Tlr73a3rA8BOUKetoRlnPAlyntzG4lQX1hQB8S4H2wdc1'
        },
        duplicate: {
          allowedActions: ['OPEN_OES_DETAIL'],
          duplicateResult: {
            candidates: [{ crmAccountId: '2c5fa15d-b4ed-4335-89e2-190bc0c60aea', displayName: 'Swiss Madison' }],
            resultType: 'OWNED_DUPLICATE'
          }
        }
      },
      drafts: []
    })

    const root = mountCrmWorkspace()
    await flush()

    expect(root.textContent).not.toContain('Console Sinks – Swiss Madison - well made forever')
    expect(root.textContent).not.toContain('DUPLICATE')
    expect(root.textContent).not.toContain('Swiss Madison')
    expect(root.textContent).not.toContain('swissmadison.com')
    expect(root.querySelector('button[type="submit"]')).toBeNull()
  })

  it('rehydrates when the background updates the draft state after a new right-click capture', async () => {
    let runtimeListener: ((message: unknown) => void) | undefined
    seedAuthenticatedSession()
    seedDraftBucket({
      blockedDuplicate: {
        capture: {
          ...baseCapture,
          companyNameCandidates: ['Swiss Madison'],
          targetDomain: 'swissmadison.com',
          targetTitle: 'Two-Piece - Swiss Madison',
          targetUrl: 'https://swissmadison.com/collections/psc-two-piece'
        },
        duplicate: {
          allowedActions: ['OPEN_OES_DETAIL'],
          duplicateResult: {
            candidates: [{ crmAccountId: 'swiss-1', displayName: 'Swiss Madison' }],
            resultType: 'OWNED_DUPLICATE'
          }
        }
      },
      drafts: []
    })
    vi.stubGlobal('chrome', {
      runtime: {
        onMessage: {
          addListener: vi.fn((listener) => {
            runtimeListener = listener
          }),
          removeListener: vi.fn()
        }
      }
    })

    const root = mountCrmWorkspace()
    await flush()
    expect(root.textContent).not.toContain('Swiss Madison')

    seedActiveDraft({
      companyName: 'American Standard',
      domain: 'www.americanstandard-us.com',
      draftId: 'draft-american-standard'
    })
    runtimeListener?.({ type: CRM_LEAD_DRAFT_STATE_CHANGED_MESSAGE })
    await flush()

    expect(root.textContent).toContain('编辑 Lead 草稿')
    expect(root.textContent).toContain('American Standard')
    expect(root.textContent).not.toContain('Swiss Madison')
  })

  it('renders the active draft conflict options', async () => {
    seedAuthenticatedSession()
    seedDraftBucket({
      activeDraftId: 'draft-1',
      drafts: [
        buildDraft({
          companyName: 'Unsaved Serrano',
          dirty: true,
          domain: 'serrano.example',
          draftId: 'draft-1'
        })
      ],
      pendingCapture: {
        ...baseCapture,
        targetDomain: 'next.example',
        targetTitle: 'next.example',
        targetUrl: 'https://next.example'
      }
    })

    const root = mountCrmWorkspace()
    await flush()

    expect(root.textContent).toContain('已有未保存草稿')
    expect(root.textContent).toContain('继续编辑当前草稿')
    expect(root.textContent).toContain('保存当前草稿并创建新草稿')
    expect(root.textContent).toContain('丢弃当前草稿并创建新草稿')
  })
})

const identity = { accountId: 'account-1', tenantId: 'tenant-1' }
const baseCapture: CrmLeadCapturePayload = {
  browserContext: { entryPoint: 'CONTEXT_MENU', workspace: 'CRM' },
  capturedAt: '2026-06-23T08:00:00.000Z',
  captureKind: 'CURRENT_PAGE',
  companyNameCandidates: ['Serrano Fixtures'],
  sourcePageTitle: 'Serrano Fixtures',
  sourcePageUrl: 'https://serrano.example',
  targetDomain: 'serrano.example',
  targetTitle: 'Serrano Fixtures',
  targetUrl: 'https://serrano.example',
  visibleEmails: ['imports@serrano.example'],
  visiblePhones: ['+1 312 847 1928']
}

function buildDraft(input: Partial<CrmLeadDraft> & {
  companyName?: string
  displayName?: string
  domain?: string
}): CrmLeadDraft {
  const draftId = input.draftId ?? 'draft-1'
  const companyName = input.companyName ?? input.displayName ?? 'Serrano Fixtures'
  const domain = input.domain ?? 'serrano.example'
  return {
    capture: {
      ...baseCapture,
      companyNameCandidates: [companyName],
      targetDomain: domain,
      targetTitle: companyName,
      targetUrl: `https://${domain}`
    },
    createdAt: input.createdAt ?? '2026-06-23T08:00:01.000Z',
    dirty: input.dirty ?? false,
    draftId,
    fields: {
      assigneeIntent: '',
      companyName,
      country: 'US',
      domain,
      email: 'imports@serrano.example',
      phone: '+1 312 847 1928',
      priority: 'B',
      sourceNote: 'Captured after supplier review'
    },
    savedAt: input.savedAt,
    updatedAt: input.updatedAt ?? '2026-06-23T08:00:01.000Z'
  }
}

function clickButton(root: HTMLElement, label: string): void {
  const button = Array.from(root.querySelectorAll('button')).find((item) => item.textContent?.includes(label))
  expect(button, `button ${label}`).toBeTruthy()
  button!.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
}

function mockFetchSequence(payloads: unknown[]) {
  const fetchMock = vi.fn()
  payloads.forEach((payload) => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify(payload), {
        headers: { 'Content-Type': 'application/json' },
        status: 200
      })
    )
  })
  return fetchMock
}

function mountCrmWorkspace(): HTMLElement {
  const root = document.createElement('div')
  document.body.appendChild(root)
  createApp(CrmWorkspaceApp).mount(root)
  return root
}

function seedActiveDraft(input: {
  companyName?: string
  domain?: string
  draftId?: string
} = {}): void {
  seedDraftBucket({
    activeDraftId: input.draftId ?? 'draft-1',
    drafts: [
      buildDraft({
        companyName: input.companyName,
        domain: input.domain,
        draftId: input.draftId ?? 'draft-1'
      })
    ]
  })
}

function seedAuthenticatedSession(): void {
  localStorage.setItem('oes.browserExtension.authSession', JSON.stringify({
    accessToken: 'access-token-1',
    context: {
      account: { accountId: identity.accountId, name: 'Mira Tan' },
      operator: { displayName: 'Mira Tan' },
      tenant: { tenantId: identity.tenantId, name: 'OES Tenant' }
    },
    refreshToken: 'refresh-token-1'
  }))
}

function seedDraftBucket(bucket: unknown): void {
  localStorage.setItem(buildCrmLeadDraftStorageKey(identity), JSON.stringify(bucket))
}

function seedWorkspaceEnabled(): void {
  localStorage.setItem('workspace-enabled:tenant-1:account-1:extension.crm.workspace', 'true')
}

function createMemoryLocalStorage(): Storage {
  const values = new Map<string, string>()
  return {
    get length() {
      return values.size
    },
    clear: vi.fn(() => values.clear()),
    getItem: vi.fn((key: string) => values.get(key) ?? null),
    key: vi.fn((index: number) => Array.from(values.keys())[index] ?? null),
    removeItem: vi.fn((key: string) => {
      values.delete(key)
    }),
    setItem: vi.fn((key: string, value: string) => {
      values.set(key, value)
    })
  }
}

async function flush(): Promise<void> {
  await nextTick()
  await Promise.resolve()
  await new Promise((resolve) => setTimeout(resolve, 0))
  await Promise.resolve()
  await nextTick()
}
