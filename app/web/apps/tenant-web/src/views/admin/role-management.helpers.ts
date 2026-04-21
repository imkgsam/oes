import type { TablePaginationConfig } from 'ant-design-vue';
import type { PermissionManagementApi, RoleManagementApi } from '#/api';

export interface RoleManagementPaginationState {
  current: number;
  pageSize: number;
  total: number;
}

export interface LandingTerminalOverride {
  defaultEntryKey: string;
  terminal: string;
}

export interface LandingEditorState {
  baseEntryKey: string;
  overrides: LandingTerminalOverride[];
}

export interface VisibilityTerminalOverride {
  entryKeys: string[];
  terminal: string;
}

export interface VisibilityEditorState {
  baseEntryKeys: string[];
  overrides: VisibilityTerminalOverride[];
}

export interface NavigationFeatureGroup {
  entries: string[];
  featureKey: string;
  label: string;
}

export interface NavigationEditorValidationInput {
  baseEntryKeys: string[];
  baseLandingEntryKey: string;
  entries: PermissionManagementApi.NavigationEntry[];
  landingOverrides: LandingTerminalOverride[];
  supportedTerminals: string[];
  visibilityOverrides: VisibilityTerminalOverride[];
}

export interface NavigationEditorValidationResult {
  message: string;
  valid: boolean;
}

const ROLE_CODE_PATTERN = /^[A-Za-z][A-Za-z0-9._-]*$/;
const DEFAULT_LANDING_PRIORITY = 100;
const DEFAULT_NAVIGATION_TERMINAL = 'DEFAULT';

// Keeps role-management tables on an explicit paged interaction model for administrators.
export function buildRoleTablePagination(
  pagination: RoleManagementPaginationState,
): TablePaginationConfig {
  return {
    current: pagination.current,
    hideOnSinglePage: false,
    pageSize: pagination.pageSize,
    pageSizeOptions: ['20', '50', '100'],
    position: ['bottomRight'],
    showQuickJumper: true,
    showSizeChanger: true,
    showTotal: (total: number) => `共 ${total} 条`,
    total: pagination.total,
  };
}

// Converts role instance facts into a compact scope label for admin tables.
export function getRoleScopeLabel(role: RoleManagementApi.Role) {
  return role.isSystem || normalizeRoleKind(role.roleKind) === 'SYSTEM_INSTANCE'
    ? 'SYSTEM'
    : 'TENANT';
}

// Converts stored role-kind values into a compact human-readable label.
export function getRoleKindLabel(role: RoleManagementApi.Role) {
  switch (normalizeRoleKind(role.roleKind)) {
    case 'SYSTEM_TEMPLATE':
      return '模板';
    case 'SYSTEM_INSTANCE':
      return '系统角色';
    case 'TENANT_INSTANCE':
      return '租户角色';
    default:
      return role.roleKind || '-';
  }
}

// Builds template select options while hiding disabled templates from instantiation flows.
export function buildActiveRoleTemplateSelectOptions(
  templates: RoleManagementApi.Role[],
) {
  return templates
    .filter((template) => template.isEnabled)
    .map((template) => ({
      label: template.name,
      value: template.id,
    }));
}

// Validates role and template codes against the stable character set already used by seeded role records.
export function isRoleCodeFormatValid(code: string) {
  return ROLE_CODE_PATTERN.test(code.trim());
}

// Reduces managed landing policies into one base landing plus terminal-specific overrides for the role UI.
export function deriveLandingEditorState(input: {
  landingPolicies: PermissionManagementApi.RoleLandingPolicy[];
  supportedTerminals: string[];
}): LandingEditorState {
  const supportedTerminalsWithDefault = [
    DEFAULT_NAVIGATION_TERMINAL,
    ...input.supportedTerminals,
  ];
  const terminalPolicies = new Map<string, PermissionManagementApi.RoleLandingPolicy>();

  for (const policy of input.landingPolicies) {
    if (!policy.enabled) {
      continue;
    }

    if (!supportedTerminalsWithDefault.includes(policy.terminal)) {
      continue;
    }

    const current = terminalPolicies.get(policy.terminal);
    if (!current || policy.priority > current.priority) {
      terminalPolicies.set(policy.terminal, policy);
    }
  }

  const terminalEntries = supportedTerminalsWithDefault
    .map((terminal) => ({
      defaultEntryKey: terminalPolicies.get(terminal)?.defaultEntryKey ?? '',
      terminal,
    }))
    .filter((item) => item.defaultEntryKey);

  if (terminalEntries.length === 0) {
    return {
      baseEntryKey: '',
      overrides: [],
    };
  }

  const defaultEntry = terminalEntries.find(
    (item) => item.terminal === DEFAULT_NAVIGATION_TERMINAL,
  );
  const webEntry = terminalEntries.find((item) => item.terminal === 'WEB');
  const baseEntryKey =
    defaultEntry?.defaultEntryKey ||
    webEntry?.defaultEntryKey ||
    terminalEntries[0]?.defaultEntryKey ||
    '';

  return {
    baseEntryKey,
    overrides: terminalEntries.filter(
      (item) =>
        item.terminal !== DEFAULT_NAVIGATION_TERMINAL &&
        item.defaultEntryKey !== baseEntryKey,
    ),
  };
}

