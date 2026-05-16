import { resolveCorsOrigin } from './cors-origin.util'

describe('resolveCorsOrigin', () => {
  it('reflects request origins when wildcard CORS is configured', () => {
    expect(resolveCorsOrigin(['*'])).toBe(true)
  })

  it('keeps explicit origin allowlists unchanged', () => {
    expect(resolveCorsOrigin(['https://oes-pda.local'])).toEqual(['https://oes-pda.local'])
  })
})
