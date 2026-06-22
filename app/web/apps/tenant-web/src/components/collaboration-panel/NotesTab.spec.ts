/* @vitest-environment happy-dom */

import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const createCollaborationAnnotationApi = vi.fn()
const deleteCollaborationAnnotationApi = vi.fn()
const listCollaborationAnnotationsApi = vi.fn()
const setCollaborationAnnotationPinnedApi = vi.fn()
const updateCollaborationAnnotationApi = vi.fn()

const authContextState: any = {
  actionCodes: ['collaboration.annotation.create', 'collaboration.annotation.manage'],
  sessionContext: {
    account: {
      accountId: 'account-author',
      name: '陈双鹏'
    },
    operator: {
      displayName: '陈双鹏'
    }
  }
}

vi.mock('#/api', () => ({
  createCollaborationAnnotationApi,
  deleteCollaborationAnnotationApi,
  listCollaborationAnnotationsApi,
  setCollaborationAnnotationPinnedApi,
  updateCollaborationAnnotationApi
}))

vi.mock('#/locales', () => ({
  $t: (path: string) => path
}))

vi.mock('#/store/auth-context', () => ({
  useAuthContextStore: () => authContextState
}))

vi.mock('@vben/icons', () => ({
  IconifyIcon: {
    name: 'IconifyIcon',
    template: '<span />'
  }
}))

const objectContext = {
  displayName: 'Northline Bathworks',
  objectRef: {
    objectOwnerService: 'crm-service',
    objectType: 'CrmAccount',
    objectId: 'crm-account-1'
  }
}

