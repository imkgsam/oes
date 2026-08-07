import { readFileSync } from 'node:fs'
describe('MachineWorkloadBinding schema', () => { it('requires restrictive local principal ownership', () => expect(readFileSync('prisma/schema.prisma','utf8')).toContain('onDelete: Restrict')) })
