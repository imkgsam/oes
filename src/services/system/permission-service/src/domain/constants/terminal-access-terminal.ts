export const TERMINAL_ACCESS_TERMINALS = [
  'WEB',
  'PDA',
  'KIOSK',
  'MOBILE',
  'MINIAPP',
  'BROWSER_EXTENSION'
] as const

export type TerminalAccessTerminal = (typeof TERMINAL_ACCESS_TERMINALS)[number]

const TERMINAL_ACCESS_TERMINAL_SET = new Set<string>(TERMINAL_ACCESS_TERMINALS)

/** isTerminalAccessTerminal checks whether a value is valid for human login terminal access. */
export function isTerminalAccessTerminal(value: string | null | undefined): value is TerminalAccessTerminal {
  return typeof value === 'string' && TERMINAL_ACCESS_TERMINAL_SET.has(value.trim().toUpperCase())
}

/** normalizeTerminalAccessTerminal converts external terminal strings into the canonical login terminal enum. */
export function normalizeTerminalAccessTerminal(
  value: string | null | undefined
): TerminalAccessTerminal | null {
  if (!value) return null
  const normalized = value.trim().toUpperCase()
  return isTerminalAccessTerminal(normalized) ? normalized : null
}

/** normalizeTerminalAccessList returns sorted unique valid terminal access values. */
export function normalizeTerminalAccessList(values: readonly string[]): TerminalAccessTerminal[] {
  return [...new Set(values.map(normalizeTerminalAccessTerminal).filter(Boolean) as TerminalAccessTerminal[])].sort()
}
