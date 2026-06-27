// isChromeTabUnavailableError recognizes Chrome tab lifecycle races that should not fail background work.
export function isChromeTabUnavailableError(value: unknown): boolean {
  const message = value instanceof Error ? value.message : String(value ?? '')
  return /No tab with id|Tabs cannot be edited right now|Cannot access a chrome:|Cannot access contents of url/i.test(message)
}
