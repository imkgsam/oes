import { describe, expect, it, vi } from 'vitest';

vi.mock('#/locales', () => ({
  $t: (value: string) => value,
}));

// Ensures account self-service routes stay addressable while remaining outside the sidebar menu.
describe('workbench account routes', () => {
  it('hides personal center and account security from the sidebar menu', async () => {
    const { workbenchRoutes } = await import('./routes');
    const accountRoutes = workbenchRoutes[0]?.children ?? [];

    expect(accountRoutes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'PersonalCenter',
          path: '/account/profile',
          meta: expect.objectContaining({
            hideInMenu: true,
            title: '个人中心',
          }),
        }),
        expect.objectContaining({
          name: 'SelfSecurityCenter',
          path: '/account/security',
          meta: expect.objectContaining({
            hideInMenu: true,
            title: '账户安全',
          }),
        }),
      ]),
    );
  });
});
