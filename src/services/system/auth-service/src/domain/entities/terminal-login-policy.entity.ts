import { TerminalLoginFlow } from '@oes/common/auth'

export type TerminalLoginPolicySnapshot = {
  terminal: string
  enabledLoginFlows: TerminalLoginFlow[]
}

const ALL_TERMINAL_LOGIN_FLOWS = Object.values(TerminalLoginFlow)

const WEB_IMPLEMENTED_LOGIN_FLOWS: readonly TerminalLoginFlow[] = [
  TerminalLoginFlow.EmailPassword,
  TerminalLoginFlow.EmailOtp,
  TerminalLoginFlow.PhonePassword,
  TerminalLoginFlow.PhoneOtp
]

// Represents the platform-owned login flow allowlist for one terminal entry.
export class TerminalLoginPolicyEntity {
  constructor(
    public readonly terminal: string,
    private readonly enabledLoginFlows: TerminalLoginFlow[]
  ) {
    this.ensureValidFlows(enabledLoginFlows)
    this.enabledLoginFlows = [...enabledLoginFlows]
  }

  static defaults(): TerminalLoginPolicyEntity[] {
    return [
      new TerminalLoginPolicyEntity('WEB', [...WEB_IMPLEMENTED_LOGIN_FLOWS]),
      new TerminalLoginPolicyEntity('PDA', [TerminalLoginFlow.Password]),
      new TerminalLoginPolicyEntity('KIOSK', [])
    ]
  }

  isFlowAllowed(flow: string): boolean {
    return this.enabledLoginFlows.includes(flow as TerminalLoginFlow)
  }

  replaceEnabledFlows(flows: TerminalLoginFlow[], supportedFlows: readonly TerminalLoginFlow[]): void {
    this.ensureValidFlows(flows)
    this.ensureValidFlows(supportedFlows)
    const unsupportedFlows = flows.filter((flow) => !supportedFlows.includes(flow))
    if (unsupportedFlows.length > 0) {
      throw new Error('Terminal login policy cannot enable unsupported flows')
    }

    this.enabledLoginFlows.splice(0, this.enabledLoginFlows.length, ...Array.from(new Set(flows)))
  }

  getEnabledFlows(): TerminalLoginFlow[] {
    return [...this.enabledLoginFlows]
  }

  toSnapshot(): TerminalLoginPolicySnapshot {
    return {
      terminal: this.terminal,
      enabledLoginFlows: this.getEnabledFlows()
    }
  }

  private ensureValidFlows(flows: readonly string[]): asserts flows is readonly TerminalLoginFlow[] {
    const invalidFlows = flows.filter((flow) => !ALL_TERMINAL_LOGIN_FLOWS.includes(flow as TerminalLoginFlow))
    if (invalidFlows.length > 0) {
      throw new Error('Terminal login policy contains invalid flows')
    }
  }
}
