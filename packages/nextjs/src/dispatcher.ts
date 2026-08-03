import type { RouteDefinition } from "@lensjs/core";

type CompiledRoute = {
  route: RouteDefinition;
  regex: RegExp;
  keys: string[];
};

const cache = new WeakMap<RouteDefinition[], CompiledRoute[]>();

/**
 * Compile a core route path (which uses `:param` segments, e.g.
 * `/lens/api/requests/:id`) into a regex plus the ordered param names.
 */
function compilePath(path: string): { regex: RegExp; keys: string[] } {
  const keys: string[] = [];
  const pattern = path
    .split("/")
    .map((segment) => {
      if (segment.startsWith(":")) {
        keys.push(segment.slice(1));
        return "([^/]+)";
      }
      return segment.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    })
    .join("/");

  return { regex: new RegExp(`^${pattern}/?$`), keys };
}

function compileRoutes(routes: RouteDefinition[]): CompiledRoute[] {
  let compiled = cache.get(routes);
  if (!compiled) {
    compiled = routes.map((route) => {
      const { regex, keys } = compilePath(route.path);
      return { route, regex, keys };
    });
    cache.set(routes, compiled);
  }
  return compiled;
}

/**
 * Match an incoming `method` + `pathname` against the core route table,
 * returning the matched route and extracted params, or `null`.
 */
export function matchRoute(
  routes: RouteDefinition[],
  method: string,
  pathname: string,
): { route: RouteDefinition; params: Record<string, string> } | null {
  const upper = method.toUpperCase();

  for (const compiled of compileRoutes(routes)) {
    if (compiled.route.method !== upper) continue;

    const match = compiled.regex.exec(pathname);
    if (!match) continue;

    const params: Record<string, string> = {};
    compiled.keys.forEach((key, i) => {
      params[key] = decodeURIComponent(match[i + 1] ?? "");
    });

    return { route: compiled.route, params };
  }

  return null;
}

/** Flatten a URL's query string into a plain record (last value wins). */
export function parseQuery(url: URL): Record<string, string> {
  return Object.fromEntries(url.searchParams.entries());
}
