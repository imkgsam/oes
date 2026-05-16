import {
  GetAccountTerminalAccessHandler,
  GetRoleTerminalAccessHandler,
  ResolveAccountTerminalAccessHandler,
  TerminalAccessQueryHandlers
} from '../../src/application/queries/terminal-access'

describe('terminal access query handler registration', () => {
  it('keeps management handlers separate from runtime auth terminal access resolution', () => {
    expect(TerminalAccessQueryHandlers).toEqual([
      GetRoleTerminalAccessHandler,
      GetAccountTerminalAccessHandler
    ])
    expect(TerminalAccessQueryHandlers).not.toContain(ResolveAccountTerminalAccessHandler)
  })
})
