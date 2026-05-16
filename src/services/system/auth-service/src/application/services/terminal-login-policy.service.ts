import { Inject, Injectable } from '@nestjs/common'
import { TerminalLoginFlow } from '@oes/common/auth'
import { ExceptionDefinition, ExceptionFactory } from '@oes/common/exceptions'
import { status } from '@grpc/grpc-js'
import { REPO } from '../../common/constants'
import { TerminalLoginPolicyEntity } from '../../domain/entities/terminal-login-policy.entity'
import { TerminalLoginPolicyRepository } from '../../domain/repositories/terminal-login-policy.repository'

export interface UpdateTerminalLoginPolicyInput {
  terminal: string
  enabledLoginFlows: readonly string[]
  supportedLoginFlows: readonly string[]
  updatedBy?: string
}

const AUTH_TERMINAL_LOGIN_FLOW_DISABLED: ExceptionDefinition = {
  code: 'AUTH_TERMINAL_LOGIN_FLOW_DISABLED',
  message: 'Terminal login flow is disabled for this terminal',
  messageKey: 'auth.terminal_login_flow_disabled',
  rpcStatus: status.FAILED_PRECONDITION
}

const AUTH_TERMINAL_LOGIN_FLOW_UNSUPPORTED: ExceptionDefinition = {
  code: 'AUTH_TERMINAL_LOGIN_FLOW_UNSUPPORTED',
  message: 'Terminal login policy cannot enable unsupported flows',
  messageKey: 'auth.terminal_login_flow_unsupported',
  rpcStatus: status.INVALID_ARGUMENT
}

// Applies platform terminal login policy decisions before runtime credential handlers run.
@Injectable()
export class TerminalLoginPolicyService {
  constructor(
    @Inject(REPO.TERMINAL_LOGIN_POLICY)
    private readonly repository: TerminalLoginPolicyRepository
  ) {}

  // Ensures a terminal login flow is enabled before downstream credential validation runs.
  async assertFlowAllowed(terminal: string, loginFlow: string): Promise<void> {
    const normalizedTerminal = this.normalizeTerminal(terminal)
    const policy =
      (await this.repository.findByTerminal(normalizedTerminal)) ??
      this.defaultPolicyForTerminal(normalizedTerminal)

    if (!policy.isFlowAllowed(loginFlow)) {
      throw ExceptionFactory.domain(AUTH_TERMINAL_LOGIN_FLOW_DISABLED, {
        terminal: normalizedTerminal,
        loginFlow
      })
    }
  }

  // Returns every managed platform terminal login policy with default-backed gaps.
  async getPlatformPolicy(): Promise<TerminalLoginPolicyEntity[]> {
    const defaults = TerminalLoginPolicyEntity.defaults()
    const policies = await Promise.all(
      defaults.map((policy) => this.repository.findByTerminal(policy.terminal))
    )

    return policies.map((policy, index) => policy ?? defaults[index])
  }

  // Replaces one platform terminal login policy after validating the enabled flows against supported flows.
  async updatePlatformPolicy(
    input: UpdateTerminalLoginPolicyInput
  ): Promise<TerminalLoginPolicyEntity> {
    const normalizedTerminal = this.normalizeTerminal(input.terminal)
    const policy =
      (await this.repository.findByTerminal(normalizedTerminal)) ??
      new TerminalLoginPolicyEntity(normalizedTerminal, [])

    try {
      policy.replaceEnabledFlows(
        input.enabledLoginFlows as TerminalLoginFlow[],
        input.supportedLoginFlows as TerminalLoginFlow[]
      )
    } catch (error) {
      throw ExceptionFactory.domain(AUTH_TERMINAL_LOGIN_FLOW_UNSUPPORTED, {
        terminal: normalizedTerminal,
        reason: error instanceof Error ? error.message : String(error)
      })
    }

    return this.repository.save(policy, input.updatedBy)
  }

  // Finds the domain login policy default for a terminal without persisting a row.
  private defaultPolicyForTerminal(terminal: string): TerminalLoginPolicyEntity {
    return (
      TerminalLoginPolicyEntity.defaults().find((policy) => policy.terminal === terminal) ??
      new TerminalLoginPolicyEntity(terminal, [])
    )
  }

  // Normalizes terminal identifiers to the uppercase platform policy key.
  private normalizeTerminal(terminal: string): string {
    return terminal.trim().toUpperCase()
  }
}
