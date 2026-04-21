import { describe, expect, it } from '@jest/globals'
import { validateSync } from 'class-validator'
import { CreateRoleInstanceCommand } from '../../src/application/commands/role/create-role-instance.command'
import { CreateRoleInstanceFromTemplateCommand } from '../../src/application/commands/role/create-role-instance-from-template.command'
import { CreateRoleTemplateCommand } from '../../src/application/commands/role/create-role-template.command'

describe('Role code format validation', () => {
  it('accepts the dotted and hyphenated role codes already used by seeded roles and templates', () => {
    expect(
      validateSync(
        new CreateRoleTemplateCommand({
          name: 'Tenant Admin Template',
          code: 'tenant.admin',
          description: ''
        })
      )
    ).toHaveLength(0)

    expect(
      validateSync(
        new CreateRoleInstanceCommand({
          name: 'Foreign Trade Manager',
          code: 'foreign-trade.manager',
          scopeLevel: 'TENANT' as any,
          tenantId: 'tenant-1',
          description: ''
        })
      )
    ).toHaveLength(0)

    expect(
      validateSync(
        new CreateRoleInstanceFromTemplateCommand({
          templateRoleId: '550e8400-e29b-41d4-a716-446655440000',
          tenantId: 'tenant-1',
          description: ''
        })
      )
    ).toHaveLength(0)
  })

  it('keeps template description optional when the form leaves it blank', () => {
    expect(
      validateSync(
        new CreateRoleTemplateCommand({
          name: 'Template Without Description',
          code: 'tenant.admin'
        })
      )
    ).toHaveLength(0)
  })

  it('rejects role codes that do not start with a letter or contain spaces', () => {
    expect(
      validateSync(
        new CreateRoleTemplateCommand({
          name: 'Invalid Template',
          code: '1tenant.admin'
        })
      )
    ).not.toHaveLength(0)

    expect(
      validateSync(
        new CreateRoleInstanceCommand({
          name: 'Invalid Role',
          code: 'tenant admin',
          scopeLevel: 'TENANT' as any,
          tenantId: 'tenant-1'
        })
      )
    ).not.toHaveLength(0)
  })
})
