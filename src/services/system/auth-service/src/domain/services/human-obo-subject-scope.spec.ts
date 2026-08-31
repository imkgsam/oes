import { requireHumanOboSubjectScope } from './human-obo-subject-scope'

describe('requireHumanOboSubjectScope', () => {
  it.each([
    ['SYSTEM', undefined, { subjectScope: 'SYSTEM' }],
    ['TENANT', 'tenant-1', { subjectScope: 'TENANT', optionalTenantId: 'tenant-1' }]
  ] as const)('accepts the canonical %s pair', (scope, tenantId, expected) => {
    expect(requireHumanOboSubjectScope(scope, tenantId)).toEqual(expected)
  })

  it.each([
    ['SYSTEM', 'tenant-1'],
    ['SYSTEM', ''],
    ['SYSTEM', '*'],
    ['TENANT', undefined],
    ['TENANT', ''],
    ['TENANT', ' tenant-1'],
    ['TENANT', 'tenant-1 '],
    ['TENANT', '*'],
    ['UNKNOWN', undefined]
  ])('rejects the non-canonical %s / %s pair', (scope, tenantId) => {
    expect(() => requireHumanOboSubjectScope(scope, tenantId)).toThrow('inconsistent')
  })
})