describe('NotesTab', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
    createCollaborationAnnotationApi.mockReset()
    deleteCollaborationAnnotationApi.mockReset()
    listCollaborationAnnotationsApi.mockReset()
    setCollaborationAnnotationPinnedApi.mockReset()
    updateCollaborationAnnotationApi.mockReset()
    authContextState.actionCodes = ['collaboration.annotation.create', 'collaboration.annotation.manage']
    listCollaborationAnnotationsApi.mockResolvedValue({
      items: [],
      page: 1,
      pageSize: 50,
      total: 0
    })
    createCollaborationAnnotationApi.mockResolvedValue({
      annotation: {
        annotationId: 'annotation-1'
      }
    })
  })

  it('renders empty state and creates an object-visible note by default', async () => {
    const component = (await import('./NotesTab.vue')).default
    const wrapper = mount(component, {
      attachTo: document.body,
      props: { objectContext }
    })

    await flushPromises()

    expect(wrapper.get('[data-testid="collaboration-notes-empty"]').text()).toContain('暂无备注')
    await wrapper.get('[data-testid="collaboration-note-body"]').setValue('Confirm preferred delivery window.')
    await wrapper.get('[data-testid="collaboration-note-submit"]').trigger('click')
    await flushPromises()

    expect(createCollaborationAnnotationApi).toHaveBeenCalledWith(objectContext.objectRef, {
      bodyText: 'Confirm preferred delivery window.',
      visibility: 'OBJECT_VISIBLE'
    })
  })

  it('shows public/private visibility labels while keeping backend enum values', async () => {
    const component = (await import('./NotesTab.vue')).default
    const wrapper = mount(component, {
      attachTo: document.body,
      props: { objectContext }
    })

    await flushPromises()

    expect(wrapper.get('[data-testid="collaboration-note-visibility"]').text()).toContain('公开')
    expect(wrapper.text()).not.toContain('对象可见')
    expect(wrapper.text()).not.toContain('私密')

    await wrapper.get('[data-testid="collaboration-note-body"]').setValue('Keep commercial context visible.')
    await wrapper.get('[data-testid="collaboration-note-submit"]').trigger('click')
    await flushPromises()

    expect(createCollaborationAnnotationApi).toHaveBeenCalledWith(objectContext.objectRef, {
      bodyText: 'Keep commercial context visible.',
      visibility: 'OBJECT_VISIBLE'
    })
  })

  it('renders private notes with the personal label', async () => {
    listCollaborationAnnotationsApi.mockResolvedValueOnce({
      items: [
        buildNote({
          annotationId: 'annotation-private',
          visibility: 'PRIVATE'
        })
      ],
      page: 1,
      pageSize: 50,
      total: 1
    })
    const component = (await import('./NotesTab.vue')).default
    const wrapper = mount(component, {
      attachTo: document.body,
      props: { objectContext }
    })

    await flushPromises()

    expect(wrapper.get('[data-testid="collaboration-note-annotation-private"]').text()).toContain('私人')
    expect(wrapper.text()).not.toContain('私密')
  })

  it('uses a top-right dropdown for note operations instead of inline action buttons', async () => {
    listCollaborationAnnotationsApi.mockResolvedValueOnce({
      items: [buildNote()],
      page: 1,
      pageSize: 50,
      total: 1
    })
    const component = (await import('./NotesTab.vue')).default
    const wrapper = mount(component, {
      attachTo: document.body,
      props: { objectContext }
    })

    await flushPromises()

    const item = wrapper.get('[data-testid="collaboration-note-annotation-1"]')
    expect(item.find('[data-testid="collaboration-note-actions-menu"]').exists()).toBe(true)
    expect(item.find('.notes-tab__actions').exists()).toBe(false)
    expect(item.find('[data-testid="collaboration-note-pin"]').exists()).toBe(false)
    expect(item.find('[data-testid="collaboration-note-edit"]').exists()).toBe(false)
    expect(item.find('[data-testid="collaboration-note-delete"]').exists()).toBe(false)
  })

  it('does not expose raw account ids when note author display name is missing', async () => {
    listCollaborationAnnotationsApi.mockResolvedValueOnce({
      items: [
        buildNote({
          authorAccountId: '00000000-0000-4000-8000-000000000901',
          authorDisplayNameSnapshot: ''
        })
      ],
      page: 1,
      pageSize: 50,
      total: 1
    })
    const component = (await import('./NotesTab.vue')).default
    const wrapper = mount(component, {
      attachTo: document.body,
      props: { objectContext }
    })

    await flushPromises()

    expect(wrapper.text()).toContain('未知成员')
    expect(wrapper.text()).not.toContain('00000000-0000-4000-8000-000000000901')
  })

  it('does not expose raw account ids when author snapshot is an id-like value', async () => {
    listCollaborationAnnotationsApi.mockResolvedValueOnce({
      items: [
        buildNote({
          authorAccountId: '00000000-0000-4000-8000-000000000901',
          authorDisplayNameSnapshot: '00000000-0000-4000-8000-000000000901'
        })
      ],
      page: 1,
      pageSize: 50,
      total: 1
    })
    const component = (await import('./NotesTab.vue')).default
    const wrapper = mount(component, {
      attachTo: document.body,
      props: { objectContext }
    })

    await flushPromises()

    expect(wrapper.text()).toContain('未知成员')
    expect(wrapper.text()).not.toContain('00000000-0000-4000-8000-000000000901')
  })

  it('uses the current operator name for legacy notes authored by the current account', async () => {
    listCollaborationAnnotationsApi.mockResolvedValueOnce({
      items: [
        buildNote({
          authorAccountId: 'account-author',
          authorDisplayNameSnapshot: '00000000-0000-4000-8000-000000000901'
        })
      ],
      page: 1,
      pageSize: 50,
      total: 1
    })
    const component = (await import('./NotesTab.vue')).default
    const wrapper = mount(component, {
      attachTo: document.body,
      props: { objectContext }
    })

    await flushPromises()

    expect(wrapper.text()).toContain('陈双鹏')
    expect(wrapper.text()).not.toContain('未知成员')
    expect(wrapper.text()).not.toContain('00000000-0000-4000-8000-000000000901')
  })

  it('keeps the note feed above a sticky bottom composer', async () => {
    const component = (await import('./NotesTab.vue')).default
    const wrapper = mount(component, {
      attachTo: document.body,
      props: { objectContext }
    })

    await flushPromises()

    const viewport = wrapper.get('[data-testid="collaboration-notes-viewport"]')
    const composer = wrapper.get('[data-testid="collaboration-notes-composer"]')
    expect(viewport.classes()).toContain('notes-tab__viewport')
    expect(composer.classes()).toContain('notes-tab__composer')
    expect(
      Array.from(wrapper.element.children).map((child) => (child as HTMLElement).dataset.testid ?? '')
    ).toEqual(expect.arrayContaining(['collaboration-notes-viewport', 'collaboration-notes-composer']))
    expect(
      Array.from(wrapper.element.children).findIndex(
        (child) => (child as HTMLElement).dataset.testid === 'collaboration-notes-viewport'
      )
    ).toBeLessThan(
      Array.from(wrapper.element.children).findIndex(
        (child) => (child as HTMLElement).dataset.testid === 'collaboration-notes-composer'
      )
    )
  })

  it('disables note creation for archived owner objects', async () => {
    const component = (await import('./NotesTab.vue')).default
    const wrapper = mount(component, {
      attachTo: document.body,
      props: { objectContext: { ...objectContext, archived: true } }
    })

    await flushPromises()

    expect(wrapper.get('[data-testid="collaboration-notes-readonly"]').text()).toContain('已归档对象仅支持查看备注')
    expect((wrapper.get('[data-testid="collaboration-note-submit"]').element as HTMLButtonElement).disabled).toBe(true)
  })

  it('shows a localized read-only permission notice when create permission is missing', async () => {
    authContextState.actionCodes = []
    const component = (await import('./NotesTab.vue')).default
    const wrapper = mount(component, {
      attachTo: document.body,
      props: { objectContext }
    })

    await flushPromises()

    expect(wrapper.get('[data-testid="collaboration-notes-permission-denied"]').text()).toContain(
      '你可以查看备注，但没有新建备注权限'
    )
    expect((wrapper.get('[data-testid="collaboration-note-submit"]').element as HTMLButtonElement).disabled).toBe(true)
  })
})

/** buildNote creates one visible annotation item fixture for NotesTab rendering tests. */
function buildNote(overrides: Record<string, unknown> = {}) {
  return {
    annotationId: 'annotation-1',
    bodyText: 'Coordinate sample shipment timing.',
    visibility: 'OBJECT_VISIBLE',
    pinned: false,
    edited: false,
    authorAccountId: 'account-author',
    authorDisplayNameSnapshot: '陈双鹏',
    createdAt: '2026-06-20T00:00:00.000Z',
    updatedAt: '2026-06-20T00:00:00.000Z',
    ...overrides
  }
}
