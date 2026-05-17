import { PolicyTemplateDefinition } from './types'

const BUILT_IN_TEMPLATES: PolicyTemplateDefinition[] = [
  {
    code: 'resource-field-in-set',
    category: 'RESOURCE',
    effectSupport: 'ALLOW_AND_DENY',
    supportedSubjectSelectors: ['ACCOUNT', 'ROLE', 'TENANT_WIDE'],
    resourceFieldParamsSchema: {
      field: 'string',
      allowedValues: 'string[]'
    },
    queryScopeCapable: true,
    checkResourceCapable: true,
    description: 'Checks whether a resource fact field is included in configured values.',
    version: '1'
  },
  {
    code: 'resource-field-equals',
    category: 'RESOURCE',
    effectSupport: 'ALLOW_AND_DENY',
    supportedSubjectSelectors: ['ACCOUNT', 'ROLE', 'TENANT_WIDE'],
    resourceFieldParamsSchema: {
      field: 'string',
      value: 'string'
    },
    queryScopeCapable: true,
    checkResourceCapable: true,
    description: 'Checks whether a resource fact field equals a configured value.',
    version: '1'
  },
  {
    code: 'resource-field-matches-subject-field',
    category: 'RESOURCE',
    effectSupport: 'ALLOW_AND_DENY',
    supportedSubjectSelectors: ['ACCOUNT', 'ROLE', 'TENANT_WIDE'],
    resourceFieldParamsSchema: {
      resourceField: 'string',
      subjectField: 'string'
    },
    queryScopeCapable: true,
    checkResourceCapable: true,
    description: 'Checks whether a resource fact field matches a subject fact field.',
    version: '1'
  },
  {
    code: 'own-resource',
    category: 'RESOURCE',
    effectSupport: 'ALLOW_AND_DENY',
    supportedSubjectSelectors: ['ACCOUNT', 'ROLE', 'TENANT_WIDE'],
    resourceFieldParamsSchema: {
      ownerField: 'string?'
    },
    queryScopeCapable: true,
    checkResourceCapable: true,
    description: 'Checks whether the resource owner account is the current account.',
    version: '1'
  },
  {
    code: 'org-scope',
    category: 'RESOURCE',
    effectSupport: 'ALLOW_AND_DENY',
    supportedSubjectSelectors: ['ACCOUNT', 'ROLE', 'TENANT_WIDE'],
    resourceFieldParamsSchema: {
      orgField: 'string?'
    },
    queryScopeCapable: true,
    checkResourceCapable: true,
    description: 'Experimental template for checking visible organization scope.',
    version: '1',
    experimental: true
  },
  {
    code: 'working-hours',
    category: 'SECURITY',
    effectSupport: 'ALLOW_AND_DENY',
    supportedSubjectSelectors: ['ACCOUNT', 'ROLE', 'TENANT_WIDE'],
    environmentParamsSchema: {
      timezone: 'string?',
      windows: '{ days: number[], start: HH:mm, end: HH:mm }[]'
    },
    queryScopeCapable: false,
    checkResourceCapable: true,
    description: 'Checks whether request time falls inside configured working windows.',
    version: '1'
  },
  {
    code: 'ip-allowlist',
    category: 'SECURITY',
    effectSupport: 'ALLOW_AND_DENY',
    supportedSubjectSelectors: ['ACCOUNT', 'ROLE', 'TENANT_WIDE'],
    environmentParamsSchema: {
      cidrs: 'string[]'
    },
    queryScopeCapable: false,
    checkResourceCapable: true,
    description: 'Checks whether client IP is included in configured CIDR ranges.',
    version: '1'
  }
]

/** BuiltInPolicyTemplateRegistry exposes the platform-owned first-stage policy templates. */
export class BuiltInPolicyTemplateRegistry {
  private readonly templates = new Map(BUILT_IN_TEMPLATES.map((template) => [template.code, template]))

  /** list returns all platform-owned policy template definitions for runtime registration and tests. */
  list(): PolicyTemplateDefinition[] {
    return [...this.templates.values()]
  }

  /** get resolves a template definition by its stable template code. */
  get(code: string): PolicyTemplateDefinition | undefined {
    return this.templates.get(code)
  }
}
