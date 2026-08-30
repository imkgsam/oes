import type {
  ComponentRecordType,
  GenerateMenuAndRoutesOptions,
  RouteRecordStringComponent,
} from '@vben/types';

import { generateAccessible } from '@vben/access';
import { preferences } from '@vben/preferences';

import { message } from 'ant-design-vue';

import { listNavigationEntriesApi } from '#/api';
import { BasicLayout, IFrameView } from '#/layouts';
import { $t } from '#/locales';
import { useAuthContextStore } from '#/store';

const forbiddenComponent = () => import('#/views/_core/fallback/forbidden.vue');

interface EntryKeyRouteLike {
  children?: EntryKeyRouteLike[];
  component?: unknown;
  meta?: unknown;
  [key: string]: unknown;
}

const NAVIGATION_ENTRY_PAGE_SIZE = 100;

function getRouteEntryKey(route: { meta?: unknown }) {
  const meta = route.meta as Record<string, unknown> | undefined;
  return typeof meta?.entryKey === 'string' ? meta.entryKey : undefined;
}

function filterEntryRouteLikes(
  routes: EntryKeyRouteLike[],
  visibleEntries: string[],
): EntryKeyRouteLike[] {
  return routes
    .map((route) => {
      const entryKey = getRouteEntryKey(route);
      const hadChildren = Boolean(route.children && route.children.length > 0);
      const children = route.children
        ? filterEntryRouteLikes(route.children, visibleEntries)
        : undefined;
      const isVisibleRoute = !entryKey || visibleEntries.includes(entryKey);
      const isEmptyContainer =
        !entryKey && hadChildren && (!children || children.length === 0);

      if (
        (!isVisibleRoute && (!children || children.length === 0)) ||
        isEmptyContainer
      ) {
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
  return filterEntryRouteLikes(
    routes as EntryKeyRouteLike[],
    visibleEntries,
  ) as T[];
}

// Converts one local Vue route into the string-component shape consumed by backend/mixed route generation.
function toMenuRouteRecordItem(
  route: EntryKeyRouteLike,
): RouteRecordStringComponent {
  const { children, component, ...rest } = route;
  const menuRoute = { ...rest } as unknown as RouteRecordStringComponent;

  if (typeof component === 'string') {
    menuRoute.component = component;
  }

  if (children && children.length > 0) {
    menuRoute.children = children.map(toMenuRouteRecordItem);
  }

  return menuRoute;
}

// Maps the local Web route tree into menu records without moving route or hierarchy truth to the back end.
function toMenuRouteRecords(
  routes: EntryKeyRouteLike[],
): RouteRecordStringComponent[] {
  return routes.map(toMenuRouteRecordItem);
}

// Reads every enabled WEB registry page so pagination cannot silently remove a managed route.
async function listAllWebNavigationEntryKeys() {
  const entryKeys = new Set<string>();
  let page = 1;
  let received = 0;
  let expectedTotal: number | undefined;

  while (expectedTotal === undefined || received < expectedTotal) {
    const result = await listNavigationEntriesApi({
      enabled: true,
      page,
      pageSize: NAVIGATION_ENTRY_PAGE_SIZE,
      terminal: 'WEB',
    });

    if (
      !Array.isArray(result?.entries) ||
      !Number.isInteger(result?.total) ||
      result.total < 0
    ) {
      throw new Error('Invalid navigation entry registry response');
    }

    if (expectedTotal === undefined) {
      expectedTotal = result.total;
    } else if (result.total !== expectedTotal) {
      throw new Error('Navigation entry registry changed during pagination');
    }

    for (const entry of result.entries) {
      const entryKey = `${entry?.entryKey ?? ''}`.trim();
      if (entryKey) {
        entryKeys.add(entryKey);
      }
    }

    received += result.entries.length;
    if (received < expectedTotal && result.entries.length === 0) {
      throw new Error(
        'Navigation entry registry pagination ended before total',
      );
    }
    page += 1;
  }

  return entryKeys;
}

// Intersects session visibility with the canonical registry for backend/mixed navigation modes.
async function resolveAccessEntryKeys(visibleEntries: string[]) {
  if (preferences.app.accessMode === 'frontend') {
    return visibleEntries;
  }

  message.loading({
    duration: 1500,
    content: `${$t('common.loadingMenu')}...`,
  });
  const registryEntryKeys = await listAllWebNavigationEntryKeys();
  return visibleEntries.filter((entryKey) => registryEntryKeys.has(entryKey));
}

// Generates the accessible route tree from local route definitions and BFF navigation visibility.
async function generateAccess(options: GenerateMenuAndRoutesOptions) {
  const pageMap: ComponentRecordType = import.meta.glob('../views/**/*.vue');
  const authContextStore = useAuthContextStore();
  const accessEntryKeys = await resolveAccessEntryKeys(
    authContextStore.visibleEntries,
  );
  const filteredLocalRoutes = filterRoutesByVisibleEntries(
    options.routes,
    accessEntryKeys,
  );

  const layoutMap: ComponentRecordType = {
    BasicLayout,
    IFrameView,
  };

  return await generateAccessible(preferences.app.accessMode, {
    ...options,
    routes: filteredLocalRoutes,
    fetchMenuListAsync: async () =>
      toMenuRouteRecords(filteredLocalRoutes as unknown as EntryKeyRouteLike[]),
    // 可以指定没有权限跳转403页面
    forbiddenComponent,
    // 如果 route.meta.menuVisibleWithForbidden = true
    layoutMap,
    pageMap,
  });
}

export { filterRoutesByVisibleEntries, generateAccess };
