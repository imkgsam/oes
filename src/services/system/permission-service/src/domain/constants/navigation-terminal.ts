export const DEFAULT_NAVIGATION_TERMINAL = 'DEFAULT'

/** normalizeNavigationTerminalCandidates returns the fallback order for terminal-specific navigation lookup. */
export function normalizeNavigationTerminalCandidates(terminal: string): string[] {
  const normalizedTerminal = terminal.trim() || DEFAULT_NAVIGATION_TERMINAL
  return normalizedTerminal === DEFAULT_NAVIGATION_TERMINAL
    ? [DEFAULT_NAVIGATION_TERMINAL]
    : [DEFAULT_NAVIGATION_TERMINAL, normalizedTerminal]
}

/** isDefaultNavigationTerminal identifies rules that apply to every supported terminal. */
export function isDefaultNavigationTerminal(terminal: string): boolean {
  return terminal === DEFAULT_NAVIGATION_TERMINAL
}
