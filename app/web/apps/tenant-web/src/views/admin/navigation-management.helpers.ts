import type { PermissionManagementApi, RoleManagementApi } from '#/api';

import {
  buildLandingPoliciesFromEditor,
  buildVisibilityPayloadFromEditor,
  deriveLandingEditorState,
  deriveVisibilityEditorState,
  validateNavigationEditorState,
} from './role-management.helpers';

const DEFAULT_NAVIGATION_TERMINAL = 'DEFAULT';

export interface RoleNavigationEditorModel {
  entries: PermissionManagementApi.NavigationEntry[];
  landingEntryKey: string;
  visibleEntryKeys: string[];
}

export interface RoleNavigationSavePayloadResult {
  landingPolicies: Array<Omit<PermissionManagementApi.RoleLandingPolicy, 'roleId'>>;
  message: string;
  valid: boolean;
  visibility: Array<Omit<PermissionManagementApi.RoleNavigationVisibility, 'roleId'>>;
}

// Collects the stable terminal set used by the entry registry so role-navigation editing can share one model.
export function collectNavigationSupportedTerminals(
  entries: PermissionManagementApi.NavigationEntry[],
) {
  const terminals = new Set<string>();

  for (const entry of entries) {
    for (const terminal of entry.supportedTerminals ?? []) {
      const normalizedTerminal = terminal.trim();
      if (normalizedTerminal) {
        terminals.add(normalizedTerminal);
      }
    }
  }

  return [...terminals].sort();
}

// Builds the list-based editor state for one role-navigation terminal tab from the persisted role facts.
export function buildRoleNavigationEditorModel(input: {
  entries: PermissionManagementApi.NavigationEntry[];
  landingPolicies: PermissionManagementApi.RoleLandingPolicy[];
  terminal: string;
  visibility: PermissionManagementApi.RoleNavigationVisibility[];
}): RoleNavigationEditorModel {
  const supportedTerminals = collectNavigationSupportedTerminals(input.entries);
  const visibilityState = deriveVisibilityEditorState({
    supportedTerminals,
    visibility: input.visibility,
  });
  const landingState = deriveLandingEditorState({
    landingPolicies: input.landingPolicies,
    supportedTerminals,
  });
  const terminal = normalizeTerminal(input.terminal);
  const isDefaultTerminal = terminal === DEFAULT_NAVIGATION_TERMINAL;
  const orderedEntries = [...input.entries]
    .filter(
      (entry) =>
        isDefaultTerminal || entry.supportedTerminals.includes(terminal),
    )
    .sort((left, right) => {
      if (right.registryPriority !== left.registryPriority) {
        return right.registryPriority - left.registryPriority;
      }

      return left.entryKey.localeCompare(right.entryKey);
    });
  const entryMap = new Map(
    input.entries.map((entry) => [entry.entryKey, entry.supportedTerminals]),
  );
  const overrideVisibility =
    visibilityState.overrides.find((item) => item.terminal === terminal)?.entryKeys ?? [];
  const visibleEntryKeys = (isDefaultTerminal
    ? visibilityState.baseEntryKeys
    : overrideVisibility.length > 0
      ? overrideVisibility
      : visibilityState.baseEntryKeys
  ).filter(
    (entryKey) =>
      isDefaultTerminal || entryMap.get(entryKey)?.includes(terminal),
  );
  const overrideLanding =
    landingState.overrides.find((item) => item.terminal === terminal)?.defaultEntryKey ?? '';
  const baseLandingSupported =
    isDefaultTerminal ||
    entryMap.get(landingState.baseEntryKey)?.includes(terminal) === true;

  return {
    entries: orderedEntries,
    landingEntryKey:
      isDefaultTerminal
        ? landingState.baseEntryKey
        : overrideLanding || (baseLandingSupported ? landingState.baseEntryKey : ''),
    visibleEntryKeys,
  };
}

