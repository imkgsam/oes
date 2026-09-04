import {
  BuiltInPolicyTemplateRegistry,
  PolicyTemplateParamsValidator
} from '../application/authorization/resource-policy'

describe('PolicyTemplateParamsValidator', () => {
  const registry = new BuiltInPolicyTemplateRegistry()
  const validator = new PolicyTemplateParamsValidator()

  it('resource-field-in-set / 应要求 field 与非空 allowedValues', () => {
    const template = registry.get('resource-field-in-set')!

    expect(() =>
      validator.assertValid(template, {
        params: {
          field: 'categoryId',
          allowedValues: ['raw-material']
        }
      })
    ).not.toThrow()

    expect(() =>
      validator.assertValid(template, {
        params: {
          field: 'categoryId',
          allowedValues: []
        }
      })
    ).toThrow('POLICY_TEMPLATE_PARAMS_INVALID')
  })

  it('template params / 未声明字段 / 应拒绝', () => {
    const template = registry.get('resource-field-equals')!

    expect(() =>
      validator.assertValid(template, {
        params: {
          field: 'categoryId',
          value: 'raw-material',
          conditionAstJson: '{"free":"form"}'
        }
      })
    ).toThrow('POLICY_TEMPLATE_PARAMS_INVALID')
  })

  it('own-resource / optional ownerField / 允许空 params', () => {
    const template = registry.get('own-resource')!

    expect(() =>
      validator.assertValid(template, {
        params: {}
      })
    ).not.toThrow()
  })

  it('working-hours / 应要求非空 windows', () => {
    const template = registry.get('working-hours')!

    expect(() =>
      validator.assertValid(template, {
        params: {
          timezone: 'Asia/Shanghai',
          windows: [
            {
              days: [1, 2, 3, 4, 5],
              start: '09:00',
              end: '18:00'
            }
          ]
        }
      })
    ).not.toThrow()

    expect(() =>
      validator.assertValid(template, {
        params: {
          timezone: 'Asia/Shanghai'
        }
      })
    ).toThrow('POLICY_TEMPLATE_PARAMS_INVALID')
  })
})
