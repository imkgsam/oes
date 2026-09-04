/* @vitest-environment happy-dom */

import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

vi.mock('#/locales', () => ({
  $t: (path: string) => path
}))

vi.mock('@vben/icons', () => ({
  IconifyIcon: {
    name: 'IconifyIcon',
    template: '<span />'
  }
}))

vi.mock('./NotesTab.vue', () => ({
  default: {
    name: 'NotesTab',
    props: ['objectContext'],
    template: '<section data-testid="collaboration-notes-content" />'
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

describe('CollaborationPanel', () => {
  it('opens notes directly without rendering a redundant notes tab', async () => {
    const component = (await import('./CollaborationPanel.vue')).default
    const wrapper = mount(component, {
      attachTo: document.body,
      props: { objectContext }
    })

    await wrapper.get('[data-testid="collaboration-panel-open"]').trigger('click')

    expect(document.body.textContent).toContain('Northline Bathworks')
    expect(document.querySelector('[data-testid="collaboration-notes-content"]')).toBeTruthy()
    expect(document.querySelector('[role="tablist"]')).toBeFalsy()
  })
})
