import { describe, it, test } from 'node:test'
import { expect } from '../../../../../common/src/testing/static-check-assertions.mjs'
import { fileURLToPath } from 'node:url'
const __dirname = fileURLToPath(new URL('.', import.meta.url))
import { readFileSync } from 'node:fs'
describe('MachineWorkloadBinding schema', () => { it('requires restrictive local principal ownership', () => expect(readFileSync(new URL('../../prisma/schema.prisma', import.meta.url), 'utf8')).toContain('onDelete: Restrict')) })
