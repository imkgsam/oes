import type { SessionContext } from '../auth/types'

export interface WorkspaceOption {
  disabled: boolean
  key: string
  label: string
  secondaryLabel: string
}

export const DESIGNER_WORKSPACE_KEY = 'extension.designer.workspace'
export const CRM_WORKSPACE_KEY = 'extension.crm.workspace'

const WORKSPACE_DISPLAY_MAP: Record<string, Omit<WorkspaceOption, 'disabled' | 'key'>> = {
  [DESIGNER_WORKSPACE_KEY]: {
    label: '设计师工作台',
    secondaryLabel: 'Designer Workspace'
  },
  [CRM_WORKSPACE_KEY]: {
    label: 'CRM Sales Workspace',
    secondaryLabel: '浏览器侧客户识别与线索创建'
  }
}

// Converts extension navigation entries into popup workspace display models.
export function visibleWorkspaces(context: SessionContext): WorkspaceOption[] {
  const entries = context.navigation?.visibleEntries ?? []
  const workspaces = entries
    .filter((entry) => entry in WORKSPACE_DISPLAY_MAP)
    .map((entry) => ({
      disabled: false,
      key: entry,
      ...WORKSPACE_DISPLAY_MAP[entry]
    }))

  if (workspaces.length) {
    return workspaces
  }

  return [
    {
      disabled: true,
      key: DESIGNER_WORKSPACE_KEY,
      ...WORKSPACE_DISPLAY_MAP[DESIGNER_WORKSPACE_KEY]
    }
  ]
}

// Selects the current workspace display model from the visible navigation state.
export function activeWorkspace(context: SessionContext): WorkspaceOption {
  const defaultEntry = context.navigation?.defaultEntry
  const workspaces = visibleWorkspaces(context)
  return workspaces.find((workspace) => workspace.key === defaultEntry) ?? workspaces[0]
}

// Converts a backend navigation entry key into stable Chinese display copy.
export function workspaceDisplayName(entry: string): string {
  return WORKSPACE_DISPLAY_MAP[entry]?.label ?? entry
}
