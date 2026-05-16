import { Inject, Injectable } from '@nestjs/common'
import { status } from '@grpc/grpc-js'
import { ExceptionDefinition, ExceptionFactory } from '@oes/common/exceptions'
import {
  MfaBindingType,
  TerminalMfaPolicyEntity
} from '../../domain/entities/terminal-mfa-policy.entity'
import { TerminalMfaPolicyRepository } from '../../domain/repositories/terminal-mfa-policy.repository'
import { REPO } from '../../common/constants'

export type TerminalMfaPolicyResolutionSource = 'PLATFORM_DEFAULT' | 'TENANT_OVERRIDE'

export interface TerminalMfaPolicyResolution {
  terminal: string
  tenantId?: string
  source: TerminalMfaPolicyResolutionSource
  loginMfaRequired: boolean
  newDeviceMfaRequired: boolean
  allowedFactors: MfaBindingType[]
  factorPriority: MfaBindingType[]
}

export interface UpdateTerminalMfaPolicyInput {
  terminal: string
  loginMfaRequired: boolean
  newDeviceMfaRequired: boolean
  allowedFactors: readonly MfaBindingType[]
  factorPriority: readonly MfaBindingType[]
  updatedBy?: string
}

export interface UpdateTenantTerminalMfaPolicyInput extends UpdateTerminalMfaPolicyInput {
  tenantId: string
}

const AUTH_TERMINAL_MFA_POLICY_INVALID: ExceptionDefinition = {
  code: 'AUTH_TERMINAL_MFA_POLICY_INVALID',
  message: 'Terminal MFA policy is invalid',
  messageKey: 'auth.terminal_mfa_policy_invalid',
  rpcStatus: status.INVALID_ARGUMENT
}

// Resolves effective terminal MFA policy while keeping tenant overrides independent from platform defaults.
@Injectable()
export class TerminalMfaPolicyService {
  constructor(
    @Inject(REPO.TERMINAL_MFA_POLICY)
    private readonly repository: TerminalMfaPolicyRepository
  ) {}

  // Resolves the effective terminal MFA policy, preferring tenant override over platform default.
  async resolve(input: { tenantId?: string; terminal: string }): Promise<TerminalMfaPolicyResolution> {
    const normalizedTerminal = this.normalizeTerminal(input.terminal)
    if (input.tenantId) {
      const tenantOverride = await this.repository.findTenantOverride(
        input.tenantId,
        normalizedTerminal
      )
      if (tenantOverride) {
        return this.toResolution(tenantOverride, 'TENANT_OVERRIDE')
      }
    }

    const platformDefault =
      (await this.repository.findPlatformDefaultByTerminal(normalizedTerminal)) ??
      this.defaultForTerminal(normalizedTerminal)
    return this.toResolution(platformDefault, 'PLATFORM_DEFAULT')
  }

  // Returns every managed platform terminal MFA default with domain defaults filling missing rows.
  async getPlatformDefaults(): Promise<TerminalMfaPolicyEntity[]> {
    const defaults = TerminalMfaPolicyEntity.platformDefaults()
    const policies = await Promise.all(
      defaults.map((policy) => this.repository.findPlatformDefaultByTerminal(policy.terminal))
    )

    return policies.map((policy, index) => policy ?? defaults[index])
  }

  // Replaces one platform terminal MFA default policy.
  async updatePlatformDefault(
    input: UpdateTerminalMfaPolicyInput
  ): Promise<TerminalMfaPolicyEntity> {
    const policy = this.createValidatedPolicy({
      terminal: this.normalizeTerminal(input.terminal),
      loginMfaRequired: input.loginMfaRequired,
      newDeviceMfaRequired: input.newDeviceMfaRequired,
      allowedFactors: input.allowedFactors,
      factorPriority: input.factorPriority
    })

    return this.repository.savePlatformDefault(policy, input.updatedBy)
  }

  // Resolves the effective terminal MFA policies for all managed terminals in a tenant.
  async getTenantPolicy(tenantId: string): Promise<TerminalMfaPolicyResolution[]> {
    return Promise.all(
      TerminalMfaPolicyEntity.platformDefaults().map((policy) =>
        this.resolve({ tenantId, terminal: policy.terminal })
      )
    )
  }

  // Replaces one tenant terminal MFA override policy.
  async updateTenantPolicy(
    input: UpdateTenantTerminalMfaPolicyInput
  ): Promise<TerminalMfaPolicyEntity> {
    const policy = this.createValidatedPolicy({
      tenantId: input.tenantId,
      terminal: this.normalizeTerminal(input.terminal),
      loginMfaRequired: input.loginMfaRequired,
      newDeviceMfaRequired: input.newDeviceMfaRequired,
      allowedFactors: input.allowedFactors,
      factorPriority: input.factorPriority
    })

    return this.repository.saveTenantOverride(policy, input.updatedBy)
  }

  // Creates a terminal MFA policy and maps domain validation failures to a stable application exception.
  private createValidatedPolicy(snapshot: {
    tenantId?: string
    terminal: string
    loginMfaRequired: boolean
    newDeviceMfaRequired: boolean
    allowedFactors: readonly MfaBindingType[]
    factorPriority: readonly MfaBindingType[]
  }): TerminalMfaPolicyEntity {
    try {
      return new TerminalMfaPolicyEntity(snapshot)
    } catch (error) {
      throw ExceptionFactory.domain(AUTH_TERMINAL_MFA_POLICY_INVALID, {
        terminal: snapshot.terminal,
        tenantId: snapshot.tenantId,
        reason: error instanceof Error ? error.message : String(error)
      })
    }
  }

  // Converts a domain terminal MFA policy entity into the application resolution DTO.
  private toResolution(
    policy: TerminalMfaPolicyEntity,
    source: TerminalMfaPolicyResolutionSource
  ): TerminalMfaPolicyResolution {
    const snapshot = policy.toSnapshot()
    return {
      tenantId: snapshot.tenantId,
      terminal: snapshot.terminal,
      source,
      loginMfaRequired: snapshot.loginMfaRequired,
      newDeviceMfaRequired: snapshot.newDeviceMfaRequired,
      allowedFactors: policy.getAllowedFactors(),
      factorPriority: policy.getFactorPriority()
    }
  }

  // Finds the domain platform MFA default for a terminal without persisting a row.
  private defaultForTerminal(terminal: string): TerminalMfaPolicyEntity {
    return (
      TerminalMfaPolicyEntity.platformDefaults().find((policy) => policy.terminal === terminal) ??
      new TerminalMfaPolicyEntity({
        terminal,
        loginMfaRequired: false,
        newDeviceMfaRequired: false,
        allowedFactors: [],
        factorPriority: []
      })
    )
  }

  // Normalizes terminal identifiers to the uppercase platform policy key.
  private normalizeTerminal(terminal: string): string {
    return terminal.trim().toUpperCase()
  }
}
