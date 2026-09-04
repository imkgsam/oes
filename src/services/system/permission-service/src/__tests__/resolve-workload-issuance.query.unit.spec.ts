import { validate } from 'class-validator'
import { ResolveWorkloadIssuanceQuery } from '../application/queries/authorization/resolve-workload-issuance.query'

describe('ResolveWorkloadIssuanceQuery', () => {
  it('retains only guard-owned bootstrap input and caller evidence through validation', async () => {
    const query = new ResolveWorkloadIssuanceQuery({} as any, {} as any)
    await expect(validate(query, { whitelist: true, forbidNonWhitelisted: true })).resolves.toEqual([])
  })
})
