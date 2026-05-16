import { createRouter, createWebHashHistory } from 'vue-router';
import LoginView from '@/views/login-view.vue';
import VersionBlockedView from '@/views/version-blocked-view.vue';
import WorkbenchView from '@/views/workbench-view.vue';
import { sendPdaHeartbeat } from '@/services/pda-heartbeat';
import { useSessionStore } from '@/stores/session.store';

/** Defines the Phase 1 PDA routes that can be loaded from packaged WebView assets. */
export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', redirect: '/login' },
    { path: '/login', component: LoginView },
    { path: '/workbench', component: WorkbenchView },
    { path: '/version-blocked', component: VersionBlockedView },
    { path: '/:pathMatch(.*)*', redirect: '/login' },
  ],
});

router.beforeEach(async (to) => resolvePdaSessionRoute(to.path));

/** Restores persisted PDA sessions before allowing the operator to stay on the login screen. */
export async function resolvePdaSessionRoute(path: string): Promise<string | true> {
  const sessionStore = useSessionStore();

  if ((path === '/workbench' || path === '/login') && !sessionStore.isAuthenticated) {
    const restored = await sessionStore.restoreSession();
    if (!restored) {
      return path === '/workbench' ? '/login' : true;
    }
  }

  if (path === '/login' && sessionStore.isAuthenticated) {
    void sendPdaHeartbeat('SESSION_RESTORED');
    return '/workbench';
  }

  return true;
}
