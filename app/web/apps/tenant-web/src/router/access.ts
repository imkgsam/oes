import type {
  ComponentRecordType,
  GenerateMenuAndRoutesOptions,
} from '@vben/types';

import { generateAccessible } from '@vben/access';
import { preferences } from '@vben/preferences';

import { message } from 'ant-design-vue';

import { getAllMenusApi } from '#/api';
import { BasicLayout, IFrameView } from '#/layouts';
import { $t } from '#/locales';
import { useAuthContextStore } from '#/store';

const forbiddenComponent = () => import('#/views/_core/fallback/forbidden.vue');

interface EntryKeyRouteLike {
  children?: EntryKeyRouteLike[];
  meta?: unknown;
  [key: string]: unknown;
}

function getRouteEntryKey(route: { meta?: unknown }) {
  const meta = route.meta as Record<string, unknown> | undefined;
  return typeof meta?.entryKey === 'string' ? meta.entryKey : undefined;
}

function filterEntryRouteLikes(
  routes: EntryKeyRouteLike[],
  visibleEntries: string[],
): EntryKeyRouteLike[] {
  if (visibleEntries.length === 0) {
    return routes;
  }

  return routes
    .map((route) => {
      const entryKey = getRouteEntryKey(route);
      const hadChildren = Boolean(route.children && route.children.length > 0);
      const children = route.children
        ? filterEntryRouteLikes(route.children, visibleEntries)
        : undefined;
      const isVisibleRoute = !entryKey || visibleEntries.includes(entryKey);
      const isEmptyContainer = !entryKey && hadChildren && (!children || children.length === 0);

      if ((!isVisibleRoute && (!children || children.length === 0)) || isEmptyContainer) {
        return null;
      }

      return {
        ...route,
        children,
      };
    })
    .filter(Boolean) as EntryKeyRouteLike[];
}

// Filters local front-end routes by the BFF navigation entries visible to the current session.
function filterRoutesByVisibleEntries<T>(
  routes: T[],
  visibleEntries: string[],
): T[] {
  return filterEntryRouteLikes(routes as EntryKeyRouteLike[], visibleEntries) as T[];
}

// Generates the accessible route tree from local route definitions and BFF navigation visibility.
async function generateAccess(options: GenerateMenuAndRoutesOptions) {
  const pageMap: ComponentRecordType = import.meta.glob('../views/**/*.vue');
  const authContextStore = useAuthContextStore();

  const layoutMap: ComponentRecordType = {
    BasicLayout,
    IFrameView,
  };

  return await generateAccessible(preferences.app.accessMode, {
    ...options,
    routes: filterRoutesByVisibleEntries(options.routes, authContextStore.visibleEntries),
    fetchMenuListAsync: async () => {
      message.loading({
        duration: 1500,
        content: `${$t('common.loadingMenu')}...`,
      });
      return filterRoutesByVisibleEntries(
        await getAllMenusApi(),
        authContextStore.visibleEntries,
      );
    },
    // 可以指定没有权限跳转403页面
    forbiddenComponent,
    // 如果 route.meta.menuVisibleWithForbidden = true
    layoutMap,
    pageMap,
  });
}

export { filterRoutesByVisibleEntries, generateAccess };
