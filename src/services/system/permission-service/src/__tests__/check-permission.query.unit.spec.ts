import { validate } from 'class-validator'
import { CheckPermissionQuery } from '../application/queries/authorization/check-permission.query'

describe('CheckPermissionQuery', () => {
  it('admits the optional canonical tenant UUID through strict CQRS validation', async () => {
    const query = new CheckPermissionQuery(
      '00000000-0000-4000-8000-000000000901',
      'collaboration.task.create',
      '00000000-0000-4000-8000-000000000001'
    )
    await expect(validate(query, { whitelist: true, forbidNonWhitelisted: true })).resolves.toEqual([])
  })

  it('rejects a malformed tenant without removing account or business Code validation', async () => {
    const violations = await validate(
      new CheckPermissionQuery('00000000-0000-4000-8000-000000000901', 'collaboration.task.create', 'tenant'),
      { whitelist: true, forbidNonWhitelisted: true }
    )
    expect(violations.map((item) => item.property)).toEqual(['tenantId'])
  })
})
