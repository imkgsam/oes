import * as authorization from '@oes/common/authorization';
import { PERMISSION_CODE_DEFINITIONS, getPermissionCodeDefinition } from '@oes/common/authorization';
import { PERMISSION_CODE_SEED_ITEMS } from '../scripts/permission-catalog';
/** Verifies the retired inverse generator cannot become a second Permission semantic source. */
describe('Common-owned permission catalog', () => {
    it('flows from Common definitions into Permission runtime seed items', () => {
        expect(PERMISSION_CODE_SEED_ITEMS.map((item) => item.code).sort()).toEqual(Object.keys(PERMISSION_CODE_DEFINITIONS).sort());
        expect(getPermissionCodeDefinition('permission.list')).toBeDefined();
    });
    it('publishes one active definition for every non-deprecated exported Code', () => {
        const deprecatedCodes = new Set(authorization.DEPRECATED_PERMISSION_CODES);
        const exportedCodes = Object.entries(authorization)
            .filter(([name, value]) => name.endsWith('_PERMISSION_CODES') && typeof value === 'object' && value !== null)
            .flatMap(([, value]) => Object.values(value as Readonly<Record<string, string>>))
            .filter((code) => !deprecatedCodes.has(code));
        expect(new Set(exportedCodes)).toEqual(new Set(Object.keys(PERMISSION_CODE_DEFINITIONS)));
    });
    it('keeps every INTERNAL namespace Code out of HUMAN and MACHINE role assignment', () => {
        for (const definition of Object.values(PERMISSION_CODE_DEFINITIONS)) {
            if (!definition.code.includes('.internal.'))
                continue;
            expect(definition).toMatchObject({
                kind: 'INTERNAL',
                assignableTo: ['WORKLOAD_POLICY'],
                externalApiEligible: false
            });
        }
    });
});
