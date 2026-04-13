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

// Filters local front-end routes by the BFF navigation entries visible to the current session.
function filterRoutesByVisibleEntries(
  routes: GenerateMenuAndRoutesOptions['routes'],
  visibleEntries: string[],
): GenerateMenuAndRoutesOptions['routes'] {
  if (visibleEntries.length === 0) {
    return routes;
  }

  return routes
    .map((route) => {
      const entryKey = route.meta?.entryKey as string | undefined;
      const children = route.children
        ? filterRoutesByVisibleEntries(route.children, visibleEntries)
        : undefined;
      const isVisibleRoute = !entryKey || visibleEntries.includes(entryKey);

      if (!isVisibleRoute && (!children || children.length === 0)) {
        return null;
      }

      return {
        ...route,
        children,
      };
    })
    .filter(Boolean) as GenerateMenuAndRoutesOptions['routes'];
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
    routes: filterRoutesByVisibleEntries(
      options.routes,
      authContextStore.visibleEntries,
    ),
    fetchMenuListAsync: async () => {
      message.loading({
        duration: 1500,
        content: `${$t('common.loadingMenu')}...`,
      });
      return await getAllMenusApi();
    },
    // 可以指定没有权限跳转403页面
    forbiddenComponent,
    // 如果 route.meta.menuVisibleWithForbidden = true
    layoutMap,
    pageMap,
  });
}

export { generateAccess };
