import { Inject } from '@nestjs/common'
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { SYMBOLS } from '../../../common/constants/symbols'
import { TerminalAccessRepository } from '../../../domain/repositories/terminal-access.repository'
import { GetRoleTerminalAccessQuery } from './get-role-terminal-access.query'

export interface RoleTerminalAccessResult {
  roleId: string
  allowedTerminals: string[]
}

/** GetRoleTerminalAccessHandler returns role terminal access defaults or an empty set when unconfigured. */
@QueryHandler(GetRoleTerminalAccessQuery)
export class GetRoleTerminalAccessHandler
  implements IQueryHandler<GetRoleTerminalAccessQuery, RoleTerminalAccessResult>
{
  constructor(
    @Inject(SYMBOLS.REPO.TERMINAL_ACCESS)
    private readonly terminalAccessRepo: TerminalAccessRepository
  ) {}

  async execute(query: GetRoleTerminalAccessQuery): Promise<RoleTerminalAccessResult> {
    const facts = await this.terminalAccessRepo.findRoleTerminalAccess([query.roleId])
    return {
      roleId: query.roleId,
      allowedTerminals: facts[0]?.allowedTerminals ? [...facts[0].allowedTerminals] : []
    }
  }
}
