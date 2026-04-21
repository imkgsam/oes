interface EntryRouteLike {
  children?: EntryRouteLike[];
  meta?: Record<string, unknown>;
  path: string;
}

// Resolves a managed navigation entry key to the concrete route path owned by this front-end.
export function resolveEntryPathFromRoutes(
  routes: EntryRouteLike[],
  entryKey?: string,
): string | undefined {
  if (!entryKey) {
    return undefined;
  }

  for (const route of routes) {
    const routeEntryKey = (route.meta as Record<string, unknown> | undefined)
      ?.entryKey;

    if (routeEntryKey === entryKey) {
      return route.path;
    }

    const childPath = route.children
      ? resolveEntryPathFromRoutes(route.children, entryKey)
      : undefined;

    if (childPath) {
      return childPath;
    }
  }

  return undefined;
}
