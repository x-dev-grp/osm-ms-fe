import { NavigationItem } from '../types/navigation';

function stripQueryAndFragment(url: string): string {
  return url.split('#')[0].split('?')[0];
}

export function normalizeNavigationUrl(url: string | null | undefined): string {
  const sanitizedUrl = stripQueryAndFragment(url ?? '').replace(/\/+$/, '');
  return sanitizedUrl || '/';
}

function urlMatchesCurrentRoute(normalizedCurrentUrl: string, normalizedMenuUrl: string): boolean {
  if (normalizedMenuUrl === '/') {
    return normalizedCurrentUrl === '/';
  }

  return (
    normalizedCurrentUrl === normalizedMenuUrl ||
    normalizedCurrentUrl.startsWith(`${normalizedMenuUrl}/`) ||
    normalizedCurrentUrl.startsWith(`${normalizedMenuUrl};`)
  );
}

export function collectNavigationUrls(items: NavigationItem[] | undefined): string[] {
  const urls: string[] = [];

  const walk = (nodes: NavigationItem[] | undefined): void => {
    for (const node of nodes ?? []) {
      if (node.url) {
        urls.push(node.url);
      }
      walk(node.children);
    }
  };

  walk(items);
  return urls;
}

/** Pick the single most specific menu URL that matches the current route. */
export function findBestMatchingNavigationUrl(currentUrl: string, menuUrls: string[]): string | null {
  const normalizedCurrentUrl = normalizeNavigationUrl(currentUrl);
  let bestMatch: string | null = null;
  let bestLength = -1;

  for (const menuUrl of menuUrls) {
    if (!menuUrl) {
      continue;
    }

    const normalizedMenuUrl = normalizeNavigationUrl(menuUrl);
    if (!urlMatchesCurrentRoute(normalizedCurrentUrl, normalizedMenuUrl)) {
      continue;
    }

    if (normalizedMenuUrl.length > bestLength) {
      bestMatch = normalizedMenuUrl;
      bestLength = normalizedMenuUrl.length;
    }
  }

  return bestMatch;
}

export function isNavigationUrlActive(
  currentUrl: string,
  menuUrl?: string,
  exactMatch = false,
  activeMenuUrl?: string | null
): boolean {
  if (!menuUrl) {
    return false;
  }

  const normalizedCurrentUrl = normalizeNavigationUrl(currentUrl);
  const normalizedMenuUrl = normalizeNavigationUrl(menuUrl);

  if (exactMatch || normalizedMenuUrl === '/') {
    return normalizedCurrentUrl === normalizedMenuUrl;
  }

  if (activeMenuUrl !== undefined) {
    return activeMenuUrl === normalizedMenuUrl;
  }

  return urlMatchesCurrentRoute(normalizedCurrentUrl, normalizedMenuUrl);
}

export function isNavigationItemActive(
  item: NavigationItem | undefined,
  currentUrl: string,
  activeMenuUrl?: string | null
): boolean {
  if (!item) {
    return false;
  }

  if (item.url) {
    return isNavigationUrlActive(currentUrl, item.url, item.exactMatch ?? false, activeMenuUrl);
  }

  return (item.children ?? []).some((child) => isNavigationItemActive(child, currentUrl, activeMenuUrl));
}
