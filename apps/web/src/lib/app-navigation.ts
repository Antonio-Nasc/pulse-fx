const indicatorPathPattern =
  /^\/indicators\/([a-z0-9]+(?:-[a-z0-9]+)*)\/?$/;

export function readIndicatorSlug(
  pathname = window.location.pathname,
): string | null {
  const match = indicatorPathPattern.exec(pathname);

  return match?.[1] ?? null;
}

export function createIndicatorPath(slug: string): string {
  return `/indicators/${encodeURIComponent(slug)}`;
}