// Rebuilds the persisted role-navigation payloads after one list-based terminal editor has been changed.
export function buildRoleNavigationSavePayload(input: {
  entries: PermissionManagementApi.NavigationEntry[];
  landingEntryKey: string;
  landingPolicies: PermissionManagementApi.RoleLandingPolicy[];
  terminal: string;
  visibility: PermissionManagementApi.RoleNavigationVisibility[];
  visibleEntryKeys: string[];
}): RoleNavigationSavePayloadResult {
  const supportedTerminals = collectNavigationSupportedTerminals(input.entries);
  const visibilityState = deriveVisibilityEditorState({
    supportedTerminals,
    visibility: input.visibility,
  });
  const landingState = deriveLandingEditorState({
    landingPolicies: input.landingPolicies,
    supportedTerminals,
  });
  const terminal = normalizeTerminal(input.terminal);
  const isDefaultTerminal = terminal === DEFAULT_NAVIGATION_TERMINAL;
  const entryMap = new Map(
    input.entries.map((entry) => [entry.entryKey, entry]),
  );
  const nextVisibleEntryKeys = [...new Set(input.visibleEntryKeys)]
    .filter((entryKey) => entryMap.has(entryKey))
    .filter(
      (entryKey) =>
        isDefaultTerminal ||
        entryMap.get(entryKey)?.supportedTerminals.includes(terminal),
    )
    .sort();
  const nextLandingEntryKey = input.landingEntryKey.trim();
  const nextVisibilityBaseEntryKeys = isDefaultTerminal
    ? nextVisibleEntryKeys
    : visibilityState.baseEntryKeys;
  const baseVisibleForTerminal = visibilityState.baseEntryKeys
    .filter((entryKey) => entryMap.has(entryKey))
    .filter((entryKey) => entryMap.get(entryKey)?.supportedTerminals.includes(terminal))
    .sort();
  const nextVisibilityOverrides = visibilityState.overrides.filter(
    (item) => item.terminal !== terminal,
  );

  if (
    !isDefaultTerminal &&
    nextVisibleEntryKeys.join('|') !== baseVisibleForTerminal.join('|')
  ) {
    nextVisibilityOverrides.push({
      entryKeys: nextVisibleEntryKeys,
      terminal,
    });
  }

  const nextLandingBaseEntryKey = isDefaultTerminal
    ? nextLandingEntryKey
    : landingState.baseEntryKey;
  const baseLandingForTerminal =
    entryMap.get(landingState.baseEntryKey)?.supportedTerminals.includes(terminal)
      ? landingState.baseEntryKey
      : '';
  const nextLandingOverrides = landingState.overrides.filter(
    (item) => item.terminal !== terminal,
  );

  if (!isDefaultTerminal && nextLandingEntryKey && nextLandingEntryKey !== baseLandingForTerminal) {
    nextLandingOverrides.push({
      defaultEntryKey: nextLandingEntryKey,
      terminal,
    });
  }

  const validation = validateNavigationEditorState({
    baseEntryKeys: nextVisibilityBaseEntryKeys,
    baseLandingEntryKey: nextLandingBaseEntryKey,
    entries: input.entries,
    landingOverrides: nextLandingOverrides,
    supportedTerminals,
    visibilityOverrides: nextVisibilityOverrides,
  });

  if (!validation.valid) {
    return {
      landingPolicies: [],
      message: validation.message,
      valid: false,
      visibility: [],
    };
  }

  return {
    landingPolicies: buildLandingPoliciesFromEditor({
      baseEntryKey: nextLandingBaseEntryKey,
      overrides: nextLandingOverrides,
      supportedTerminals,
    }),
    message: '',
    valid: true,
    visibility: buildVisibilityPayloadFromEditor({
      baseEntryKeys: nextVisibilityBaseEntryKeys,
      entries: input.entries,
      overrides: nextVisibilityOverrides,
      supportedTerminals,
    }),
  };
}

// Infers preview scope from the selected roles so the UI no longer asks administrators to choose a redundant scope.
export function inferNavigationPreviewScopeLevel(
  roles: RoleManagementApi.Role[],
): 'SYSTEM' | 'TENANT' {
  return roles.some(
    (role) =>
      Boolean(role.tenantId) ||
      normalizeRoleKind(role.roleKind) === 'TENANT_INSTANCE',
  )
    ? 'TENANT'
    : 'SYSTEM';
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

function normalizeTerminal(terminal?: string) {
  const normalizedTerminal = terminal?.trim();
  return normalizedTerminal || DEFAULT_NAVIGATION_TERMINAL;
}
