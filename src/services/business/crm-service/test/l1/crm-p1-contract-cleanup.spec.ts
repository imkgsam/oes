import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const repoRoot = join(__dirname, '../../../../../..')

/** CRM P1 cleanup contract tests prevent the deprecated customer-master runtime from re-entering the active surface. */
describe('CRM P1 contract cleanup', () => {
  it('does not expose deprecated customer-master RPCs in the active CRM proto', () => {
    const proto = readFileSync(
      join(repoRoot, 'src/common/src/contracts/crm_service/crm.proto'),
      'utf8'
    )

    expect(proto).not.toContain('rpc CreateCustomerAccount')
    expect(proto).not.toContain('rpc UpdateCustomerAccountBasics')
    expect(proto).not.toContain('rpc BindCustomerAccountToTenantParty')
    expect(proto).not.toContain('rpc ChangeCustomerStatus')
    expect(proto).not.toContain('rpc SearchSelectableCustomers')
    expect(proto).not.toContain('rpc SearchCustomerAccounts')
    expect(proto).not.toContain('rpc ListCustomerContacts')
    expect(proto).not.toContain('rpc ListCustomerAddresses')
  })

  it('does not keep deprecated customer-master Prisma models in the active CRM schema', () => {
    const schema = readFileSync(
      join(repoRoot, 'src/services/business/crm-service/prisma/schema.prisma'),
      'utf8'
    )

    expect(schema).not.toContain('model CustomerAccount')
    expect(schema).not.toContain('model CustomerPartyBinding')
    expect(schema).not.toContain('model CustomerContact')
    expect(schema).not.toContain('model CustomerAddress')
  })
})
