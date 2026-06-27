import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { ModuleKind, ScriptTarget, transpileModule } from 'typescript'
import { describe, expect, it, vi } from 'vitest'

const currentDir = dirname(fileURLToPath(import.meta.url))

// Verifies the page observer remains compatible with Chrome classic content-script execution.
describe('browser activity page observer package boundary', () => {
  it('is self-contained and does not require ES module parsing', () => {
    const source = readFileSync(resolve(currentDir, 'browser-activity-page-observer.ts'), 'utf8')

    expect(source).not.toMatch(/^\s*import\s/m)
    expect(source).not.toMatch(/^\s*export\s/m)
  })

  it('stops page observers when Chrome invalidates the old extension context', () => {
    const source = transpileModule(readFileSync(resolve(currentDir, 'browser-activity-page-observer.ts'), 'utf8'), {
      compilerOptions: {
        module: ModuleKind.None,
        target: ScriptTarget.ES2022
      }
    }).outputText
    const listeners = new Map<string, EventListener>()
    const sendMessage = vi.fn(() => {
      throw new Error('Extension context invalidated.')
    })
    const pageGlobal = {
      addEventListener: vi.fn((type: string, listener: EventListener) => {
        listeners.set(type, listener)
      }),
      chrome: {
        runtime: {
          sendMessage
        }
      },
      removeEventListener: vi.fn((type: string, listener: EventListener) => {
        if (listeners.get(type) === listener) {
          listeners.delete(type)
        }
      })
    }

    new Function('globalThis', source)(pageGlobal)

    expect(() => listeners.get('click')?.(new Event('click'))).not.toThrow()
    expect(pageGlobal.removeEventListener).toHaveBeenCalledWith('click', expect.any(Function))
    expect(pageGlobal.removeEventListener).toHaveBeenCalledWith('keydown', expect.any(Function))
    expect(pageGlobal.removeEventListener).toHaveBeenCalledWith('mousemove', expect.any(Function))
    expect(pageGlobal.removeEventListener).toHaveBeenCalledWith('scroll', expect.any(Function))
    expect(listeners.size).toBe(0)
    expect(sendMessage).toHaveBeenCalledTimes(1)
  })
})
