import { Inject, Injectable } from '@nestjs/common'
import { IQuery, IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { SYMBOLS } from '../../../common/constants/symbols'
import { TerminalDeviceVersionPolicyEntity } from '../../../domain/entities/terminal-device-version-policy.entity'
import { TerminalDeviceType } from '../../../domain/enums/terminal-device.enums'
import { TerminalDeviceVersionPolicyRepository } from '../../../domain/repositories/terminal-device-version-policy.repository'

export interface GetVersionPolicyQueryInput {
  tenantId: string
  terminalDeviceType: TerminalDeviceType
}

// GetVersionPolicyQuery carries a read request for one tenant terminal version policy.
export class GetVersionPolicyQuery implements IQuery {
  readonly tenantId: string
  readonly terminalDeviceType: TerminalDeviceType

  // Constructs the version policy query from tenant and terminal type identifiers.
  constructor(input: GetVersionPolicyQueryInput) {
    this.tenantId = input.tenantId
    this.terminalDeviceType = input.terminalDeviceType
  }
}

@Injectable()
@QueryHandler(GetVersionPolicyQuery)
// GetVersionPolicyHandler reads the current tenant terminal version policy without applying access rules.
export class GetVersionPolicyHandler implements IQueryHandler<GetVersionPolicyQuery, TerminalDeviceVersionPolicyEntity | null> {
  constructor(
    @Inject(SYMBOLS.REPO.VERSION_POLICY)
    private readonly versionPolicyRepository: TerminalDeviceVersionPolicyRepository
  ) {}

  // Executes the query against the version policy repository port.
  async execute(query: GetVersionPolicyQuery): Promise<TerminalDeviceVersionPolicyEntity | null> {
    return this.versionPolicyRepository.findByTenantAndType(query.tenantId, query.terminalDeviceType)
  }
}
