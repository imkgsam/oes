import { TerminalLoginFlow } from '@oes/common/auth'
import { TerminalLoginPolicyEntity } from './terminal-login-policy.entity'

describe('TerminalLoginPolicyEntity', () => {
  it('includes the implemented Web flows in the WEB default policy', () => {
    const webPolicy = TerminalLoginPolicyEntity.defaults().find((policy) => policy.terminal === 'WEB')

    expect(webPolicy?.isFlowAllowed(TerminalLoginFlow.EmailPassword)).toBe(true)
    expect(webPolicy?.isFlowAllowed(TerminalLoginFlow.EmailOtp)).toBe(true)
    expect(webPolicy?.isFlowAllowed(TerminalLoginFlow.PhonePassword)).toBe(true)
    expect(webPolicy?.isFlowAllowed(TerminalLoginFlow.PhoneOtp)).toBe(true)
  })

  it('enables PDA implemented login flows by default', () => {
    const pdaPolicy = TerminalLoginPolicyEntity.defaults().find((policy) => policy.terminal === 'PDA')

    expect(pdaPolicy?.getEnabledFlows()).toEqual([
      TerminalLoginFlow.Password,
      TerminalLoginFlow.EmployeeCodePin
    ])
  })

  it('keeps KIOSK without enabled Phase 2 login flows by default', () => {
    const kioskPolicy = TerminalLoginPolicyEntity.defaults().find((policy) => policy.terminal === 'KIOSK')

    expect(kioskPolicy?.getEnabledFlows()).toEqual([])
  })

  it('enables password login for the browser extension default policy', () => {
    const extensionPolicy = TerminalLoginPolicyEntity.defaults().find(
      (policy) => policy.terminal === 'BROWSER_EXTENSION'
    )

    expect(extensionPolicy?.getEnabledFlows()).toEqual([TerminalLoginFlow.Password])
  })

  it('rejects unsupported login flows when replacing enabled flows', () => {
    const policy = new TerminalLoginPolicyEntity('WEB', [])

    expect(() =>
      policy.replaceEnabledFlows(
        [TerminalLoginFlow.EmailPassword, TerminalLoginFlow.Passkey],
        [TerminalLoginFlow.EmailPassword]
      )
    ).toThrow('Terminal login policy cannot enable unsupported flows')
  })

  it('rejects invalid login flow values during construction or hydration', () => {
    expect(
      () => new TerminalLoginPolicyEntity('WEB', ['NOT_A_FLOW' as TerminalLoginFlow])
    ).toThrow('Terminal login policy contains invalid flows')
  })

  it('defensively copies enabled flow arrays from constructor input', () => {
    const flows = [TerminalLoginFlow.EmailPassword]
    const policy = new TerminalLoginPolicyEntity('WEB', flows)

    flows.push(TerminalLoginFlow.PhoneOtp)

    expect(policy.getEnabledFlows()).toEqual([TerminalLoginFlow.EmailPassword])
  })
})
