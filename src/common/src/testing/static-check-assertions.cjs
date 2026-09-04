const assert = require('node:assert/strict')

function expect(received) {
  const build = (negated) => {
    const verify = (condition, message) => {
      if (negated ? condition : !condition) throw new assert.AssertionError({ message })
    }
    return {
      toBe(expected) { negated ? assert.notStrictEqual(received, expected) : assert.strictEqual(received, expected) },
      toEqual(expected) { negated ? assert.notDeepStrictEqual(received, expected) : assert.deepStrictEqual(received, expected) },
      toContain(expected) { verify(received != null && typeof received.includes === 'function' && received.includes(expected), `Containment assertion failed for ${JSON.stringify(expected)}`) },
      toMatch(expected) { const pattern = expected instanceof RegExp ? expected : new RegExp(String(expected)); verify(pattern.test(String(received)), `Pattern assertion failed for ${String(pattern)}`) },
      toHaveLength(expected) { verify(received != null && received.length === expected, `Expected length ${expected}, received ${received?.length}`) },
      toHaveProperty(property) { let value = received; const present = value != null && property.split('.').every((part) => (value = Object(value)[part]) !== undefined); verify(present, `Property assertion failed for ${property}`) },
      toBeDefined() { verify(received !== undefined, 'Defined assertion failed') },
      toBeLessThanOrEqual(expected) { verify(received <= expected, `Upper-bound assertion failed for ${expected}`) }
    }
  }
  const positive = build(false)
  Object.defineProperty(positive, 'not', { get: () => build(true) })
  return positive
}
module.exports = { expect }
