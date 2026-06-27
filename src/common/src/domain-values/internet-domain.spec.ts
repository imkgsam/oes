import { InternetDomain } from './internet-domain'

describe('InternetDomain', () => {
  it('normalizes a www hostname to its canonical host', () => {
    const domain = InternetDomain.parse('www.vintagetub.com')

    expect(domain.isValid).toBe(true)
    expect(domain.rawHost).toBe('www.vintagetub.com')
    expect(domain.canonicalHost).toBe('vintagetub.com')
    expect(domain.toString()).toBe('vintagetub.com')
  })

  it('extracts and normalizes the host from a URL', () => {
    const domain = InternetDomain.parse('https://www.vintagetub.com/products?id=1')

    expect(domain.isValid).toBe(true)
    expect(domain.rawHost).toBe('www.vintagetub.com')
    expect(domain.canonicalHost).toBe('vintagetub.com')
  })

  it('lowercases a hostname and removes a trailing dot', () => {
    const domain = InternetDomain.parse('VINTAGETUB.COM.')

    expect(domain.isValid).toBe(true)
    expect(domain.rawHost).toBe('vintagetub.com')
    expect(domain.canonicalHost).toBe('vintagetub.com')
  })

  it('preserves non-display subdomains', () => {
    const domain = InternetDomain.parse('shop.vintagetub.com')

    expect(domain.isValid).toBe(true)
    expect(domain.rawHost).toBe('shop.vintagetub.com')
    expect(domain.canonicalHost).toBe('shop.vintagetub.com')
  })

  it('marks blank input as invalid without throwing', () => {
    const domain = InternetDomain.parse('   ')

    expect(domain.isValid).toBe(false)
    expect(domain.rawHost).toBe('')
    expect(domain.canonicalHost).toBe('')
    expect(domain.toString()).toBe('')
  })

  it('marks malformed host input as invalid without throwing', () => {
    const domain = InternetDomain.parse('not a host')

    expect(domain.isValid).toBe(false)
    expect(domain.rawHost).toBe('')
    expect(domain.canonicalHost).toBe('')
  })
})
