import { User } from 'src/app/theme/types/user';

export function getUserInitials(user: User | null | undefined): string {
  if (!user) {
    return '?';
  }

  const first = user.firstName?.trim();
  const last = user.lastName?.trim();

  if (first && last) {
    return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
  }

  if (first) {
    return first.slice(0, 2).toUpperCase();
  }

  if (last) {
    return last.slice(0, 2).toUpperCase();
  }

  const username = user.username?.trim();
  if (username) {
    return username.slice(0, 2).toUpperCase();
  }

  return '?';
}

export function buildUserPhotoDataUrl(photoData?: string | null, photoContentType?: string | null): string | null {
  if (!photoData || !photoContentType) {
    return null;
  }
  return `data:${photoContentType};base64,${photoData}`;
}
