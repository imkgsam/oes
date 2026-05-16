import { TerminalAccessRepository } from '../../../domain/repositories/terminal-access.repository'

/** syncTemplateTerminalAccessToRole snapshots one template's terminal allow-list onto a target role id. */
export async function syncTemplateTerminalAccessToRole(
  terminalAccessRepo: TerminalAccessRepository,
  templateRoleId: string,
  targetRoleId: string
): Promise<void> {
  const [templateAccess] = await terminalAccessRepo.findRoleTerminalAccess([templateRoleId])

  if (!templateAccess) {
    return
  }

  await terminalAccessRepo.replaceRoleTerminalAccess(targetRoleId, templateAccess.allowedTerminals)
}
