import { NavigationItem } from '../types/navigation';

function stripQueryAndFragment(url: string): string {
  return url.split('#')[0].split('?')[0];
}

export function normalizeNavigationUrl(url: string | null | undefined): string {
  const sanitizedUrl = stripQueryAndFragment(url ?? '').replace(/\/+$/, '');
  return sanitizedUrl || '/';
}

export function isNavigationUrlActive(currentUrl: string, menuUrl?: string, exactMatch = false): boolean {
  if (!menuUrl) {
    return false;
  }

  const normalizedCurrentUrl = normalizeNavigationUrl(currentUrl);
  const normalizedMenuUrl = normalizeNavigationUrl(menuUrl);

  if (exactMatch || normalizedMenuUrl === '/') {
    return normalizedCurrentUrl === normalizedMenuUrl;
  }

  return (
    normalizedCurrentUrl === normalizedMenuUrl ||
    normalizedCurrentUrl.startsWith(`${normalizedMenuUrl}/`) ||
    normalizedCurrentUrl.startsWith(`${normalizedMenuUrl};`)
  );
}

export function isNavigationItemActive(item: NavigationItem | undefined, currentUrl: string): boolean {
  if (!item) {
    return false;
  }

  if (isNavigationUrlActive(currentUrl, item.url, item.exactMatch ?? false)) {
    return true;
  }

  return (item.children ?? []).some((child) => isNavigationItemActive(child, currentUrl));
}
