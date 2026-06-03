import { createRouter, createWebHashHistory } from 'vue-router';
import DeviceRestrictedView from '@/views/device-restricted-view.vue';
import EnrollmentView from '@/views/enrollment-view.vue';
import IdentityConflictView from '@/views/identity-conflict-view.vue';
import LoginView from '@/views/login-view.vue';
import MoldWorkbenchView from '@/views/mold-workbench-view.vue';
import VersionBlockedView from '@/views/version-blocked-view.vue';
import WorkbenchView from '@/views/workbench-view.vue';
import { sendPdaHeartbeat } from '@/services/pda-heartbeat';
import { useSessionStore } from '@/stores/session.store';

/** Defines the Phase 1 PDA routes that can be loaded from packaged WebView assets. */
export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', redirect: '/enrollment' },
    { path: '/enrollment', component: EnrollmentView },
    { path: '/login', component: LoginView },
    { path: '/workbench', component: WorkbenchView },
    { path: '/molds', component: MoldWorkbenchView },
    { path: '/device-restricted', component: DeviceRestrictedView },
    { path: '/identity-conflict', component: IdentityConflictView },
    { path: '/version-blocked', component: VersionBlockedView },
    { path: '/:pathMatch(.*)*', redirect: '/enrollment' },
  ],
});

router.beforeEach(async (to) => resolvePdaSessionRoute(to.path));

/** Restores persisted PDA sessions before allowing the operator to stay on the login screen. */
export async function resolvePdaSessionRoute(path: string): Promise<string | true> {
  const sessionStore = useSessionStore();
  const binding = sessionStore.loadTerminalDeviceBinding();
  const decisionRedirect = resolveDecisionRedirect(path);
  if (decisionRedirect) {
    return decisionRedirect;
  }

  if (!binding?.terminalDeviceId && path !== '/enrollment') {
    return '/enrollment';
  }

  if (binding?.terminalDeviceId && path === '/enrollment') {
    return '/login';
  }

  if ((path === '/workbench' || path === '/molds' || path === '/login') && !sessionStore.isAuthenticated) {
    const restored = await sessionStore.restoreSession();
    if (!restored) {
      return path === '/workbench' || path === '/molds' ? '/login' : true;
    }
  }

  if (path === '/login' && sessionStore.isAuthenticated) {
    void sendPdaHeartbeat('SESSION_RESTORED');
    return '/workbench';
  }

  return true;
}

function resolveDecisionRedirect(path: string): string | undefined {
  const sessionStore = useSessionStore();
  switch (sessionStore.decisionCode) {
    case 'APP_VERSION_UNSUPPORTED':
      return path === '/version-blocked' ? undefined : '/version-blocked';
    case 'DEVICE_IDENTITY_CONFLICT':
      return path === '/identity-conflict' ? undefined : '/identity-conflict';
    case 'DEVICE_DISABLED':
    case 'DEVICE_LOST':
    case 'DEVICE_MAINTENANCE':
    case 'DEVICE_DECOMMISSIONED':
    case 'DEVICE_PENDING_APPROVAL':
      return path === '/device-restricted' ? undefined : '/device-restricted';
    default:
      return undefined;
  }
}
