import { PERMISSION_INTERNAL_PERMISSION_CODES } from '@oes/common/authorization'
import {
  PERMISSION_CODE_SEED_ITEMS,
  PERMISSION_INTERNAL_PERMISSION_CODES as RUNTIME_PERMISSION_INTERNAL_CODES
} from '../../src/scripts/permission-catalog'

describe('Permission decision INTERNAL Code foundation', () => {
  it('consumes the two Common-owned Codes as non-external INTERNAL runtime catalog entries', () => {
    expect(RUNTIME_PERMISSION_INTERNAL_CODES).toEqual(PERMISSION_INTERNAL_PERMISSION_CODES)

    for (const code of Object.values(PERMISSION_INTERNAL_PERMISSION_CODES)) {
      expect(PERMISSION_CODE_SEED_ITEMS).toContainEqual(
        expect.objectContaining({
          code,
          kind: 'INTERNAL',
          externalApiEligible: false
        })
      )
    }
  })
})
