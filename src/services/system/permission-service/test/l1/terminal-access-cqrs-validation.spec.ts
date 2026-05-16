import { validate } from 'class-validator'
import { DeleteAccountTerminalAccessOverrideCommand } from '../../src/application/commands/terminal-access/delete-account-terminal-access-override.command'
import { ReplaceAccountTerminalAccessOverrideCommand } from '../../src/application/commands/terminal-access/replace-account-terminal-access-override.command'
import { SetRoleTerminalAccessCommand } from '../../src/application/commands/terminal-access/set-role-terminal-access.command'
import { GetAccountTerminalAccessQuery } from '../../src/application/queries/terminal-access/get-account-terminal-access.query'
import { GetRoleTerminalAccessQuery } from '../../src/application/queries/terminal-access/get-role-terminal-access.query'
import { ScopeLevel } from '../../src/domain/enums/scope-level.enum'

const roleId = 'a6d387b3-7598-47ad-a4ec-e306a0efed7d'
const accountId = '81ce8be0-2f62-4576-9084-a3e9038183e4'
const tenantId = '00000000-0000-4000-8000-000000000001'

const validateStrictly = (value: object) =>
  validate(value, {
    whitelist: true,
    forbidNonWhitelisted: true,
    forbidUnknownValues: false,
    skipMissingProperties: false
  })

describe('terminal access CQRS validation metadata', () => {
  it('allows role terminal access management messages through strict validation', async () => {
    await expect(validateStrictly(new GetRoleTerminalAccessQuery(roleId))).resolves.toEqual([])
    await expect(
      validateStrictly(
        new SetRoleTerminalAccessCommand({
          roleId,
          allowedTerminals: ['WEB', 'PDA'],
          operatorScope: { operatorId: accountId, tenantId, isSystemScope: false }
        })
      )
    ).resolves.toEqual([])
  })

  it('allows account terminal access override messages through strict validation', async () => {
    await expect(
      validateStrictly(new GetAccountTerminalAccessQuery(accountId, tenantId, ScopeLevel.TENANT))
    ).resolves.toEqual([])
    await expect(
      validateStrictly(
        new ReplaceAccountTerminalAccessOverrideCommand({
          accountId,
          tenantId,
          scopeLevel: ScopeLevel.TENANT,
          allowedTerminals: ['KIOSK']
        })
      )
    ).resolves.toEqual([])
    await expect(
      validateStrictly(
        new DeleteAccountTerminalAccessOverrideCommand({
          accountId,
          tenantId,
          scopeLevel: ScopeLevel.TENANT
        })
      )
    ).resolves.toEqual([])
  })
})
