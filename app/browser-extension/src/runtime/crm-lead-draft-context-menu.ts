import {
  CRM_LEAD_DRAFT_LINK_CONTEXT_MENU_ID,
  CRM_LEAD_DRAFT_PAGE_CONTEXT_MENU_ID
} from '../workspaces/crm-lead-drafts'

type ContextMenuApi = Pick<typeof chrome.contextMenus, 'create' | 'removeAll'>

// Registers page and link CRM Draft Lead creation entries without adding unsupported selection capture.
export async function registerCrmLeadDraftContextMenus(contextMenus: ContextMenuApi = chrome.contextMenus): Promise<void> {
  await contextMenus.removeAll()
  contextMenus.create({
    contexts: ['page'],
    id: CRM_LEAD_DRAFT_PAGE_CONTEXT_MENU_ID,
    title: 'CRM 创建 Lead 草稿'
  })
  contextMenus.create({
    contexts: ['link'],
    id: CRM_LEAD_DRAFT_LINK_CONTEXT_MENU_ID,
    title: 'CRM 从链接创建 Lead 草稿'
  })
}

// Clears all extension-owned context menu entries before disabling the CRM runtime.
export async function unregisterCrmLeadDraftContextMenus(
  contextMenus: ContextMenuApi = chrome.contextMenus
): Promise<void> {
  await contextMenus.removeAll()
}

// Identifies supported CRM Draft Lead context-menu commands.
export function isCrmLeadDraftContextMenuId(menuItemId: unknown): boolean {
  return menuItemId === CRM_LEAD_DRAFT_PAGE_CONTEXT_MENU_ID || menuItemId === CRM_LEAD_DRAFT_LINK_CONTEXT_MENU_ID
}
