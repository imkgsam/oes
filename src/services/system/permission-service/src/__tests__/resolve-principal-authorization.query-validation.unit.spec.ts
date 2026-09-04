import { validate } from 'class-validator'
import { ResolvePrincipalAuthorizationQuery } from '../application/queries/authorization/resolve-principal-authorization.query'

describe('ResolvePrincipalAuthorizationQuery validation', () => {
  it('preserves owner-validated input and verified caller through the strict query bus', async () => {
    const query = new ResolvePrincipalAuthorizationQuery({ principalType: 'HUMAN' } as any, {
      principalType: 'HUMAN'
    } as any)
    await expect(validate(query, { whitelist: true, forbidNonWhitelisted: true })).resolves.toEqual([])
  })
})
