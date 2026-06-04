import {
  normalizeTerminalAccessList,
  normalizeTerminalAccessTerminal
} from '../../src/domain/constants/terminal-access-terminal'

describe('terminal access terminal constants', () => {
  it('accepts browser extension as a human login terminal', () => {
    expect(normalizeTerminalAccessTerminal(' browser_extension ')).toBe('BROWSER_EXTENSION')
    expect(normalizeTerminalAccessList(['WEB', 'browser_extension', 'WEB'])).toEqual([
      'BROWSER_EXTENSION',
      'WEB'
    ])
  })
})
