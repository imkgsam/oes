import { TerminalAccessResolverService } from '../../src/domain/services/terminal-access-resolver.service'

describe('TerminalAccessResolverService', () => {
  const resolver = new TerminalAccessResolverService()

  it('allows a requested terminal from the union of active role terminal access', () => {
    const result = resolver.resolve({
      terminal: 'PDA',
      activeRoleIds: ['worker-role', 'quality-role'],
      roleTerminalAccess: [
        { roleId: 'worker-role', allowedTerminals: ['PDA'] },
        { roleId: 'quality-role', allowedTerminals: ['WEB', 'KIOSK'] }
      ]
    })

    expect(result.allowed).toBe(true)
    expect(result.reasonCode).toBe('ALLOWED')
    expect(result.effectiveAllowedTerminals).toEqual(['KIOSK', 'PDA', 'WEB'])
    expect(result.resolutionSource).toBe('ROLE_UNION')
    expect(result.matchedRoleIds).toEqual(['worker-role', 'quality-role'])
  })

  it('uses account override as a replacement for role terminal access', () => {
    const result = resolver.resolve({
      terminal: 'WEB',
      activeRoleIds: ['worker-role'],
      roleTerminalAccess: [{ roleId: 'worker-role', allowedTerminals: ['PDA'] }],
      accountOverride: { accountId: 'account-1', allowedTerminals: ['WEB'] }
    })

    expect(result.allowed).toBe(true)
    expect(result.effectiveAllowedTerminals).toEqual(['WEB'])
    expect(result.resolutionSource).toBe('ACCOUNT_OVERRIDE')
    expect(result.matchedRoleIds).toEqual([])
  })

  it('treats an empty account override as an all-terminal account ban', () => {
    const result = resolver.resolve({
      terminal: 'WEB',
      activeRoleIds: ['office-role'],
      roleTerminalAccess: [{ roleId: 'office-role', allowedTerminals: ['WEB'] }],
      accountOverride: { accountId: 'account-1', allowedTerminals: [] }
    })

    expect(result.allowed).toBe(false)
    expect(result.reasonCode).toBe('TERMINAL_ACCESS_DENIED')
    expect(result.effectiveAllowedTerminals).toEqual([])
    expect(result.resolutionSource).toBe('ACCOUNT_OVERRIDE')
  })

  it('denies when active roles have no terminal policy', () => {
    const result = resolver.resolve({
      terminal: 'WEB',
      activeRoleIds: ['office-role'],
      roleTerminalAccess: []
    })

    expect(result.allowed).toBe(false)
    expect(result.reasonCode).toBe('TERMINAL_ACCESS_DENIED')
    expect(result.effectiveAllowedTerminals).toEqual([])
    expect(result.resolutionSource).toBe('ROLE_UNION')
  })

  it('denies invalid login terminals before resolving policy facts', () => {
    const result = resolver.resolve({
      terminal: 'DEFAULT',
      activeRoleIds: ['office-role'],
      roleTerminalAccess: [{ roleId: 'office-role', allowedTerminals: ['WEB'] }]
    })

    expect(result.allowed).toBe(false)
    expect(result.reasonCode).toBe('INVALID_TERMINAL')
    expect(result.effectiveAllowedTerminals).toEqual([])
    expect(result.resolutionSource).toBe('ROLE_UNION')
  })
})
