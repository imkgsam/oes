import assert from 'node:assert/strict'

/** Provides the small assertion vocabulary used by repository static rules without a test framework runtime. */
export function expect(received) {
  const build = (negated) => {
    const verify = (condition, message) => {
      if (negated ? condition : !condition) throw new assert.AssertionError({ message })
    }
    return {
      toBe(expected) {
        if (negated) assert.notStrictEqual(received, expected)
        else assert.strictEqual(received, expected)
      },
      toEqual(expected) {
        if (negated) assert.notDeepStrictEqual(received, expected)
        else assert.deepStrictEqual(received, expected)
      },
      toContain(expected) {
        verify(received != null && typeof received.includes === 'function' && received.includes(expected), `Expected ${JSON.stringify(received)} ${negated ? 'not ' : ''}to contain ${JSON.stringify(expected)}`)
      },
      toMatch(expected) {
        const pattern = expected instanceof RegExp ? expected : new RegExp(String(expected))
        verify(pattern.test(String(received)), `Expected ${JSON.stringify(received)} ${negated ? 'not ' : ''}to match ${String(pattern)}`)
      },
      toHaveLength(expected) {
        verify(received != null && received.length === expected, `Expected length ${expected}, received ${received?.length}`)
      },
      toHaveProperty(property) {
        const present = received != null && property.split('.').every((part) => (received = Object(received)[part]) !== undefined)
        verify(present, `Expected value ${negated ? 'not ' : ''}to have property ${property}`)
      },
      toBeDefined() {
        verify(received !== undefined, `Expected value ${negated ? 'not ' : ''}to be defined`)
      },
      toBeLessThanOrEqual(expected) {
        verify(received <= expected, `Expected ${received} ${negated ? 'not ' : ''}to be <= ${expected}`)
      }
    }
  }
  const positive = build(false)
  Object.defineProperty(positive, 'not', { get: () => build(true) })
  return positive
}