// Expands one base landing plus terminal overrides back into the managed landing-policy payload.
export function buildLandingPoliciesFromEditor(input: {
  baseEntryKey: string;
  overrides: LandingTerminalOverride[];
  supportedTerminals: string[];
}): Array<Omit<PermissionManagementApi.RoleLandingPolicy, 'roleId'>> {
  if (!input.baseEntryKey.trim()) {
    return [];
  }

  const overrideMap = new Map(
    input.overrides
      .filter((item) => item.defaultEntryKey.trim() && input.supportedTerminals.includes(item.terminal))
      .map((item) => [item.terminal, item.defaultEntryKey.trim()]),
  );

  return [
    {
      defaultEntryKey: input.baseEntryKey.trim(),
      enabled: true,
      priority: DEFAULT_LANDING_PRIORITY,
      terminal: DEFAULT_NAVIGATION_TERMINAL,
    },
    ...[...overrideMap.entries()].map(([terminal, defaultEntryKey]) => ({
      defaultEntryKey,
      enabled: true,
      priority: DEFAULT_LANDING_PRIORITY,
      terminal,
    })),
  ];
}

// Reduces managed visibility rows into one default selection plus terminal-specific overrides for the role UI.
export function deriveVisibilityEditorState(input: {
  supportedTerminals: string[];
  visibility: PermissionManagementApi.RoleNavigationVisibility[];
}): VisibilityEditorState {
  const terminalVisibility = new Map<string, string[]>();

  terminalVisibility.set(DEFAULT_NAVIGATION_TERMINAL, []);
  for (const terminal of input.supportedTerminals) {
    terminalVisibility.set(terminal, []);
  }

  for (const item of input.visibility) {
    if (
      !item.enabled ||
      (!input.supportedTerminals.includes(item.terminal) &&
        item.terminal !== DEFAULT_NAVIGATION_TERMINAL)
    ) {
      continue;
    }

    const entryKeys = terminalVisibility.get(item.terminal) ?? [];
    if (!entryKeys.includes(item.entryKey)) {
      entryKeys.push(item.entryKey);
    }
    terminalVisibility.set(item.terminal, entryKeys.sort());
  }

  const hasDefaultRows =
    (terminalVisibility.get(DEFAULT_NAVIGATION_TERMINAL) ?? []).length > 0;
  const baseTerminal = hasDefaultRows
    ? DEFAULT_NAVIGATION_TERMINAL
    : input.supportedTerminals.includes('WEB')
    ? 'WEB'
    : input.supportedTerminals[0] || 'WEB';
  const baseEntryKeys = [...(terminalVisibility.get(baseTerminal) ?? [])].sort();

  return {
    baseEntryKeys,
    overrides: input.supportedTerminals
      .map((terminal) => ({
        entryKeys: [...(terminalVisibility.get(terminal) ?? [])].sort(),
        terminal,
      }))
      .filter(
        (override) =>
          override.entryKeys.length > 0 &&
          override.entryKeys.join('|') !== baseEntryKeys.join('|'),
      ),
  };
}

// Expands one default visibility selection plus terminal overrides into the managed visibility payload.
export function buildVisibilityPayloadFromEditor(input: {
  entries: PermissionManagementApi.NavigationEntry[];
  baseEntryKeys: string[];
  overrides: VisibilityTerminalOverride[];
  supportedTerminals: string[];
}): Array<Omit<PermissionManagementApi.RoleNavigationVisibility, 'roleId'>> {
  const entryMap = new Map(
    input.entries.map((entry) => [entry.entryKey, entry.supportedTerminals]),
  );
  const overrideMap = new Map(
    input.overrides.map((override) => [override.terminal, [...override.entryKeys].sort()]),
  );

  const defaultRows = [...new Set(input.baseEntryKeys)]
    .filter((entryKey) => (entryMap.get(entryKey) ?? []).length > 0)
    .sort()
    .map((entryKey) => ({
      enabled: true,
      entryKey,
      terminal: DEFAULT_NAVIGATION_TERMINAL,
    }));

  const overrideRows = [...overrideMap.entries()].flatMap(([terminal, entryKeys]) =>
    [...new Set(entryKeys)]
      .filter((entryKey) => entryMap.get(entryKey)?.includes(terminal))
      .sort()
      .map((entryKey) => ({
        enabled: true,
        entryKey,
        terminal,
      })),
  );

  return [...defaultRows, ...overrideRows];
}

// Validates whether the current editor state can be safely persisted as one navigation configuration.
export function validateNavigationEditorState(
  input: NavigationEditorValidationInput,
): NavigationEditorValidationResult {
  const entryMap = new Map(input.entries.map((entry) => [entry.entryKey, entry]));
  const baseEntryKeys = [...new Set(input.baseEntryKeys)].filter((entryKey) =>
    entryMap.has(entryKey),
  );
  const baseLandingEntryKey = input.baseLandingEntryKey.trim();
  const visibilityOverrideMap = new Map(
    input.visibilityOverrides.map((override) => [
      override.terminal,
      [...new Set(override.entryKeys)].filter((entryKey) => entryMap.has(entryKey)),
    ]),
  );
  const landingOverrideMap = new Map(
    input.landingOverrides.map((override) => [
      override.terminal,
      override.defaultEntryKey.trim(),
    ]),
  );

  if (baseEntryKeys.length > 0 && !baseLandingEntryKey) {
    return {
      message: '请为默认配置选择默认进入',
      valid: false,
    };
  }

  if (
    baseLandingEntryKey &&
    !baseEntryKeys.includes(baseLandingEntryKey)
  ) {
    return {
      message: '默认配置的默认进入必须属于已勾选的可见入口',
      valid: false,
    };
  }

  for (const terminal of input.supportedTerminals) {
    const effectiveEntryKeys = (
      visibilityOverrideMap.get(terminal)?.length
        ? visibilityOverrideMap.get(terminal)
        : baseEntryKeys
    )!.filter((entryKey) =>
      entryMap.get(entryKey)?.supportedTerminals.includes(terminal),
    );
    const effectiveLandingEntryKey =
      landingOverrideMap.get(terminal) || baseLandingEntryKey;

    if (effectiveEntryKeys.length > 0 && !effectiveLandingEntryKey) {
      return {
        message: `请为 ${terminal} 选择默认进入`,
        valid: false,
      };
    }

    if (!effectiveLandingEntryKey) {
      continue;
    }

    const landingEntry = entryMap.get(effectiveLandingEntryKey);

    if (!landingEntry?.supportedTerminals.includes(terminal)) {
      return {
        message: `请为 ${terminal} 选择可用的默认进入`,
        valid: false,
      };
    }

    if (!effectiveEntryKeys.includes(effectiveLandingEntryKey)) {
      return {
        message: `${terminal} 的默认进入必须属于当前前端可见入口`,
        valid: false,
      };
    }
  }

  return {
    message: '',
    valid: true,
  };
}

// Groups navigation entries into stable feature sections for the role-navigation chooser UI.
export function groupNavigationEntriesByFeature(
  entries: PermissionManagementApi.NavigationEntry[],
): NavigationFeatureGroup[] {
  const groups = new Map<string, PermissionManagementApi.NavigationEntry[]>();

  for (const entry of entries) {
    const featureKey = entry.featureKey?.trim() || entry.entryKey.split('.')[0] || 'general';
    const featureEntries = groups.get(featureKey) ?? [];
    featureEntries.push(entry);
    groups.set(featureKey, featureEntries);
  }

  return [...groups.entries()]
    .map(([featureKey, featureEntries]) => ({
      entries: [...featureEntries]
        .sort((left, right) => {
          if (right.registryPriority !== left.registryPriority) {
            return right.registryPriority - left.registryPriority;
          }

          return left.entryKey.localeCompare(right.entryKey);
        })
        .map((entry) => entry.entryKey),
      featureKey,
      label: featureKey,
    }))
    .sort((left, right) => left.label.localeCompare(right.label));
}

function normalizeRoleKind(roleKind: RoleManagementApi.Role['roleKind']) {
  switch (roleKind as unknown) {
    case 1:
    case 'ROLE_KIND_PROTO_SYSTEM_TEMPLATE':
    case 'SYSTEM_TEMPLATE':
      return 'SYSTEM_TEMPLATE';
    case 2:
    case 'ROLE_KIND_PROTO_TENANT_INSTANCE':
    case 'TENANT_INSTANCE':
      return 'TENANT_INSTANCE';
    case 3:
    case 'ROLE_KIND_PROTO_SYSTEM_INSTANCE':
    case 'SYSTEM_INSTANCE':
      return 'SYSTEM_INSTANCE';
    default:
      return roleKind;
  }
}
